const BASE = 'appslXmtOEoDI6lwp';
const TABLES = {
  batches:  'tblGrw6fTgMyz3ZL5',
  brewLogs: 'tblF6c610KRtvFosJ',
  tasks:    'tblxyLhvY6wyWogqq',
  recipes:  'tblgq3JTJYrG1hlkj',
  mashSteps: 'Mash Steps',
  boilAdditions: 'Boil Additions',
  fermentationChecks: 'Fermentation Checks',
  recipeMashSteps: 'Recipe Mash Steps',
  recipeBoilAdditions: 'Recipe Boil Additions'
};

const RECIPE_TARGETS = {
  'Blonde du Château': { og: 1.059, fg: 1.010, mash: 65, boil: 60, preboil: 570 },
  'Ambrée/Marckloff':  { og: 1.060, fg: 1.012, mash: 67, boil: 60, preboil: 570 },
  'IPA Sorachi':       { og: 1.052, fg: 1.008, mash: 65, boil: 60, preboil: 570 },
  'Czech Pilsner':     { og: 1.050, fg: 1.012, mash: 63, boil: 60, preboil: 570 }
};

function sel(v){ return (v && typeof v==='object' && v.name) ? v.name : (v||''); }

function resolveBatchLabel(record) {
  if (!record) return 'Batch';
  const f = record.fields || {};
  return (
    f['Display Name'] ||
    (f['Declaration Number'] ? `Batch #${f['Declaration Number']}` : null) ||
    (f['Batch Number'] ? `Batch #${f['Batch Number']}` : null) ||
    f['Name'] ||
    f['Title'] ||
    record.id ||
    'Batch'
  );
}


let screenStack = ['screen-home'];
let isHistoryNavigation = false;
let homeScrollY = 0;
