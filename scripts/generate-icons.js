const fs = require('fs');
const path = require('path');

// Simple SVG icon for AWOS
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad1)" rx="80"/>
  
  <!-- Weather symbols -->
  <circle cx="180" cy="150" r="40" fill="white" opacity="0.9"/>
  <path d="M100 220 C100 200, 120 180, 140 180 L220 180 C240 180, 260 200, 260 220 C260 240, 240 260, 220 260 L140 260 C120 260, 100 240, 100 220 Z" fill="white" opacity="0.7"/>
  
  <!-- Wind arrows -->
  <path d="M320 120 L400 120 L390 110 M400 120 L390 130" stroke="white" stroke-width="8" fill="none" opacity="0.8"/>
  <path d="M320 160 L420 160 L410 150 M420 160 L410 170" stroke="white" stroke-width="6" fill="none" opacity="0.6"/>
  
  <!-- Data lines -->
  <rect x="80" y="320" width="120" height="8" fill="white" opacity="0.9"/>
  <rect x="80" y="340" width="160" height="8" fill="white" opacity="0.7"/>
  <rect x="80" y="360" width="100" height="8" fill="white" opacity="0.5"/>
  
  <!-- Station indicator -->
  <rect x="320" y="300" width="120" height="120" fill="none" stroke="white" stroke-width="4" opacity="0.8"/>
  <circle cx="380" cy="360" r="20" fill="white" opacity="0.9"/>
  
  <!-- AWOS text -->
  <text x="256" y="460" text-anchor="middle" fill="white" font-family="Arial" font-size="48" font-weight="bold">AWOS</text>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// For now, we'll create SVG placeholders for each size
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // Create a simple placeholder file (in a real scenario, you'd convert SVG to PNG)
  // For now, we'll copy the SVG content as a reference
  const placeholderSvg = svgIcon.replace('512', size.toString());
  const svgFilename = `icon-${size}x${size}.svg`;
  const svgFilepath = path.join(iconsDir, svgFilename);
  
  fs.writeFileSync(svgFilepath, placeholderSvg);
  console.log(`Created ${svgFilename}`);
});

console.log('Icon placeholders created. Please convert SVG files to PNG format using an image converter.');
console.log('Recommended tools: ImageMagick, online converters, or design tools like Figma/Sketch.');

module.exports = { svgIcon };
