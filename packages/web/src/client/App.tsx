import { useRoute, navigate } from './router.js';
import { Library }       from './views/Library.js';
import { Apps }          from './views/Apps.js';
import { Create }        from './views/Create.js';
import { ElementDetail } from './views/ElementDetail.js';

export function App() {
  const route = useRoute();

  let view;
  if (route.path === '/apps')    view = <Apps />;
  else if (route.path === '/create')  view = <Create />;
  else if (route.path === '/element') view = <ElementDetail id={route.params.id ?? ''} />;
  else                                view = <Library />;

  return (
    <div class="app-shell">
      <nav class="sidebar">
        <div class="sidebar-logo">
          <span class="logo">keness</span>
          <span class="badge">alpha</span>
        </div>
        <ul class="nav-list">
          <li>
            <a
              href="#/"
              class={`nav-link ${route.path === '/' || route.path === '/element' ? 'nav-link--active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('#/'); }}
            >
              Library
            </a>
          </li>
          <li>
            <a
              href="#/apps"
              class={`nav-link ${route.path === '/apps' ? 'nav-link--active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('#/apps'); }}
            >
              Apps
            </a>
          </li>
        </ul>
      </nav>

      <main class="main-content">
        {view}
      </main>
    </div>
  );
}
