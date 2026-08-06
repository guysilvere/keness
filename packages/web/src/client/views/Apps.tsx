import { useState, useEffect } from 'preact/hooks';
import { api, type DetectionResult } from '../api.js';
import { StatusDot } from '../components/Badge.js';

export function Apps() {
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    api.detect.run()
      .then((d) => { setResults(d.results); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <p class="muted loading">Scanning…</p>;
  if (error)   return <p class="error">{error}</p>;

  const detected = results.filter((r) => r.detected);
  const missing  = results.filter((r) => !r.detected);

  return (
    <section>
      <h2>Detected tools</h2>

      {detected.length === 0 && (
        <p class="muted empty-state">No AI coding tools detected on this machine.</p>
      )}

      {detected.length > 0 && (
        <ul class="app-list">
          {detected.map((r) => (
            <li key={r.appId} class="app-row app-row--ok">
              <StatusDot ok={true} />
              <span class="app-row-id">{r.appId}</span>
              {r.via && <span class="app-row-via muted">via {r.via}</span>}
              {r.configDir && <span class="app-row-path muted">{r.configDir}</span>}
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && (
        <>
          <div class="section-label" style="margin-top:1.5rem">Not detected</div>
          <ul class="app-list">
            {missing.map((r) => (
              <li key={r.appId} class="app-row app-row--miss">
                <StatusDot ok={false} />
                <span class="app-row-id">{r.appId}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
