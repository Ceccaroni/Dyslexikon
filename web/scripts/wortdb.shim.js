// Dyslexikon – Option A: lokale Definitionen
// Basis: public/data/defs/<prefix>/<wort>.json
const BASE = "public/data/defs";
const TTL_DAYS = 180;
const inflight = new Map(); // wort -> Promise

function norm(s){
  return (s || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue");
}

function cacheKey(w){ return `def:${w}`; }

function getCache(w){
  try{
    const raw = localStorage.getItem(cacheKey(w));
    if(!raw) return null;
    const obj = JSON.parse(raw);
    const age = (Date.now() - (obj.ts_cached || 0)) / 86400000;
    if(age > TTL_DAYS) return null;
    return obj;
  }catch{
    return null;
  }
}

function setCache(w, data){
  try{
    localStorage.setItem(
      cacheKey(w),
      JSON.stringify({...data, ts_cached: Date.now()})
    );
  }catch{
    // Storage voll oder deaktiviert – ignorieren
  }
}

function defPath(w){
  const n = norm(w);          // "Aachen" -> "aachen"
  const p = (n.slice(0, 2) || "_"); // "aa"
  const f = n || "_";         // "aachen"
  return `${BASE}/${p}/${f}.json`;
}

async function fetchLocalDef(w){
  const url = defPath(w);
  const res = await fetch(url, { cache: "force-cache" });
  if(!res.ok) throw new Error(`404 ${url}`);
  return await res.json();
}

window.WortDB = window.WortDB || {};

window.WortDB.getDefinition = async function(wort){
  // Cache-Hit?
  const cached = getCache(wort);
  if(cached){
    console.info("def cache hit", wort);
    return cached;
  }

  if(inflight.has(wort)) return inflight.get(wort);

  const p = (async ()=>{
    try{
      const obj = await fetchLocalDef(wort);
      console.info("def local fetch", wort);
      setCache(wort, obj);
      return obj;
    }catch(err){
      console.warn("def local fetch failed", wort, err);
      // Kein Remote-Fallback gemäss Option A
      return {
        wort,
        def_kid: null,
        beispiele: [],
        tags: [],
        source: "none",
        license: null,
        ts_cached: Date.now()
      };
    }
  })();

  inflight.set(wort, p);
  try{
    return await p;
  }finally{
    inflight.delete(wort);
  }
};
