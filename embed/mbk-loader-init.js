(async()=>{
  const MANIFEST_URL='https://aditya-kumar-tech.github.io/mbk/embed/manifest.json';
  const manifest=await fetch(MANIFEST_URL,{cache:'no-store'}).then(r=>r.json());

  const loaderVer=sessionStorage.getItem('mbk:ver:loader')||'';
  if(loaderVer!==manifest.js_ver){
    sessionStorage.setItem('mbk:ver:loader',manifest.js_ver);
    const s=document.createElement('script');
    s.src='https://aditya-kumar-tech.github.io/mbk/embed/mbk-loader.js?v='+manifest.js_ver;
    document.head.appendChild(s);
  } else {
    // already latest loader, just load it
    const s=document.createElement('script');
    s.src='https://aditya-kumar-tech.github.io/mbk/embed/mbk-loader.js?v='+manifest.js_ver;
    document.head.appendChild(s);
  }
})();
