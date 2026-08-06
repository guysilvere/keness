# BLUEPRINT — Keness

**Domaine visé :** keness.dev *(à réserver — à vérifier avant dépôt définitif)*
**Slug technique :** `keness`
**Date de rédaction :** 6 août 2026
**Version du document :** v0.1

---

## 1. Résumé exécutif

Keness est un outil open-source (CLI + dashboard web local) qui permet aux développeurs utilisant plusieurs assistants de code IA (Claude Code, Codex, Antigravity, Gemini CLI, Opencode, Cursor, et d'autres à l'avenir) de créer, stocker, synchroniser et faire évoluer leurs **skills, agents, rules et fichiers MCP** depuis un seul endroit, sans avoir à connaître ni recopier manuellement les conventions de chaque outil.

Keness résout un problème concret : un développeur qui utilise 3 ou 4 outils IA en parallèle doit aujourd'hui dupliquer manuellement ses skills/agents/rules dans des formats différents (Markdown vs TOML, `SKILL.md` vs `agent.md`, dossiers différents selon l'OS), avec un risque constant de désynchronisation. Keness centralise la définition d'un élément une fois, et le décline automatiquement dans le format et à l'emplacement attendus par chaque outil cible.

Keness va au-delà de la simple duplication mécanique : l'utilisateur peut aussi **décrire en langage naturel** ce qu'il veut ("un skill qui vérifie que chaque PR a des tests avant merge"), et Keness génère le skill/agent/rule correspondant — directement dans les conventions de l'outil ciblé — en s'appuyant sur **la clé API du fournisseur LLM choisi par l'utilisateur** (BYOK — Bring Your Own Key). La même clé peut aussi être utilisée pour une **adaptation intelligente** lors d'une synchronisation entre deux outils dont les paradigmes diffèrent trop pour une simple conversion mécanique de champs.

- **Plateformes cibles retenues :** CLI (usage principal) + interface web locale (dashboard) pour la v1 ; application desktop (Tauri) en roadmap moyen terme.
- **Statut du naming :** nom "Keness" validé par l'utilisateur, aucun conflit de projet ou de marque détecté ; domaine à réserver.

---

## 2. Naming & identité

- **Nom retenu :** Keness — court, facile à taper dans une CLI (`keness sync`, `keness create skill`), sans connotation technique trop fermée (contrairement à des noms déjà pris comme AgentForge/AgentBridge/AgentDock/AgentMux/Agentloom, tous utilisés par des projets existants dans cet espace).
- **Vérification de conflit :** recherche effectuée sur GitHub/web — un seul compte GitHub personnel homonyme trouvé (projet non lié, sans rapport avec le développement logiciel). Aucun produit, entreprise ou paquet npm/PyPI conflictuel identifié.
- **Domaine(s) à réserver :** `keness.dev` (priorité) ou `keness.sh` (alternative orientée outil CLI) — disponibilité à reconfirmer par l'utilisateur via un registrar avant achat.
- **Slug technique :** `keness` (kebab-case) — utilisé pour le dépôt GitHub, le paquet npm (`@keness/cli`, `@keness/core`), et les dossiers de configuration (`~/.keness/`).

### Paysage concurrentiel (important à connaître)

Cet espace est déjà occupé par plusieurs projets ayant une proposition de valeur proche : **Abridge**, **AgentLoom**, **Skilz-cli**, **SkillPort**, **dotagents** (Sentry). Ce n'est pas un obstacle — cela confirme que le besoin est réel — mais Keness doit se différencier clairement. Axes de différenciation proposés (à valider/enrichir) :
- Couverture large et **explicitement multi-format** (Markdown *et* TOML, `SKILL.md` *et* `agent.md`), avec un système d'adaptateurs extensible plutôt qu'un support figé.
- Interface web locale en plus du CLI (la plupart des concurrents identifiés sont CLI-only ou GUI-only).
- Détection automatique des outils installés dès le premier lancement (`keness detect`), pas seulement une liste statique à cocher.

---

## 3. Objectifs & périmètre

### Objectifs
- Permettre à un développeur de créer un skill/agent/rule/MCP **une seule fois**, dans une interface unifiée, et de le décliner automatiquement pour n'importe quel sous-ensemble des outils qu'il utilise.
- Garantir que chaque fichier généré respecte strictement les conventions de l'outil cible (emplacement OS-dépendant, format, frontmatter, permissions).
- Réduire à zéro la dérive entre les versions d'un même skill/agent dupliqué manuellement dans plusieurs outils.

### Personas
- **Le développeur multi-outils** : utilise Claude Code au quotidien, Cursor pour l'édition, et teste Codex/Gemini CLI ponctuellement — veut les mêmes règles de projet partout sans les recopier.
- **Le tech lead / mainteneur d'équipe** : définit des skills/rules "maison" (conventions de code, checklist de review) et veut les diffuser à toute l'équipe quel que soit l'outil IA choisi par chacun.
- **Le contributeur open-source** : veut packager un skill qu'il a créé et le rendre disponible/installable facilement par d'autres, indépendamment de l'outil cible.

### Fonctionnalités du MVP (in scope) — *d'après les priorités indiquées par l'utilisateur*
- Créer un skill / agent / rule / `agent.md`, adapté aux conventions de l'app choisie — manuellement (contenu fourni par l'utilisateur) **ou par génération IA à partir d'une description en langage naturel** (BYOK, voir section 6).
- Enregistrement automatique dans le bon dossier selon l'OS (Windows / macOS / Linux).
- Application des bonnes pratiques de structure de fichiers et de permissions.
- Enregistrement d'un même élément dans plusieurs apps simultanément.
- Modification d'un élément avec réplication (option) vers les autres apps, avec adaptation automatique de format — adaptation mécanique par défaut, ou **adaptation assistée par IA** (BYOK) quand la conversion mécanique perd trop d'information entre deux paradigmes très différents.
- Détection des applications IA installées sur la machine.
- Téléchargement des fichiers générés, ou génération des commandes CLI équivalentes (créer / répliquer / supprimer).

### Hors périmètre v1 (out of scope)
- Marketplace communautaire de partage de skills entre utilisateurs (repoussé — voir ROADMAP).
- Application desktop packagée (Tauri/Electron) — repoussée en roadmap moyen terme.
- Gestion d'équipe/organisation avec permissions collaboratives centralisées (repoussé long terme).
- Exécution ou "sandboxing" du contenu des skills (Keness gère des fichiers de configuration, pas l'exécution des agents eux-mêmes).

### Contraintes
- Doit fonctionner strictement en local-first (pas de compte cloud obligatoire) — cohérent avec la nature des outils ciblés qui lisent des fichiers locaux.
- Doit rester extensible : ajouter le support d'un nouvel outil (ex. Mistral Vibe, Windsurf/Devin Local, GLM/ZCode évoqués dans nos échanges précédents) ne doit pas nécessiter de réécrire le cœur de l'application.
- Échéance de lancement : **à définir avec l'utilisateur** (non précisée au moment du cadrage).

---

## 4. Fonctionnalités & parcours utilisateurs

### Priorisation MoSCoW

**Must have (MVP)**
- `keness detect` — scan des outils IA installés (PATH, dossiers de config connus par OS).
- `keness create <type>` (`skill`/`agent`/`rule`/`mcp`) — assistant de création interactif ou via flags, avec sélection multi-cibles.
- `keness generate <type> "<description>"` — génération du contenu via IA (BYOK) à partir d'une description en langage naturel, déjà adaptée aux conventions de chaque app cible sélectionnée.
- Bibliothèque locale des éléments créés (source de vérité versionnable).
- `keness push <id> --to <app1,app2,...>` — écrit/adapte l'élément vers les apps choisies.
- `keness diff <id>` — aperçu du fichier adapté avant écriture (mode preview par défaut).
- `keness sync <id>` — réplique une modification déjà faite dans une app vers les autres apps liées.
- `keness rm <id> --from <apps|all>` — suppression synchronisée avec confirmation.
- `keness export <id>` — génère une archive téléchargeable et/ou affiche les commandes shell équivalentes.
- Dashboard web local (`keness ui`) reprenant les mêmes actions en interface graphique.

**Should have (peu après le MVP)**
- Historique des modifications par élément + `keness rollback`.
- Mode "dry-run" systématique sur toutes les commandes destructives.
- Profils réutilisables (ensembles nommés de skills/rules à appliquer à un nouveau projet en une commande).
- Templates de démarrage rapide (skills/rules starter par langage/framework).

**Could have (moyen terme)**
- Marketplace communautaire de skills (publication/installation).
- Système de plugins pour ajouter un nouvel adaptateur d'outil sans toucher au cœur.
- Intégration Git optionnelle (commit automatique de la bibliothèque `~/.keness/library`).

**Won't have (v1, explicitement)**
- Compte cloud obligatoire, télémétrie non consentie, exécution de code arbitraire embarqué dans un skill.

### Rôles et permissions
Application mono-utilisateur locale en v1 — pas de notion de rôle serveur. La seule distinction de "portée" est **projet** (dossier courant) vs **globale** (utilisateur), reflétant la distinction que font déjà Claude Code (`.claude/` vs `~/.claude/`), Cursor, etc.

### User stories clés (extrait)
- *"En tant que développeur, je veux créer un skill une fois et l'enregistrer simultanément dans Claude Code et Cursor, pour ne pas le récrire deux fois."* → Critère d'acceptation : `keness create skill` propose une sélection multi-cible ; les deux fichiers générés respectent chacun la convention de leur outil (`.claude/skills/<nom>/SKILL.md` et `.cursor/skills/<nom>/SKILL.md`).
- *"En tant que tech lead, je modifie une rule dans Claude Code directement, et je veux que Keness me propose de répercuter le changement vers Cursor et Codex."* → Critère d'acceptation : `keness sync` détecte la divergence entre le fichier source modifié et la bibliothèque interne, affiche un diff, propose la propagation adaptée par outil.
- *"En tant qu'utilisateur Windows, je veux que le skill soit écrit au bon endroit sans avoir à connaître le chemin exact."* → Critère d'acceptation : résolution automatique de chemin par OS et par outil (voir section 6).
- *"En tant que développeur, je décris en une phrase le comportement que je veux, sans écrire moi-même le frontmatter ni connaître les conventions de chaque outil."* → Critère d'acceptation : `keness generate skill "vérifie que chaque PR a des tests avant merge" --for claude-code,cursor` produit un aperçu par app cible, avec un frontmatter et une structure déjà conformes, avant toute écriture sur disque.
- *"En tant qu'utilisateur, je veux que Keness me prévienne avant d'utiliser ma clé API (donc avant une dépense), et je veux pouvoir refuser."* → Critère d'acceptation : toute commande `generate` ou `push --ai-adapt` affiche un aperçu et demande confirmation avant l'appel réel au fournisseur LLM, sauf si `--yes` est passé explicitement.

### Parcours principaux
1. **Onboarding** : premier lancement → `keness detect` s'exécute automatiquement → liste des outils trouvés affichée → l'utilisateur confirme/complète manuellement les outils non auto-détectés.
2. **Création d'un élément** : `keness create skill` (ou bouton "+" dans le dashboard) → formulaire (nom, description, contenu, type) → sélection des apps cibles → aperçu par app → confirmation → écriture.
3. **Modification + réplication** : édition d'un élément existant (dans Keness ou détectée depuis un fichier modifié manuellement) → diff affiché par app cible → choix "propager partout" / "propager vers..." / "ignorer".

---

## 5. UX / UI

### CLI
- Commandes verbales et prévisibles : `keness <verbe> <type> [cible]`, ex. `keness create skill`, `keness push my-skill --to claude,cursor`, `keness rm my-skill --from all`.
- Mode interactif (prompts) si des arguments manquent ; mode 100 % scriptable (flags complets, `--yes` pour bypasser les confirmations) pour l'intégration CI/scripts.
- Sortie `--json` disponible sur les commandes de lecture (`list`, `detect`, `diff`) pour l'intégration dans d'autres outils.

### Dashboard web local
- Lancé via `keness ui` → ouvre `http://localhost:<port>` (aucune donnée envoyée à l'extérieur, tout est servi localement).
- Arborescence des écrans :
  - **Bibliothèque** — liste des skills/agents/rules/MCP créés, avec badges indiquant dans quelles apps chacun est actuellement répliqué et leur statut de synchronisation (à jour / divergent / non répliqué).
  - **Détail d'un élément** — contenu source, liste des cibles, diff par cible, actions (push/sync/supprimer/exporter).
  - **Apps détectées** — liste des outils trouvés/manuellement ajoutés, avec chemin de configuration détecté et bouton de re-scan.
  - **Créer** — formulaire de création multi-étapes, avec aperçu en temps réel du fichier généré par app sélectionnée.
- Principes de design : sobre, orienté développeur (police monospace pour le contenu des fichiers, coloration syntaxique du frontmatter YAML/TOML), pas d'éléments marketing — l'interface sert un usage outillé, pas une vitrine.

### Ton et micro-copie
- Interface en anglais par défaut (cohérent avec l'écosystème des outils ciblés, très majoritairement anglophone), avec une couche de traduction FR activable — à confirmer avec l'utilisateur si une v1 bilingue est souhaitée dès le lancement ou seulement en évolution.

---

## 6. Architecture technique

### Stack retenue *(principe directeur : légèreté et open-source)*

**Node.js / TypeScript**, en monorepo via **pnpm workspaces** (sans couche de build supplémentaire), pour les raisons suivantes :
- Un seul langage pour le CLI, le serveur du dashboard web, et — en roadmap — le shell Tauri (qui embarque une webview réutilisant directement l'UI web déjà développée, sans réécriture).
- Écosystème mature pour ce cas d'usage précis : parsing YAML/TOML/frontmatter (`gray-matter`, `@iarna/toml`), CLI ergonomique (`commander`), résolution de chemins cross-OS native (`os.homedir()`, `process.env.APPDATA`, `process.platform`).
- Distribution facile et déjà standard dans cet écosystème : `npx keness`, `npm install -g keness`, cohérent avec la façon dont Claude Code, Opencode, Codex, Gemini CLI, etc. se distribuent déjà eux-mêmes.

**Choix de légèreté explicites :**
- **Pas de Turborepo** — `pnpm -r build` suffit pour 3 packages et respecte l'ordre topologique via les dépendances workspace. Turborepo sera réévalué si le nombre de packages dépasse 8-10.
- **Preact** (3 kb) au lieu de React (45 kb) pour le dashboard web : API identique, surface mémoire négligeable.
- **@clack/prompts** au lieu d'Inquirer pour les prompts interactifs CLI : plus léger, meilleure UX, zéro sous-dépendances lourdes.
- **Vitest** pour les tests (partagé avec Vite, configuration unique, sans Jest).

**Tableau récapitulatif de la stack :**

| Couche | Outil | Licence |
|---|---|---|
| Monorepo | pnpm workspaces | MIT |
| Langage | TypeScript 5 | Apache-2.0 |
| CLI framework | commander | MIT |
| CLI prompts | @clack/prompts | MIT |
| CLI spinner | ora | MIT |
| CLI couleurs | chalk | MIT |
| Web server | Fastify | MIT |
| Web frontend | Preact + Vite | MIT |
| Tests | Vitest | MIT |
| Lint | ESLint 9 + @typescript-eslint | MIT |
| YAML/frontmatter | gray-matter | MIT |
| TOML | @iarna/toml | ISC |

**Structure du monorepo :**
```
keness/
├── packages/
│   ├── core/            # logique métier : bibliothèque, adaptateurs, détection, sync
│   │   └── src/
│   │       ├── adapters/        # un module par outil cible
│   │       │   ├── claude-code.ts
│   │       │   ├── codex.ts
│   │       │   ├── antigravity.ts
│   │       │   ├── gemini-cli.ts
│   │       │   ├── opencode.ts
│   │       │   └── cursor.ts
│   │       ├── detect/          # détection par OS + par outil
│   │       ├── registry/        # lecture/écriture du manifeste local
│   │       ├── generation/      # module BYOK (génération + adaptation IA)
│   │       ├── sync-engine.ts   # orchestration create/push/sync/rm
│   │       └── paths.ts         # résolution de chemins cross-OS
│   ├── cli/             # binaire `keness`, consomme `core`
│   └── web/             # serveur Fastify + frontend Preact/Vite, consomme `core`
├── design/              # tokens de couleur (palette.ts, tokens.css)
├── docs/                # site vitrine / documentation (keness.dev)
├── package.json         # workspace root (pnpm)
└── tsconfig.base.json   # config TypeScript partagée
```

### Modèle des "adaptateurs" (cœur de l'architecture)

Chaque outil cible est représenté par un **adaptateur** implémentant une interface commune :

```ts
interface AppAdapter {
  id: 'claude-code' | 'codex' | 'antigravity' | 'gemini-cli' | 'opencode' | 'cursor';
  detect(): Promise<DetectionResult>;          // binaire en PATH ? dossier de config présent ?
  supports: ('skill' | 'agent' | 'rule' | 'mcp')[];
  resolvePath(type, scope: 'project' | 'global', os: NodeJS.Platform): string;
  format(element: KenessElement): AdaptedFile;  // conversion Markdown/YAML <-> TOML, etc.
  permissions(filePath: string): FilePermissionSpec;
}
```

Ajouter un nouvel outil (ex. Mistral Vibe, Windsurf/Devin Local) revient à écrire un nouvel adaptateur sans toucher au reste du système — c'est la garantie d'extensibilité demandée par l'utilisateur.

### Résolution de chemin par OS *(bonnes pratiques)*

Le module `paths.ts` centralise, pour chaque outil et chaque OS, l'emplacement correct :
- **Global (utilisateur)** : `~/.claude/`, `~/.codex/`, `~/.cursor/`, `~/.gemini/`, `~/.agents/` (Antigravity), `~/.config/opencode/` — avec équivalents Windows (`%USERPROFILE%\...` ou `%APPDATA%\...` selon l'outil, à vérifier au cas par cas car certains outils suivent la convention Unix même sous Windows via WSL).
- **Projet (local)** : dossier `.claude/`, `.codex/`, `.cursor/`, `.gemini/`, `.agents/`, `.opencode/` à la racine du repo courant (détection par remontée jusqu'au `.git`).
- Gestion explicite des cas où un outil n'a **pas** de portée globale ou pas de dossier "rules" dédié (ex. Codex, Gemini CLI, Mistral — le contenu doit alors être fusionné dans le fichier d'instructions principal plutôt que créé en fichier séparé, comme documenté dans notre comparatif précédent).

### Bonnes pratiques de permissions
- Fichiers de configuration texte : permissions standards `644` (lecture/écriture propriétaire, lecture seule pour le reste) sur Unix ; pas d'ACL spécifique nécessaire sous Windows sauf demande explicite.
- Si un adaptateur génère un script exécutable (ex. un hook), positionner `755`/`+x` explicitement — jamais par défaut sur les autres types de fichiers.
- Keness ne doit **jamais** exécuter automatiquement le contenu d'un skill/agent téléchargé depuis une source externe sans avertissement explicite (risque de code arbitraire) — voir section 11 Sécurité.

### Stockage interne *(recommandation demandée par l'utilisateur)*

**Option retenue : fichiers réels + manifeste JSON léger**, plutôt qu'une base SQL embarquée. Justification :
- Les fichiers réels (`~/.keness/library/<type>/<id>/...`) restent la **source de vérité**, lisibles, éditables à la main, et versionnables tels quels dans un dépôt Git personnel si l'utilisateur le souhaite (cohérent avec la nature "texte" de tout cet écosystème).
- Un manifeste JSON (`~/.keness/registry.json`) indexe les métadonnées (id, type, apps cibles liées, chemin de chaque réplique, hash du contenu au dernier push, horodatage) — suffisant pour détecter les divergences et servir l'historique/diff, sans dépendance binaire native.
- Une vraie base SQL (SQLite via un module natif type `better-sqlite3`) est écartée pour le MVP : elle complique la distribution cross-OS/cross-architecture d'un paquet npm (compilation native par plateforme), pour un gain marginal au regard du volume de données concerné (quelques dizaines à centaines d'éléments par utilisateur). Cette option reste envisageable en évolution si le volume ou les besoins de requêtage grandissent significativement (voir ROADMAP).

### Détection des apps installées
Combinaison de deux méthodes, appliquées par adaptateur :
1. **Présence du binaire en PATH** (`which`/`where` sur `claude`, `codex`, `cursor`, `gemini`, `opencode`, l'exécutable Antigravity).
2. **Présence d'un dossier de configuration connu** (`~/.claude/`, `~/.cursor/`, etc.) — utile pour détecter une app installée mais non présente dans le PATH courant (cas fréquent des apps GUI comme Cursor/Antigravity).
Un outil est marqué "détecté" si au moins un des deux signaux est positif ; sinon proposé en ajout manuel par l'utilisateur.

### Moteur de génération et d'adaptation par IA (BYOK)

Keness intègre un module `generation/` dans `packages/core`, séparé du `sync-engine`, avec deux usages distincts :

**1. Génération (`keness generate`)** — à partir d'une description en langage naturel, produire le contenu d'un skill/agent/rule déjà structuré selon les conventions de chaque app cible sélectionnée. Le prompt système envoyé au LLM n'est pas générique : il embarque directement les règles de l'adaptateur concerné (structure attendue du frontmatter, longueur recommandée, bonnes pratiques déjà documentées dans ce blueprint — ex. description à la troisième personne pour un skill Antigravity, limite ~32 KiB pour un `AGENTS.md` Codex). La génération est donc **adaptateur-consciente dès la source**, pas une génération générique suivie d'une conversion.

**2. Adaptation assistée (`--ai-adapt` sur `push`/`sync`)** — utilisée quand la conversion mécanique standard (mapping de champs, voir section adaptateurs) perd trop d'information entre deux paradigmes éloignés : ex. un subagent Claude Code avec un corps de prompt riche à faire tenir dans les champs plus contraints d'un agent Codex en TOML, ou un ensemble de rules `.mdc` Cursor à fusionner intelligemment dans un unique `AGENTS.md` pour un outil qui n'a pas de dossier rules dédié. Le mode mécanique reste le défaut (gratuit, déterministe, pas d'appel réseau) ; l'adaptation IA est un **opt-in explicite** dès qu'un appel API a un coût réel pour l'utilisateur.

**Fournisseurs supportés (BYOK)** — l'utilisateur configure sa propre clé, jamais partagée avec Keness :
- Connecteurs natifs pour les fournisseurs les plus probables au vu des outils déjà ciblés : Anthropic (API Claude), OpenAI, Google (Gemini API).
- Un connecteur générique **compatible OpenAI** (`baseURL` configurable) pour couvrir tout autre fournisseur exposant une API compatible (Mistral, xAI/Grok, DeepSeek, modèles locaux via Ollama/LM Studio) sans développement spécifique par fournisseur.
- Choix du fournisseur/modèle par commande (`--model`) ou par défaut configurable (`keness config set generation.provider anthropic`).

**Stockage de la clé** *(voir aussi section 11 Sécurité)* :
- Jamais en clair dans le manifeste JSON ni dans un fichier versionnable.
- Stockage via le **trousseau natif de l'OS** (Keychain macOS, Credential Manager Windows, Secret Service/libsecret sous Linux — via une librairie cross-platform type `keytar`/équivalent maintenu), avec repli sur une variable d'environnement (`KENESS_API_KEY`) pour les usages CI/scriptés.
- `keness auth set <provider>` pour enregistrer une clé, `keness auth status` pour vérifier qu'une clé est configurée sans jamais l'afficher en clair.

**Coût et consentement** — chaque appel de génération/adaptation a un coût réel pour l'utilisateur :
- Aperçu systématique du prompt et du résultat avant écriture (cohérent avec le mode "aperçu + confirmation" déjà retenu pour la synchronisation).
- Option `--dry-run` pour composer le prompt et l'afficher sans effectuer l'appel réseau (utile pour vérifier avant de dépenser).
- Aucun appel automatique/silencieux : la génération et l'adaptation IA sont toujours déclenchées explicitement par l'utilisateur, jamais en tâche de fond.

### Stratégie de synchronisation multi-format *(point laissé ouvert par l'utilisateur — recommandation appliquée)*
Mode par défaut : **aperçu + confirmation** avant toute écriture ou réplication (`keness diff` implicite avant chaque `push`/`sync`), avec une option `--yes`/`--auto` pour les utilisateurs qui veulent bypasser la confirmation une fois la confiance établie. Ce choix priorise la sécurité (éviter d'écraser une modification manuelle faite directement dans un outil) sur la vitesse — cohérent avec le fait que ces fichiers pilotent le comportement d'agents IA en écriture sur le code de l'utilisateur.

---

## 7. Paiement

**Non applicable.** Keness est un projet open-source gratuit, sans passerelle de paiement ni modèle payant prévu en v1. *(Écart assumé par rapport à la contrainte par défaut Jeko, qui s'applique aux projets commerciaux avec transactions — non pertinente pour un outil dev open-source local-first.)*

---

## 8. SEO & référencement

Pertinent uniquement pour le site vitrine/documentation (`keness.dev`), pas pour le CLI/dashboard local lui-même :
- Mots-clés cibles : "sync AI coding agent skills", "claude code cursor codex sync tool", "AGENTS.md multi tool", "SKILL.md manager".
- Balises meta, `sitemap.xml`, `robots.txt`, URLs propres sur la documentation.
- Données structurées `schema.org/SoftwareApplication` pour la page d'accueil.
- Site vitrine en anglais prioritaire (audience développeur internationale), page FR secondaire possible en évolution.

---

## 9. Infrastructure & déploiement

*(Écart assumé par rapport aux défauts Coolify/Pocketbase — non pertinents pour un outil local-first sans backend utilisateur en v1 ; infrastructure adaptée à la réalité du projet.)*

- **Distribution du CLI/core** : publication npm (`npm publish`) sous le scope `@keness/*`, installable via `npm install -g keness` ou `npx keness`.
- **Site vitrine/documentation** (`keness.dev`) : génération statique (ex. Astro/VitePress — léger, cohérent avec la contrainte de stack légère), hébergement simple type GitHub Pages ou Netlify/Vercel (tier gratuit largement suffisant pour un site de documentation).
- **CI/CD** : GitHub Actions — tests automatiques + publication npm sur tag de version + build/déploiement du site de doc sur push vers `main`.
- **Pas de VPS/Coolify/Pocketbase nécessaire en v1** : aucune donnée utilisateur ne transite par un serveur Keness — tout reste sur la machine de l'utilisateur (le "dashboard web" est un serveur local, pas un service hébergé).
- *(Si la marketplace communautaire est développée en v2 — voir ROADMAP — elle nécessitera alors un vrai backend hébergé ; Coolify + une base de données légère type Postgres ou Pocketbase redeviendra pertinent à ce moment-là, à réévaluer.)*

---

## 10. Dépôt de code & sauvegardes

- **Dépôt GitHub** : **public** (cohérent avec la nature open-source du projet, contrairement au défaut "privé" qui s'applique aux projets commerciaux) — `https://github.com/<à définir>/keness`. *(Le pseudo/organisation GitHub n'a pas été précisé par l'utilisateur — point ouvert, voir section 14.)*
- **Structure de branches** : `main` (stable, publié), `develop` (intégration), branches de feature courtes fusionnées par PR avec CI verte obligatoire.
- **Sauvegardes** : non applicable au sens "base de données" (pas de DB serveur) — la seule donnée à protéger est la bibliothèque locale de l'utilisateur (`~/.keness/library`), pour laquelle Keness devrait proposer une commande `keness backup`/`keness export --all` permettant à l'utilisateur de versionner lui-même son dossier dans son propre dépôt Git s'il le souhaite (fonctionnalité "Should have", voir ROADMAP).

---

## 11. Sécurité

Section particulièrement sensible pour ce projet, car Keness écrit des fichiers qui pilotent le comportement d'agents IA ayant eux-mêmes accès en écriture au code de l'utilisateur :
- **Jamais d'exécution automatique** du contenu d'un skill/agent, y compris téléchargé depuis une source tierce — Keness manipule uniquement des fichiers texte/configuration.
- **Validation avant écriture** : tout élément importé depuis une source externe (ex. `keness pull <url>`) doit être affiché en clair à l'utilisateur avant d'être ajouté à la bibliothèque, avec un avertissement si le contenu contient des instructions suspectes (ex. tentative d'accès réseau, de credentials, de commandes destructives — heuristique simple en v1, pas une garantie de sécurité absolue).
- **Pas d'écrasement silencieux** : si un fichier cible a été modifié manuellement depuis le dernier push Keness (hash différent du manifeste), le sync doit avertir avant d'écraser plutôt que de forcer.
- **Aucune donnée envoyée à l'extérieur** sans consentement explicite — le dashboard web est strictement local (`localhost`), aucune télémétrie par défaut.
- **Secrets** : si un futur adaptateur MCP nécessite des clés API dans sa configuration, Keness ne doit jamais les stocker en clair dans le manifeste versionnable — recommandation : variables d'environnement référencées, jamais la valeur elle-même.
- **Clé API BYOK (génération/adaptation IA)** : stockée exclusivement via le trousseau natif de l'OS (jamais en clair sur disque, jamais dans `~/.keness/registry.json`, jamais incluse dans un `keness export`) ; jamais loguée, y compris en mode verbeux/debug (masquage systématique dans les logs) ; jamais transmise à un tiers autre que le fournisseur LLM choisi explicitement par l'utilisateur — Keness lui-même n'a pas de serveur qui intercepte ou relaie ces appels (connexion directe poste-utilisateur → fournisseur).
- **Contenu généré par IA** : traité comme tout contenu importé (voir point ci-dessus) — affiché en clair avant écriture, jamais exécuté automatiquement, avec le même garde-fou d'aperçu que pour l'adaptation mécanique.

---

## 12. Modèle économique & tarification

**Non applicable.** Projet open-source, gratuit, sans grille tarifaire — soutien optionnel envisageable via sponsoring (GitHub Sponsors/Open Collective) en évolution, sans que cela conditionne l'accès aux fonctionnalités.

---

## 13. Plan de projet

- **Lot 1 — Fondations** : structure du monorepo, module `paths.ts` (résolution cross-OS), module `detect` pour les 6 outils cibles, manifeste JSON de base.
- **Lot 2 — Premiers adaptateurs** : Claude Code + Cursor (les deux mieux documentés et les plus proches en convention) — création, écriture, lecture.
- **Lot 3 — CLI complet** : `create`, `push`, `diff`, `sync`, `rm`, `export`, avec les 6 adaptateurs.
- **Lot 4 — Dashboard web local** : serveur + UI consommant le même `core`.
- **Lot 5 — Durcissement** : gestion des divergences/conflits, mode dry-run, tests E2E multi-OS (matrice CI Windows/macOS/Linux).
- **Stratégie de test** : tests unitaires par adaptateur (format généré conforme à un fichier de référence), tests d'intégration de résolution de chemin par OS (mock du système de fichiers), test manuel de bout en bout sur les 3 OS avant chaque release taguée.
- **Plan de lancement** : release npm `0.1.0` en accès anticipé (early access) auprès d'une communauté ciblée (ex. Reddit r/ClaudeAI, forums Cursor/OpenCode, Hacker News "Show HN") pour retours avant `1.0.0`.
- Estimation de charge à haut niveau : **à affiner avec l'équipe de développement**, aucune échéance ferme communiquée au moment du cadrage.

---

## 14. Hypothèses & points ouverts

Points laissés "à définir avec l'utilisateur" faute de réponse au moment du cadrage :
- **Fonctionnalités MVP précises** : la liste Must/Should/Could ci-dessus est une proposition raisonnable basée sur la description initiale du projet — à faire valider ou ajuster par l'utilisateur.
- **Compte/organisation GitHub** : nom exact du dépôt non précisé — utilisé `<à définir>/keness` en placeholder.
- **Licence open-source** : non précisée — **MIT proposée par défaut** (licence la plus permissive et la plus adoptée pour ce type d'outil développeur, favorise l'adoption et les contributions) — à confirmer, alternative Apache 2.0 pertinente si l'utilisateur veut une protection brevet explicite.
- **Échéance de lancement** : non précisée — aucune date cible fixée dans ce document.
- **Marketplace communautaire** : non tranchée par l'utilisateur — traitée par hypothèse comme une évolution moyen terme plutôt qu'un objectif du MVP, compte tenu de la complexité qu'elle ajoute (backend hébergé, modération de contenu tiers). À reconfirmer.
- **Interface bilingue FR/EN** : non tranchée — anglais proposé par défaut pour la v1 compte tenu de l'audience internationale de l'écosystème ciblé.
- **Stratégie de conversion de format entre apps** : non tranchée par l'utilisateur — mode "aperçu + confirmation" par défaut retenu par hypothèse de sécurité (voir section 6), avec option `--auto` pour bypasser une fois la confiance établie.
- **Fournisseur(s) LLM à supporter en priorité pour la génération/adaptation BYOK** : non précisé par l'utilisateur — proposé par défaut : Anthropic, OpenAI et Google en connecteurs natifs dès le MVP (cohérents avec les outils déjà ciblés), plus un connecteur générique compatible OpenAI pour couvrir le reste (Mistral, Grok, DeepSeek, modèles locaux) — à confirmer si un fournisseur précis doit être prioritaire dès la v1.

