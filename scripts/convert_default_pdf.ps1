$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = "C:\Users\AJ\IAS\Raite_Website\public\assets\RAITE-2026-Provisional-Programme.docx"
$pdfPath = "C:\Users\AJ\IAS\Raite_Website\public\assets\RAITE-2026-Provisional-Programme.pdf"

try {
    Write-Host "Opening document: $docPath"
    $doc = $word.Documents.Open($docPath)
    Write-Host "Saving as PDF: $pdfPath"
    # 17 represents wdFormatPDF
    $doc.SaveAs([ref] $pdfPath, [ref] 17)
    $doc.Close()
    Write-Host "Conversion successful!"
} catch {
    Write-Error "Failed to convert document: $_"
} finally {
    $word.Quit()
}
