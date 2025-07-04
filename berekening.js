const form = document.getElementById("hypotheekForm");
const constructieTabel = document.getElementById("constructieTabel");
const maandlastTabel = document.getElementById("maandlastTabel");

form.oninput = updateTables;

function schatBelastingdruk(inkomen) {
  const zelfstandigenaftrek = 3750;
  const mkbVrijstelling = 0.1331;
  const algemeneKorting = 3000;
  const arbeidskorting = Math.max(0, Math.min(5000, inkomen * 0.15));
  const belastbaar = Math.max(0, inkomen - zelfstandigenaftrek);
  const belastbaarNaMkb = belastbaar * (1 - mkbVrijstelling);
  const belasting = belastbaarNaMkb * 0.3697;
  const korting = Math.min(algemeneKorting + arbeidskorting, belasting);
  return Math.max(0, belasting - korting);
}

function updateTables() {
  const hypotheek = +form.hypotheek.value || 0;
  const renteHypotheek = (+form.renteHypotheek.value || 0) / 100;
  const fb1 = +form.familiebank1.value || 0;
  const fb2 = +form.familiebank2.value || 0;
  const renteFB = (+form.renteFamiliebank.value || 0) / 100;
  const schenkingPct = (+form.schenkingProcent.value || 0) / 100;
  const inkomenCas = +form.inkomenCas.value || 0;
  const inkomenJolijn = +form.inkomenJolijn.value || 0;
  const kostenKoper = +form.kostenKoper.value || 0;
  const studieschuld = +form.studieschuld.value || 0;
  const overbieding = (+form.overbieding.value || 0) / 100;
  const eigenGeld = +form.eigenGeld.value || 0;

  const familiebankTotaal = fb1 + fb2;
  const totaalFinanciering = hypotheek + familiebankTotaal;
  const vasteKosten = kostenKoper + studieschuld + eigenGeld;
  const nettoFinanciering = totaalFinanciering - vasteKosten;
  const maxBodInclusiefKosten = nettoFinanciering * (1 - overbieding);

  const brutoHypotheek = hypotheek * 0.0054 * renteHypotheek / 0.038;
  const brutoFamiliebank = familiebankTotaal * 0.0054 * renteFB / 0.05;

  const renteHypMaand = hypotheek * renteHypotheek / 12;
  const renteFBMaand = familiebankTotaal * renteFB / 12;
  const aftrekCas = Math.min((renteHypMaand + renteFBMaand) / 2, schatBelastingdruk(inkomenCas) / 12) * 0.37;
  const aftrekJolijn = Math.min((renteHypMaand + renteFBMaand) / 2, schatBelastingdruk(inkomenJolijn) / 12) * 0.37;
  const totaleRenteAftrek = aftrekCas + aftrekJolijn;
  const schenkingMaand = familiebankTotaal * renteFB * schenkingPct / 12;

  const nettoHypotheek = brutoHypotheek - renteHypMaand * 0.37;
  const nettoFamiliebank = brutoFamiliebank - renteFBMaand * 0.37 - schenkingMaand;
  const nettoTotaal = nettoHypotheek + nettoFamiliebank;

  constructieTabel.innerHTML = `
    <tr><td>Hypotheek</td><td>${hypotheek.toLocaleString()}</td></tr>
    <tr><td>Familiebank 1</td><td>${fb1.toLocaleString()}</td></tr>
    <tr><td>Familiebank 2</td><td>${fb2.toLocaleString()}</td></tr>
    <tr><td>Totaal Familiebank</td><td>${familiebankTotaal.toLocaleString()}</td></tr>
    <tr><td>Subtotaal Financiering</td><td>${totaalFinanciering.toLocaleString()}</td></tr>
    <tr><td>Kosten koper</td><td>${kostenKoper.toLocaleString()}</td></tr>
    <tr><td>Studieschuld</td><td>${studieschuld.toLocaleString()}</td></tr>
    <tr><td>Eigen geld</td><td>${eigenGeld.toLocaleString()}</td></tr>
    <tr><td>Totaal vaste kosten</td><td>${vasteKosten.toLocaleString()}</td></tr>
    <tr><td>Beschikbaar voor woning (na kosten)</td><td>${Math.round(nettoFinanciering)}</td></tr>
    <tr><td><strong>Max bod (incl. ${Math.round(overbieding * 100)}% overbieding)</strong></td><td><strong>${Math.round(maxBodInclusiefKosten)}</strong></td></tr>
  `;

  maandlastTabel.innerHTML = `
    <tr><td>Hypotheek (netto)</td><td>€${nettoHypotheek.toFixed(0)}</td></tr>
    <tr><td>Familiebank (netto)</td><td>€${nettoFamiliebank.toFixed(0)}</td></tr>
    <tr><td>Renteaftrek (totaal)</td><td>–€${totaleRenteAftrek.toFixed(0)} p/m (Cas: €${aftrekCas.toFixed(0)}, Jolijn: €${aftrekJolijn.toFixed(0)})</td></tr>
    <tr><td><strong>Totaal netto maandlast</strong></td><td><strong>€${nettoTotaal.toFixed(0)}</strong></td></tr>
  `;
}

updateTables(); // run bij laden
