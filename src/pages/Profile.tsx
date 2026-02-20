import { motion } from "framer-motion";
import { User, Briefcase, GraduationCap, Wrench, Award, BookOpen, FolderOpen, Upload, Edit, Plus, Save } from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "experience", label: "Work Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "publications", label: "Publications", icon: BookOpen },
  { id: "projects", label: "Projects", icon: FolderOpen },
];

const mockExperience = [
  {
    title: "Senior Software Engineer",
    company: "Tech Corp",
    period: "2023 - Present",
    description: "Led development of microservices architecture serving 2M+ users. Mentored junior developers and established coding standards.",
  },
  {
    title: "Software Engineer",
    company: "StartupXYZ",
    period: "2020 - 2023",
    description: "Built full-stack web applications using React and Node.js. Improved CI/CD pipeline reducing deployment time by 60%.",
  },
];

const mockSkills = [
  "React", "TypeScript", "Node.js", "Python", "PostgreSQL", "AWS", "Docker", "Kubernetes",
  "GraphQL", "REST APIs", "CI/CD", "Agile", "System Design", "Team Leadership",
];

export default function Profile() {
  const [activeSection, setActiveSection] = useState("personal");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
            My Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your career information and master CV data.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/80 transition-colors">
            <Upload className="w-4 h-4" />
            Upload CV
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Nav */}
        <div className="glass-card rounded-xl p-4 h-fit">
          <nav className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${activeSection === id
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === "personal" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-6">
              <h2 className="font-display text-xl font-semibold text-foreground">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                  <input className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue="John Doe" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <input className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue="john.doe@email.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone</label>
                  <input className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue="+1 (555) 123-4567" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Location</label>
                  <input className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue="San Francisco, CA" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">LinkedIn</label>
                  <input className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue="linkedin.com/in/johndoe" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Portfolio</label>
                  <input className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue="johndoe.dev" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Professional Summary</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  defaultValue="Experienced software engineer with 6+ years of expertise in full-stack development, specializing in React, TypeScript, and cloud architecture. Passionate about building scalable systems and mentoring teams."
                />
              </div>
            </motion.div>
          )}

          {activeSection === "experience" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">Work Experience</h2>
                <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Add Experience
                </button>
              </div>
              {mockExperience.map((exp, i) => (
                <div key={i} className="glass-card rounded-xl p-5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{exp.title}</h3>
                      <p className="text-sm text-accent">{exp.company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{exp.period}</span>
                      <button className="p-1.5 hover:bg-secondary rounded-md transition-colors">
                        <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{exp.description}</p>
                </div>
              ))}
            </motion.div>
          )}

          {activeSection === "skills" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">Skills</h2>
                <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Add Skill
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockSkills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 rounded-lg bg-primary/5 text-sm font-medium text-foreground border border-border hover:border-accent/30 transition-colors cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === "education" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">Education</h2>
                <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Add Education
                </button>
              </div>
              <div className="glass-card rounded-xl p-5 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">MSc Computer Science</h3>
                    <p className="text-sm text-accent">Stanford University</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2018 - 2020</span>
                </div>
                <p className="text-sm text-muted-foreground">Specialized in Machine Learning and Distributed Systems. GPA: 3.9/4.0</p>
              </div>
              <div className="glass-card rounded-xl p-5 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">BSc Software Engineering</h3>
                    <p className="text-sm text-accent">MIT</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2014 - 2018</span>
                </div>
                <p className="text-sm text-muted-foreground">Dean's List. Capstone project on real-time collaborative editing systems.</p>
              </div>
            </motion.div>
          )}

          {(activeSection === "certifications" || activeSection === "publications" || activeSection === "projects") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                Add {sections.find(s => s.id === activeSection)?.label}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start adding your {activeSection} to build a comprehensive profile.
              </p>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> Add Entry
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
