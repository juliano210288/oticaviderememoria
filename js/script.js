/* Desafio da Visão — script.js
   Coloque suas imagens em images/img1.png ... img12.png
   Se for GitHub Pages, ajuste BASE_IMAGE_PATH para:
   'https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPO/main/images/' */

const BASE_IMAGE_PATH = 'images/'; // ajuste se necessário
const WHATSAPP_NUMBER = '5512997633810'; // +55 12 99763-3810

const TOTAL_LEVELS = 10;
const IMAGE_POOL = 12; // img1..img12

// Level configuration = number of cards (pairs*2)
const LEVEL_CONFIG = [6,8,10,12,14,16,18,20,22,24];

let state = {
  level: 0,
  discount: 0,
  boardCards: [],
  firstCard: null,
  secondCard: null,
  lockBoard: false,
  matchesFound: 0,
  timerInterval: null,
  timeLeft: 0,
  timeMax: 0
};

// optional sounds (if not present, handled safely)
const sounds = {
  flip: createAudioSafe('sounds/flip.mp3'),
  match: createAudioSafe('sounds/match.mp3'),
  levelup: createAudioSafe('sounds/levelup.mp3'),
  win: createAudioSafe('sounds/win.mp3')
};
function createAudioSafe(src){ try{ return new Audio(src); } catch(e){ return null; } }

// DOM
const startBtn = document.getElementById('startBtn');
const menu = document.getElementById('menu');
const game = document.getElementById('game');
const boardEl = document.getElementById('board');
const levelDisplay = document.getElementById('levelDisplay');
const progressFill = document.getElementById('progressFill');
const restartLevelBtn = document.getElementById('restartLevel');
const quitBtn = document.getElementById('quitBtn');

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalDiscount = document.getElementById('modalDiscount');
const modalNext = document.getElementById('modalNext');
const whatsappBtn = document.getElementById('whatsappBtn');

const modalTime = document.getElementById('modalTime');
const retryBtn = document.getElementById('retryBtn');
const whatsappTimeBtn = document.getElementById('whatsappTimeBtn');

const finalModal = document.getElementById('finalModal');
const finalWhatsapp = document.getElementById('finalWhatsapp');
const finalPlayAgain = document.getElementById('finalPlayAgain');

const timerText = document.getElementById('timerText');
const timerBar = document.getElementById('timerBar');

// events
startBtn && startBtn.addEventListener('click', ()=> startLevel(1));
restartLevelBtn && restartLevelBtn.addEventListener('click', ()=> startLevel(state.level));
quitBtn && quitBtn.addEventListener('click', ()=> { resetGame(); });

modalNext && modalNext.addEventListener('click', ()=> {
  hideAllModals();
  startLevel(state.level + 1);
});
modal && whatsappBtn && whatsappBtn.addEventListener('click', ()=> hideAllModals());

retryBtn && retryBtn.addEventListener('click', ()=> {
  hideAllModals();
  startLevel(state.level);
});
whatsappTimeBtn && whatsappTimeBtn.addEventListener('click', ()=> hideAllModals());

finalPlayAgain && finalPlayAgain.addEventListener('click', ()=>{
  hideAllModals();
  resetGame();
});
finalModal && finalWhatsapp && finalWhatsapp.addEventListener('click', ()=> hideAllModals());

function resetGame(){
  state.level = 0;
  state.discount = 0;
  saveProgress();
  showMenu();
}

function saveProgress(){
  try{ localStorage.setItem('desafio_visao_progress', JSON.stringify({level: state.level, discount: state.discount})); }catch(e){}
}
function loadProgress(){
  try{
    const raw = localStorage.getItem('desafio_visao_progress');
    if(!raw) return;
    const p = JSON.parse(raw);
    if(p.level) state.level = p.level;
    if(p.discount) state.discount = p.discount;
  }catch(e){}
}

function showMenu(){
  menu.classList.remove('hidden');
  game.classList.add('hidden');
  hideAllModals();
  updateUI();
}

function startLevel(level){
  if(level < 1) level = 1;
  if(level > TOTAL_LEVELS) level = TOTAL_LEVELS;
  state.level = level;
  // discount is previous completed levels *10 (before finishing current)
  state.discount = (level - 1) * 10;
  state.firstCard = null; state.secondCard = null; state.lockBoard = false; state.matchesFound = 0;
  menu.classList.add('hidden'); game.classList.remove('hidden'); hideAllModals();
  buildBoardForLevel(level);
  startTimerForLevel(level);
  updateUI();
}

function buildBoardForLevel(level){
  const cardsCount = LEVEL_CONFIG[level - 1];
  const pairCount = cardsCount / 2;
  const selected = [];
  for(let i=0;i<pairCount;i++){
    const idx = (i % IMAGE_POOL) + 1;
    selected.push(idx);
  }
  let cards = [];
  selected.forEach(num=>{
    cards.push({id:`img${num}-a`, img:`${BASE_IMAGE_PATH}img${num}.png`, pairId:num});
    cards.push({id:`img${num}-b`, img:`${BASE_IMAGE_PATH}img${num}.png`, pairId:num});
  });
  cards = shuffle(cards);
  state.boardCards = cards;
  renderBoard(cards);
}

function renderBoard(cards){
  boardEl.innerHTML = '';
  const cols = calculateCols(cards.length);
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  cards.forEach(card=>{
    const cardEl = document.createElement('button');
    cardEl.className = 'card';
    cardEl.dataset.id = card.id;
    cardEl.dataset.pair = card.pairId;
    cardEl.innerHTML = `<div class="back"></div><img src="${card.img}" alt="card" draggable="false">`;
    cardEl.addEventListener('click', onCardClick);
    boardEl.appendChild(cardEl);
  });
  // small delay to allow images to load on mobile
  setTimeout(()=>{ /* nothing, just allow layout */ }, 50);
}

function onCardClick(e){
  const target = e.currentTarget;
  if(state.lockBoard) return;
  if(target.classList.contains('flipped')) return;
  flipCard(target);
  if(!state.firstCard){ state.firstCard = target; return; }
  state.secondCard = target; state.lockBoard = true;
  const firstPair = state.firstCard.dataset.pair;
  const secondPair = state.secondCard.dataset.pair;
  if(firstPair === secondPair){
    state.matchesFound += 1; playSound('match');
    state.firstCard.removeEventListener('click', onCardClick);
    state.secondCard.removeEventListener('click', onCardClick);
    resetTurn();
    const totalPairs = state.boardCards.length / 2;
    if(state.matchesFound >= totalPairs) onLevelComplete();
  } else {
    playSound('flip');
    setTimeout(()=>{ unflipCard(state.firstCard); unflipCard(state.secondCard); resetTurn(); }, 900);
  }
}

function flipCard(cardEl){ cardEl.classList.add('flipped'); try{ playSound('flip'); }catch(e){} }
function unflipCard(cardEl){ if(!cardEl) return; cardEl.classList.remove('flipped'); }
function resetTurn(){ state.firstCard = null; state.secondCard = null; state.lockBoard = false; }

function onLevelComplete(){
  stopTimer();
  // increase discount for finishing this level
  state.discount = state.level * 10;
  saveProgress();
  playSound('levelup');
  // show modal with two options
  if(state.level >= TOTAL_LEVELS){
    // final
    showFinalModal();
  } else {
    showLevelModal();
  }
  updateUI();
}

function showLevelModal(){
  modal.classList.remove('hidden');
  modalTitle.textContent = `Nível ${state.level} concluído!`;
  modalDiscount.textContent = `${state.discount}%`;
  modalMessage.textContent = `Você ganhou ${state.discount}% de desconto!`;
  // whatsapp message + link
  const msg = `Ganhei ${state.discount}% de desconto no Desafio da Visão!`;
  whatsappBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  // next button available
  modalNext.classList.remove('hidden');
}

function showFinalModal(){
  finalModal.classList.remove('hidden');
  const msg = `Ganhei ${state.discount}% de desconto no Desafio da Visão!`;
  finalWhatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function showTimeOverModal(){
  modalTime.classList.remove('hidden');
  const msg = `Ganhei ${state.discount}% de desconto no Desafio da Visão!`;
  whatsappTimeBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function hideAllModals(){
  modal.classList.add('hidden');
  modalTime.classList.add('hidden');
  finalModal.classList.add('hidden');
}

function updateUI(){
  const lvl = state.level || 0;
  const discount = state.discount || 0;
  levelDisplay.textContent = `Nível: ${lvl} / ${TOTAL_LEVELS} — Desconto: ${discount}%`;
  progressFill.style.width = `${(discount/100)*100}%`;
}

// Timer logic: uses formula time = 20 + (cards * 5)
function startTimerForLevel(level){
  stopTimer();
  const cards = LEVEL_CONFIG[level - 1] || 6;
  const secs = 20 + (cards * 5);
  state.timeMax = secs;
  state.timeLeft = secs;
  updateTimerDisplay();
  state.timerInterval = setInterval(()=>{
    state.timeLeft -= 1;
    if(state.timeLeft <= 0){
      state.timeLeft = 0;
      updateTimerDisplay();
      stopTimer();
      onTimeOver();
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function stopTimer(){
  if(state.timerInterval !== null){ clearInterval(state.timerInterval); state.timerInterval = null; }
}

function updateTimerDisplay(){
  const s = state.timeLeft;
  const mm = Math.floor(s/60);
  const ss = s % 60;
  timerText.textContent = `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  const pct = state.timeMax ? (state.timeLeft / state.timeMax) * 100 : 0;
  timerBar.style.width = `${pct}%`;
  // change color gradient by CSS already set
}

function onTimeOver(){
  // lock board interactions
  state.lockBoard = true;
  playSound('win'); // small cue (or remove)
  showTimeOverModal();
}

function calculateCols(count){
  // responsive heuristic: ensure nice grid on mobile/desktop
  if(count <= 6) return 3;
  if(count <= 8) return 4;
  if(count <= 10) return 5;
  if(count <= 12) return 6;
  if(count <= 16) return 6;
  return 6;
}

function shuffle(array){ for(let i = array.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }

function playSound(name){
  try{
    const s = sounds[name];
    if(s){ s.currentTime = 0; s.volume = 0.6; s.play().catch(()=>{}); }
  }catch(e){}
}

// init
loadProgress();
showMenu();
