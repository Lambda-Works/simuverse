const { watch } = require('chokidar');
const { execSync } = require('child_process');
const path = require('path');

const prismaDir = path.resolve(__dirname, '..', 'prisma');

console.log('👁️  Watching prisma/ for changes...');

const watcher = watch(prismaDir, {
  ignored: /(^|[/\\])\../, // ignore dotfiles
  persistent: true,
  usePolling: true,        // Docker-friendly
  interval: 1000,
});

watcher.on('change', (filePath) => {
  console.log(`📄 Prisma file changed: ${path.relative(process.cwd(), filePath)}`);
  try {
    console.log('🔄 Regenerating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    console.log('✅ Prisma client regenerated');
  } catch (err) {
    console.error('❌ Failed to regenerate Prisma client:', err.message);
  }
});

watcher.on('ready', () => console.log('✅ Prisma watcher ready'));
