import './style.css'

// ═══════════════════════════════════════════════
// 3D PARTICLE SPHERE — Maze HQ style
// ═══════════════════════════════════════════════
function initParticleSphere() {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hero = canvas.parentElement as HTMLElement;

    function resize() {
        canvas!.width = hero.offsetWidth || window.innerWidth;
        canvas!.height = hero.offsetHeight || window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Sphere points ──
    const TOTAL = 1800;
    const RADIUS = Math.min(canvas.width, canvas.height) * 0.32;

    interface Dot {
        ox: number; oy: number; oz: number;   // original sphere coords
        color: string;
        size: number;
    }

    const COLORS = ['#22d3ee', '#22d3ee', '#22d3ee', '#a855f7', '#a855f7', '#818cf8'];

    // Fibonacci sphere distribution
    const dots: Dot[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < TOTAL; i++) {
        const y = 1 - (i / (TOTAL - 1)) * 2;           // -1 → 1
        const rad = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;
        dots.push({
            ox: Math.cos(theta) * rad,
            oy: y,
            oz: Math.sin(theta) * rad,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: Math.random() * 1.6 + 0.5,
        });
    }

    let rotX = 0;
    let rotY = 0;
    let mouse = { x: 0, y: 0 };

    // Subtle mouse influence
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth - 0.5) * 0.4;
        mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
    });

    function draw(ts: number) {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

        // Auto-rotate + mouse influence
        rotY = ts * 0.00018 + mouse.x;
        rotX = ts * 0.00006 + mouse.y;

        const cx = canvas!.width / 2;
        const cy = canvas!.height / 2;

        const sinY = Math.sin(rotY), cosY = Math.cos(rotY);
        const sinX = Math.sin(rotX), cosX = Math.cos(rotX);

        // Project each dot
        type Projected = { x: number; y: number; z: number; size: number; color: string; alpha: number };
        const projected: Projected[] = dots.map(d => {
            // Rotate Y
            const x1 = d.ox * cosY - d.oz * sinY;
            const z1 = d.ox * sinY + d.oz * cosY;
            // Rotate X
            const y1 = d.oy * cosX - z1 * sinX;
            const z2 = d.oy * sinX + z1 * cosX;

            // Perspective
            const fov = 1.6;
            const scale = fov / (fov + z2);
            const xp = cx + x1 * RADIUS * scale;
            const yp = cy + y1 * RADIUS * scale;

            // Alpha based on z depth (front = bright, back = dim)
            const alpha = 0.15 + ((z2 + 1) / 2) * 0.75;

            return { x: xp, y: yp, z: z2, size: d.size * scale, color: d.color, alpha };
        });

        // Sort by z so front dots render on top
        projected.sort((a, b) => a.z - b.z);

        // Draw connection lines between nearby projected dots (sparse, front only)
        ctx!.lineWidth = 0.4;
        for (let i = 0; i < projected.length; i += 4) {
            const a = projected[i];
            if (a.z < 0.2) continue; // only front half
            for (let j = i + 1; j < projected.length; j += 4) {
                const b = projected[j];
                if (b.z < 0.2) continue;
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 28) {
                    ctx!.beginPath();
                    ctx!.moveTo(a.x, a.y);
                    ctx!.lineTo(b.x, b.y);
                    ctx!.strokeStyle = '#22d3ee';
                    ctx!.globalAlpha = (1 - dist / 28) * 0.07 * a.alpha;
                    ctx!.stroke();
                }
            }
        }

        // Draw dots
        for (const p of projected) {
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx!.fillStyle = p.color;
            ctx!.globalAlpha = p.alpha * 0.85;
            ctx!.fill();
        }

        ctx!.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
}

initParticleSphere();

// ═══════════════════════════════════════════════
// NAVBAR — floating pill on scroll (Maze style)
// ═══════════════════════════════════════════════
const nav = document.querySelector('.glass-nav') as HTMLElement | null;
window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        nav?.classList.add('scrolled');
    } else {
        nav?.classList.remove('scrolled');
    }
});

// ═══════════════════════════════════════════════
// TECH TABS
// ═══════════════════════════════════════════════
const tabs = document.querySelectorAll('.tech-chip');
const techGrids = document.querySelectorAll('.tech-grid');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        techGrids.forEach(g => g.classList.remove('active'));
        tab.classList.add('active');
        const targetId = (tab as HTMLElement).dataset.target;
        const targetGrid = document.getElementById(targetId!);
        if (targetGrid) targetGrid.classList.add('active');
    });
});

// ═══════════════════════════════════════════════
// SCROLL-TO-TOP
// ═══════════════════════════════════════════════
const scrollTopBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
        scrollTopBtn?.classList.add('visible');
    } else {
        scrollTopBtn?.classList.remove('visible');
    }
});
scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ═══════════════════════════════════════════════
// CONTACT FORM TOAST
// ═══════════════════════════════════════════════
const contactForm = document.querySelector('.contact-form') as HTMLFormElement | null;
if (contactForm) {
    const toast = document.createElement('div');
    toast.className = 'form-toast';
    toast.innerHTML = '✓ &nbsp; Message sent! We\'ll be in touch soon.';
    document.body.appendChild(toast);

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        toast.classList.add('show');
        contactForm.reset();
        setTimeout(() => toast.classList.remove('show'), 4000);
    });
}

console.log('Makendone Technologies — Maze Dark Mode Online');
