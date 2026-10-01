import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { robotoRegularBase64, robotoBoldBase64 } from "./roboto-base64";

interface ReportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: string[];
  data: any[][];
}

const setupFonts = (doc: jsPDF) => {
  doc.addFileToVFS("helvetica-normal.ttf", robotoRegularBase64);
  doc.addFont("helvetica-normal.ttf", "helvetica", "normal");
  doc.addFileToVFS("helvetica-bold.ttf", robotoBoldBase64);
  doc.addFont("helvetica-bold.ttf", "helvetica", "bold");
  doc.setFont("helvetica", "normal");
};

const cleanText = (val: any): any => {
  if (val === null || val === undefined) return "";
  const str = typeof val === "string" ? val : String(val);
  return str
    .replace(/\uFFFD/g, "ñ")
    .replace(/ñ/g, "__nye_lower__")
    .replace(/Ñ/g, "__nye_upper__")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/__nye_lower__/g, "ñ")
    .replace(/__nye_upper__/g, "Ñ");
};

export const generateRAITEReport = (options: ReportOptions) => {
  const title = cleanText(options.title);
  const subtitle = options.subtitle ? cleanText(options.subtitle) : undefined;
  const filename = cleanText(options.filename);
  const columns = options.columns.map(c => cleanText(c));
  const data = options.data.map(row => row.map(cell => cleanText(cell)));
  const doc = new jsPDF();
  setupFonts(doc);
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
  setupFonts(doc);
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
  setupFonts(doc);
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
  setupFonts(doc);
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

export interface CompetitionWinnersPDFData {
  events: Array<{
    id: string;
    title: string;
    category: string | null;
    subcategory?: string | null;
    placement: {
      championSchool: string | null;
      firstRunnerUp: string | null;
      secondRunnerUp: string | null;
    } | null;
  }>;
  specialAwards?: Array<{
    awardTitle: string;
    category: string;
    awardType?: "INDIVIDUAL" | "SCHOOL";
    winnerName?: string | null;
    schoolName?: string | null;
  }>;
  overallPodium?: {
    champions?: Array<{ schoolName: string; schoolAbbr?: string; totalPoints: number }>;
    firstRunnersUp?: Array<{ schoolName: string; schoolAbbr?: string; totalPoints: number }>;
    secondRunnersUp?: Array<{ schoolName: string; schoolAbbr?: string; totalPoints: number }>;
  };
}

export const generateRAITECompetitionWinnersPDF = (data: CompetitionWinnersPDFData) => {
  const doc = new jsPDF();
  setupFonts(doc);
  const date = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Helper to add standard official header
  const addHeader = () => {
    // Add Logos
    doc.addImage("/psite.png", "PNG", 14, 10, 85, 22);
    doc.addImage("/RAITE.png", "PNG", 102, 10, 22, 22);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 56, 168); // RAITE Blue
    doc.text("RAITE", 14, 40);
    const raiteWidth = doc.getTextWidth("RAITE ");
    doc.setTextColor(220, 38, 38); // Red
    doc.text("2026", 14 + raiteWidth, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Regional Assembly on Information Technology Education", 14, 46);
    doc.text("PSITE Region III - Central Luzon", 14, 50);

    // Tri-color separator line (Blue, Yellow, Red)
    const startX = 14;
    const endX = 196;
    const segmentWidth = (endX - startX) / 3;
    doc.setLineWidth(1);
    doc.setDrawColor(0, 56, 168);
    doc.line(startX, 54, startX + segmentWidth, 54);
    doc.setDrawColor(251, 191, 36);
    doc.line(startX + segmentWidth, 54, startX + (segmentWidth * 2), 54);
    doc.setDrawColor(220, 38, 38);
    doc.line(startX + (segmentWidth * 2), 54, endX, 54);

    // Document Title
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 56, 168);
    doc.text("OFFICIAL LIST OF COMPETITION WINNERS & AWARDEES", 14, 63);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(`Official Tabulation Report • Certified on: ${date}`, 14, 68);
  };

  addHeader();

  // 1. Prepare Main Competition Events Table
  const competitionColumns = [
    "#",
    "Competition Event",
    "Category",
    "Champion (1st Place)",
    "1st Runner Up",
    "2nd Runner Up",
  ];

  const competitionRows = data.events.map((ev, idx) => {
    const p = ev.placement;
    return [
      idx + 1,
      cleanText(ev.title),
      cleanText(ev.subcategory || ev.category || "General"),
      p?.championSchool ? cleanText(p.championSchool) : "Pending",
      p?.firstRunnerUp ? cleanText(p.firstRunnerUp) : "Pending",
      p?.secondRunnerUp ? cleanText(p.secondRunnerUp) : "Pending",
    ];
  });

  autoTable(doc, {
    startY: 73,
    head: [competitionColumns],
    body: competitionRows,
    styles: { 
      fontSize: 8, 
      cellPadding: 2.5,
      overflow: "linebreak",
    },
    headStyles: { 
      fillColor: [0, 56, 168], 
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 46, fontStyle: "bold" },
      2: { cellWidth: 26 },
      3: { cellWidth: 36, textColor: [0, 56, 168], fontStyle: "bold" },
      4: { cellWidth: 33 },
      5: { cellWidth: 33 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14, top: 15, bottom: 20 },
  });

  let lastY = (doc as any).lastAutoTable?.finalY || 100;
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();

  // 2. Prepare Special Awards Section (if any awards exist)
  if (data.specialAwards && data.specialAwards.length > 0) {
    if (lastY + 45 > pageHeight - 30) {
      doc.addPage();
      lastY = 20;
    } else {
      lastY += 8;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 56, 168);
    doc.text("SPECIAL AWARDS & INDIVIDUAL RECOGNITIONS (+2 PTS EACH)", 14, lastY);
    doc.setDrawColor(0, 56, 168);
    doc.setLineWidth(0.5);
    doc.line(14, lastY + 2, 196, lastY + 2);

    const specialAwardsColumns = [
      "#",
      "Special Award Title",
      "Category",
      "Awardee / Recipient",
      "Winning School / Institution",
    ];

    const specialAwardsRows = data.specialAwards.map((a, idx) => [
      idx + 1,
      cleanText(a.awardTitle),
      cleanText(a.category),
      a.winnerName && a.winnerName.trim() ? cleanText(a.winnerName) : "—",
      a.schoolName && a.schoolName.trim() ? cleanText(a.schoolName) : "Pending",
    ]);

    autoTable(doc, {
      startY: lastY + 5,
      head: [specialAwardsColumns],
      body: specialAwardsRows,
      styles: { 
        fontSize: 8, 
        cellPadding: 2.5,
        overflow: "linebreak",
      },
      headStyles: { 
        fillColor: [30, 41, 59], 
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 50, fontStyle: "bold" },
        2: { cellWidth: 30 },
        3: { cellWidth: 44 },
        4: { cellWidth: 50, fontStyle: "bold" },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14, top: 15, bottom: 20 },
    });

    lastY = (doc as any).lastAutoTable?.finalY || lastY + 50;
  }

  // 3. Prepare Overall Institutional Podium Summary (if provided)
  if (data.overallPodium && (data.overallPodium.champions?.length || data.overallPodium.firstRunnersUp?.length || data.overallPodium.secondRunnersUp?.length)) {
    if (lastY + 45 > pageHeight - 30) {
      doc.addPage();
      lastY = 20;
    } else {
      lastY += 8;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 56, 168);
    doc.text("CONSOLIDATED OVERALL INSTITUTIONAL PODIUM", 14, lastY);
    doc.setDrawColor(0, 56, 168);
    doc.setLineWidth(0.5);
    doc.line(14, lastY + 2, 196, lastY + 2);

    const podiumColumns = [
      "Overall Rank",
      "Winning Institution(s)",
      "Total Points Accumulated",
    ];

    const podiumRows: any[] = [];
    if (data.overallPodium.champions && data.overallPodium.champions.length > 0) {
      const names = data.overallPodium.champions.map(c => `${c.schoolName} (${c.schoolAbbr || ""})`).join(" & ");
      const pts = data.overallPodium.champions[0].totalPoints;
      podiumRows.push(["OVERALL CHAMPION", cleanText(names), `${pts} Points`]);
    }
    if (data.overallPodium.firstRunnersUp && data.overallPodium.firstRunnersUp.length > 0) {
      const names = data.overallPodium.firstRunnersUp.map(c => `${c.schoolName} (${c.schoolAbbr || ""})`).join(" & ");
      const pts = data.overallPodium.firstRunnersUp[0].totalPoints;
      podiumRows.push(["1ST RUNNER UP (2ND OVERALL)", cleanText(names), `${pts} Points`]);
    }
    if (data.overallPodium.secondRunnersUp && data.overallPodium.secondRunnersUp.length > 0) {
      const names = data.overallPodium.secondRunnersUp.map(c => `${c.schoolName} (${c.schoolAbbr || ""})`).join(" & ");
      const pts = data.overallPodium.secondRunnersUp[0].totalPoints;
      podiumRows.push(["2ND RUNNER UP (3RD OVERALL)", cleanText(names), `${pts} Points`]);
    }

    if (podiumRows.length > 0) {
      autoTable(doc, {
        startY: lastY + 5,
        head: [podiumColumns],
        body: podiumRows,
        styles: { 
          fontSize: 8.5, 
          cellPadding: 3,
        },
        headStyles: { 
          fillColor: [217, 119, 6], // Amber-600
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: "bold" },
          1: { cellWidth: 90, fontStyle: "bold" },
          2: { cellWidth: 37, halign: "center", fontStyle: "bold" },
        },
        alternateRowStyles: { fillColor: [254, 243, 199] },
        margin: { left: 14, right: 14, top: 15, bottom: 20 },
      });

      lastY = (doc as any).lastAutoTable?.finalY || lastY + 35;
    }
  }

  // 4. Official Signatures Section (Print-Ready)
  if (lastY + 40 > pageHeight - 15) {
    doc.addPage();
    lastY = 25;
  } else {
    lastY += 15;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80);

  // 3 signature blocks
  const sigCol1X = 14;
  const sigCol2X = 80;
  const sigCol3X = 144;
  const sigLineWidth = 48;

  doc.text("Prepared & Tabulated by:", sigCol1X, lastY);
  doc.setDrawColor(150);
  doc.setLineWidth(0.5);
  doc.line(sigCol1X, lastY + 18, sigCol1X + sigLineWidth, lastY + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text("Tabulation Committee", sigCol1X, lastY + 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text("RAITE 2026 Secretariat", sigCol1X, lastY + 26);

  doc.setFontSize(8.5);
  doc.setTextColor(80);
  doc.text("Checked & Certified by:", sigCol2X, lastY);
  doc.line(sigCol2X, lastY + 18, sigCol2X + sigLineWidth, lastY + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text("Lead Tabulator / Board of Judges", sigCol2X, lastY + 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text("Evaluation Committee", sigCol2X, lastY + 26);

  doc.setFontSize(8.5);
  doc.setTextColor(80);
  doc.text("Noted & Approved by:", sigCol3X, lastY);
  doc.line(sigCol3X, lastY + 18, sigCol3X + sigLineWidth, lastY + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text("PSITE Region III Officers", sigCol3X, lastY + 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text("Conference Chairperson", sigCol3X, lastY + 26);

  // 5. Add Page Numbers to all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text(
      `RAITE 2026 • Official Competition Winners & Tabulation Report — Page ${i} of ${totalPages}`,
      14,
      pageHeight - 8
    );
  }

  doc.save(`RAITE_2026_OFFICIAL_COMPETITION_WINNERS.pdf`);
};

