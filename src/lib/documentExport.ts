import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

export interface GeneratedApplication {
  ats_score: number;
  keywords_matched: number;
  keywords_total: number;
  tailored_summary: string;
  tailored_experiences: {
    title: string;
    company: string;
    period: string;
    description: string;
  }[];
  tailored_education?: {
    degree: string;
    institution: string;
    period: string;
    description: string;
  }[];
  tailored_skills?: string[];
  tailored_certifications?: {
    name: string;
    issuer: string;
    date_obtained?: string;
  }[];
  tailored_publications?: {
    title: string;
    publisher: string;
    date_published?: string;
  }[];
  tailored_projects?: {
    name: string;
    role?: string;
    period?: string;
    description: string;
  }[];
  tailored_professional_bodies?: {
    name: string;
    role?: string;
    member_since?: string;
  }[];
  cover_letter: string;
  company_name: string;
  role_title: string;
}

interface ProfileInfo {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
}

export function exportCvPdf(app: GeneratedApplication, profile: ProfileInfo) {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  // Name
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(profile.full_name || "Candidate", margin, y);
  y += 8;

  // Contact line
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const contact = [profile.email, profile.phone, profile.location].filter(Boolean).join("  |  ");
  if (contact) {
    doc.text(contact, margin, y);
    y += 5;
  }
  const links = [profile.linkedin, profile.portfolio].filter(Boolean).join("  |  ");
  if (links) {
    doc.text(links, margin, y);
    y += 5;
  }

  // Line
  y += 2;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PROFESSIONAL SUMMARY", margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(app.tailored_summary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 6;

  // Experience
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("EXPERIENCE", margin, y);
  y += 6;

  for (const exp of app.tailored_experiences) {
    if (y > 260) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(exp.title, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(exp.period, pageWidth - margin, y, { align: "right" });
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(exp.company, margin, y);
    doc.setTextColor(0);
    y += 5;
    const descLines = doc.splitTextToSize(exp.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 6;
  }

  // Education
  if (app.tailored_education?.length) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("EDUCATION", margin, y); y += 6;
    for (const edu of app.tailored_education) {
      if (y > 260) { doc.addPage(); y = margin; }
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text(edu.degree, margin, y);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.text(edu.period || "", pageWidth - margin, y, { align: "right" }); y += 5;
      doc.setFontSize(10); doc.setTextColor(100);
      doc.text(edu.institution, margin, y); doc.setTextColor(0); y += 5;
      if (edu.description) {
        const dl = doc.splitTextToSize(edu.description, contentWidth);
        doc.text(dl, margin, y); y += dl.length * 5 + 4;
      }
      y += 2;
    }
  }

  // Skills
  if (app.tailored_skills?.length) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("SKILLS", margin, y); y += 6;
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const skillText = doc.splitTextToSize(app.tailored_skills.join("  •  "), contentWidth);
    doc.text(skillText, margin, y); y += skillText.length * 5 + 6;
  }

  // Certifications
  if (app.tailored_certifications?.length) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("CERTIFICATIONS", margin, y); y += 6;
    for (const c of app.tailored_certifications) {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(`• ${c.name} — ${c.issuer}${c.date_obtained ? ` (${c.date_obtained})` : ""}`, margin, y); y += 5;
    }
    y += 4;
  }

  // Publications
  if (app.tailored_publications?.length) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("PUBLICATIONS", margin, y); y += 6;
    for (const p of app.tailored_publications) {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(`• ${p.title} — ${p.publisher}${p.date_published ? ` (${p.date_published})` : ""}`, margin, y); y += 5;
    }
    y += 4;
  }

  // Projects
  if (app.tailored_projects?.length) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("PROJECTS", margin, y); y += 6;
    for (const p of app.tailored_projects) {
      if (y > 260) { doc.addPage(); y = margin; }
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text(p.name, margin, y); y += 5;
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      const dl = doc.splitTextToSize(p.description, contentWidth);
      doc.text(dl, margin, y); y += dl.length * 5 + 4;
    }
  }

  // Professional Bodies
  if (app.tailored_professional_bodies?.length) {
    if (y > 250) { doc.addPage(); y = margin; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("PROFESSIONAL MEMBERSHIPS", margin, y); y += 6;
    for (const b of app.tailored_professional_bodies) {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(`• ${b.name}${b.role ? ` — ${b.role}` : ""}${b.member_since ? ` (Since ${b.member_since})` : ""}`, margin, y); y += 5;
    }
    y += 4;
  }

  doc.save(`CV_${app.role_title.replace(/\s+/g, "_")}_${app.company_name.replace(/\s+/g, "_")}.pdf`);
}

export function exportCoverLetterPdf(app: GeneratedApplication, profile: ProfileInfo) {
  const doc = new jsPDF();
  const margin = 25;
  let y = margin;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), margin, y);
  y += 12;
  const lines = doc.splitTextToSize(app.cover_letter, contentWidth);
  doc.text(lines, margin, y);
  doc.save(`Cover_Letter_${app.role_title.replace(/\s+/g, "_")}_${app.company_name.replace(/\s+/g, "_")}.pdf`);
}

export async function exportCvDocx(app: GeneratedApplication, profile: ProfileInfo) {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: profile.full_name || "Candidate", bold: true, size: 36, font: "Calibri" })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
    })
  );

  const contact = [profile.email, profile.phone, profile.location].filter(Boolean).join("  |  ");
  if (contact) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contact, size: 18, color: "666666", font: "Calibri" })],
        spacing: { after: 200 },
      })
    );
  }

  // Summary
  children.push(
    new Paragraph({ text: "PROFESSIONAL SUMMARY", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } } })
  );
  children.push(
    new Paragraph({ children: [new TextRun({ text: app.tailored_summary, size: 22, font: "Calibri" })], spacing: { after: 200 } })
  );

  // Experience
  children.push(
    new Paragraph({ text: "EXPERIENCE", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } } })
  );
  for (const exp of app.tailored_experiences) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: exp.title, bold: true, size: 24, font: "Calibri" }),
          new TextRun({ text: `  —  ${exp.company}`, size: 22, color: "555555", font: "Calibri" }),
        ],
        spacing: { before: 200 },
      })
    );
    children.push(
      new Paragraph({ children: [new TextRun({ text: exp.period, italics: true, size: 20, color: "888888", font: "Calibri" })], spacing: { after: 100 } })
    );
    children.push(
      new Paragraph({ children: [new TextRun({ text: exp.description, size: 22, font: "Calibri" })], spacing: { after: 200 } })
    );
  }

  // Education
  if (app.tailored_education?.length) {
    children.push(
      new Paragraph({ text: "EDUCATION", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } } })
    );
    for (const edu of app.tailored_education) {
      children.push(new Paragraph({ children: [new TextRun({ text: edu.degree, bold: true, size: 24, font: "Calibri" }), new TextRun({ text: `  —  ${edu.institution}`, size: 22, color: "555555", font: "Calibri" })], spacing: { before: 200 } }));
      children.push(new Paragraph({ children: [new TextRun({ text: edu.period || "", italics: true, size: 20, color: "888888", font: "Calibri" })], spacing: { after: 100 } }));
      if (edu.description) children.push(new Paragraph({ children: [new TextRun({ text: edu.description, size: 22, font: "Calibri" })], spacing: { after: 200 } }));
    }
  }

  // Skills
  if (app.tailored_skills?.length) {
    children.push(
      new Paragraph({ text: "SKILLS", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } } })
    );
    children.push(new Paragraph({ children: [new TextRun({ text: app.tailored_skills.join("  •  "), size: 22, font: "Calibri" })], spacing: { after: 200 } }));
  }

  // Certifications
  if (app.tailored_certifications?.length) {
    children.push(
      new Paragraph({ text: "CERTIFICATIONS", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } } })
    );
    for (const c of app.tailored_certifications) {
      children.push(new Paragraph({ children: [new TextRun({ text: `• ${c.name} — ${c.issuer}${c.date_obtained ? ` (${c.date_obtained})` : ""}`, size: 22, font: "Calibri" })], spacing: { after: 100 } }));
    }
  }

  // Publications
  if (app.tailored_publications?.length) {
    children.push(
      new Paragraph({ text: "PUBLICATIONS", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } } })
    );
    for (const p of app.tailored_publications) {
      children.push(new Paragraph({ children: [new TextRun({ text: `• ${p.title} — ${p.publisher}${p.date_published ? ` (${p.date_published})` : ""}`, size: 22, font: "Calibri" })], spacing: { after: 100 } }));
    }
  }

  // Projects
  if (app.tailored_projects?.length) {
    children.push(
      new Paragraph({ text: "PROJECTS", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } } })
    );
    for (const p of app.tailored_projects) {
      children.push(new Paragraph({ children: [new TextRun({ text: p.name, bold: true, size: 24, font: "Calibri" }), new TextRun({ text: p.role ? `  —  ${p.role}` : "", size: 22, color: "555555", font: "Calibri" })], spacing: { before: 200 } }));
      children.push(new Paragraph({ children: [new TextRun({ text: p.description, size: 22, font: "Calibri" })], spacing: { after: 200 } }));
    }
  }

  // Professional Bodies
  if (app.tailored_professional_bodies?.length) {
    children.push(
      new Paragraph({ text: "PROFESSIONAL MEMBERSHIPS", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } } })
    );
    for (const b of app.tailored_professional_bodies) {
      children.push(new Paragraph({ children: [new TextRun({ text: `• ${b.name}${b.role ? ` — ${b.role}` : ""}${b.member_since ? ` (Since ${b.member_since})` : ""}`, size: 22, font: "Calibri" })], spacing: { after: 100 } }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `CV_${app.role_title.replace(/\s+/g, "_")}_${app.company_name.replace(/\s+/g, "_")}.docx`);
}

export async function exportCoverLetterDocx(app: GeneratedApplication, profile: ProfileInfo) {
  const paragraphs = app.cover_letter.split("\n").filter(Boolean).map(
    (para) =>
      new Paragraph({
        children: [new TextRun({ text: para, size: 22, font: "Calibri" })],
        spacing: { after: 200 },
      })
  );

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
              size: 22,
              font: "Calibri",
            }),
          ],
          spacing: { after: 400 },
        }),
        ...paragraphs,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Cover_Letter_${app.role_title.replace(/\s+/g, "_")}_${app.company_name.replace(/\s+/g, "_")}.docx`);
}
