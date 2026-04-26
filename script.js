<script>
    const STORAGE_KEY = "rk_admin_db_v1";

    const defaultDB = {
      players: [],
      certificates: [],
      templates: [
        {
          id: uid(),
          name: "Player code placeholder",
          content: `{
  "username": "{{username}}",
  "title": "{{title}}",
  "rating": {{rating}},
  "norms": {{norms_json}}
}`
        }
      ]
    };

    let db = loadDB();
    let activeTab = "players";

    function uid() {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
      return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    }

    function clone(value) {
      return JSON.parse(JSON.stringify(value));
    }

    function loadDB() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return clone(defaultDB);
        const parsed = JSON.parse(raw);
        return {
          players: Array.isArray(parsed.players) ? parsed.players : [],
          certificates: Array.isArray(parsed.certificates) ? parsed.certificates : [],
          templates: Array.isArray(parsed.templates) && parsed.templates.length ? parsed.templates : clone(defaultDB.templates),
        };
      } catch (e) {
        console.error(e);
        return clone(defaultDB);
      }
    }

    function saveDB() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      updateCounts();
    }

    function setStatus(msg) {
      const el = document.getElementById("status");
      el.textContent = msg;
      if (msg) {
        clearTimeout(setStatus._t);
        setStatus._t = setTimeout(() => {
          if (el.textContent === msg) el.textContent = "";
        }, 2200);
      }
    }

    function sanitizeText(value) {
      return String(value ?? "").trim();
    }

    function formatDate(value) {
      return value || new Date().toISOString().slice(0,10);
    }

    function escapeHtml(str) {
      return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function getPlayerLabel(p) {
      return [p.username, p.title ? `(${p.title})` : ""].filter(Boolean).join(" ");
    }

    function updateCounts() {
      document.getElementById("countPlayers").textContent = db.players.length;
      document.getElementById("countCertificates").textContent = db.certificates.length;
      document.getElementById("countTemplates").textContent = db.templates.length;
    }

    function sortPlayers(list) {
      return [...list].sort((a,b) => a.username.localeCompare(b.username));
    }

    function sortByDateDesc(list) {
      return [...list].sort((a,b) => String(b.date || "").localeCompare(String(a.date || "")));
    }

    function renderAll() {
      renderPlayers();
      renderCertificateOptions();
      renderCertificates();
      renderGeneratorSelects();
      renderTemplates();
      updateCounts();
      renderJsonPreview();
    }

    function renderPlayers() {
      const wrap = document.getElementById("playersList");
      const term = sanitizeText(document.getElementById("playerSearch").value).toLowerCase();

      const players = sortPlayers(
        db.players.filter(p =>
          !term ||
          p.username.toLowerCase().includes(term) ||
          String(p.title || "").toLowerCase().includes(term) ||
          String(p.rating || "").toLowerCase().includes(term) ||
          (Array.isArray(p.norms) && p.norms.some(n => String(n.link || "").toLowerCase().includes(term)))
        )
      );

      if (!players.length) {
        wrap.innerHTML = `<div class="empty">No players yet.</div>`;
        return;
      }

      wrap.innerHTML = players.map((p, index) => {
        const norms = sortByDateDesc(Array.isArray(p.norms) ? p.norms : []);
        return `
          <div class="player-card" data-player-id="${escapeHtml(p.id)}">
            <div class="player-head">
              <div style="flex:1; min-width:220px;">
                <div class="player-title">
                  <strong>${escapeHtml(p.username || "Unnamed player")}</strong>
                  ${p.title ? `<span class="pill">${escapeHtml(p.title)}</span>` : ""}
                </div>
                <div class="mini">Player ${index + 1} • ${norms.length} norm${norms.length === 1 ? "" : "s"}</div>
              </div>
              <div class="inline-actions">
                <button class="danger" data-action="delete-player" data-id="${escapeHtml(p.id)}">Delete player</button>
              </div>
            </div>

            <div class="row three">
              <div>
                <label>Username</label>
                <input data-action="edit-player" data-field="username" data-id="${escapeHtml(p.id)}" value="${escapeHtml(p.username || "")}">
              </div>
              <div>
                <label>Title</label>
                <input data-action="edit-player" data-field="title" data-id="${escapeHtml(p.id)}" value="${escapeHtml(p.title || "")}">
              </div>
              <div>
                <label>Rating</label>
                <input data-action="edit-player" data-field="rating" data-id="${escapeHtml(p.id)}" type="number" value="${escapeHtml(p.rating ?? "")}">
              </div>
            </div>

            <div class="hr"></div>

            <h3>Add norm</h3>
            <div class="row three">
              <div>
                <label>TMT / result link</label>
                <input data-new-norm-link="${escapeHtml(p.id)}" placeholder="Paste result link">
              </div>
              <div>
                <label>Date</label>
                <input data-new-norm-date="${escapeHtml(p.id)}" type="date" value="${new Date().toISOString().slice(0,10)}">
              </div>
              <div>
                <label>Title at time</label>
                <input data-new-norm-title="${escapeHtml(p.id)}" placeholder="Example: RKB">
              </div>
            </div>
            <div style="margin-top:10px;">
              <button class="primary" data-action="add-norm" data-id="${escapeHtml(p.id)}">Add norm</button>
            </div>

            <div class="norms">
              ${norms.length ? norms.map(n => `
                <div class="norm-item">
                  <div class="norm-top">
                    <div class="mini"><strong>Norm</strong> • ${escapeHtml(n.date || "-")}</div>
                    <div class="norm-actions">
                      <button class="danger" data-action="delete-norm" data-player-id="${escapeHtml(p.id)}" data-norm-id="${escapeHtml(n.id)}">Remove</button>
                    </div>
                  </div>
                  <div class="row three">
                    <div>
                      <label>Link</label>
                      <input data-action="edit-norm" data-player-id="${escapeHtml(p.id)}" data-norm-id="${escapeHtml(n.id)}" data-field="link" value="${escapeHtml(n.link || "")}">
                    </div>
                    <div>
                      <label>Date</label>
                      <input data-action="edit-norm" data-player-id="${escapeHtml(p.id)}" data-norm-id="${escapeHtml(n.id)}" data-field="date" type="date" value="${escapeHtml(n.date || "")}">
                    </div>
                    <div>
                      <label>Title at time</label>
                      <input data-action="edit-norm" data-player-id="${escapeHtml(p.id)}" data-norm-id="${escapeHtml(n.id)}" data-field="titleAtTime" value="${escapeHtml(n.titleAtTime || "")}">
                    </div>
                  </div>
                  <div class="mini">Open: ${n.link ? `<a href="${escapeHtml(n.link)}" target="_blank" rel="noopener">Result link</a>` : "No link yet"}</div>
                </div>
              `).join("") : `<div class="empty">No norms stored yet.</div>`}
            </div>
          </div>
        `;
      }).join("");
    }

    function renderCertificateOptions() {
      const sel = document.getElementById("certPlayer");
      const players = sortPlayers(db.players);
      sel.innerHTML = players.length
        ? players.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(getPlayerLabel(p))}</option>`).join("")
        : `<option value="">No players available</option>`;
    }

    function renderCertificates() {
      const wrap = document.getElementById("certList");
      const term = sanitizeText(document.getElementById("certSearch").value).toLowerCase();

      const certs = sortByDateDesc(
        db.certificates.filter(c =>
          !term ||
          String(c.username || "").toLowerCase().includes(term) ||
          String(c.title || "").toLowerCase().includes(term) ||
          String(c.imageUrl || "").toLowerCase().includes(term) ||
          String(c.date || "").toLowerCase().includes(term)
        )
      );

      if (!certs.length) {
        wrap.innerHTML = `<div class="empty">No certificates yet.</div>`;
        return;
      }

      wrap.innerHTML = certs.map(c => {
        const player = db.players.find(p => p.id === c.playerId);
        return `
          <div class="cert-card" data-cert-id="${escapeHtml(c.id)}">
            <div class="cert-head">
              <div>
                <strong>${escapeHtml(c.username || player?.username || "Unknown user")}</strong>
                <div class="mini">${escapeHtml(c.title || "-")} • ${escapeHtml(c.date || "-")}</div>
              </div>
              <button class="danger" data-action="delete-certificate" data-id="${escapeHtml(c.id)}">Delete</button>
            </div>
            <div class="row">
              <div>
                <label>User</label>
                <input data-action="edit-certificate" data-field="username" data-id="${escapeHtml(c.id)}" value="${escapeHtml(c.username || "")}">
              </div>
              <div>
                <label>Title</label>
                <input data-action="edit-certificate" data-field="title" data-id="${escapeHtml(c.id)}" value="${escapeHtml(c.title || "")}">
              </div>
              <div>
                <label>Date</label>
                <input data-action="edit-certificate" data-field="date" data-id="${escapeHtml(c.id)}" type="date" value="${escapeHtml(c.date || "")}">
              </div>
              <div>
                <label>Image URL</label>
                <input data-action="edit-certificate" data-field="imageUrl" data-id="${escapeHtml(c.id)}" value="${escapeHtml(c.imageUrl || "")}">
              </div>
            </div>
            ${c.imageUrl ? `<img class="cert-image" src="${escapeHtml(c.imageUrl)}" alt="Certificate image" loading="lazy">` : `<div class="empty" style="margin-top:10px;">No image URL set.</div>`}
            <div class="mini" style="margin-top:10px;">
              ${c.imageUrl ? `<a href="${escapeHtml(c.imageUrl)}" target="_blank" rel="noopener">Open image</a>` : ""}
            </div>
          </div>
        `;
      }).join("");
    }

    function renderGeneratorSelects() {
      const players = sortPlayers(db.players);
      const jsonPick = document.getElementById("jsonPlayerPick");
      const current = jsonPick.value;
      jsonPick.innerHTML = players.length
        ? players.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(getPlayerLabel(p))}</option>`).join("")
        : `<option value="">No players available</option>`;
      if (players.some(p => p.id === current)) jsonPick.value = current;
      else if (players[0]) jsonPick.value = players[0].id;
    }

    function renderTemplates() {
      const wrap = document.getElementById("templateList");
      if (!db.templates.length) {
        wrap.innerHTML = `<div class="empty">No formulas saved yet.</div>`;
        return;
      }

      wrap.innerHTML = sortByDateDesc(db.templates.map(t => ({...t, date: t.date || ""}))).map(t => `
        <div class="template-card">
          <div class="template-head">
            <div>
              <strong>${escapeHtml(t.name || "Untitled formula")}</strong>
              <div class="mini">Stored formula placeholder</div>
            </div>
            <div class="inline-actions">
              <button data-action="load-template" data-id="${escapeHtml(t.id)}">Load</button>
              <button class="danger" data-action="delete-template" data-id="${escapeHtml(t.id)}">Delete</button>
            </div>
          </div>
          <textarea data-action="edit-template" data-id="${escapeHtml(t.id)}" spellcheck="false">${escapeHtml(t.content || "")}</textarea>
        </div>
      `).join("");
    }

    function renderJsonPreview() {
      const selectedId = document.getElementById("jsonPlayerPick").value;
      const preview = document.getElementById("jsonOutput");
      const allPlayers = sortPlayers(db.players).map(player => ({
        username: player.username || "",
        title: player.title || "",
        rating: player.rating === "" || player.rating === null || player.rating === undefined ? null : Number(player.rating),
        norms: sortByDateDesc(Array.isArray(player.norms) ? player.norms : []).map(norm => ({
          link: norm.link || "",
          date: norm.date || "",
          titleAtTime: norm.titleAtTime || ""
        }))
      }));

      const json = JSON.stringify(allPlayers, null, 2);
      preview.value = json;

      const holder = document.querySelector('[data-preview-holder]');
      const selectedPlayer = db.players.find(p => p.id === selectedId) || db.players[0];
      if (holder) {
        if (selectedPlayer && db.templates.length) {
          const template = db.templates[0].content || "";
          const output = applyTemplate(template, selectedPlayer);
          holder.innerHTML = `
            <div class="hr"></div>
            <label>Template preview for selected player</label>
            <textarea id="templatePreview" class="code-output" readonly spellcheck="false">${escapeHtml(output)}</textarea>
          `;
        } else {
          holder.innerHTML = "";
        }
      }
    }

    function applyTemplate(template, player) {
      const norms = sortByDateDesc(Array.isArray(player.norms) ? player.norms : []);
      return String(template || "")
        .replaceAll("{{username}}", player.username || "")
        .replaceAll("{{title}}", player.title || "")
        .replaceAll("{{rating}}", player.rating ?? "")
        .replaceAll("{{norms_json}}", JSON.stringify(norms, null, 2))
        .replaceAll("{{norms_count}}", String(norms.length));
    }

    function addPlayer() {
      const username = sanitizeText(document.getElementById("newUsername").value);
      const title = sanitizeText(document.getElementById("newTitle").value);
      const ratingRaw = sanitizeText(document.getElementById("newRating").value);

      if (!username) return setStatus("Enter a username first.");

      const exists = db.players.some(p => p.username.toLowerCase() === username.toLowerCase());
      if (exists) return setStatus("That username already exists.");

      db.players.unshift({
        id: uid(),
        username,
        title,
        rating: ratingRaw === "" ? "" : Number(ratingRaw),
        norms: []
      });

      document.getElementById("newUsername").value = "";
      document.getElementById("newTitle").value = "";
      document.getElementById("newRating").value = "";
      saveDB();
      renderAll();
      setStatus("Player added.");
    }

    function deletePlayer(id) {
      const player = db.players.find(p => p.id === id);
      if (!player) return;
      if (!confirm(`Delete ${player.username} and all of their norms/certificates?`)) return;

      db.players = db.players.filter(p => p.id !== id);
      db.certificates = db.certificates.filter(c => c.playerId !== id);
      saveDB();
      renderAll();
      setStatus("Player deleted.");
    }

    function editPlayer(id, field, value) {
      const player = db.players.find(p => p.id === id);
      if (!player) return;

      if (field === "rating") {
        player[field] = value === "" ? "" : Number(value);
      } else {
        player[field] = value;
      }

      saveDB();
      renderPlayers();
      renderCertificateOptions();
      renderGeneratorSelects();
      renderJsonPreview();
      updateCounts();
    }

    function addNorm(playerId) {
      const linkEl = document.querySelector(`[data-new-norm-link="${CSS.escape(playerId)}"]`);
      const dateEl = document.querySelector(`[data-new-norm-date="${CSS.escape(playerId)}"]`);
      const titleEl = document.querySelector(`[data-new-norm-title="${CSS.escape(playerId)}"]`);

      const link = sanitizeText(linkEl?.value);
      const date = sanitizeText(dateEl?.value) || new Date().toISOString().slice(0,10);
      const titleAtTime = sanitizeText(titleEl?.value);

      if (!link) return setStatus("Add a norm link first.");

      const player = db.players.find(p => p.id === playerId);
      if (!player) return;

      if (!Array.isArray(player.norms)) player.norms = [];
      player.norms.push({
        id: uid(),
        link,
        date,
        titleAtTime
      });

      if (linkEl) linkEl.value = "";
      if (titleEl) titleEl.value = "";

      saveDB();
      renderAll();
      setStatus("Norm added.");
    }

    function editNorm(playerId, normId, field, value) {
      const player = db.players.find(p => p.id === playerId);
      if (!player || !Array.isArray(player.norms)) return;
      const norm = player.norms.find(n => n.id === normId);
      if (!norm) return;
      norm[field] = value;
      saveDB();
      renderPlayers();
      renderJsonPreview();
    }

    function deleteNorm(playerId, normId) {
      const player = db.players.find(p => p.id === playerId);
      if (!player) return;
      if (!confirm("Remove this norm?")) return;
      player.norms = (player.norms || []).filter(n => n.id !== normId);
      saveDB();
      renderAll();
      setStatus("Norm removed.");
    }

    function addCertificate() {
      const playerId = document.getElementById("certPlayer").value;
      const player = db.players.find(p => p.id === playerId);
      const username = sanitizeText(player?.username || "");
      const title = sanitizeText(document.getElementById("certTitle").value);
      const date = sanitizeText(document.getElementById("certDate").value) || new Date().toISOString().slice(0,10);
      const imageUrl = sanitizeText(document.getElementById("certImage").value);

      if (!username) return setStatus("Create a player first.");
      if (!title) return setStatus("Add a certificate title.");
      if (!imageUrl) return setStatus("Add an image URL.");

      db.certificates.unshift({
        id: uid(),
        playerId,
        username,
        title,
        date,
        imageUrl
      });

      document.getElementById("certTitle").value = "";
      document.getElementById("certImage").value = "";
      saveDB();
      renderAll();
      setStatus("Certificate added.");
    }

    function editCertificate(id, field, value) {
      const cert = db.certificates.find(c => c.id === id);
      if (!cert) return;
      cert[field] = value;
      saveDB();
      renderCertificates();
      renderCertificateOptions();
      renderJsonPreview();
      updateCounts();
    }

    function deleteCertificate(id) {
      if (!confirm("Delete this certificate?")) return;
      db.certificates = db.certificates.filter(c => c.id !== id);
      saveDB();
      renderAll();
      setStatus("Certificate deleted.");
    }

    function addTemplate() {
      const name = sanitizeText(document.getElementById("templateName").value);
      const content = document.getElementById("templateText").value || "";
      if (!name || !content.trim()) return setStatus("Add a formula name and some text.");
      db.templates.unshift({ id: uid(), name, content });
      document.getElementById("templateName").value = "";
      document.getElementById("templateText").value = "";
      saveDB();
      renderAll();
      setStatus("Formula saved.");
    }

    function deleteTemplate(id) {
      if (!confirm("Delete this formula?")) return;
      db.templates = db.templates.filter(t => t.id !== id);
      saveDB();
      renderAll();
      setStatus("Formula deleted.");
    }

    function loadTemplate(id) {
      const t = db.templates.find(x => x.id === id);
      if (!t) return;
      document.getElementById("templateName").value = t.name || "";
      document.getElementById("templateText").value = t.content || "";
      setStatus("Formula loaded into inputs.");
      document.querySelector('[data-tab="templates"]').click();
      document.getElementById("templateText").focus();
    }

    function clearFormulaInputs() {
      document.getElementById("templateName").value = "";
      document.getElementById("templateText").value = "";
      setStatus("Formula inputs cleared.");
    }

    function getPlayersJSON() {
      const players = sortPlayers(db.players).map(player => ({
        username: player.username || "",
        title: player.title || "",
        rating: player.rating === "" || player.rating === null || player.rating === undefined ? null : Number(player.rating),
        norms: sortByDateDesc(Array.isArray(player.norms) ? player.norms : []).map(norm => ({
          link: norm.link || "",
          date: norm.date || "",
          titleAtTime: norm.titleAtTime || ""
        }))
      }));
      return JSON.stringify(players, null, 2);
    }

    function downloadText(filename, text) {
      const blob = new Blob([text], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    async function copyText(text) {
      await navigator.clipboard.writeText(text);
    }

    async function exportBackup() {
      const backup = JSON.stringify(db, null, 2);
      downloadText(`rk-admin-backup-${new Date().toISOString().slice(0,10)}.json`, backup);
      setStatus("Backup downloaded.");
    }

    async function importBackupFromFile(file) {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        setStatus("That file is not valid JSON.");
        return;
      }

      if (!parsed || typeof parsed !== "object") {
        setStatus("Invalid backup file.");
        return;
      }

      db = {
        players: Array.isArray(parsed.players) ? parsed.players : [],
        certificates: Array.isArray(parsed.certificates) ? parsed.certificates : [],
        templates: Array.isArray(parsed.templates) && parsed.templates.length ? parsed.templates : clone(defaultDB.templates)
      };

      saveDB();
      renderAll();
      setStatus("Backup imported.");
    }

    function bindEvents() {
      document.querySelectorAll(".tab").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
          document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
          btn.classList.add("active");
          activeTab = btn.dataset.tab;
          document.getElementById(activeTab).classList.add("active");
          renderJsonPreview();
        });
      });

      document.getElementById("btnAddPlayer").addEventListener("click", addPlayer);
      document.getElementById("playerSearch").addEventListener("input", renderPlayers);
      document.getElementById("btnAddCertificate").addEventListener("click", addCertificate);
      document.getElementById("certSearch").addEventListener("input", renderCertificates);
      document.getElementById("btnAddTemplate").addEventListener("click", addTemplate);
      document.getElementById("btnClearFormulaInputs").addEventListener("click", clearFormulaInputs);
      document.getElementById("btnRefreshJson").addEventListener("click", renderJsonPreview);
      document.getElementById("btnDownloadPlayers").addEventListener("click", () => {
        const json = getPlayersJSON();
        downloadText("players.json", json);
        setStatus("players.json downloaded.");
      });
      document.getElementById("btnCopyPlayers").addEventListener("click", async () => {
        await copyText(getPlayersJSON());
        setStatus("players.json copied.");
      });
      document.getElementById("btnCopyJsonPreview").addEventListener("click", async () => {
        await copyText(document.getElementById("jsonOutput").value);
        setStatus("Preview copied.");
      });
      document.getElementById("btnExportBackup").addEventListener("click", exportBackup);
      document.getElementById("btnImportBackup").addEventListener("click", () => document.getElementById("importFile").click());
      document.getElementById("importFile").addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (file) await importBackupFromFile(file);
        e.target.value = "";
      });
      document.getElementById("btnPasteClipboardCert").addEventListener("click", async () => {
        try {
          document.getElementById("certImage").value = await navigator.clipboard.readText();
          setStatus("Image URL pasted.");
        } catch {
          setStatus("Clipboard paste unavailable.");
        }
      });
      document.getElementById("jsonPlayerPick").addEventListener("change", renderJsonPreview);

      document.addEventListener("change", (e) => {
        const el = e.target;
        if (!(el instanceof HTMLElement)) return;

        const playerField = el.dataset.action === "edit-player" ? el : null;
        const normField = el.dataset.action === "edit-norm" ? el : null;
        const certField = el.dataset.action === "edit-certificate" ? el : null;
        const templateField = el.dataset.action === "edit-template" ? el : null;

        if (playerField) {
          editPlayer(playerField.dataset.id, playerField.dataset.field, playerField.value);
        } else if (normField) {
          editNorm(normField.dataset.playerId, normField.dataset.normId, normField.dataset.field, normField.value);
        } else if (certField) {
          editCertificate(certField.dataset.id, certField.dataset.field, certField.value);
        } else if (templateField) {
          const t = db.templates.find(x => x.id === templateField.dataset.id);
          if (t) {
            t.content = templateField.value;
            saveDB();
          }
        }
      });

      document.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const action = btn.dataset.action;
        if (!action) return;

        if (action === "delete-player") deletePlayer(btn.dataset.id);
        if (action === "add-norm") addNorm(btn.dataset.id);
        if (action === "delete-norm") deleteNorm(btn.dataset.playerId, btn.dataset.normId);
        if (action === "delete-certificate") deleteCertificate(btn.dataset.id);
        if (action === "delete-template") deleteTemplate(btn.dataset.id);
        if (action === "load-template") loadTemplate(btn.dataset.id);
      });
    }

    function seedExampleIfNeeded() {
      if (db.players.length || db.certificates.length || db.templates.length > 1) return;
      // keep default empty state, just ensure template exists
      saveDB();
    }

    bindEvents();
    seedExampleIfNeeded();
    renderAll();
  </script>
