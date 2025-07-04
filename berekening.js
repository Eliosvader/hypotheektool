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

  // Maandlasten bruto
  const brutoHypotheek = hypotheek * 0.0054 * renteHypotheek / 0.038;
  const brutoFamiliebank = familiebankTotaal * 0.0054 * renteFB / 0.05;

  // Maandelijks rentebedrag
  const renteHypMaand = hypotheek * renteHypotheek / 12;
  const renteFBMaand = familiebankTotaal * renteFB / 12;
  const totaleRente = renteHypMaand + renteFBMaand;

  // Belastingvoordeel (aftrekcapaciteit)
  const maxAftrek = (schatBelastingdruk(inkomenCas) + schatBelastingdruk(inkomenJolijn)) / 12 * 0.37;
  const renteAftrek = Math.min(totaleRente, maxAftrek);

  // Schenking per maand en jaar
  const schenkingMaand = familiebankTotaal * renteFB * schenkingPct / 12;
  const schenkingJaar = schenkingMaand * 12;

  // Netto maandlasten
  const nettoHypotheek = brutoHypotheek - renteHypMaand * (renteAftrek / totaleRente);
  const nettoFamiliebank = brutoFamiliebank - renteFBMaand * (renteAftrek / totaleRente) - schenkingMaand;
  const nettoTotaal = nettoHypotheek + nettoFamiliebank;
  const brutoTotaal = brutoHypotheek + brutoFamiliebank;

  // === Constructie ===
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
    <tr><td>Beschikbaar voor woning</td><td>${Math.round(nettoFinanciering)}</td></tr>
    <tr><td><strong>Max bod (incl. ${Math.round(overbieding * 100)}% overbieding)</strong></td><td><strong>${Math.round(maxBodInclusiefKosten)}</strong></td></tr>
  `;

  // === Maandlasten ===
  maandlastTabel.innerHTML = `
  <tr><td>Hypotheek (bruto)</td><td>€${brutoHypotheek.toFixed(0)}</td></tr>
  <tr><td>Familiebank (bruto)</td><td>€${brutoFamiliebank.toFixed(0)}</td></tr>
  <tr><td>Renteaftrek totaal</td><td>–€${renteAftrek.toFixed(0)} / maand</td></tr>
  <tr><td>Schenking ouders</td><td>–€${schenkingMaand.toFixed(0)} / maand <br> (€${schenkingJaar.toFixed(0)} / jaar)</td></tr>
  <tr class="font-semibold bg-gray-100">
    <td>Totaal maandlast</td>
    <td>
      €${(brutoHypotheek + brutoFamiliebank - renteAftrek - schenkingMaand).toFixed(0)}
    </td>
  </tr>
`;
}

updateTables();
