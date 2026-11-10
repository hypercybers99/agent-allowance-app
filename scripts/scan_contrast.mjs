function luminance(hex) {
  const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
  const a = rgb.map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const checks = [
  { name: 'Light Ink on Page Bg', fg: '#1E2523', bg: '#F6F4EE', min: 4.5 },
  { name: 'White Text on Deep Slate-Teal', fg: '#FFFFFF', bg: '#2D5B63', min: 4.5 },
  { name: 'Light Clay Warning on Sand Card', fg: '#943D1A', bg: '#ECE7DB', min: 4.5 },
  { name: 'Light Brick Error on Page Bg', fg: '#A83226', bg: '#F6F4EE', min: 4.5 },
  { name: 'Sage Text on Sage Bg', fg: '#1B5E20', bg: '#DCE8DD', min: 4.5 },
  { name: 'Dark Off-white on Charcoal Bg', fg: '#F6F4EE', bg: '#161D1A', min: 4.5 },
  { name: 'Dark Sand Card on Charcoal Bg', fg: '#ECE7DB', bg: '#1E2824', min: 4.5 },
];

let failed = 0;
console.log('======================================================');
console.log('CONTRAST RATIO AUDIT (WCAG AA 4.5:1)');
console.log('======================================================');

for (const c of checks) {
  const ratio = contrastRatio(c.fg, c.bg);
  const pass = ratio >= c.min;
  console.log(`${c.name.padEnd(38)}: ${ratio.toFixed(2)}:1 (Min ${c.min}:1) -> ${pass ? 'PASS' : 'FAIL'}`);
  if (!pass) failed++;
}

if (failed > 0) {
  console.error(`\nContrast audit failed: ${failed} combinations below 4.5:1 ratio!`);
  process.exit(1);
} else {
  console.log('\nContrast audit passed: All theme combinations exceed 4.5:1 WCAG AA standard.');
}
