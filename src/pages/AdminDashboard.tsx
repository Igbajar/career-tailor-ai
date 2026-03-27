import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Briefcase, TrendingUp, Activity, Loader2, Download, CalendarIcon, Filter } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, subMonths, subDays, startOfDay, endOfDay, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DateRange = { from: Date | undefined; to: Date | undefined };

export default function AdminDashboard() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [preset, setPreset] = useState("6m");
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [statusFilter, setStatusFilter] = useState("all");

  const dateRange = useMemo(() => {
    if (preset === "custom" && customRange.from) {
      return { from: startOfDay(customRange.from), to: endOfDay(customRange.to || new Date()) };
    }
    const now = new Date();
    const presets: Record<string, Date> = {
      "7d": subDays(now, 7),
      "30d": subDays(now, 30),
      "3m": subMonths(now, 3),
      "6m": subMonths(now, 6),
      "12m": subMonths(now, 12),
    };
    return { from: startOfDay(presets[preset] || subMonths(now, 6)), to: endOfDay(now) };
  }, [preset, customRange]);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["admin_stats_raw"],
    queryFn: async () => {
      const [profilesRes, appsRes] = await Promise.all([
        supabase.from("profiles").select("id, created_at"),
        supabase.from("job_applications").select("id, status, applied_at, generated_data"),
      ]);
      return { profiles: profilesRes.data || [], apps: appsRes.data || [] };
    },
    enabled: isAdmin,
  });

  const stats = useMemo(() => {
    if (!rawData) return null;
    const { profiles, apps } = rawData;
    const { from, to } = dateRange;

    const filteredProfiles = profiles.filter((p: any) => isWithinInterval(new Date(p.created_at), { start: from, end: to }));
    const filteredApps = apps.filter((a: any) => {
      const inRange = isWithinInterval(new Date(a.applied_at), { start: from, end: to });
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return inRange && matchesStatus;
    });

    // Build monthly buckets
    const months: { label: string; users: number; applications: number }[] = [];
    let cursor = startOfMonth(from);
    const end = endOfMonth(to);
    while (cursor <= end) {
      const mStart = startOfMonth(cursor);
      const mEnd = endOfMonth(cursor);
      const label = format(cursor, "MMM yy");
      months.push({
        label,
        users: filteredProfiles.filter((p: any) => { const d = new Date(p.created_at); return d >= mStart && d <= mEnd; }).length,
        applications: filteredApps.filter((a: any) => { const d = new Date(a.applied_at); return d >= mStart && d <= mEnd; }).length,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    const statusCounts: Record<string, number> = {};
    filteredApps.forEach((a: any) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return {
      totalUsers: filteredProfiles.length,
      totalApps: filteredApps.length,
      totalCvs: filteredApps.filter((a: any) => a.generated_data).length,
      interviews: filteredApps.filter((a: any) => a.status === "Interview").length,
      months,
      statusData,
    };
  }, [rawData, dateRange, statusFilter]);

  const allStatuses = useMemo(() => {
    if (!rawData) return [];
    const set = new Set(rawData.apps.map((a: any) => a.status));
    return Array.from(set).sort();
  }, [rawData]);

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

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={preset} onValueChange={setPreset}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="3m">Last 3 months</SelectItem>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>

        {preset === "custom" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-1.5", !customRange.from && "text-muted-foreground")}>
                <CalendarIcon className="w-4 h-4" />
                {customRange.from ? (
                  customRange.to ? `${format(customRange.from, "MMM d")} – ${format(customRange.to, "MMM d, yyyy")}` : format(customRange.from, "MMM d, yyyy")
                ) : "Pick dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={(range: any) => setCustomRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        )}

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground ml-auto">
          {format(dateRange.from, "MMM d, yyyy")} – {format(dateRange.to, "MMM d, yyyy")}
        </span>
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
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
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
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
