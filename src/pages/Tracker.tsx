import { motion } from "framer-motion";
import { Plus, Filter, Search, ExternalLink } from "lucide-react";
import { useState } from "react";

type Status = "All" | "Applied" | "Interview" | "Offer" | "Rejected";

const applications = [
  { id: 1, company: "Google", role: "Senior Frontend Engineer", status: "Interview" as const, applied: "Feb 18, 2026", location: "Mountain View, CA", salary: "$180k-$250k" },
  { id: 2, company: "Stripe", role: "Full Stack Developer", status: "Applied" as const, applied: "Feb 16, 2026", location: "San Francisco, CA", salary: "$170k-$220k" },
  { id: 3, company: "Notion", role: "Product Engineer", status: "Applied" as const, applied: "Feb 14, 2026", location: "Remote", salary: "$160k-$200k" },
  { id: 4, company: "Vercel", role: "Software Engineer", status: "Offer" as const, applied: "Feb 12, 2026", location: "Remote", salary: "$150k-$190k" },
  { id: 5, company: "Meta", role: "Frontend Engineer", status: "Rejected" as const, applied: "Feb 8, 2026", location: "Menlo Park, CA", salary: "$190k-$260k" },
  { id: 6, company: "Figma", role: "Design Engineer", status: "Interview" as const, applied: "Feb 6, 2026", location: "San Francisco, CA", salary: "$170k-$230k" },
];

const statusColors: Record<string, string> = {
  Applied: "bg-info/10 text-info",
  Interview: "bg-warning/10 text-warning",
  Offer: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

const filters: Status[] = ["All", "Applied", "Interview", "Offer", "Rejected"];

export default function Tracker() {
  const [activeFilter, setActiveFilter] = useState<Status>("All");
  const [search, setSearch] = useState("");

  const filtered = applications.filter((app) => {
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
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="w-4 h-4" />
          Add Application
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

      {/* Applications table/cards */}
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden lg:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Company</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Role</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Location</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Salary</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Applied</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => (
                <motion.tr
                  key={app.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
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
                  <td className="p-4 text-sm text-muted-foreground">{app.location}</td>
                  <td className="p-4 text-sm text-muted-foreground">{app.salary}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[app.status]}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{app.applied}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-border">
          {filtered.map((app, i) => (
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
                    <p className="text-xs text-muted-foreground">{app.company} · {app.location}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[app.status]}`}>
                  {app.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{app.salary}</span>
                <span>{app.applied}</span>
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
    </div>
  );
}
