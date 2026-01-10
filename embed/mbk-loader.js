// Top me ye add karo (CSS_URL line ke baad)
const MANIFEST_URL = "https://aditya-kumar-tech.github.io/mbk/embed/manifest.json";
CSS_URL += `?v=${Date.now()}`;  // fallback cache-bust
JS_URL  += `?v=${Date.now()}`;

async function getManifestVer() {
  try {
    const resp = await fetch(MANIFEST_URL, {cache: 'no-cache'});
    const data = await resp.json();
    return data.maps_ver || 'unknown';
  } catch(e) {
    return 'unknown';
  }
}

// "फिर से लोड करें" logic - existing mandibhavloadfresh() me ye add:
window.mandibhavloadfresh = async function(mandiId) {
  const id = readMandiId(mandiId);
  if (!id) return;
  
  // Button state change
  const btn = document.querySelector('button[onclick="mandibhavloadfresh()"]');
  if (btn) {
    btn.textContent = "⏳ फिर से लोड हो रहा...";
    btn.disabled = true;
  }
  
  try {
    // Check manifest.json - agar nayi version to full reload
    const currentVer = await getManifestVer();
    const cachedVer = localStorage.getItem('mbk-maps-ver');
    
    if (currentVer !== cachedVer) {
      // Nayi version - cache clear + reload
      localStorage.clear();
      localStorage.setItem('mbk-maps-ver', currentVer);
      location.reload(); // CSS/JS bhi fresh load
      return;
    }
    
    // Same version - sirf data reload
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
