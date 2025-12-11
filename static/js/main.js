const API_BASE = ''; // same origin

let GAME_STATE = {
  playerName: '',
  credits: 1000,
  energy: 1000,
  shards: {},
  countShards: 0,
  currentLocation: 'EFHK',
  fluxfire: 0,
  paradox: { active: false, coins: 0, startTime: 0 },
  badges_active: {},
  badges_used_session: {},
  lucky_until: 0,
  void_until: 0,
  jetstream_remaining: 0,
  fuel_to_make: '',
  required_flux: 0
};

const sidebar = document.getElementById('sidebar');
const airportInfo = document.getElementById('airport-info');
const btnTravel = document.getElementById('btnTravel');
const statusName = document.getElementById('player-name');
const statusCredits = document.getElementById('credits');
const statusRange = document.getElementById('range');
const statusShards = document.getElementById('shards');
const statusFluxfire = document.getElementById('fluxfire');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const btnHowTo = document.getElementById('btnHowTo');
const btnBuyRange = document.getElementById('btnBuyRange');
const btnBuyCredits = document.getElementById('btnBuyCredits');
const btnBadges = document.getElementById('btnBadges');
const btnReload = document.getElementById('btnReload'); // reload/reset

let AIRPORTS = [];
let markers = {};
let visitedAirports = {};

// ================= Modal helpers =================
// showModal: Render provided HTML inside a centered modal and reveal it.
// hideModal: Hide the modal UI.
function showModal(html){
  modalBody.innerHTML = `<div style="padding:15px; max-width:400px;">${html}</div>`;
  modal.classList.remove('hidden');
}
function hideModal(){ modal.classList.add('hidden'); }
modalClose?.addEventListener('click', hideModal);

// ================= Status =================
// Update the HUD elements reflecting the current GAME_STATE.
function renderStatus(){
  statusName.textContent = `Name: ${GAME_STATE.playerName}`;
  statusCredits.textContent = `Credits: ${GAME_STATE.credits}`;
  statusRange.textContent = `Range: ${GAME_STATE.energy}`;
  statusShards.textContent = `Shards: ${GAME_STATE.countShards}/5`;
  statusFluxfire.textContent = `Fluxfire: ${GAME_STATE.fluxfire}`;
}

// ================= Load Airports =================
// Fetch airport list (including computed distances) from the server API.
// If unauthorized, redirect to login. On failure, fall back to empty array.
async function loadAirports(){
  try{
    const res = await fetch('/api/main/airports');
    if(res.status === 401){ window.location = '/start'; return; }
    AIRPORTS = await res.json();
  } catch(e){
    AIRPORTS = [];
  }
}

// ================= Leaflet Map =================
// Initialize the Leaflet map and place markers for each airport.
// Use a distinct icon for the starting airport (EFHK).
let map;
function initMap(){
  map = L.map('map-wrapper').setView([60,20],3);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'&copy; OpenStreetMap contributors'
  }).addTo(map);

  AIRPORTS.forEach(a => {
    const lat = a.lat || (Math.random() * 40 + 50);
    const lon = a.lon || (Math.random() * 40);

    let iconUrl = (a.ICAO === 'EFHK')
      ? '../static/img/starting-airport.png' // EFHK always starting-airport
      : '../static/img/black-dot.png';

    const icon = L.icon({ iconUrl, iconSize: [32,32], iconAnchor: [16,16] });
    const marker = L.marker([lat, lon], { icon }).addTo(map);
    marker.on('click', () => openSidebar(a));
    markers[a.ICAO] = marker;
  });
}

// helper: visually mark the player's current location on the map (skip EFHK).
function markCurrentLocation(icao){
  if(!icao || icao === 'EFHK') return;

  if(markers[icao]){
    markers[icao].setIcon(L.icon({
      iconUrl:'../static/img/country-pin.png',
      iconSize:[32,32],
      iconAnchor:[16,16]
    }));
    visitedAirports[icao] = true;
  }
}

// ================= Sidebar =================
// Populate the sidebar with airport details and show the travel button
// when the airport is not the player's current location.
function openSidebar(a){
  const distance = a.distance ?? a.distanceFromEFHK ?? 'N/A';
  airportInfo.innerHTML = `
    <p><strong>${a.ICAO} — ${a.name}</strong></p>
    <p><strong>Country:</strong> ${a.country}</p>
    <p><strong>Distance:</strong> ${distance} km</p>
  `;
  if(GAME_STATE.currentLocation===a.ICAO) btnTravel.style.display='none';
  else btnTravel.style.display='inline-block', btnTravel.onclick=()=>handleTravel(a);
  sidebar.classList.add('visible');
}

// Close the sidebar when clicking outside it or a marker.
document.addEventListener('click', e=>{
  if(!sidebar.contains(e.target) && !e.target.classList.contains('leaflet-marker-icon')){
    sidebar.classList.remove('visible');
  }
});

// ================= Travel =================
// Send a travel request to the server, update local state from response,
// animate marker icon changes, and present event outcomes in a modal.
async function handleTravel(a){
  const oldLocation = GAME_STATE.currentLocation;

  const res = await fetch('/api/main/travel',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ICAO:a.ICAO})
  });

  if(res.status === 401){ window.location = '/start'; return; }

  const data = await res.json();

  if(data.state) GAME_STATE = data.state;

  renderStatus();

  // revert old location marker (except EFHK)
  if(oldLocation && oldLocation !== 'EFHK' && markers[oldLocation]){
    markers[oldLocation].setIcon(L.icon({
      iconUrl:'../static/img/black-dot.png',
      iconSize:[32,32],
      iconAnchor:[16,16]
    }));
  }

  // mark new location (except EFHK) with a highlighted pin
  if(a.ICAO !== 'EFHK' && markers[a.ICAO]){
    markers[a.ICAO].setIcon(L.icon({
      iconUrl:'../static/img/country-pin.png',
      iconSize:[32,32],
      iconAnchor:[16,16]
    }));
    visitedAirports[a.ICAO] = true;
  }

  // handle events modal
  if (data.events && data.events.length > 0) {
    let html = '';
    const onlyNothing = data.events.length === 1 && data.events[0].type === 'nothing';

    if (onlyNothing) html += `<p>😐 Nothing happened at this airport.</p>`;
    else data.events.forEach(ev => {
      if (ev.type==='nothing') return;
      if (ev.type==='shard') html+=`<p>✨ You found ChronoShard ${ev.shard}!</p><img src="../static/img/chronoshard${ev.shard}.png" style="max-width:80px;">`;
      if (ev.type==='fluxfire') html+=`<p>🔥 You found Fluxfire!</p><img src="../static/img/fluxfire.png" style="max-width:80px;">`;
      if (ev.type==='bandit') html+=`<p>💀 Bandits stole ${ev.amount} ${ev.subtype==='credits'?'credits':'range'}.</p>`;
      if (ev.type==='credits') html+=`<p>💰 Gained ${ev.amount} credits.</p>`;
      if (ev.type==='range') html+=`<p>🔋 Gained ${ev.amount} range.</p>`;
      if (ev.type==='insufficient_range') html+=`<p>⚠️ ${ev.message}</p>`;
      if (ev.type==='paradox') html+=`<p>⏳ Paradox Trap! Collect 3 coins to escape.</p>`;
      if (ev.type==='paradox_coin') html+=`<p>Collected paradox coin ${ev.coins}/3</p>`;
      if (ev.type==='paradox_escaped') html+=`<p>✅ Escaped Paradox Trap!</p>`;
      if (ev.type==='lose') html+=`<p>💀 You lost. Redirecting...</p>`;
      if (ev.type==='win') html+=`<p>🏆 You won! Fuel: ${ev.fuel}, Required Fluxfire: ${ev.required_flux}</p>`;
      if (ev.type==='efhk_requirements_not_met') html+=`<p>❌ Can't land on EFHK yet. Need 5 shards & ${ev.required_flux} fluxfire</p>`;
    });

    showModal(html);
  }

  // If trapped in a paradox, start a watchdog to auto-fail after 2 minutes.
  // This gives the player time to collect paradox coins; if they remain trapped,
  // notify and redirect to the end screen.
  if(GAME_STATE.paradox.active){
    if(!GAME_STATE.paradox.startTime) GAME_STATE.paradox.startTime = Date.now();
    setTimeout(()=>{
      const elapsed = Date.now() - GAME_STATE.paradox.startTime;
      if(GAME_STATE.paradox.active && elapsed >= 2*60*1000){
        GAME_STATE.paradox.active = false;
        showModal(`<p>⏳ You were stuck in the Paradox Trap too long and lost!</p>`);
        setTimeout(()=>window.location='/end',1500);
      }
    },1000);
  }

  if(data.win || data.lose) setTimeout(()=>window.location='/end',1500);
}

// ================= Buy Range =================
// Show UI for purchasing energy using credits and call the buy API.
// Validate input and update state on success.
btnBuyRange?.addEventListener('click',()=>{
  const html = `
    <h3>Buy Range</h3>
    <p>1 Credit = 1 Range</p>
    <input type="number" id="rangeCredits" placeholder="Credits to spend" min="1">
    <div style="margin-top:10px;">
      <button id="buyRangeCancel">Cancel</button>
      <button id="buyRangeConfirm">Buy</button>
    </div>
  `;
  showModal(html);
  document.getElementById('buyRangeCancel').addEventListener('click',hideModal);
  document.getElementById('buyRangeConfirm').addEventListener('click', async ()=>{
    const val = parseInt(document.getElementById('rangeCredits').value);
    if(isNaN(val) || val <= 0){ alert('Enter valid'); return; }
    const res = await fetch('/api/buy/range', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({credits: val})});
    const data = await res.json();
    if(data.ok){ GAME_STATE = data.state; renderStatus(); hideModal(); } else alert(data.error);
  });
});

// ================= Buy Credits =================
// Modal for converting Fluxfire into Credits via the server endpoint.
// Validate, send request, and update UI on success.
btnBuyCredits?.addEventListener('click', async ()=>{
  const html = `
    <h3>Buy Credits</h3>
    <p>Spend Fluxfire for Credits (1 Fluxfire = 10 Credits)</p>
    <input type="number" id="buyCreditsInput" placeholder="Fluxfire to spend" min="1">
    <div style="margin-top:10px;">
      <button id="buyCreditsCancel">Cancel</button>
      <button id="buyCreditsConfirm">Buy</button>
    </div>
  `;
  showModal(html);
  document.getElementById('buyCreditsCancel').addEventListener('click',hideModal);
  document.getElementById('buyCreditsConfirm').addEventListener('click', async ()=>{
    const val = parseInt(document.getElementById('buyCreditsInput').value);
    if(isNaN(val)||val<=0){alert('Enter valid'); return;}
    const res = await fetch('/api/buy/credits',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({fluxfire: val})});
    const data = await res.json();
    if(data.ok){ GAME_STATE = data.state; renderStatus(); hideModal(); } else alert(data.error);
  });
});

// ================= Badges =================
// Fetch and display player's badges from the server.
btnBadges?.addEventListener('click', async ()=>{
  const res = await fetch('/api/user/badges');
  if(res.status === 401){ window.location = '/start'; return; }
  const data = await res.json();
  let html = '<h3>Badges</h3><ul>';
  data.playerBadges.forEach(b=>html+=`<li>${b}</li>`);
  html+='</ul>';
  showModal(html);
});

// ================= How to Play =================
// Show a brief instructions modal describing core objectives and mechanics.
btnHowTo?.addEventListener('click',()=>{
  showModal(`
    <h3>How to Play</h3>
    <ul>
      <li>Travel between airports to collect 5 ChronoShards.</li>
      <li>Collect Fluxfire to create fuel for EFHK.</li>
      <li>Each flight costs random range 20-200.</li>
      <li>Random events: ChronoShard, Fluxfire, Bandits, Credits, Range, Paradox trap, Nothing.</li>
      <li>Paradox trap: collect 3 coins to escape.</li>
      <li>Buy Range (1 Credit = 1 Range) and Buy Credits (Fluxfire -> Credits).</li>
      <li>Reach EFHK with 5 shards and enough fluxfire to win.</li>
    </ul>
  `);
});
// ================= Quit =================
// Trigger server-side quit flag then navigate to the quit confirmation page.
const btnQuit = document.getElementById('btnQuit');
btnQuit?.addEventListener('click', async ()=>{
  await fetch('/quit', { method: 'POST' });
  window.location = '/quit';
});

// ================= Reload =================
// Reset client-side GAME_STATE (preserving badges) and send the player to the start page.
btnReload?.addEventListener('click', ()=>{
  // Reset everything except badges
  GAME_STATE = {
    ...GAME_STATE,
    credits:1000,
    energy:1000,
    shards:{},
    countShards:0,
    currentLocation:'EFHK',
    fluxfire:0,
    paradox:{active:false,coins:0,startTime:0},
    lucky_until:0,
    void_until:0,
    jetstream_remaining:0,
    fuel_to_make:'',
    required_flux:0
  };
  window.location = '/start';
});

// ================= Server state fetch =================
// Load the authoritative game state from the server session when the main UI starts.
// If unauthorized, redirect to login.
async function fetchServerState(){
  try{
    const res = await fetch('/api/main/state');
    if(res.status === 401){ window.location = '/start'; return; }
    if(res.ok){
      const data = await res.json();
      if(data.state) GAME_STATE = data.state;
    }
  } catch(err){ console.error('Error fetching server state', err); }
}

// ================= Initialize =================
// Boot sequence: load airports, initialize map, fetch server state, render HUD,
// mark the current location, and show fuel requirement notice if present.
(async()=>{
  await loadAirports();
  initMap();
  await fetchServerState();
  renderStatus();
  markCurrentLocation(GAME_STATE.currentLocation);

  if(GAME_STATE.fuel_to_make && GAME_STATE.required_flux){
    showModal(`<p>🚀 You need to collect <strong>${GAME_STATE.required_flux}</strong> Fluxfire to make <strong>${GAME_STATE.fuel_to_make}</strong> fuel!</p><p>And Collect 5 ChronoShards</p>`);
  }
})();