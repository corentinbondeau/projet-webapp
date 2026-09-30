import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// petit endpoint REST en dev : GET /api/engines
export default defineConfig({
  plugins: [
    {
      name: 'engines-api',
      configureServer(server) {
        server.middlewares.use('/api/engines', (req, res, next) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'method not allowed' }));
            return;
          }

          try {
            const filePath = path.resolve(rootDir, 'public/data/engines.json');
            const raw = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.statusCode = 200;
            res.end(raw);
          } catch (err) {
            next(err as Error);
          }
        });
      }
    }
  ]
});
