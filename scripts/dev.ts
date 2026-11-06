import { createServer, type ViteDevServer } from 'vite';
import { startServer } from '../src/server/server.ts';

const game = await startServer(0, '127.0.0.1');
let ui: ViteDevServer | undefined;

try {
  ui = await createServer({
    server: {
      host: '0.0.0.0',
      port: 0,
      proxy: { '/ws': { target: `ws://127.0.0.1:${game.port}`, ws: true } },
    },
    plugins: [{
      name: 'room-invitation',
      transformIndexHtml(_html, { server }) {
        return [{
          tag: 'meta',
          attrs: { name: 'game-lan-url', content: server?.resolvedUrls?.network[0] ?? '' },
        }];
      },
    }],
  });
  await ui.listen();
  ui.printUrls();
} catch (error) {
  await Promise.allSettled([ui?.close(), game.close()]);
  throw error;
}
