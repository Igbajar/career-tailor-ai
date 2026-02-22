import { motion } from "framer-motion";
import { FileText, Download, Eye, Trash2, Plus, Clock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function CVManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cvs = [], isLoading } = useQuery({
    queryKey: ["cv_uploads", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("cv_uploads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const deleteCv = useMutation({
    mutationFn: async (cv: { id: string; file_path: string }) => {
      await supabase.storage.from("cv-uploads").remove([cv.file_path]);
      const { error } = await supabase.from("cv_uploads").delete().eq("id", cv.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cv_uploads", user?.id] });
      toast.success("CV deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("cv-uploads").download(filePath);
    if (error) { toast.error("Download failed"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
            CV Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your uploaded CVs and create new applications.
          </p>
        </div>
        <button
          onClick={() => navigate("/job-input")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Application
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : cvs.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No CVs uploaded yet. Go to your Profile to upload one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-foreground">Uploaded CVs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cvs.map((cv, i) => (
              <motion.div
                key={cv.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card rounded-xl p-5 group hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  {cv.is_master && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      Master
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2">{cv.file_name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Clock className="w-3 h-3" />
                  {new Date(cv.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(cv.file_path, cv.file_name)}
                    className="p-2 rounded-md hover:bg-secondary transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteCv.mutate({ id: cv.id, file_path: cv.file_path })}
                    className="p-2 rounded-md hover:bg-destructive/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
