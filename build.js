const fs = require('fs');
const path = require('path');

console.log('🔧 Starting build process...');

// Criar pasta public se não existir
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
  console.log('📁 Created public directory');
}

// Função para copiar arquivos recursivamente
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copiar todos os arquivos do frontend para public
if (fs.existsSync('frontend')) {
  console.log('📋 Copying frontend files to public...');
  copyRecursiveSync('frontend', 'public');
  console.log('✅ Frontend files copied successfully');
} else {
  console.error('❌ Frontend directory not found!');
  process.exit(1);
}

// Verificar se arquivos essenciais existem
const essentialFiles = ['index.html', 'app.js', 'style.css', 'manifest.json', 'sw.js'];
const missingFiles = [];

essentialFiles.forEach(file => {
  if (!fs.existsSync(`public/${file}`)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('❌ Missing essential files:', missingFiles);
  process.exit(1);
}

console.log('🎉 Build completed successfully!');
console.log('📁 Files in public:');
fs.readdirSync('public').forEach(file => {
  console.log(`   - ${file}`);
}); 