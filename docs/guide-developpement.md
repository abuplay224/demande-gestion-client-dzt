# Guide développeur

Ce guide décrit comment installer, tester et faire évoluer **Demandes clients Doztra**.
Pour l’installation rapide, les scripts et le déploiement, voir aussi le
[README](../README.md). Pour le fonctionnement côté utilisateur, voir le
[guide d’utilisation](./guide-utilisateur.md).

## Prérequis et configuration locale

- Node.js 24 et npm.
- MySQL 8.0.16 ou plus récent (les migrations s’appuient sur les contraintes `CHECK`).
- Microsoft Edge pour les tests de bout en bout.

Depuis la racine du projet, copiez `.env.example` vers `.env` (PowerShell :
`Copy-Item .env.example .env`), puis renseignez les valeurs localement. Les variables sont :

| Variable | Obligatoire | Usage |
|---|---:|---|
| `DATABASE_URL` | Oui | URL MySQL de développement (`mysql://utilisateur:mot-de-passe@hôte:3306/doztra_dev`) |
| `DATABASE_URL_TEST` | Oui pour les tests d’intégration/e2e | URL MySQL distincte, réinitialisée par les tests |
| `BETTER_AUTH_SECRET` | Oui | Clé aléatoire d’au moins 32 caractères pour les sessions |
| `BETTER_AUTH_URL` | Oui | Origine de l’application, par exemple `http://localhost:3000` |
| `MOBILE_MIN_APP_VERSION` | Non | Version mobile minimale ; vide pour désactiver le contrôle |

La base de test doit être différente de la base de développement et son nom doit contenir
`test`. Les tests d’intégration et e2e effacent son contenu. N’utilisez jamais une base
contenant des données réelles comme base de test. `.env` contient des secrets : il ne doit
pas être ajouté au contrôle de version ni transmis à un tiers.

Installer les dépendances et préparer la base locale :

```powershell
npm install
npm run db:migrate
npm run db:seed
npm run db:test:deploy
```

Créer le premier compte administrateur :

```powershell
npm run admin:create -- --email prenom.nom@doztra.com --name "Prénom Nom"
```

Lancer le serveur de développement avec `npm run dev`, puis ouvrir
`http://localhost:3000`. Les autres commandes disponibles sont décrites dans le
[README](../README.md).

## Parcours utilisateur couverts

La suite automatise les principaux scénarios de l’application :

- connexion, accès refusé sans session et déconnexion ;
- création d’une demande, validation des champs, double envoi et conservation après actualisation ;
- consultation du registre, pagination, priorité, détail et navigation mobile/clavier ;
- modification depuis le détail, annulation de la modification et persistance ;
- suppression réservée aux administrateurs et confirmation avant effacement ;
- création, rôle et désactivation des comptes, y compris révocation des sessions ;
- routes HTTP de l’API mobile, authentification par jeton et gestion des erreurs.

Les scénarios de recette R01–R21 et leur niveau de test sont récapitulés dans le
[README](../README.md#couverture-de-la-recette-cahier-des-charges-9).

## Lancer et choisir les tests

```powershell
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
```

- **Unitaires** (`tests/unit`) : validation, formatage, logique pure et contrats de composants.
  Ils n’ont pas besoin de la base de données.
- **Intégration** (`tests/integration`) : Server Actions, services, accès et API avec MySQL.
  La session est simulée ; la base de test réelle est réinitialisée avant chaque test.
- **De bout en bout** (`tests/e2e`) : parcours dans Edge avec l’application construite, les sessions
  et une base de test. La commande construit l’application avant de lancer Playwright.

`npm test` lance les suites unitaires et d’intégration. Pour cibler un test :

```powershell
npx vitest run --project unit -t "variantes de bouton"
npm run test:e2e -- -g "annuler la modification"
```

Les tests e2e exigent que les migrations soient appliquées à la base de test.
`DATABASE_URL_TEST` est volontairement distincte et l’outil de test vérifie son nom avant
d’exécuter les commandes ; ne contournez pas cette protection.

## Organisation et responsabilités

| Emplacement | Responsabilité |
|---|---|
| `app/` | Pages, layouts et Route Handlers Next.js |
| `components/demandes/` | Interface du registre, formulaires, détail et interactions |
| `components/ui/` | Composants d’interface partagés ; les variantes visuelles des boutons y sont centralisées |
| `server/actions/` | Adaptateurs Server Actions : contrôle d’accès, appel métier et revalidation |
| `server/queries/` | Lectures destinées aux pages web, avec contrôle d’accès |
| `server/services/` | Source de vérité métier partagée entre le web et l’API |
| `server/validation/` | Schémas Zod réutilisés par les entrées web et API |
| `app/api/v1/` et `lib/api/` | Contrat HTTP mobile, authentification et format des réponses |
| `lib/` | Types, formatage, session, erreurs et accès à la base |
| `prisma/` | Modèle de données, migrations et données de démonstration |
| `tests/` | Suites unitaires, intégration et bout en bout |

Les composants d’interface ne doivent pas contenir de logique métier ou d’accès direct à la
base. Le service métier est partagé par les adaptateurs web et API ; chaque adaptateur vérifie
les droits avant de l’appeler. Les règles de saisie communes vont dans les schémas de
`server/validation/`, pas seulement dans le navigateur.

## Ajouter ou modifier une fonctionnalité

1. Définir les règles métier et les droits attendus (agent, administrateur, visiteur).
2. Mettre à jour le schéma Zod partagé si les données entrantes changent.
3. Implémenter la logique une seule fois dans `server/services/`.
4. Adapter le ou les points d’entrée concernés (`server/actions/` pour le web, Route Handler
   pour l’API) et vérifier les autorisations dans chacun.
5. Ajouter des tests unitaires pour les règles isolées, d’intégration pour les effets métier,
   puis e2e pour tout parcours utilisateur visible ou critique.
6. Si le schéma de données change, créer une migration Prisma et vérifier son application
   avant de déployer le code qui en dépend.
7. Exécuter lint, vérification TypeScript et les suites concernées avant la livraison.

Les tests d’intégration utilisent MySQL réel, sans mock du service de persistance.
Gardez chaque test indépendant : réinitialisez les données, ne dépendez pas de l’ordre des
fichiers et vérifiez les effets persistés. Pour les parcours e2e, utilisez les libellés accessibles
(rôles et noms) plutôt que des sélecteurs liés à la mise en page.

## Base de données et déploiement

En développement, `npm run db:migrate` crée/applique les migrations et `npm run db:seed`
charge les données fictives. Pour appliquer les migrations en production, utilisez
`npm run db:deploy` après avoir sauvegardé la base et avant de lancer une version qui dépend
de ces changements. Les secrets de production doivent être configurés sur l’hébergeur et
être distincts des secrets locaux.

Les migrations définissent le schéma MySQL, mais ne transfèrent pas automatiquement les
données d’une ancienne base. Planifiez séparément toute reprise de données avant le basculement.
