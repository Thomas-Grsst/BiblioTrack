const { contextBridge, ipcRenderer } = require("electron");

// On expose uniquement les fonctions nécessaires au renderer (index.html)
// C'est la bonne pratique de sécurité Electron
contextBridge.exposeInMainWorld("api", {
  // Livres
  lireLivres: () => ipcRenderer.invoke("livres:lire"),
  ajouterLivre: (livre) => ipcRenderer.invoke("livres:ajouter", livre),
  modifierLivre: (livre) => ipcRenderer.invoke("livres:modifier", livre),
  supprimerLivre: (id) => ipcRenderer.invoke("livres:supprimer", id),

  // Contrôles fenêtre
  fermer: () => ipcRenderer.send("fenetre:fermer"),
  minimiser: () => ipcRenderer.send("fenetre:minimiser"),
  maximiser: () => ipcRenderer.send("fenetre:maximiser"),
});
