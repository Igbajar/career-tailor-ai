import { motion } from "framer-motion";
import { Plus, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Status = "All" | "Applied" | "Interview" | "Offer" | "Rejected";

const statusColors: Record<string, string> = {
  Applied: "bg-info/10 text-info",
  Interview: "bg-warning/10 text-warning",
  Offer: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

const filters: Status[] = ["All", "Applied", "Interview", "Offer", "Rejected"];
const statusOptions = ["Applied", "Interview", "Offer", "Rejected"];

export default function Tracker() {
  const [activeFilter, setActiveFilter] = useState<Status>("All");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["job_applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("job_applications")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_applications", user?.id] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = applications.filter((app: any) => {
    if (activeFilter !== "All" && app.status !== activeFilter) return false;
    if (search && !app.company.toLowerCase().includes(search.toLowerCase()) && !app.role.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
            Application Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your job applications.
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${activeFilter === f
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Company</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Location</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">ATS Score</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Applied</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app: any, i: number) => (
                  <motion.tr
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{app.company[0]}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{app.company}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">{app.role}</td>
                    <td className="p-4 text-sm text-muted-foreground">{app.location || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{app.ats_score ? `${app.ats_score}%` : "—"}</td>
                    <td className="p-4">
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus.mutate({ id: app.id, status: e.target.value })}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusColors[app.status] || "bg-secondary text-secondary-foreground"}`}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-border">
            {filtered.map((app: any, i: number) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{app.company[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{app.role}</p>
                      <p className="text-xs text-muted-foreground">{app.company} · {app.location || "Remote"}</p>
                    </div>
                  </div>
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus.mutate({ id: app.id, status: e.target.value })}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusColors[app.status] || "bg-secondary text-secondary-foreground"}`}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{app.ats_score ? `ATS: ${app.ats_score}%` : ""}</span>
                  <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No applications found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
