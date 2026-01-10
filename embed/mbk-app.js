(function () {
  // ---------- Dynamic DOM creation ----------
  function createEl(tag, attrs = {}, parent = document.body) {
    const el = document.createElement(tag);
    Object.keys(attrs).forEach(k => {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'style') el.style.cssText = attrs[k];
      else el[k] = attrs[k];
    });
    parent.appendChild(el);
    return el;
  }

  // Root container
  const root = createEl('div', { id: 'mbkApp', style: 'width:100%;' }, document.body);

  // Loader
  createEl('div', { id: 'loadingMsg', innerText: 'लोड हो रहा है... ⏳', style: 'text-align:center;padding:20px;font-size:18px;' }, root);

  // Page title/subtitle
  createEl('h2', { id: 'pageTitle', innerText: '', style: 'margin:10px 0;' }, root);
  createEl('h3', { id: 'pageSubtitle', innerText: '', style: 'margin:5px 0;' }, root);

  // Stats area
  const stats = createEl('div', { id: 'stats', style: 'display:none;flex-gap:20px;margin-bottom:10px;' }, root);
  createEl('span', { id: 'mandiName' }, stats);
  createEl('span', { id: 'distName' }, stats);
  createEl('span', { id: 'stateName' }, stats);
  createEl('span', { id: 'totalRecords' }, stats);
  createEl('span', { id: 'uniqueCommodities' }, stats);
  createEl('span', { id: 'selectedDate' }, stats);

  // Controls
  createEl('select', { id: 'dateSelect', style: 'margin:5px;' }, root);
  createEl('button', { id: 'toggleBtn', innerText: '🃏 कार्ड', style: 'margin:5px;' }, root);
  createEl('input', { id: 'searchInput', placeholder: 'सर्च...', style: 'margin:5px;padding:4px;' }, root);

  // Data area
  const dataArea = createEl('div', { id: 'dataArea', style: 'width:100%;' }, root);
  const mandiTable = createEl('table', { id: 'mandiTable', class: 'mandi-table', style: 'display:none;width:100%;border-collapse:collapse;' }, dataArea);
  createEl('thead', { innerHTML: '<tr></tr>' }, mandiTable);
  createEl('tbody', { id: 'tableBody' }, mandiTable);
  createEl('div', { id: 'cardsContainer', class: 'cards-container', style: 'display:none;grid-gap:10px;' }, dataArea);

  createEl('div', { id: 'mandiInfo', style: 'display:none;' }, root);
  createEl('div', { id: 'watermark', innerText: 'MBK', style: 'opacity:0.1;margin-top:10px;' }, root);

  // Now include your original mbk-app.js logic here
})();
