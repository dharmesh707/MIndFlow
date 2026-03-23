const vscode = require("vscode");

let keystrokes = [];
let sessionAvgSpeed = null;
let highLoadStreak = 0;
let analysisTimer = null;

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

  const score = [speedDropped, tooManyPauses, highErrorRate].filter(Boolean).length;

  if (score >= 2) return "high";
  if (score === 1) return "medium";
  return "low";
}

function startAnalysisLoop() {
  analysisTimer = setInterval(() => {
    const load = analyzePatterns();

    // DEBUG: shows current load level every 10 seconds — remove before final submission
    vscode.window.showInformationMessage(
      `MindFlow debug: load = ${load}, streak = ${highLoadStreak}`
    );

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
          "Dismiss"
        )
        .then((selection) => {
          if (selection === "Log Check-in") {
            vscode.commands.executeCommand("mindflow.panel.focus");
          }
        });
    }
  }, 90 * 1000);
  //}, 10 * 1000); // 10 seconds for testing — change to 90 * 1000 before submission
}

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
            message: "Cannot connect to MindFlow backend. Make sure it is running on port 8000.",
          });
        }
      }
    });
  }

  _getHtml() {
    const fs = require("fs");
    const path = require("path");
    const htmlPath = path.join(this.extensionUri.fsPath, "webview", "index.html");
    return fs.readFileSync(htmlPath, "utf8");
  }
}

function activate(context) {
  const provider = new MindFlowPanel(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("mindflow.panel", provider)
  );
  startKeystrokeTracker(context);
  startAnalysisLoop();
  console.log("MindFlow: extension activated (panel + passive burnout detector).");
}

function deactivate() {
  if (analysisTimer) {
    clearInterval(analysisTimer);
    analysisTimer = null;
  }
  console.log("MindFlow: extension deactivated.");
}

module.exports = { activate, deactivate };