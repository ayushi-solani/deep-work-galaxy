const input = document.getElementById("task");
const display = document.getElementById("currentTask");
const saveBtn = document.getElementById("saveBtn");
const tabInfo = document.getElementById("tabInfo");
const focusStatus = document.getElementById("focusStatus");
const statusDot = document.getElementById("statusDot");
const statusCard = document.getElementById("statusCard");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");
const chatMessages = document.getElementById("chatMessages");
const insightsBtn = document.getElementById("insightsBtn");
const insightsPanel = document.getElementById("insightsPanel");
const saveLaterBtn = document.getElementById("saveLaterBtn");
const savedList = document.getElementById("savedList");

const BACKEND = "http://localhost:3000";
let chatHistory = [];
let currentTask = "";

/* TABS */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.add("hidden"));
    tab.classList.add("active");
    document.getElementById("panel-" + tab.dataset.tab).classList.remove("hidden");
  });
});

/* STATUS HELPERS */
function setStatus(type, message) {
  focusStatus.className = type;
  focusStatus.innerText = message;
  statusDot.className = "status-dot";
  statusCard.className = "status-card";

  if (type === "focused") {
    statusDot.classList.add("green");
    statusCard.classList.add("focused");
  } else if (type === "unknown") {
    statusDot.classList.add("orange");
    statusCard.classList.add("unknown");
  } else if (type === "loading") {
    statusDot.classList.add("grey");
  }
  
}

/* SAVE TASK */
saveBtn.addEventListener("click", () => {
  const value = input.value.trim();
  if (!value) return;

  chrome.storage.sync.set({ currentTask: value, aiResult: null }, () => {
    display.innerText = "Task: " + value;
    currentTask = value;
    checkCurrentTab(value);
  });
});

/* LOAD TASK ON OPEN*/
chrome.storage.sync.get("currentTask", (data) => {
  if (data && data.currentTask) {
    // Don't autofill the input — just show it as the active task below
    display.innerText = "Task: " + data.currentTask;
    currentTask = data.currentTask;
    checkCurrentTab(data.currentTask);
  }
});

/* =======================
   CHECK CURRENT TAB
======================= */
function checkCurrentTab(task) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;

    const tab = tabs[0];
    tabInfo.innerText = tab.title || "Unknown tab";

    if (!task || !tab.url) return;

    if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
      setStatus("unknown", "Can't analyze browser pages.");
      return;
    }

    setStatus("loading", "Analyzing...");

    fetch(`${BACKEND}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, title: tab.title, url: tab.url })
    })
    .then(res => res.json())
    .then(result => {
      if (result.isDistracting === null || result.isDistracting === undefined) {
        setStatus("unknown", "⚠️ " + (result.reason || "AI unavailable"));
      } else if (result.isDistracting) {
        setStatus("distracting", "🔴 " + result.reason);
      } else {
        setStatus("focused", "🟢 " + result.reason);
      }
      chrome.storage.sync.set({ aiResult: result });
    })
    .catch(() => {
      setStatus("unknown", "❌ Backend not reachable. Is it running?");
    });
  });
}

/* =======================
   CHAT
======================= */
function appendMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = "chat-msg " + role;
  msg.innerText = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChat() {
  const message = chatInput.value.trim();
  if (!message) return;

  chatInput.value = "";
  appendMessage("user", message);
  chatHistory.push({ role: "user", content: message });

  const typing = document.createElement("div");
  typing.className = "chat-msg assistant typing";
  typing.innerText = "...";
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  fetch(`${BACKEND}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      task: currentTask,
      history: chatHistory.slice(-6)
    })
  })
  .then(res => res.json())
  .then(data => {
    typing.remove();
    const reply = data.reply || "No response.";
    appendMessage("assistant", reply);
    chatHistory.push({ role: "assistant", content: reply });
  })
  .catch(() => {
    typing.remove();
    appendMessage("assistant", "❌ Could not reach backend.");
  });
}

chatSendBtn.addEventListener("click", sendChat);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendChat();
  }
});

/* =======================
   INSIGHTS
======================= */
insightsBtn.addEventListener("click", () => {
  insightsPanel.innerHTML = "<div style='color:rgba(167,139,250,0.5);font-size:12px;text-align:center;padding:12px 0'>Loading insights...</div>";

  fetch(`${BACKEND}/insights`)
  .then(res => res.json())
  .then(data => {
    if (data.insight) {
      insightsPanel.innerHTML = `<div class="empty-state">${data.insight}</div>`;
      return;
    }

    insightsPanel.innerHTML = `
      <div class="insights-grid">
        <div class="insight-card">
          <div class="insight-val">${data.focusScore}</div>
          <div class="insight-lbl">Focus Score</div>
        </div>
        <div class="insight-card">
          <div class="insight-val" style="font-size:14px; padding-top:4px; color:#94a3b8">${data.patterns}</div>
          <div class="insight-lbl">Pattern</div>
        </div>
      </div>
      <div class="insights-section-title">Tips</div>
      ${data.tips.map(t => `
        <div class="tip-item">
          <div class="tip-dot"></div>
          <span>${t}</span>
        </div>
      `).join("")}
    `;
  })
  .catch(() => {
    insightsPanel.innerHTML = `<div class="empty-state">❌ Could not load insights.</div>`;
  });
});

/* =======================
   SAVE FOR LATER
======================= */
saveLaterBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    const tab = tabs[0];

    if (!tab.url || tab.url.startsWith("chrome://")) {
      alert("This page cannot be saved");
      return;
    }

    chrome.storage.sync.get("saveForLater", (data) => {
      const saved = Array.isArray(data.saveForLater) ? data.saveForLater : [];
      saved.push({ title: tab.title || "Untitled", url: tab.url });
      chrome.storage.sync.set({ saveForLater: saved }, () => {
        loadSavedLinks();
      });
    });
  });
});

/* =======================
   LOAD SAVED LINKS
======================= */
function loadSavedLinks() {
  chrome.storage.sync.get("saveForLater", (data) => {
    const saved = Array.isArray(data.saveForLater) ? data.saveForLater : [];
    savedList.innerHTML = "";

    if (saved.length === 0) {
      savedList.innerHTML = `<div class="empty-state">No saved tabs yet.</div>`;
      return;
    }

    saved.forEach((item, index) => {
      if (!item || !item.url) return;

      const li = document.createElement("li");

      const link = document.createElement("a");
      link.href = item.url;
      link.innerText = item.title || item.url;
      link.target = "_blank";

      const removeBtn = document.createElement("button");
      removeBtn.innerText = "Remove";
      removeBtn.addEventListener("click", () => {
        saved.splice(index, 1);
        chrome.storage.sync.set({ saveForLater: saved }, loadSavedLinks);
      });

      li.appendChild(link);
      li.appendChild(removeBtn);
      savedList.appendChild(li);
    });
  });
}

/* =======================
   BREAK TIMER
======================= */
const breakSlider = document.getElementById("breakSlider");
const sliderValue = document.getElementById("sliderValue");
const startBreakBtn = document.getElementById("startBreakBtn");
const stopBreakBtn = document.getElementById("stopBreakBtn");
const timerDisplay = document.getElementById("timerDisplay");
const timerControls = document.getElementById("timerControls");
const breakSuggest = document.getElementById("breakSuggest");

let timerInterval = null;

// Slider live update
breakSlider.addEventListener("input", () => {
  sliderValue.innerText = breakSlider.value;
});

// Format ms remaining into MM:SS
function formatTime(ms) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Update the countdown display every second
function startCountdown(timerEnd) {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const remaining = timerEnd - Date.now();

    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerDisplay.innerText = "Break over! Time to focus 🚀";
      timerDisplay.className = "timer-display done";
      showTimerIdle();
      return;
    }

    timerDisplay.innerText = `Break ends in ${formatTime(remaining)}`;
    timerDisplay.className = "timer-display active";
  }, 1000);
}

// Show idle state (slider + start button)
function showTimerIdle() {
  timerControls.classList.remove("hidden");
  startBreakBtn.classList.remove("hidden");
  stopBreakBtn.classList.add("hidden");
}

// Show active state (countdown + stop button)
function showTimerActive(timerEnd) {
  timerControls.classList.add("hidden");
  startBreakBtn.classList.add("hidden");
  stopBreakBtn.classList.remove("hidden");
  startCountdown(timerEnd);
}

// Start break
startBreakBtn.addEventListener("click", () => {
  const duration = parseInt(breakSlider.value);

  chrome.runtime.sendMessage({ type: "START_BREAK", duration }, (response) => {
    if (response && response.success) {
      const timerEnd = Date.now() + duration * 60 * 1000;
      showTimerActive(timerEnd);
      breakSuggest.classList.add("hidden");
    }
  });
});

// Stop break
stopBreakBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "STOP_BREAK" }, (response) => {
    if (response && response.success) {
      clearInterval(timerInterval);
      timerDisplay.innerText = "No active break";
      timerDisplay.className = "timer-display";
      showTimerIdle();
    }
  });
});

// On popup open — check if a break is already running
chrome.runtime.sendMessage({ type: "GET_TIMER" }, (response) => {
  if (!response || !response.timerState) return;

  const state = response.timerState;

  if (state.timerActive && state.timerEnd) {
    const remaining = state.timerEnd - Date.now();
    if (remaining > 0) {
      showTimerActive(state.timerEnd);
    } else {
      showTimerIdle();
    }
  } else {
    showTimerIdle();
  }

  // Show auto-suggest banner if distraction streak hit threshold
  if (state.breakSuggested && !state.timerActive) {
    breakSuggest.classList.remove("hidden");
  } else {
    breakSuggest.classList.add("hidden");
  }
});

loadSavedLinks();




