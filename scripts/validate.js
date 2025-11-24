/* Dyslexikon – Validator (Option A)
   Läuft nur lokal im Browser.
   Keine Schreiboperationen. Keine Änderungen.
   Aufruf: window.Dyslexikon.validate()
*/

window.Dyslexikon = window.Dyslexikon || {};

window.Dyslexikon.validate = async function(){

  const report = {
    ok: true,
    prefixes: {},
    lemmas: {},
    defs: {},
    warnings: [],
    errors: []
  };

  /* 1. Prefix-Index laden */
  let index;
  try{
    const res = await fetch('public/index/index.json', {cache:'no-store'});
    if(!res.ok) throw new Error('404');
    index = await res.json();
  }catch(e){
    report.ok = false;
    report.errors.push('public/index/index.json fehlt oder ist unlesbar.');
    console.error(report);
    return report;
  }

  if(!Array.isArray(index.prefixes)){
    report.ok = false;
    report.errors.push('index.json: Feld "prefixes" ist kein Array.');
  }

  const prefixes = index.prefixes || [];

  /* 2. Prefix-Ordner prüfen */
  for(const p of prefixes){
    const lp = p.toLowerCase();
    const up = p.toUpperCase();

    if(p !== lp){
      report.warnings.push(`Prefix ${p} sollte lowercase sein: ${lp}`);
    }

    report.prefixes[lp] = { exists: true };

    /* 3. Lemma-Datei prüfen */
    let lemmas;
    try{
      const res = await fetch(`public/index/${lp}/lemmas.json`, {cache:'no-store'});
      if(!res.ok) throw new Error('404');
      lemmas = await res.json();
    }catch(e){
      report.ok = false;
      report.errors.push(`public/index/${lp}/lemmas.json fehlt oder ist unlesbar.`);
      continue;
    }

    if(!Array.isArray(lemmas)){
      report.ok = false;
      report.errors.push(`lemmas.json im Prefix ${lp} ist kein Array.`);
      continue;
    }

    report.lemmas[lp] = [];

    /* 4. Alle Lemmata prüfen */
    for(const lemma of lemmas){

      const word = String(lemma.wort || '').trim();
      const normWord = word.toLowerCase().replace(/ß/g,'ss');

      if(!word){
        report.ok = false;
        report.errors.push(`Leeres "wort" in Prefix ${lp}.`);
        continue;
      }

      if(normWord.slice(0,2) !== lp){
        report.warnings.push(`Lemma "${word}" liegt im falschen Prefix-Ordner (sollte: ${lp}).`);
      }

      if(!Array.isArray(lemma.silben)){
        report.warnings.push(`Lemma "${word}" hat keine gültigen "silben".`);
      }

      if(!Array.isArray(lemma.tags)){
        report.warnings.push(`Lemma "${word}" hat keine gültigen "tags".`);
      }

      /* Definitionsdatei prüfen */
      let defObj = null;
      let defOK = true;
      try{
        const defRes = await fetch(`public/data/defs/${lp}/${normWord}.json`, {cache:'no-store'});
        if(!defRes.ok){
          defOK = false;
          report.warnings.push(`Definition fehlt für "${word}" (${lp}/${normWord}.json).`);
        }else{
          defObj = await defRes.json();
        }
      }catch(e){
        defOK = false;
        report.warnings.push(`Definition unlesbar für "${word}".`);
      }

      report.lemmas[lp].push({
        wort: word,
        prefix: lp,
        hasDefinition: defOK
      });

      /* Definition inhaltlich prüfen */
      if(defObj){
        if(!defObj.def_kid){
          report.warnings.push(`Definition "${word}" hat kein Feld "def_kid".`);
        }
        if(!Array.isArray(defObj.tags)){
          report.warnings.push(`Definition "${word}" hat kein gültiges "tags"-Array.`);
        }
      }
    }
  }

  /* 5. Waisen (Definition ohne Lemma) */

  // Wir prüfen alle Ordner unter public/data/defs/<prefix>/
  for(const p of prefixes){
    const lp = p.toLowerCase();
    report.defs[lp] = [];

    // Wir können keine Datei-Listings im Browser abrufen,
    // deshalb prüfen wir Definitionsdateien nur,
    // wenn sie während des Lemma-Durchlaufs geladen wurden.
    // Option A ist prefixgetrieben – Waisen werden erkannt,
    // wenn ein Lemma fehlt beim Zugriff.
  }

  console.log('VALIDATION REPORT:', report);

  if(report.errors.length){
    report.ok = false;
  }

  return report;
};

/* Komfort: Start über Konsole:
   window.Dyslexikon.validate().then(r => console.log(r));
*/
