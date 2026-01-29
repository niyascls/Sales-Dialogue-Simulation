const FLOW_URL = "https://default18a59a81eea84c30948ad8824cdc25.80.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f2a410c88a91427abf55bbb8f06b5de5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=YZiaCtNfNMvuQ3SNCHwPrEWBdojQW1cI2bHaKE8pFkA";

const bodyEl = document.getElementById("leaderboardBody");
const dateFilter = document.getElementById("dateFilter");
const refreshBtn = document.getElementById("refreshBtn");
const pauseBtn = document.getElementById("pauseBtn");
const darkToggle = document.getElementById("darkToggle");

const topScoreEl = document.getElementById("topScore");
const participantCountEl = document.getElementById("participantCount");
const lastUpdatedEl = document.getElementById("lastUpdated");
const liveBadge = document.querySelector(".live-badge");

let autoRefresh = true;
let hasLoadedOnce = false;

/* Restore theme */
document.body.classList.toggle("dark", localStorage.getItem("darkMode") === "true");
updateThemeIcon();

/* Events */
refreshBtn.onclick = loadLeaderboard;
dateFilter.onchange = loadLeaderboard;

pauseBtn.onclick = () => {
  autoRefresh = !autoRefresh;
  pauseBtn.textContent = autoRefresh ? "⏸ Pause" : "▶ Resume";
  refreshBtn.disabled = !autoRefresh;

  liveBadge.textContent = autoRefresh ? "LIVE" : "PAUSED";
  liveBadge.classList.toggle("paused", !autoRefresh);
};

darkToggle.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  updateThemeIcon();
};

/* Auto refresh */
setInterval(() => autoRefresh && loadLeaderboard(), 10000);
loadLeaderboard();

async function loadLeaderboard() {
  const payload = {};
  if (dateFilter.value) payload.date = dateFilter.value;

  if (!hasLoadedOnce) {
    bodyEl.innerHTML = `<tr><td colspan="5" class="loading">Loading...</td></tr>`;
  }

  const res = await fetch(FLOW_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  renderTable(json);
}

function renderTable(response) {
  const rows = response.data || [];

  bodyEl.style.opacity = "0.6";
  bodyEl.innerHTML = "";

  if (!rows.length) {
    bodyEl.innerHTML = `<tr><td colspan="5" class="loading">No data</td></tr>`;
    bodyEl.style.opacity = "1";
    return;
  }

  animate(topScoreEl, rows[0].score);
  animate(participantCountEl, rows.length);

  rows.forEach((r, i) => {
    const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;

    bodyEl.innerHTML += `
      <tr>
        <td>${rank}</td>
        <td>${escapeHtml(r.team)}</td>
        <td>${r.score}</td>
        <td>
          <div class="progress-wrap">
            <div class="progress-bar-bg">
              <div class="progress-bar" style="width:${r.progress}%"></div>
            </div>
            <span>${r.progress}%</span>
          </div>
        </td>
        <td>${escapeHtml(r.slide || "-")}</td>
      </tr>
    `;
  });

  bodyEl.style.opacity = "1";
  hasLoadedOnce = true;
  lastUpdatedEl.textContent = "Last updated: " + new Date().toLocaleTimeString();

  /* Screen reader announcement */
  document.getElementById("sr-status").textContent =
    dateFilter.value
      ? "Leaderboard updated for selected date"
      : "Leaderboard updated";
}

function animate(el, value) {
  const start = Number(el.textContent) || 0;
  const t0 = performance.now();

  function step(t) {
    const p = Math.min((t - t0) / 400, 1);
    el.textContent = Math.round(start + (value - start) * p);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function escapeHtml(text) {
  return text
    ? text.replace(/[&<>"']/g, m =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])
      )
    : "";
}

function updateThemeIcon() {
  darkToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}

/* Date icon opens picker */
document.querySelector(".date-icon").onclick = () => {
  dateFilter.showPicker?.() || dateFilter.focus();
};
