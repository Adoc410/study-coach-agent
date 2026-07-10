const fs = require('fs');
const path = require('path');

function walk(dir, files) {
  files = files || [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (full.indexOf('node_modules') === -1 && full.indexOf('.next') === -1) {
        walk(full, files);
      }
    } else if (/\.(js|jsx)$/.test(f)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk('app');
const importRe = /from\s+['"](\.[^'"]+)['"]/g;
let foundAny = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  importRe.lastIndex = 0;
  while ((m = importRe.exec(content))) {
    const target = path.resolve(path.dirname(file), m[1]);
    const candidates = [
      target,
      target + '.js',
      target + '.jsx',
      path.join(target, 'index.js'),
      path.join(target, 'index.jsx')
    ];
    const exists = candidates.some(c => fs.existsSync(c));
    if (!exists) {
      console.log(file + ' -> ' + m[1] + '  NOT FOUND');
      foundAny = true;
    }
  }
}

if (!foundAny) console.log('No broken relative imports found.');
