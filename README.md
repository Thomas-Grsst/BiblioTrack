# 📚 BiblioTrack

Une application desktop pour gérer ta bibliothèque personnelle, construite avec **Electron.js**.

---

## ✨ Fonctionnalités

- Ajouter, modifier et supprimer des livres
- 4 catégories : **Terminé**, **En cours**, **Pas commencé**, **Futur Achat**
- Champs supplémentaires selon la catégorie (dates de lecture, note /20)
- Recherche en temps réel
- Données sauvegardées localement sur ton ordinateur

---

## 🚀 Installation & Lancement

### Prérequis

- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- [Git](https://git-scm.com/)

### Étapes

**1. Cloner le projet**

```bash
git clone https://github.com/Thomas-Grsst/BiblioTrack.git
cd BiblioTrack/book-tracker
```

**2. Installer les dépendances**

```bash
npm install
```

**3. Lancer l'application**

```bash
npm start
```

---

## 📁 Structure du projet

```
BiblioTrack/
└── book-tracker/
    ├── main.js          # Processus principal Electron (gestion fichiers, fenêtre)
    ├── preload.js       # Pont sécurisé entre main et l'interface
    ├── renderer.js      # Logique de l'interface utilisateur
    ├── index.html       # Interface graphique (HTML + CSS)
    └── package.json     # Dépendances du projet
```
