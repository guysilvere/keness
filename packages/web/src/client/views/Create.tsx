import { useState, useEffect } from 'preact/hooks';
import { api, type AdapterInfo, type ElementType, type AppId } from '../api.js';
import { navigate } from '../router.js';

const TYPES: ElementType[] = ['skill', 'agent', 'rule', 'mcp'];
const SCOPES = ['project', 'global'] as const;
type Scope = typeof SCOPES[number];

export function Create() {
  const [adapters, setAdapters] = useState<AdapterInfo[]>([]);
  const [type, setType]         = useState<ElementType>('skill');
  const [name, setName]         = useState('');
  const [description, setDesc]  = useState('');
  const [content, setContent]   = useState('');
  const [scope, setScope]       = useState<Scope>('global');
  const [targets, setTargets]   = useState<string[]>([]);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    api.adapters.list().then((d) => {
      setAdapters(d.adapters);
      setTargets(d.adapters.map((a) => a.id));
    }).catch(() => {});
  }, []);

  function toggleTarget(id: string) {
    setTargets((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setError('Name and content are required.');
      return;
    }
    if (targets.length === 0) {
      setError('Select at least one target app.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { entry } = await api.registry.create({
        type,
        name: name.trim(),
        description: description.trim(),
        content: content.trim(),
        scope,
        appIds: targets as AppId[],
      });
      navigate(`#/element/${entry.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const supportedAdapters = adapters.filter((a) => a.supports.includes(type));

  return (
    <section>
      <div class="breadcrumb">
        <a href="#/" onClick={(e) => { e.preventDefault(); navigate('#/'); }}>Library</a>
        {' / '}New element
      </div>

      <h2 class="detail-title" style="margin-bottom:1.5rem">Create element</h2>

      <form class="create-form" onSubmit={handleSubmit}>
        {/* Type */}
        <div class="form-group">
          <label class="form-label">Type</label>
          <div class="type-picker">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                class={`type-btn ${type === t ? 'type-btn--active' : ''}`}
                onClick={() => setType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div class="form-group">
          <label class="form-label" for="el-name">Name</label>
          <input
            id="el-name"
            class="form-input"
            type="text"
            placeholder="e.g. typescript-strict-mode"
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            required
          />
        </div>

        {/* Description */}
        <div class="form-group">
          <label class="form-label" for="el-desc">Description <span class="muted">(optional)</span></label>
          <input
            id="el-desc"
            class="form-input"
            type="text"
            placeholder="One-line summary"
            value={description}
            onInput={(e) => setDesc((e.target as HTMLInputElement).value)}
          />
        </div>

        {/* Content */}
        <div class="form-group">
          <label class="form-label" for="el-content">Content</label>
          <textarea
            id="el-content"
            class="form-textarea"
            rows={10}
            placeholder="Paste or write your skill / agent / rule content here…"
            value={content}
            onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
            required
          />
        </div>

        {/* Scope */}
        <div class="form-group">
          <label class="form-label">Scope</label>
          <div class="type-picker">
            {SCOPES.map((s) => (
              <button
                key={s}
                type="button"
                class={`type-btn ${scope === s ? 'type-btn--active' : ''}`}
                onClick={() => setScope(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Target apps */}
        <div class="form-group">
          <label class="form-label">Target apps</label>
          {supportedAdapters.length === 0 ? (
            <p class="muted">No adapters support this element type.</p>
          ) : (
            <div class="target-picker">
              {supportedAdapters.map((a) => (
                <label key={a.id} class={`target-chip ${targets.includes(a.id) ? 'target-chip--active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={targets.includes(a.id)}
                    onChange={() => toggleTarget(a.id)}
                  />
                  {a.id}
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <p class="error" style="margin-bottom:1rem">{error}</p>}

        <div class="actions">
          <button class="btn-primary" type="submit" disabled={busy}>
            {busy ? '…' : 'Create'}
          </button>
          <button
            class="btn-secondary"
            type="button"
            onClick={() => navigate('#/')}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
