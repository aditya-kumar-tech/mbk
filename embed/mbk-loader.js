(function () {
  const CSS_URL = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-ui.css?v=1";
  const JS_URL  = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-app.js?v=1";

  let bootPromise = null;

  function loadCssOnce(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('link[data-mbk="css"]')) return resolve();
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-mbk", "css");
      link.onload = () => resolve();
      link.onerror = () => reject(new Error("MBK CSS load failed"));
      document.head.appendChild(link);
    });
  }

  function loadJsOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-mbk="js"]')) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.setAttribute("data-mbk", "js");
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("MBK JS load failed"));
      document.head.appendChild(s);
    });
  }

  async function ensureBoot() {
    if (window.MBK && window.MBK.loadMandiBhav) {
      if (window.MBK.init) await window.MBK.init();
      return;
    }
    if (!bootPromise) {
      bootPromise = Promise.all([loadCssOnce(CSS_URL), loadJsOnce(JS_URL)]);
    }
    await bootPromise;
    if (window.MBK && window.MBK.init) await window.MBK.init();
  }

  // ✅ SAME function names as your HTML uses
  window.mandibhavloadfresh = async function () {
    await ensureBoot();
    return window.MBK.loadMandiBhav("19044003");
  };

  window.loadMandiBhav = async function (id) {
    await ensureBoot();
    return window.MBK.loadMandiBhav(id);
  };

  window.toggleViewMode = async function () {
    await ensureBoot();
    return window.MBK.toggleViewMode();
  };
})();
