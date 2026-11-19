/* Camera finder, v1: "point at a building, see who's inside and who's hiring".

   How it works (all on the phone, nothing is uploaded):
   - GPS gives where you stand; the compass gives which way the back camera faces.
   - A 50° cone (±25°) is cast up to 300 m against our building footprints. Buildings are scored by how close the
     heading is to their outline and how near they are, and the top 3 are offered. The user confirms with one tap,
     because GPS drifts 15–40 m and the compass 25°+ between glass towers.
   - Rough GPS (indoors) or no compass: show the nearest buildings to pick from instead of guessing.
   - The video is only shown on screen; a frame is captured only if the user taps "Share photo".
   Testing on a laptop: add ?sim=<lat>,<lon>,<heading> to the URL (for example ?sim=17.4436,78.3772,90).
*/
(() => {
  "use strict";
  const CONE = 25, RANGE = 300, INDOOR_ACC = 80;
  const R = Math.PI / 180;
  const dist = (a, b) => {
    const la1 = a[0] * R, la2 = b[0] * R, dla = la2 - la1, dlo = (b[1] - a[1]) * R;
    const h = Math.sin(dla / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dlo / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(h));
  };
  const bearing = (a, b) => {
    const la1 = a[0] * R, la2 = b[0] * R, dlo = (b[1] - a[1]) * R;
    const y = Math.sin(dlo) * Math.cos(la2), x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dlo);
    return (Math.atan2(y, x) / R + 360) % 360;
  };
  const sdiff = (a, h) => ((a - h + 540) % 360) - 180; // signed difference, -180..180

  function candidates(pos, heading, buildings) {
    const out = [];
    for (const b of buildings) {
      const pts = (b.fp ? b.fp.slice(0, -1).map(([lo, la]) => [la, lo]) : []).concat([[b.lat, b.lon]]);
      let d = Infinity; const diffs = [];
      for (const p of pts) { d = Math.min(d, dist(pos, p)); diffs.push(sdiff(bearing(pos, p), heading)); }
      if (d > RANGE) continue;
      let diff = Math.min(...diffs.map(Math.abs));
      // Heading passes between the outline's corners: we are looking straight at it.
      if (diffs.some(x => x >= 0) && diffs.some(x => x <= 0) && Math.max(...diffs.map(Math.abs)) < 90) diff = 0;
      if (d < 20) diff = 0; // standing at (or in) it
      if (diff > CONE) continue;
      out.push({ b, d, score: (diff / CONE) * 0.55 + (d / RANGE) * 0.45 });
    }
    return out.sort((x, y) => x.score - y.score).slice(0, 3);
  }
  const nearest = (pos, buildings, n = 5) => buildings.map(b => ({ b, d: dist(pos, [b.lat, b.lon]) })).sort((x, y) => x.d - y.d).slice(0, n);

  function open(ctx) {
    const { t, esc, icon } = ctx;
    const sim = (new URLSearchParams(location.search).get("sim") || "").split(",").map(Number);
    const simOn = sim.length === 3 && sim.every(Number.isFinite);
    const root = document.createElement("div");
    root.className = "camx"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", t("camIntro"));
    document.body.appendChild(root);
    let stream = null, watch = null, timer = null, pos = null, acc = null, heading = null, lastHeadingAt = 0, startedAt = 0, sx = 0, sy = 0, shownKey = "";

    const close = () => {
      clearInterval(timer);
      if (watch != null) navigator.geolocation.clearWatch(watch);
      stream?.getTracks().forEach(tr => tr.stop());
      window.removeEventListener("deviceorientationabsolute", onOrient);
      window.removeEventListener("deviceorientation", onOrient);
      root.remove();
    };

    // Intro: our own explanation before the browser asks for camera, location and compass.
    root.innerHTML = `<div class="intro">
      <div class="art"><svg viewBox="0 0 120 120" aria-hidden="true"><rect x="22" y="30" width="30" height="70" rx="3" fill="#2A3845"/><rect x="58" y="14" width="40" height="86" rx="3" fill="#F45B35"/>
        <g fill="#FFD9CC">${[22, 34, 46, 58, 70, 82].map(y => `<rect x="64" y="${y}" width="8" height="6" rx="1"/><rect x="78" y="${y}" width="8" height="6" rx="1"/>`).join("")}</g>
        <circle cx="96" cy="16" r="8" fill="#13A37F" stroke="#0E151C" stroke-width="3"/></svg></div>
      <h2>${esc(t("camIntro"))}</h2><p>${esc(t("camBody"))}</p>
      <button class="btn primary" data-start>${icon("camera")}${esc(t("camStart"))}</button>
      <button class="btn" data-close>${esc(t("camNot"))}</button></div>`;
    root.querySelector("[data-close]").onclick = close;
    root.querySelector("[data-start]").onclick = start;

    async function start() {
      // iOS needs the motion permission request inside the tap, before anything is awaited.
      const motionAsk = typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function"
        ? DeviceOrientationEvent.requestPermission().catch(() => "denied") : Promise.resolve("granted");
      root.innerHTML = `${simOn ? `<div class="sim"></div>` : `<video playsinline muted autoplay></video>`}
        <div class="ctop"><button class="cbtn" data-close aria-label="${esc(t("close"))}">${icon("x")}</button><span class="t">${esc(t("camTitle"))}</span></div>
        <div class="hud" id="camHud">${esc(simOn ? t("camSim") : t("camLocating"))}</div>
        <div class="ret"></div><div class="tag3d" id="camTag"></div>
        <div class="cbot"><div class="ccard" id="camCard"><div class="k">${esc(t("camLocating"))}</div><div class="s">${esc(t("camHint"))}</div></div></div>`;
      root.querySelector("[data-close]").onclick = close;
      startedAt = performance.now();
      if (simOn) { pos = [sim[0], sim[1]]; acc = 8; heading = sim[2]; lastHeadingAt = Infinity; }
      else {
        if (!navigator.mediaDevices?.getUserMedia) return fail(t("camUnsupported"));
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
          const v = root.querySelector("video"); v.srcObject = stream; await v.play().catch(() => {});
        } catch { return fail(t("camDenied")); }
        if ((await motionAsk) === "granted") {
          window.addEventListener("deviceorientationabsolute", onOrient);
          window.addEventListener("deviceorientation", onOrient);
        }
        if (navigator.geolocation) {
          watch = navigator.geolocation.watchPosition(p => { pos = [p.coords.latitude, p.coords.longitude]; acc = Math.round(p.coords.accuracy); },
            () => fail(t("camDenied")), { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
        }
      }
      timer = setInterval(update, 250); update();
    }

    function fail(msg) {
      const card = root.querySelector("#camCard");
      if (card) card.innerHTML = `<div class="k">${esc(msg)}</div><div class="row2"><button class="btn" data-close>${esc(t("close"))}</button></div>`;
      else { close(); ctx.toast(msg); return; }
      card.querySelector("[data-close]").onclick = close;
    }

    // Compass: iOS gives webkitCompassHeading. Android gives absolute alpha/beta/gamma, from which we work out where
    // the back camera (the device's -Z axis) points; that stays right when the phone is held upright.
    function onOrient(e) {
      let h = null;
      if (typeof e.webkitCompassHeading === "number" && !Number.isNaN(e.webkitCompassHeading)) h = e.webkitCompassHeading;
      else if ((e.absolute || e.type === "deviceorientationabsolute") && e.alpha != null) {
        const a = e.alpha * R, b = (e.beta || 0) * R, g = (e.gamma || 0) * R;
        const zx = Math.cos(a) * Math.sin(g) + Math.sin(a) * Math.sin(b) * Math.cos(g);
        const zy = Math.sin(a) * Math.sin(g) - Math.cos(a) * Math.sin(b) * Math.cos(g);
        const zz = Math.cos(b) * Math.cos(g);
        h = Math.abs(zz) > 0.92 ? (360 - e.alpha) % 360 : (Math.atan2(-zx, -zy) / R + 360) % 360;
      }
      if (h == null) return;
      // Smooth on the circle so 359° -> 1° does not swing through 180°.
      sx = sx * 0.75 + Math.sin(h * R) * 0.25; sy = sy * 0.75 + Math.cos(h * R) * 0.25;
      heading = (Math.atan2(sx, sy) / R + 360) % 360; lastHeadingAt = performance.now();
    }

    const dirName = h => t("dirs")[Math.round(h / 45) % 8];
    function bCard(b, label) {
      const j = ctx.bJobs(b), cs = b.companies.map(id => ctx.byC[id]).filter(Boolean).sort((x, y) => y.nj - x.nj);
      return `<div class="k">${esc(label)}</div><h3>${esc(ctx.bName(b))}</h3>
        <div class="s">${esc(ctx.placeOf(b))}${j ? ` · <b style="color:#3DD3A4">${esc(t("jobs", j, ctx.bPartial(b)))}</b>` : ""}</div>
        <div class="s">${esc(cs.slice(0, 3).map(c => c.name).join(", "))}${cs.length > 3 ? ` +${cs.length - 3}` : ""}</div>
        <div class="row2"><button class="btn primary" data-open="${esc(b.id)}">${esc(t("camOpen"))}</button><button class="btn" data-snap="${esc(b.id)}">${icon("share")}${esc(t("camSnap"))}</button></div>`;
    }
    const altBtn = ({ b, d }) => `<button class="alt" data-open="${esc(b.id)}">${esc(ctx.bName(b))}<small>${Math.round(d)} m${ctx.bJobs(b) ? ` · ${esc(t("jobs", ctx.bJobs(b), ctx.bPartial(b)))}` : ""}</small></button>`;

    function update() {
      const hud = root.querySelector("#camHud"), card = root.querySelector("#camCard"), tag = root.querySelector("#camTag");
      if (!card) return;
      if (!pos) return;
      const hasCompass = heading != null && performance.now() - lastHeadingAt < 3000;
      if (hud) hud.textContent = simOn ? `${t("camSim")} · ${t("camFacing", acc, dirName(heading))}` : hasCompass ? t("camFacing", acc, dirName(heading)) : `GPS ±${acc} m`;
      let key, html, top = null;
      if (acc > INDOOR_ACC || (!hasCompass && performance.now() - startedAt > 2500)) {
        const list = nearest(pos, ctx.buildings);
        key = "list:" + list.map(x => x.b.id).join();
        html = `<div class="k">${esc(acc > INDOOR_ACC ? t("camIndoor", acc) : t("camNoCompass"))}</div><div class="list">${list.map(altBtn).join("")}</div>`;
      } else if (!hasCompass) return;
      else {
        const c = candidates(pos, heading, ctx.buildings);
        if (!c.length) { key = "none"; html = `<div class="k">${esc(t("camNone"))}</div><div class="s">${esc(t("camHint"))}</div>`; }
        else {
          top = c[0].b; key = "c:" + c.map(x => x.b.id).join();
          html = bCard(top, t("camLooks")) + (c.length > 1 ? `<div class="k" style="margin-top:12px">${esc(t("camOr"))}</div><div class="alts">${c.slice(1).map(altBtn).join("")}</div>` : "");
        }
      }
      if (tag) {
        tag.style.opacity = top ? 1 : 0;
        if (top) tag.innerHTML = `<b>${esc(ctx.bName(top))}</b><br>${ctx.bJobs(top) ? `<span class="jn">${esc(t("jobs", ctx.bJobs(top), ctx.bPartial(top)))}</span>` : ""}`;
      }
      if (key === shownKey) return;
      shownKey = key; card.innerHTML = html;
      card.querySelectorAll("[data-open]").forEach(el => { el.onclick = () => { const id = el.dataset.open; close(); ctx.pick(id); }; });
      card.querySelectorAll("[data-snap]").forEach(el => { el.onclick = () => snapShare(el.dataset.snap); });
    }

    // Share photo: the current frame plus a bar with the building, drawn on the phone and handed to the share sheet.
    async function snapShare(id) {
      const b = ctx.buildings.find(x => x.id === id); if (!b) return;
      const v = root.querySelector("video");
      const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d");
      if (v && v.videoWidth) {
        const s = Math.max(W / v.videoWidth, H / v.videoHeight), w = v.videoWidth * s, h = v.videoHeight * s;
        x.drawImage(v, (W - w) / 2, (H - h) / 2, w, h);
      } else { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#33485A"); g.addColorStop(1, "#2F3A2F"); x.fillStyle = g; x.fillRect(0, 0, W, H); }
      const g = x.createLinearGradient(0, H - 460, 0, H); g.addColorStop(0, "rgba(5,8,11,0)"); g.addColorStop(.35, "rgba(5,8,11,.82)"); g.addColorStop(1, "rgba(5,8,11,.94)");
      x.fillStyle = g; x.fillRect(0, H - 460, W, 460);
      const F = (w, s) => `${w} ${s}px "Plus Jakarta Sans", "Noto Sans Telugu", system-ui, sans-serif`;
      x.fillStyle = "#fff"; x.font = F(800, 68); x.fillText(ctx.bName(b).slice(0, 34), 60, H - 250);
      x.font = F(600, 36); x.fillStyle = "#C9D3DB"; x.fillText(ctx.placeOf(b), 60, H - 195);
      const j = ctx.bJobs(b);
      if (j) { x.fillStyle = "#13A37F"; const s = t("jobs", j, ctx.bPartial(b)); x.font = F(800, 44); const w = x.measureText(s).width;
        x.beginPath(); x.roundRect ? x.roundRect(60, H - 160, w + 44, 70, 20) : x.rect(60, H - 160, w + 44, 70); x.fill(); x.fillStyle = "#fff"; x.fillText(s, 82, H - 111); }
      x.fillStyle = "#F45B35"; x.font = F(800, 40); x.textAlign = "right"; x.fillText(ctx.BRAND, W - 60, H - 60);
      x.fillStyle = "#C9D3DB"; x.font = F(600, 26); x.textAlign = "left"; x.fillText("Map © OpenStreetMap contributors", 60, H - 52);
      const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", .9));
      const file = new File([blob], `${ctx.BRAND.toLowerCase()}-${b.id}.jpg`, { type: "image/jpeg" });
      const url = `${location.origin}${location.pathname.replace(/index\.html$/, "")}b/${encodeURIComponent(b.id)}/`;
      ctx.shareFile(file, ctx.bName(b), `${ctx.bName(b)}: ${j ? t("jobs", j, ctx.bPartial(b)) : ""} ${url}`);
    }
  }

  window.MaploCamera = { open, _candidates: candidates };
})();
