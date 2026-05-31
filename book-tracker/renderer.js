// ═══════════════════════════════════════════════════════════════
//  BIBLIOTRACK — renderer.js
//  Toute la logique de l'interface (dans la fenêtre Electron)
// ═══════════════════════════════════════════════════════════════

// ── État global ─────────────────────────────────────────────────
let livres = [];
let categorieActive = "tous";
let livreEnCoursEdition = null; // null = ajout, sinon l'objet livre à modifier

// ── Libellés et couleurs ────────────────────────────────────────
const CAT_INFO = {
  termine: {
    label: "✅ Terminé",
    classe: "cat-termine",
    couleur: "var(--termine)",
  },
  "en-cours": {
    label: "📖 En cours",
    classe: "cat-en-cours",
    couleur: "var(--en-cours)",
  },
  "pas-commence": {
    label: "🔖 Pas commencé",
    classe: "cat-pas-commence",
    couleur: "var(--pas-commence)",
  },
  futur: {
    label: "🛒 Futur Achat",
    classe: "cat-futur",
    couleur: "var(--futur)",
  },
};

// ── Chargement initial ──────────────────────────────────────────
async function init() {
  livres = await window.api.lireLivres();
  mettreAJourBadges();
  afficherLivres();
}

// ── Navigation (sidebar) ────────────────────────────────────────
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-item")
      .forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    categorieActive = item.dataset.cat;

    const titres = {
      tous: "Tous les livres",
      termine: "Terminé",
      "en-cours": "En cours",
      "pas-commence": "Pas commencé",
      futur: "Futur Achat",
    };
    document.getElementById("titre-categorie").textContent =
      titres[categorieActive];
    afficherLivres();
  });
});

// ── Recherche ───────────────────────────────────────────────────
document.getElementById("recherche").addEventListener("input", afficherLivres);

// ── Contrôles fenêtre ───────────────────────────────────────────
document
  .getElementById("btn-fermer")
  .addEventListener("click", () => window.api.fermer());
document
  .getElementById("btn-minimiser")
  .addEventListener("click", () => window.api.minimiser());
document
  .getElementById("btn-maximiser")
  .addEventListener("click", () => window.api.maximiser());

// ═══════════════════════════════════════════════════════════════
//  AFFICHAGE DES LIVRES
// ═══════════════════════════════════════════════════════════════

function afficherLivres() {
  const recherche = document.getElementById("recherche").value.toLowerCase();
  const grille = document.getElementById("grille-livres");

  let filtres = livres;

  // Filtre par catégorie
  if (categorieActive !== "tous") {
    filtres = filtres.filter((l) => l.categorie === categorieActive);
  }

  // Filtre par recherche
  if (recherche) {
    filtres = filtres.filter(
      (l) =>
        l.titre.toLowerCase().includes(recherche) ||
        l.auteur.toLowerCase().includes(recherche),
    );
  }

  if (filtres.length === 0) {
    grille.innerHTML = `
      <div class="vide" style="grid-column: 1/-1;">
        <div class="vide-icon">📚</div>
        <h3>Aucun livre ici</h3>
        <p>Ajoutez votre premier livre avec le bouton ci-dessous !</p>
      </div>
    `;
    return;
  }

  grille.innerHTML = filtres.map((livre) => creerCarteLivre(livre)).join("");

  // Ajouter les événements sur chaque carte
  grille.querySelectorAll(".carte-livre").forEach((carte) => {
    carte.addEventListener("click", () => {
      ouvrirDetail(carte.dataset.id);
    });
  });
}

function creerCarteLivre(livre) {
  const info = CAT_INFO[livre.categorie];
  let metaHTML = "";

  if (livre.categorie === "termine") {
    metaHTML = `
      <span>📅 ${formaterDate(livre.dateDebut)} → ${formaterDate(livre.dateFin)}</span>
      <span class="carte-note">⭐ ${livre.note}/20</span>
    `;
  } else if (livre.categorie === "en-cours") {
    metaHTML = `<span>📅 Depuis le ${formaterDate(livre.dateDebut)}</span>`;
  }

  return `
    <div class="carte-livre ${info.classe}" data-id="${livre.id}">
      <div class="carte-categorie">${info.label}</div>
      <div class="carte-titre">${echapper(livre.titre)}</div>
      <div class="carte-auteur">par ${echapper(livre.auteur)}</div>
      <div class="carte-desc">${echapper(livre.description)}</div>
      ${metaHTML ? `<div class="carte-meta">${metaHTML}</div>` : ""}
    </div>
  `;
}

function mettreAJourBadges() {
  document.getElementById("badge-tous").textContent = livres.length;
  document.getElementById("badge-termine").textContent = livres.filter(
    (l) => l.categorie === "termine",
  ).length;
  document.getElementById("badge-en-cours").textContent = livres.filter(
    (l) => l.categorie === "en-cours",
  ).length;
  document.getElementById("badge-pas-commence").textContent = livres.filter(
    (l) => l.categorie === "pas-commence",
  ).length;
  document.getElementById("badge-futur").textContent = livres.filter(
    (l) => l.categorie === "futur",
  ).length;
}

// ═══════════════════════════════════════════════════════════════
//  PANEL DÉTAIL
// ═══════════════════════════════════════════════════════════════

let livreDetailActuel = null;

function ouvrirDetail(id) {
  const livre = livres.find((l) => l.id === id);
  if (!livre) return;
  livreDetailActuel = livre;

  const info = CAT_INFO[livre.categorie];

  // Badge
  const badge = document.getElementById("d-badge");
  badge.textContent = info.label;
  badge.style.color = info.couleur;
  badge.style.background = `${info.couleur}18`;

  document.getElementById("d-titre").textContent = livre.titre;
  document.getElementById("d-auteur").textContent = "par " + livre.auteur;
  document.getElementById("d-desc").textContent = livre.description;

  // Infos supplémentaires
  const infosEl = document.getElementById("d-infos");
  let infosHTML = "";

  if (livre.categorie === "termine") {
    infosHTML = `
      <div class="detail-info-item">
        <div class="detail-info-label">Date de début</div>
        <div class="detail-info-val">${formaterDate(livre.dateDebut)}</div>
      </div>
      <div class="detail-info-item">
        <div class="detail-info-label">Date de fin</div>
        <div class="detail-info-val">${formaterDate(livre.dateFin)}</div>
      </div>
      <div class="detail-info-item">
        <div class="detail-info-label">Note</div>
        <div class="detail-info-val note">${livre.note} / 20</div>
      </div>
    `;
  } else if (livre.categorie === "en-cours") {
    infosHTML = `
      <div class="detail-info-item">
        <div class="detail-info-label">Lecture commencée le</div>
        <div class="detail-info-val">${formaterDate(livre.dateDebut)}</div>
      </div>
    `;
  }

  infosEl.innerHTML = infosHTML;

  document.getElementById("panel-detail").classList.add("visible");
}

document.getElementById("btn-detail-fermer").addEventListener("click", () => {
  document.getElementById("panel-detail").classList.remove("visible");
});

document.getElementById("btn-detail-modifier").addEventListener("click", () => {
  document.getElementById("panel-detail").classList.remove("visible");
  ouvrirModal(livreDetailActuel);
});

document
  .getElementById("btn-detail-supprimer")
  .addEventListener("click", async () => {
    if (!livreDetailActuel) return;
    const ok = confirm(`Supprimer "${livreDetailActuel.titre}" ?`);
    if (!ok) return;
    livres = await window.api.supprimerLivre(livreDetailActuel.id);
    document.getElementById("panel-detail").classList.remove("visible");
    mettreAJourBadges();
    afficherLivres();
  });

// Fermer le panel en cliquant en dehors
document.getElementById("panel-detail").addEventListener("click", (e) => {
  if (e.target === document.getElementById("panel-detail")) {
    document.getElementById("panel-detail").classList.remove("visible");
  }
});

// ═══════════════════════════════════════════════════════════════
//  MODAL AJOUT / MODIFICATION
// ═══════════════════════════════════════════════════════════════

let categorieSelectionnee = null;

document
  .getElementById("btn-ajouter")
  .addEventListener("click", () => ouvrirModal(null));

function ouvrirModal(livre = null) {
  livreEnCoursEdition = livre;
  categorieSelectionnee = livre ? livre.categorie : null;

  // Titre de la modal
  document.getElementById("modal-titre").textContent = livre
    ? "Modifier le livre"
    : "Ajouter un livre";
  document.getElementById("btn-modal-valider").textContent = livre
    ? "Enregistrer"
    : "Ajouter le livre";

  // Remplir les champs si modification
  document.getElementById("f-titre").value = livre ? livre.titre : "";
  document.getElementById("f-auteur").value = livre ? livre.auteur : "";
  document.getElementById("f-description").value = livre
    ? livre.description
    : "";
  document.getElementById("f-date-debut").value = livre?.dateDebut || "";
  document.getElementById("f-date-fin").value = livre?.dateFin || "";
  document.getElementById("f-note").value =
    livre?.note !== undefined ? livre.note : "";

  // Cacher les erreurs
  document
    .querySelectorAll(".erreur")
    .forEach((e) => (e.style.display = "none"));

  // Sélectionner la catégorie
  document.querySelectorAll(".cat-option").forEach((opt) => {
    opt.className = "cat-option";
    if (livre && opt.dataset.val === livre.categorie) {
      appliquerSelectionCategorie(opt);
    }
  });

  if (!livre) {
    document.getElementById("champs-dynamiques").style.display = "none";
  }

  document.getElementById("overlay").classList.add("visible");
}

// Sélection de catégorie dans la modal
document.querySelectorAll(".cat-option").forEach((opt) => {
  opt.addEventListener("click", () => {
    document
      .querySelectorAll(".cat-option")
      .forEach((o) => (o.className = "cat-option"));
    appliquerSelectionCategorie(opt);
  });
});

function appliquerSelectionCategorie(opt) {
  categorieSelectionnee = opt.dataset.val;
  opt.className = `cat-option selected-${categorieSelectionnee}`;
  afficherChampsDynamiques(categorieSelectionnee);
}

function afficherChampsDynamiques(cat) {
  const bloc = document.getElementById("champs-dynamiques");
  const blocDebut = document.getElementById("bloc-date-debut");
  const blocFin = document.getElementById("bloc-date-fin");
  const blocNote = document.getElementById("bloc-note");

  blocDebut.style.display = "none";
  blocFin.style.display = "none";
  blocNote.style.display = "none";
  bloc.style.display = "none";

  if (cat === "termine") {
    bloc.style.display = "block";
    document.getElementById("champs-dyn-titre").textContent =
      "Infos de lecture";
    blocDebut.style.display = "block";
    blocFin.style.display = "block";
    blocNote.style.display = "block";
  } else if (cat === "en-cours") {
    bloc.style.display = "block";
    document.getElementById("champs-dyn-titre").textContent =
      "Infos de lecture";
    blocDebut.style.display = "block";
  }
}

// Fermer la modal
document
  .getElementById("btn-modal-annuler")
  .addEventListener("click", fermerModal);
document.getElementById("overlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("overlay")) fermerModal();
});

function fermerModal() {
  document.getElementById("overlay").classList.remove("visible");
  livreEnCoursEdition = null;
  categorieSelectionnee = null;
}

// Valider le formulaire
document
  .getElementById("btn-modal-valider")
  .addEventListener("click", async () => {
    if (!validerFormulaire()) return;

    const donnees = {
      titre: document.getElementById("f-titre").value.trim(),
      auteur: document.getElementById("f-auteur").value.trim(),
      description: document.getElementById("f-description").value.trim(),
      categorie: categorieSelectionnee,
    };

    if (
      categorieSelectionnee === "termine" ||
      categorieSelectionnee === "en-cours"
    ) {
      donnees.dateDebut = document.getElementById("f-date-debut").value;
    }
    if (categorieSelectionnee === "termine") {
      donnees.dateFin = document.getElementById("f-date-fin").value;
      donnees.note = parseFloat(document.getElementById("f-note").value);
    }

    if (livreEnCoursEdition) {
      // Modification : on conserve l'id
      donnees.id = livreEnCoursEdition.id;
      // On efface les vieux champs si la catégorie a changé
      donnees.dateDebut = donnees.dateDebut || null;
      donnees.dateFin = donnees.dateFin || null;
      donnees.note = donnees.note !== undefined ? donnees.note : null;
      livres = await window.api.modifierLivre(donnees);
    } else {
      livres = await window.api.ajouterLivre(donnees);
    }

    fermerModal();
    mettreAJourBadges();
    afficherLivres();
  });

function validerFormulaire() {
  let ok = true;

  const titre = document.getElementById("f-titre").value.trim();
  const auteur = document.getElementById("f-auteur").value.trim();
  const desc = document.getElementById("f-description").value.trim();

  // Cacher toutes les erreurs d'abord
  document
    .querySelectorAll(".erreur")
    .forEach((e) => (e.style.display = "none"));

  if (!titre) {
    document.getElementById("err-titre").style.display = "block";
    ok = false;
  }
  if (!auteur) {
    document.getElementById("err-auteur").style.display = "block";
    ok = false;
  }
  if (!desc) {
    document.getElementById("err-desc").style.display = "block";
    ok = false;
  }
  if (!categorieSelectionnee) {
    document.getElementById("err-cat").style.display = "block";
    ok = false;
  }

  if (
    categorieSelectionnee === "termine" ||
    categorieSelectionnee === "en-cours"
  ) {
    if (!document.getElementById("f-date-debut").value) {
      document.getElementById("err-date-debut").style.display = "block";
      ok = false;
    }
  }
  if (categorieSelectionnee === "termine") {
    if (!document.getElementById("f-date-fin").value) {
      document.getElementById("err-date-fin").style.display = "block";
      ok = false;
    }
    // Vérification : date de début doit être avant la date de fin
    const debut = document.getElementById("f-date-debut").value;
    const fin = document.getElementById("f-date-fin").value;
    if (debut && fin && debut >= fin) {
      document.getElementById("err-date-fin").style.display = "block";
      document.getElementById("err-date-fin").textContent =
        "La date de fin doit être après la date de début.";
      ok = false;
    }
    const note = document.getElementById("f-note").value;
    if (note === "" || isNaN(note) || note < 0 || note > 20) {
      document.getElementById("err-note").style.display = "block";
      ok = false;
    }
  }

  return ok;
}

// ═══════════════════════════════════════════════════════════════
//  UTILITAIRES
// ═══════════════════════════════════════════════════════════════

function formaterDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function echapper(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Lancement ───────────────────────────────────────────────────
init();
