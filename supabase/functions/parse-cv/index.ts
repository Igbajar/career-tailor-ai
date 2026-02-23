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

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("cv-uploads")
      .download(filePath);
    if (downloadError) throw downloadError;

    const text = await fileData.text();

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
            content: `You are an expert CV parser. Extract ALL structured information from CV/resume text. Return structured data using the provided tool. If information is not found, use empty strings or empty arrays. Be thorough in extracting everything.`,
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
                  education: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        degree: { type: "string" },
                        institution: { type: "string" },
                        period: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["degree", "institution"],
                    },
                  },
                  skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of skill names",
                  },
                  certifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        issuer: { type: "string" },
                        date_obtained: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "issuer"],
                    },
                  },
                  publications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        publisher: { type: "string" },
                        date_published: { type: "string" },
                        description: { type: "string" },
                        url: { type: "string" },
                      },
                      required: ["title", "publisher"],
                    },
                  },
                  projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        role: { type: "string" },
                        period: { type: "string" },
                        description: { type: "string" },
                        url: { type: "string" },
                      },
                      required: ["name"],
                    },
                  },
                  professional_bodies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        role: { type: "string" },
                        member_since: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name"],
                    },
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

    // Experiences
    if (parsed.experiences?.length > 0) {
      await supabase.from("experiences").delete().eq("user_id", user.id);
      const exps = parsed.experiences.map((e: any, i: number) => ({
        user_id: user.id, title: e.title || "Untitled", company: e.company || "Unknown",
        period: e.period || "", description: e.description || "", sort_order: i,
      }));
      await supabase.from("experiences").insert(exps);
    }

    // Education
    if (parsed.education?.length > 0) {
      await supabase.from("education").delete().eq("user_id", user.id);
      const edus = parsed.education.map((e: any, i: number) => ({
        user_id: user.id, degree: e.degree || "Untitled", institution: e.institution || "Unknown",
        period: e.period || "", description: e.description || "", sort_order: i,
      }));
      await supabase.from("education").insert(edus);
    }

    // Skills
    if (parsed.skills?.length > 0) {
      await supabase.from("skills").delete().eq("user_id", user.id);
      const skillRows = parsed.skills.map((name: string) => ({ user_id: user.id, name }));
      await supabase.from("skills").insert(skillRows);
    }

    // Certifications
    if (parsed.certifications?.length > 0) {
      await supabase.from("certifications").delete().eq("user_id", user.id);
      const certs = parsed.certifications.map((c: any, i: number) => ({
        user_id: user.id, name: c.name, issuer: c.issuer || "Unknown",
        date_obtained: c.date_obtained || "", description: c.description || "", sort_order: i,
      }));
      await supabase.from("certifications").insert(certs);
    }

    // Publications
    if (parsed.publications?.length > 0) {
      await supabase.from("publications").delete().eq("user_id", user.id);
      const pubs = parsed.publications.map((p: any, i: number) => ({
        user_id: user.id, title: p.title, publisher: p.publisher || "Unknown",
        date_published: p.date_published || "", description: p.description || "",
        url: p.url || "", sort_order: i,
      }));
      await supabase.from("publications").insert(pubs);
    }

    // Projects
    if (parsed.projects?.length > 0) {
      await supabase.from("projects").delete().eq("user_id", user.id);
      const projs = parsed.projects.map((p: any, i: number) => ({
        user_id: user.id, name: p.name, role: p.role || "",
        period: p.period || "", description: p.description || "",
        url: p.url || "", sort_order: i,
      }));
      await supabase.from("projects").insert(projs);
    }

    // Professional Bodies
    if (parsed.professional_bodies?.length > 0) {
      await supabase.from("professional_bodies").delete().eq("user_id", user.id);
      const bodies = parsed.professional_bodies.map((b: any, i: number) => ({
        user_id: user.id, name: b.name, role: b.role || "",
        member_since: b.member_since || "", description: b.description || "", sort_order: i,
      }));
      await supabase.from("professional_bodies").insert(bodies);
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
