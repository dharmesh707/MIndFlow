const vscode = require("vscode");

let currentUserId = "vscode_user";

// ─── Keystroke Tracker State ───────────────────────────────
let keystrokeEvents = [];
let sessionAvgSpeed = null;
let cognitiveTimer = null;
let lastCognitiveState = "flow";
let provider = null;

// ─── Adaptive Check-in State ───────────────────────────────
let checkinTimer = null;
let lastEnergyLevel = 3;
let checkinCount = 0;
let sessionStartTime = null;

// ─── Keystroke Tracker ─────────────────────────────────────
function startKeystrokeTracker(context) {
  const listener = vscode.workspace.onDidChangeTextDocument((event) => {
    const now = Date.now();
    event.contentChanges.forEach((change) => {
      const isDelete = change.text.length === 0 || change.rangeLength > 0;
      keystrokeEvents.push({ time: now, chars: change.text.length, isDelete });
    });
  });
  context.subscriptions.push(listener);
}

// ─── Feature Extraction ────────────────────────────────────
function extractFeatures() {
  const windowMs = 60 * 1000;
  const now = Date.now();
  const window = keystrokeEvents.filter((k) => k.time > now - windowMs);
  keystrokeEvents = keystrokeEvents.filter((k) => k.time > now - windowMs);

  if (window.length < 3) return null;

  const totalChars = window.reduce((sum, k) => sum + (k.chars || 0), 0);
  const typingSpeed = totalChars;

  const sorted = [...window].sort((a, b) => a.time - b.time);
  const gaps = sorted.slice(1).map((k, i) => k.time - sorted[i].time);
  const pauseFrequency = gaps.filter((g) => g > 2000).length;

  const deletions = window.filter((k) => k.isDelete).length;
  const backspaceRatio = window.length > 0 ? deletions / window.length : 0;

  let burstScore = 0.5;
  if (gaps.length > 1) {
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance =
      gaps.reduce((s, g) => s + Math.pow(g - avgGap, 2), 0) / gaps.length;
    burstScore = Math.min(1.0, Math.sqrt(variance) / 2000);
  }

  return {
    typingSpeed: Math.round(typingSpeed),
    pauseFrequency: Math.round(pauseFrequency * 10) / 10,
    backspaceRatio: Math.round(backspaceRatio * 100) / 100,
    burstScore: Math.round(burstScore * 100) / 100,
    eventCount: window.length,
  };
}

// ─── Cognitive Analysis Loop ────────────────────────────────
function startCognitiveAnalysisLoop() {
  cognitiveTimer = setInterval(async () => {
    const features = extractFeatures();
    if (!features) return;

    try {
      const http = require("http");
      const today = new Date().toISOString().split("T")[0];
      const body = JSON.stringify({
        user_id: currentUserId,
        typing_speed: features.typingSpeed,
        pause_frequency: features.pauseFrequency,
        backspace_ratio: features.backspaceRatio,
        burst_score: features.burstScore,
        raw_event_count: features.eventCount,
        session_date: today,
      });

      const data = await new Promise((resolve, reject) => {
        const req = http.request(
          {
            hostname: "localhost",
            port: 8001,
            path: "/api/cognitive/analyze",
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

      lastCognitiveState = data.state;

      if (data.state === "fatigued" || data.state === "frustrated") {
        vscode.window
          .showWarningMessage(
            `MindFlow ${data.emoji}: ${data.state.toUpperCase()} — ${data.message}`,
            "Take a Break",
            "Dismiss",
          )
          .then((action) => {
            if (action === "Take a Break") {
              vscode.env.openExternal(
                vscode.Uri.parse("http://localhost:3000/dashboard"),
              );
            }
          });
      }

      if (provider && provider._view) {
        provider._view.webview.postMessage({
          command: "cognitiveState",
          state: data.state,
          confidence: data.confidence,
          emoji: data.emoji,
        });
      }
    } catch (err) {
      // silent fail
    }
  }, 60 * 1000);
}

// ─── Adaptive Check-in System ──────────────────────────────
function getNextCheckinInterval(energyLevel) {
  const baseMinutes = energyLevel === 3 ? 90 : energyLevel === 2 ? 45 : 20;
  const jitter = Math.floor(Math.random() * 10) - 5;
  const totalMinutes = Math.max(10, baseMinutes + jitter);
  return totalMinutes * 60 * 1000;
}

function scheduleNextCheckin(energyLevel) {
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
    scheduleNextCheckin(3);
    return;
  }

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

  lastEnergyLevel = energyPick.value;

  try {
    const today = new Date().toISOString().split("T")[0];
    const data = await new Promise((resolve, reject) => {
      const http = require("http");
      const body = JSON.stringify({
        user_id: currentUserId,
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
          port: 8001,
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

  scheduleNextCheckin(energyPick.value);
}

function getBurnoutEmoji(score) {
  if (score === "High") return "🔴";
  if (score === "Medium") return "🟡";
  return "🟢";
}

// ─── Webview Panel ─────────────────────────────────────────
class MindFlowPanel {
  constructor(extensionUri, context) {
    this.extensionUri = extensionUri;
    this.context = context; // ← context passed in
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._getHtml();

    // Load saved user ID and send to webview
    const savedId = this.context.globalState.get("mindflow_user_id");
    if (savedId) currentUserId = savedId;
    setTimeout(() => {
      webviewView.webview.postMessage({
        command: "loadedUserId",
        userId: savedId || null,
      });
    }, 500);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      // ── Settings commands ──────────────────────────────
      if (message.command === "saveUserId") {
        this.context.globalState.update("mindflow_user_id", message.userId);
        currentUserId = message.userId;
        return;
      }

      if (message.command === "clearUserId") {
        this.context.globalState.update("mindflow_user_id", null);
        currentUserId = "vscode_user";
        return;
      }

      if (message.command === "testConnection") {
        const http = require("http");
        const req = http.request(
          { hostname: "localhost", port: 8001, path: "/", method: "GET" },
          () => {
            webviewView.webview.postMessage({
              command: "connectionResult",
              success: true,
            });
          },
        );
        req.on("error", () => {
          webviewView.webview.postMessage({
            command: "connectionResult",
            success: false,
          });
        });
        req.end();
        return;
      }

      if (message.command === "openDashboard") {
        vscode.env.openExternal(
          vscode.Uri.parse("http://localhost:3000/dashboard"),
        );
        return;
      }

      // ── Ask command ────────────────────────────────────
      if (message.command === "ask") {
        try {
          const http = require("http");
          const body = JSON.stringify({
            question: message.question,
            mode: message.mode,
            burnout_score: message.burnout_score,
            code_context: message.code_context || "",
          });
          const data = await new Promise((resolve, reject) => {
            const req = http.request(
              {
                hostname: "localhost",
                port: 8001,
                path: "/api/ask",
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
              "Cannot connect to MindFlow backend. Make sure it is running on port 8001.",
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

// ─── AI Autocomplete Provider ──────────────────────────────
function registerAutocompleteProvider(context) {
  let debounceTimer = null;

  const provider = vscode.languages.registerInlineCompletionItemProvider(
    { pattern: "**" },
    {
      provideInlineCompletionItems(document, position) {
        return new Promise((resolve) => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(async () => {
            try {
              const http = require("http");
              const startLine = Math.max(0, position.line - 50);
              const range = new vscode.Range(
                new vscode.Position(startLine, 0),
                position,
              );
              const codeContext = document.getText(range);
              const cursorLine = document.lineAt(position.line).text;
              const language = document.languageId;

              const body = JSON.stringify({
                code_context: codeContext,
                language: language,
                cognitive_state: lastCognitiveState,
                cursor_line: cursorLine,
              });

              const data = await new Promise((res, rej) => {
                const req = http.request(
                  {
                    hostname: "localhost",
                    port: 8001,
                    path: "/api/autocomplete",
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Content-Length": Buffer.byteLength(body),
                    },
                  },
                  (response) => {
                    let raw = "";
                    response.on("data", (chunk) => (raw += chunk));
                    response.on("end", () => res(JSON.parse(raw)));
                  },
                );
                req.on("error", rej);
                req.write(body);
                req.end();
              });

              if (data.suggestion && data.suggestion.trim()) {
                const item = new vscode.InlineCompletionItem(
                  data.suggestion,
                  new vscode.Range(position, position),
                );
                resolve({ items: [item] });
              } else {
                resolve({ items: [] });
              }
            } catch (err) {
              resolve({ items: [] });
            }
          }, 1500);
        });
      },
    },
  );

  context.subscriptions.push(provider);
}

// ─── Activate ──────────────────────────────────────────────
function activate(context) {
  provider = new MindFlowPanel(context.extensionUri, context); // ← pass context
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("mindflow.panel", provider),
  );

  startKeystrokeTracker(context);
  registerAutocompleteProvider(context);
  startCognitiveAnalysisLoop();

  sessionStartTime = Date.now();
  scheduleNextCheckin(3);

  context.subscriptions.push(
    vscode.commands.registerCommand("mindflow.testCheckin", () => {
      showCheckinPopup();
    }),
  );

  vscode.window.showInformationMessage(
    "MindFlow activated 🧠 — adaptive check-ins enabled. First check-in in ~90 minutes.",
  );

  console.log("MindFlow: extension activated.");
}

// ─── Deactivate ────────────────────────────────────────────
function deactivate() {
  if (cognitiveTimer) {
    clearInterval(cognitiveTimer);
    cognitiveTimer = null;
  }
  if (checkinTimer) {
    clearTimeout(checkinTimer);
    checkinTimer = null;
  }
  console.log("MindFlow: extension deactivated.");
}

module.exports = { activate, deactivate };
