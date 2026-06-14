/* DEEP WORK GALAXY
   Background Service Worker*/

const DISTRACTION_THRESHOLD = 3; 

/* INIT STATE */
function getDefaultState() {
  return {
    timerActive: false,
    timerEnd: null,        // timestamp when break ends
    timerDuration: 5,      // in minutes
    distractionStreak: 0,  // consecutive distracting tabs
    breakSuggested: false  
  };
}

 
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("timerState", (data) => {
    if (!data.timerState) {
      chrome.storage.local.set({ timerState: getDefaultState() });
    }
  });
});

/* LISTEN FOR MESSAGES
   From popup.js */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Start break timer
  if (message.type === "START_BREAK") {
    const duration = message.duration || 5; // minutes
    const timerEnd = Date.now() + duration * 60 * 1000;

    chrome.storage.local.set({
      timerState: {
        timerActive: true,
        timerEnd,
        timerDuration: duration,
        distractionStreak: 0,
        breakSuggested: false
      }
    }, () => {
      scheduleAlarm(duration);
      sendResponse({ success: true });
    });
    return true;
  }

  // Stop break timer
  if (message.type === "STOP_BREAK") {
    chrome.alarms.clear("breakEnd");
    chrome.storage.local.get("timerState", (data) => {
      const state = data.timerState || getDefaultState();
      state.timerActive = false;
      state.timerEnd = null;
      chrome.storage.local.set({ timerState: state }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  // Get current timer state
  if (message.type === "GET_TIMER") {
    chrome.storage.local.get("timerState", (data) => {
      sendResponse({ timerState: data.timerState || getDefaultState() });
    });
    return true;
  }
});

/* SCHEDULE ALARM */
function scheduleAlarm(durationMinutes) {
  chrome.alarms.clear("breakEnd", () => {
    chrome.alarms.create("breakEnd", {
      delayInMinutes: durationMinutes
    });
  });
}

/*  ALARM FIRES — BREAK ENDED*/
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "breakEnd") {
    
    chrome.storage.local.get("timerState", (data) => {
      const state = data.timerState || getDefaultState();
      state.timerActive = false;
      state.timerEnd = null;
      chrome.storage.local.set({ timerState: state });
    });

    
    chrome.notifications.create("breakDone", {
      type: "basic",
      iconUrl: "icon.png",
      title: "Break's over! 🚀",
      message: "Time to get back to deep work. You've got this!",
      priority: 2
    });

   
chrome.storage.local.set({ breakEnded: Date.now() });
  }
});

/* AUTO-SUGGEST BREAK
   Track distraction streak via storage changes */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.aiResult) return;

  const aiResult = changes.aiResult.newValue;
  if (!aiResult) return;

  chrome.storage.local.get("timerState", (data) => {
    const state = data.timerState || getDefaultState();

    
    if (state.timerActive) return;

    if (aiResult.isDistracting === true) {
      state.distractionStreak += 1;
    } else {
      state.distractionStreak = 0;
      state.breakSuggested = false;
    }

    
    if (state.distractionStreak >= DISTRACTION_THRESHOLD && !state.breakSuggested) {
      state.breakSuggested = true;

      chrome.notifications.create("breakSuggest", {
        type: "basic",
        iconUrl: "icon.png",
        title: "You seem distracted 😴",
        message: "You've been off-task for a while. Want to take a short break?",
        priority: 1
      });
    }

    chrome.storage.local.set({ timerState: state });
  });
});
