(() => {
  function stringifyForTemplate(value, key) {
    if (key === "normsJson" || key === "playerJson" || key === "certificatesJson") {
      return JSON.stringify(value ?? null, null, 2);
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (value === null || value === undefined || value === "") {
      return JSON.stringify("");
    }

    return JSON.stringify(String(value));
  }

  function compileTemplate(templateText, context) {
    return String(templateText || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      return stringifyForTemplate(context[key], key);
    });
  }

  function buildPlayersJson(db) {
    const players = (db.players || []).map((player) => ({
      username: player.username || "",
      title: player.title || "",
      rating: player.rating === "" ? "" : Number(player.rating),
      norms: (player.norms || []).map((norm) => ({
        link: norm.link || "",
        date: norm.date || "",
        titleAtTime: norm.titleAtTime || ""
      }))
    }));

    return JSON.stringify(players, null, 2);
  }

  function buildGeneratedCode(templateText, player, overrides = {}) {
    const context = {
      username: overrides.username ?? player?.username ?? "",
      title: overrides.title ?? player?.title ?? "",
      rating: overrides.rating ?? player?.rating ?? "",
      norms: overrides.norms ?? player?.norms ?? [],
      normsJson: overrides.normsJson ?? player?.norms ?? [],
      playerJson: player ?? {},
      certificatesJson: overrides.certificatesJson ?? []
    };

    return compileTemplate(templateText, context);
  }

  function downloadPlayersJson(db) {
    const json = buildPlayersJson(db);
    RKStorage.downloadText("players.json", json, "application/json");
    return json;
  }

  function copyText(text) {
    return navigator.clipboard.writeText(text);
  }

  window.RKGenerator = {
    buildPlayersJson,
    buildGeneratedCode,
    downloadPlayersJson,
    copyText
  };
})();
