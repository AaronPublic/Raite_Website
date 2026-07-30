import fs from "fs";
import path from "path";
import { convertDocxToPdfLocal } from "../src/lib/docx-converter";

async function main() {
  const testDocxPath = path.join(process.cwd(), "public/assets/RAITE-2026-Provisional-Programme.docx");
  const outputPdfPath = path.join(process.cwd(), "public/assets/test-output.pdf");

  console.log("Starting docx-to-pdf test conversion...");
  console.log(`Input path: ${testDocxPath}`);
  console.log(`Output path: ${outputPdfPath}`);

  if (!fs.existsSync(testDocxPath)) {
    console.error("Error: Input DOCX file not found in public/assets/RAITE-2026-Provisional-Programme.docx");
    return;
  }

  try {
    const docxBuffer = await fs.promises.readFile(testDocxPath);
    console.log("DOCX file read successfully. Size:", docxBuffer.length, "bytes");

    console.log("Calling convertDocxToPdfLocal...");
    const pdfBuffer = await convertDocxToPdfLocal(docxBuffer);

    console.log("Conversion successful! PDF Size:", pdfBuffer.length, "bytes");
    await fs.promises.writeFile(outputPdfPath, pdfBuffer);
    console.log(`Test PDF saved successfully at: ${outputPdfPath}`);
  } catch (error: any) {
    console.error("Test Conversion Failed!");
    console.error("Error Message:", error.message);
    if (error.stack) {
      console.error("Stack Trace:\n", error.stack);
    }
  }
}

main();
