// Prevent duplicate banners
if (document.getElementById("deep-work-banner")) {
  console.log("Banner already exists");
} else {
  chrome.storage.sync.get("currentTask", (data) => {
    if (!data.currentTask) {
      console.log("No task saved");
      return;
    }

    const task = data.currentTask.toLowerCase();
    const pageText =
      document.title.toLowerCase() +
      " " +
      window.location.href.toLowerCase();

    if (!pageText.includes(task)) {
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
      banner.style.zIndex = "9999";
      banner.style.fontSize = "14px";

      const text = document.createElement("span");
      text.innerText = `⚠️ This page may distract you from "${data.currentTask}"`;

      const closeBtn = document.createElement("span");
      closeBtn.innerText = "❌";
      closeBtn.style.cursor = "pointer";
      closeBtn.onclick = () => banner.remove();

      banner.appendChild(text);
      banner.appendChild(closeBtn);

      document.body.prepend(banner);
      console.log("Banner injected");
    } else {
      console.log("Page matches task");
    }
  });
}
