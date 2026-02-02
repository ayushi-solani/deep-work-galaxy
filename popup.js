const input = document.getElementById("task");
const display = document.getElementById("currentTask");
const btn = document.getElementById("saveBtn");
const tabInfo = document.getElementById("tabInfo");
const focusStatus = document.getElementById("focusStatus");
const saveLaterBtn = document.getElementById("saveLaterBtn");

/* SAVE TASK */
btn.addEventListener("click", () => {
  const value = input.value.trim();
  if (!value) return;

  chrome.storage.sync.set({ currentTask: value }, () => {
    display.innerText = "Current task: " + value;
  });
});

/* LOAD TASK */
chrome.storage.sync.get("currentTask", (data) => {
  if (data.currentTask) {
    input.value = data.currentTask;
    display.innerText = "Current task: " + data.currentTask;
  }
});

/* CHECK CURRENT TAB */
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];

  chrome.storage.sync.get("currentTask", (data) => {
    if (!data.currentTask) return;

    const task = data.currentTask.toLowerCase();
    const title = tab.title.toLowerCase();
    const url = tab.url.toLowerCase();

    if (title.includes(task) || url.includes(task)) {
      focusStatus.innerText = "Looks relevant to your task";
      focusStatus.style.color = "green";
    } else {
      focusStatus.innerText = "This may distract you";
      focusStatus.style.color = "red";
    }
  });
});


/* SAVE FOR LATER */
saveLaterBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    chrome.storage.sync.get("saveForLater", (data) => {
      const saved = data.saveForLater || [];
      saved.push({ title: tab.title, url: tab.url });

      chrome.storage.sync.set({ saveForLater: saved }, () => {
        alert("Saved for later ");
      });
    });
  });
});

const savedList = document.getElementById("savedList");

/* LOAD SAVED LINKS */
chrome.storage.sync.get("saveForLater", (data) => {
  const saved = data.saveForLater || [];
  savedList.innerHTML = "";

  saved.forEach((item, index) => {
    const li = document.createElement("li");

    const link = document.createElement("a");
    link.href = item.url;
    link.innerText = item.title;
    link.target = "_blank";

    const removeBtn = document.createElement("button");
    removeBtn.innerText = "Remove";
    removeBtn.style.marginLeft = "5px";

    removeBtn.addEventListener("click", () => {
      saved.splice(index, 1);
      chrome.storage.sync.set({ saveForLater: saved }, () => {
        location.reload();
      });
    });

    li.appendChild(link);
    li.appendChild(removeBtn);
    savedList.appendChild(li);
  });
});




