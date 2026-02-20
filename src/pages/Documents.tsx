import { motion } from "framer-motion";
import { FileText, Download, Eye, Calendar, Send } from "lucide-react";

const documents = [
  { 
    id: 1, 
    cvName: "Google - Senior FE Engineer CV", 
    coverLetter: "Google - Cover Letter",
    company: "Google",
    role: "Senior Frontend Engineer",
    generated: "Feb 18, 2026",
    atsScore: 92,
  },
  { 
    id: 2, 
    cvName: "Stripe - Full Stack Developer CV", 
    coverLetter: "Stripe - Cover Letter",
    company: "Stripe",
    role: "Full Stack Developer",
    generated: "Feb 16, 2026",
    atsScore: 88,
  },
  { 
    id: 3, 
    cvName: "Notion - Product Engineer CV", 
    coverLetter: "Notion - Cover Letter",
    company: "Notion",
    role: "Product Engineer",
    generated: "Feb 14, 2026",
    atsScore: 85,
  },
];

export default function Documents() {
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

      <div className="space-y-4">
        {documents.map((doc, i) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-xl p-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary font-display">{doc.company[0]}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{doc.role}</h3>
                  <p className="text-sm text-accent">{doc.company}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {doc.generated}</span>
                    <span className="font-medium">ATS Score: <span className="text-accent">{doc.atsScore}%</span></span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/50">
                  <FileText className="w-4 h-4 text-accent" />
                  <span className="text-xs font-medium text-foreground">CV</span>
                  <button className="p-1 hover:bg-secondary rounded-md transition-colors ml-1" title="Preview">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button className="p-1 hover:bg-secondary rounded-md transition-colors" title="Download">
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/50">
                  <Send className="w-4 h-4 text-info" />
                  <span className="text-xs font-medium text-foreground">Cover Letter</span>
                  <button className="p-1 hover:bg-secondary rounded-md transition-colors ml-1" title="Preview">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button className="p-1 hover:bg-secondary rounded-md transition-colors" title="Download">
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
