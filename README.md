# ⚔️ Mantis Lords Boss Fight

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Audio-Web_Audio_API-F59E0B?style=for-the-badge&logo=soundcharts&logoColor=white)](https://developer.mozilla.org/fr/docs/Web/API/Web_Audio_API)
[![Gamepad API](https://img.shields.io/badge/Controls-Gamepad_API-8B5CF6?style=for-the-badge&logo=gamepad&logoColor=white)](https://developer.mozilla.org/fr/docs/Web/API/Gamepad_API)
[![Framerate](https://img.shields.io/badge/FPS-60_Locked-10B981?style=for-the-badge)](https://developer.mozilla.org/fr/docs/Web/API/window/requestAnimationFrame)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](LICENSE)

> Mini-jeu 2D Canvas autonome recréant le combat contre les Seigneurs Mantis.
> Entièrement programmé en TypeScript, React 19 et HTML5 Canvas avec musique procédurale Web Audio API.

---

## 📑 Table des Matières

- [Aperçu du Projet](#-aperçu-du-projet)
- [Fonctionnalités Clés](#-fonctionnalités-clés)
- [Contrôles & Maniabilité](#-contrôles--maniabilité)
- [Architecture Logicielle](#-architecture-logicielle)
- [Installation & Lancement](#-installation--lancement)
- [Licence & Mentions Légales](#-licence--mentions-légales)

---

## 🌌 Aperçu du Projet

Ce projet est un hommage technique et artistique :
- **Rendu vectoriel pur :** Aucune texture matricielle ou fichier audio externe n'est requis.
- **Format 16:9 Adaptatif :** Rendu Canvas 1280x720 redimensionné automatiquement.
- **Support Manette & Mobile :** Prise en charge Gamepad API (Xbox, PlayStation, Switch) et boutons tactiles.

---

## ✨ Fonctionnalités Clés

- Boucle à 60 FPS avec gestion précise du delta time (`dt`).
- Système d'attaques directionnelles et rebonds pogo verticaux.
- Canalisation de soin (Focus) avec particules d'Âme.
- Effets d'impact : hitstop, secousses de caméra (camera shake), et traînées fantômes (afterimages).
- Synthèse sonore 100% procédurale en direct via la Web Audio API.

---

## 🎮 Contrôles & Maniabilité

| Action | Clavier (AZERTY / QWERTY) | Manette (Gamepad) | Tactile |
| :--- | :--- | :--- | :--- |
| **Déplacement** | `Q, D` / `A, D` / `Flèches` | Stick Gauche / Croix | Boutons Gauche / Droite |
| **Visée Haut / Bas** | `Z, S` / `W, S` / `Haut, Bas` | Stick / Croix | Boutons Haut / Bas |
| **Saut** | `Espace` / `Z` / `W` / `Haut` | `A` (Croix) | Bouton SAUT |
| **Aiguillon (Attaque)** | `J` ou `X` | `X` (Carré) | Bouton ATTAQUE |
| **Pogo** | `Bas + Attaque` (en l'air) | `Bas + Attaque` (en l'air) | `Bas + ATTAQUE` |
| **Dash (Ruée)** | `L` ou `Shift` | `B` ou `Gâchettes` | Bouton DASH |
| **Focus (Soin)** | `K` ou `S` (au sol, immobile) | `Y` / `LT` / `RT` | Bouton SOIN |
| **Pause** | `Échap` ou `P` | `Start` | Bouton Pause HUD |

---

## 🏗️ Architecture Logicielle

```
├── src/
│   ├── game/
│   │   ├── types.ts          # Constantes, interfaces, états du jeu
│   │   ├── audio.ts          # Moteur audio procédural Web Audio API
│   │   ├── gamepad.ts        # Gestionnaire Gamepad API (vibrations, mapping)
│   │   ├── particles.ts      # Système d'effets visuels, ondes de choc et traînées
│   │   ├── player.ts         # Entité joueur, physique et actions
│   │   ├── boss.ts           # IA des boss, attaques combinées et boomerangs
│   │   ├── renderer.ts       # Rendu du décor et de l'arène
│   │   └── engine.ts         # Moteur central de simulation et collisions
│   │
│   ├── components/
│   │   ├── GameCanvas.tsx     # Composant Canvas 16:9 avec boucle de rendu
│   │   ├── HUD.tsx            # Interface utilisateur, santé et barre de vie boss
│   │   ├── TitleScreen.tsx    # Écran d'accueil
│   │   ├── VictoryModal.tsx   # Écran de victoire et statistiques
│   │   ├── GameOverModal.tsx  # Écran de défaite (Hallownest, Réessayer, Menu)
│   │   ├── PauseModal.tsx     # Menu de pause
│   │   ├── ControlsModal.tsx  # Guide des commandes
│   │   └── VirtualControls.tsx# Contrôles virtuels tactiles
│   │
│   ├── App.tsx               # Composant racine React et gestion d'état
│   ├── main.tsx              # Point d'entrée de montage DOM
│   └── index.css             # Styles globaux et Tailwind CSS
│
├── public/
│   └── favicon.svg           # Favicon vectoriel
├── index.html                # Document HTML principal
├── package.json              # Dépendances et scripts npm
└── tsconfig.json             # Configuration TypeScript stricte
```

---

## 🚀 Installation & Lancement

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Vérifier le typage TypeScript
npm run lint

# Compiler pour la production
npm run build
```

---

## 📜 Licence & Mentions Légales

Ce projet est publié sous licence [Apache-2.0](LICENSE).

*Projet hommage à but non lucratif. Les noms et concepts originaux de Hollow Knight appartiennent à Team Cherry.*
