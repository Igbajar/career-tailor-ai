import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { jobDescription, profile, experiences, skills, education, certifications, publications, projects, professionalBodies } = await req.json();

    if (!jobDescription) {
      return new Response(JSON.stringify({ error: "Job description is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileContext = profile
      ? `
Candidate Profile:
- Name: ${profile.full_name || "Not provided"}
- Email: ${profile.email || "Not provided"}
- Phone: ${profile.phone || "Not provided"}
- Location: ${profile.location || "Not provided"}
- LinkedIn: ${profile.linkedin || "Not provided"}
- Portfolio: ${profile.portfolio || "Not provided"}
- Summary: ${profile.summary || "Not provided"}
`
      : "No profile data available.";

    const expContext =
      experiences && experiences.length > 0
        ? `
Work Experience:
${experiences.map((e: any) => `- ${e.title} at ${e.company} (${e.period || "N/A"}): ${e.description || "No description"}`).join("\n")}
`
        : "No work experience provided.";

    const skillsContext =
      skills && skills.length > 0
        ? `Skills: ${skills.map((s: any) => `${s.name}${s.category ? ` [${s.category}]` : ""}`).join(", ")}`
        : "No skills provided.";

    const eduContext =
      education && education.length > 0
        ? `
Education:
${education.map((e: any) => `- ${e.degree} at ${e.institution} (${e.period || "N/A"}): ${e.description || ""}`).join("\n")}
`
        : "No education provided.";

    const certContext =
      certifications && certifications.length > 0
        ? `
Certifications:
${certifications.map((c: any) => `- ${c.name} by ${c.issuer} (${c.date_obtained || "N/A"}): ${c.description || ""}`).join("\n")}
`
        : "No certifications provided.";

    const pubContext =
      publications && publications.length > 0
        ? `
Publications:
${publications.map((p: any) => `- ${p.title} in ${p.publisher} (${p.date_published || "N/A"}): ${p.description || ""} ${p.url ? `URL: ${p.url}` : ""}`).join("\n")}
`
        : "No publications provided.";

    const projContext =
      projects && projects.length > 0
        ? `
Projects:
${projects.map((p: any) => `- ${p.name}${p.role ? ` (${p.role})` : ""} (${p.period || "N/A"}): ${p.description || ""} ${p.url ? `URL: ${p.url}` : ""}`).join("\n")}
`
        : "No projects provided.";

    const profBodyContext =
      professionalBodies && professionalBodies.length > 0
        ? `
Professional Bodies:
${professionalBodies.map((b: any) => `- ${b.name}${b.role ? ` - ${b.role}` : ""} (Member since: ${b.member_since || "N/A"}): ${b.description || ""}`).join("\n")}
`
        : "No professional bodies provided.";

    const systemPrompt = `You are an expert career consultant and ATS optimization specialist. You analyze job descriptions and generate tailored CVs and cover letters.

You must return structured output using the provided tool.

CRITICAL RULES:
- You MUST use the candidate's REAL company names, job titles, and periods from their work experience. Do NOT invent or substitute companies/roles.
- Rewrite descriptions to emphasize relevance to the target job, but keep the factual details (company, title, period) exactly as provided.
- Include ALL sections: summary, experience, education, skills, certifications, publications, projects, professional bodies.
- Extract key requirements from the job description
- Match candidate experience and skills to requirements
- Reorder and rephrase experience bullets to emphasize relevance
- Use keywords from the job description naturally
- Calculate an ATS match score (0-100) based on keyword coverage
- Write a compelling, personalized cover letter under 400 words
- Use professional but engaging tone`;

    const userPrompt = `Here is the candidate's information:

${profileContext}
${expContext}
${eduContext}
${skillsContext}
${certContext}
${pubContext}
${projContext}
${profBodyContext}

Here is the job description to tailor the application for:

${jobDescription}

Generate a complete tailored CV (summary, experience, education, skills, certifications, publications, projects, professional bodies) and a personalized cover letter. Use the candidate's REAL company names, titles, and periods exactly as provided.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_application",
              description: "Generate a tailored CV and cover letter for a job application",
              parameters: {
                type: "object",
                properties: {
                  ats_score: {
                    type: "number",
                    description: "ATS match score from 0 to 100",
                  },
                  keywords_matched: {
                    type: "number",
                    description: "Number of keywords matched from job description",
                  },
                  keywords_total: {
                    type: "number",
                    description: "Total keywords identified in job description",
                  },
                  tailored_summary: {
                    type: "string",
                    description: "A tailored professional summary for the CV",
                  },
                  tailored_experiences: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        company: { type: "string" },
                        period: { type: "string" },
                        description: { type: "string", description: "Rewritten description optimized for this role" },
                      },
                      required: ["title", "company", "period", "description"],
                    },
                    description: "Reordered and rewritten experiences optimized for this job. MUST use real company names and titles from the candidate's profile.",
                  },
                  tailored_education: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        degree: { type: "string" },
                        institution: { type: "string" },
                        period: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["degree", "institution", "period", "description"],
                    },
                    description: "Education entries from the candidate's profile",
                  },
                  tailored_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Relevant skills reordered by importance for this role",
                  },
                  tailored_certifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        issuer: { type: "string" },
                        date_obtained: { type: "string" },
                      },
                      required: ["name", "issuer"],
                    },
                    description: "Relevant certifications from the candidate's profile",
                  },
                  tailored_publications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        publisher: { type: "string" },
                        date_published: { type: "string" },
                      },
                      required: ["title", "publisher"],
                    },
                    description: "Relevant publications from the candidate's profile",
                  },
                  tailored_projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        role: { type: "string" },
                        period: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "description"],
                    },
                    description: "Relevant projects from the candidate's profile",
                  },
                  tailored_professional_bodies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        role: { type: "string" },
                        member_since: { type: "string" },
                      },
                      required: ["name"],
                    },
                    description: "Professional body memberships from the candidate's profile",
                  },
                  cover_letter: {
                    type: "string",
                    description: "A personalized cover letter for this application",
                  },
                  company_name: {
                    type: "string",
                    description: "The company name extracted from the job description",
                  },
                  role_title: {
                    type: "string",
                    description: "The role title extracted from the job description",
                  },
                },
                required: [
                  "ats_score",
                  "keywords_matched",
                  "keywords_total",
                  "tailored_summary",
                  "tailored_experiences",
                  "tailored_education",
                  "tailored_skills",
                  "tailored_certifications",
                  "cover_letter",
                  "company_name",
                  "role_title",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_application" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured output");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-application error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
