// Respire — prototype app (français). Stocke tout en localStorage.
(function(){
  // Utils
  const q = sel => document.querySelector(sel);
  const formatCurrency = v => v.toLocaleString('fr-FR', {style:'currency', currency:'EUR'});
  const todayISO = () => new Date().toISOString().slice(0,10);

  // Elements
  const onboarding = q('#onboarding');
  const dashboard = q('#dashboard');
  const nameInput = q('#name');
  const quitInput = q('#quitDate');
  const cigsInput = q('#cigsPerDay');
  const packInput = q('#packPrice');
  const startBtn = q('#startBtn');
  const demoBtn = q('#demoBtn');

  const greeting = q('#greeting');
  const status = q('#status');
  const daysEl = q('#days');
  const moneyEl = q('#money');
  const cigsAvoidedEl = q('#cigsAvoided');
  const smokedToday = q('#smokedToday');
  const logBtn = q('#logSmoke');
  const logList = q('#logList');
  const crisisBtn = q('#crisisBtn');
  const crisisModal = q('#crisis');
  const crisisQuote = q('#crisisQuote');
  const breathCircle = q('#breathCircle');
  const breathText = q('#breathText');
  const stopCrisis = q('#stopCrisis');
  const resetBtn = q('#resetBtn');
  const shareBtn = q('#shareBtn');

  // State load/save
  const STORAGE_KEY = 'respire_data_v1';
  function load(){
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    try { return JSON.parse(raw); } catch(e){ return null; }
  }
  function save(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function daysBetween(d1, d2){
    const a=new Date(d1); const b=new Date(d2);
    return Math.floor((b-a)/(1000*60*60*24));
  }

  function updateUI(state){
    if(!state) { onboarding.classList.remove('hidden'); dashboard.classList.add('hidden'); return; }
    onboarding.classList.add('hidden'); dashboard.classList.remove('hidden');
    greeting.textContent = `Bonjour, ${state.name || ''}`;
    const now = todayISO();
    const started = state.quitDate || now;
    const days = Math.max(0, daysBetween(started, now));
    daysEl.textContent = days;
    status.textContent = `${days} jours sans fumer`;
    const cigsPerDay = Number(state.cigsPerDay || 0);
    const packPrice = Number(state.packPrice || 0);
    const cigsAvoided = days * cigsPerDay;
    cigsAvoidedEl.textContent = cigsAvoided;
    const cigarettesPerPack = 20;
    const pricePerCig = packPrice / cigarettesPerPack;
    const money = Math.round(cigsAvoided * pricePerCig * 100)/100;
    moneyEl.textContent = formatCurrency(money);
    // history
    logList.innerHTML = '';
    (state.log||[]).slice().reverse().forEach(entry=>{
      const li = document.createElement('li');
      li.textContent = `${entry.date} — ${entry.count} cigarette(s) fumée(s) — note: ${entry.note||'-'}`;
      logList.appendChild(li);
    });
    // set smokedToday input default to 0
    smokedToday.value = 0;
  }

  // Start
  startBtn.addEventListener('click', ()=>{
    const state = load() || {};
    state.name = nameInput.value.trim() || 'Ami';
    state.quitDate = quitInput.value || todayISO();
    state.cigsPerDay = Number(cigsInput.value) || 0;
    state.packPrice = Number(packInput.value) || 0;
    state.log = state.log || [];
    save(state);
    updateUI(state);
  });
  demoBtn.addEventListener('click', ()=>{
    // Demo data
    const demo = {
      name: 'Jean',
      quitDate: new Date(Date.now()-5*24*3600*1000).toISOString().slice(0,10),
      cigsPerDay: 15,
      packPrice: 11,
      log: [
        {date: todayISO(), count: 0, note: 'Journée sans fumée'},
      ]
    };
    save(demo);
    updateUI(demo);
  });

  // Logging smoked cigarettes
  logBtn.addEventListener('click', ()=>{
    const n = Number(smokedToday.value) || 0;
    const state = load();
    if(!state) return alert('Commence d\'abord (bouton Commencer).');
    const entry = {date: todayISO(), count: n, note: n>0? 'A eu une rechute':'Sans fumée'};
    state.log = state.log || [];
    state.log.push(entry);
    save(state);
    updateUI(state);
    if(n>0) alert('Courage — accepte la journée et reprends le chemin.');
  });

  // Crisis mode
  function openCrisis(){
    crisisModal.classList.remove('hidden');
    crisisQuote.textContent = chooseQuote();
    startBreathing();
  }
  function closeCrisis(){
    crisisModal.classList.add('hidden');
    stopBreathing();
  }
  crisisBtn.addEventListener('click', openCrisis);
  stopCrisis.addEventListener('click', closeCrisis);

  // breathing animation (3s inhale, 3s exhale)
  let breathInterval = null;
  function chooseQuote(){
    const q = [
      "Respire. Tu peux tenir 1 minute.",
      "Chaque respiration te rapproche de la liberté.",
      "Une crise passe. Tu es plus fort que ta cigarette.",
      "Pense à ton souffle, pas à la cigarette."
    ];
    return q[Math.floor(Math.random()*q.length)];
  }
  function startBreathing(){
    let step = 0;
    const phases = [
      {text:'Inspire...', scale:1.3},
      {text:'Retiens...', scale:1.0},
      {text:'Expire...', scale:0.6},
      {text:'Retiens...', scale:1.0},
    ];
    breathCircle.style.transform = `scale(${phases[0].scale})`;
    breathText.textContent = phases[0].text;
    step = 0;
    breathInterval = setInterval(()=>{
      step = (step+1)%phases.length;
      breathCircle.style.transform = `scale(${phases[step].scale})`;
      breathText.textContent = phases[step].text;
    }, 3000);
  }
  function stopBreathing(){ if(breathInterval) clearInterval(breathInterval); breathInterval=null; breathCircle.style.transform='scale(1)'; breathText.textContent=''; }

  // Reset
  resetBtn.addEventListener('click', ()=>{
    if(confirm('Supprimer toutes les données locales ?')){ localStorage.removeItem(STORAGE_KEY); updateUI(null); }
  });

  // Share progress (simple)
  shareBtn.addEventListener('click', ()=>{
    const state = load();
    if(!state) return alert('Commence d\'abord.');
    const days = Math.max(0, Math.floor((new Date() - new Date(state.quitDate))/(1000*60*60*24)));
    const txt = `Je suis ${days} jour(s) sans fumer grâce à Respire !`;
    if(navigator.share){ navigator.share({text: txt}).catch(()=>{}); } else { navigator.clipboard.writeText(txt).then(()=>alert('Texte copié pour partager : ' + txt)); }
  });

  // initial load
  updateUI(load());
})();