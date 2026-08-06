import { useState, useEffect } from 'preact/hooks';

interface DetectionResult {
  appId: string;
  detected: boolean;
  via: string | null;
  binaryPath?: string;
  configDir?: string;
}

export function App() {
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/detect')
      .then((r) => r.json())
      .then((data: { results: DetectionResult[] }) => {
        setResults(data.results);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div class="layout">
      <header>
        <span class="logo">keness</span>
        <span class="badge">alpha</span>
      </header>

      <main>
        <h1>Detected tools</h1>
        {loading ? (
          <p class="muted">Scanning…</p>
        ) : (
          <ul class="tool-list">
            {results.map((r) => (
              <li key={r.appId} class={r.detected ? 'detected' : 'missing'}>
                <span class="dot">{r.detected ? '✓' : '–'}</span>
                <span class="name">{r.appId}</span>
                {r.detected && (
                  <span class="path">{r.configDir ?? r.binaryPath}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
