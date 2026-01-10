(function () {
  const CSS_URL = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-ui.css";
  const JS_URL  = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-app.js";
  const MANIFEST_URL = "https://aditya-kumar-tech.github.io/mbk/embed/manifest.json";

  const cs = document.currentScript;
  const cfg = document.getElementById("mbk-config");

  function readMandiId(explicitId) {
    const a = (explicitId || "").trim();
    if (a) return a;
    const b = (cs?.dataset?.mandi || "").trim();
    if (b) return b;
    const c = (cfg?.dataset?.mandi || "").trim();
    return c;
  }

  function readAutoload() {
    return cs?.dataset?.autoload === "1" || cfg?.dataset?.autoload === "1";
  }

  function setShellLoading(isLoading) {
    const loader = document.getElementById("loadingMsg");
    const app = document.getElementById("mbkApp");
    if (loader) loader.style.display = isLoading ? "block" : "none";
    if (app) app.style.display = isLoading ? "none" : "block";
  }

  // ✅ MINIMAL UI SHELL - sirf required elements
  function createMinimalUI() {
    if (document.getElementById("mbkApp")) return;
    
    const app = document.createElement("div");
    app.id = "mbkApp";
    app.innerHTML = `
      <div id="mbkRoot">
        <!-- MBK expects these exact IDs -->
        <div id="dataArea">
          <div id="cardsContainer"></div>
          <table id="mandiTable" style="display:none">
            <thead><tr></tr></thead>
            <tbody id="tableBody"></tbody>
          </table>
        </div>
        <select id="dateSelect" style="display:none"></select>
        <button id="toggleBtn" style="display:none">Toggle</button>
        <div id="stats" style="display:none"></div>
        <div id="totalRecords">-</div>
        <div id="uniqueCommodities">-</div>
        <div id="selectedDate">-</div>
        <div id="mandiInfo" style="display:none"></div>
        <span id="mandiName"></span>
        <span id="distName"></span>
        <span id="stateName"></span>
        <input id="searchInput" style="display:none">
        <div id="pageTitle">Loading...</div>
        <div id="pageSubtitle"></div>
        <div id="loadingMsg" style="display:none">Loading...</div>
        <div id="watermark"></div>
      </div>
    `;
    
    const configDiv = document.getElementById("mbk-config");
    if (configDiv?.parentNode) {
      configDiv.parentNode.insertBefore(app, configDiv);
    } else {
      document.body.appendChild(app);
    }
  }

  async function loadCssOnce(href) {
    if (document.querySelector('link[data-mbk="css"]')) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-mbk", "css");
      link.onload = () => resolve();
      link.onerror = () => reject(new Error("CSS load failed"));
      document.head.appendChild(link);
    });
  }

  async function loadJsOnce(src) {
    if (document.querySelector('script[data-mbk="js"]')) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.setAttribute("data-mbk", "js");
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("JS load failed"));
      document.head.appendChild(s);
    });
  }

  let bootPromise = null;
  async function ensureBoot() {
    if (window.MBK && window.MBK.loadMandiBhav) {
      if (window.MBK.init) await window.MBK.init();
      return;
    }
    
    if (!bootPromise) {
      bootPromise = (async () => {
        // 1. Create UI FIRST (fix mustGet errors)
        createMinimalUI();
        
        // 2. Load CSS
        await loadCssOnce(CSS_URL);
        
        // 3. Load JS
        await loadJsOnce(JS_URL);
        
        // 4. Check manifest
        try {
          const resp = await fetch(MANIFEST_URL, {cache: 'no-cache'});
          const data = await resp.json();
          sessionStorage.setItem('mbk-manifest-check', data.maps_ver);
        } catch(e) {}
        
        // 5. Init app
        if (window.MBK?.init) await window.MBK.init();
      })();
    }
    await bootPromise;
  }

  // ✅ Original functions - unchanged logic
  window.mandibhavloadfresh = async function (mandiId) {
    const id = readMandiId(mandiId);
    if (!id) {
      setShellLoading(false);
      return;
    }

    // Button state
    const btn = document.querySelector('button[onclick*="mandibhavloadfresh"]');
    if (btn) {
      btn.textContent = "⏳ लोड हो रहा...";
      btn.disabled = true;
    }

    setShellLoading(true);
    try {
      await ensureBoot();
      return await window.MBK.loadMandiBhav(id);
    } catch(e) {
      console.error("MBK Load failed:", e);
    } finally {
      setShellLoading(false);
      if (btn) {
        btn.textContent = "🔄 फिर से लोड करें";
        btn.disabled = false;
      }
    }
  };

  window.toggleViewMode = async function () {
    await ensureBoot();
    return window.MBK?.toggleViewMode?.();
  };

  // ✅ Auto-start (original logic)
  const autoload = readAutoload();
  const hasMandi = !!readMandiId("");
  if (autoload && hasMandi) {
    setShellLoading(true);
    window.mandibhavloadfresh().catch(() => setShellLoading(false));
  } else {
    setShellLoading(false);
  }
})();
