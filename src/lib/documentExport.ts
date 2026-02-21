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

  doc.save(`CV_${app.role_title.replace(/\s+/g, "_")}_${app.company_name.replace(/\s+/g, "_")}.pdf`);
}

export function exportCoverLetterPdf(app: GeneratedApplication, profile: ProfileInfo) {
  const doc = new jsPDF();
  const margin = 25;
  let y = margin;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  // Date
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), margin, y);
  y += 12;

  // Letter body
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
