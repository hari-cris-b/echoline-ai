import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to copy directory recursively
function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`Warning: Source not found: ${src}`);
        return;
    }

    if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
            console.log(`Created directory: ${dest}`);
        }

        const entries = fs.readdirSync(src);
        for (const entry of entries) {
            const srcPath = path.join(src, entry);
            const destPath = path.join(dest, entry);
            copyRecursive(srcPath, destPath);
        }
    } else {
        fs.copyFileSync(src, dest);
        console.log(`Copied: ${src} -> ${dest}`);
    }
}

// Clean and create public directory
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
    console.log('Cleaned public directory');
}

fs.mkdirSync(publicDir, { recursive: true });
console.log('Created public directory');

// Copy static files to public directory
const staticDirs = ['css', 'js', 'assets', 'images'];
staticDirs.forEach(dir => {
    const srcDir = path.join(__dirname, dir);
    if (fs.existsSync(srcDir)) {
        copyRecursive(srcDir, path.join(publicDir, dir));
    }
});

// Copy index.html to public directory
const indexSrc = path.join(__dirname, 'index.html');
if (fs.existsSync(indexSrc)) {
    fs.copyFileSync(indexSrc, path.join(publicDir, 'index.html'));
    console.log(`Copied: ${indexSrc} -> ${path.join(publicDir, 'index.html')}`);
}
