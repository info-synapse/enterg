// Turns the single-file Vite build into the page format used for the shareable preview link
// (no <html>/<head>/<body> wrapper: the host adds its own).
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('dist-artifact/index.html', 'utf8');
const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const links = html.match(/<link[^>]+fonts\.(googleapis|gstatic)[^>]*>/g) ?? [];
const styles = html.match(/<style[^>]*>[\s\S]*?<\/style>/g) ?? [];
const scripts = html.match(/<script type="module"[^>]*>[\s\S]*?<\/script>/g) ?? [];
const out = [title, ...links, ...styles, '<div id="root"></div>', ...scripts].join('\n');
writeFileSync('dist-artifact/enterg.html', out);
console.log('wrote dist-artifact/enterg.html', (out.length / 1024).toFixed(0) + ' KB', 'scripts:', scripts.length, 'styles:', styles.length);
