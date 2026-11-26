# SimDive - Simulateur d'Ordinateur de Plongée

Application web pédagogique en Vue.js pour l'enseignement de la décompression, librement inspirée par [e-Plouf](https://e-plouf.com/).

## 👀 Démo

Testez l'application sur https://simdive.pages.dev

## 🎯 Objectif

SimDive permet aux moniteurs de plongée de simuler des plongées virtuelles avec leurs élèves, en observant les indications d'un ordinateur de plongée : profondeur, temps, NDL (No-Deco Limit), pression d'air, saturation des tissus, etc.

### 🤔 Pourquoi ne pas utiliser e-Plouf ?

[e-Plouf](https://e-plouf.com/) nécessite une licence Excel pour pouvoir débloquer toutes les fonctionnalités, et repose sur des macros nécessitant d'abaisser la sécurité de son ordinateur durant l'utilisation. Si, comme moi, vous ne pouvez pas vous permettre ces pré-requis, alors SimDive est fait pour vous 🤗.

## ✨ Fonctionnalités

- **Affichage réaliste** d'un ordinateur de plongée avec style LCD
- **Modèles d'ordinateur** : poignet LCD, montre ronde couleur… et vos propres modèles via fichier JSON
- **Deux modes d'affichage** :
  - **Essentiel** : Profondeur, temps, NDL, pression d'air
  - **Expert** : Ajoute saturation des tissus, TTS, paliers, vitesse de remontée
- **Contrôles de lecture** : Play/Pause (bouton ou touche "Espace"), avance/recul pas à pas, vitesse variable (0.5x à 10x)
- **Profils de plongée configurables** via fichier JSON
- **Calcul de décompression** basé sur l'algorithme Bühlmann ZHL-16C
- **Gestion de l'air** avec SAC rate et événements (essoufflement, partage d'air)
- **Visualisation des tissus** : graphique de saturation N₂ des 16 compartiments

## 🚀 Démarrage rapide

### Avec Docker (recommandé)

```bash
# Construire et démarrer le conteneur
docker-compose up -d

# ou avec just
just run

# L'application est accessible sur http://localhost:5173
```

### Sans Docker

```bash
cd web

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour déploiement en production
npm run build
```

## 📁 Configuration des profils de plongée

Les profils de plongée sont définis dans `web/public/data/dive-profiles.json`. Les enseignants peuvent modifier ce fichier pour créer leurs propres scénarios pédagogiques.

### Structure d'un profil

```json
{
  "id": "basic-square-20m",
  "name": "Profil carré basique - 20m/30min",
  "description": "Plongée récréative simple pour débutants",
  "initialTankPressure": 200,
  "tankVolume": 12,
  "sacRate": 20,
  "waypoints": [
    { "time": 0, "depth": 0 },
    { "time": 2, "depth": 20 },
    { "time": 30, "depth": 20 },
    { "time": 35, "depth": 5 },
    { "time": 38, "depth": 0 }
  ],
  "events": []
}
```

### Paramètres

| Paramètre             | Description                                         |
| --------------------- | --------------------------------------------------- |
| `id`                  | Identifiant unique du profil                        |
| `name`                | Nom affiché dans le sélecteur                       |
| `description`         | Description pédagogique                             |
| `initialTankPressure` | Pression initiale du bloc (bar)                     |
| `tankVolume`          | Volume du bloc (litres)                             |
| `sacRate`             | Consommation d'air en surface (L/min)               |
| `waypoints`           | Points du profil (time en minutes, depth en mètres) |
| `events`              | Événements pendant la plongée                       |

### Types d'événements

- `breathingRateIncrease` : Essoufflement (augmente la conso)
- `breathingRateDecrease` : Retour à la normale
- `airSharing` : Partage d'air avec binôme (double la conso)
- `airSharingEnd` : Fin du partage
- `lowAirWarning` : Alerte réserve
- `criticalAirWarning` : Alerte air critique
- `rapidAscent` : Remontée rapide
- `safetyStopStart` / `safetyStopEnd` : Palier de sécurité

## 🖥️ Modèles d'ordinateur

Un ordinateur de plongée peut être une console rectangulaire, un poignet à grand écran LCD ou une montre ronde couleur, et chacun place ses informations à sa façon. Les **modèles** décrivent cette apparence : forme, type d'écran, écrans successifs, position et taille de chaque information, couleurs.

> ⚠️ Un modèle ne change **que l'affichage**. Les calculs restent ceux de SimDive (Bühlmann ZHL-16C avec facteurs de gradient), quel que soit le modèle : un modèle « inspiré de » ne reproduit pas l'algorithme du fabricant (RGBM, etc.). Pour cette raison, les modèles fournis portent des noms génériques.

Modèles fournis :

| Id            | Nom                  | Description                                                                                  |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| `simdive`     | SimDive              | Affichage pédagogique par défaut, intégré à l'application                                     |
| `wide-wrist`  | Poignet écran large  | Poignet d'entrée de gamme, LCD segmenté, sans intégration d'air (inspiré du Mares Nemo Wide) |
| `round-watch` | Montre ronde couleur | Montre à écran couleur rond, intégration d'air, trois écrans (inspirée de la Mares Sirius)    |

En mode **Expert**, un panneau « Données du moteur » affiche sous l'ordinateur les valeurs calculées (TTS, plafond, vitesse, consommation, paliers), y compris celles que le modèle choisi n'affiche pas.

### Structure des fichiers

```
public/data/computers/
├── index.json          # Liste des modèles à charger
├── wide-wrist.json
└── round-watch.json
```

Le modèle `simdive` est intégré au code (`useComputerModels.ts`) : il reste disponible même si les fichiers ne se chargent pas. Un fichier invalide est ignoré et ses erreurs s'affichent sous le sélecteur de modèle.

### Créer un modèle

1. Copiez un fichier existant de `public/data/computers/` (ex. `wide-wrist.json` → `mon-modele.json`)
2. Changez son `id` (unique) et adaptez-le
3. Ajoutez-le dans `index.json` avec le même `id` :

```json
{
  "models": [
    { "id": "wide-wrist", "file": "wide-wrist.json" },
    { "id": "mon-modele", "file": "mon-modele.json" }
  ]
}
```

### Structure d'un modèle

```json
{
  "id": "wide-wrist",
  "name": "Poignet écran large",
  "description": "Ordinateur poignet d'entrée de gamme à grand écran LCD segmenté.",
  "formFactor": {
    "shape": "rect",
    "aspectRatio": "4 / 3",
    "display": "segment-lcd",
    "cellStyle": "flat"
  },
  "screens": [
    {
      "id": "main",
      "name": "Principal",
      "columns": "3fr 2fr",
      "areas": ["depth ndl", "depth time", "stop stop"],
      "widgets": [
        { "area": "depth", "type": "depth", "size": "xl" },
        { "area": "ndl", "type": "ndl", "size": "lg" },
        { "area": "time", "type": "time" },
        { "area": "stop", "type": "safetyStop" }
      ]
    },
    {
      "id": "info",
      "name": "Informations",
      "areas": ["max ascent"],
      "widgets": [
        { "area": "max", "type": "maxDepth" },
        { "area": "ascent", "type": "ascentRate" }
      ]
    }
  ],
  "theme": { "bgLcd": "#b8c2a4", "lcdText": "#1c2119" }
}
```

#### `formFactor`

| Champ         | Valeurs                  | Description                                                                 |
| ------------- | ------------------------ | --------------------------------------------------------------------------- |
| `shape`       | `rect`, `round`          | Forme de l'écran (`round` : écran circulaire, toujours carré)               |
| `aspectRatio` | ex. `"4 / 3"`            | Proportions d'un écran `rect` (optionnel ; l'écran s'agrandit si besoin)    |
| `display`     | `segment-lcd`, `color`   | LCD segmenté (chiffres sombres, sans halo) ou écran couleur rétroéclairé    |
| `cellStyle`   | `panel`, `flat`          | Chaque valeur dans son cadre, ou valeurs dessinées directement sur l'écran |

#### Écrans (`screens`)

Chaque écran est une grille décrite par `areas`, comme `grid-template-areas` en CSS : une chaîne par ligne, un nom par colonne. Un nom répété sur plusieurs cases forme une zone, qui doit être un rectangle ; `.` laisse une case vide. `columns` (optionnel) fixe la largeur des colonnes (`grid-template-columns`, ex. `"3fr 2fr"`).

Quand un modèle a plusieurs écrans, le bouton ▸ sous l'ordinateur passe au suivant.

#### Widgets

| Type         | Affiche                              | Options spécifiques |
| ------------ | ------------------------------------ | ------------------- |
| `depth`      | Profondeur actuelle                  | `showMax`           |
| `maxDepth`   | Profondeur maximale                  | -                   |
| `time`       | Temps de plongée                     | -                   |
| `ndl`        | Temps sans palier, ou DECO           | `labelDeco`         |
| `air`        | Pression du bloc                     | `showGauge`         |
| `autonomy`   | Autonomie en air                     | -                   |
| `tts`        | Durée totale de remontée (TTS)       | -                   |
| `ceiling`    | Plafond (*)                          | -                   |
| `ascentRate` | Vitesse de remontée                  | -                   |
| `sac`        | Consommation instantanée             | -                   |
| `safetyStop` | Palier de sécurité en cours (*)      | -                   |
| `decoStops`  | Paliers obligatoires (*)             | -                   |
| `warnings`   | Alertes actives (*)                  | -                   |

(*) N'apparaît que lorsqu'il y a quelque chose à afficher ; la ligne se replie sinon.

Options communes : `area` (obligatoire, zone de la grille), `type` (obligatoire), `size` (`sm`, `md`, `lg`, `xl` ; défaut `md`, proportionnelle à la largeur de l'écran), `label` (libellé), `highlight` (mise en valeur, style `panel`).

#### Thème

Couleurs optionnelles, appliquées uniquement à l'ordinateur : `bgPrimary`, `bgSecondary` (boîtier), `bgLcd` (écran), `bgPanel` (cadres), `lcdText`, `lcdTextDim`, `lcdWarning`, `lcdCritical`, `lcdInfo`, `accentCyan`, `accentBlue`, `gaugeFull`, `gaugeMid`, `gaugeLow`, `gaugeCritical`. Les valeurs par défaut sont celles de `dive-computer.css`.

## 🏗️ Architecture

```
web/src/
├── components/
│   ├── DiveComputerDisplay.vue  # Ordinateur (forme, écrans, widgets du modèle)
│   ├── DisplayCell.vue          # Widget d'affichage (profondeur, NDL, alertes…)
│   ├── ComputerModelSelector.vue # Sélection du modèle d'ordinateur
│   ├── ExpertPanel.vue          # Données du moteur (mode Expert)
│   ├── DiveProfileChart.vue     # Graphique du profil
│   ├── PlaybackControls.vue     # Contrôles lecture
│   ├── ProfileSelector.vue      # Sélection profil
│   ├── TissueSaturationGraph.vue # Graphique tissus
│   ├── ModeToggle.vue           # Basculeur mode
│   └── AirGauge.vue             # Jauge d'air
├── composables/
│   ├── useDiveEngine.ts         # Moteur de simulation
│   ├── useDecompression.ts      # Calculs déco (Bühlmann)
│   ├── useAirConsumption.ts     # Calculs air
│   └── useComputerModels.ts     # Chargement et validation des modèles
├── types/
│   ├── dive.ts                  # Types TypeScript
│   └── computer.ts              # Types des modèles d'ordinateur
└── assets/styles/
    └── dive-computer.css        # Styles LCD

public/data/
├── dive-profiles.json           # Profils de plongée
└── computers/
    ├── index.json               # Liste des modèles
    └── *.json                   # Un fichier par modèle
```

## ⚠️ Avertissement

**Cette application est uniquement destinée à l'enseignement.**

Elle ne doit en aucun cas être utilisée pour planifier des plongées réelles. Les calculs de décompression sont simplifiés à des fins pédagogiques.

## 🤝 Contribuer

Les contributions sont les bienvenues ! Consultez le [guide de contribution](CONTRIBUTING.md) et le [code de conduite](CODE_OF_CONDUCT.md). Pour signaler une faille de sécurité, voir la [politique de sécurité](SECURITY.md).

## 📝 Licence

[MIT](LICENSE) (Projet open source à but éducatif).

## 🙏 Crédits

Librement inspiré par [e-Plouf](https://e-plouf.com/), application créée par le Club Olympique de Sèvres section Plongée.
