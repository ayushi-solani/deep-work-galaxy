console.log(" Content script loaded");

/* RENDER BANNER */
function showBanner(task, reason, isDistracting) {
  
  const existing = document.getElementById("deep-work-banner");
  if (existing) existing.remove();

  
  if (!isDistracting) return;

  const banner = document.createElement("div");
  banner.id = "deep-work-banner";

  Object.assign(banner.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    padding: "10px 16px",
    backgroundColor: "#fef3c7",
    color: "#333",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: "2147483647",       
    fontSize: "14px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    fontFamily: "sans-serif",
    boxSizing: "border-box"
  });

  
  const text = document.createElement("span");
  text.innerText = reason
    ? `⚠️ ${reason}`
    : `⚠️ This page may distract you from "${task}"`;

  // Close button
  const closeBtn = document.createElement("span");
  closeBtn.innerText = "❌";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.marginLeft = "12px";
  closeBtn.style.flexShrink = "0";
  closeBtn.onclick = () => banner.remove();

  banner.appendChild(text);
  banner.appendChild(closeBtn);
  document.documentElement.prepend(banner);
  console.log("🚀 Banner injected:", reason);
}

/*CHECK STORAGE & DECIDE*/
function evaluatePage() {
  chrome.storage.sync.get(["currentTask", "aiResult"], (data) => {
    if (!data.currentTask) return;

    const aiResult = data.aiResult;

    
    if (!aiResult) {
      const task = data.currentTask.toLowerCase();
      const pageText = (document.title + " " + window.location.href).toLowerCase();
      const isDistracting = !pageText.includes(task);
      showBanner(data.currentTask, null, isDistracting);
      return;
    }

    showBanner(data.currentTask, aiResult.reason, aiResult.isDistracting);
  });
}

/* LISTEN FOR UPDATES
   Re-evaluate if task or AI result changes */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.aiResult || changes.currentTask)) {
    evaluatePage();
  }
});

/* INITIAL RUN */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", evaluatePage);
} else {
  evaluatePage();
}

/* BREAK ENDED BANNER */

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.breakEnded) {
    showWelcomeBackBanner();
  }
});

function showWelcomeBackBanner() {
  
  const existing = document.getElementById("deep-work-welcome-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "deep-work-welcome-banner";

  Object.assign(banner.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    padding: "10px 16px",
    backgroundColor: "#052e16",
    borderBottom: "1px solid rgba(34,197,94,0.4)",
    color: "#86efac",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: "2147483647",
    fontSize: "14px",
    fontFamily: "sans-serif",
    boxShadow: "0 0 20px rgba(34,197,94,0.2)",
    boxSizing: "border-box"
  });

  const text = document.createElement("span");
  text.innerText = "🚀 Break's over! Time to get back to deep work. You've got this!";

  const closeBtn = document.createElement("span");
  closeBtn.innerText = "✖";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.marginLeft = "12px";
  closeBtn.style.flexShrink = "0";
  closeBtn.onclick = () => banner.remove();

  banner.appendChild(text);
  banner.appendChild(closeBtn);
  document.documentElement.prepend(banner);

  
  setTimeout(() => {
    if (banner.parentNode) banner.remove();
  }, 8000);
}
