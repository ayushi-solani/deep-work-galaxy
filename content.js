function showBanner(task) {
  if (document.getElementById("deep-work-banner")) return;

  const pageText =
    document.title.toLowerCase() +
    " " +
    window.location.href.toLowerCase();

  if (pageText.includes(task.toLowerCase())) return;

  const banner = document.createElement("div");
  banner.id = "deep-work-banner";

  banner.style.position = "fixed";
  banner.style.top = "0";
  banner.style.left = "0";
  banner.style.width = "100%";
  banner.style.padding = "10px 16px";
  banner.style.backgroundColor = "#fef3c7";
  banner.style.color = "#333";
  banner.style.display = "flex";
  banner.style.justifyContent = "space-between";
  banner.style.alignItems = "center";
  banner.style.fontSize = "14px";
  banner.style.zIndex = "999999";
  banner.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";

  const text = document.createElement("span");
  text.innerText = `⚠️ This page may distract you from "${task}"`;

  const closeBtn = document.createElement("span");
  closeBtn.innerText = "❌";
  closeBtn.style.cursor = "pointer";
  closeBtn.onclick = () => banner.remove();

  banner.appendChild(text);
  banner.appendChild(closeBtn);

  document.body.appendChild(banner);
}

/* Run AFTER page is fully loaded */
setTimeout(() => {
  chrome.storage.sync.get("currentTask", (data) => {
    if (!data.currentTask) return;
    showBanner(data.currentTask);
  });
}, 1500);
