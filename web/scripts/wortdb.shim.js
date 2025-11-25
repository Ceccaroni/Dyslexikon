/* Dyslexikon – WortDB Shim (Option A)
   Lädt Definitionen lokal aus:
   public/data/defs/<prefix>/<wort>.json

   – Wortschlüssel wird CH-DE-normalisiert:
     * toLowerCase
     * ß -> ss
     * ä -> ae, ö -> oe, ü -> ue
*/

window.WortDB = (function(){

  function normKey(wort){
    return String(wort || '')
      .toLowerCase()
      .trim()
      .replace(/ß/g, 'ss')
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue');
  }

  async function getDefinition(wort){
    if(!wort) return null;

    const key = normKey(wort);
    if(!key) return null;

    const prefix = key.slice(0, 2); // aa, ab, ac …

    try{
      const res = await fetch(`public/data/defs/${prefix}/${key}.json`, {
        cache: 'force-cache'
      });

      if(!res.ok){
        return null;
      }

      const def = await res.json();

      return {
        wort: def.wort || wort,
        def_kid: def.def_kid || '',
        beispiele: Array.isArray(def.beispiele) ? def.beispiele : [],
        tags: Array.isArray(def.tags) ? def.tags : []
      };

    }catch(e){
      console.warn('Definition laden fehlgeschlagen:', wort, e);
      return null;
    }
  }

  return { getDefinition };

})();
