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

## 🏗️ Architecture

```
web/src/
├── components/
│   ├── DiveComputerDisplay.vue  # Affichage principal
│   ├── DiveProfileChart.vue     # Graphique du profil
│   ├── PlaybackControls.vue     # Contrôles lecture
│   ├── ProfileSelector.vue      # Sélection profil
│   ├── TissueSaturationGraph.vue # Graphique tissus
│   ├── ModeToggle.vue           # Basculeur mode
│   └── AirGauge.vue             # Jauge d'air
├── composables/
│   ├── useDiveEngine.ts         # Moteur de simulation
│   ├── useDecompression.ts      # Calculs déco (Bühlmann)
│   └── useAirConsumption.ts     # Calculs air
├── types/
│   └── dive.ts                  # Types TypeScript
└── assets/styles/
    └── dive-computer.css        # Styles LCD
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
