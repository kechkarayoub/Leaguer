const fs = require('fs');
const path = require('path');

// Recursively merge missing keys from source into target without overwriting existing values
function mergeMissing(source, target) {
  let changed = false;
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (tgtVal === undefined) {
      target[key] = srcVal;
      changed = true;
    } else if (
      srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal) &&
      tgtVal && typeof tgtVal === 'object' && !Array.isArray(tgtVal)
    ) {
      if (mergeMissing(srcVal, tgtVal)) changed = true;
    } else if (typeof tgtVal === 'string' && tgtVal.trim() === '') {
      target[key] = srcVal; // fill empty strings
      changed = true;
    }
  }
  return changed;
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function syncLocales() {
  const localesDir = path.resolve(__dirname, '../src/i18n/locales');
  const enDir = path.join(localesDir, 'en');
  const frDir = path.join(localesDir, 'fr');
  const arDir = path.join(localesDir, 'ar');

  const files = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));

  let totalChanges = 0;
  for (const file of files) {
    const enFile = path.join(enDir, file);
    const frFile = path.join(frDir, file);
    const arFile = path.join(arDir, file);

    if (!fs.existsSync(frFile)) fs.writeFileSync(frFile, '{}', 'utf8');
    if (!fs.existsSync(arFile)) fs.writeFileSync(arFile, '{}', 'utf8');

    const enJson = loadJson(enFile);
    const frJson = loadJson(frFile);
    const arJson = loadJson(arFile);

    const frChanged = mergeMissing(enJson, frJson);
    const arChanged = mergeMissing(enJson, arJson);

    if (frChanged) {
      saveJson(frFile, frJson);
      console.log(`[i18n-sync] Updated FR ${file}`);
      totalChanges++;
    }
    if (arChanged) {
      saveJson(arFile, arJson);
      console.log(`[i18n-sync] Updated AR ${file}`);
      totalChanges++;
    }
  }

  if (totalChanges === 0) {
    console.log('[i18n-sync] All locale files are in sync with EN.');
  } else {
    console.log(`[i18n-sync] Completed with ${totalChanges} file(s) updated.`);
  }
}

syncLocales();
