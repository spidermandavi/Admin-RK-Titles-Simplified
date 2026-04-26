(() => {
  const state = {
    db: RKStorage.loadDB(),
    editingPlayerId: "",
    editingNorm: { playerId: "", normId: "" },
    editingCertificateId: "",
    editingTemplateId: ""
  };

  const els = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function initElements() {
    const ids = [
      "playerCount",
      "certificateCount",
      "templateCount",
      "playerForm",
      "playerId",
      "playerUsername",
      "playerTitle",
      "playerRating",
      "clearPlayerFormBtn",
      "playersList",
      "normForm",
      "normPlayerId",
      "normId",
      "normPlayerSelect",
      "normTitleAtTime",
      "normLink",
      "normDate",
      "clearNormFormBtn",
      "certificateForm",
      "certificateId",
      "certificateUsername",
      "certificateTitle",
      "certificateImageUrl",
      "certificateDate",
      "clearCertificateFormBtn",
      "certificatesList",
      "templateForm",
      "templateId",
      "templateName",
      "templateContent",
      "templateSelect",
      "clearTemplateFormBtn",
      "generatorPlayerSelect",
      "generatorTemplateSelect",
      "fillFromPlayerBtn",
      "genUsername",
      "genTitle",
      "genRating",
      "genNormsJson",
      "generateCodeBtn",
      "copyCodeBtn",
      "downloadCodeBtn",
      "codeOutput",
      "downloadPlayersJsonBtn",
      "copyPlayersJsonBtn",
      "playersJsonPreview",
      "exportDbBtn",
      "importDbInput"
    ];

    ids.forEach((id) => {
      els[id] = byId(id);
    });
  }

  function save() {
    RKStorage.saveDB(state.db);
  }

  function normalizeUsername(value) {
    return String(value || "").trim();
  }

  function findPlayerById(id) {
    return state.db.players.find((p) => p.id === id) || null;
  }

  function findPlayerByUsername(username) {
    const target = normalizeUsername(username).toLowerCase();
    return state.db.players.find((p) => normalizeUsername(p.username).toLowerCase() === target) || null;
  }

  function findTemplateById(id) {
    return state.db.templates.find((t) => t.id === id) || null;
  }

  function uniquePlayerCheck(username, ignoreId = "") {
    const target = normalizeUsername(username).toLowerCase();
    return state.db.players.some(
      (p) => normalizeUsername(p.username).toLowerCase() === target && p.id !== ignoreId
    );
  }

  function setPlayerForm(player = null) {
    els.playerId.value = player?.id || "";
    els.playerUsername.value = player?.username || "";
    els.playerTitle.value = player?.title || "";
    els.playerRating.value = player?.rating === "" || player?.rating === undefined ? "" : player.rating;
    state.editingPlayerId = player?.id || "";
  }

  function clearPlayerForm() {
    setPlayerForm(null);
  }

  function setNormForm(playerId = "", norm = null) {
    els.normPlayerId.value = playerId || "";
    els.normId.value = norm?.id || "";
    els.normPlayerSelect.value = playerId || "";
    els.normTitleAtTime.value = norm?.titleAtTime || "";
    els.normLink.value = norm?.link || "";
    els.normDate.value = norm?.date || "";
    state.editingNorm = { playerId: playerId || "", normId: norm?.id || "" };
  }

  function clearNormForm() {
    setNormForm("", null);
    els.normPlayerSelect.value = state.db.players[0]?.id || "";
  }

  function setCertificateForm(cert = null) {
    els.certificateId.value = cert?.id || "";
    els.certificateUsername.value = cert?.username || "";
    els.certificateTitle.value = cert?.title || "";
    els.certificateImageUrl.value = cert?.imageUrl || "";
    els.certificateDate.value = cert?.date || "";
    state.editingCertificateId = cert?.id || "";
  }

  function clearCertificateForm() {
    setCertificateForm(null);
  }

  function setTemplateForm(template = null) {
    els.templateId.value = template?.id || "";
    els.templateName.value = template?.name || "";
    els.templateContent.value = template?.content || "";
    state.editingTemplateId = template?.id || "";
  }

  function clearTemplateForm() {
    setTemplateForm(null);
  }

  function getSelectedTemplate() {
    const templateId = els.generatorTemplateSelect.value;
    return findTemplateById(templateId) || state.db.templates[0] || null;
  }

  function getSelectedPlayerForGenerator() {
    return findPlayerById(els.generatorPlayerSelect.value);
  }

  function fillGeneratorFromPlayer(player) {
    if (!player) return;
    els.genUsername.value = player.username || "";
    els.genTitle.value = player.title || "";
    els.genRating.value = player.rating === "" ? "" : player.rating;
    els.genNormsJson.value = JSON.stringify(player.norms || [], null, 2);
  }

  function renderSelectOptions() {
    const playerOptions = state.db.players
      .slice()
      .sort((a, b) => normalizeUsername(a.username).localeCompare(normalizeUsername(b.username)))
      .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.username || "(untitled)")}</option>`)
      .join("");

    const templateOptions = state.db.templates
      .map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name || "(untitled template)")}</option>`)
      .join("");

    const emptyPlayerOption = `<option value="">No player selected</option>`;
    els.normPlayerSelect.innerHTML = playerOptions ? `${emptyPlayerOption}${playerOptions}` : emptyPlayerOption;
    els.generatorPlayerSelect.innerHTML = playerOptions ? `${emptyPlayerOption}${playerOptions}` : emptyPlayerOption;

    els.templateSelect.innerHTML = templateOptions || `<option value="">No templates</option>`;
    els.generatorTemplateSelect.innerHTML = templateOptions || `<option value="">No templates</option>`;

    if (!els.normPlayerSelect.value) {
      els.normPlayerSelect.value = state.db.players[0]?.id || "";
    }
    if (!els.generatorPlayerSelect.value) {
      els.generatorPlayerSelect.value = state.db.players[0]?.id || "";
    }
    if (!els.templateSelect.value) {
      els.templateSelect.value = state.db.templates[0]?.id || "";
    }
    if (!els.generatorTemplateSelect.value) {
      els.generatorTemplateSelect.value = state.db.templates[0]?.id || "";
    }
  }

  function renderStats() {
    els.playerCount.textContent = String(state.db.players.length);
    els.certificateCount.textContent = String(state.db.certificates.length);
    els.templateCount.textContent = String(state.db.templates.length);
  }

  function renderPlayers() {
    if (!state.db.players.length) {
      els.playersList.innerHTML = `<div class="item"><p class="item-title">No players yet</p><p class="item-meta">Add one above to start tracking norms.</p></div>`;
      return;
    }

    const sorted = state.db.players
      .slice()
      .sort((a, b) => normalizeUsername(a.username).localeCompare(normalizeUsername(b.username)));

    els.playersList.innerHTML = sorted
      .map((player) => {
        const norms = (player.norms || [])
          .slice()
          .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
          .map(
            (norm) => `
              <div class="subitem">
                <div>
                  <a href="${escapeHtml(norm.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(norm.link)}</a>
                  <small>${escapeHtml(norm.date || "No date")} · title at time: ${escapeHtml(norm.titleAtTime || "-")}</small>
                </div>
                <div class="item-actions">
                  <button class="small-btn" data-action="edit-norm" data-player-id="${escapeHtml(player.id)}" data-norm-id="${escapeHtml(norm.id)}">Edit</button>
                  <button class="small-btn small-danger" data-action="delete-norm" data-player-id="${escapeHtml(player.id)}" data-norm-id="${escapeHtml(norm.id)}">Delete</button>
                </div>
              </div>
            `
          )
          .join("");

        return `
          <div class="item">
            <div class="item-head">
              <div>
                <p class="item-title">${escapeHtml(player.username || "(untitled player)")}</p>
                <div class="item-meta">
                  Title: ${escapeHtml(player.title || "-")} · Rating: ${escapeHtml(player.rating === "" ? "-" : String(player.rating))}
                </div>
              </div>

              <div class="item-actions">
                <button class="small-btn" data-action="edit-player" data-id="${escapeHtml(player.id)}">Edit</button>
                <button class="small-btn" data-action="add-norm" data-id="${escapeHtml(player.id)}">Add norm</button>
                <button class="small-btn small-danger" data-action="delete-player" data-id="${escapeHtml(player.id)}">Delete</button>
              </div>
            </div>

            <div class="sublist">
              ${norms || `<div class="subitem"><div><small>No norms stored yet.</small></div></div>`}
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderCertificates() {
    if (!state.db.certificates.length) {
      els.certificatesList.innerHTML = `<div class="item"><p class="item-title">No certificates yet</p><p class="item-meta">Add certificate image links here.</p></div>`;
      return;
    }

    const sorted = state.db.certificates
      .slice()
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    els.certificatesList.innerHTML = sorted
      .map(
        (cert) => `
          <div class="item">
            <div class="item-head">
              <div>
                <p class="item-title">${escapeHtml(cert.username || "(no username)")} · ${escapeHtml(cert.title || "-")}</p>
                <div class="item-meta">${escapeHtml(cert.date || "No date")}</div>
              </div>
              <div class="item-actions">
                <button class="small-btn" data-action="edit-certificate" data-id="${escapeHtml(cert.id)}">Edit</button>
                <button class="small-btn small-danger" data-action="delete-certificate" data-id="${escapeHtml(cert.id)}">Delete</button>
              </div>
            </div>

            <div class="sublist">
              <div class="subitem">
                <div>
                  <a href="${escapeHtml(cert.imageUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cert.imageUrl)}</a>
                </div>
              </div>
            </div>
          </div>
        `
      )
      .join("");
  }

  function renderTemplates() {
    if (!state.db.templates.length) {
      return;
    }

    if (!state.editingTemplateId && !els.templateId.value) {
      const current = findTemplateById(els.templateSelect.value) || state.db.templates[0];
      if (current) setTemplateForm(current);
    }
  }

  function renderPreview() {
    els.playersJsonPreview.value = RKGenerator.buildPlayersJson(state.db);
  }

  function refreshAll() {
    state.db = RKStorage.normalizeDB(state.db);
    save();

    renderStats();
    renderSelectOptions();
    renderPlayers();
    renderCertificates();
    renderTemplates();
    renderPreview();
    syncGeneratorFromCurrentSelection();
  }

  function syncGeneratorFromCurrentSelection() {
    const player = getSelectedPlayerForGenerator();
    if (player && !els.genUsername.value && !els.genTitle.value && !els.genRating.value && !els.genNormsJson.value) {
      fillGeneratorFromPlayer(player);
      return;
    }

    if (!els.genNormsJson.value && player) {
      els.genNormsJson.value = JSON.stringify(player.norms || [], null, 2);
    }
  }

  function handlePlayerSubmit(e) {
    e.preventDefault();

    const username = normalizeUsername(els.playerUsername.value);
    const title = String(els.playerTitle.value || "").trim();
    const ratingRaw = String(els.playerRating.value || "").trim();
    const rating = ratingRaw === "" ? "" : Number(ratingRaw);

    if (!username) {
      alert("Please enter a username.");
      return;
    }

    if (uniquePlayerCheck(username, els.playerId.value)) {
      alert("That username already exists.");
      return;
    }

    if (els.playerId.value) {
      const player = findPlayerById(els.playerId.value);
      if (!player) {
        alert("Player not found.");
        return;
      }
      player.username = username;
      player.title = title;
      player.rating = ratingRaw === "" || Number.isNaN(rating) ? "" : rating;
    } else {
      state.db.players.push({
        id: RKStorage.newId(),
        username,
        title,
        rating: ratingRaw === "" || Number.isNaN(rating) ? "" : rating,
        norms: []
      });
    }

    clearPlayerForm();
    refreshAll();
  }

  function handleNormSubmit(e) {
    e.preventDefault();

    const playerId = els.normPlayerSelect.value || els.normPlayerId.value;
    const player = findPlayerById(playerId);

    if (!player) {
      alert("Please choose a player.");
      return;
    }

    const link = String(els.normLink.value || "").trim();
    const date = String(els.normDate.value || "").trim();
    const titleAtTime = String(els.normTitleAtTime.value || "").trim();

    if (!link || !date) {
      alert("Please fill in the norm link and date.");
      return;
    }

    if (els.normId.value) {
      const norm = (player.norms || []).find((n) => n.id === els.normId.value);
      if (!norm) {
        alert("Norm not found.");
        return;
      }
      norm.link = link;
      norm.date = date;
      norm.titleAtTime = titleAtTime;
    } else {
      player.norms = player.norms || [];
      player.norms.push({
        id: RKStorage.newId(),
        link,
        date,
        titleAtTime
      });
    }

    clearNormForm();
    refreshAll();
  }

  function handleCertificateSubmit(e) {
    e.preventDefault();

    const username = normalizeUsername(els.certificateUsername.value);
    const title = String(els.certificateTitle.value || "").trim();
    const imageUrl = String(els.certificateImageUrl.value || "").trim();
    const date = String(els.certificateDate.value || "").trim();

    if (!username || !imageUrl || !date) {
      alert("Please fill in username, image URL, and date.");
      return;
    }

    if (els.certificateId.value) {
      const cert = state.db.certificates.find((c) => c.id === els.certificateId.value);
      if (!cert) {
        alert("Certificate not found.");
        return;
      }
      cert.username = username;
      cert.title = title;
      cert.imageUrl = imageUrl;
      cert.date = date;
    } else {
      state.db.certificates.push({
        id: RKStorage.newId(),
        username,
        title,
        imageUrl,
        date
      });
    }

    clearCertificateForm();
    refreshAll();
  }

  function handleTemplateSubmit(e) {
    e.preventDefault();

    const name = String(els.templateName.value || "").trim();
    const content = String(els.templateContent.value || "");

    if (!name) {
      alert("Please enter a template name.");
      return;
    }

    if (els.templateId.value) {
      const tpl = findTemplateById(els.templateId.value);
      if (!tpl) {
        alert("Template not found.");
        return;
      }
      tpl.name = name;
      tpl.content = content;
    } else {
      state.db.templates.push({
        id: RKStorage.newId(),
        name,
        content
      });
    }

    clearTemplateForm();
    refreshAll();
  }

  function handleListClicks(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === "edit-player") {
      const player = findPlayerById(btn.dataset.id);
      if (player) setPlayerForm(player);
      return;
    }

    if (action === "add-norm") {
      const player = findPlayerById(btn.dataset.id);
      if (player) {
        setNormForm(player.id, null);
        els.normPlayerSelect.value = player.id;
        els.normPlayerId.value = player.id;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (action === "delete-player") {
      const player = findPlayerById(btn.dataset.id);
      if (!player) return;
      if (!confirm(`Delete ${player.username} and all of their norms?`)) return;
      state.db.players = state.db.players.filter((p) => p.id !== player.id);
      if (state.editingPlayerId === player.id) clearPlayerForm();
      refreshAll();
      return;
    }

    if (action === "edit-norm") {
      const player = findPlayerById(btn.dataset.playerId);
      const norm = player?.norms?.find((n) => n.id === btn.dataset.normId);
      if (player && norm) {
        setNormForm(player.id, norm);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (action === "delete-norm") {
      const player = findPlayerById(btn.dataset.playerId);
      if (!player) return;
      const norm = player.norms?.find((n) => n.id === btn.dataset.normId);
      if (!norm) return;
      if (!confirm("Delete this norm?")) return;
      player.norms = (player.norms || []).filter((n) => n.id !== norm.id);
      if (state.editingNorm.normId === norm.id) clearNormForm();
      refreshAll();
      return;
    }

    if (action === "edit-certificate") {
      const cert = state.db.certificates.find((c) => c.id === btn.dataset.id);
      if (cert) setCertificateForm(cert);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (action === "delete-certificate") {
      const cert = state.db.certificates.find((c) => c.id === btn.dataset.id);
      if (!cert) return;
      if (!confirm("Delete this certificate?")) return;
      state.db.certificates = state.db.certificates.filter((c) => c.id !== cert.id);
      if (state.editingCertificateId === cert.id) clearCertificateForm();
      refreshAll();
    }
  }

  function generateCodeFromTemplate() {
    const template = getSelectedTemplate();
    const player = getSelectedPlayerForGenerator();
    const normsJson = safeParseJson(els.genNormsJson.value, player?.norms || []);

    if (!template) {
      alert("No template selected.");
      return "";
    }

    const code = RKGenerator.buildGeneratedCode(
      template.content,
      player || {},
      {
        username: String(els.genUsername.value || "").trim(),
        title: String(els.genTitle.value || "").trim(),
        rating: els.genRating.value === "" ? "" : Number(els.genRating.value),
        normsJson
      }
    );

    els.codeOutput.value = code;
    return code;
  }

  function syncGeneratorFieldsFromSelection() {
    const player = getSelectedPlayerForGenerator();
    if (player) {
      fillGeneratorFromPlayer(player);
      return;
    }
    els.genUsername.value = "";
    els.genTitle.value = "";
    els.genRating.value = "";
    els.genNormsJson.value = "[]";
  }

  function safeParseJson(text, fallback) {
    try {
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function wireEvents() {
    els.playerForm.addEventListener("submit", handlePlayerSubmit);
    els.normForm.addEventListener("submit", handleNormSubmit);
    els.certificateForm.addEventListener("submit", handleCertificateSubmit);
    els.templateForm.addEventListener("submit", handleTemplateSubmit);

    els.clearPlayerFormBtn.addEventListener("click", () => clearPlayerForm());
    els.clearNormFormBtn.addEventListener("click", () => clearNormForm());
    els.clearCertificateFormBtn.addEventListener("click", () => clearCertificateForm());
    els.clearTemplateFormBtn.addEventListener("click", () => clearTemplateForm());

    els.playersList.addEventListener("click", handleListClicks);
    els.certificatesList.addEventListener("click", handleListClicks);

    els.templateSelect.addEventListener("change", () => {
      const template = findTemplateById(els.templateSelect.value);
      if (template) setTemplateForm(template);
    });

    els.generatorTemplateSelect.addEventListener("change", () => {
      const template = getSelectedTemplate();
      if (template && !els.templateId.value) {
        // no-op
      }
    });

    els.generatorPlayerSelect.addEventListener("change", () => {
      const player = getSelectedPlayerForGenerator();
      if (player) fillGeneratorFromPlayer(player);
    });

    els.fillFromPlayerBtn.addEventListener("click", () => {
      const player = getSelectedPlayerForGenerator();
      if (!player) {
        alert("Pick a player first.");
        return;
      }
      fillGeneratorFromPlayer(player);
    });

    els.generateCodeBtn.addEventListener("click", () => {
      generateCodeFromTemplate();
    });

    els.copyCodeBtn.addEventListener("click", async () => {
      const code = els.codeOutput.value || generateCodeFromTemplate();
      try {
        await RKGenerator.copyText(code);
        alert("Code copied.");
      } catch {
        alert("Could not copy the code.");
      }
    });

    els.downloadCodeBtn.addEventListener("click", () => {
      const code = els.codeOutput.value || generateCodeFromTemplate();
      RKStorage.downloadText("generated-code.txt", code, "text/plain");
    });

    els.downloadPlayersJsonBtn.addEventListener("click", () => {
      const json = RKGenerator.downloadPlayersJson(state.db);
      els.playersJsonPreview.value = json;
    });

    els.copyPlayersJsonBtn.addEventListener("click", async () => {
      const json = RKGenerator.buildPlayersJson(state.db);
      try {
        await RKGenerator.copyText(json);
        alert("players.json copied.");
      } catch {
        alert("Could not copy players.json.");
      }
    });

    els.exportDbBtn.addEventListener("click", () => {
      RKStorage.downloadText("rk-titles-backup.json", RKStorage.exportDB(), "application/json");
    });

    els.importDbInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      try {
        const imported = RKStorage.importDBFromJSON(text);
        state.db = imported;
        refreshAll();
        alert("Backup imported.");
      } catch {
        alert("That file could not be imported.");
      } finally {
        e.target.value = "";
      }
    });
  }

  function ensureDefaultTemplateVisible() {
    if (!state.db.templates.length) {
      state.db = RKStorage.defaultDB();
      save();
    }
    const template = state.db.templates[0];
    if (template && !els.templateId.value) {
      setTemplateForm(template);
    }
  }

  function init() {
    initElements();
    ensureDefaultTemplateVisible();
    wireEvents();
    refreshAll();
    clearNormForm();
    if (state.db.players[0]) {
      els.generatorPlayerSelect.value = state.db.players[0].id;
      fillGeneratorFromPlayer(state.db.players[0]);
    } else {
      els.genNormsJson.value = "[]";
    }
    const template = state.db.templates[0];
    if (template) {
      els.templateSelect.value = template.id;
      els.generatorTemplateSelect.value = template.id;
      setTemplateForm(template);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
