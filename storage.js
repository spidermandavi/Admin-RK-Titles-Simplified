(() => {
  const STORAGE_KEY = "rk_titles_admin_db_v1";

  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function defaultTemplateContent() {
    return `{
  "username": {{username}},
  "title": {{title}},
  "rating": {{rating}},
  "norms": {{normsJson}}
}`;
  }

  function defaultDB() {
    return {
      players: [],
      certificates: [],
      templates: [
        {
          id: newId(),
          name: "Default player block",
          content: defaultTemplateContent()
        }
      ]
    };
  }

  function normalizePlayer(player) {
    return {
      id: player?.id || newId(),
      username: String(player?.username || "").trim(),
      title: String(player?.title || "").trim(),
      rating:
        player?.rating === "" || player?.rating === null || player?.rating === undefined
          ? ""
          : Number.isFinite(Number(player.rating))
            ? Number(player.rating)
            : "",
      norms: Array.isArray(player?.norms)
        ? player.norms.map((n) => ({
            id: n?.id || newId(),
            link: String(n?.link || "").trim(),
            date: String(n?.date || "").trim(),
            titleAtTime: String(n?.titleAtTime || "").trim()
          }))
        : []
    };
  }

  function normalizeCertificate(cert) {
    return {
      id: cert?.id || newId(),
      username: String(cert?.username || "").trim(),
      title: String(cert?.title || "").trim(),
      imageUrl: String(cert?.imageUrl || "").trim(),
      date: String(cert?.date || "").trim()
    };
  }

  function normalizeTemplate(template) {
    return {
      id: template?.id || newId(),
      name: String(template?.name || "").trim(),
      content: String(template?.content || "")
    };
  }

  function normalizeDB(raw) {
    const base = defaultDB();
    const obj = raw && typeof raw === "object" ? raw : {};

    const players = Array.isArray(obj.players) ? obj.players.map(normalizePlayer) : [];
    const certificates = Array.isArray(obj.certificates) ? obj.certificates.map(normalizeCertificate) : [];
    const templates = Array.isArray(obj.templates) && obj.templates.length
      ? obj.templates.map(normalizeTemplate)
      : base.templates;

    return { players, certificates, templates };
  }

  function loadDB() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultDB();
      return normalizeDB(JSON.parse(raw));
    } catch {
      return defaultDB();
    }
  }

  function saveDB(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeDB(db)));
  }

  function exportDB() {
    return JSON.stringify(loadDB(), null, 2);
  }

  function importDBFromJSON(jsonText) {
    const parsed = JSON.parse(jsonText);
    const db = normalizeDB(parsed);
    saveDB(db);
    return db;
  }

  function downloadText(filename, text, mimeType = "application/json") {
    const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function cloneDB(db) {
    return normalizeDB(JSON.parse(JSON.stringify(db)));
  }

  window.RKStorage = {
    STORAGE_KEY,
    newId,
    defaultDB,
    loadDB,
    saveDB,
    exportDB,
    importDBFromJSON,
    downloadText,
    cloneDB,
    normalizeDB
  };
})();
