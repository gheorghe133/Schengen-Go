import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Every page is personal, auth-gated data behind Firebase — nothing to prerender
    // or render server-side, and the Firebase client SDK isn't meant to run in Node.
    path: '**',
    renderMode: RenderMode.Client,
  },
];
