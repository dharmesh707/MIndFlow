const vscode = require("vscode");

// This function runs once when VS Code loads your extension
function activate(context) {
  // Register our sidebar panel as a webview
  const provider = new MindFlowPanel(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "mindflow.panel", // must match the id in package.json
      provider,
    ),
  );
}

class MindFlowPanel {
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
  }

  // VS Code calls this automatically when the panel becomes visible
  resolveWebviewView(webviewView) {
    this._view = webviewView;

    // Allow the webview to run scripts and make fetch calls
    webviewView.webview.options = {
      enableScripts: true,
    };

    // Load the HTML file into the webview
    webviewView.webview.html = this._getHtml();

    // Listen for messages sent from the HTML page
    // When user clicks Ask, the HTML sends a message here
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "ask") {
        try {
          // Call your MindFlow backend
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

          // Send the answer back to the HTML page to display
          webviewView.webview.postMessage({
            command: "response",
            answer: data.answer,
            grounded: data.grounded,
            mode_used: data.mode_used,
          });
        } catch (error) {
          // If backend is not running, show a clear error
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
    // Read and return the HTML file content
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

function deactivate() {}

module.exports = { activate, deactivate };
