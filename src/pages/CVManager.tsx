import { motion } from "framer-motion";
import { FileText, Download, Eye, Trash2, Plus, Clock } from "lucide-react";

const savedCVs = [
  { id: 1, name: "Master CV", updated: "Feb 20, 2026", type: "Master", pages: 3 },
  { id: 2, name: "Google - Senior FE Engineer", updated: "Feb 18, 2026", type: "Tailored", pages: 2 },
  { id: 3, name: "Stripe - Full Stack Developer", updated: "Feb 16, 2026", type: "Tailored", pages: 2 },
  { id: 4, name: "Notion - Product Engineer", updated: "Feb 14, 2026", type: "Tailored", pages: 2 },
];

const templates = [
  { name: "Professional Classic", description: "Clean, traditional layout perfect for corporate roles" },
  { name: "Modern Minimal", description: "Sleek design with strategic use of whitespace" },
  { name: "ATS Optimized", description: "Stripped-down format that scores highest with ATS systems" },
];

export default function CVManager() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
            CV Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your saved CVs and templates.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="w-4 h-4" />
          Upload New CV
        </button>
      </div>

      {/* Saved CVs */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-foreground">Saved CVs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {savedCVs.map((cv, i) => (
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
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  cv.type === "Master" ? "bg-accent/10 text-accent" : "bg-info/10 text-info"
                }`}>
                  {cv.type}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2">{cv.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Clock className="w-3 h-3" />
                {cv.updated} · {cv.pages} pages
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 rounded-md hover:bg-secondary transition-colors" title="Preview">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-md hover:bg-secondary transition-colors" title="Download">
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-md hover:bg-destructive/10 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-foreground">CV Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {templates.map((template, i) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="glass-card rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="w-full h-32 rounded-lg bg-gradient-to-br from-secondary to-muted mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground/40 group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{template.name}</h3>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
