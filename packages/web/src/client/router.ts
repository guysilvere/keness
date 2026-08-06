import { useState, useEffect } from 'preact/hooks';

export interface Route {
  path: string;
  params: Record<string, string>;
}

function parseRoute(hash: string): Route {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  const parts = clean.split('/').filter(Boolean);

  if (parts.length === 0)                              return { path: '/', params: {} };
  if (parts[0] === 'apps')                             return { path: '/apps', params: {} };
  if (parts[0] === 'create')                           return { path: '/create', params: {} };
  if (parts[0] === 'element' && parts[1])              return { path: '/element', params: { id: parts[1] } };
  return { path: '/', params: {} };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    parseRoute(window.location.hash || '#/'),
  );

  useEffect(() => {
    const handler = () => setRoute(parseRoute(window.location.hash || '#/'));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return route;
}

export function navigate(to: string): void {
  window.location.hash = to;
}
