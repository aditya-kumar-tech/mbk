(function () {
  const CSS_URL = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-ui.css";
  const JS_URL  = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-app.js";

  const cs = document.currentScript;
  const cfg = document.getElementById("mbk-config");

  function readMandiId() {
    return (cs?.dataset?.mandi || cfg?.dataset?.mandi || "").trim() || "";
  }

  function readAutoload() {
    return cs?.dataset?.autoload === "1" || cfg?.dataset?.autoload === "1";
  }

  function setShellLoading(show) {
    const loader = document.getElementById("loadingMsg");
    if (loader) loader.style.display = show ? "block" : "none";
  }

  // ✅ COMPLETE UI - Exact IDs jo mbk-app.js expect karta hai
  function createFullUI() {
    if (document.getElementById("mbkApp")) return;
    
    const app = document.createElement("div");
    app.id = "mbkApp";
    app.style.display = "block";
    
    app.innerHTML = `
      <div id="mbkRoot" style="padding:20px;">
        <div class="header">
          <h1 id="pageTitle">🌱 मंडी भाव लोड हो रहा है...</h1>
          <p id="pageSubtitle">रियल टाइम कृषि मंडी भाव</p>
        </div>
        
        <div class="input-row" style="text-align:center; margin:20px 0;">
          <select id="dateSelect" style="padding:10px; margin-right:10px;">
            <option value="">तारीख चुनें</option>
          </select>
          <button id="toggleBtn" onclick="toggleViewMode()" style="padding:10px 20px; background:#ff7043; color:white; border:none; border-radius:5px; cursor:pointer; display:none;">🃏 कार्ड</button>
        </div>

        <div id="mandiInfo" style="background:white; padding:15px; border-radius:10px; margin:10px 0; display:none;">
          <strong>📍 मंडी:</strong> <span id="mandiName">-</span> | 
          <strong>🌆 जिला:</strong> <span id="distName">-</span> | 
          <strong>🏛️ राज्य:</strong> <span id="stateName">-</span>
        </div>

        <input id="searchInput" class="search-box" placeholder="🔍 कमोडिटी खोजें..." style="width:100%; padding:12px; margin:10px 0; border:2px solid #ddd; border-radius:25px; display:none;">

        <div id="stats" class="stats" style="display:none; text-align:center; margin:15px 0;">
          <div style="display:inline-block; background:white; padding:15px; border-radius:10px; margin:0 10px;">
            <div id="totalRecords" class="stat-number" style="font-size:24px; color:#d84315;">0</div>
            <div class="stat-label">कुल भाव</div>
          </div>
          <div style="display:inline-block; background:white; padding:15px; border-radius:10px; margin:0 10px;">
            <div id="uniqueCommodities" class="stat-number" style="font-size:24px; color:#d84315;">0</div>
            <div class="stat-label">कमोडिटीज</div>
          </div>
          <div style="display:inline-block; background:white; padding:15px; border-radius:10px; margin:0 10px;">
            <div id="selectedDate" class="stat-number" style="font-size:24px; color:#d84315;">-</div>
            <div class="stat-label">तारीख</div>
          </div>
        </div>

        <div id="dataArea">
          <div id="cardsContainer" style="display:none;"></div>
          <div class="table-wrapper" style="overflow-x:auto;">
            <table id="mandiTable" style="display:none; width:100%; border-collapse:collapse;">
              <thead><tr><th>क्रम</th></tr></thead>
              <tbody id="tableBody"></tbody>
            </table>
          </div>
        </div>

        <div id="watermark" style="text-align:center; margin-top:30px; color:#666; font-size:14px; display:none;">
          📱 MandiBhavKhabar.com - Follow @MandiBhavKhabar
        </div>
      </div>
    `;
    
    const configDiv = document.getElementById("mbk-config");
    if (configDiv?.parentNode) {
      configDiv.parentNode.insertBefore(app, configDiv.nextSibling);
    } else {
      document.body.appendChild(app);
    }
  }

  async function loadCssOnce() {
    if (document.querySelector('link[data-mbk="css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS_URL;
    link.setAttribute("data-mbk", "css");
    document.head.appendChild(link);
    return new Promise(r => link.onload = r);
  }

  async function loadJsOnce() {
    if (document.querySelector('script[data-mbk="js"]')) return;
    const script = document.createElement("script");
    script.src = JS_URL;
    script.setAttribute("data-mbk", "js");
    document.head.appendChild(script);
    return new Promise(r => script.onload = r);
  }

  let bootPromise = null;
  async function ensureBoot() {
    if (window.MBK?.loadMandiBhav && window.MBK.init) {
      await window.MBK.init();
      return;
    }
    
    if (!bootPromise) {
      bootPromise = (async () => {
        // ✅ 1. UI FIRST (no mustGet errors)
        createFullUI();
        
        // ✅ 2. CSS
        await loadCssOnce();
        
        // ✅ 3. JS
        await loadJsOnce();
        
        // ✅ 4. Wait for MBK to be ready
        while (!window.MBK?.init) {
          await new Promise(r => setTimeout(r, 50));
        }
        
        // ✅ 5. Init MBK
        await window.MBK.init();
      })();
    }
    await bootPromise;
  }

  window.mandibhavloadfresh = async function(mandiId) {
    const id = readMandiId();
    if (!id) {
      alert('❌ मंडी ID नहीं मिला!');
      return;
    }

    // Button loading state
    const buttons = document.querySelectorAll('button[onclick*="mandibhavloadfresh"]');
    buttons.forEach(btn => {
      btn.textContent = "⏳ लोड हो रहा...";
      btn.disabled = true;
    });

    setShellLoading(true);
    try {
      await ensureBoot();
      
      // ✅ CRITICAL: Pre-load states to avoid undefined_mandis.json
      if (!window.MBK.states?.data) {
        await window.MBK.loadStates();
      }
      
      await window.MBK.loadMandiBhav(id);
      
    } catch(e) {
      console.error("MBK Error:", e);
      document.getElementById("pageTitle").textContent = "❌ लोड विफल - फिर से कोशिश करें";
    } finally {
      setShellLoading(false);
      buttons.forEach(btn => {
        btn.textContent = "🔄 फिर से लोड करें";
        btn.disabled = false;
      });
    }
  };

  window.toggleViewMode = async function() {
    await ensureBoot();
    window.MBK?.toggleViewMode?.();
  };

  // Auto-start
  if (readAutoload()) {
    setTimeout(() => mandibhavloadfresh(), 800);
  }
})();
