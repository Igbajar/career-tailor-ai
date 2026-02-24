import { motion } from "framer-motion";
import { Briefcase, Upload, Sparkles, FileText, Send, Loader2, Download } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import {
  GeneratedApplication,
  exportCvPdf,
  exportCoverLetterPdf,
  exportCvDocx,
  exportCoverLetterDocx,
} from "@/lib/documentExport";

export default function JobInput() {
  const [jobText, setJobText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedApplication | null>(null);
  const { profile, experiences, education, skills, certifications, publications, projects, professionalBodies } = useProfile();

  const handleGenerate = async () => {
    if (!jobText.trim()) return;
    setIsGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-application", {
        body: {
          jobDescription: jobText,
          profile: profile || {},
          experiences: experiences.data || [],
          skills: skills.data || [],
          education: education.data || [],
          certifications: certifications.data || [],
          publications: publications.data || [],
          projects: projects.data || [],
          professionalBodies: professionalBodies.data || [],
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as GeneratedApplication);
      toast.success("Application generated successfully!");
    } catch (e: any) {
      console.error("Generation error:", e);
      toast.error(e.message || "Failed to generate application");
    } finally {
      setIsGenerating(false);
    }
  };

  const profileInfo = {
    full_name: profile?.full_name || undefined,
    email: profile?.email || undefined,
    phone: profile?.phone || undefined,
    location: profile?.location || undefined,
    linkedin: profile?.linkedin || undefined,
    portfolio: profile?.portfolio || undefined,
  };

  const handleSaveToTracker = async () => {
    if (!result) return;
    try {
      const { error } = await supabase.from("job_applications").insert({
        user_id: (await supabase.auth.getUser()).data.user!.id,
        company: result.company_name,
        role: result.role_title,
        status: "Applied",
        ats_score: result.ats_score,
        job_description: jobText,
        generated_data: result as any,
      });
      if (error) throw error;
      toast.success("Saved to Application Tracker!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
          New Application
        </h1>
        <p className="text-muted-foreground mt-1">
          Paste a job advert to generate a tailored CV and cover letter.
        </p>
      </div>

      {/* Input Section */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Job Description</h2>
            <p className="text-xs text-muted-foreground">Paste the full job posting</p>
          </div>
        </div>

        <textarea
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          rows={12}
          placeholder="Paste the complete job advert or description here...

Include:
• Job title and company
• Requirements and qualifications
• Responsibilities
• Preferred skills"
          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground/60"
        />

        <div className="flex items-center justify-end">
          <button
            onClick={handleGenerate}
            disabled={!jobText.trim() || isGenerating}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing & Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate CV & Cover Letter
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-accent animate-pulse" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            AI is crafting your application
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Analyzing job requirements, matching your experience, and optimizing keywords for ATS compatibility...
          </p>
          <div className="mt-6 max-w-xs mx-auto">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "90%" }}
                transition={{ duration: 12, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Generated Result */}
      {result && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Generated Documents
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tailored CV */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Tailored CV</h3>
                  <p className="text-xs text-muted-foreground">ATS-optimized for this role</p>
                </div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground text-sm">
                  ATS Match Score: <span className="text-accent">{result.ats_score}%</span>
                </p>
                <p>• {result.keywords_matched} of {result.keywords_total} keywords matched</p>
                <p>• Experience sections reordered by relevance</p>
                <p>• Skills aligned with requirements</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportCvPdf(result, profileInfo)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => exportCvDocx(result, profileInfo)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> DOCX
                </button>
              </div>
            </div>

            {/* Cover Letter */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Cover Letter</h3>
                  <p className="text-xs text-muted-foreground">Personalized for {result.company_name}</p>
                </div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4 text-xs text-muted-foreground leading-relaxed">
                <p className="italic">
                  "{result.cover_letter.substring(0, 200)}..."
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportCoverLetterPdf(result, profileInfo)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => exportCoverLetterDocx(result, profileInfo)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> DOCX
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveToTracker}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Save to Application Tracker
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
