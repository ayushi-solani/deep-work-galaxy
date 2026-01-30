document.getElementById("btn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    document.getElementById("title").innerText =
      "Title: " + tab.title;
    document.getElementById("url").innerText =
      "URL: " + tab.url;
  });
});
