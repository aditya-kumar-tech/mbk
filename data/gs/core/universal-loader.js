/* =====================================================
   MBK UNIVERSAL LOADER v9.2 (SAFE + RETRY)
   ===================================================== */
console.log("🟢 MBK: Loader Init1");
(function(){
  "use strict";

  console.log("🟢 MBK: Loader Init");

  const DEBUG = true;
  const log = (...a)=>DEBUG && console.log("🟢 MBK:",...a);

  /* ---------------- CONFIG ---------------- */
  const MAX_FUNC_WAIT = 25;   // function wait tries
  const MAX_TABLE_WAIT = 20;  // table wait tries
  const MAX_RETRY = 2;        // data retry
  const INTERVAL = 300;

  /* ---------------- UTILS ---------------- */

  function waitForFunction(fn, cb){
    let i=0;
    const t=setInterval(()=>{
      i++;
      if(typeof window[fn]==="function"){
        clearInterval(t);
        cb();
      }
      if(i>MAX_FUNC_WAIT){
        clearInterval(t);
        log("❌ Function not found:", fn);
      }
    },INTERVAL);
  }

  function waitForTable(selector, cb){
    let i=0;
    const t=setInterval(()=>{
      i++;
      const el=document.querySelector(selector);
      if(el && el.querySelector("tr")){
        clearInterval(t);
        cb(el);
      }
      if(i>MAX_TABLE_WAIT){
        clearInterval(t);
        cb(null);
      }
    },INTERVAL);
  }

  function hasVar(name){
    return typeof window[name]!=="undefined";
  }

  function cleanCityId(val){
    if(!val) return null;
    return String(val).replace(/[^\d]/g,''); // gct322 → 322
  }

  /* ---------------- CORE EXEC ---------------- */

  function runWithRetry({fn, tableSel, args, label}){
    let tries=0;

    function attempt(){
      tries++;
      log(label,"attempt",tries);

      fn.apply(null,args);

      waitForTable(tableSel,(table)=>{
        if(table){
          log(label,"✅ data loaded");
        }else if(tries<=MAX_RETRY){
          log(label,"🔁 retry");
          attempt();
        }else{
          log(label,"⏭ skipped (no data)");
        }
      });
    }
    attempt();
  }

  /* ---------------- SILVER ---------------- */

  function startSilver(){
    if(!hasVar("silver_city")) return log("⏭ silver_city not found");

    const city=cleanCityId(window.silver_city);
    if(!city) return log("⏭ invalid silver city");

    waitForFunction("Silverdata",()=>{
      runWithRetry({
        fn: Silverdata,
        tableSel: "#silver-rate-table, .silver-table, table",
        args: [city,"Silver"],
        label: "silverdata"
      });
    });
  }

  /* ---------------- GOLD ---------------- */

  function startGold(){
    if(!hasVar("gold_city")) return log("⏭ gold_city not found");

    const city=cleanCityId(window.gold_city);
    if(!city) return log("⏭ invalid gold city");

    waitForFunction("golddata",()=>{
      runWithRetry({
        fn: golddata,
        tableSel: "#gold-rate-table, .gold-table, table",
        args: [city,"gold"],
        label: "golddata"
      });
    });
  }

  /* ---------------- GVIZ (GRAMS / CHARTS SAFE) ---------------- */

  function startGViz(){
    if(!hasVar("GVIZ_URL")) return;

    waitForFunction("drawGVizTable",()=>{
      runWithRetry({
        fn: drawGVizTable,
        tableSel: ".gviz-table, table",
        args: [window.GVIZ_URL],
        label: "gviz"
      });
    });
  }

  /* ---------------- DOM READY ---------------- */

  function onReady(fn){
    if(document.readyState!=="loading") fn();
    else document.addEventListener("DOMContentLoaded",fn);
  }

  onReady(()=>{
    log("DOM Ready");

    startSilver();
    startGold();
    startGViz();
  });

})();
