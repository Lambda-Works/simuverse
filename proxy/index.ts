import express from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();
const PORT = process.env.PROXY_PORT || 5000;

// Read routes config
interface RouteConfig {
  path: string;
  target: string;
  active: boolean;
  pathRewrite?: Record<string, string>;
}

interface RoutesConfig {
  defaultTarget: string;
  routes: RouteConfig[];
}

const configPath = join(__dirname, 'routes.json');
const config: RoutesConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

// Register active routes first (specific paths before default)
const activeRoutes = config.routes.filter((r) => r.active);

for (const route of activeRoutes) {
  const middlewareOpts: Options = {
    target: route.target,
    changeOrigin: true,
    ...(route.pathRewrite && { pathRewrite: route.pathRewrite }),
  };

  app.use(route.path, createProxyMiddleware(middlewareOpts));
  console.log(`  ✓ Route: ${route.path} → ${route.target}`);
}

// Default fallback: forward all /api/* to defaultTarget
// Express strips the /api prefix when mounted at '/api',
// so we add it back via pathRewrite so the backend receives /api/courses
app.use(
  '/api',
  createProxyMiddleware({
    target: config.defaultTarget,
    changeOrigin: true,
    pathRewrite: { '^/': '/api/' },
  })
);

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  ✓ Proxy server started on port ${PORT}`);
console.log(`  ✓ Default target: ${config.defaultTarget}`);
console.log(`  ✓ Active routes: ${activeRoutes.length}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

app.listen(PORT, () => {
  console.log(`Proxy listening on http://localhost:${PORT}`);
});
