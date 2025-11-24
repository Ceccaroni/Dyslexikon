/* Dyslexikon – WortDB Shim (Option A)
   Lädt Definitionen lokal aus:
   public/data/defs/<prefix>/<wort>.json
*/

window.WortDB = (function(){

  async function getDefinition(wort){
    if(!wort) return null;

    const key = String(wort).toLowerCase().replace(/ß/g, 'ss');
    const prefix = key.slice(0, 2);

    try{
      const res = await fetch(`public/data/defs/${prefix}/${key}.json`, {
        cache: 'force-cache'
      });
      if(!res.ok) return null;

      const def = await res.json();

      return {
        wort: def.wort || wort,
        def_kid: def.def_kid || '',
        beispiele: Array.isArray(def.beispiele) ? def.beispiele : [],
        tags: Array.isArray(def.tags) ? def.tags : []
      };

    }catch(e){
      console.warn('Definition-Load fehlgeschlagen:', wort, e);
      return null;
    }
  }

  return { getDefinition };

})();
