import { motion } from "framer-motion";
import { FileText, Download, Calendar, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  GeneratedApplication,
  exportCvPdf,
  exportCoverLetterPdf,
  exportCvDocx,
  exportCoverLetterDocx,
} from "@/lib/documentExport";

export default function Documents() {
  const { user } = useAuth();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["generated_docs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .not("generated_data", "is", null)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const getProfileInfo = () => {
    // We'll use minimal info; the generated_data has everything needed
    return {};
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
          Generated Documents
        </h1>
        <p className="text-muted-foreground mt-1">
          All your AI-generated CVs and cover letters in one place.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No generated documents yet. Create a new application to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any, i: number) => {
            const genData = app.generated_data as GeneratedApplication | null;
            if (!genData) return null;

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary font-display">
                        {app.company[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{app.role}</h3>
                      <p className="text-sm text-accent">{app.company}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                        {app.ats_score && (
                          <span className="font-medium">
                            ATS Score: <span className="text-accent">{app.ats_score}%</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/50">
                      <FileText className="w-4 h-4 text-accent" />
                      <span className="text-xs font-medium text-foreground">CV</span>
                      <button
                        onClick={() => exportCvPdf(genData, {})}
                        className="p-1 hover:bg-secondary rounded-md transition-colors ml-1"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/50">
                      <Send className="w-4 h-4 text-info" />
                      <span className="text-xs font-medium text-foreground">Cover Letter</span>
                      <button
                        onClick={() => exportCoverLetterPdf(genData, {})}
                        className="p-1 hover:bg-secondary rounded-md transition-colors ml-1"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
