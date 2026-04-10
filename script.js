/*
  ===========================
  Hand Cricket – Game Logic
  ===========================

  PHASES:
    player_bat  — Player bats, computer bowls.
                  Player picks a number; computer picks randomly.
                  Same number = OUT. Different = player scores their number as runs.

    player_bowl — Player bowls, computer bats.
                  Player picks a number trying to MATCH computer's pick → computer OUT.
                  If no match, computer scores its own number as runs.

    game_over   — Match concluded. Modal shows result.
*/

const WICKETS_MAX = 3;

let state = {};
let sessionWins = 0;
let sessionLoss = 0;

/* ─── State ─────────────────────────────────────── */

function initState() {
  return {
    phase: 'player_bat',
    playerRuns: 0,
    compRuns: 0,
    playerWickets: 0,
    compWickets: 0,
    target: null,
    balls: 0,
    totalBalls: 0,
    done: false,
  };
}

/* ─── Helpers ────────────────────────────────────── */

function randNum() {
  return Math.floor(Math.random() * 6) + 1;
}

function resetHands() {
  ['playerHand', 'compHand'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = '–';
    el.className = 'hand-num';
  });
}

function setMsg(text, cls) {
  const box = document.getElementById('msgBox');
  box.textContent = text;
  box.className = 'message-box' + (cls ? ' ' + cls : '');
}

function enableButtons(on) {
  document.querySelectorAll('.num-btn').forEach(b => (b.disabled = !on));
}

function triggerPop(el) {
  el.classList.remove('pop');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('pop');
}

function updateSessionStats() {
  document.getElementById('statWins').textContent = sessionWins;
  document.getElementById('statLoss').textContent = sessionLoss;
}

/* ─── Modal ──────────────────────────────────────── */

function showModal(icon, title, msg, btnText) {
  document.getElementById('modalIcon').textContent = icon;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMsg').innerHTML = msg.replace(/\n/g, '<br>');
  document.getElementById('modalBtn').textContent = btnText;
  document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');

  // Switch to bowling phase
  state.phase = 'player_bowl';
  state.target = state.playerRuns + 1;
  state.balls = 0;
  state.compWickets = 0;

  resetHands();
  render();
  setMsg(`You bowl now! Computer needs ${state.target} to win. Pick a number to bowl! 🎳`, '');
  enableButtons(true);
}

/* ─── Core Game Logic ────────────────────────────── */

function play(n) {
  if (state.done) return;

  const comp = randNum();
  state.balls++;
  state.totalBalls++;

  const ph = document.getElementById('playerHand');
  const ch = document.getElementById('compHand');

  ph.textContent = n;
  ch.textContent = comp;
  ph.className = 'hand-num';
  ch.className = 'hand-num';

  // ── Batting Phase ──────────────────────────────
  if (state.phase === 'player_bat') {
    if (n === comp) {
      // OUT
      state.playerWickets++;
      ph.className = 'hand-num out';
      ch.className = 'hand-num out';

      if (state.playerWickets >= WICKETS_MAX) {
        // All out → show transition modal
        enableButtons(false);
        render();
        triggerPop(ph);
        triggerPop(ch);
        setTimeout(() => {
          showModal(
            '🏏',
            'Innings Over!',
            `Your batting is over! You scored <strong>${state.playerRuns}</strong> runs.\nNow you bowl. Computer needs <strong>${state.playerRuns + 1}</strong> to win.`,
            "OK, Let's Bowl!"
          );
        }, 600);
        return;
      } else {
        setMsg(`OUT! ${WICKETS_MAX - state.playerWickets} wicket(s) remaining.`, 'out-msg');
      }

    } else {
      // Runs scored
      state.playerRuns += n;
      ph.className = 'hand-num scored';
      setMsg(`+${n} runs! Your total: ${state.playerRuns} 🏏`, '');
    }

  // ── Bowling Phase ──────────────────────────────
  } else if (state.phase === 'player_bowl') {
    if (n === comp) {
      // Computer OUT
      state.compWickets++;
      ch.className = 'hand-num out';
      ph.className = 'hand-num scored'; // bowler celebration

      if (state.compWickets >= WICKETS_MAX) {
        endGame();
        return;
      } else {
        const needed = state.target - state.compRuns;
        setMsg(
          `Computer OUT! Needs ${needed} more. ${WICKETS_MAX - state.compWickets} wicket(s) left.`,
          'out-msg'
        );
      }

    } else {
      // Computer scores
      state.compRuns += comp;
      ch.className = 'hand-num scored';

      if (state.compRuns >= state.target) {
        endGame();
        return;
      }

      const needed = state.target - state.compRuns;
      setMsg(`Computer scored ${comp}. Needs ${needed} more to win.`, '');
    }
  }

  triggerPop(ph);
  triggerPop(ch);
  render();
}

/* ─── End Game ───────────────────────────────────── */

function endGame() {
  state.done = true;
  state.phase = 'game_over';
  enableButtons(false);
  render();

  const compWon = state.compRuns >= state.target;

  if (compWon) {
    sessionLoss++;
    showModal(
      '💻',
      'Computer Wins!',
      `Computer chased down ${state.target} and won!\nComputer: ${state.compRuns} | You: ${state.playerRuns}`,
      'Play Again'
    );
  } else {
    sessionWins++;
    showModal(
      '🏆',
      'You Win!',
      `You defended ${state.playerRuns}! Computer all out for ${state.compRuns}.\nGreat bowling! 🎳`,
      'Play Again'
    );
  }

  // Override closeModal for the Play Again button
  document.getElementById('modalBtn').onclick = () => {
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('modalBtn').onclick = closeModal; // restore default
    restart();
  };

  updateSessionStats();
}

/* ─── Render ─────────────────────────────────────── */

function render() {
  document.getElementById('playerScore').textContent = state.playerRuns;
  document.getElementById('compScore').textContent   = state.compRuns;
  document.getElementById('playerWickets').textContent = `${state.playerWickets}/${WICKETS_MAX} wickets`;
  document.getElementById('compWickets').textContent   = `${state.compWickets}/${WICKETS_MAX} wickets`;
  document.getElementById('targetTag').textContent = state.target ? `Target: ${state.target}` : '';

  const phaseMap = {
    player_bat:  '🏏 Your Innings – Batting',
    player_bowl: '🎳 Your Innings – Bowling',
    game_over:   '🏁 Game Over',
  };
  document.getElementById('phaseBadge').textContent = phaseMap[state.phase] || '';

  document.getElementById('playerCard').classList.toggle('active', state.phase === 'player_bat');
  document.getElementById('compCard').classList.toggle('active',   state.phase === 'player_bowl');

  document.getElementById('statBalls').textContent = state.balls;

  const sr = (state.phase === 'player_bat' && state.balls > 0)
    ? Math.round((state.playerRuns / state.balls) * 100)
    : 0;
  document.getElementById('statSR').textContent = sr;

  updateSessionStats();
}

/* ─── Restart ────────────────────────────────────── */

function restart() {
  state = initState();
  render();
  setMsg('Choose a number to start batting! 🏏', '');
  enableButtons(true);
  resetHands();
}

/* ─── Ripple Effect ──────────────────────────────── */

document.querySelectorAll('.num-btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${e.clientX - rect.left - size / 2}px;
      top: ${e.clientY - rect.top - size / 2}px;
    `;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 450);
  });
});

/* ─── Init ───────────────────────────────────────── */
restart();
