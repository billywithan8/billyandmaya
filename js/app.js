/* Billy & Maya
   The journey, the two pocket watches, kisses that really arrive, the
   sealed letter, the secret memes, and the music button.
   You shouldn't need to edit this file; settings live in js/config.js. */
(() => {
  "use strict";

  const C = window.SITE_CONFIG;
  const LA = "America/Los_Angeles";
  const DAY = 864e5;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const ONLINE = Boolean(C.supabaseUrl && C.supabaseKey);
  const NAMES = { billy: "Billy", maya: "Maya" };
  const other = (who) => (who === "billy" ? "maya" : "billy");

  /* ---------- storage that never crashes (private mode etc.) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} }
  };
  const K = { settings: "bm-settings-v2", code: "bm-code-v1", me: "bm-me", music: "bm-music", local: "bm-local-kisses" };
  const seenKey = (who) => "bm-seen-" + who;

  let me = store.get(K.me);
  if (me !== "billy" && me !== "maya") me = null;

  let settings = { ...C.defaults };
  try {
    const cached = JSON.parse(store.get(K.settings) || "null");
    if (cached && cached.her_tz) settings = { ...settings, ...cached };
  } catch {}

  /* ---------- time-zone math (no libraries) ---------- */
  const fmtCache = new Map();
  function fmt(tz, opts) {
    const key = (tz || "") + JSON.stringify(opts);
    if (!fmtCache.has(key)) fmtCache.set(key, new Intl.DateTimeFormat("en-US", tz ? { timeZone: tz, ...opts } : opts));
    return fmtCache.get(key);
  }
  function partsIn(tz, date) {
    const o = {};
    for (const p of fmt(tz, {
      hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "long"
    }).formatToParts(date)) o[p.type] = p.value;
    return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, wd: o.weekday };
  }
  function offsetMin(tz, date) {
    const p = partsIn(tz, date);
    const asUTC = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
    return Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  }
  function zonedToDate(y, mo, d, h, mi, tz) {
    const guess = Date.UTC(y, mo - 1, d, h, mi);
    let t = guess - offsetMin(tz, new Date(guess)) * 60000;
    t = guess - offsetMin(tz, new Date(t)) * 60000;
    return new Date(t);
  }
  function validTz(tz) {
    try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return Boolean(tz); } catch { return false; }
  }
  const pad = (n) => String(n).padStart(2, "0");
  const herTz = () => (validTz(settings.her_tz) ? settings.her_tz : "UTC");

  /* =========================================================
     THE JOURNEY
     ========================================================= */
  const scenes = $$(".scene");
  const tall = $(".scene-tall");

  // points along each winding phone path: [x %, bottom %], evenly spaced, start → tree
  const LEFT = [[21,9],[18.8,10.31],[17.15,11.68],[16.14,13.34],[16.44,15.25],[17.98,16.94],[19.75,18.16],[21.92,19.38],[23.94,20.38],[26.11,21.41],[28.38,22.46],[30.43,23.44],[32.73,24.58],[34.72,25.64],[36.61,26.76],[38.59,28.09],[40.34,29.52],[41.81,31.04],[43.05,32.85],[43.75,34.61],[44,36.5]];
  const RIGHT = [[79,10],[76.69,10.59],[74.67,11.37],[72.91,12.46],[71.69,13.81],[70.97,15.57],[70.77,17.24],[70.78,19.02],[70.86,20.75],[70.87,22.54],[70.69,24.37],[70.26,26.09],[69.56,27.66],[68.49,29.23],[67.15,30.64],[65.41,32.03],[63.74,33.1],[61.77,34.16],[59.82,35.05],[58,35.78],[56,36.5]];
  const at = (pts, t) => {
    const f = Math.min(0.9999, Math.max(0, t)) * (pts.length - 1);
    const i = Math.floor(f), r = f - i;
    const a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)];
    return [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r];
  };
  const shrink = (t) => 1 - 0.45 * t;   // further down the path = closer to the tree = smaller

  // hand-inked dashes along the phone paths
  const DN = 10;
  const dashes = [];
  (function buildDashes() {
    const box = $(".dashes", tall);
    const HW = 1981 / 1537;
    for (const pts of [LEFT, RIGHT]) {
      for (let i = 0; i < DN; i++) {
        const t = (i + 0.5) / DN;
        const a = at(pts, t), n = at(pts, Math.min(1, t + 0.02));
        const ang = Math.atan2(-(n[1] - a[1]) * HW, n[0] - a[0]) * 180 / Math.PI;
        const s = shrink(t);
        const el = document.createElement("span");
        el.className = "dash";
        el.style.cssText = `left:${a[0].toFixed(2)}%;bottom:${a[1].toFixed(2)}%;width:${(4.47 * s).toFixed(2)}cqw;height:${(2.07 * s).toFixed(2)}cqw;--rot:${ang.toFixed(1)}deg`;
        el.innerHTML = '<img class="off" src="assets/dash-ink.svg" alt=""><img class="on" src="assets/dash-rose.svg" alt="">';
        box.appendChild(el);
        dashes.push({ el, t });
      }
    }
  })();

  let lastP = -1;
  function renderJourney(now) {
    const start = new Date(C.journeyStart).getTime();
    const end = new Date(settings.arrival_at).getTime();
    const left = end - now.getTime();
    const home = !(left > 0);
    let p = end > start ? (now.getTime() - start) / (end - start) : 1;
    p = home ? 1 : Math.min(1, Math.max(0, p));

    const days = Math.max(0, Math.ceil(left / DAY));
    for (const el of $$("[data-days]")) el.textContent = days;
    for (const el of $$("[data-dayword]")) el.textContent = days === 1 ? "day" : "days";
    for (const s of scenes) s.classList.toggle("is-home", home);

    if (Math.abs(p - lastP) < 0.0002) return;
    lastP = p;
    for (const s of scenes) s.style.setProperty("--p", p.toFixed(4));

    const b = at(LEFT, p), m = at(RIGHT, p), k = shrink(p);
    const set = (n, v) => tall.style.setProperty(n, v);
    set("--bx", b[0].toFixed(2) + "%"); set("--by", b[1].toFixed(2) + "%"); set("--bs", k.toFixed(3));
    set("--mx", m[0].toFixed(2) + "%"); set("--my", m[1].toFixed(2) + "%"); set("--ms", k.toFixed(3));
    set("--maya-x", b[0].toFixed(2) + "%"); set("--maya-y", (b[1] + 16 * k).toFixed(2) + "%");
    set("--billy-x", m[0].toFixed(2) + "%"); set("--billy-y", (m[1] + 16 * k).toFixed(2) + "%");
    for (const d of dashes) d.el.classList.toggle("done", d.t <= p);
  }

  /* =========================================================
     THE POCKET WATCHES
     ========================================================= */
  function partOfDay(h) {
    if (h < 1) return "just past midnight";
    if (h < 5) return "middle of the night";
    if (h < 8) return "early morning";
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    if (h < 21) return "evening";
    return "late night";
  }
  function setWatch(col, tz, now, place, showDay) {
    const p = partsIn(tz, now);
    $(".hand-h", col).style.transform = `rotate(${((p.h % 12) * 30 + p.mi * 0.5).toFixed(1)}deg)`;
    $(".hand-m", col).style.transform = `rotate(${p.mi * 6}deg)`;
    $("[data-time]", col).textContent = `${((p.h + 11) % 12) + 1}:${pad(p.mi)}`;
    $("[data-ampm]", col).textContent = p.h < 12 ? "am" : "pm";
    const wd = showDay ? `<span class="wd">${p.wd} </span>` : "";
    $("[data-sub]", col).innerHTML = `${wd}${partOfDay(p.h)} · ${escapeHtml(place)}`;
    return p;
  }
  function gapText(now) {
    const diff = offsetMin(herTz(), now) - offsetMin(LA, now);
    if (diff === 0) return "Maya and Billy are on the same time";
    const hrs = Math.abs(diff) / 60;
    const whole = Math.floor(hrs), frac = hrs - whole;
    const n = (whole || "") + (frac === 0.5 ? "½" : frac === 0.75 ? "¾" : frac === 0.25 ? "¼" : "") || "0";
    return `Maya is <b>${n} ${hrs === 1 ? "hour" : "hours"}</b> ${diff > 0 ? "ahead of" : "behind"} Billy`;
  }
  function renderClocks(now) {
    const laP = partsIn(LA, now), herP = partsIn(herTz(), now);
    const differentDay = laP.d !== herP.d;
    setWatch($(".watch-billy"), LA, now, "LA", false);
    setWatch($(".watch-maya"), herTz(), now, settings.her_city || "on tour", differentDay);
    $("#gap").innerHTML = gapText(now);
  }

  function tick() {
    const now = new Date();
    renderJourney(now);
    renderClocks(now);
  }
  function scheduleTick() {
    tick();
    setTimeout(scheduleTick, 1000 - (Date.now() % 1000) + 5);
  }

  /* =========================================================
     DATABASE (Supabase REST, no library)
     ========================================================= */
  async function api(path, opts = {}) {
    const headers = { apikey: C.supabaseKey, "Content-Type": "application/json", ...(opts.headers || {}) };
    if (!C.supabaseKey.startsWith("sb_")) headers.Authorization = "Bearer " + C.supabaseKey;
    const res = await fetch(C.supabaseUrl.replace(/\/+$/, "") + "/rest/v1/" + path, { ...opts, headers });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) throw new Error((body && body.message) || `something went wrong (${res.status})`);
    return body;
  }
  function acceptSettings(row) {
    if (!row) return;
    settings = { ...settings, ...row };
    store.set(K.settings, JSON.stringify(settings));
    lastP = -1;
    tick();
  }
  async function loadSettings() {
    if (!ONLINE) return;
    try {
      const rows = await api("settings?id=eq.1&select=her_tz,her_city,arrival_at,updated_at");
      acceptSettings(rows && rows[0]);
    } catch (e) { console.warn("Couldn't load settings:", e.message); }
  }

  /* =========================================================
     SOUND + MUSIC
     ========================================================= */
  const sfx = new Audio("assets/kiss.mp3");
  sfx.preload = "auto";
  function playSfx() {
    try {
      const a = sfx.cloneNode();
      const r = a.play();
      if (r && r.catch) r.catch(() => {});
    } catch {}
  }

  const musicBtn = $("#music-btn");
  let song = null;
  let musicWanted = store.get(K.music) !== "off";
  function setMusicUi(on) {
    musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
    musicBtn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  }
  function startMusic() {
    if (!song) {
      song = new Audio(C.music);
      song.loop = true;
      song.volume = typeof C.musicVolume === "number" ? C.musicVolume : 0.45;
      song.addEventListener("pause", () => setMusicUi(false));
      song.addEventListener("play", () => setMusicUi(true));
    }
    const r = song.play();
    if (r && r.catch) r.catch(() => setMusicUi(false));
  }
  if (C.music) {
    musicBtn.hidden = false;
    setMusicUi(false);
    musicBtn.addEventListener("click", () => {
      if (song && !song.paused) { song.pause(); musicWanted = false; store.set(K.music, "off"); }
      else { musicWanted = true; store.set(K.music, "on"); startMusic(); }
    });
    // browsers only allow sound after a tap, so the song starts on the first one
    const firstTouch = (e) => {
      if (e.target && e.target.closest && e.target.closest("#music-btn")) return;
      window.removeEventListener("pointerdown", firstTouch, true);
      window.removeEventListener("keydown", firstTouch, true);
      if (musicWanted) startMusic();
    };
    window.addEventListener("pointerdown", firstTouch, true);
    window.addEventListener("keydown", firstTouch, true);
  }

  /* =========================================================
     KISSES
     ========================================================= */
  const kissWrap = $(".kiss-wrap");
  const kissBody = $(".kissbody");
  const sealBox = $("#seal-box");
  let kissTimer = 0;
  let myCount = 0;

  function renderCount() {
    $("#kiss-count").textContent = `${myCount} ${myCount === 1 ? "kiss" : "kisses"} sent`;
  }

  // one heart flying from `from` to the other person, in every scene
  function flyHeart(from, mine) {
    const to = other(from);
    for (const s of scenes) {
      const g = document.createElement("div");
      g.innerHTML =
        `<div class="travel" style="--x0:var(--${from}-x);--y0:var(--${from}-y);--x2:var(--${to}-x);--y2:var(--${to}-y)"><img class="hop" src="assets/heart.webp" alt=""></div>` +
        '<img class="rise r1" src="assets/heart.webp" alt=""><img class="rise r2" src="assets/heart.webp" alt=""><img class="rise r3" src="assets/heart.webp" alt="">';
      $(".flights", s).appendChild(g);
      setTimeout(() => g.remove(), 2700);
      s.classList.add("is-kissing");
    }
    if (mine) {
      const ring = document.createElement("span");
      ring.className = "ring";
      sealBox.prepend(ring);
      setTimeout(() => ring.remove(), 1100);
      kissBody.classList.remove("stamp");
      void kissBody.offsetWidth;   // restart the press animation
      kissBody.classList.add("stamp");
      kissWrap.classList.add("is-sent");
    }
    playSfx();
    clearTimeout(kissTimer);
    kissTimer = setTimeout(() => {
      for (const s of scenes) s.classList.remove("is-kissing");
      kissWrap.classList.remove("is-sent");
    }, 2600);
  }

  let pendingSend = false;
  function sendKiss() {
    if (!me) { pendingSend = true; openWho(); return; }
    flyHeart(me, true);
    checkStreak();
    myCount += 1;
    renderCount();
    if (ONLINE) {
      api("kisses", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ sender: me })
      }).catch((e) => console.warn("Kiss didn't save:", e.message));
    } else {
      store.set(K.local, String(myCount));
    }
  }
  $("#kiss-btn").addEventListener("click", sendKiss);

  async function loadCount() {
    if (!me) { myCount = 0; renderCount(); return; }
    if (!ONLINE) { myCount = Number(store.get(K.local)) || 0; renderCount(); return; }
    try {
      const counts = await api("rpc/kiss_counts", { method: "POST", body: "{}" });
      myCount = Math.max(myCount, Number(counts && counts[me]) || 0);
      renderCount();
    } catch (e) { console.warn("Couldn't load kiss count:", e.message); }
  }

  /* ---------- secret: 10 quick presses in a row shows a meme ---------- */
  let streak = 0, lastPress = 0, memeUp = false;
  function checkStreak() {
    const now = Date.now();
    streak = now - lastPress < 800 ? streak + 1 : 1;
    lastPress = now;
    if (streak < 10 || memeUp) return;
    streak = 0;
    memeUp = true;
    const pick = 1 + Math.floor(Math.random() * 3);
    for (const s of scenes) {
      const m = document.createElement("div");
      m.className = "meme";
      m.innerHTML = `<img class="m${pick}" src="assets/meme${pick}.webp" alt="">`;
      $(".meme-layer", s).appendChild(m);
      setTimeout(() => m.remove(), 5000);
    }
    setTimeout(() => { memeUp = false; }, 5000);
  }

  /* =========================================================
     THE SEALED LETTER — kisses that arrived while you were away
     ========================================================= */
  let cursor = null;          // newest kiss from them that we know about
  let letterRows = [];        // kisses waiting in the letter
  let cameBack = false;       // page was hidden and is visible again

  function clockStr(d) {
    return fmt(null, { hour: "numeric", minute: "2-digit" }).format(d).toLowerCase().replace(/\s/g, "");
  }
  function whenStr(d) {
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    return (sameDay ? "" : fmt(null, { weekday: "short" }).format(d) + " ") + clockStr(d);
  }
  function letterSub(rows) {
    const ds = rows.map((r) => new Date(r.created_at));
    let when;
    if (ds.length === 1) when = whenStr(ds[0]);
    else if (ds.length <= 3) when = ds.slice(0, -1).map(whenStr).join(", ") + " & " + whenStr(ds[ds.length - 1]);
    else when = `first at ${whenStr(ds[0])} · latest at ${whenStr(ds[ds.length - 1])}`;
    return `from ${NAMES[other(me)]} · ${when}`;
  }
  function renderLetter() {
    for (const s of scenes) {
      const layer = $(".letter-layer", s);
      if (!letterRows.length) { layer.innerHTML = ""; continue; }
      const n = letterRows.length;
      layer.innerHTML =
        '<div class="letter-bg"><div class="scrap letter">' +
        '<img class="lseal" src="assets/letter-seal.svg" alt="" aria-hidden="true">' +
        `<div class="ltitle">${n === 1 ? "a kiss arrived" : n + " kisses arrived"}<br>while you were away</div>` +
        `<div class="lsub">${escapeHtml(letterSub(letterRows))}</div>` +
        '<button type="button" class="break-seal">break the seal</button>' +
        "</div></div>";
    }
  }
  function breakSeal() {
    const n = letterRows.length;
    if (!n) return;
    cursor = letterRows[n - 1].created_at;
    store.set(seenKey(me), cursor);
    letterRows = [];
    renderLetter();
    const them = other(me);
    for (let i = 0; i < Math.min(n, 5); i++) setTimeout(() => flyHeart(them, false), i * 280);
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest(".break-seal")) breakSeal();
  });

  async function fetchTheirKisses(after) {
    const them = other(me);
    let q = `kisses?select=created_at&sender=eq.${them}&order=created_at.asc&limit=500`;
    if (after) q += `&created_at=gt.${encodeURIComponent(after)}`;
    return (await api(q)) || [];
  }

  // on load: anything they sent since you last looked becomes a letter
  async function loadLetter() {
    if (!ONLINE || !me) return;
    try {
      const seen = store.get(seenKey(me));
      const rows = await fetchTheirKisses(seen);
      cursor = rows.length ? rows[rows.length - 1].created_at : seen;
      if (!cursor) { cursor = new Date().toISOString(); }
      letterRows = rows;
      renderLetter();
    } catch (e) { console.warn("Couldn't check for kisses:", e.message); }
  }

  // while the page is open: their kisses fly in live
  async function pollKisses() {
    if (!ONLINE || !me || !cursor || document.hidden) return;
    try {
      const rows = await fetchTheirKisses(cursor);
      if (!rows.length) { cameBack = false; return; }
      cursor = rows[rows.length - 1].created_at;
      if (letterRows.length || cameBack) {
        letterRows = letterRows.concat(rows);
        renderLetter();
      } else {
        store.set(seenKey(me), cursor);
        const them = other(me);
        rows.slice(-5).forEach((_, i) => setTimeout(() => flyHeart(them, false), i * 280));
      }
      cameBack = false;
      loadCount();
    } catch (e) { console.warn("Couldn't check for kisses:", e.message); }
  }

  /* =========================================================
     WHO'S HERE (asked once per phone/computer)
     ========================================================= */
  const whoDlg = $("#who");
  function openWho() { if (!whoDlg.open) whoDlg.showModal(); }
  whoDlg.addEventListener("cancel", (e) => { if (!me) e.preventDefault(); });
  for (const b of $$(".pick-btn", whoDlg)) {
    b.addEventListener("click", () => {
      const changed = me !== b.dataset.me;
      me = b.dataset.me;
      store.set(K.me, me);
      whoDlg.close();
      if (changed) { letterRows = []; cursor = null; myCount = 0; renderLetter(); loadCount(); loadLetter(); }
      if (pendingSend) { pendingSend = false; sendKiss(); }
    });
  }
  $("#who-btn").addEventListener("click", openWho);

  /* =========================================================
     EDIT (locked behind the code word)
     ========================================================= */
  const dlg = $("#edit");
  const steps = { unlock: $("#unlock-form"), settings: $("#settings-form"), offline: $("#offline-note") };
  let code = store.get(K.code) || "";

  function show(step) { for (const [k, el] of Object.entries(steps)) el.hidden = k !== step; }
  function fillForm() {
    $("#f-tz").value = settings.her_tz || "";
    $("#f-place").value = settings.her_city || "";
    const p = partsIn(LA, new Date(settings.arrival_at));
    $("#f-date").value = `${p.y}-${pad(p.mo)}-${pad(p.d)}`;
    $("#f-time").value = `${pad(p.h)}:${pad(p.mi)}`;
    $("#save-status").textContent = "";
  }
  function fillTzList() {
    const list = $("#tz-list");
    if (list.childElementCount) return;
    let zones = [];
    try { zones = Intl.supportedValuesOf("timeZone"); } catch { zones = []; }
    const frag = document.createDocumentFragment();
    for (const z of zones) { const o = document.createElement("option"); o.value = z; frag.appendChild(o); }
    list.appendChild(frag);
  }
  async function openEditor() {
    if (!ONLINE) { show("offline"); dlg.showModal(); return; }
    fillTzList();
    $("#unlock-status").textContent = "";
    show("unlock");
    dlg.showModal();
    if (code) {
      $("#unlock-status").textContent = "checking…";
      try {
        if (await api("rpc/check_code", { method: "POST", body: JSON.stringify({ p_code: code }) })) {
          fillForm(); show("settings"); return;
        }
      } catch {}
      code = ""; store.del(K.code);
      $("#unlock-status").textContent = "";
    }
    $("#code-input").value = "";
    $("#code-input").focus();
  }
  $("#edit-btn").addEventListener("click", openEditor);
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
  });

  steps.unlock.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tryCode = $("#code-input").value.trim();
    const status = $("#unlock-status");
    status.textContent = "checking…";
    try {
      const ok = await api("rpc/check_code", { method: "POST", body: JSON.stringify({ p_code: tryCode }) });
      if (!ok) { status.textContent = "nope, that's not it"; return; }
      code = tryCode;
      if ($("#remember").checked) store.set(K.code, code);
      fillForm(); show("settings");
    } catch (err) { status.textContent = err.message; }
  });
  $("#use-my-tz").addEventListener("click", () => {
    try { $("#f-tz").value = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
  });
  $("#forget-code").addEventListener("click", () => {
    code = ""; store.del(K.code);
    show("unlock"); $("#code-input").value = "";
    $("#unlock-status").textContent = "forgotten on this device";
  });
  steps.settings.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = $("#save-status");
    const tz = $("#f-tz").value.trim();
    if (!validTz(tz)) { status.textContent = "pick a time zone from the list (like Europe/Paris)"; return; }
    const [y, mo, d] = $("#f-date").value.split("-").map(Number);
    const [h, mi] = $("#f-time").value.split(":").map(Number);
    if (!y || Number.isNaN(h)) { status.textContent = "check the landing date and time"; return; }
    const arrival = zonedToDate(y, mo, d, h, mi, LA).toISOString();
    status.textContent = "saving…";
    try {
      const row = await api("rpc/update_settings", {
        method: "POST",
        body: JSON.stringify({
          p_code: code,
          p_city: $("#f-place").value.trim(),
          p_note: settings.her_note || "",
          p_tz: tz,
          p_arrival: arrival
        })
      });
      acceptSettings(Array.isArray(row) ? row[0] : row);
      status.textContent = "saved ✓";
      setTimeout(() => dlg.open && dlg.close(), 700);
    } catch (err) { status.textContent = err.message; }
  });

  /* ---------- helpers ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- go ---------- */
  scheduleTick();
  renderCount();
  loadSettings();
  if (!me) openWho();
  else { loadCount(); loadLetter(); }
  setInterval(loadSettings, 60000);
  setInterval(pollKisses, 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    cameBack = true;
    loadSettings();
    pollKisses();
  });
})();
