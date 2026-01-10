(function () {
  const CSS_URL = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-ui.css?v=6";
  const JS_URL  = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-app.js?v=6";

  const cfg = document.getElementById("mbk-config");

  function readMandiId(explicitId) {
    return (explicitId || "").trim() || (cfg?.dataset?.mandi || "").trim() || "";
  }

  function readAutoload() {
    return cfg?.dataset?.autoload === "1";
  }

  function setShellLoading(show) {
    const loader = document.getElementById("loadingMsg");
    const app = document.getElementById("mbkApp");
    if (loader) loader.style.display = show ? "block" : "none";
    if (app) app.style.display = show ? "none" : "block";
  }

  // ✅ DYNAMIC UI CREATE - sab kuch JS se banayenge
  function createUI() {
    const app = document.createElement("div");
    app.id = "mbkApp";
    
    app.innerHTML = `
      <div id="mbkRoot">
        <div class="input-row">
          <select id="dateSelect"></select>
          <button onclick="mandibhavloadfresh()">🔄 लोड करें</button>
          <button id="toggleBtn" onclick="toggleViewMode()">🃏 कार्ड</button>
        </div>
        <div class="header">
          <h1 id="pageTitle">🌱 मंडी भाव लोड हो रहा है...</h1>
          <p id="pageSubtitle">रियल टाइम कृषि मंडी भाव</p>
        </div>
        <div id="dataArea">
          <div id="cardsContainer"></div>
          <div class="table-wrapper">
            <table id="mandiTable">
              <thead><tr><th>क्रम</th><th>कमोडिटी</th><th>वैरायटी</th><th>ग्रेड</th><th>न्यूनतम ₹</th><th>अधिकतम ₹</th><th>मॉडल ₹</th></tr></thead>
              <tbody id="tableBody"></tbody>
            </table>
          </div>
        </div>
        <div class="mandi-info" id="mandiInfo" style="display:none;">
          <strong>📍 मंडी:</strong> <span id="mandiName">-</span> |
          <strong>🌆 जिला:</strong> <span id="distName">-</span> |
          <strong>🏛️ राज्य:</strong> <span id="stateName">-</span>
        </div>
        <input class="search-box" id="searchInput" style="display:none;">
        <div class="stats" id="stats" style="display:none;">
          <div class="stat-card"><div class="stat-number" id="totalRecords">-</div><div class="stat-label">कुल भाव</div></div>
          <div class="stat-card"><div class="stat-number" id="uniqueCommodities">-</div><div class="stat-label">कमोडिटीज</div></div>
          <div class="stat-card"><div class="stat-number" id="selectedDate">-</div><div class="stat-label">तारीख</div></div>
        </div>
        <div class="watermark" id="watermark" style="display:none;">📱 Follow @MandiBhavKhabar</div>
      </div>
    `;
    
    document.body.appendChild(app);
    return app.id;
  }

  async function loadCss() {
    if (document.querySelector('link[data-mbk="css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS_URL;
    link.setAttribute("data-mbk", "css");
    document.head.appendChild(link);
    return new Promise(resolve => link.onload = resolve);
  }

  async function loadJs() {
    if (document.querySelector('script[data-mbk="js"]')) return;
    const script = document.createElement("script");
    script.src = JS_URL;
    script.setAttribute("data-mbk", "js");
    document.head.appendChild(script);
    return new Promise(resolve => script.onload = resolve);
  }

  window.mandibhavloadfresh = async function(mandiId) {
    const id = readMandiId(mandiId);
    if (!id) return setShellLoading(false);
    
    // Button loading state
    const btn = document.querySelector('button[onclick*="mandibhavloadfresh"]');
    if (btn) {
      btn.textContent = "⏳ लोड हो रहा...";
      btn.disabled = true;
    }
    
    try {
      setShellLoading(true);
      await ensureBoot();
      await window.MBK.loadMandiBhav(id);
    } catch(e) {
      console.error("Load failed:", e);
    } finally {
      setShellLoading(false);
      if (btn) {
        btn.textContent = "🔄 फिर से लोड करें";
        btn.disabled = false;
      }
    }
  };

  window.toggleViewMode = async function() {
    await ensureBoot();
    return window.MBK?.toggleViewMode?.();
  };

  let bootPromise = null;
  async function ensureBoot() {
    if (window.MBK?.loadMandiBhav) {
      if (window.MBK.init) await window.MBK.init();
      return;
    }
    
    if (!bootPromise) {
      // 1. Create UI first
      createUI();
      
      // 2. Load CSS
      await loadCss();
      
      // 3. Load JS
      bootPromise = loadJs();
      await bootPromise;
      
      // 4. Init app
      if (window.MBK?.init) await window.MBK.init();
    }
    
    await bootPromise;
  }

  // Auto-start if autoload enabled
  if (readAutoload() && readMandiId("")) {
    setTimeout(() => mandibhavloadfresh(), 200);
  }
})();
