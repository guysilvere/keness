import { useState, useEffect } from 'preact/hooks';
import { api, type RegistryEntry } from '../api.js';
import { navigate } from '../router.js';
import { TypeBadge, AppBadge } from '../components/Badge.js';

export function Library() {
  const [entries, setEntries]   = useState<RegistryEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    api.registry.list()
      .then((d) => { setEntries(d.entries); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <p class="muted loading">Loading library…</p>;
  if (error)   return <p class="error">{error}</p>;

  return (
    <section>
      <div class="section-header">
        <h2>Library</h2>
        <button class="btn-primary" onClick={() => navigate('#/create')}>+ Create</button>
      </div>

      {entries.length === 0 ? (
        <p class="muted empty-state">
          No elements yet.{' '}
          <a href="#/create">Create your first skill, agent or rule →</a>
        </p>
      ) : (
        <ul class="entry-list">
          {entries.map((e) => (
            <li key={e.id} class="entry-card" onClick={() => navigate(`#/element/${e.id}`)}>
              <div class="entry-top">
                <TypeBadge type={e.type} />
                <span class="entry-name">{e.name}</span>
                <span class="entry-id muted">{e.id}</span>
              </div>
              {e.description && (
                <p class="entry-desc muted">{e.description}</p>
              )}
              <div class="entry-apps">
                {e.targets.map((t) => (
                  <AppBadge key={t.appId} appId={t.appId} status="ok" />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
