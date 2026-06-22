#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix import statements - add .js to relative imports that don't have extensions
    content = content.replace(
      /from ['"](\.[^'"]+)(?<!\.js)['"];/g,
      "from '$1.js';"
    );
    
    // Fix import statements for ES modules
    content = content.replace(
      /import ['"](\.[^'"]+)(?<!\.js)['"];/g,
      "import '$1.js';"
    );
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed: ${filePath}`);
  } catch (err) {
    console.error(`✗ Error fixing ${filePath}:`, err.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js')) {
      fixImportsInFile(filePath);
    }
  });
}

console.log('Fixing ESM imports in dist/');
walkDir(distDir);
console.log('✅ Done!');
