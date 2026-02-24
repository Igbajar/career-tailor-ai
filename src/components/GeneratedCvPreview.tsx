import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Send, Download, Pencil, Check, X, Briefcase,
  GraduationCap, Award, BookOpen, FolderOpen, Users, Sparkles,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  GeneratedApplication,
  exportCvPdf, exportCoverLetterPdf,
  exportCvDocx, exportCoverLetterDocx,
} from "@/lib/documentExport";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ProfileInfo {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
}

interface Props {
  result: GeneratedApplication;
  profileInfo: ProfileInfo;
  onSaveToTracker: () => void;
  onResultUpdate: (updated: GeneratedApplication) => void;
}

function EditableText({
  value,
  onSave,
  multiline = false,
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <span
        className={`group cursor-pointer hover:bg-accent/5 rounded px-1 -mx-1 transition-colors ${className}`}
        onClick={() => { setDraft(value); setEditing(true); }}
        title="Click to edit"
      >
        {value}
        <Pencil className="w-3 h-3 text-muted-foreground/50 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-start gap-1 w-full">
      {multiline ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="text-sm min-h-[60px]"
          autoFocus
        />
      ) : (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="text-sm h-8"
          autoFocus
        />
      )}
      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => { onSave(draft); setEditing(false); }}>
        <Check className="w-3.5 h-3.5 text-accent" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditing(false)}>
        <X className="w-3.5 h-3.5 text-destructive" />
      </Button>
    </span>
  );
}

function SectionHeader({ icon: Icon, title, count }: { icon: any; title: string; count?: number }) {
  return (
    <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 group">
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <h3 className="font-semibold text-foreground text-sm flex-1 text-left">{title}</h3>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{count}</span>
      )}
      <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
}

export default function GeneratedCvPreview({ result, profileInfo, onSaveToTracker, onResultUpdate }: Props) {
  const update = (patch: Partial<GeneratedApplication>) => onResultUpdate({ ...result, ...patch });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header with ATS Score */}
      <div className="glass-card rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-accent" />
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {result.role_title} at {result.company_name}
            </h2>
            <p className="text-xs text-muted-foreground">Click any text to edit before downloading</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 rounded-lg bg-accent/10">
            <p className="text-2xl font-bold text-accent">{result.ats_score}%</p>
            <p className="text-[10px] text-muted-foreground">ATS Score</p>
          </div>
          <div className="text-center px-4 py-2 rounded-lg bg-secondary">
            <p className="text-lg font-semibold text-foreground">{result.keywords_matched}/{result.keywords_total}</p>
            <p className="text-[10px] text-muted-foreground">Keywords</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="glass-card rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-foreground text-sm">Professional Summary</h3>
        </div>
        <EditableText
          value={result.tailored_summary}
          onSave={(v) => update({ tailored_summary: v })}
          multiline
          className="text-sm text-muted-foreground leading-relaxed block"
        />
      </div>

      {/* Experience */}
      <Collapsible defaultOpen className="glass-card rounded-xl p-5">
        <SectionHeader icon={Briefcase} title="Work Experience" count={result.tailored_experiences.length} />
        <CollapsibleContent className="space-y-4 pt-2">
          {result.tailored_experiences.map((exp, i) => (
            <div key={i} className="border-l-2 border-accent/20 pl-4 space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <EditableText
                  value={exp.title}
                  onSave={(v) => {
                    const exps = [...result.tailored_experiences];
                    exps[i] = { ...exps[i], title: v };
                    update({ tailored_experiences: exps });
                  }}
                  className="font-medium text-foreground"
                />
                <span className="text-muted-foreground text-xs">at</span>
                <EditableText
                  value={exp.company}
                  onSave={(v) => {
                    const exps = [...result.tailored_experiences];
                    exps[i] = { ...exps[i], company: v };
                    update({ tailored_experiences: exps });
                  }}
                  className="text-foreground"
                />
              </div>
              <EditableText
                value={exp.period}
                onSave={(v) => {
                  const exps = [...result.tailored_experiences];
                  exps[i] = { ...exps[i], period: v };
                  update({ tailored_experiences: exps });
                }}
                className="text-xs text-muted-foreground"
              />
              <EditableText
                value={exp.description}
                onSave={(v) => {
                  const exps = [...result.tailored_experiences];
                  exps[i] = { ...exps[i], description: v };
                  update({ tailored_experiences: exps });
                }}
                multiline
                className="text-sm text-muted-foreground block"
              />
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Education */}
      {result.tailored_education && result.tailored_education.length > 0 && (
        <Collapsible defaultOpen className="glass-card rounded-xl p-5">
          <SectionHeader icon={GraduationCap} title="Education" count={result.tailored_education.length} />
          <CollapsibleContent className="space-y-3 pt-2">
            {result.tailored_education.map((edu, i) => (
              <div key={i} className="border-l-2 border-accent/20 pl-4 space-y-1">
                <EditableText
                  value={edu.degree}
                  onSave={(v) => {
                    const arr = [...(result.tailored_education || [])];
                    arr[i] = { ...arr[i], degree: v };
                    update({ tailored_education: arr });
                  }}
                  className="font-medium text-foreground"
                />
                <EditableText
                  value={edu.institution}
                  onSave={(v) => {
                    const arr = [...(result.tailored_education || [])];
                    arr[i] = { ...arr[i], institution: v };
                    update({ tailored_education: arr });
                  }}
                  className="text-sm text-muted-foreground"
                />
                {edu.period && (
                  <EditableText
                    value={edu.period}
                    onSave={(v) => {
                      const arr = [...(result.tailored_education || [])];
                      arr[i] = { ...arr[i], period: v };
                      update({ tailored_education: arr });
                    }}
                    className="text-xs text-muted-foreground"
                  />
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Skills */}
      {result.tailored_skills && result.tailored_skills.length > 0 && (
        <Collapsible defaultOpen className="glass-card rounded-xl p-5">
          <SectionHeader icon={Award} title="Skills" count={result.tailored_skills.length} />
          <CollapsibleContent className="pt-2">
            <div className="flex flex-wrap gap-2">
              {result.tailored_skills.map((skill, i) => (
                <span key={i} className="group relative inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  <EditableText
                    value={skill}
                    onSave={(v) => {
                      const arr = [...(result.tailored_skills || [])];
                      arr[i] = v;
                      update({ tailored_skills: arr });
                    }}
                  />
                </span>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Certifications */}
      {result.tailored_certifications && result.tailored_certifications.length > 0 && (
        <Collapsible defaultOpen className="glass-card rounded-xl p-5">
          <SectionHeader icon={Award} title="Certifications" count={result.tailored_certifications.length} />
          <CollapsibleContent className="space-y-2 pt-2">
            {result.tailored_certifications.map((cert, i) => (
              <div key={i} className="border-l-2 border-accent/20 pl-4">
                <EditableText
                  value={cert.name}
                  onSave={(v) => {
                    const arr = [...(result.tailored_certifications || [])];
                    arr[i] = { ...arr[i], name: v };
                    update({ tailored_certifications: arr });
                  }}
                  className="font-medium text-foreground text-sm"
                />
                <p className="text-xs text-muted-foreground">{cert.issuer}{cert.date_obtained ? ` · ${cert.date_obtained}` : ""}</p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Projects */}
      {result.tailored_projects && result.tailored_projects.length > 0 && (
        <Collapsible defaultOpen className="glass-card rounded-xl p-5">
          <SectionHeader icon={FolderOpen} title="Projects" count={result.tailored_projects.length} />
          <CollapsibleContent className="space-y-3 pt-2">
            {result.tailored_projects.map((proj, i) => (
              <div key={i} className="border-l-2 border-accent/20 pl-4 space-y-1">
                <EditableText
                  value={proj.name}
                  onSave={(v) => {
                    const arr = [...(result.tailored_projects || [])];
                    arr[i] = { ...arr[i], name: v };
                    update({ tailored_projects: arr });
                  }}
                  className="font-medium text-foreground text-sm"
                />
                <EditableText
                  value={proj.description}
                  onSave={(v) => {
                    const arr = [...(result.tailored_projects || [])];
                    arr[i] = { ...arr[i], description: v };
                    update({ tailored_projects: arr });
                  }}
                  multiline
                  className="text-sm text-muted-foreground block"
                />
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Publications */}
      {result.tailored_publications && result.tailored_publications.length > 0 && (
        <Collapsible defaultOpen className="glass-card rounded-xl p-5">
          <SectionHeader icon={BookOpen} title="Publications" count={result.tailored_publications.length} />
          <CollapsibleContent className="space-y-2 pt-2">
            {result.tailored_publications.map((pub, i) => (
              <div key={i} className="border-l-2 border-accent/20 pl-4">
                <EditableText
                  value={pub.title}
                  onSave={(v) => {
                    const arr = [...(result.tailored_publications || [])];
                    arr[i] = { ...arr[i], title: v };
                    update({ tailored_publications: arr });
                  }}
                  className="font-medium text-foreground text-sm"
                />
                <p className="text-xs text-muted-foreground">{pub.publisher}{pub.date_published ? ` · ${pub.date_published}` : ""}</p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Professional Bodies */}
      {result.tailored_professional_bodies && result.tailored_professional_bodies.length > 0 && (
        <Collapsible defaultOpen className="glass-card rounded-xl p-5">
          <SectionHeader icon={Users} title="Professional Memberships" count={result.tailored_professional_bodies.length} />
          <CollapsibleContent className="space-y-2 pt-2">
            {result.tailored_professional_bodies.map((body, i) => (
              <div key={i} className="border-l-2 border-accent/20 pl-4">
                <EditableText
                  value={body.name}
                  onSave={(v) => {
                    const arr = [...(result.tailored_professional_bodies || [])];
                    arr[i] = { ...arr[i], name: v };
                    update({ tailored_professional_bodies: arr });
                  }}
                  className="font-medium text-foreground text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {body.role}{body.member_since ? ` · Since ${body.member_since}` : ""}
                </p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Cover Letter */}
      <Collapsible defaultOpen className="glass-card rounded-xl p-5">
        <SectionHeader icon={Send} title="Cover Letter" />
        <CollapsibleContent className="pt-2">
          <EditableText
            value={result.cover_letter}
            onSave={(v) => update({ cover_letter: v })}
            multiline
            className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line block"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Download Actions */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">Download Documents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Tailored CV</p>
            <div className="flex gap-2">
              <Button onClick={() => exportCvPdf(result, profileInfo)} className="flex-1" size="sm">
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button onClick={() => exportCvDocx(result, profileInfo)} variant="secondary" className="flex-1" size="sm">
                <Download className="w-3.5 h-3.5" /> DOCX
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Cover Letter</p>
            <div className="flex gap-2">
              <Button onClick={() => exportCoverLetterPdf(result, profileInfo)} className="flex-1" size="sm">
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button onClick={() => exportCoverLetterDocx(result, profileInfo)} variant="secondary" className="flex-1" size="sm">
                <Download className="w-3.5 h-3.5" /> DOCX
              </Button>
            </div>
          </div>
        </div>
        <Button onClick={onSaveToTracker} variant="outline" className="w-full">
          Save to Application Tracker
        </Button>
      </div>
    </motion.div>
  );
}
