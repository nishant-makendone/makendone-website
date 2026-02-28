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

// Fallback chain
const sources = [
    // 1. Devicon main repo (master) - most likely correct if unblocked
    {
        base: 'https://raw.githubusercontent.com/devicon/devicon/master/icons',
        validate: (res) => res.statusCode === 200
    },
    // 2. Devicon via JSDelivr (no version tag to default to master/main)
    {
        base: 'https://cdn.jsdelivr.net/gh/devicon/devicon/icons',
        validate: (res) => res.statusCode === 200
    },
    // 3. Simple Icons (fallback, monochrome but reliable)
    {
        base: 'https://cdn.simpleicons.org',
        isSimpleIcon: true,
        validate: (res) => res.statusCode === 200
    }
];

// Map names to SimpleIcons equivalent (if different)
const simpleIconsMap = {
    'html5': 'html5',
    'css3': 'css3',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'react': 'react',
    'angular': 'angular',
    'vuejs': 'vuedotjs', // vue.js -> vuedotjs
    'nodejs': 'nodedotjs',
    'dotnetcore': 'dotnet',
    'php': 'php',
    'java': 'java', // might not exist on simpleicons directly? check
    'python': 'python',
    'flutter': 'flutter',
    'ionic': 'ionic',
    'apple': 'apple',
    'android': 'android',
    'chrome': 'googlechrome',
    'salesforce': 'salesforce',
    'amazonwebservices': 'amazonaws',
    'azure': 'azure', // microsoftazure?
    'googlecloud': 'googlecloud',
    'docker': 'docker',
    'kubernetes': 'kubernetes',
    'jenkins': 'jenkins',
    'gitlab': 'gitlab',
    'terraform': 'terraform',
    'mssql': 'microsoftsqlserver',
    'mysql': 'mysql',
    'mongodb': 'mongodb',
    'oracle': 'oracle',
    'postgresql': 'postgresql',
    'tensorflow': 'tensorflow',
    'pytorch': 'pytorch',
    'selenium': 'selenium',
    'jest': 'jest',
    'cucumber': 'cucumber',
    'mocha': 'mocha',
    'mendix': 'mendix',
    'outsystems': 'outsystems', // check existence
    'powerapps': 'powerapps'    // check existence
};

const targets = [
    { name: 'mendix', variants: ['original', 'plain'] },
    { name: 'outsystems', variants: ['original', 'plain'], url: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/OutSystems_Logo_black.svg' },
    { name: 'simplifier', url: 'https://placehold.co/100x100/76b900/ffffff.png?text=SP', ext: '.png' },
    { name: 'powerapps', variants: ['original', 'plain'], url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Microsoft_Power_Apps_logo.svg' },

    { name: 'html5', variants: ['original', 'plain'] },
    { name: 'css3', variants: ['original', 'plain'] },
    { name: 'javascript', variants: ['original', 'plain'] },
    { name: 'typescript', variants: ['original', 'plain'] },
    { name: 'react', variants: ['original', 'original-wordmark'] },
    { name: 'angular', folder: 'angularjs', variants: ['original', 'plain'] },
    { name: 'vuejs', variants: ['original', 'plain'] },
    { name: 'nodejs', variants: ['original', 'plain', 'original-wordmark'] },
    { name: 'dotnetcore', variants: ['original', 'plain'] },
    { name: 'php', variants: ['original', 'plain'] },
    { name: 'java', variants: ['original', 'plain'] },
    { name: 'python', variants: ['original', 'plain'] },

    { name: 'flutter', variants: ['original', 'plain'] },
    { name: 'ionic', variants: ['original', 'original-wordmark'] },
    { name: 'apple', variants: ['original', 'original-wordmark'] },
    { name: 'android', variants: ['original', 'plain'] },
    { name: 'chrome', variants: ['original', 'plain'] },

    { name: 'salesforce', variants: ['original', 'plain'] },
    { name: 'amazonwebservices', filename: 'aws', variants: ['original-wordmark', 'plain-wordmark', 'original'] },
    { name: 'azure', variants: ['original', 'plain'] },
    { name: 'googlecloud', variants: ['original', 'plain'] },
    { name: 'docker', variants: ['original', 'plain'] },
    { name: 'kubernetes', variants: ['plain', 'original'] },
    { name: 'jenkins', variants: ['original', 'plain'] },
    { name: 'gitlab', variants: ['original', 'plain'] },
    { name: 'terraform', variants: ['original', 'plain'] },

    { name: 'microsoftsqlserver', filename: 'mssql', variants: ['plain', 'original'] },
    { name: 'mysql', variants: ['original', 'plain'] },
    { name: 'mongodb', variants: ['original', 'plain'] },
    { name: 'oracle', variants: ['original', 'plain'] },
    { name: 'postgresql', variants: ['original', 'plain'] },
    { name: 'tensorflow', variants: ['original', 'plain'] },
    { name: 'pytorch', variants: ['original', 'plain'] },

    { name: 'selenium', variants: ['original', 'plain'] },
    { name: 'jest', variants: ['plain', 'original'] },
    { name: 'cucumber', variants: ['plain', 'original'] },
    { name: 'mocha', variants: ['plain', 'original'] }
];

function download(url, dest) {
    return new Promise((resolve) => {
        const file = fs.createWriteStream(dest);
        const req = https.get(url, {
            headers: { 'User-Agent': 'NodeJS Downloader/1.0' }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve(download(res.headers.location, dest));
                return;
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlink(dest, () => { });
                resolve(false);
                return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            resolve(false);
        });
    });
}

async function processLogo(target) {
    const filename = (target.filename || target.name) + (target.ext || '.svg');
    const dest = path.join(LOGO_DIR, filename);

    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
        // Skip if already downloaded and valid
        console.log(`Skipping ${filename} (already exists)`);
        return;
    }

    // 0. Explicit URL
    if (target.url) {
        console.log(`Trying explicit: ${target.url}`);
        if (await download(target.url, dest)) {
            console.log(`✓ Downloaded ${filename} from explicit URL`);
            return;
        }
    }

    // 1 & 2. Devicon Variants (Master & JSDelivr)
    const folder = target.folder || target.name;
    const variants = target.variants || ['original', 'plain'];

    for (const source of sources) {
        if (source.isSimpleIcon) continue; // Handle separate

        for (const variant of variants) {
            const url = `${source.base}/${folder}/${folder}-${variant}.svg`;
            console.log(`Trying ${url}...`);
            if (await download(url, dest)) {
                console.log(`✓ Downloaded ${filename} from ${source.base}`);
                return;
            }
        }
    }

    // 3. Simple Icons (fallback)
    const simpleName = simpleIconsMap[target.name] || target.name;
    const simpleUrl = `https://cdn.simpleicons.org/${simpleName}`;
    console.log(`Trying SimpleIcon: ${simpleUrl}...`);
    if (await download(simpleUrl, dest)) {
        console.log(`✓ Downloaded ${filename} from SimpleIcons`);
        return;
    }

    // 4. Placeholder (Final Resort)
    const placeUrl = `https://placehold.co/100x100/333333/ffffff.svg?text=${(target.filename || target.name).substring(0, 2).toUpperCase()}`;
    console.log(`Using placeholder for ${filename}`);
    await download(placeUrl, dest);
}

(async () => {
    const chunkSize = 5;
    for (let i = 0; i < targets.length; i += chunkSize) {
        const chunk = targets.slice(i, i + chunkSize);
        await Promise.all(chunk.map(processLogo));
    }
    console.log('Done processing logos.');
})();
