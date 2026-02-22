import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader?.replace("Bearer ", "") || ""
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { filePath } = await req.json();
    if (!filePath) {
      return new Response(JSON.stringify({ error: "filePath is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("cv-uploads")
      .download(filePath);
    if (downloadError) throw downloadError;

    // Extract text content from the file
    const text = await fileData.text();

    // Use AI to parse the CV text into structured data
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert CV parser. Extract structured information from CV/resume text. Return structured data using the provided tool. If information is not found, use empty strings or empty arrays. Be thorough in extracting all experiences and skills.`,
          },
          {
            role: "user",
            content: `Parse the following CV/resume text and extract all structured information:\n\n${text.substring(0, 15000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_cv",
              description: "Parse CV text into structured profile data",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string" },
                  phone: { type: "string" },
                  location: { type: "string" },
                  linkedin: { type: "string" },
                  portfolio: { type: "string" },
                  summary: { type: "string", description: "Professional summary or objective" },
                  experiences: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        company: { type: "string" },
                        period: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["title", "company"],
                    },
                  },
                  skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of skill names",
                  },
                },
                required: ["full_name", "experiences", "skills"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_cv" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI parse error:", response.status, errorText);
      throw new Error(`AI parsing failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured output");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // Update profile
    const profileUpdate: Record<string, string> = {};
    if (parsed.full_name) profileUpdate.full_name = parsed.full_name;
    if (parsed.phone) profileUpdate.phone = parsed.phone;
    if (parsed.location) profileUpdate.location = parsed.location;
    if (parsed.linkedin) profileUpdate.linkedin = parsed.linkedin;
    if (parsed.portfolio) profileUpdate.portfolio = parsed.portfolio;
    if (parsed.summary) profileUpdate.summary = parsed.summary;

    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from("profiles").update(profileUpdate).eq("user_id", user.id);
    }

    // Add experiences
    if (parsed.experiences?.length > 0) {
      // Clear existing experiences first
      await supabase.from("experiences").delete().eq("user_id", user.id);
      const exps = parsed.experiences.map((e: any, i: number) => ({
        user_id: user.id,
        title: e.title || "Untitled",
        company: e.company || "Unknown",
        period: e.period || "",
        description: e.description || "",
        sort_order: i,
      }));
      await supabase.from("experiences").insert(exps);
    }

    // Add skills
    if (parsed.skills?.length > 0) {
      await supabase.from("skills").delete().eq("user_id", user.id);
      const skillRows = parsed.skills.map((name: string) => ({
        user_id: user.id,
        name,
      }));
      await supabase.from("skills").insert(skillRows);
    }

    return new Response(JSON.stringify({ success: true, parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
