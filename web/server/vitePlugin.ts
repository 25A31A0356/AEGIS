/**
 * AGIES ALERT - Vite Backend Middleware Plugin
 * Connects the real backend router to the Vite development and preview server.
 */

import { Plugin } from 'vite';
import { handleBackendApiRequest, HttpRequestContext } from './router';
import { RealtimeHub } from './services/RealtimeHub';

export function agiesBackendPlugin(): Plugin {
  return {
    name: 'agies-alert-backend',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlStr = req.url || '';
        const [path, queryString] = urlStr.split('?');

        if (!path.startsWith('/api')) {
          return next();
        }

        // Handle SSE stream request
        const acceptHeader = (req.headers['accept'] as string) || '';
        if (
          (path === '/api/v1/events' || path === '/api/events/stream' || path === '/api/events') &&
          acceptHeader.includes('text/event-stream')
        ) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });

          // Send initial connection ACK
          res.write(
            `data: ${JSON.stringify({
              id: `init-${Date.now()}`,
              type: 'SYSTEM_HEARTBEAT',
              timestamp: new Date().toISOString(),
              data: { status: 'CONNECTED', serverTime: new Date().toISOString() },
            })}\n\n`
          );

          const unsubscribe = RealtimeHub.subscribe((event) => {
            try {
              res.write(`data: ${JSON.stringify(event)}\n\n`);
            } catch (err) {
              console.error('[SSE Write Error]', err);
            }
          });

          req.on('close', () => {
            unsubscribe();
          });
          return;
        }

        // Parse query string
        const query: Record<string, string> = {};
        if (queryString) {
          const params = new URLSearchParams(queryString);
          params.forEach((val, key) => {
            query[key] = val;
          });
        }

        // Parse request body for POST/PUT/PATCH/DELETE
        let body: any = undefined;
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
          body = await new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : undefined);
              } catch {
                resolve(data);
              }
            });
          });
        }

        const httpContext: HttpRequestContext = {
          method: req.method || 'GET',
          url: urlStr,
          path,
          query,
          headers: req.headers as any,
          body,
          clientIp: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        };

        try {
          const response = await handleBackendApiRequest(httpContext);

          res.statusCode = response.status;
          for (const [key, value] of Object.entries(response.headers)) {
            res.setHeader(key, value);
          }

          if (response.status === 204 || response.body === '' || response.body === undefined) {
            res.end();
          } else {
            res.end(typeof response.body === 'string' ? response.body : JSON.stringify(response.body));
          }
        } catch (pluginErr) {
          console.error('[Vite Backend Middleware Plugin Exception]', pluginErr);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'An unexpected error occurred while processing the request.',
              status: 500
            }
          }));
        }
      });
    },
  };
}
