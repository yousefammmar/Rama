const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let scanPulses = [];
let packets = [];

// Performance-tuned configuration
const particleCount = 60; // Reduced from 80 for O(n^2) efficiency
const connectionDistance = 150;
const particleSpeed = 0.5;

const colors = {
    node: '#0ea5e9',
    link: 'rgba(14, 165, 233, 0.2)',
    packet: '#d946ef',
    pulse: 'rgba(34, 197, 94, 0.1)',
    bg: '#020617'
};

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * particleSpeed;
        this.vy = (Math.random() - 0.5) * particleSpeed;
        this.radius = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.node;
        ctx.fill();
    }
}

class ScanPulse {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.life = 1;
        this.speed = 4;
    }

    update() {
        this.radius += this.speed;
        this.life -= 0.005;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 197, 94, ${this.life * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

class Packet {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.progress = 0;
        this.speed = 0.02 + Math.random() * 0.03;
    }

    update() {
        this.progress += this.speed;
        return this.progress < 1;
    }

    draw() {
        const x = this.p1.x + (this.p2.x - this.p1.x) * this.progress;
        const y = this.p1.y + (this.p2.y - this.p1.y) * this.progress;

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = colors.packet;
        ctx.fill();
    }
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    packets = [];
    scanPulses = [];
}

function drawConnections() {
    // Optimization: Group by opacity or draw individually with minimal state changes
    // Reducing redundant ctx assignments
    ctx.lineWidth = 0.5;

    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distanceSq = dx * dx + dy * dy; // Use distance squared to avoid Math.sqrt

            if (distanceSq < connectionDistance * connectionDistance) {
                const distance = Math.sqrt(distanceSq);
                const opacity = 1 - distance / connectionDistance;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(14, 165, 233, ${opacity * 0.2})`;
                ctx.stroke();

                // Chance to spawn an actual tracked packet
                if (Math.random() > 0.999 && packets.length < 10) {
                    packets.push(new Packet(p1, p2));
                }
            }
        }
    }
}

function animate() {
    // Clear with single fill
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle background pulses (Network Scans) - throttled random
    if (Math.random() > 0.996) {
        scanPulses.push(new ScanPulse(Math.random() * width, Math.random() * height));
    }

    // Use for-loops or filter for performance over large arrays
    for (let i = scanPulses.length - 1; i >= 0; i--) {
        scanPulses[i].update();
        scanPulses[i].draw();
        if (scanPulses[i].life <= 0) scanPulses.splice(i, 1);
    }

    // Packet animation
    for (let i = packets.length - 1; i >= 0; i--) {
        if (!packets[i].update()) {
            packets.splice(i, 1);
        } else {
            packets[i].draw();
        }
    }

    // Particle movement
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    drawConnections();

    requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
resize();
animate();
