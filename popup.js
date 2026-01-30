const input = document.getElementById("task");
const display = document.getElementById("currentTask");
const btn = document.getElementById("saveBtn");
const tabInfo = document.getElementById("tabInfo");
const focusStatus = document.getElementById("focusStatus");


btn.addEventListener("click", () => {
  const value = input.value.trim();
  if (!value) return;

  localStorage.setItem("currentTask", value);
  display.innerText = "Current task: " + value;
});

const savedTask = localStorage.getItem("currentTask");
if (savedTask) {
  input.value = savedTask;
  display.innerText = "Current task: " + savedTask;
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  const title = tab.title.toLowerCase();
  const url = tab.url.toLowerCase();

  tabInfo.innerText = "Current tab: " + tab.title;

  const task = localStorage.getItem("currentTask");
  if (!task) return;

  if (title.includes(task.toLowerCase()) || url.includes(task.toLowerCase())) {
    focusStatus.innerText = " Looks relevant to your task";
    focusStatus.style.color = "green";
  } else {
    focusStatus.innerText = " This may distract you";
    focusStatus.style.color = "red";
  }
});


