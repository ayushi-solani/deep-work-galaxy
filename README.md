#  Deep Work Galaxy

An AI-powered Chrome extension to detect distractions and help you stay focused.

## Features
-  AI distraction detection on every tab
-  Focus assistant chat
-  Browsing pattern insights
-  Break timer with Chrome notifications
-  Welcome back banner after break ends

## Setup

### 1. Get a Gemini API Key
Go to https://aistudio.google.com → Get API Key → copy it

### 2. Backend
cd into the project folder
npm install
create a .env file with: GEMINI_API_KEY=your_key_here
node index.js

### 3. Chrome Extension
Open chrome://extensions
Enable Developer Mode
Click "Load unpacked" → select this folder

## Tech Stack
- Chrome Extension (Manifest V3)
- Express.js + Node.js
- Google Gemini 2.5 Flash
