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
              if (payload.frozenReconciliations !== undefined) existing.frozenReconciliations = payload.frozenReconciliations;
              if (payload.products !== undefined) existing.products = payload.products;
              if (payload.weeklyBillingStatus !== undefined) existing.weeklyBillingStatus = payload.weeklyBillingStatus;
              if (payload.syncMeta !== undefined) {
                existing.syncMeta = { ...(existing.syncMeta || {}), ...payload.syncMeta };
              }
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

// Ensure critical files exist even on a clean checkout where gitignored or omitted
try {
  const firebaseConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (!fs.existsSync(firebaseConfigPath)) {
    fs.writeFileSync(
      firebaseConfigPath,
      JSON.stringify({
        projectId: 'scenic-year-l5xj8',
        appId: '1:862135242756:web:b6290e172729242cece551',
        apiKey: 'AIzaSyBbQj9D_CKy0cup8OfEWCo3Gc7BeXL2Opc',
        authDomain: 'scenic-year-l5xj8.firebaseapp.com',
        firestoreDatabaseId: 'ai-studio-conciliaodeestoq-3b77108f-dfc6-4120-9722-24391951064c',
        storageBucket: 'scenic-year-l5xj8.firebasestorage.app',
        messagingSenderId: '862135242756'
      }, null, 2),
      'utf-8'
    );
  }
} catch {}

try {
  const persistedDataPath = path.resolve(__dirname, 'src/data/persistedCodeData.json');
  if (!fs.existsSync(persistedDataPath)) {
    fs.mkdirSync(path.dirname(persistedDataPath), { recursive: true });
    fs.writeFileSync(persistedDataPath, JSON.stringify({}), 'utf-8');
  }
} catch {}

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
    build: {
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/xlsx') || id.includes('node_modules/exceljs')) {
              return 'excel-vendor';
            }
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
              return 'pdf-vendor';
            }
            if (id.includes('node_modules/firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/motion')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/recharts')) {
              return 'charts-vendor';
            }
          },
        },
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
