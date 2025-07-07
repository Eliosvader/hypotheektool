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

function berekenAlgemeneKorting(inkomen) {
  if (inkomen <= 25000) {
    return 3068;
  } else if (inkomen < 75000) {
    return 3068 - ((inkomen - 25000) * 0.0663);
  } else {
    return 0;
  }
}

function berekenArbeidsKorting(inkomen) {
  if (inkomen <= 12169) {
    return inkomen * 0.08053;
  } else if (inkomen <= 26288) {
    return 980 + (inkomen - 12169) * 0.30030;
  } else if (inkomen <= 43071) {
    return 5220 + (inkomen - 26288) * 0.02258;
  } else if (inkomen <= 129078) {
    return 5599 - (inkomen - 43071) * 0.06510;
  } else {
    return 0;
  }
}



function berekenInkomstenbelasting(belastbaar) {
  const drempel1 = 38441;
  const drempel2 = 76817;
  const tarief1 = 0.3582;
  const tarief2 = 0.3748;
  const tarief3 = 0.495;

  if (belastbaar <= drempel1) {
    return belastbaar * tarief1;
  } else if (belastbaar <= drempel2) {
    return drempel1 * tarief1 + (belastbaar - drempel1) * tarief2;
  } else {
    return (
      drempel1 * tarief1 +
      (drempel2 - drempel1) * tarief2 +
      (belastbaar - drempel2) * tarief3
    );
  }
}


function berekenZvw(inkomen) {
  const zvwGrens = 71628;
  const zvwTarief = 0.0532;
  return Math.min(inkomen, zvwGrens) * zvwTarief;
}

function schatBelastingdruk(inkomen, cas) {
  const zelfstandigenaftrek = 2470;
  const mkbVrijstelling = 0.127;
  // Stap 1: belastbaar inkomen berekenen
  const belastbaar = Math.max(0, inkomen - zelfstandigenaftrek);
  const belastbaarNaMkb = belastbaar * (1 - mkbVrijstelling);

  // Stap 2: inkomstenbelasting schijf 1 (tot € 75.000: 36,97%)
  const inkomstenbelasting = berekenInkomstenbelasting(belastbaarNaMkb);

  // Stap 3: Algemene heffingskorting 2025
  const algemeneKorting = berekenAlgemeneKorting(inkomen);
  // Stap 4: Arbeidskorting 2025
  const arbeidskorting = berekenArbeidsKorting(inkomen);

  // Stap 5: Totaal aan korting toepassen op belasting
  const totaalKorting = Math.max(0, algemeneKorting) + Math.max(0, arbeidskorting);
  const zvw = berekenZvw(belastbaarNaMkb);
  return Math.max(0, inkomstenbelasting - totaalKorting + zvw);
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
  const maxAftrek = (schatBelastingdruk(inkomenCas, 'cas') + schatBelastingdruk(inkomenJolijn)) / 12 * 0.37;
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
