# Deep Work Galaxy

> An AI-powered Chrome extension that detects distractions, coaches you to stay focused, and reminds you to take breaks — all in real time.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=googlechrome&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat&logo=nodedotjs&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-2.5%20Flash-8E75B2?style=flat&logo=google&logoColor=white)

---

## Features

-  **AI Distraction Detection** — Gemini AI analyzes every tab you open and tells you if it's distracting you from your task
-  **Smart Banner** — A real-time banner appears on distracting pages with the AI's reason
-  **Focus Assistant Chat** — Talk to an AI productivity coach directly from the extension
-  **Browsing Insights** — Get a focus score and personalized tips based on your browsing patterns
-  **Break Timer** — Set a 1–10 minute break timer with a live countdown
-  **Break Notifications** — Chrome notification fires when your break ends
-  **Welcome Back Banner** — A green banner appears on your page when it's time to focus again
-  **Auto Break Suggestion** — After 3 consecutive distracting tabs, the extension suggests a break

---

##  Tech Stack

| Layer | Tech |
|---|---|
| Chrome Extension | Manifest V3, Vanilla JS |
| Backend | Node.js, Express.js |
| AI | Google Gemini 2.5 Flash |
| Hosting | Railway |

---

##  Getting Started

### Prerequisites
- Google Chrome browser
- No backend setup needed — it's already hosted!

### 1. Clone the repo
```bash
git clone https://github.com/ayushi-solani/deep-work-galaxy.git
cd deep-work-galaxy
```

### 2. Load the Chrome Extension
1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select the cloned `deep-work-galaxy` folder
5. The icon will appear in your toolbar

That's it — no backend setup needed. The extension connects to the hosted backend automatically.

---

##  How to Use

1. Click the extension icon in your Chrome toolbar
2. Type your current task (e.g. "DSA", "UI/UX", "React project")
3. Click **Save Task**
4. Browse normally — AI will analyze each tab and alert you if you're getting distracted
5. Use the **Chat** tab to talk to your AI focus coach
6. Check the **Insights** tab to see your focus score and tips
7. Use the **Break Timer** to take structured 1–10 minute breaks

---

##  Project Structure
deep-work-galaxy/

├── manifest.json        # Chrome extension config

├── background.js        # Service worker — timer & notifications

├── content.js           # Injected into pages — distraction banner

├── popup.html           # Extension popup UI

├── popup.js             # Popup logic — chat, insights, timer

├── popup.css            # Styles

├── icon.png             # Extension icon

├── index.js             # Express backend — Gemini API calls

└── package.json

---

## 🌐 Backend

The backend is hosted on Railway and connected automatically:
https://deep-work-galaxy-production.up.railway.app

### Want to run the backend locally instead?
1. Create a `.env` file in the root folder:
GEMINI_API_KEY=your_gemini_api_key_here
2. Install dependencies and start:
```bash
npm install
node index.js
```
3. Update this line in `popup.js`:
```js
const BACKEND = "http://localhost:3000";
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com)

---

##  Roadmap

- [ ] Pomodoro mode
- [ ] Weekly focus report
- [ ] Dark / light theme toggle
- [ ] Database for persistent history across devices
- [ ] Chrome Web Store release

---

##  Author

Made by [Ayushi Solani](https://github.com/ayushi-solani)

---

⭐ If you found this useful, give it a star on GitHub!
