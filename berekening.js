const form = document.getElementById("hypotheekForm");
const constructieTabel = document.getElementById("constructieTabel");
const maandlastTabel = document.getElementById("maandlastTabel");

form.oninput = updateTables;

function berekenAnnuiteit(lening, renteJaar, looptijdJaar = 30) {
  const n = looptijdJaar * 12;
  const r = renteJaar / 12;
  return lening * (r / (1 - Math.pow(1 + r, -n)));
}

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
  const schenkingJaar = +form.schenkingJaar.value || 0;
const schenkingMaand = schenkingJaar / 12;
  const inkomenCas = +form.inkomenCas.value || 0;
  const inkomenJolijn = +form.inkomenJolijn.value || 0;
  const kostenKoper = +form.kostenKoper.value || 0;
  const studieschuld = +form.studieschuld.value || 0;
  const overbieding = (+form.overbieding.value || 0) / 100;
  const eigenGeld = +form.eigenGeld.value || 0;

  const familiebankTotaal = fb1 + fb2;
  const totaalFinanciering = hypotheek + familiebankTotaal + eigenGeld;
  const vasteKosten = kostenKoper + studieschuld;
  const nettoFinanciering = totaalFinanciering - vasteKosten;
  const maxBodInclusiefKosten = nettoFinanciering * (1 - overbieding);

  // Maandlasten bruto
  const brutoHypotheek = berekenAnnuiteit(hypotheek, renteHypotheek);
const brutoFamiliebank = berekenAnnuiteit(familiebankTotaal, renteFB);
  // Maandelijks rentebedrag
  const renteHypMaand = hypotheek * renteHypotheek / 12;
  const renteFBMaand = familiebankTotaal * renteFB / 12;
  const totaleRente = renteHypMaand + renteFBMaand;

  // Belastingvoordeel (aftrekcapaciteit)
  const maxAftrek = (schatBelastingdruk(inkomenCas) + schatBelastingdruk(inkomenJolijn)) / 12 * 0.37;
  const renteAftrek = Math.min(totaleRente, maxAftrek);

  // Netto maandlasten
  const nettoHypotheek = brutoHypotheek - renteHypMaand * (renteAftrek / totaleRente);
  const nettoFamiliebank = brutoFamiliebank - renteFBMaand * (renteAftrek / totaleRente) - schenkingMaand;
  // Rentecomponent per maand (eerste maand, annuïtair)
const renteHypMaand = hypotheek * renteHypotheek / 12;
const renteFBMaand = familiebankTotaal * renteFB / 12;

// Totale rente eerste maand
const totaleRente = renteHypMaand + renteFBMaand;

// Belastingvoordeel
const maxAftrek = (schatBelastingdruk(inkomenCas) + schatBelastingdruk(inkomenJolijn)) / 12 * 0.37;
const renteAftrek = Math.min(totaleRente, maxAftrek);

// Netto maandlasten
const nettoTotaal = brutoHypotheek + brutoFamiliebank - renteAftrek - schenkingMaand;
  const brutoTotaal = brutoHypotheek + brutoFamiliebank;

  // === Constructie ===
  constructieTabel.innerHTML = `
  <tr class="font-semibold bg-gray-100">
    <td colspan="2">Financieringsbronnen</td>
  </tr>
  <tr><td>Hypotheek</td><td>€${hypotheek.toLocaleString()}</td></tr>
  <tr><td>Familiebank 1</td><td>€${fb1.toLocaleString()}</td></tr>
  <tr><td>Familiebank 2</td><td>€${fb2.toLocaleString()}</td></tr>
  <tr><td>Eigen geld</td><td>€${eigenGeld.toLocaleString()}</td></tr>
  <tr class="font-semibold">
    <td>Totaal financiering</td><td>€${totaalFinanciering.toLocaleString()}</td>
  </tr>

  <tr class="font-semibold bg-gray-100">
    <td colspan="2">Vaste kosten</td>
  </tr>
  <tr><td>Kosten koper</td><td>€${kostenKoper.toLocaleString()}</td></tr>
  <tr><td>Studieschuld</td><td>€${studieschuld.toLocaleString()}</td></tr>
  <tr class="font-semibold">
    <td>Totaal vaste kosten</td><td>€${vasteKosten.toLocaleString()}</td>
  </tr>

  <tr class="font-semibold bg-gray-100">
    <td colspan="2">Rekenruimte voor woning</td>
  </tr>
  <tr><td>Beschikbaar voor woning (na kosten)</td><td>€${Math.round(nettoFinanciering)}</td></tr>
  <tr>
    <td><strong>Max bod (incl. ${Math.round(overbieding * 100)}% overbieding)</strong></td>
    <td><strong>€${Math.round(maxBodInclusiefKosten)}</strong></td>
  </tr>
`;

  // === Maandlasten ===
  maandlastTabel.innerHTML = `
  <tr><td>Hypotheek (bruto)</td><td>€${brutoHypotheek.toFixed(0)}</td></tr>
  <tr><td>Familiebank (bruto)</td><td>€${brutoFamiliebank.toFixed(0)}</td></tr>
  <tr><td>Renteaftrek totaal</td><td>–€${renteAftrek.toFixed(0)} / maand</td></tr>
  <tr><td>Schenking ouders</td><td>–€${schenkingMaand.toFixed(0)} / maand <br> (€${schenkingJaar.toFixed(0)} / jaar)</td></tr>
  <tr class="font-semibold bg-gray-100">
    <td>Totaal maandlast</td>
    <td>€${nettoTotaal.toFixed(0)}</td>
  </tr>
`;
}

updateTables();
