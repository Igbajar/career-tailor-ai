import { motion } from "framer-motion";
import { Users, Briefcase, TrendingUp, Activity, Loader2, Download } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [profilesRes, appsRes] = await Promise.all([
        supabase.from("profiles").select("id, created_at"),
        supabase.from("job_applications").select("id, status, applied_at, generated_data"),
      ]);
      const profiles = profilesRes.data || [];
      const apps = appsRes.data || [];

      // Monthly signups (last 6 months)
      const now = new Date();
      const months: { label: string; users: number; applications: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        const users = profiles.filter((p: any) => {
          const c = new Date(p.created_at);
          return c >= d && c <= end;
        }).length;
        const applications = apps.filter((a: any) => {
          const c = new Date(a.applied_at);
          return c >= d && c <= end;
        }).length;
        months.push({ label, users, applications });
      }

      // Status breakdown
      const statusCounts: Record<string, number> = {};
      apps.forEach((a: any) => {
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      });
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      return {
        totalUsers: profiles.length,
        totalApps: apps.length,
        totalCvs: apps.filter((a: any) => a.generated_data).length,
        interviews: apps.filter((a: any) => a.status === "Interview").length,
        months,
        statusData,
      };
    },
    enabled: isAdmin,
  });

  if (adminLoading || isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const exportCsv = async (type: "users" | "applications") => {
    try {
      if (type === "users") {
        const { data, error } = await supabase.from("profiles").select("full_name, email, phone, location, linkedin, is_suspended, created_at");
        if (error) throw error;
        const rows = (data || []).map((p: any) => [p.full_name || "", p.email || "", p.phone || "", p.location || "", p.linkedin || "", p.is_suspended ? "Suspended" : "Active", p.created_at].join(","));
        const csv = ["Name,Email,Phone,Location,LinkedIn,Status,Joined", ...rows].join("\n");
        downloadCsv(csv, "users-export.csv");
      } else {
        const { data, error } = await supabase.from("job_applications").select("role, company, status, ats_score, location, salary_range, applied_at");
        if (error) throw error;
        const rows = (data || []).map((a: any) => [`"${a.role}"`, `"${a.company}"`, a.status, a.ats_score ?? "", `"${a.location || ""}"`, `"${a.salary_range || ""}"`, a.applied_at].join(","));
        const csv = ["Role,Company,Status,ATS Score,Location,Salary,Applied At", ...rows].join("\n");
        downloadCsv(csv, "applications-export.csv");
      }
      toast.success(`${type === "users" ? "Users" : "Applications"} exported`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const downloadCsv = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users },
    { label: "Total Applications", value: stats?.totalApps ?? 0, icon: Briefcase },
    { label: "Generated CVs", value: stats?.totalCvs ?? 0, icon: TrendingUp },
    { label: "Interviews", value: stats?.interviews ?? 0, icon: Activity },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Platform overview and activity trends.</p>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => exportCsv("users")}>
            <Download className="w-4 h-4 mr-1.5" /> Export Users
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCsv("applications")}>
            <Download className="w-4 h-4 mr-1.5" /> Export Applications
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-3xl font-display font-bold text-foreground mt-1">{card.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <card.icon className="w-5 h-5 text-accent" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">User & Application Trends</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats?.months || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                }}
              />
              <Line type="monotone" dataKey="users" stroke="hsl(var(--accent))" strokeWidth={2} name="Signups" />
              <Line type="monotone" dataKey="applications" stroke="hsl(var(--primary))" strokeWidth={2} name="Applications" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Application Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats?.statusData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
