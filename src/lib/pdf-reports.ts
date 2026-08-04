import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: string[];
  data: any[][];
}

const cleanText = (val: any): any => {
  if (val === null || val === undefined) return "";
  const str = typeof val === "string" ? val : String(val);
  return str
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const generateRAITEReport = (options: ReportOptions) => {
  const title = cleanText(options.title);
  const subtitle = options.subtitle ? cleanText(options.subtitle) : undefined;
  const filename = cleanText(options.filename);
  const columns = options.columns.map(c => cleanText(c));
  const data = options.data.map(row => row.map(cell => cleanText(cell)));
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

export const generateRAITEBillingPDF = (rawBillingData: {
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
    eventName?: string;
  }[];
  summary: {
    actualBill: number;
    discount: number;
    downPayment?: number;
    subTotal: number;
    egamesPotMoney: number;
    competitorAdditional: number;
    nonMemberCoachFee: number;
    institutionalFee: number;
    grandTotal: number;
  };
}) => {
  const billingData = {
    ...rawBillingData,
    schoolName: cleanText(rawBillingData.schoolName),
    abbreviation: cleanText(rawBillingData.abbreviation),
    participants: rawBillingData.participants.map(p => ({
      ...p,
      name: cleanText(p.name),
      email: cleanText(p.email),
      eventName: p.eventName ? cleanText(p.eventName) : undefined,
    })),
    summary: {
      ...rawBillingData.summary,
      downPayment: rawBillingData.summary.downPayment || 0,
    }
  };

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
  const tableColumns = ["#", "Name", "Email Address", "Role", "Event", "Reg Date", "Base Fee"];
  const tableData = billingData.participants.map((p, idx) => [
    idx + 1,
    p.name,
    p.email,
    p.role === "FACULTY_COACH" ? "Faculty Coach" : "Participant",
    p.eventName || "N/A",
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
    { label: "Down Payment:", value: `-PHP ${(billingData.summary.downPayment || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
    { label: "E-GAMES Pot Money (300 PHP/player):", value: `PHP ${billingData.summary.egamesPotMoney.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
    { label: "Sub Total:", value: `PHP ${(billingData.summary.subTotal + billingData.summary.egamesPotMoney - (billingData.summary.downPayment || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}` }
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

export const generateRAITEShirtSizesPDF = (
  schoolName: string,
  participants: { name: string; role: string; shirtSize: string }[],
  summary: { S: number; M: number; L: number; XL: number; XXL: number; XXXL: number; total: number }
) => {
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

  // Tri-color separator line
  const startX = 14;
  const endX = 196;
  const segmentWidth = (endX - startX) / 3;
  doc.setLineWidth(1);
  doc.setDrawColor(0, 56, 168);
  doc.line(startX, 60, startX + segmentWidth, 60);
  doc.setDrawColor(251, 191, 36);
  doc.line(startX + segmentWidth, 60, startX + (segmentWidth * 2), 60);
  doc.setDrawColor(220, 38, 38);
  doc.line(startX + (segmentWidth * 2), 60, endX, 60);

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("SHIRT SIZES AND KIT REPORT", 14, 70);

  // Metadata
  doc.setFontSize(10);
  doc.text(`Institution: ${cleanText(schoolName)}`, 14, 78);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${date}`, 14, 84);

  // Render Summary Box right before records
  doc.setDrawColor(220, 225, 230);
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 90, 182, 28, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SHIRT SIZES SUMMARY COUNTS", 18, 96);
  doc.line(16, 98, 194, 98);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Small (S): ${summary.S}`, 20, 105);
  doc.text(`Medium (M): ${summary.M}`, 55, 105);
  doc.text(`Large (L): ${summary.L}`, 90, 105);
  doc.text(`Extra Large (XL): ${summary.XL}`, 125, 105);
  doc.text(`XXL: ${summary.XXL}`, 160, 105);
  doc.text(`XXXL: ${summary.XXXL}`, 20, 112);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Shirts: ${summary.total}`, 55, 112);

  // Render Records Table
  const tableColumns = ["#", "Name", "Role", "Shirt Size"];
  const tableData = participants.map((p, idx) => [
    idx + 1,
    cleanText(p.name),
    p.role === "FACULTY_COACH" ? "Faculty Coach" : "Participant",
    cleanText(p.shirtSize),
  ]);

  autoTable(doc, {
    startY: 124,
    head: [tableColumns],
    body: tableData,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { 
      fillColor: [0, 56, 168], 
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 15 },
  });

  const sanitizedSchool = cleanText(schoolName).replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`RAITE_2026_SHIRT_SIZES_${sanitizedSchool}.pdf`);
};

export const generateRAITEShirtSizesSummaryPDF = (
  summaries: {
    schoolName: string;
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
    XXXL: number;
    total: number;
  }[]
) => {
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

  // Tri-color separator line
  const startX = 14;
  const endX = 196;
  const segmentWidth = (endX - startX) / 3;
  doc.setLineWidth(1);
  doc.setDrawColor(0, 56, 168);
  doc.line(startX, 60, startX + segmentWidth, 60);
  doc.setDrawColor(251, 191, 36);
  doc.line(startX + segmentWidth, 60, startX + (segmentWidth * 2), 60);
  doc.setDrawColor(220, 38, 38);
  doc.line(startX + (segmentWidth * 2), 60, endX, 60);

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("SHIRT SIZES CONSOLIDATED SUMMARY", 14, 70);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${date}`, 14, 76);

  let currentY = 85;
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();

  summaries.forEach((sum, idx) => {
    // Height needed for each school block is approx 30mm
    if (currentY + 30 > pageHeight - 15) {
      doc.addPage();
      currentY = 20; // reset Y on new page
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 56, 168);
    doc.text(`${idx + 1}. ${cleanText(sum.schoolName)}`, 14, currentY);
    doc.setTextColor(0);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Small (S): ${sum.S}`, 20, currentY + 7);
    doc.text(`Medium (M): ${sum.M}`, 70, currentY + 7);
    doc.text(`Large (L): ${sum.L}`, 120, currentY + 7);
    doc.text(`Extra Large (XL): ${sum.XL}`, 20, currentY + 14);
    doc.text(`XXL: ${sum.XXL}`, 70, currentY + 14);
    doc.text(`XXXL: ${sum.XXXL}`, 120, currentY + 14);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Total Shirts: ${sum.total}`, 20, currentY + 21);

    // Draw horizontal separator line
    currentY += 28;
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.5);
    doc.line(14, currentY - 2, 196, currentY - 2);
    currentY += 6; // padding for next item
  });

  doc.save(`RAITE_2026_SHIRT_SIZES_SUMMARY.pdf`);
};
