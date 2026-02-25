import { motion } from "framer-motion";
import { FileText, Briefcase, ClipboardList, TrendingUp, Upload, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  Applied: "bg-info/10 text-info",
  Interview: "bg-warning/10 text-warning",
  Offer: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

export default function Dashboard() {
  const { user } = useAuth();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["dashboard_applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const totalApps = applications.length;
  const interviews = applications.filter((a: any) => a.status === "Interview").length;
  const offers = applications.filter((a: any) => a.status === "Offer").length;

  const stats = [
    { label: "Applications", value: String(totalApps), icon: Briefcase, change: "" },
    { label: "Generated CVs", value: String(applications.filter((a: any) => a.generated_data).length), icon: FileText, change: "" },
    { label: "Interviews", value: String(interviews), icon: TrendingUp, change: "" },
    { label: "Offers", value: String(offers), icon: ClipboardList, change: "" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-1">
            Your career command center. Let's land your next role.
          </p>
        </div>
        <Link
          to="/job-input"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Application
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-xl p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-accent" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/job-input"
              className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Briefcase className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Submit Job Advert</p>
                <p className="text-xs text-muted-foreground">Generate tailored CV & cover letter</p>
              </div>
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                <Upload className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Upload Master CV</p>
                <p className="text-xs text-muted-foreground">Update your career profile</p>
              </div>
            </Link>
            <Link
              to="/cv-manager"
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                <FileText className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Manage CVs</p>
                <p className="text-xs text-muted-foreground">View and edit saved versions</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Applications</h2>
            <Link to="/tracker" className="text-sm text-accent hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : applications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No applications yet. Submit a job advert to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app: any, i: number) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{app.company[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{app.role}</p>
                      <p className="text-xs text-muted-foreground">{app.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[app.status] || "bg-secondary text-secondary-foreground"}`}>
                      {app.status}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
