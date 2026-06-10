import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: string[];
  data: any[][];
}

export const generateRAITEReport = ({
  title,
  subtitle,
  filename,
  columns,
  data,
}: ReportOptions) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleString();

  // Add Logos
  doc.addImage("/psite.png", "PNG", 14, 10, 100, 25);
  doc.addImage("/RAITE.png", "PNG", 115, 10, 25, 25);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(0, 56, 168); // RAITE Blue
  doc.text("RAITE", 14, 45);
  
  const raiteWidth = doc.getTextWidth("RAITE ");
  doc.setTextColor(220, 38, 38); // Red
  doc.text("2026", 14 + raiteWidth, 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Regional Assembly on Information Technology Education", 14, 51);
  doc.text("PSITE Region III - Central Luzon", 14, 56);

  // Tri-color separator line (Blue, Yellow, Red)
  const startX = 14;
  const endX = 196;
  const segmentWidth = (endX - startX) / 3;

  doc.setLineWidth(1);
  
  doc.setDrawColor(0, 56, 168); // Blue
  doc.line(startX, 60, startX + segmentWidth, 60);
  
  doc.setDrawColor(251, 191, 36); // Yellow/Gold
  doc.line(startX + segmentWidth, 60, startX + (segmentWidth * 2), 60);
  
  doc.setDrawColor(220, 38, 38); // Red
  doc.line(startX + (segmentWidth * 2), 60, endX, 60);

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(title, 14, 70);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 76);
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated on: ${date}`, 14, subtitle ? 81 : 76);

  autoTable(doc, {
    startY: subtitle ? 85 : 80,
    head: [columns],
    body: data,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { 
      fillColor: [0, 56, 168], 
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 60 },
    didDrawPage: (data) => {
      // Footer
      const str = `Page ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(150);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
    }
  });

  doc.save(`${filename}.pdf`);
};
