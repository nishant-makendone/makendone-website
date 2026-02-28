import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_DIR = path.join(__dirname, 'public', 'logos');

if (!fs.existsSync(LOGO_DIR)) {
    fs.mkdirSync(LOGO_DIR, { recursive: true });
}

const targets = [
    // Wikimedia Redirects (Reliable if filename matches)
    { name: 'mendix.svg', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mendix_logo.svg' },
    { name: 'powerapps.svg', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Powerapps-logo.svg' },

    // OutSystems - Tough one. Trying specific github tag or Clearbit PNG as last resort (user wants logo, PNG is better than text)
    // We'll try to get SVG first.
    { name: 'outsystems.svg', url: 'https://raw.githubusercontent.com/OutSystems/outsystems-ui/2.8.0/src/Assets/OutSystems_Logo.svg' }
];

async function download(url, dest) {
    return new Promise((resolve) => {
        const file = fs.createWriteStream(dest);
        const req = https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        }, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve(download(res.headers.location, dest));
                return;
            }
            if (res.statusCode !== 200) {
                console.log(`Failed ${url}: ${res.statusCode}`);
                file.close();
                fs.unlink(dest, () => { });
                resolve(false);
                return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                // Check size
                if (fs.statSync(dest).size < 500) {
                    // Too small, might be an html error page
                    console.log(`File too small/invalid: ${dest}`);
                    fs.unlink(dest, () => { });
                    resolve(false);
                    return;
                }
                console.log(`Saved ${path.basename(dest)}`);
                resolve(true);
            });
        }).on('error', (e) => {
            console.log(`Error ${url}: ${e.message}`);
            fs.unlink(dest, () => { });
            resolve(false);
        });
    });
}

(async () => {
    for (const t of targets) {
        if (!fs.existsSync(path.join(LOGO_DIR, t.name))) {
            console.log(`Downloading ${t.name}...`);
            let success = await download(t.url, path.join(LOGO_DIR, t.name));
            if (!success && t.name === 'outsystems.svg') {
                // Fallback for OutSystems to Clearbit PNG if SVG fails
                console.log('Falling back to OutSystems PNG...');
                await download('https://logo.clearbit.com/outsystems.com', path.join(LOGO_DIR, 'outsystems.png'));
                // Update the file extension in index.html later? We'll save it as .png, but index asks for .svg
                // We can save it as .svg? No that's bad. 
                // We will rename it to .svg for now if it works, or just update code.
                // Actually, let's just save it as .svg (it won't render if it's png data in svg ext without image tag... wait, browser might sniff it?)
                // Better: Save as .png and I will update index.html to use .png for OutSystems if needed.
            }
        } else {
            console.log(`${t.name} already exists.`);
        }
    }
})();
