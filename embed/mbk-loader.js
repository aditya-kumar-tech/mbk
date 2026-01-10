(async () => {
  const BASE_URL = 'https://aditya-kumar-tech.github.io/mbk/data/hi/';
  const MANIFEST_URL = 'https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  const PRICES_TTL_MS = 5 * 60 * 1000; // 5 minutes

  const CS = document.currentScript;
  const CFG = document.getElementById('mbk-config');

  // ---------- Helpers ----------
  function readMandiId(explicitId) {
    return (explicitId || CS?.dataset?.mandi || CFG?.dataset?.mandi || '').trim();
  }

  function readAutoload() {
    return CS?.dataset?.autoload === '1' || CFG?.dataset?.autoload === '1';
  }

  function showLoading(show) {
    const loader = document.getElementById('loadingMsg');
    if (loader) loader.style.display = show ? 'block' : 'none';
  }

  async function cachedPricesJson(pricesUrl, districtKey) {
    const key = 'mbk:prices:' + districtKey;
    const now = Date.now();

    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (cached?.data && cached?.t && (now - cached.t) < PRICES_TTL_MS) return cached.data;
    } catch {}

    const res = await fetch(pricesUrl);
    const data = await res.json();

    try { sessionStorage.setItem(key, JSON.stringify({ t: now, data })); } catch {}
    return data;
  }

  async function ensureMBK() {
    // Wait for MBK main app init
    if (window.MBK && window.MBK.init) await window.MBK.init();
  }

  // ---------- Main function ----------
  window.mandibhavloadfresh = async function (mandiId) {
    const id = readMandiId(mandiId);
    if (!id) { showLoading(false); return; }
    showLoading(true);

    try {
      await ensureMBK();

      // Extract state/dist IDs from mandiId
      const stateId = id.slice(0, 2);
      const distId = id.slice(0, 5);

      // Fetch states mapping to get slug
      let stateSlug = stateId, distSlug = distId;
      if (window.MBK?.states?.data?.[stateId]) stateSlug = window.MBK.states.data[stateId][1];

      // Ensure mandi names loaded for this state
      if (!window.MBK?.mandiNames || Object.keys(window.MBK.mandiNames).length === 0) {
        await window.MBK.loadMandiNamesForState(stateSlug);
      }

      // Fetch district slug from dists mapping
      let distData = {};
      try {
        distData = await window.MBK.cachedMapJson(`${BASE_URL}dists/${stateSlug}.json`);
      } catch {}
      if (distData?.data?.[distId]) distSlug = distData.data[distId][1] || distId;

      // Construct prices URL dynamically using slug
      const pricesUrl = `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;

      // Fetch prices JSON with 5 min cache
      const pricesData = await cachedPricesJson(pricesUrl, distSlug);

      // Pass prices to MBK
      if (window.MBK.loadPrices) await window.MBK.loadPrices(pricesData, id);

    } finally {
      showLoading(false);
    }
  };

  // ---------- Autoload ----------
  const autoload = readAutoload();
  if (autoload && readMandiId()) {
    window.mandibhavloadfresh().catch(() => { showLoading(false); });
  }

})();
