import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function codeDataPersistencePlugin(): Plugin {
  return {
    name: 'code-data-persistence',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];

        if (url === '/api/save-code-data' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const targetPath = path.resolve(__dirname, 'src/data/persistedCodeData.json');
              let existing: any = {};
              if (fs.existsSync(targetPath)) {
                try {
                  existing = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
                } catch {
                  existing = {};
                }
              }

              if (payload.stockPositions !== undefined) existing.stockPositions = payload.stockPositions;
              if (payload.gradeStockPositions !== undefined) existing.gradeStockPositions = payload.gradeStockPositions;
              if (payload.quebras !== undefined) existing.quebras = payload.quebras;
              if (payload.vales !== undefined) existing.vales = payload.vales;
              if (payload.trocas !== undefined) existing.trocas = payload.trocas;
              if (payload.faltasMapeadas !== undefined) existing.faltasMapeadas = payload.faltasMapeadas;
              existing.lastUpdated = new Date().toISOString();

              fs.writeFileSync(targetPath, JSON.stringify(existing, null, 2), 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Dados gravados no código (persistedCodeData.json) com sucesso!' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (url === '/api/get-code-data' && req.method === 'GET') {
          try {
            const targetPath = path.resolve(__dirname, 'src/data/persistedCodeData.json');
            if (fs.existsSync(targetPath)) {
              const content = fs.readFileSync(targetPath, 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(content);
              return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({}));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), codeDataPersistencePlugin()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
    },
  };
});
