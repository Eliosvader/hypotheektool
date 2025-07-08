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

function berekenEersteJaarRente(lening, rentevoet, looptijd = 30) {
  const rentevoetPerMaand = Math.pow(rentevoet + 1, 1 / 12) - 1;
  const mensualiteit = berekenMensualiteit(lening, rentevoet, looptijd);
  let schuld = lening;
  let totaleRente = 0;
  for (let maand = 0; maand < 12; maand++) {
    const maandRente = schuld * rentevoetPerMaand;
    totaleRente += maandRente;
    const aflossing = mensualiteit - maandRente;
    schuld -= aflossing;
  }
  return totaleRente;
}

function berekenMensualiteit(lening, rentevoet, looptijd = 30) {
  const looptijdMaanden = looptijd * 12;
  const rentevoetPerMaand = Math.pow(rentevoet + 1, 1 / 12) - 1;
  return rentevoetPerMaand / (1 - Math.pow(rentevoetPerMaand + 1, -looptijdMaanden)) * lening;
}

function berekenAlgemeneKorting(inkomen) {
  if (inkomen <= 25000) return 3068;
  if (inkomen < 75000) return 3068 - ((inkomen - 25000) * 0.0663);
  return 0;
}

function berekenArbeidsKorting(inkomen) {
  if (inkomen <= 12169) return inkomen * 0.08053;
  if (inkomen <= 26288) return 980 + (inkomen - 12169) * 0.30030;
  if (inkomen <= 43071) return 5220 + (inkomen - 26288) * 0.02258;
  if (inkomen <= 129078) return 5599 - (inkomen - 43071) * 0.06510;
  return 0;
}

function berekenInkomstenbelasting(belastbaar) {
  const drempel1 = 38441, drempel2 = 76817;
  const tarief1 = 0.3582, tarief2 = 0.3748, tarief3 = 0.495;
  if (belastbaar <= drempel1) return belastbaar * tarief1;
  if (belastbaar <= drempel2) return drempel1 * tarief1 + (belastbaar - drempel1) * tarief2;
  return drempel1 * tarief1 + (drempel2 - drempel1) * tarief2 + (belastbaar - drempel2) * tarief3;
}

function berekenZvw(inkomen) {
  return Math.min(inkomen, 71628) * 0.0575;
}

function schatBelastingdruk(inkomen) {
  const zelfstandigenaftrek = 2470;
  const mkbVrijstelling = 0.127;
  const belastbaar = Math.max(0, inkomen - zelfstandigenaftrek);
  const belastbaarNaMkb = belastbaar * (1 - mkbVrijstelling);
  const inkomstenbelasting = berekenInkomstenbelasting(belastbaarNaMkb);
  const kortingen = berekenAlgemeneKorting(inkomen) + berekenArbeidsKorting(inkomen);
  const zvw = berekenZvw(belastbaarNaMkb);
  return Math.max(0, inkomstenbelasting - kortingen + zvw);
}

function updateTables() {
  const get = (name) => +form[name].value || 0;
  const hypotheek = get("hypotheek");
  const wozhypotheek = get("wozhypotheek");
  const renteHypotheek = get("renteHypotheek") / 100;
  const familiebank1 = get("familiebank1");
  const familiebank2 = get("familiebank2");
  const renteFB = get("renteFamiliebank") / 100;
  const schenkingJaar = get("schenkingJaar");
  const schenkingMaand = schenkingJaar / 12;
  const inkomenCas = get("inkomenCas");
  const inkomenJolijn = get("inkomenJolijn");
  const kostenKoper = get("kostenKoper");
  const studieschuld = get("studieschuld");
  const overbieding = get("overbieding") / 100;
  const eigenGeld = get("eigenGeld");
  const label = form.energielabel.value;

  const labelBonus = { "G": 0, "F": 0, "E": 0, "D": 5000, "C": 5000, "B": 10000, "A": 10000, "A+": 20000, "A++": 20000, "A+++": 30000, "A++++": 40000 };
  const extraLening = labelBonus[label] || 0;
  const hypotheekPlusExtraLening = hypotheek + extraLening;

  const totaalFinanciering = hypotheekPlusExtraLening + familiebank1 + familiebank2 + eigenGeld;
  const vasteKosten = kostenKoper + studieschuld;
  const nettoFinanciering = totaalFinanciering - vasteKosten;
  const maxBodInclusiefKosten = nettoFinanciering * (1 - overbieding);

  const mensualiteitHypotheek = berekenMensualiteit(hypotheekPlusExtraLening, renteHypotheek);
  const mensualiteitFamiliebank1 = berekenMensualiteit(familiebank1, renteFB);
  const mensualiteitFamiliebank2 = berekenMensualiteit(familiebank2, renteFB);

  const totaleRenteHypotheek = berekenEersteJaarRente(hypotheekPlusExtraLening, renteHypotheek);
  const totaleRenteFB = berekenEersteJaarRente(familiebank1, renteFB) + berekenEersteJaarRente(familiebank2, renteFB);
  const totaleRenteJaar = totaleRenteHypotheek + totaleRenteFB;

  const eigenWoningForfait = 0.0035 * wozhypotheek;
  const aftrekPost = Math.max(0, totaleRenteJaar - eigenWoningForfait);

  const totaalInkomen = inkomenCas + inkomenJolijn;
  const aandeelCas = inkomenCas / totaalInkomen;
  const aandeelJolijn = 1 - aandeelCas;

  const aftrekCas = aftrekPost * aandeelCas;
  const aftrekJolijn = aftrekPost * aandeelJolijn;

  const voordeelCas = inkomenCas > aftrekCas
    ? schatBelastingdruk(inkomenCas) - schatBelastingdruk(inkomenCas - aftrekCas)
    : 0;

  const voordeelJolijn = schatBelastingdruk(inkomenJolijn) > 0
    ? schatBelastingdruk(inkomenJolijn) - schatBelastingdruk(inkomenJolijn - aftrekJolijn)
    : 0;

  const belastingVoordeel = voordeelCas + voordeelJolijn;
  const renteAftrek = Math.min(totaleRenteJaar / 12, belastingVoordeel / 12);

  const nettoTotaal = mensualiteitHypotheek + mensualiteitFamiliebank1 + mensualiteitFamiliebank2 - renteAftrek - schenkingMaand;

  constructieTabel.innerHTML = `
  <tr class="border-2 border-black font-bold uppercase">
    <td colspan="2" class="p-2 border-2 border-black">Financieringsbronnen</td>
  </tr>
  <tr><td class="border-2 border-black p-2">Hypotheek plus extra lening energielabel (€${extraLening})</td><td class="border-2 border-black p-2">€${(hypotheekPlusExtraLening).toLocaleString()}</td></tr>
  <tr><td class="border-2 border-black p-2">Familiebank 1</td><td class="border-2 border-black p-2">€${familiebank1.toLocaleString()}</td></tr>
  <tr><td class="border-2 border-black p-2">Familiebank 2</td><td class="border-2 border-black p-2">€${familiebank2.toLocaleString()}</td></tr>
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
  </tr>`;

  maandlastTabel.innerHTML = `
  <tr><td class="border-2 border-black p-2">Hypotheek (bruto)</td><td class="border-2 border-black p-2">€${mensualiteitHypotheek.toFixed(0)}</td></tr>
  <tr><td class="border-2 border-black p-2">Familiebank 1 (bruto)</td><td class="border-2 border-black p-2">€${mensualiteitFamiliebank1.toFixed(0)}</td></tr>
  <tr><td class="border-2 border-black p-2">Familiebank 2 (bruto)</td><td class="border-2 border-black p-2">€${mensualiteitFamiliebank2.toFixed(0)}</td></tr>
  <tr><td class="border-2 border-black p-2">Renteaftrek totaal</td><td class="border-2 border-black p-2">–€${renteAftrek.toFixed(0)}</td></tr>
  <tr><td class="border-2 border-black p-2">Schenking ouders</td><td class="border-2 border-black p-2">–€${schenkingMaand.toFixed(0)}</td></tr>
  <tr class="bg-black text-yellow-300 font-bold">
    <td class="border-2 border-black p-2">Totaal maandlast</td>
    <td class="border-2 border-black p-2">€${nettoTotaal.toFixed(0)}</td>
  </tr>`;
}

updateTables();
