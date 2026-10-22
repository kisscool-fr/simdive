# Contribuer à SimDive

Merci de l'intérêt que vous portez à SimDive ! 🤿

Que vous soyez moniteur de plongée, élève, développeur ou simplement curieux, toutes les contributions sont les bienvenues : signalement de bug, idée de fonctionnalité, nouveau profil de plongée pédagogique, correction de documentation ou de code.

En participant à ce projet, vous acceptez de respecter notre [Code de conduite](CODE_OF_CONDUCT.md).

## 📋 Sommaire

- [Signaler un bug](#-signaler-un-bug)
- [Proposer une fonctionnalité](#-proposer-une-fonctionnalité)
- [Proposer un profil de plongée](#-proposer-un-profil-de-plongée)
- [Contribuer au code](#-contribuer-au-code)
- [Signaler une faille de sécurité](#-signaler-une-faille-de-sécurité)

## 🐛 Signaler un bug

1. Vérifiez que le bug n'a pas déjà été signalé dans les [issues](https://github.com/kisscool-fr/simdive/issues).
2. Ouvrez une nouvelle issue avec le modèle **« Signaler un bug »**.
3. Décrivez précisément les étapes pour reproduire le problème, le profil de plongée utilisé, le comportement attendu et le comportement observé. Une capture d'écran aide beaucoup.

Si vous pensez qu'un **calcul de décompression est incorrect** (NDL, paliers, saturation des tissus…), indiquez si possible la valeur attendue et sa source (table, autre logiciel, référence bibliographique).

## 💡 Proposer une fonctionnalité

Ouvrez une issue avec le modèle **« Proposer une fonctionnalité »** en expliquant le besoin pédagogique auquel elle répond. Pour une évolution importante, merci d'en discuter dans une issue **avant** de commencer à coder : cela évite de travailler sur quelque chose qui ne pourra pas être intégré.

## 🗺️ Proposer un profil de plongée

Les profils sont définis dans [`web/public/data/dive-profiles.json`](web/public/data/dive-profiles.json) (voir la structure dans le [README](README.md#-configuration-des-profils-de-plongée)). Un nouveau profil doit :

- avoir un `id` unique ;
- avoir une `description` qui explique son intérêt pédagogique ;
- utiliser des valeurs réalistes (profondeur, durée, volume du bloc, consommation).

## 🛠️ Contribuer au code

### Prérequis

- [Docker](https://docs.docker.com/get-docker/) avec Docker Compose
- [just](https://github.com/casey/just)

Node.js n'a pas besoin d'être installé sur votre machine : tout s'exécute dans le conteneur Docker (la version de Node est définie dans [`.nvmrc`](.nvmrc)).

### Mise en place

```bash
# Forkez le dépôt sur GitHub, puis :
git clone https://github.com/<votre-compte>/simdive.git
cd simdive

# Démarrer le conteneur (l'application est servie sur http://localhost:5173)
just run

# Installer les dépendances si nécessaire
just exec npm install
```

Lancez `just` pour afficher toutes les commandes disponibles.

### Organisation du code

L'application (Vue 3 + TypeScript + Vite) se trouve dans le dossier [`web/`](web/) :

- `web/src/components/` : composants Vue de l'interface
- `web/src/composables/` : logique métier (moteur de simulation, décompression Bühlmann ZHL-16C, consommation d'air)
- `web/src/types/` : types TypeScript
- `web/public/data/` : profils de plongée
- Les tests unitaires ([Vitest](https://vitest.dev/)) sont placés dans des dossiers `__tests__/` à côté du code testé, sous la forme `*.spec.ts`.

### Workflow

1. Créez une branche à partir de `main` : `git checkout -b feat/ma-fonctionnalite`.
2. Faites vos modifications, en ajoutant ou mettant à jour les tests correspondants.
3. Validez vos changements :

   ```bash
   just ci
   ```

   Cette commande lance le linter, la vérification du formatage et les tests unitaires. En cas d'erreur, `just lint fix` et `just format` corrigent automatiquement la plupart des problèmes.

4. Vérifiez que le build de production (qui inclut la vérification des types) passe : `just exec npm run build`.
5. Committez en respectant les [Conventional Commits](https://www.conventionalcommits.org/fr/) (voir ci-dessous).
6. Poussez votre branche et ouvrez une Pull Request vers `main` en remplissant le modèle proposé.

La CI GitHub Actions rejoue le lint, le formatage, les tests et un scan de secrets (Gitleaks) sur chaque Pull Request : elle doit être verte pour que la PR soit fusionnée.

### Messages de commit

Le projet utilise les [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```
<type>(<portée optionnelle>): <description>
```

Types courants : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`.

Exemples :

```
feat(profiles): ajouter un profil de plongée à 40m avec paliers
fix(decompression): corriger le calcul du NDL en remontée
docs: compléter le guide de contribution
```

### Bonnes pratiques

- Gardez les Pull Requests ciblées : une PR = un sujet.
- L'interface et la documentation sont en français ; le code (noms de variables, fonctions) est en anglais.
- Toute modification des calculs de décompression ou de consommation d'air doit être accompagnée de tests et, si possible, d'une source justifiant le résultat attendu.

## 🔒 Signaler une faille de sécurité

Merci de **ne pas** ouvrir d'issue publique : suivez la procédure décrite dans notre [politique de sécurité](SECURITY.md).

## 📝 Licence

En contribuant, vous acceptez que vos contributions soient publiées sous la [licence MIT](LICENSE) du projet.
