import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

// Check if a command exists in the environment path
async function commandExists(cmd: string): Promise<boolean> {
  const checkCmd = process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`;
  try {
    await execAsync(checkCmd);
    return true;
  } catch {
    return false;
  }
}

export async function convertDocxToPdfLocal(docxBuffer: Buffer): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const baseName = `temp-${Date.now()}`;
  const tempDocxPath = path.join(tempDir, `${baseName}.docx`);
  const tempPdfPath = path.join(tempDir, `${baseName}.pdf`);

  // Write docx to temp file
  await fs.promises.writeFile(tempDocxPath, docxBuffer);

  try {
    if (process.platform === "win32") {
      // 1. Try Windows Word COM first (if available)
      try {
        const psCommand = `$word = New-Object -ComObject Word.Application; $word.Visible = $false; $doc = $word.Documents.Open('${tempDocxPath.replace(/'/g, "''")}'); $doc.SaveAs([ref] '${tempPdfPath.replace(/'/g, "''")}', [ref] 17); $doc.Close(); $word.Quit();`;
        await execAsync(`powershell -Command "${psCommand}"`);
        if (fs.existsSync(tempPdfPath)) {
          return await fs.promises.readFile(tempPdfPath);
        }
      } catch (wordErr) {
        console.warn("Word COM conversion failed, trying LibreOffice fallback:", wordErr);
      }
    }

    // 2. Cross-platform LibreOffice / soffice fallback
    const hasSoffice = await commandExists("soffice");
    const hasLibreoffice = !hasSoffice && (await commandExists("libreoffice"));
    const binary = hasSoffice ? "soffice" : hasLibreoffice ? "libreoffice" : null;

    if (binary) {
      // Create a unique profile directory for this execution to avoid permission/locking conflicts in serverless/VPS environments
      const profilePath = path.join(tempDir, `libreoffice_profile_${baseName}`);
      const profileUrl = `file://${profilePath.replace(/\\/g, "/")}`;

      try {
        // Execute LibreOffice headless conversion
        // -env:UserInstallation overrides user configuration directory to avoid lock failures
        await execAsync(`"${binary}" "-env:UserInstallation=${profileUrl}" --headless --convert-to pdf --outdir "${tempDir}" "${tempDocxPath}"`);
        
        // LibreOffice outputs file with same base name but .pdf extension in the outdir
        const expectedPdfPath = path.join(tempDir, `${baseName}.pdf`);
        if (fs.existsSync(expectedPdfPath)) {
          return await fs.promises.readFile(expectedPdfPath);
        }
      } finally {
        // Clean up custom profile directory
        if (fs.existsSync(profilePath)) {
          await fs.promises.rm(profilePath, { recursive: true, force: true }).catch(() => {});
        }
      }
    }

    throw new Error(
      `No docx-to-pdf converter found. Please install LibreOffice (soffice) on your VPS or run on Windows with Microsoft Word installed.`
    );
  } finally {
    // Clean up temp files
    if (fs.existsSync(tempDocxPath)) {
      await fs.promises.unlink(tempDocxPath).catch(() => {});
    }
    if (fs.existsSync(tempPdfPath)) {
      await fs.promises.unlink(tempPdfPath).catch(() => {});
    }
    const fallbackPath = path.join(tempDir, `${baseName}.pdf`);
    if (fs.existsSync(fallbackPath)) {
      await fs.promises.unlink(fallbackPath).catch(() => {});
    }
  }
}
