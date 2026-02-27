/* ===================================
   Scout Task Tracker — Application Logic
   =================================== */

// ─── State ─────────────────────────────────────
const state = {
  twenties: {
    timerRunning: false,
    timerInterval: null,
    elapsedSeconds: 0,
    evalCount: 0,
    sendCount: 0,
    goal: 0,
    goalSet: false,
    goalAchieved: false,
    patterns: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
    lastSentPattern: null,
    sendUnlocked: false,
  },
  thirties: {
    timerRunning: false,
    timerInterval: null,
    elapsedSeconds: 0,
    evalCount: 0,
    sendCount: 0,
    goal: 0,
    goalSet: false,
    goalAchieved: false,
    patterns: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
    lastSentPattern: null,
    sendUnlocked: false,
  },
};

// ─── Tab Switching ─────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Deactivate all
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    // Activate selected
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const panel = document.getElementById('panel-' + btn.dataset.tab);
    panel.classList.add('active');

    // Refresh summary if switching to summary tab
    if (btn.dataset.tab === 'summary') {
      updateSummaryDashboard();
    }
  });
});

// ─── Timer ─────────────────────────────────────
function toggleTimer(group) {
  const s = state[group];
  const btn = document.getElementById('start-' + group);

  if (!s.timerRunning) {
    // Start
    s.timerRunning = true;
    btn.innerHTML = '<span class="btn-icon">⏸</span> 一時停止';
    btn.classList.add('running');
    s.timerInterval = setInterval(() => {
      s.elapsedSeconds++;
      updateTimerDisplay(group);
      updateAvgTime(group);
    }, 1000);
  } else {
    // Pause
    s.timerRunning = false;
    btn.innerHTML = '<span class="btn-icon">▶</span> 再開';
    btn.classList.remove('running');
    clearInterval(s.timerInterval);
    s.timerInterval = null;
  }
}

function updateTimerDisplay(group) {
  const s = state[group];
  document.getElementById('timer-' + group).textContent = formatTime(s.elapsedSeconds);
}

function updateAvgTime(group) {
  const s = state[group];
  const el = document.getElementById('avg-time-' + group);
  if (s.evalCount === 0) {
    el.textContent = '--:--';
  } else {
    const avg = s.elapsedSeconds / s.evalCount;
    el.textContent = formatTimeShort(avg);
  }
}

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTimeShort(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Goal Setting ──────────────────────────────
function setGoal(group) {
  const input = document.getElementById('goal-' + group);
  const value = input.value.trim();

  // Validate: only half-width digits
  if (!/^[0-9]+$/.test(value) || parseInt(value, 10) <= 0) {
    showToast('半角数字で正しい目標件数を入力してください');
    return;
  }

  const goal = parseInt(value, 10);
  state[group].goal = goal;
  state[group].goalSet = true;
  state[group].goalAchieved = false;

  // Show goal display
  const display = document.getElementById('goal-display-' + group);
  display.style.display = 'flex';
  document.getElementById('goal-value-' + group).textContent = goal;

  // Show progress bar
  const progress = document.getElementById('progress-' + group);
  progress.style.display = 'block';
  updateProgress(group);

  showToast(`目標を ${goal} 件に設定しました`);
}

function updateProgress(group) {
  const s = state[group];
  if (!s.goalSet) return;

  const pct = Math.min((s.sendCount / s.goal) * 100, 100);
  document.getElementById('progress-fill-' + group).style.width = pct + '%';
  document.getElementById('progress-text-' + group).textContent = `${s.sendCount} / ${s.goal}`;
}

// ─── Evaluation Action ─────────────────────────
function evaluateResume(group) {
  const s = state[group];
  const selected = document.querySelector(`input[name="eval-${group}"]:checked`).value;

  // Increment eval count
  s.evalCount++;
  document.getElementById('eval-count-' + group).textContent = s.evalCount;

  // Update avg time
  updateAvgTime(group);

  // Animate the counter
  animateCounter('eval-count-' + group);

  if (selected === 'pass') {
    // Unlock send action
    unlockSendAction(group);
    showToast('適合 — 送付アクションがアンロックされました');
  } else {
    // Keep send action locked
    lockSendAction(group);
    showToast('不適合 — 評価件数を更新しました');
  }
}

function unlockSendAction(group) {
  state[group].sendUnlocked = true;
  const card = document.getElementById('send-card-' + group);
  card.classList.remove('locked');

  const badge = document.getElementById('lock-badge-' + group);
  badge.textContent = '🔓 アンロック';
  badge.classList.add('unlocked');

  document.getElementById('pattern-' + group).disabled = false;
  document.getElementById('send-btn-' + group).disabled = false;
}

function lockSendAction(group) {
  state[group].sendUnlocked = false;
  const card = document.getElementById('send-card-' + group);
  card.classList.add('locked');

  const badge = document.getElementById('lock-badge-' + group);
  badge.textContent = '🔒 ロック中';
  badge.classList.remove('unlocked');

  document.getElementById('pattern-' + group).disabled = true;
  document.getElementById('send-btn-' + group).disabled = true;
}

// ─── Send Action ───────────────────────────────
function sendOffer(group) {
  const s = state[group];
  if (!s.sendUnlocked) return;

  const patternSelect = document.getElementById('pattern-' + group);
  const pattern = patternSelect.value;

  // Increment send count
  s.sendCount++;
  document.getElementById('send-count-' + group).textContent = s.sendCount;

  // Track pattern
  s.patterns[pattern]++;
  s.lastSentPattern = pattern;

  // Update progress
  updateProgress(group);

  // Animate counter
  animateCounter('send-count-' + group);

  // Lock send action again
  lockSendAction(group);

  // Check goal achievement
  if (s.goalSet && s.sendCount >= s.goal && !s.goalAchieved) {
    s.goalAchieved = true;
    showGoalAchievement(group);
  } else {
    const groupLabel = group === 'twenties' ? '20代' : '30代';
    showToast(`${groupLabel}: パターン${pattern}で送付完了（${s.sendCount}件目）`);
  }
}

// ─── Cancel Send Action ────────────────────────────
function cancelSend(group) {
  const s = state[group];
  if (s.sendCount === 0 || !s.lastSentPattern) {
    showToast('取り消せる直近の送付履歴がありません');
    return;
  }

  // Decrement counts
  s.sendCount--;
  s.patterns[s.lastSentPattern]--;
  s.lastSentPattern = null; // Can only cancel once in a row

  // Update view
  document.getElementById('send-count-' + group).textContent = s.sendCount;
  updateProgress(group);
  animateCounter('send-count-' + group);

  // Revert goal achievements if applicable
  if (s.goalAchieved && s.sendCount < s.goal) {
    s.goalAchieved = false;
  }

  // If summary view is open, refresh it
  if (document.getElementById('panel-summary').classList.contains('active')) {
    updateSummaryDashboard();
  }

  showToast('送付を取り消しました（評価件数のみカウント）');
}

// ─── Goal Achievement ──────────────────────────
function showGoalAchievement(group) {
  const groupLabel = group === 'twenties' ? '20代' : '30代';
  const modal = document.getElementById('goal-modal');
  const message = document.getElementById('modal-message');
  message.textContent = `${groupLabel}の目標 ${state[group].goal} 件を達成しました！`;
  modal.style.display = 'flex';

  // Confetti effect
  createConfetti();
}

function closeModal() {
  document.getElementById('goal-modal').style.display = 'none';
  // Remove confetti
  document.querySelectorAll('.confetti-particle').forEach(p => p.remove());
}

function createConfetti() {
  const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
  for (let i = 0; i < 60; i++) {
    const particle = document.createElement('div');
    particle.classList.add('confetti-particle');
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = -10 + 'px';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.width = (Math.random() * 8 + 6) + 'px';
    particle.style.height = (Math.random() * 8 + 6) + 'px';
    particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
    particle.style.animationDelay = (Math.random() * 1) + 's';
    document.body.appendChild(particle);
  }
  // Clean up after animation
  setTimeout(() => {
    document.querySelectorAll('.confetti-particle').forEach(p => p.remove());
  }, 5000);
}

// ─── Summary Dashboard ────────────────────────
function updateSummaryDashboard() {
  const t = state.twenties;
  const th = state.thirties;

  // Totals
  const totalEval = t.evalCount + th.evalCount;
  const totalSend = t.sendCount + th.sendCount;
  const totalSeconds = t.elapsedSeconds + th.elapsedSeconds;

  document.getElementById('total-eval').textContent = totalEval;
  document.getElementById('total-send').textContent = totalSend;
  document.getElementById('total-time').textContent = formatTime(totalSeconds);

  if (totalEval > 0) {
    document.getElementById('total-avg').textContent = formatTimeShort(totalSeconds / totalEval);
  } else {
    document.getElementById('total-avg').textContent = '--:--';
  }

  // Breakdowns
  document.getElementById('summary-eval-twenties').textContent = t.evalCount;
  document.getElementById('summary-send-twenties').textContent = t.sendCount;
  document.getElementById('summary-time-twenties').textContent = formatTime(t.elapsedSeconds);

  document.getElementById('summary-eval-thirties').textContent = th.evalCount;
  document.getElementById('summary-send-thirties').textContent = th.sendCount;
  document.getElementById('summary-time-thirties').textContent = formatTime(th.elapsedSeconds);

  // Pattern chart
  drawPatternChart();
}

// ─── Save & Notify ─────────────────────────────
async function saveAndNotify() {
  const btn = document.getElementById('save-notify-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> 記録・送信中...';

  try {
    // Collect data to send to GAS (Endpoint to be implemented)
    const totalEval = state.twenties.evalCount + state.thirties.evalCount;
    const totalSend = state.twenties.sendCount + state.thirties.sendCount;
    const totalSeconds = state.twenties.elapsedSeconds + state.thirties.elapsedSeconds;

    /* 
    const data = {
      timestamp: new Date().toISOString(),
      evalTwenties: state.twenties.evalCount,
      sendTwenties: state.twenties.sendCount,
      timeTwenties: state.twenties.elapsedSeconds,
      evalThirties: state.thirties.evalCount,
      sendThirties: state.thirties.sendCount,
      timeThirties: state.thirties.elapsedSeconds,
      totalEval, totalSend, totalSeconds
    };
    // await fetch("GAS_WEB_APP_URL", { method: "POST", body: JSON.stringify(data) });
    */

    // Mock Delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Notification success
    btn.innerHTML = '<span class="btn-icon">✅</span> 記録・送信完了';
    showToast('スプレッドシートへの記録と通知が完了しました');

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">💾</span> 業務完了：データを記録して通知';
    }, 3000);

  } catch (error) {
    console.error(error);
    showToast('エラーが発生しました');
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">💾</span> 業務完了：データを記録して通知';
  }
}

// ─── Pattern Chart (Canvas) ────────────────────
function drawPatternChart() {
  const canvas = document.getElementById('pattern-chart');
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;

  // Handle DPI
  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;

  ctx.clearRect(0, 0, W, H);

  // Merge pattern data
  const patterns = [];
  for (let i = 1; i <= 9; i++) {
    patterns.push({
      label: `P${i}`,
      twenties: state.twenties.patterns[i],
      thirties: state.thirties.patterns[i],
      total: state.twenties.patterns[i] + state.thirties.patterns[i],
    });
  }

  const maxVal = Math.max(...patterns.map(p => p.total), 1);

  // Chart dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const barGroupWidth = chartW / 9;
  const barWidth = barGroupWidth * 0.35;
  const gap = barGroupWidth * 0.1;

  const colorTwenties = '#10b981';
  const colorThirties = '#8b5cf6';

  // Draw grid lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
  ctx.lineWidth = 1;
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartH / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(W - padding.right, y);
    ctx.stroke();

    // Grid labels
    const val = Math.round(maxVal - (maxVal / gridLines) * i);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, padding.left - 8, y + 4);
  }

  // Draw bars
  patterns.forEach((p, i) => {
    const x = padding.left + i * barGroupWidth;

    // Twenties bar
    const h1 = (p.twenties / maxVal) * chartH;
    const roundR = 4;
    drawRoundedBar(ctx, x + gap, padding.top + chartH - h1, barWidth, h1, roundR, colorTwenties);

    // Thirties bar
    const h2 = (p.thirties / maxVal) * chartH;
    drawRoundedBar(ctx, x + gap + barWidth + 2, padding.top + chartH - h2, barWidth, h2, roundR, colorThirties);

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, x + barGroupWidth / 2, H - padding.bottom + 20);

    // Total count above
    if (p.total > 0) {
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '700 12px Inter, sans-serif';
      const minH = Math.max(h1, h2);
      ctx.fillText(p.total, x + barGroupWidth / 2, padding.top + chartH - minH - 6);
    }
  });

  // Update legend
  updateChartLegend();
}

function drawRoundedBar(ctx, x, y, w, h, r, color) {
  if (h <= 0) return;
  r = Math.min(r, h / 2, w / 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

function updateChartLegend() {
  const legend = document.getElementById('chart-legend');
  legend.innerHTML = `
    <div class="legend-item">
      <span class="legend-dot" style="background:#10b981;"></span>
      <span>20代</span>
    </div>
    <div class="legend-item">
      <span class="legend-dot" style="background:#8b5cf6;"></span>
      <span>30代</span>
    </div>
  `;
}

// ─── Utilities ─────────────────────────────────
function animateCounter(elementId) {
  const el = document.getElementById(elementId);
  el.style.transform = 'scale(1.3)';
  el.style.transition = 'transform 0.15s ease';
  setTimeout(() => {
    el.style.transform = 'scale(1)';
  }, 150);
}

let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toast-message');

  // Reset animation
  clearTimeout(toastTimeout);
  toast.style.display = 'none';

  // Force reflow
  void toast.offsetHeight;

  msg.textContent = message;
  toast.style.display = 'flex';
  toast.style.animation = 'none';
  void toast.offsetHeight;
  toast.style.animation = 'slideUp 0.3s ease, fadeOut 0.3s ease 2.5s forwards';

  toastTimeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// ─── Initialize ────────────────────────────────
// Draw initial chart if summary tab is active
updateChartLegend();
