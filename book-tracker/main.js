const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");

// ── Initialisation de la base SQLite ────────────────────────────
// Le fichier bibliotrack.db sera créé automatiquement dans le dossier userData
let db;

function initDB() {
  const dbPath = path.join(app.getPath("userData"), "bibliotrack.db");
  db = new Database(dbPath);

  // Création de la table si elle n'existe pas encore
  db.exec(`
    CREATE TABLE IF NOT EXISTS livres (
      id            TEXT PRIMARY KEY,
      titre         TEXT NOT NULL,
      auteur        TEXT NOT NULL,
      description   TEXT NOT NULL,
      categorie     TEXT NOT NULL,
      dateCreation  TEXT NOT NULL,
      dateDebut     TEXT,
      dateFin       TEXT,
      note          REAL
    )
  `);
}

// ── Fenêtre principale ───────────────────────────────────────────
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
  initDB();
  creerFenetre();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) creerFenetre();
  });
});

app.on("window-all-closed", () => {
  if (db) db.close(); // Fermer proprement la BDD avant de quitter
  if (process.platform !== "darwin") app.quit();
});

// ═══════════════════════════════════════════════════════════════
//  GESTIONNAIRES IPC — communication fenêtre ↔ main
// ═══════════════════════════════════════════════════════════════

// Lire tous les livres
ipcMain.handle("livres:lire", () => {
  const stmt = db.prepare("SELECT * FROM livres ORDER BY dateCreation DESC");
  return stmt.all();
  // .all() retourne un tableau d'objets JavaScript, exactement comme avant avec le JSON
});

// Ajouter un livre
ipcMain.handle("livres:ajouter", (event, livre) => {
  livre.id = Date.now().toString();
  livre.dateCreation = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO livres (id, titre, auteur, description, categorie, dateCreation, dateDebut, dateFin, note)
    VALUES (@id, @titre, @auteur, @description, @categorie, @dateCreation, @dateDebut, @dateFin, @note)
  `);

  stmt.run({
    id: livre.id,
    titre: livre.titre,
    auteur: livre.auteur,
    description: livre.description,
    categorie: livre.categorie,
    dateCreation: livre.dateCreation,
    dateDebut: livre.dateDebut ?? null,
    dateFin: livre.dateFin ?? null,
    note: livre.note ?? null,
  });

  // On retourne tous les livres (comme avant) pour que le renderer se mette à jour
  return db.prepare("SELECT * FROM livres ORDER BY dateCreation DESC").all();
});

// Modifier un livre
ipcMain.handle("livres:modifier", (event, livre) => {
  const stmt = db.prepare(`
    UPDATE livres
    SET titre       = @titre,
        auteur      = @auteur,
        description = @description,
        categorie   = @categorie,
        dateDebut   = @dateDebut,
        dateFin     = @dateFin,
        note        = @note
    WHERE id = @id
  `);

  stmt.run({
    id: livre.id,
    titre: livre.titre,
    auteur: livre.auteur,
    description: livre.description,
    categorie: livre.categorie,
    dateDebut: livre.dateDebut ?? null,
    dateFin: livre.dateFin ?? null,
    note: livre.note ?? null,
  });

  return db.prepare("SELECT * FROM livres ORDER BY dateCreation DESC").all();
});

// Supprimer un livre
ipcMain.handle("livres:supprimer", (event, id) => {
  db.prepare("DELETE FROM livres WHERE id = ?").run(id);
  return db.prepare("SELECT * FROM livres ORDER BY dateCreation DESC").all();
});

// ── Contrôles de fenêtre ─────────────────────────────────────────
ipcMain.on("fenetre:fermer", () => BrowserWindow.getFocusedWindow()?.close());
ipcMain.on("fenetre:minimiser", () =>
  BrowserWindow.getFocusedWindow()?.minimize(),
);
ipcMain.on("fenetre:maximiser", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win?.isMaximized()) win.unmaximize();
  else win?.maximize();
});
