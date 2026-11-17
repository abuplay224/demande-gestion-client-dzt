# Doztra — Gestion des demandes clients (MVP)

Application web interne qui permet à l’équipe Doztra de 
**saisir**, 
**consulter**,
**modifier**, 
**prioriser** et 
**supprimer** 
les demandes reçues des clients. Interface en français,
heures affichées dans le fuseau Africa/Conakry. Spécification :
[docs/Cahier-des-charges-Doztra-MVP.md](docs/Cahier-des-charges-Doztra-MVP.md).
Guide d’utilisation : [docs/guide-utilisateur.md](docs/guide-utilisateur.md).
Guide développeur : [docs/guide-developpement.md](docs/guide-developpement.md).

## Accès et rôles

Connexion par e-mail et mot de passe ([Better Auth](https://www.better-auth.com), sessions en
cookie HttpOnly de 12 h, mots de passe hachés). 
    **Aucune inscription publique** : 
les comptes sont créés par un administrateur.

| Rôle | Droits |
|---|---|
| Agent | Consulter, ajouter, modifier et prioriser les demandes |
| Administrateur | Idem + supprimer les demandes et gérer les comptes (`/admin/utilisateurs`) : créer, changer le rôle, désactiver / réactiver |

Toute page renvoie vers `/connexion` sans session (`proxy.ts`), et chaque Server Action
vérifie elle-même la session et, lorsque nécessaire, le rôle (`lib/session.ts`). Un administrateur ne peut ni
modifier son propre rôle ni se désactiver. Un compte désactivé perd immédiatement ses sessions.

> Écart assumé avec le cahier des charges (§2 « mêmes droits pour tous ») : les rôles Agent et
> Administrateur ont été ajoutés à la demande de Doztra pour la gestion des comptes.

## API mobile (v1)

API HTTP authentifiée pour l’application React Native, sous `/api/v1` : connexion par jeton
Bearer (accès 15 min, rafraîchissement à usage unique 30 jours), liste, détail, création
idempotente, priorité et suppression définitive des demandes. La gestion des comptes reste sur le web.

La modification du contenu est disponible depuis le panneau de détail web. Seuls les
administrateurs peuvent supprimer définitivement ; l’interface web demande une confirmation
avant l’effacement et les clients mobiles doivent également confirmer avant d’appeler
l’endpoint de suppression. L’API mobile v1 ne propose pas encore la modification.

- Guide du développeur mobile : [docs/api-mobile.md](docs/api-mobile.md)
- Contrat OpenAPI 3.1 : [docs/api/openapi.yaml](docs/api/openapi.yaml)

> Écart assumé avec le cahier des charges (§6 « pas d’API REST publique ») : l’API a été
> ouverte à la demande de Doztra pour l’app mobile. Elle n’est pas publique (toute route sauf
> `/health` exige une session) et réutilise exactement la logique métier du web
> (`server/services/requests.ts`).

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 ·
shadcn/ui (Base UI) · MySQL · Prisma 7 (adaptateur MariaDB) · Zod · Vitest · Playwright.

## Prérequis

- Node.js 24
- MySQL 8.0.16 ou plus récent (pour l’application des contraintes `CHECK`)
- Microsoft Edge (utilisé par les tests de bout en bout ; aucun navigateur à télécharger)

## Installation

```bash
npm install                 # installe les dépendances et génère le client Prisma
```

Sous PowerShell, créez le fichier local de configuration avec :

```powershell
Copy-Item .env.example .env
```

Sous macOS/Linux, utilisez `cp .env.example .env`. Dans les deux cas, renseignez ensuite
les URL MySQL et les secrets décrits dans `.env.example`. Ne partagez et ne commitez
jamais `.env`.

`.env` définit deux bases distinctes :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Base MySQL de développement (ex. `doztra_dev`) |
| `DATABASE_URL_TEST` | Base MySQL de test (ex. `doztra_test`), **vidée par les tests** ; son nom doit contenir « test » |

Avec un compte administrateur MySQL, créer les bases et un utilisateur dédié à l’application :

```sql
CREATE DATABASE doztra_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE doztra_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'doztra'@'localhost' IDENTIFIED BY 'MOT_DE_PASSE_FORT';
GRANT ALL PRIVILEGES ON doztra_dev.* TO 'doztra'@'localhost';
GRANT ALL PRIVILEGES ON doztra_test.* TO 'doztra'@'localhost';
```

Remplacez le mot de passe d’exemple et utilisez les mêmes identifiants dans `.env`.
Appliquer ensuite les migrations :

```bash
npm run db:migrate          # applique les migrations sur la base de développement
npm run db:seed             # charge 26 demandes fictives (sans doublon si relancé)
npm run db:test:deploy      # applique les migrations sur la base de test
```

Compléter `.env` avec `BETTER_AUTH_SECRET` (clé aléatoire, voir `.env.example`) et
`BETTER_AUTH_URL`, puis créer le premier administrateur (mot de passe demandé sans écho) :

```bash
npm run admin:create -- --email prenom.nom@doztra.com --name "Prénom Nom"
```

## Lancement

```bash
npm run dev                 # http://localhost:3000 (redirige vers /demandes)
npm run build && npm start  # mode production
```

## Tests

```bash
npm run lint && npm run typecheck
npm test                    # unitaires + intégration (Vitest, base de test réelle)
npm run test:unit
npm run test:integration
npm run test:e2e            # build puis parcours Playwright sur la base de test
npx vitest run -t "R18"     # un seul test par son nom
npx playwright test -g "R09"
```

Les tests d’intégration et de bout en bout refusent de démarrer si `DATABASE_URL_TEST`
désigne la même base que `DATABASE_URL`.

### Couverture de la recette (cahier des charges §9)

| ID | Scénario | Couvert par |
|---|---|---|
| R01 | Saisie valide sans coordonnées | intégration, e2e |
| R02 | Champ obligatoire vide ou hors limites | unitaire, intégration, e2e |
| R03 | E-mail invalide | unitaire, intégration |
| R04 | Téléphone avec `+` et zéro initial | unitaire, intégration, e2e |
| R05 | Double clic ou renvoi du même envoi | intégration (y compris envois simultanés), e2e |
| R06 | Données conservées après actualisation et redémarrage | e2e (actualisation) ; redémarrage du serveur vérifié manuellement, pas automatisé |
| R07 | Aucune demande | intégration, e2e |
| R08 | Plus de 20 demandes | intégration, e2e |
| R09 | Marquage prioritaire | intégration, e2e |
| R10 | Retrait de priorité | intégration, e2e |
| R11 | Même valeur envoyée deux fois | intégration |
| R12 | Base indisponible à la création | intégration (base simulée en échec) |
| R13 | Échec du changement de priorité | intégration (base simulée en échec) |
| R14 | Identifiant absent ou invalide | unitaire, intégration |
| R15 | Visiteur non autorisé, y compris appel serveur direct | intégration (actions et lectures sans session, agent sur actions d’administration), e2e (redirections) |
| R16 | Navigation mobile et clavier | e2e (375 px, parcours au clavier) ; vérification manuelle recommandée |
| R17 | Modification depuis une autre session | e2e |
| R18 | Même UUID, contenu différent | intégration |
| R19 | Balises ou tentative SQL | intégration |
| R20 | Suppression définitive après confirmation | intégration, API, e2e |
| R21 | Modification validée et authentifiée depuis le détail web | unitaire, intégration, e2e |

La cible de performance (§8 : 1 000 demandes, 5 utilisateurs) n’a pas encore été mesurée.

## Organisation du code

```
app/demandes/                 liste (Server Component) et /nouvelle (formulaire)
components/demandes/          tableau, cartes, panneau de détail, formulaire, états
components/ui/                composants shadcn/ui adaptés à la charte
server/services/              logique métier des demandes, partagée par le web et l’API
server/queries/               lectures web (session vérifiée → service)
server/actions/               Server Actions web (session vérifiée → service)
app/api/v1/                   API mobile (Route Handlers : jeton vérifié → service)
lib/api/                      socle de l’API : réponses, erreurs, jetons, débit
server/validation/            schémas Zod partagés interface / serveur
lib/db.ts                     client Prisma (serveur uniquement)
prisma/                       schéma, migrations (avec contraintes CHECK), seed
tests/unit|integration|e2e/   Vitest et Playwright
```

## Déploiement

1. Base MySQL de production distincte, sauvegarde quotidienne et restauration testée.
2. Variables `DATABASE_URL`, `BETTER_AUTH_SECRET` (propre à la production) et `BETTER_AUTH_URL` (URL https publique) fournies par l’hébergeur, jamais dans le dépôt.
3. `npm ci && npm run db:deploy && npm run build && npm start`, derrière HTTPS.
4. Créer le premier administrateur avec `npm run admin:create`.
5. Après chaque nouvelle migration (ex. `api_sessions` pour l’API mobile), l’appliquer sur la base de production **avant** de pousser le code qui en dépend.
6. Facultatif : `MOBILE_MIN_APP_VERSION` force la mise à jour des apps mobiles plus anciennes (réponse 426).
