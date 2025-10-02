// -------- CONFIG --------
let GAME_DURATION = 30;      // seconds
let SPAWN_INTERVAL = 900;    // ms between spawns
const BUG_LIFESPAN = 5000;   // ms before a bug auto-vanishes
const MOVE_INTERVAL = 700;   // ms between bug moves
const BUG_SIZE = 44;         // keep in sync with CSS --bug-size

// -------- STATE & DOM --------
let score = 0;
let timeLeft = GAME_DURATION;
let spawnTimer = null;
let countdownTimer = null;
const gameArea = document.getElementById('game');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');
const overlay = document.getElementById('overlay');
const finalScore = document.getElementById('finalScore');
const closeOverlay = document.getElementById('closeOverlay');

// Utility: random int 0..max
function rand(max){ 
  return Math.floor(Math.random() * (max + 1)); 
}

function getBounds(){
  const rect = gameArea.getBoundingClientRect();
  return { 
    maxX: Math.max(0, Math.floor(rect.width - BUG_SIZE)), 
    maxY: Math.max(0, Math.floor(rect.height - BUG_SIZE)) 
  };
}

function updateScore(){ 
  scoreEl.textContent = score; 
}

// Spawn one bug (emoji-based)
function spawnBug(){
  const { maxX, maxY } = getBounds();
  const bug = document.createElement('div');
  bug.className = 'bug wiggle';
  bug.setAttribute('role','button');
  bug.setAttribute('aria-label','bug to squash');
  bug.tabIndex = 0;
  bug.textContent = '🐞';

  // place at initial random pos
  bug.style.left = rand(maxX) + 'px';
  bug.style.top = rand(maxY) + 'px';

  // timers kept on element so we can cancel later
  let moveId = null;
  let vanishId = null;

  function clearTimers(){
    if(moveId) clearInterval(moveId);
    if(vanishId) clearTimeout(vanishId);
  }

  function squash(){
    if(!gameArea.contains(bug)) return;
    score++; updateScore();
    bug.style.transform = 'scale(0.7) rotate(-18deg)';
    clearTimers();
    setTimeout(()=> bug.remove(), 140);
  }

  bug.addEventListener('click', squash);
  bug.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' || e.key === ' '){ 
      e.preventDefault(); 
      squash(); 
    }
  });

  // move periodically
  moveId = setInterval(()=>{
    const x = rand(maxX);
    const y = rand(maxY);
    bug.style.left = x + 'px';
    bug.style.top = y + 'px';
  }, MOVE_INTERVAL);

  // vanish after lifespan
  vanishId = setTimeout(()=>{
    clearTimers();
    if(gameArea.contains(bug)) bug.remove();
  }, BUG_LIFESPAN);

  // keep reference for cleanup
  bug._moveId = moveId;
  bug._vanishId = vanishId;

  gameArea.appendChild(bug);
}  // 👈 closes spawnBug() properly

function startGame(){
  // reset state
  score = 0; updateScore();
  timeLeft = GAME_DURATION; timeEl.textContent = timeLeft;
  startBtn.disabled = true; startBtn.style.opacity = .7;
  restartBtn.style.display = 'none';
  overlay.setAttribute('aria-hidden','true');

  // spawn loop + first spawn
  spawnTimer = setInterval(spawnBug, SPAWN_INTERVAL);
  spawnBug();

  // countdown
  countdownTimer = setInterval(()=>{
    timeLeft--; timeEl.textContent = timeLeft;
    if(timeLeft <= 0) stopGame();
  }, 1000);
}

function stopGame(){
  clearInterval(spawnTimer); spawnTimer = null;
  clearInterval(countdownTimer); countdownTimer = null;

  // clean up bugs + timers
  document.querySelectorAll('.bug').forEach(b=>{
    if(b._moveId) clearInterval(b._moveId);
    if(b._vanishId) clearTimeout(b._vanishId);
    b.remove();
  });

  // show overlay
  finalScore.textContent = score;
  overlay.setAttribute('aria-hidden','false');
  startBtn.disabled = false; startBtn.style.opacity = 1;
  restartBtn.style.display = 'inline-block';
}

// UI hooks
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
closeOverlay.addEventListener('click', ()=> overlay.setAttribute('aria-hidden','true'));
overlay.addEventListener('click', (e)=>{ 
  if(e.target === overlay) overlay.setAttribute('aria-hidden','true'); 
});
