(function () {
  // Yeh URLs manifest ke version ke bina hain, kyunki manifest logic init script handle kar raha hai
  const BASE_URL = "https://aditya-kumar-tech.github.io/mbk/embed/";
  const CSS_URL  = `${BASE_URL}mbk-ui.css`;
  const JS_URL   = `${BASE_URL}mbk-app.js`;

  const cs = document.currentScript;
  const cfg = document.getElementById("mbk-config");

  // 1. Mandi ID read karne ka logic
  function readMandiId(explicitId) {
    const a = (explicitId || "").trim();
    if (a) return a;
    const b = (cs?.dataset?.mandi || "").trim();
    if (b) return b;
    const c = (cfg?.dataset?.mandi || "").trim();
    if (c) return c;
    return "";
  }

  function readAutoload() {
    return cs?.dataset?.autoload === "1" || cfg?.dataset?.autoload === "1";
  }

  // 2. Loading State handle karna (Blogger Layout ke hisaab se)
  function setShellLoading(isLoading) {
    const loader = document.getElementById("loadingMsg");
    const app = document.getElementById("mbkApp");
    if (loader) loader.style.display = isLoading ? "block" : "none";
    if (app) app.style.display = isLoading ? "none" : "block";
  }

  // 3. Assets loading logic (Sirf ek baar load karega)
  function loadCssOnce(href) {
    return new Promise((resolve) => {
      if (document.querySelector('link[data-mbk="css"]')) return resolve();
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-mbk", "css");
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });
  }

  function loadJsOnce(src) {
    return new Promise((resolve) => {
      if (document.querySelector('script[data-mbk="js"]')) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.setAttribute("data-mbk", "js");
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }

  let bootPromise = null;

  // 4. Boot process: CSS -> JS -> App Init
  async function ensureBoot() {
    if (window.MBK && window.MBK.loadMandiBhav) return;

    if (!bootPromise) {
      bootPromise = (async () => {
        await loadCssOnce(CSS_URL); // Pehle CSS taaki design turant apply ho
        await loadJsOnce(JS_URL);
        // HTML inject karein
        if (window.MBK && window.MBK.init) {
          await window.MBK.init();
        }
      })();
    }
    return bootPromise;
  }

  // --- Global Functions (Buttons ke liye) ---

  window.mandibhavloadfresh = async function (mandiId) {
    const id = readMandiId(mandiId);
    if (!id) {
      setShellLoading(false);
      return;
    }

    setShellLoading(true);
    try {
      await ensureBoot();
      if (window.MBK && window.MBK.loadMandiBhav) {
        await window.MBK.loadMandiBhav(id);
      }
    } catch (err) {
      console.error("MBK Error:", err);
    } finally {
      setShellLoading(false);
    }
  };

  window.toggleViewMode = async function () {
    await ensureBoot();
    // App.js ke toggle function ko call karein
    if (window.MBK && window.MBK.toggleViewMode) {
      window.MBK.toggleViewMode();
    } else {
        // Fallback agar button ID available hai
        const btn = document.getElementById('toggleBtn');
        if (btn) btn.click();
    }
  };

  // 5. Autoload Trigger
  const autoload = readAutoload();
  const hasMandi = !!readMandiId("");

  if (autoload && hasMandi) {
    window.mandibhavloadfresh().catch(() => setShellLoading(false));
  } else {
    setShellLoading(false);
  }
})();
