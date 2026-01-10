async function cachedPricesJson(pricesUrl, districtKey) {
  const key = PRICES_PREFIX + districtKey;
  const now = Date.now();
  const TTL = 5 * 60 * 1000; // 5 minute

  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    
    // Condition: Data exist kare, 5 min se purana na ho, aur manifest ne force na kiya ho
    if (cached && (now - cached.t) < TTL && !window.MBK_CONFIG.needForceReload) {
      console.log("MBK: Serving prices from local storage cache.");
      return cached.data;
    }
  } catch (e) {}

  // Fresh fetch bina URL versioning ke
  console.log("MBK: Cache expired or forced. Fetching fresh prices...");
  const res = await fetch(pricesUrl, { cache: 'no-store' });
  const data = await res.json();

  // Save to cache
  localStorage.setItem(key, JSON.stringify({ t: now, data: data }));
  return data;
}
