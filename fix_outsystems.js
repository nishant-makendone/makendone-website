import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_DIR = path.join(__dirname, 'public', 'logos');

async function download(url, dest) {
    return new Promise((resolve) => {
        const file = fs.createWriteStream(dest);
        const req = https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }, (res) => {
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
    // OutSystems PNG
    await download('https://commons.wikimedia.org/wiki/Special:FilePath/OS-logo-color_500x108.png', path.join(LOGO_DIR, 'outsystems.png'));
})();
