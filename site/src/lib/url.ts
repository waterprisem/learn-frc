/** Prefixes a site-root path (like "/robot/power/") with the deploy base, e.g. "/learn-frc" on GitHub Pages. */
export const url = (path: string): string => import.meta.env.BASE_URL.replace(/\/$/, '') + path;
