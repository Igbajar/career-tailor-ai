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

    const systemPrompt = `You are an expert career consultant, ATS optimization specialist, and recruitment strategist. You analyze job descriptions and generate perfectly tailored CVs and cover letters.

You must return structured output using the provided tool.

CRITICAL RULES FOR TAILORING:
1. **Use REAL data only**: You MUST use the candidate's REAL company names, job titles, periods, and education exactly as provided. NEVER invent or substitute companies, roles, degrees, or institutions.
2. **Filter by relevance**: ONLY include experiences, education, skills, certifications, publications, projects, and professional bodies that are RELEVANT to the target job. Remove anything that doesn't strengthen the application.
3. **Avoid over-qualification**: If the candidate has senior/executive experience but the role is mid-level, tone down language and focus on relevant transferable skills without making them appear overqualified. Don't list too many advanced credentials if the role doesn't require them.
4. **Avoid under-qualification**: Highlight and emphasize all matching qualifications. Rewrite experience descriptions to draw out relevant responsibilities and achievements that align with job requirements.
5. **ATS optimization**: 
   - Extract exact keywords and phrases from the job description
   - Weave these keywords naturally into the summary, experience descriptions, and skills
   - Use standard section headings (Experience, Education, Skills, Certifications)
   - Avoid graphics, tables, or unusual formatting descriptions
6. **Experience rewriting**: Rewrite each included experience description to emphasize duties and achievements that match the job requirements. Use action verbs and quantify results where possible.
7. **Skills curation**: Only include skills mentioned in or clearly relevant to the job description. Order them by relevance. Add skills the candidate likely has based on their experience that match job requirements.
8. **Summary**: Write a targeted professional summary (3-4 sentences) that positions the candidate as an ideal fit for this specific role.
9. **Cover letter**: Write a compelling, personalized cover letter under 400 words that connects the candidate's specific experience to the job requirements. Use professional but engaging tone.
10. **Scoring**: Calculate ATS match score based on keyword coverage, skills alignment, and experience relevance. Be honest with the score.`;

    const userPrompt = `Here is the candidate's COMPLETE profile data. You must ONLY use real entries from this data — never invent companies, roles, or qualifications:

${profileContext}
${expContext}
${eduContext}
${skillsContext}
${certContext}
${pubContext}
${projContext}
${profBodyContext}

Here is the TARGET job description:

${jobDescription}

INSTRUCTIONS:
1. Carefully analyze the job requirements, responsibilities, and qualifications.
2. SELECT ONLY the experiences, education, skills, certifications, publications, projects, and professional bodies from the candidate's profile that are RELEVANT to this specific job. OMIT irrelevant ones entirely.
3. REWRITE the descriptions of selected experiences to highlight duties and achievements that align with the job requirements. Use keywords from the job description naturally.
4. Ensure the CV is appropriately qualified — not overqualified or underqualified for the role level.
5. Order everything by relevance to this job, not chronologically.
6. Write a targeted professional summary and personalized cover letter.
7. Calculate an honest ATS match score.`;

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
