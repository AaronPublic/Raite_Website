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
    margin: { top: 15 },
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
  participants: { 
    name: string; 
    email: string; 
    role: string; 
    dateRegistered: string; 
    baseFee: number; 
    category?: string | null;
  }[];
  summary: {
    actualBill: number;
    discount: number;
    subTotal: number;
    egamesPotMoney: number;
    competitorAdditional: number;
    nonMemberCoachFee: number;
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
  const tableColumns = ["#", "Name", "Email Address", "Role", "Reg Date", "Base Fee"];
  const tableData = billingData.participants.map((p, idx) => [
    idx + 1,
    p.name,
    p.email,
    p.role === "FACULTY_COACH" ? "Faculty Coach" : "Participant",
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
    margin: { top: 15 },
  });

  // Summary Box Calculation Layout
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Calculate participant count
  const participantCount = billingData.participants.filter(p => p.role === "PARTICIPANT").length;
  
  // Table 1 data
  const boxItems1 = [
    { label: "Registration Fees:", value: `PHP ${billingData.summary.actualBill.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
    { label: "Discount:", value: `-PHP ${billingData.summary.discount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
    { label: "E-GAMES Pot Money (300 PHP/player):", value: `PHP ${billingData.summary.egamesPotMoney.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
    { label: "Sub Total:", value: `PHP ${(billingData.summary.subTotal + billingData.summary.egamesPotMoney).toLocaleString("en-US", { minimumFractionDigits: 2 })}` }
  ];

  // Table 2 data
  const boxItems2: { label: string; value: string }[] = [];
  const isNonMemberSchool = billingData.category !== "MEMBER";
  
  // 2.1 Non Member Additional (300 PHP/participant)
  const competitorAddValue = isNonMemberSchool ? (participantCount * 300) : 0;
  boxItems2.push({
    label: `Non-Member Add. (300 PHP x ${participantCount}):`,
    value: `PHP ${competitorAddValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  });

  // 2.2 Non Member Faculty Coach (500 PHP/coach)
  const nonMemberCoaches = billingData.participants.filter(
    p => p.role === "FACULTY_COACH" && p.category === "NON_MEMBER"
  );
  if (nonMemberCoaches.length > 0) {
    nonMemberCoaches.forEach(coach => {
      boxItems2.push({
        label: `${coach.name} - Individual Membership:`,
        value: `PHP 500.00`
      });
    });
  } else {
    boxItems2.push({
      label: "Coach Individual Membership:",
      value: `PHP 0.00`
    });
  }

  // 2.3 Inst. Membership Fee: 3500PHP
  const instFee = isNonMemberSchool ? 3500 : 0;
  boxItems2.push({
    label: "Inst. Membership Fee (3500 PHP):",
    value: `PHP ${instFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  });

  // 2.4 Table 2 Sub Total (Membership and Other Charges Sub Total)
  const otherChargesSubTotal = competitorAddValue + (nonMemberCoaches.length > 0 ? (nonMemberCoaches.length * 500) : 0) + instFee;
  boxItems2.push({
    label: "Sub Total:",
    value: `PHP ${otherChargesSubTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  });

  // Calculate box height dynamically (1 header + maxLines items + divider + grand total + paddings)
  const maxLines = Math.max(boxItems1.length, boxItems2.length);
  const rowHeight = 7;
  const headerHeight = 8;
  const dividerPadding = 3;
  const grandTotalHeight = 8;
  const paddingBottom = 4;
  const boxHeight = headerHeight + (maxLines * rowHeight) + dividerPadding + grandTotalHeight + paddingBottom;

  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const safetyMargin = 12;

  let boxY = finalY;
  if (boxY + boxHeight + safetyMargin > pageHeight) {
    doc.addPage();
    boxY = 15; // Start at the top of the new page
  }
  
  // ==================== DRAW TABLE 1 (Left Box) ====================
  doc.setDrawColor(220, 225, 230);
  doc.setFillColor(250, 251, 252);
  doc.rect(14, boxY, 75, boxHeight, "FD");

  // Header 1
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 56, 168); // Blue
  doc.text("Registration Fees", 17, boxY + 6);
  
  // Header 1 Divider line
  doc.setDrawColor(220, 225, 230);
  doc.line(15, boxY + 8, 88, boxY + 8);

  // Items 1
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50);
  let currentY1 = boxY + 14;
  boxItems1.forEach((item, index) => {
    const isSubTotal = index === boxItems1.length - 1;
    if (isSubTotal) {
      // Draw a thin divider line before the Sub Total
      doc.setDrawColor(220, 225, 230);
      doc.line(15, currentY1 - 4, 88, currentY1 - 4);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.text(item.label, 17, currentY1);
    doc.text(item.value, 86, currentY1, { align: "right" });
    currentY1 += rowHeight;
  });

  // ==================== DRAW TABLE 2 (Right Box) ====================
  doc.setDrawColor(220, 225, 230);
  doc.setFillColor(250, 251, 252);
  doc.rect(95, boxY, 101, boxHeight, "FD");

  // Header 2
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 56, 168); // Blue
  doc.text("Membership and Other Charges", 98, boxY + 6);
  
  // Header 2 Divider line
  doc.setDrawColor(220, 225, 230);
  doc.line(96, boxY + 8, 195, boxY + 8);

  // Items 2
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50);
  let currentY2 = boxY + 14;
  boxItems2.forEach((item, index) => {
    const isSubTotal = index === boxItems2.length - 1;
    
    // Dynamic Font Scaling to prevent overlapping without truncation
    doc.setFont("helvetica", isSubTotal ? "bold" : "normal");
    doc.setFontSize(8);
    const maxLabelWidth = 72; // available space for label in mm (from x=98 to x=170)
    const textWidth = doc.getTextWidth(item.label);
    if (textWidth > maxLabelWidth) {
      const scaledSize = Math.max(6.5, 8 * (maxLabelWidth / textWidth));
      doc.setFontSize(scaledSize);
    }
    
    if (isSubTotal) {
      // Draw a thin divider line before the Sub Total
      doc.setDrawColor(220, 225, 230);
      doc.line(96, currentY2 - 4, 195, currentY2 - 4);
    }
    
    doc.text(item.label, 98, currentY2);
    
    // Draw value
    doc.setFont("helvetica", isSubTotal ? "bold" : "normal");
    doc.setFontSize(8);
    doc.text(item.value, 192, currentY2, { align: "right" });
    
    currentY2 += rowHeight;
  });

  // Grand Total Divider line in Table 2
  const dividerY = boxY + boxHeight - grandTotalHeight - paddingBottom - 1;
  doc.setDrawColor(200, 200, 200);
  doc.line(96, dividerY, 195, dividerY);

  // Grand Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(128, 0, 0);
  const grandTotalY = dividerY + 6;
  doc.text("Grand Total:", 98, grandTotalY);
  doc.text(`PHP ${billingData.summary.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, 192, grandTotalY, { align: "right" });

  doc.save(`RAITE_2026_BILLING_${billingData.abbreviation.toUpperCase()}.pdf`);
};
