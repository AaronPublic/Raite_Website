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

export const generateRAITEBillingPDF = (billingData: {
  schoolName: string;
  abbreviation: string;
  category: string;
  discount: number;
  participants: { name: string; email: string; dateRegistered: string; baseFee: number }[];
  summary: {
    actualBill: number;
    discount: number;
    subTotal: number;
    competitorAdditional: number;
    institutionalFee: number;
    grandTotal: number;
  };
}) => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleString();

  // Logos
  doc.addImage("/psite.png", "PNG", 14, 10, 100, 25);
  doc.addImage("/RAITE.png", "PNG", 115, 10, 25, 25);

  // Title Block
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

  // Billing Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("BILLING INVOICE", 14, 70);

  // Billing Metadata
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Institution:", 14, 78);
  doc.setFont("helvetica", "normal");
  doc.text(`${billingData.schoolName} (${billingData.abbreviation})`, 38, 78);

  doc.setFont("helvetica", "bold");
  doc.text("Category:", 14, 84);
  doc.setFont("helvetica", "normal");
  doc.text(billingData.category === "MEMBER" ? "Member School" : "Non-Member School", 38, 84);

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Date:", 14, 90);
  doc.setFont("helvetica", "normal");
  doc.text(dateStr, 38, 90);

  // Render Table
  const tableColumns = ["#", "Participant Name", "Email Address", "Reg Date", "Base Fee"];
  const tableData = billingData.participants.map((p, idx) => [
    idx + 1,
    p.name,
    p.email,
    p.dateRegistered,
    `PHP ${p.baseFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: 96,
    head: [tableColumns],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { 
      fillColor: [0, 56, 168], 
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 60 },
  });

  // Summary Box Calculation Layout
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const summaryBoxHeight = billingData.category === "NON_MEMBER" ? 54 : 36;
  const safetyMargin = 20; // 20mm safety margin above bottom edge

  let boxY = finalY;
  if (boxY + summaryBoxHeight + safetyMargin > pageHeight) {
    doc.addPage();
    boxY = 20; // Start at the top of the new page
  }
  
  // Draw Border Box for Summary
  doc.setDrawColor(220, 225, 230);
  doc.setFillColor(250, 251, 252);
  doc.rect(115, boxY, 81, summaryBoxHeight, "FD");

  doc.setFontSize(9);
  doc.setTextColor(50);
  
  // Aligned lines inside the box
  doc.text("Actual Bill:", 118, boxY + 7);
  doc.text(`PHP ${billingData.summary.actualBill.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 193, boxY + 7, { align: "right" });

  doc.text("Discount:", 118, boxY + 14);
  doc.text(`-PHP ${billingData.summary.discount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 193, boxY + 14, { align: "right" });

  doc.text("Sub Total:", 118, boxY + 21);
  doc.text(`PHP ${billingData.summary.subTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 193, boxY + 21, { align: "right" });

  if (billingData.category === "NON_MEMBER") {
    doc.text("Non-Member Add. (300/p):", 118, boxY + 28);
    doc.text(`PHP ${billingData.summary.competitorAdditional.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 193, boxY + 28, { align: "right" });

    doc.text("Inst. Membership Fee:", 118, boxY + 35);
    doc.text(`PHP ${billingData.summary.institutionalFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 193, boxY + 35, { align: "right" });
  } else {
    doc.text("Additionals:", 118, boxY + 28);
    doc.text("N/A", 193, boxY + 28, { align: "right" });
  }

  // Grand Total Divider line
  const totalLineY = boxY + (billingData.category === "NON_MEMBER" ? 40 : 30);
  doc.setDrawColor(200, 200, 200);
  doc.line(116, totalLineY, 195, totalLineY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 56, 168);
  doc.text("Grand Total:", 118, totalLineY + 8);
  doc.text(`PHP ${billingData.summary.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 193, totalLineY + 8, { align: "right" });

  doc.save(`RAITE_2026_BILLING_${billingData.abbreviation.toUpperCase()}.pdf`);
};
