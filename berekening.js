const form = document.getElementById("hypotheekForm");
const constructieTabel = document.getElementById("constructieTabel");
const maandlastTabel = document.getElementById("maandlastTabel");

form.oninput = updateTables;

document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("loginSuccess") === "true") {
    document.getElementById("login").style.display = "none";
    document.getElementById("content").classList.remove("hidden");
  }
});

function checkPassword() {
  const input = document.getElementById("passwordInput").value;
  const error = document.getElementById("errorMessage");

  if (input === "eliosam") {
    sessionStorage.setItem("loginSuccess", "true");
    document.getElementById("login").style.display = "none";
    document.getElementById("content").classList.remove("hidden");
  } else {
    error.classList.remove("hidden");
  }
}

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
  const labelBonus = {
    "G": 0,
    "F": 0,
    "E": 0,
    "D": 5000,
    "C": 5000,
    "B": 10000,
    "A": 10000,
    "A+": 20000,
    "A++": 20000,
    "A+++": 30000,
    "A++++": 40000,
  };

  const label = form.energielabel.value;
  const extraLening = labelBonus[label] || 0;
  const hypotheekPlusExtraLening = hypotheek + extraLening;

  const familiebankTotaal = fb1 + fb2;
  const totaalFinanciering = hypotheekPlusExtraLening + familiebankTotaal + eigenGeld;
  const vasteKosten = kostenKoper + studieschuld;
  const nettoFinanciering = totaalFinanciering - vasteKosten;
  const maxBodInclusiefKosten = nettoFinanciering * (1 - overbieding);

  // Maandlasten bruto
  const brutoHypotheek = berekenAnnuiteit(hypotheekPlusExtraLening, renteHypotheek);
  const brutoFamiliebank = berekenAnnuiteit(familiebankTotaal, renteFB);

  // Maandelijks rentebedrag
  const renteHypMaand = hypotheekPlusExtraLening * renteHypotheek / 12;
  const renteFBMaand = familiebankTotaal * renteFB / 12;
  const totaleRente = renteHypMaand + renteFBMaand;

  // Belastingvoordeel (aftrekcapaciteit)
  const maxAftrek = (schatBelastingdruk(inkomenCas) + schatBelastingdruk(inkomenJolijn)) / 12 * 0.37;
  const renteAftrek = Math.min(totaleRente, maxAftrek);

  // Netto maandlasten
  const nettoTotaal = brutoHypotheek + brutoFamiliebank - renteAftrek - schenkingMaand;


  // === Constructie ===
  constructieTabel.innerHTML = `
  <tr class="border-2 border-black font-bold uppercase">
    <td colspan="2" class="p-2 border-2 border-black">Financieringsbronnen</td>
  </tr>
  <tr><td class="border-2 border-black p-2">Hypotheek plus extra lening energielabel (€${extraLening})</td><td class="border-2 border-black p-2">€${(hypotheekPlusExtraLening).toLocaleString()}</td></tr>
  <tr><td class="border-2 border-black p-2">Familiebank 1</td><td class="border-2 border-black p-2">€${fb1.toLocaleString()}</td></tr>
  <tr><td class="border-2 border-black p-2">Familiebank 2</td><td class="border-2 border-black p-2">€${fb2.toLocaleString()}</td></tr>
  <tr><td class="border-2 border-black p-2">Eigen geld</td><td class="border-2 border-black p-2">€${eigenGeld.toLocaleString()}</td></tr>

  <tr class="bg-black text-yellow-300 font-bold">
    <td class="border-2 border-black p-2">Totaal financiering</td><td class="border-2 border-black p-2">€${totaalFinanciering.toLocaleString()}</td>
  </tr>

  <tr class="border-2 border-black font-bold uppercase">
    <td colspan="2" class="p-2 border-2 border-black">Vaste kosten</td>
  </tr>
  <tr><td class="border-2 border-black p-2">Kosten koper</td><td class="border-2 border-black p-2">€${kostenKoper.toLocaleString()}</td></tr>
  <tr><td class="border-2 border-black p-2">Studieschuld</td><td class="border-2 border-black p-2">€${studieschuld.toLocaleString()}</td></tr>
  <tr class="bg-black text-yellow-300 font-bold">
    <td class="border-2 border-black p-2">Totaal vaste kosten</td><td class="border-2 border-black p-2">€${vasteKosten.toLocaleString()}</td>
  </tr>

  <tr class="border-2 border-black font-bold uppercase">
    <td colspan="2" class="p-2 border-2 border-black">Rekenruimte voor woning</td>
  </tr>
  <tr><td class="border-2 border-black p-2">Maximale woningprijs (zonder overbieden)</td><td class="border-2 border-black p-2">€${Math.round(maxBodInclusiefKosten)}</td></tr>
  <tr class="bg-black text-yellow-300 font-bold">
    <td class="border-2 border-black p-2">Maximale prijs om te kunnen bieden (bij ${Math.round(overbieding * 100)}% overbieden)</td>
    <td class="border-2 border-black p-2">€${Math.round(nettoFinanciering)}</td>
  </tr>
`;

  maandlastTabel.innerHTML = `
  <tr><td class="border-2 border-black p-2">Hypotheek (bruto)</td><td class="border-2 border-black p-2">€${brutoHypotheek.toFixed(0)}</td></tr>
  <tr><td class="border-2 border-black p-2">Familiebank (bruto)</td><td class="border-2 border-black p-2">€${brutoFamiliebank.toFixed(0)}</td></tr>
  <tr><td class="border-2 border-black p-2">Renteaftrek totaal</td><td class="border-2 border-black p-2">–€${renteAftrek.toFixed(0)} / maand</td></tr>
  <tr><td class="border-2 border-black p-2">Schenking ouders</td><td class="border-2 border-black p-2">–€${schenkingMaand.toFixed(0)} / maand<br>(€${schenkingJaar.toFixed(0)} / jaar)</td></tr>
  <tr class="bg-black text-yellow-300 font-bold">
    <td class="border-2 border-black p-2">Totaal maandlast</td>
    <td class="border-2 border-black p-2">€${nettoTotaal.toFixed(0)}</td>
  </tr>
`;

}

updateTables();
