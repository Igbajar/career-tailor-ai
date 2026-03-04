import { motion } from "framer-motion";
import { ArrowLeft, Loader2, FileText, Briefcase } from "lucide-react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  Applied: "bg-info/10 text-info",
  Interview: "bg-warning/10 text-warning",
  Offer: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

const STATUS_OPTIONS = ["Applied", "Interview", "Offer", "Rejected"];

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["admin_user_profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isAdmin && !!userId,
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["admin_user_applications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", userId!)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin && !!userId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase
        .from("job_applications")
        .update({ status })
        .eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_user_applications", userId] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (adminLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const loading = profileLoading || appsLoading;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/users"
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">
            {profile?.full_name || profile?.email || "User Details"}
          </h1>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <>
          {/* User info card */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Profile Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                ["Name", profile?.full_name],
                ["Email", profile?.email],
                ["Phone", profile?.phone],
                ["Location", profile?.location],
                ["LinkedIn", profile?.linkedin],
                ["Joined", profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : null],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="text-foreground font-medium">{(value as string) || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Applications */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-accent" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                Applications ({applications.length})
              </h2>
            </div>

            {applications.length === 0 ? (
              <p className="text-muted-foreground text-sm py-6 text-center">No applications found.</p>
            ) : (
              <div className="space-y-3">
                {applications.map((app: any, i: number) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border border-border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{app.role}</p>
                        <p className="text-sm text-muted-foreground">{app.company}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Select
                          value={app.status}
                          onValueChange={(val) => updateStatus.mutate({ appId: app.id, status: val })}
                        >
                          <SelectTrigger className={`h-7 w-auto text-xs font-medium rounded-full px-3 border-0 ${statusColors[app.status] || "bg-secondary text-secondary-foreground"}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {app.ats_score != null && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                            ATS: {app.ats_score}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                      {app.location && <span>{app.location}</span>}
                      {app.salary_range && <span>{app.salary_range}</span>}
                    </div>

                    {/* Generated data preview */}
                    {app.generated_data && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FileText className="w-3.5 h-3.5 text-accent" />
                          <span className="text-xs font-medium text-accent">Generated CV Data</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {app.generated_data.summary && (
                            <p className="line-clamp-2"><span className="font-medium text-foreground">Summary:</span> {app.generated_data.summary}</p>
                          )}
                          {app.generated_data.experiences?.length > 0 && (
                            <p><span className="font-medium text-foreground">Experiences:</span> {app.generated_data.experiences.length} items</p>
                          )}
                          {app.generated_data.skills?.length > 0 && (
                            <p><span className="font-medium text-foreground">Skills:</span> {app.generated_data.skills.join(", ")}</p>
                          )}
                          {app.generated_data.coverLetter && (
                            <p className="line-clamp-2"><span className="font-medium text-foreground">Cover Letter:</span> {app.generated_data.coverLetter.substring(0, 120)}…</p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
