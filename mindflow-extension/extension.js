const vscode = require("vscode");

// ─── Keystroke Tracker State ───────────────────────────────
let keystrokes = [];
let sessionAvgSpeed = null;
let highLoadStreak = 0;
let analysisTimer = null;

// ─── Adaptive Check-in State ───────────────────────────────
let checkinTimer = null;
let lastEnergyLevel = 3; // default: flow state
let checkinCount = 0;
let sessionStartTime = null;

// ─── Keystroke Tracker ─────────────────────────────────────
function startKeystrokeTracker(context) {
  const listener = vscode.workspace.onDidChangeTextDocument((event) => {
    const now = Date.now();
    event.contentChanges.forEach((change) => {
      const isDelete = change.text.length === 0 || change.rangeLength > 0;
      keystrokes.push({ time: now, chars: change.text.length, isDelete });
    });
  });
  context.subscriptions.push(listener);
}

// ─── Cognitive Load Analyzer ───────────────────────────────
function analyzePatterns() {
  const windowMs = 10 * 1000;
  const now = Date.now();
  const window = keystrokes.filter((k) => k.time > now - windowMs);
  keystrokes = [];

  if (window.length < 5) return "low";

  const totalChars = window.reduce((sum, k) => sum + k.chars, 0);
  const speedCharsPerMin = (totalChars / 10) * 60;

  if (sessionAvgSpeed === null) sessionAvgSpeed = speedCharsPerMin;
  const speedDropped = speedCharsPerMin < sessionAvgSpeed * 0.6;
  sessionAvgSpeed = (sessionAvgSpeed + speedCharsPerMin) / 2;

  const sorted = [...window].sort((a, b) => a.time - b.time);
  const gaps = sorted.slice(1).map((k, i) => k.time - sorted[i].time);
  const longPauses = gaps.filter((g) => g > 5000).length;
  const pausesPerMin = (longPauses / 10) * 60;
  const tooManyPauses = pausesPerMin > 3;

  const deletions = window.filter((k) => k.isDelete).length;
  const backspaceRatio = deletions / window.length;
  const highErrorRate = backspaceRatio > 0.3;

  const score = [speedDropped, tooManyPauses, highErrorRate].filter(
    Boolean,
  ).length;

  if (score >= 2) return "high";
  if (score === 1) return "medium";
  return "low";
}

function startAnalysisLoop() {
  analysisTimer = setInterval(() => {
    const load = analyzePatterns();

    if (load === "high") {
      highLoadStreak++;
    } else {
      highLoadStreak = 0;
    }

    if (highLoadStreak >= 2) {
      highLoadStreak = 0;
      vscode.window
        .showInformationMessage(
          "MindFlow detected high cognitive load. Take a 5 minute break?",
          "Log Check-in",
          "Dismiss",
        )
        .then((selection) => {
          if (selection === "Log Check-in") {
            vscode.commands.executeCommand("mindflow.panel.focus");
          }
        });
    }
  }, 90 * 1000);
}

// ─── Adaptive Check-in System ──────────────────────────────

/**
 * Returns next check-in interval in milliseconds.
 * Based on Ultradian Rhythm Research + Peretz Lavie's variable cycle research
 * + BF Skinner's Variable Ratio Scheduling (±5 min jitter prevents anticipation bias)
 *
 * Energy 3 (Flow)     → 90 min base
 * Energy 2 (Okay)     → 45 min base
 * Energy 1 (Depleted) → 20 min base
 * All levels get ±5 min random jitter
 */
function getNextCheckinInterval(energyLevel) {
  const baseMinutes = energyLevel === 3 ? 90 : energyLevel === 2 ? 45 : 20;
  const jitter = Math.floor(Math.random() * 10) - 5; // -5 to +5 minutes
  const totalMinutes = Math.max(10, baseMinutes + jitter); // never less than 10 min
  return totalMinutes * 60 * 1000;
}

function scheduleNextCheckin(energyLevel) {
  // Clear any existing timer
  if (checkinTimer) {
    clearTimeout(checkinTimer);
    checkinTimer = null;
  }

  const interval = getNextCheckinInterval(energyLevel);
  const minutes = Math.round(interval / 60000);

  checkinTimer = setTimeout(() => {
    showCheckinPopup();
  }, interval);

  console.log(`MindFlow: next check-in scheduled in ${minutes} minutes`);
}

async function showCheckinPopup() {
  checkinCount++;

  // Step 1 — Ask energy level
  const energyPick = await vscode.window.showQuickPick(
    [
      {
        label: "🔥 In Flow",
        description: "Fully focused, making great progress",
        value: 3,
      },
      {
        label: "😐 Okay",
        description: "Getting through it, slightly tired",
        value: 2,
      },
      {
        label: "😵 Depleted",
        description: "Struggling to focus, low energy",
        value: 1,
      },
    ],
    {
      title: `MindFlow Check-in #${checkinCount} ⏱`,
      placeHolder: "How is your energy right now?",
      ignoreFocusOut: true,
    },
  );

  if (!energyPick) {
    // User dismissed — reschedule at default 90 min
    scheduleNextCheckin(3);
    return;
  }

  // Step 2 — Ask on-track
  const trackPick = await vscode.window.showQuickPick(
    [
      { label: "✅ Yes, on track", value: true },
      { label: "❌ No, got distracted", value: false },
    ],
    {
      title: "MindFlow Check-in",
      placeHolder: "Are you still on track with your session goal?",
      ignoreFocusOut: true,
    },
  );

  if (!trackPick) {
    scheduleNextCheckin(energyPick.value);
    return;
  }

  // Step 3 — Send to backend
  lastEnergyLevel = energyPick.value;

  try {
    const today = new Date().toISOString().split("T")[0];

    const data = await new Promise((resolve, reject) => {
      const http = require("http");
      const body = JSON.stringify({
        user_id: "vscode_user",
        session_date: today,
        checkin_number: checkinCount,
        energy_level: energyPick.value,
        on_track: trackPick.value,
        planned_hours: 2,
        actual_topic: "VS Code session",
      });

      const req = http.request(
        {
          hostname: "localhost",
          port: 8000,
          path: "/api/checkin",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (res) => {
          let raw = "";
          res.on("data", (chunk) => (raw += chunk));
          res.on("end", () => resolve(JSON.parse(raw)));
        },
      );

      req.on("error", reject);
      req.write(body);
      req.end();
    });

    const burnoutScore = data.burnout_score || "Low";

    // Step 4 — Show result + schedule next
    const nextMinutes = Math.round(
      getNextCheckinInterval(energyPick.value) / 60000,
    );

    const action = await vscode.window.showInformationMessage(
      `MindFlow: Burnout Risk — ${burnoutScore} ${getBurnoutEmoji(burnoutScore)} · Next check-in in ~${nextMinutes} min`,
      "Open Dashboard",
      "OK",
    );

    if (action === "Open Dashboard") {
      vscode.env.openExternal(
        vscode.Uri.parse("http://localhost:3000/dashboard"),
      );
    }
  } catch (error) {
    vscode.window.showWarningMessage(
      "MindFlow: Could not reach backend. Check-in saved locally.",
    );
  }

  // Schedule next check-in based on energy response
  scheduleNextCheckin(energyPick.value);
}

function getBurnoutEmoji(score) {
  if (score === "High") return "🔴";
  if (score === "Medium") return "🟡";
  return "🟢";
}

// ─── Webview Panel ─────────────────────────────────────────
class MindFlowPanel {
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._getHtml();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "ask") {
        try {
          const response = await fetch("http://localhost:8000/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: message.question,
              mode: message.mode,
              burnout_score: message.burnout_score,
              code_context: message.code_context || "",
            }),
          });
          const data = await response.json();
          webviewView.webview.postMessage({
            command: "response",
            answer: data.answer,
            grounded: data.grounded,
            mode_used: data.mode_used,
          });
        } catch (error) {
          webviewView.webview.postMessage({
            command: "error",
            message:
              "Cannot connect to MindFlow backend. Make sure it is running on port 8000.",
          });
        }
      }
    });
  }

  _getHtml() {
    const fs = require("fs");
    const path = require("path");
    const htmlPath = path.join(
      this.extensionUri.fsPath,
      "webview",
      "index.html",
    );
    return fs.readFileSync(htmlPath, "utf8");
  }
}

// ─── Activate ──────────────────────────────────────────────
function activate(context) {
  const provider = new MindFlowPanel(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("mindflow.panel", provider),
  );

  startKeystrokeTracker(context);
  startAnalysisLoop();

  // Start adaptive check-in system
  sessionStartTime = Date.now();
  scheduleNextCheckin(3); // First check-in after 90 ± 5 min (Flow assumed at start)
  // TESTING ONLY — remove after test:
  // setTimeout(() => showCheckinPopup(), 30 * 1000);

  vscode.window.showInformationMessage(
    "MindFlow activated 🧠 — adaptive check-ins enabled. First check-in in ~90 minutes.",
  );

  console.log(
    "MindFlow: extension activated (panel + keystroke detector + adaptive check-ins).",
  );
}

// ─── Deactivate ────────────────────────────────────────────
function deactivate() {
  if (analysisTimer) {
    clearInterval(analysisTimer);
    analysisTimer = null;
  }
  if (checkinTimer) {
    clearTimeout(checkinTimer);
    checkinTimer = null;
  }
  console.log("MindFlow: extension deactivated.");
}

module.exports = { activate, deactivate };

context.subscriptions.push(
  vscode.commands.registerCommand("mindflow.testCheckin", () => {
    showCheckinPopup();
  }),
);
