# SimDive - Simulateur d'Ordinateur de Plongée

Application web pédagogique en Vue.js pour l'enseignement de la décompression, librement inspirée par [e-Plouf](https://e-plouf.com/).

## 👀 Démo

Testez l'application sur https://simdive.pages.dev

## 🎯 Objectif

SimDive permet aux moniteurs de plongée de simuler des plongées virtuelles avec leurs élèves, en observant les indications d'un ordinateur de plongée : profondeur, temps, NDL (No-Deco Limit), pression d'air, saturation des tissus, etc.

### 🤔 Pourquoi ne pas utiliser e-Plouf ?

[e-Plouf](https://e-plouf.com/) nécesite une licence Excel pour pouvoir débloquer toutes les fonctionnalités, et repose sur des macros nécessitant d'abaisser la sécurité de son ordinateur durant l'utilisation. Si, comme moi, vous ne pouvez pas vous permettre ces pré-requis, alors SimDive est fait pour vous 🤗.

## ✨ Fonctionnalités

- **Affichage réaliste** d'un ordinateur de plongée avec style LCD
- **Layouts personnalisables** : créez vos propres affichages d'ordinateur de plongée
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
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour déploiement en production
npm run build
```

## 📁 Configuration des profils de plongée

Les profils de plongée sont définis dans `public/data/dive-profiles.json`. Les enseignants peuvent modifier ce fichier pour créer leurs propres scénarios pédagogiques.

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

## 🖥️ Configuration des layouts d'ordinateur

Les layouts permettent de personnaliser l'apparence et les informations affichées par l'ordinateur de plongée. Les enseignants peuvent créer leurs propres layouts pour simuler différents modèles d'ordinateurs.

### Structure des fichiers

```
public/data/layouts/
├── layouts.json           # Index des layouts disponibles
└── default/
    └── config.json        # Configuration du layout par défaut
```

### Créer un nouveau layout

1. Créez un nouveau dossier dans `public/data/layouts/` (ex: `suunto-style/`)
2. Copiez `default/config.json` dans votre nouveau dossier
3. Modifiez la configuration selon vos besoins
4. Ajoutez une entrée dans `layouts.json` :

```json
{
  "layouts": [
    { "id": "default", "name": "SimDive Default", "path": "default" },
    { "id": "suunto-style", "name": "Style Suunto", "path": "suunto-style" }
  ]
}
```

### Structure d'un layout

```json
{
  "id": "default",
  "name": "SimDive Default",
  "description": "Layout par défaut avec affichage complet",
  "grid": { "columns": 2, "gap": "16px" },
  "header": { "title": "SimDive", "showModeToggle": true },
  "cells": [
    { "type": "depth", "span": 2, "primary": true, "showMax": true, "label": "Profondeur" },
    { "type": "time", "label": "Temps" },
    { "type": "ndl", "label": "NDL", "labelDeco": "Palier" },
    { "type": "air", "showGauge": true, "label": "Pression" },
    { "type": "autonomy", "label": "Autonomie" },
    { "type": "tts", "mode": "expert", "label": "TTS" },
    { "type": "ceiling", "mode": "expert", "label": "Plafond" },
    { "type": "ascentRate", "mode": "expert", "label": "Vitesse" },
    { "type": "sac", "mode": "expert", "label": "Conso" }
  ],
  "sections": {
    "safetyStop": true,
    "decoStops": "expert",
    "warnings": true
  },
  "theme": {
    "lcdText": "#00ff88",
    "lcdWarning": "#ffcc00",
    "lcdCritical": "#ff3344",
    "accentCyan": "#00d4ff"
  }
}
```

### Types de cellules disponibles

| Type        | Description                          | Options                    |
| ----------- | ------------------------------------ | -------------------------- |
| `depth`     | Profondeur actuelle                  | `showMax`, `primary`       |
| `time`      | Temps de plongée                     | -                          |
| `ndl`       | No-Deco Limit / Palier               | `labelDeco`                |
| `air`       | Pression du bloc                     | `showGauge`                |
| `autonomy`  | Temps d'air restant                  | -                          |
| `tts`       | Time To Surface                      | -                          |
| `ceiling`   | Plafond de décompression             | -                          |
| `ascentRate`| Vitesse de remontée                  | -                          |
| `sac`       | Consommation instantanée             | -                          |

### Options des cellules

| Option      | Type      | Description                                           |
| ----------- | --------- | ----------------------------------------------------- |
| `type`      | string    | Type de cellule (obligatoire)                         |
| `label`     | string    | Libellé affiché                                       |
| `span`      | number    | Nombre de colonnes occupées (défaut: 1)               |
| `primary`   | boolean   | Style mis en valeur                                   |
| `mode`      | string    | Afficher uniquement en mode `essential` ou `expert`   |
| `showMax`   | boolean   | Pour depth: afficher la profondeur max                |
| `showGauge` | boolean   | Pour air: afficher la jauge graphique                 |
| `labelDeco` | string    | Pour ndl: libellé alternatif en décompression         |

### Personnalisation du thème

Les couleurs peuvent être personnalisées dans la section `theme` :

| Variable       | Description                    | Défaut    |
| -------------- | ------------------------------ | --------- |
| `lcdText`      | Texte principal LCD            | `#00ff88` |
| `lcdTextDim`   | Texte secondaire LCD           | `#00994d` |
| `lcdWarning`   | Couleur d'alerte               | `#ffcc00` |
| `lcdCritical`  | Couleur critique               | `#ff3344` |
| `accentCyan`   | Accent cyan                    | `#00d4ff` |
| `accentBlue`   | Accent bleu                    | `#0066cc` |
| `bgPrimary`    | Fond principal                 | `#0a1628` |
| `bgPanel`      | Fond des panneaux              | `#122a4d` |
| `gaugeFull`    | Jauge pleine                   | `#00ff88` |
| `gaugeLow`     | Jauge basse                    | `#ff6600` |
| `gaugeCritical`| Jauge critique                 | `#ff3344` |

## 🏗️ Architecture

```
src/
├── components/
│   ├── DiveComputerDisplay.vue  # Affichage principal (config-driven)
│   ├── DisplayCell.vue          # Cellule d'affichage générique
│   ├── LayoutSelector.vue       # Sélection du layout
│   ├── PlaybackControls.vue     # Contrôles lecture
│   ├── ProfileSelector.vue      # Sélection profil
│   ├── TissueSaturationGraph.vue # Graphique tissus
│   ├── ModeToggle.vue           # Basculeur mode
│   └── AirGauge.vue             # Jauge d'air
├── composables/
│   ├── useDiveEngine.ts         # Moteur de simulation
│   ├── useDecompression.ts      # Calculs déco (Bühlmann)
│   ├── useAirConsumption.ts     # Calculs air
│   └── useLayout.ts             # Gestion des layouts
├── types/
│   └── dive.ts                  # Types TypeScript
└── assets/styles/
    └── dive-computer.css        # Styles LCD

public/data/
├── dive-profiles.json           # Profils de plongée
└── layouts/
    ├── layouts.json             # Index des layouts
    └── default/
        └── config.json          # Configuration layout par défaut
```

## ⚠️ Avertissement

**Cette application est uniquement destinée à l'enseignement.**

Elle ne doit en aucun cas être utilisée pour planifier des plongées réelles. Les calculs de décompression sont simplifiés à des fins pédagogiques.

## 📝 Licence

MIT (Projet open source à but éducatif).

## 🙏 Crédits

Librement iInspiré par [e-Plouf](https://e-plouf.com/), application créée par le Club Olympique de Sèvres section Plongée.
