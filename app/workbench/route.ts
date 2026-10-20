import { workbenchHtml } from '../../lib/workbench-html';
export const dynamic = 'force-dynamic';
export function GET() { return new Response(workbenchHtml, { headers: {
  'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store',
  'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'SAMEORIGIN',
  'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'",
} }); }
