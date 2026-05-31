const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// Chemin vers le fichier de données
const dataPath = path.join(app.getPath("userData"), "livres.json");

// Charger les données depuis le fichier JSON
function chargerDonnees() {
  try {
    if (fs.existsSync(dataPath)) {
      const contenu = fs.readFileSync(dataPath, "utf-8");
      return JSON.parse(contenu);
    }
  } catch (err) {
    console.error("Erreur lecture données:", err);
  }
  return [];
}

// Sauvegarder les données dans le fichier JSON
function sauvegarderDonnees(livres) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(livres, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Erreur sauvegarde données:", err);
    return false;
  }
}

function creerFenetre() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hidden",
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#0f0e17",
  });

  win.loadFile("index.html");
  // win.webContents.openDevTools(); // Décommenter pour déboguer
}

app.whenReady().then(() => {
  creerFenetre();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) creerFenetre();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ─── Gestionnaires IPC (communication fenêtre ↔ main) ───────────────────────

ipcMain.handle("livres:lire", () => {
  return chargerDonnees();
});

ipcMain.handle("livres:ajouter", (event, livre) => {
  const livres = chargerDonnees();
  livre.id = Date.now().toString();
  livre.dateCreation = new Date().toISOString();
  livres.push(livre);
  sauvegarderDonnees(livres);
  return livres;
});

ipcMain.handle("livres:modifier", (event, livreModifie) => {
  const livres = chargerDonnees();
  const index = livres.findIndex((l) => l.id === livreModifie.id);
  if (index !== -1) {
    livres[index] = { ...livres[index], ...livreModifie };
    sauvegarderDonnees(livres);
  }
  return livres;
});

ipcMain.handle("livres:supprimer", (event, id) => {
  let livres = chargerDonnees();
  livres = livres.filter((l) => l.id !== id);
  sauvegarderDonnees(livres);
  return livres;
});

// Contrôles de fenêtre
ipcMain.on("fenetre:fermer", () => {
  BrowserWindow.getFocusedWindow()?.close();
});
ipcMain.on("fenetre:minimiser", () => {
  BrowserWindow.getFocusedWindow()?.minimize();
});
ipcMain.on("fenetre:maximiser", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win?.isMaximized()) win.unmaximize();
  else win?.maximize();
});
