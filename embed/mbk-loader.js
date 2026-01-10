(function () {
  const MANIFEST_URL = "https://aditya-kumar-tech.github.io/mbk/embed/manifest.json";
  const CSS_URL = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-ui.css";
  const JS_URL  = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-app.js";

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

  // ✅ COMPLETE UI DYNAMICALLY CREATE
  function createFullUI() {
    const app = document.createElement("div");
    app.id = "mbkApp";
    
    app.innerHTML = `
      <div id="mbkRoot">
        <div class="input-row">
          <select id="dateSelect"><option>तारीख चुनें</option></select>
          <button onclick="mandibhavloadfresh()">🔄 लोड करें</button>
          <button id="toggleBtn" onclick="toggleViewMode()">🃏 कार्ड</button>
        </div>
        <div class="header">
          <h1 id="pageTitle">🌱 मंडी भाव - Mandi Bhav Khabar</h1>
          <p id="pageSubtitle">रियल टाइम कृषि मंडी भाव</p>
        </div>
        <div id="dataArea">
          <div id="cardsContainer"></div>
          <div class="table-wrapper">
            <table id="mandiTable">
              <thead><tr><th>क्रम</th></tr></thead>
              <tbody id="tableBody"></tbody>
            </table>
          </div>
        </div>
        <div class="mandi-info" id="mandiInfo" style="display:none">
          <strong>📍 मंडी:</strong> <span id="mandiName">-</span> | 
          <strong>🌆 जिला:</strong> <span id="distName">-</span> | 
          <strong>🏛️ राज्य:</strong> <span id="stateName">-</span>
        </div>
        <input class="search-box" id="searchInput" placeholder="🔍 खोजें..." style="display:none">
        <div class="stats" id="stats" style="display:none">
          <div class="stat-card"><div class="stat-number" id="totalRecords">-</div><div class="stat-label">कुल भाव</div></div>
          <div class="stat-card"><div class="stat-number" id="uniqueCommodities">-</div><div class="stat-label">कमोडिटीज</div></div>
          <div class="stat-card"><div class="stat-number" id="selectedDate">-</div><div class="stat-label">तारीख</div></div>
        </div>
        <div class="watermark" id="watermark" style="display:none">📱 Follow @MandiBhavKhabar</div>
      </div>
    `;
    
    // Insert after config div
    const configDiv = document.getElementById("mbk-config");
    if (configDiv && configDiv.parentNode) {
      configDiv.parentNode.insertBefore(app, configDiv.nextSibling);
    } else {
      document.body.appendChild(app);
    }
  }

  async function checkManifestAndLoad() {
    try {
      const resp = await fetch(MANIFEST_URL, {cache: 'no-cache'});
      const manifest = await resp.json();
      localStorage.setItem('mbk-manifest-ver', manifest.maps_ver);
    } catch(e) {
      console.log('Manifest check skipped');
    }
  }

  async function loadCssOnce() {
    if (document.querySelector('link[data-mbk="css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet"; 
    link.href = CSS_URL;
    link.setAttribute("data-mbk", "css");
    document.head.appendChild(link);
  }

  async function loadJsOnce() {
    if (document.querySelector('script[data-mbk="js"]')) return;
    const script = document.createElement("script");
    script.src = JS_URL;
    script.setAttribute("data-mbk", "js");
    document.head.appendChild(script);
    return new Promise((resolve) => {
      script.onload = () => {
        if (window.MBK?.init) window.MBK.init();
        resolve();
      };
    });
  }

  let bootPromise = null;
  async function ensureBoot() {
    if (window.MBK?.loadMandiBhav) return;
    
    if (!bootPromise) {
      bootPromise = (async () => {
        await checkManifestAndLoad();  // ✅ manifest check only
        createFullUI();                // ✅ create all DOM elements
        await loadCssOnce();           // ✅ CSS (no version)
        await loadJsOnce();            // ✅ JS (no version)
      })();
    }
    await bootPromise;
  }

  // ✅ Global functions
  window.mandibhavloadfresh = async function(mandiId) {
    const id = readMandiId(mandiId);
    if (!id) return;
    
    const btn = document.querySelector('button[onclick*="mandibhavloadfresh"]');
    if (btn) {
      btn.textContent = "⏳ लोड हो रहा...";
      btn.disabled = true;
    }
    
    try {
      await ensureBoot();
      await window.MBK.loadMandiBhav(id);
    } catch(e) {
      console.error("Load error:", e);
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

  // Auto-start
  if (readAutoload()) {
    setTimeout(() => mandibhavloadfresh(), 500);
  }
})();
