#!/usr/bin/env node

/**
 * Generate placeholder images for pack assets
 * Creates simple colored rectangles with text labels as placeholders
 */

const fs = require('fs');
const path = require('path');

// Canvas API for Node.js (we'll use a simple SVG approach instead)
function createPlaceholderSVG(width, height, backgroundColor, textColor, text) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
        text-anchor="middle" dominant-baseline="middle" fill="${textColor}">
    ${text}
  </text>
</svg>`;
}

// Pack image configurations
const packImages = [
  { name: 'portraits.jpg', color: '#E3F2FD', textColor: '#1565C0', text: 'Portraits' },
  { name: 'animals.jpg', color: '#E8F5E8', textColor: '#2E7D32', text: 'Animals' },
  { name: 'basic-shapes.jpg', color: '#FFF3E0', textColor: '#F57C00', text: 'Basic Shapes' },
  { name: 'botanical.jpg', color: '#F3E5F5', textColor: '#7B1FA2', text: 'Botanical' },
  { name: 'landscapes.jpg', color: '#E0F2F1', textColor: '#00695C', text: 'Landscapes' },
  { name: 'fantasy.jpg', color: '#FCE4EC', textColor: '#C2185B', text: 'Fantasy' },
];

// Learning pack images
const learningPacks = [
  { dir: 'ocean-life', name: 'thumbnail.jpg', color: '#E1F5FE', textColor: '#0277BD', text: 'Ocean Life' },
  { dir: 'ocean-life', name: 'background.jpg', color: '#B3E5FC', textColor: '#01579B', text: 'Ocean Background' },
  { dir: 'space-exploration', name: 'thumbnail.jpg', color: '#E8EAF6', textColor: '#3F51B5', text: 'Space' },
  { dir: 'space-exploration', name: 'background.jpg', color: '#C5CAE9', textColor: '#283593', text: 'Space Background' },
  { dir: 'dinosaur-world', name: 'thumbnail.jpg', color: '#EFEBE9', textColor: '#5D4037', text: 'Dinosaurs' },
  { dir: 'dinosaur-world', name: 'background.jpg', color: '#D7CCC8', textColor: '#3E2723', text: 'Dinosaur Background' },
  { dir: 'jungle-safari', name: 'thumbnail.jpg', color: '#E8F5E8', textColor: '#388E3C', text: 'Jungle Safari' },
  { dir: 'jungle-safari', name: 'background.jpg', color: '#C8E6C9', textColor: '#1B5E20', text: 'Jungle Background' },
];

// Ensure directories exist
const webPublicDir = path.join(__dirname, '..', 'apps', 'web', 'public');
const imagesPacksDir = path.join(webPublicDir, 'images', 'packs');
const packsDir = path.join(webPublicDir, 'packs');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Create directories
ensureDir(imagesPacksDir);
ensureDir(packsDir);

// Generate pack images in /images/packs/
console.log('Generating pack images...');
packImages.forEach(({ name, color, textColor, text }) => {
  const svgContent = createPlaceholderSVG(400, 250, color, textColor, text);
  const filePath = path.join(imagesPacksDir, name.replace('.jpg', '.svg'));
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created: ${filePath}`);
});

// Generate learning pack images in /packs/
console.log('Generating learning pack images...');
learningPacks.forEach(({ dir, name, color, textColor, text }) => {
  const packDir = path.join(packsDir, dir);
  ensureDir(packDir);
  
  const svgContent = createPlaceholderSVG(400, 250, color, textColor, text);
  const filePath = path.join(packDir, name.replace('.jpg', '.svg'));
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created: ${filePath}`);
});

console.log('✅ Placeholder images generated successfully!');
console.log('Note: Images are in SVG format. For production, consider replacing with actual JPG images.');
