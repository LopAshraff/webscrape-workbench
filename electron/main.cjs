const { app, BrowserWindow, dialog } = require("electron");
const path = require("node:path");
const { fork } = require("node:child_process");

let mainWindow;
let serverProcess;
let serverPort;

app.whenReady().then(async () => {
  try {
    serverPort = await startServer();
    await waitForServer(serverPort);
    createWindow(serverPort);
  } catch (error) {
    dialog.showErrorBox("Webscrape Workbench", error.message || String(error));
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(serverPort);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopServer();
});

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 920,
    minWidth: 1080,
    minHeight: 760,
    backgroundColor: "#f6f3ed",
    autoHideMenuBar: true,
    title: "Webscrape Workbench",
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);
}

function startServer() {
  return new Promise((resolve, reject) => {
    const entry = path.join(__dirname, "..", "src", "app-server.js");
    serverProcess = fork(entry, [], {
      env: {
        ...process.env,
        PORT: "0"
      },
      silent: true
    });

    let settled = false;
    let stdoutBuffer = "";
    const finish = callback => value => {
      if (settled) return;
      settled = true;
      callback(value);
    };

    serverProcess.once("error", finish(reject));
    serverProcess.stderr.on("data", chunk => {
      const text = chunk.toString();
      if (!settled && text.trim()) {
        finish(reject)(new Error(text.trim()));
      }
    });
    serverProcess.stdout.on("data", chunk => {
      stdoutBuffer += chunk.toString();
      const match = stdoutBuffer.match(/webscrape UI on http:\/\/localhost:(\d+)/);
      if (match) {
        finish(resolve)(Number(match[1]));
      }
    });
    serverProcess.once("exit", code => {
      if (!settled) {
        finish(reject)(new Error(`App server exited early with code ${code}`));
      }
    });
  });
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
}

function waitForServer(port) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/health`);
        if (response.ok) {
          resolve();
          return;
        }
      } catch {}

      if (Date.now() - start > 15000) {
        reject(new Error("Timed out while starting the local app server."));
        return;
      }

      setTimeout(attempt, 250);
    };

    attempt();
  });
}
