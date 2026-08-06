# ROADMAP — Keness

Document compagnon de `BLUEPRINT.md`
**Date de rédaction :** 6 août 2026 — v0.1

---

## 1. Vue d'ensemble de la roadmap

Keness vise à devenir l'outil de référence pour créer, stocker et synchroniser des skills, agents, rules et configurations MCP entre plusieurs assistants de code IA (Claude Code, Codex, Antigravity, Gemini CLI, Opencode, Cursor, et d'autres à venir), sans que l'utilisateur ait à connaître les conventions propres à chaque outil.

Aucune date de lancement ferme n'a été communiquée au moment du cadrage — cette roadmap sert de **séquencement**, pas d'engagement de dates.

**Principe de séquencement retenu :** on livre d'abord le **cœur d'adaptation et de détection** (la vraie valeur différenciante), avec seulement 2 adaptateurs fonctionnels, avant d'élargir aux 6 outils et d'ajouter l'interface graphique — pour valider l'architecture d'adaptateur sur un périmètre restreint avant de la généraliser.

---

## 2. Étapes de développement (jusqu'au lancement)

1. **Setup infrastructure** — monorepo initialisé (pnpm workspaces, sans Turborepo), dépôt GitHub public créé, CI GitHub Actions de base (lint + build), squelette des packages `core`/`cli`/`web`. Stack validée : Preact + Vite pour le dashboard, @clack/prompts pour les prompts CLI, Vitest pour les tests, Fastify pour le serveur web.
   *Jalon : `pnpm build` passe sur les 3 packages.*

2. **Fondations techniques** — module `paths.ts` (résolution de chemin par OS pour les 6 outils, global + projet), module `detect` (détection PATH + dossier de config), manifeste JSON du registre local.
   *Jalon : `keness detect` liste correctement les outils installés sur une machine de test Windows, une macOS, une Linux.*

3. **Premiers adaptateurs (Claude Code + Cursor)** — implémentation complète de l'interface `AppAdapter` pour ces deux outils : lecture, écriture, format (Markdown + frontmatter YAML), permissions.
   *Jalon : un skill créé via Keness apparaît correctement dans `.claude/skills/` et `.cursor/skills/` et est reconnu par les deux outils.*

4. **Fonctionnalités MVP (Must-have)** — `create`, `push`, `diff`, `sync`, `rm`, `export` en CLI, sur les 2 premiers adaptateurs, avec le mode "aperçu + confirmation" par défaut.
   *Jalon : démo fonctionnelle en local couvrant tout le cycle create → push → modif manuelle → sync → rm.*

4bis. **Génération & adaptation par IA (BYOK)** — module `generation/`, gestion de clé via trousseau OS (`keness auth`), connecteurs Anthropic/OpenAI/Google + connecteur générique compatible OpenAI, commande `keness generate <type> "<description>"`, flag `--ai-adapt` sur `push`/`sync`, mode `--dry-run`.
   *Jalon : un skill généré uniquement à partir d'une description texte est accepté sans modification par les 2 premiers adaptateurs (Claude Code + Cursor) ; aucune clé API n'apparaît en clair dans les logs ou le manifeste.*

5. **Extension aux 4 adaptateurs restants** — Codex, Antigravity, Gemini CLI, Opencode, avec gestion explicite des cas particuliers (formats TOML pour Codex, absence de dossier "rules" dédié pour Codex/Gemini CLI/Opencode fallback vers fichier d'instructions principal, convention `agent.md` littérale pour Antigravity).
   *Jalon : les 6 adaptateurs passent la même suite de tests de conformité.*

6. **Dashboard web local** — serveur local (`keness ui`) + interface reprenant les actions du CLI, aperçu de diff visuel par app.
   *Jalon : création et synchronisation multi-app réalisables entièrement depuis le navigateur, sans toucher au terminal.*

7. **Sécurité & durcissement** — heuristique de détection de contenu suspect à l'import, gestion des divergences (fichier modifié manuellement), mode dry-run systématique, tests E2E sur les 3 OS.
   *Jalon : aucune écriture destructive ne se produit sans confirmation explicite dans la suite de tests.*

8. **Tests & recette** — tests unitaires par adaptateur, tests d'intégration multi-OS en CI (matrice GitHub Actions Windows/macOS/Linux), recette manuelle complète.
   *Jalon : CI verte sur les 3 OS pour une release candidate.*

9. **Lancement (early access)** — publication npm `0.1.0`, documentation minimale sur `keness.dev`, annonce dans des communautés ciblées (r/ClaudeAI, forums Cursor/OpenCode, Show HN) pour retours avant `1.0.0`.
   *Jalon : premiers retours utilisateurs externes collectés et priorisés.*

*Durées : à estimer avec l'équipe de développement — aucune contrainte de délai communiquée par l'utilisateur au moment du cadrage.*

---

## 3. Fonctionnalités Should/Could non incluses au lancement

Repoussées après le MVP (voir section 4 pour l'horizon précis) :
- Historique des modifications + `keness rollback` → court terme.
- Mode dry-run global configurable par défaut (au-delà des commandes destructives déjà couvertes en MVP) → court terme.
- Profils réutilisables (ensembles nommés de skills/rules) → court terme.
- Templates de démarrage rapide par langage/framework → moyen terme.
- Marketplace communautaire de skills → moyen terme.
- Système de plugins pour adaptateurs tiers (sans toucher au core) → moyen terme.
- Intégration Git optionnelle (commit auto de la bibliothèque) → court terme.

---

## 4. Évolutions potentielles

### Court terme (0-3 mois après lancement)
- **Historique & rollback** — indexer chaque push dans le manifeste avec horodatage et hash, permettre un retour arrière ciblé. *Valeur : sécurité et confiance accrues pour adopter le mode `--auto`. Complexité : faible — extension directe du manifeste JSON existant.*
- **Profils réutilisables** — nommer un ensemble de skills/rules et l'appliquer en une commande à un nouveau projet (`keness apply-profile freelance-fullstack`). *Valeur : gain de temps majeur pour les utilisateurs ayant un socle d'outils stable. Complexité : moyenne.*
- **Intégration Git optionnelle** — commit automatique de `~/.keness/library` à chaque modification, pour que l'utilisateur ait son propre historique versionné sans configuration manuelle. *Valeur : sauvegarde naturelle sans dépendance à un service tiers. Complexité : faible.*
- **Ajustements UX** issus des retours de l'early access (CLI et dashboard).

### Moyen terme (3-12 mois)
- **Nouveaux adaptateurs** — Mistral Vibe, Windsurf/Devin Local, GLM Code (ZCode), Grok Build, Qwen Code, au fur et à mesure que leur écosystème se stabilise — permis directement par l'architecture d'adaptateurs sans refonte du core.
- **Marketplace communautaire** — publication et installation de skills partagés par d'autres utilisateurs Keness, avec scan de sécurité automatique avant installation (inspiré des pratiques déjà en place chez des concurrents comme Agensi). *Valeur : effet réseau, adoption élargie. Complexité : élevée — nécessite un backend hébergé (rupture avec le principe local-first du MVP), une modération de contenu, une politique de sécurité stricte à l'installation.*
- **Système de plugins pour adaptateurs tiers** — permettre à la communauté d'ajouter le support d'un nouvel outil sans passer par une PR sur le core. *Valeur : scalabilité de la couverture d'outils. Complexité : moyenne à élevée (design d'API stable nécessaire).*
- **Templates de démarrage rapide** par écosystème (Next.js, Python/FastAPI, etc.). *Complexité : faible à moyenne, dépend surtout du volume de contenu à produire.*
- **Bibliothèque de prompts affinée par retours d'usage** — améliorer la qualité de génération par type d'élément et par adaptateur à partir des corrections que les utilisateurs font sur le contenu généré (sans jamais faire remonter le contenu lui-même à un serveur Keness, cohérent avec le principe local-first). *Valeur : réduit l'écart entre le premier jet généré et ce que l'utilisateur garde réellement. Complexité : moyenne.*
- **Support de modèles locaux en première classe** (Ollama/LM Studio) au-delà du simple connecteur compatible OpenAI générique déjà couvert au MVP — utile pour les utilisateurs qui refusent d'envoyer leurs descriptions à un fournisseur cloud. *Complexité : faible, le connecteur générique couvre déjà partiellement ce besoin.*

### Long terme (12 mois et plus)
- **Application desktop packagée (Tauri)** — réutilisation directe de l'UI web déjà développée dans une coquille Tauri, avec accès natif au système de fichiers sans passer par un serveur local lancé manuellement. *Valeur : meilleure expérience pour les utilisateurs non familiers du terminal. Complexité : moyenne, grâce à la réutilisation de l'UI existante — cohérent avec le choix de stack Node/TS fait dès le MVP.*
- **Gestion d'équipe/organisation** — bibliothèques partagées d'équipe avec synchronisation centralisée (ex. via un dépôt Git d'équipe dédié plutôt qu'un backend propriétaire, pour rester cohérent avec l'esprit local-first). *Valeur : adoption en contexte pro/entreprise. Complexité : élevée.*
- **API publique** — permettre à d'autres outils (CI, IDE plugins) d'interroger/piloter Keness programmatiquement. *Complexité : moyenne, dépend de la stabilité atteinte par le core à ce stade.*
- ⚠️ Si la marketplace ou la gestion d'équipe atteint une échelle significative, revoir le choix "fichiers + manifeste JSON" du MVP au profit d'une base de données réelle (ex. SQLite embarqué ou backend Postgres pour la partie marketplace hébergée) — signalé explicitement ici pour ne pas être découvert tardivement.

---

## 5. Principes techniques transversaux

Ces principes ont été validés explicitement et s'appliquent à toutes les étapes :

- **Légèreté avant tout** : chaque dépendance doit être justifiée par un besoin concret. Pas de framework lourd si une alternative légère couvre le besoin (ex. Preact vs React, @clack vs Inquirer, pnpm scripts vs Turborepo).
- **100 % open-source** : toutes les dépendances sont sous licence MIT ou équivalente (ISC, Apache-2.0). Aucune dépendance propriétaire ou à licence restrictive.
- **Local-first** : aucune donnée ne quitte la machine de l'utilisateur sans action explicite — pas de télémétrie, pas de backend Keness, pas de compte obligatoire.
- **Zéro compilation native** : éviter les modules natifs (`node-gyp`) pour garantir une installation cross-platform sans friction (`npm install -g keness` doit fonctionner sur les 3 OS sans prérequis supplémentaires).

---

## 6. Hypothèses de la roadmap

- Le rythme de développement (répartition en 9 étapes) suppose une équipe réduite (1 à quelques développeurs) travaillant de façon itérative — à ajuster si l'effectif réel diffère.
- La priorité donnée à "2 adaptateurs d'abord, puis les 6" est une hypothèse de gestion de risque technique (valider l'architecture avant de la généraliser) — à valider avec l'utilisateur si une couverture complète dès le lancement est jugée indispensable au positionnement du produit.
- La marketplace communautaire est traitée comme une évolution moyen terme et non comme un objectif du MVP, faute de réponse explicite de l'utilisateur sur ce point — à reconfirmer avant de considérer cette partie de la roadmap comme figée.
- Aucune échéance ferme n'ayant été communiquée, les horizons "court/moyen/long terme" sont comptés à partir de la date de lancement effective, quelle qu'elle soit.

