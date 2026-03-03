const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

// Create www directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
}

// Files to copy
const filesToCopy = [
    'index.html',
    'sw.js',
    'manifest.json',
    'icon-192.png',
    'icon-512.png',
    'black on white logo.jpeg',
    'black on white logo.png',
    'white on black logo.jpeg',
    'white on black logo.png',
    'ybecos.txt'
];

filesToCopy.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file} to www/`);
    }
});

console.log('Build complete.');
