import { readdir, readFile, writeFile, stat, access } from 'fs/promises';
import { join, dirname, extname, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { constants } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '..', 'dist');

function needsJsExtension(importPath) {
  const validExtensions = ['.js', '.mjs', '.cjs', '.json'];
  return !validExtensions.some(ext => importPath.endsWith(ext));
}

async function resolveImportPath(importPath, fromFile) {
  if (!importPath.startsWith('.')) {
    return importPath; // External module
  }
  
  const fromDir = dirname(fromFile);
  const absolutePath = resolve(fromDir, importPath);
  
  // Check if it's a directory with index.js
  try {
    const stats = await stat(absolutePath);
    if (stats.isDirectory()) {
      const indexPath = join(absolutePath, 'index.js');
      try {
        await access(indexPath, constants.F_OK);
        return importPath + '/index.js';
      } catch {
        // No index.js, keep as is
      }
    }
  } catch {
    // Path doesn't exist yet, might need .js extension
  }
  
  // Check if file exists with .js extension
  if (needsJsExtension(importPath)) {
    try {
      await access(absolutePath + '.js', constants.F_OK);
      return importPath + '.js';
    } catch {
      // File doesn't exist, keep as is
    }
  }
  
  return importPath;
}

async function addJsExtensions(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  let changed = false;
  
  const fixedLines = await Promise.all(lines.map(async (line) => {
    // Match import/export with relative path
    const match = line.match(/((?:import|export).*from\s+['"])(\.[^'"]+)(['"])/);
    if (match) {
      const [, prefix, importPath, suffix] = match;
      const resolved = await resolveImportPath(importPath, filePath);
      if (resolved !== importPath) {
        changed = true;
        return line.replace(match[0], `${prefix}${resolved}${suffix}`);
      }
    }
    
    // Match side-effect import
    const sideEffectMatch = line.match(/(import\s+['"])(\.[^'"]+)(['"])/);
    if (sideEffectMatch) {
      const [, prefix, importPath, suffix] = sideEffectMatch;
      const resolved = await resolveImportPath(importPath, filePath);
      if (resolved !== importPath) {
        changed = true;
        return line.replace(sideEffectMatch[0], `${prefix}${resolved}${suffix}`);
      }
    }
    
    // Match dynamic import
    const dynamicMatch = line.match(/(import\s*\(\s*['"])(\.[^'"]+)(['"])/);
    if (dynamicMatch) {
      const [, prefix, importPath, suffix] = dynamicMatch;
      const resolved = await resolveImportPath(importPath, filePath);
      if (resolved !== importPath) {
        changed = true;
        return line.replace(dynamicMatch[0], `${prefix}${resolved}${suffix}`);
      }
    }
    
    return line;
  }));
  
  if (changed) {
    await writeFile(filePath, fixedLines.join('\n'), 'utf-8');
    console.log(`Fixed: ${relative(distDir, filePath)}`);
  }
}

async function processDirectory(dir) {
  const entries = await readdir(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = await stat(fullPath);
    
    if (stats.isDirectory()) {
      await processDirectory(fullPath);
    } else if (stats.isFile() && extname(entry) === '.js') {
      await addJsExtensions(fullPath);
    }
  }
}

console.log('Adding .js extensions to ESM imports...');
await processDirectory(distDir);
console.log('Done!');
