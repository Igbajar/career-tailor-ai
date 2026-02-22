import { motion } from "framer-motion";
import { User, Briefcase, GraduationCap, Wrench, Award, BookOpen, FolderOpen, Upload, Edit, Plus, Save, Check, Loader2, Trash2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, ProfileData, ExperienceData, SkillData } from "@/hooks/useProfile";
import { toast } from "sonner";

const sections = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "experience", label: "Work Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "publications", label: "Publications", icon: BookOpen },
  { id: "projects", label: "Projects", icon: FolderOpen },
];

function PersonalSection({ profile, onSave, isSaving }: { profile: any; onSave: (data: Partial<ProfileData>) => void; isSaving: boolean }) {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        location: profile.location || "",
        linkedin: profile.linkedin || "",
        portfolio: profile.portfolio || "",
        summary: profile.summary || "",
      });
    }
  }, [profile]);

  const update = (key: keyof ProfileData, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Personal Information</h2>
        <button onClick={() => onSave(form)} disabled={isSaving} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: "full_name" as const, label: "Full Name", placeholder: "Your full name" },
          { key: "phone" as const, label: "Phone", placeholder: "+1 (555) 123-4567" },
          { key: "location" as const, label: "Location", placeholder: "San Francisco, CA" },
          { key: "linkedin" as const, label: "LinkedIn", placeholder: "linkedin.com/in/yourname" },
          { key: "portfolio" as const, label: "Portfolio", placeholder: "yoursite.com" },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{label}</label>
            <input className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={form[key] || ""} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} />
          </div>
        ))}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
          <input className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue={user?.email || ""} readOnly />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Professional Summary</label>
        <textarea rows={4} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" value={form.summary || ""} onChange={(e) => update("summary", e.target.value)} placeholder="Write a brief professional summary..." />
      </div>
    </motion.div>
  );
}

function ExperienceSection({ experiences, onAdd, onDelete }: { experiences: any[]; onAdd: (exp: Omit<ExperienceData, "id">) => void; onDelete: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", period: "", description: "" });

  const handleAdd = () => {
    if (!form.title.trim() || !form.company.trim()) return;
    onAdd(form);
    setForm({ title: "", company: "", period: "", description: "" });
    setAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Work Experience</h2>
        <button onClick={() => setAdding(!adding)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors">
          {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {adding ? "Cancel" : "Add Experience"}
        </button>
      </div>
      {adding && (
        <div className="glass-card rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Job Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Period (e.g., 2020 - 2023)" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
          </div>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button onClick={handleAdd} disabled={!form.title.trim() || !form.company.trim()} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            <Check className="w-4 h-4" /> Save Experience
          </button>
        </div>
      )}
      {experiences.map((exp) => (
        <div key={exp.id} className="glass-card rounded-xl p-5 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{exp.title}</h3>
              <p className="text-sm text-accent">{exp.company}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{exp.period}</span>
              <button onClick={() => onDelete(exp.id)} className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{exp.description}</p>
        </div>
      ))}
      {experiences.length === 0 && !adding && (
        <div className="glass-card rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">No experience added yet.</p>
        </div>
      )}
    </motion.div>
  );
}

function SkillsSection({ skills, onAdd, onDelete }: { skills: any[]; onAdd: (skill: Omit<SkillData, "id">) => void; onDelete: (id: string) => void }) {
  const [newSkill, setNewSkill] = useState("");

  const handleAdd = () => {
    if (!newSkill.trim()) return;
    onAdd({ name: newSkill.trim() });
    setNewSkill("");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground">Skills</h2>
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Add a skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <button onClick={handleAdd} disabled={!newSkill.trim()} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-sm font-medium text-foreground border border-border group hover:border-destructive/30 transition-colors">
            {skill.name}
            <button onClick={() => onDelete(skill.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3 h-3 text-destructive" />
            </button>
          </span>
        ))}
      </div>
      {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills added yet.</p>}
    </motion.div>
  );
}

export default function Profile() {
  const [activeSection, setActiveSection] = useState("personal");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { profile, experiences, skills, isLoading, updateProfile, addExperience, deleteExperience, addSkill, deleteSkill } = useProfile();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) { toast.error("Please upload a PDF or DOCX file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be smaller than 10MB"); return; }
    setUploadedFile(file);
  };

  const handleUpload = async () => {
    if (!uploadedFile || !user) return;
    setUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}_${uploadedFile.name}`;
      const { error: uploadError } = await supabase.storage.from("cv-uploads").upload(filePath, uploadedFile);
      if (uploadError) throw uploadError;
      const { error: dbError } = await supabase.from("cv_uploads").insert({ user_id: user.id, file_name: uploadedFile.name, file_path: filePath, file_type: uploadedFile.type, is_master: true });
      if (dbError) throw dbError;
      toast.success("CV uploaded! Parsing your CV to auto-fill profile...");
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Auto-parse CV to fill profile
      const { error: parseError } = await supabase.functions.invoke("parse-cv", {
        body: { filePath },
      });
      if (parseError) {
        console.error("CV parse error:", parseError);
        toast.error("CV uploaded but auto-fill failed. You can fill in manually.");
      } else {
        toast.success("Profile auto-filled from your CV!");
        // Refresh profile data
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your career information and master CV data.</p>
        </div>
        <div className="flex gap-3">
          <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFileSelect} className="hidden" />
          {uploadedFile ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground truncate max-w-[140px]">{uploadedFile.name}</span>
              <button onClick={handleUpload} disabled={uploading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-success text-success-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Confirm Upload"}
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/80 transition-colors">
              <Upload className="w-4 h-4" /> Upload CV
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-4 h-fit">
          <nav className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveSection(id)} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSection === id ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeSection === "personal" && <PersonalSection profile={profile} onSave={(data) => updateProfile.mutate(data)} isSaving={updateProfile.isPending} />}
          {activeSection === "experience" && <ExperienceSection experiences={experiences} onAdd={(exp) => addExperience.mutate(exp)} onDelete={(id) => deleteExperience.mutate(id)} />}
          {activeSection === "skills" && <SkillsSection skills={skills} onAdd={(s) => addSkill.mutate(s)} onDelete={(id) => deleteSkill.mutate(id)} />}

          {activeSection === "education" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4"><Plus className="w-5 h-5 text-accent" /></div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">Add Education</h3>
              <p className="text-sm text-muted-foreground mb-4">Start adding your education history.</p>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"><Plus className="w-4 h-4" /> Add Entry</button>
            </motion.div>
          )}

          {(activeSection === "certifications" || activeSection === "publications" || activeSection === "projects") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4"><Plus className="w-5 h-5 text-accent" /></div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">Add {sections.find(s => s.id === activeSection)?.label}</h3>
              <p className="text-sm text-muted-foreground mb-4">Start adding your {activeSection} to build a comprehensive profile.</p>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"><Plus className="w-4 h-4" /> Add Entry</button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
