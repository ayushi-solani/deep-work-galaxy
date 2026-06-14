require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

// In-memory history store (resets when server restarts)
// You can swap this for a file/DB later
const fs = require("fs");
const HISTORY_FILE = "./history.json";

let browsingHistory = [];
if (fs.existsSync(HISTORY_FILE)) {
  try {
    browsingHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
  } catch (e) {
    browsingHistory = [];
  }
}

function saveHistory() {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(browsingHistory, null, 2));
}

/* =====================
   HELPER: Call Gemini
===================== */
async function callGemini(prompt) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 1000,
    thinkingConfig: {
      thinkingBudget: 0   // disables thinking mode — faster + no empty responses
    }
  }
})
  });

  const data = await response.json();
  console.log("GEMINI RAW:", JSON.stringify(data, null, 2)); 

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No candidates returned from Gemini");
  }

  const parts = data.candidates[0].content?.parts;
  if (!parts || parts.length === 0) throw new Error("Empty parts in response");

  return parts.map(p => p.text).join(" ");
}

/* =====================
   GET / — health check
===================== */
app.get("/", (req, res) => {
  res.send("AI Backend is running 🚀");
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend working fine ✅" });
});

/* =====================
   POST /check
   Distraction detection
===================== */
app.post("/check", async (req, res) => {
  try {
    const { task, title, url } = req.body;

    if (!task || !title || !url) {
      return res.status(400).json({ error: "Missing required fields: task, title, url" });
    }

    const prompt = `
You are a focus assistant. The user is trying to work on: "${task}".
They are currently on a page titled: "${title}" with URL: "${url}".

Decide if this page is distracting from their task.

Rules:
- If the page is directly related to the task, it is NOT distracting.
- Social media, entertainment, news (unless the task is journalism) are distracting.
- Search engines are NOT distracting (user may be researching).
- Be specific in your reason — mention the page title or site name.

Respond ONLY in valid JSON. No markdown, no extra text.
{
  "isDistracting": true or false,
  "reason": "one sentence explanation"
}
`;

    const text = await callGemini(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.json({ isDistracting: null, reason: "AI returned an unexpected response" });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Save to history
    browsingHistory.push({
      task,
      title,
      url,
      isDistracting: parsed.isDistracting,
      reason: parsed.reason,
      timestamp: new Date().toISOString()
    });

    // Keep history to last 100 entries
   if (browsingHistory.length > 100) browsingHistory.shift();
saveHistory();

    res.json(parsed);

  } catch (error) {
    console.error("❌ /check error:", error.message);
    res.status(500).json({ isDistracting: null, reason: "Backend error — AI unavailable" });
  }
});

/* =====================
   GET /insights
   Browsing pattern analysis
===================== */
app.get("/insights", async (req, res) => {
  try {
    if (browsingHistory.length === 0) {
      return res.json({ insight: "No browsing history yet. Start browsing and check back!" });
    }

    const summary = browsingHistory.map(h =>
      `- [${h.isDistracting ? "DISTRACTED" : "FOCUSED"}] Task: "${h.task}" | Page: "${h.title}" | ${h.timestamp}`
    ).join("\n");

    const prompt = `
You are a productivity coach. Here is a user's recent browsing history with focus analysis:

${summary}

Based on this data, provide:
1. A focus score from 0–100
2. The most common distraction patterns
3. Two specific, actionable tips to improve focus

Respond ONLY in valid JSON. No markdown, no extra text.
{
  "focusScore": 75,
  "patterns": "one sentence about distraction patterns",
  "tips": ["tip one", "tip two"]
}
`;

    const text = await callGemini(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.json({ insight: "Could not analyze patterns right now." });
    }

    res.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("❌ /insights error:", error.message);
    res.status(500).json({ insight: "Error generating insights" });
  }
});

/* =====================
   POST /chat
   Focus assistant chat
===================== */
app.post("/chat", async (req, res) => {
  try {
    const { message, task, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // Build conversation context from chat history
    const conversationContext = Array.isArray(history) && history.length > 0
      ? history.map(h => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`).join("\n")
      : "";

    const prompt = `
You are a focused productivity coach embedded in a browser extension called "Deep Work Galaxy".
${task ? `The user is currently working on: "${task}".` : ""}
Keep responses short (2–3 sentences max), practical, and encouraging.
Never go off-topic — always bring the conversation back to focus and productivity.

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ""}
User: ${message}
Assistant:`;

    const text = await callGemini(prompt);
    res.json({ reply: text.trim() });

  } catch (error) {
    console.error("❌ /chat error:", error.message);
    res.status(500).json({ reply: "Sorry, I couldn't respond right now. Try again!" });
  }
});

/* =====================
   GET /history
   Raw history (optional debug)
===================== */
app.get("/history", (req, res) => {
  res.json(browsingHistory);
});

// Start server
app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});