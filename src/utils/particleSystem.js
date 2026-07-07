/**
 * Particle system for HandBloom AI
 * Creates floating particles, pollen effects, and sparkles
 */

export class Particle {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reset(options);
  }

  reset(options = {}) {
    this.x = options.x ?? Math.random() * this.canvas.width;
    this.y = options.y ?? Math.random() * this.canvas.height;
    this.size = options.size ?? Math.random() * 4 + 1;
    this.speedX = (Math.random() - 0.5) * (options.speed ?? 1);
    this.speedY = (Math.random() - 0.5) * (options.speed ?? 1) - 0.5;
    this.opacity = Math.random() * 0.8 + 0.2;
    this.decay = Math.random() * 0.003 + 0.001;
    this.color = options.color ?? this.randomColor();
    this.type = options.type ?? 'circle'; // 'circle', 'pollen', 'sparkle', 'petal'
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    this.life = 1;
    this.maxLife = Math.random() * 200 + 100;
    this.currentLife = 0;
    this.glow = options.glow ?? true;
  }

  randomColor() {
    const colors = [
      'rgba(134, 239, 172, ',  // soft green
      'rgba(196, 181, 253, ',  // lavender
      'rgba(125, 211, 252, ',  // sky blue
      'rgba(252, 211, 77, ',   // gold
      'rgba(249, 168, 212, ',  // pink
      'rgba(255, 255, 255, ',  // white
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;
    this.currentLife++;
    this.life = 1 - (this.currentLife / this.maxLife);
    
    // Gentle drift
    this.speedX += (Math.random() - 0.5) * 0.01;
    this.speedY -= 0.005; // slight upward drift

    return this.life > 0;
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = this.life * this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.glow) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color + '0.8)';
    }

    switch (this.type) {
      case 'pollen':
        this.drawPollen(ctx);
        break;
      case 'sparkle':
        this.drawSparkle(ctx);
        break;
      case 'petal':
        this.drawPetal(ctx);
        break;
      default:
        this.drawCircle(ctx);
    }

    ctx.restore();
  }

  drawCircle(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color + this.opacity + ')';
    ctx.fill();
  }

  drawPollen(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(252, 211, 77, ' + this.opacity + ')';
    ctx.fill();
    // Glow ring
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(252, 211, 77, ' + (this.opacity * 0.3) + ')';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawSparkle(ctx) {
    const s = this.size;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * s * 2, Math.sin(angle) * s * 2);
    }
    ctx.strokeStyle = this.color + this.opacity + ')';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawPetal(ctx) {
    ctx.beginPath();
    ctx.ellipse(0, -this.size, this.size * 0.5, this.size * 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.color + (this.opacity * 0.7) + ')';
    ctx.fill();
  }
}

export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.particles = [];
    this.maxParticles = 150;
    this.animationId = null;
  }

  spawn(count = 5, options = {}) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length < this.maxParticles) {
        this.particles.push(new Particle(this.canvas, options));
      }
    }
  }

  update() {
    this.particles = this.particles.filter(p => p.update());
    // Auto-spawn ambient particles
    if (this.particles.length < 60 && Math.random() < 0.3) {
      this.spawn(1, { type: ['circle', 'pollen', 'sparkle'][Math.floor(Math.random() * 3)] });
    }
  }

  draw() {
    this.particles.forEach(p => p.draw());
  }

  start() {
    const loop = () => {
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  burst(x, y, count = 20, color = null) {
    for (let i = 0; i < count; i++) {
      this.spawn(1, {
        x,
        y,
        speed: 3,
        size: Math.random() * 5 + 2,
        color: color ?? null,
        type: ['pollen', 'sparkle', 'circle'][Math.floor(Math.random() * 3)],
      });
    }
  }
}
