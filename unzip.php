<?php
$zip = new ZipArchive;
if ($zip->open('deploy.zip') === TRUE) {
    $zip->extractTo(__DIR__);
    $zip->close();
    echo '<h2>🎉 Success: Extraction complete!</h2>';
    unlink('unzip.php'); // Deletes this script automatically for security
} else {
    echo '<h2>❌ Error: Extraction failed!</h2>';
}
?>
