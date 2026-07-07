/**
 * Flower geometry and rendering utilities
 * Draws SVG/Canvas-based flowers with customizable parameters
 */

// Helper to convert hex to rgba
const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const drawFlower = (ctx, options = {}) => {
  const {
    x = 0,
    y = 0,
    size = 100,
    petals = 8,
    color = '#ff6b9d',
    colorSecondary = '#ff8fab',
    rotation = 0,
    bloomProgress = 1, // 0 to 1
    glowColor = null,
    withStem = true,
  } = options;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Glow effect
  if (glowColor) {
    ctx.shadowBlur = 30;
    ctx.shadowColor = glowColor;
  }

  // Draw stem
  if (withStem) {
    const stemHeight = size * 1.5 * bloomProgress;
    const grad = ctx.createLinearGradient(0, 0, 0, stemHeight);
    grad.addColorStop(0, '#4a7c59');
    grad.addColorStop(1, '#2d6a4f');
    ctx.strokeStyle = grad;
    ctx.lineWidth = size * 0.06;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(size * 0.1, size * 0.8, -size * 0.1, size, 0, stemHeight);
    ctx.stroke();
  }

  // Draw petals
  const petalProgress = bloomProgress;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    const petalSize = size * 0.45 * petalProgress;
    
    ctx.save();
    ctx.rotate(angle);
    
    // Petal gradient - use safe color strings
    const safeColor = color.startsWith('#') && color.length === 7 ? color : '#ff6b9d';
    const safeSecondary = colorSecondary.startsWith('#') && colorSecondary.length === 7 ? colorSecondary : safeColor;
    
    const grad = ctx.createRadialGradient(0, -petalSize * 0.3, 0, 0, -petalSize * 0.5, petalSize);
    grad.addColorStop(0, safeSecondary);
    grad.addColorStop(0.5, safeColor);
    grad.addColorStop(1, hexToRgba(safeColor, 0.4));
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -petalSize * 0.6, petalSize * 0.35, petalSize * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Petal vein
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -petalSize * 1.1);
    ctx.stroke();
    
    ctx.restore();
  }

  // Draw center
  const centerSize = size * 0.2 * bloomProgress;
  const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, centerSize);
  centerGrad.addColorStop(0, '#fcd34d');
  centerGrad.addColorStop(0.5, '#f59e0b');
  centerGrad.addColorStop(1, '#d97706');
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
  ctx.fill();

  // Center dots (pollen)
  for (let i = 0; i < Math.floor(8 * bloomProgress); i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = centerSize * 0.65;
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

// Generate SVG path for a flower petal
export const getPetalPath = (size) => {
  const h = size;
  const w = size * 0.4;
  return `M 0 0 C ${w} ${-h * 0.3} ${w} ${-h * 0.7} 0 ${-h} C ${-w} ${-h * 0.7} ${-w} ${-h * 0.3} 0 0`;
};

// Color palettes
export const COLOR_PALETTES = [
  { name: 'Rose', colors: ['#ff6b9d', '#ff8fab', '#ffd6e0'] },
  { name: 'Violet', colors: ['#9d4edd', '#c77dff', '#e0aaff'] },
  { name: 'Sunrise', colors: ['#ffd60a', '#ffa500', '#ff6b35'] },
  { name: 'Ocean', colors: ['#7dd3fc', '#38bdf8', '#0ea5e9'] },
  { name: 'Forest', colors: ['#86efac', '#4ade80', '#22c55e'] },
  { name: 'Cosmic', colors: ['#c4b5fd', '#7dd3fc', '#fcd34d'] },
  { name: 'Sakura', colors: ['#ffb3c6', '#ff6b9d', '#ffd6e0'] },
  { name: 'Gold', colors: ['#fcd34d', '#f59e0b', '#d97706'] },
];
