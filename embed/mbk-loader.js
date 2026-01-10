// Inside mbk-loader.js, replace old prices URL logic with slug-based
async function getPricesUrl(mandiId) {
  const stateId = mandiId.slice(0, 2);
  const distId = mandiId.slice(0, 5);

  // mapping from stateId -> stateSlug
  const stateInfo = states?.data?.[stateId];
  const stateSlug = stateInfo?.[1] || stateId;

  // load mandiNames if not already
  if (Object.keys(mandiNames).length === 0) {
    await loadMandiNamesForState(stateSlug);
  }

  // mapping from distId -> distSlug
  const distMappingUrl = `${BASE_URL}dists/${stateSlug}.json`;
  const distData = await cachedMapJson(distMappingUrl);
  const distInfo = distData?.data?.[distId];
  const distSlug = distInfo?.[1] || distId;

  // ✅ slug-based prices URL
  const pricesUrl = `${BASE_URL}prices/${stateSlug}/${distSlug}_prices.json`;
  return { pricesUrl, stateInfo, distInfo, distSlug };
}

// cache 5 min TTL, only for prices
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
