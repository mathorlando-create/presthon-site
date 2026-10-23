/* PRESTHON — comportamento do site. Sem dependências. */
(function () {
  "use strict";
  var CFG = window.PRESTHON || {};

  /* ---------- medição ----------
     Cada link relevante tem data-evento (clique_presave, clique_streaming, clique_youtube,
     clique_contato, download_imprensa, clique_social). Os eventos vão para window.dataLayer.
     O GA4 só é carregado se houver ID configurado e o visitante aceitar (ver docs/MEDICAO.md).
     Clique não é reprodução: o nome dos eventos deixa isso explícito. */
  window.dataLayer = window.dataLayer || [];
  function registrar(evento, dados) {
    var payload = Object.assign({ event: evento }, dados || {});
    window.dataLayer.push(payload);
    if (typeof window.gtag === "function") window.gtag("event", evento, dados || {});
    if (CFG.debug) try { console.debug("[medição]", payload); } catch (e) {}
  }
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest && ev.target.closest("[data-evento]");
    if (!el) return;
    registrar(el.getAttribute("data-evento"), {
      destino: el.getAttribute("data-destino") || el.getAttribute("href") || "",
      plataforma: el.getAttribute("data-plataforma") || "",
      local: el.getAttribute("data-local") || document.body.getAttribute("data-pagina") || ""
    });
  });

  var CHAVE = "presthon-consentimento";
  function lerConsent() { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } }
  function salvarConsent(v) { try { localStorage.setItem(CHAVE, v); } catch (e) {} }
  function carregarGA(id) {
    if (!/^G-[A-Z0-9]+$/.test(id) || window.gtag) return;
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
  }
  var banner = document.getElementById("consent");
  if (CFG.ga4 && banner) {
    var c = lerConsent();
    if (c === "sim") carregarGA(CFG.ga4);
    else if (c !== "nao") banner.hidden = false;
    banner.addEventListener("click", function (ev) {
      var b = ev.target.closest("button[data-consent]"); if (!b) return;
      var v = b.getAttribute("data-consent"); salvarConsent(v); banner.hidden = true;
      if (v === "sim") carregarGA(CFG.ga4);
    });
  }

  /* ---------- menu ---------- */
  var btn = document.querySelector(".menu-btn"), nav = document.getElementById("menu");
  if (btn && nav) {
    var mq = window.matchMedia("(max-width: 860px)");
    function sync() { if (mq.matches) { nav.setAttribute("data-open", btn.getAttribute("aria-expanded") === "true" ? "true" : "false"); } else nav.removeAttribute("data-open"); }
    btn.addEventListener("click", function () {
      var aberto = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!aberto)); sync();
      if (!aberto) { var a = nav.querySelector("a"); if (a) a.focus(); }
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && btn.getAttribute("aria-expanded") === "true") { btn.setAttribute("aria-expanded", "false"); sync(); btn.focus(); }
    });
    (mq.addEventListener ? mq.addEventListener("change", sync) : mq.addListener(sync)); sync();
  }

  /* ---------- YouTube sob demanda (youtube-nocookie) ---------- */
  document.querySelectorAll("[data-yt]").forEach(function (box) {
    var a = box.querySelector(".yt__btn"); if (!a) return;
    a.addEventListener("click", function (ev) {
      if (!CFG.embeds) return; /* sem embeds: segue o link para o YouTube */
      ev.preventDefault();
      var id = box.getAttribute("data-yt");
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
      f.title = box.getAttribute("data-title") || "Vídeo no YouTube";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.referrerPolicy = "strict-origin-when-cross-origin";
      f.allowFullscreen = true;
      var frame = box.querySelector(".yt__frame"); frame.innerHTML = ""; frame.appendChild(f); f.focus();
    });
  });

  /* ---------- Spotify sob demanda ---------- */
  document.querySelectorAll("[data-sp]").forEach(function (box) {
    var b = box.querySelector("button"); if (!b) return;
    if (!CFG.embeds) { b.hidden = true; return; }
    b.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = box.getAttribute("data-sp"); f.height = box.getAttribute("data-h") || "352";
      f.title = box.getAttribute("data-title") || "Player do Spotify"; f.loading = "lazy";
      f.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      b.replaceWith(f);
      registrar("player_spotify_carregado", { local: document.body.getAttribute("data-pagina") || "" });
    });
  });

  /* ---------- copiar e-mail ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.hidden = false;
    b.addEventListener("click", function () {
      var txt = b.getAttribute("data-copy"), out = document.getElementById(b.getAttribute("aria-controls"));
      function ok(msg) { if (out) out.textContent = msg; }
      registrar("clique_contato", { destino: "copiar_email" });
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () { ok("E-mail copiado."); }, function () { selecionar(); });
      } else selecionar();
      function selecionar() {
        var alvo = document.querySelector("[data-email-texto]");
        if (alvo && window.getSelection) { var r = document.createRange(); r.selectNodeContents(alvo); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
        ok("Selecionado. Use Ctrl+C ou Cmd+C para copiar.");
      }
    });
  });
})();
