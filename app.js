let stato = "inizio";
let inventario = [];

function aggiornaGioco() {
  let testo = document.getElementById("story-text");
  let btnA = document.getElementById("btn-a");
  let btnB = document.getElementById("btn-b");
  let invSpan = document.getElementById("items");

  // Aggiorna la grafica dell'inventario
  invSpan.innerText = inventario.length > 0 ? inventario.join(", ") : "Vuoto";

  // Gestione delle schermate/stati della storia
  if (stato === "inizio") {
    testo.innerHTML = "Ti trovi davanti al cancello arrugginito di Villa Scura. Le luci sono spente, ma dalla torre filtra una luce tremolante. Il portone è socchiuso.";
    btnA.innerText = "A) Entri dal portone principale";
    btnB.innerText = "B) Fai il giro passando dal giardino";
    btnA.style.display = "block";
    btnB.style.display = "block";
  } 
  else if (stato === "atrio") {
    testo.innerHTML = "Sei entrato nell'atrio buio. C'è odore di muffa. Da qui puoi andare verso la cucina o salire le scale.";
    btnA.innerText = "A) Vai verso la cucina";
    btnB.innerText = "B) Sali le scale verso la torre";
  } 
  else if (stato === "giardino") {
    testo.innerHTML = "Nel giardino buio un grosso cane da guardia ti sbarra la strada abbaiando ferocemente!";
    btnA.innerText = "A) Prova a distrarlo con un pezzo di carne";
    btnB.innerText = "B) Scappa via tornando al cancello";
  } 
  else if (stato === "cucina") {
    if (!inventario.includes("Chiave")) {
      inventario.push("Chiave");
    }
    testo.innerHTML = "Sei in cucina. Sul tavolo trovi una <strong>chiave arrugginita</strong> e la metti in tasca!";
    btnA.innerText = "A) Torna all'atrio";
    btnB.style.display = "none";
  } 
  else if (stato === "scale") {
    testo.innerHTML = "Mentre sali le scale al buio, un gradino cede sotto i tuoi piedi. Cadi rovinosamente...<br><br><strong>(GAME OVER)</strong>";
    btnA.innerText = "Ricomincia l'avventura";
    btnB.style.display = "none";
  } 
  else if (stato === "torre") {
    if (inventario.includes("Chiave")) {
      testo.innerHTML = "Usi la chiave per aprire la porta della torre. All'interno trovi il diario perduto e risolvi il mistero!<br><br><strong>(VITTORIA FINALE)</strong>";
    } else {
      testo.innerHTML = "La porta della torre è chiusa a chiave a doppia mandata. Ti serve qualcosa per aprirla!";
    }
    btnA.innerText = "Ricomincia l'avventura";
    btnB.style.display = "none";
  }
}

function scelta(opzione) {
  if (stato === "inizio") {
    if (opzione === "A") stato = "atrio";
    else if (opzione === "B") stato = "giardino";
  } 
  else if (stato === "atrio") {
    if (opzione === "A") stato = "cucina";
    else if (opzione === "B") stato = "scale";
  } 
  else if (stato === "giardino") {
    if (opzione === "A") stato = "atrio"; // superi il cane e rientri
    else if (opzione === "B") stato = "inizio";
  } 
  else if (stato === "cucina") {
    if (opzione === "A") stato = "atrio";
  } 
  else if (stato === "scale" || stato === "torre") {
    if (opzione === "A") {
      inventario = [];
      stato = "inizio";
    }
  }
  aggiorna_gioco();
}

// Avvia il gioco all'apertura
aggiorna_gioco();
