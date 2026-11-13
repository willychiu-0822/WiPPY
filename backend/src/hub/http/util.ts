import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Wraps an async handler so thrown errors become a JSON 500 instead of a hung request. */
export function asyncRoute(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => {
      console.error(JSON.stringify({ severity: 'ERROR', event: 'hub_route_error', path: req.path, error: String(err), stack: err instanceof Error ? err.stack : undefined }));
      if (!res.headersSent) res.status(500).json({ error: 'Internal error', code: 'internal_error' });
    });
  };
}
