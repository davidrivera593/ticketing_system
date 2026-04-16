const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../logs");
const logFilePath = path.join(logsDir, "app.log");

const ensureLogFile = () => {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, "", "utf8");
  }
};

const writeLog = (level, message, meta = null) => {
  ensureLogFile();

  const timestamp = new Date().toISOString();
  const metaText = meta ? ` ${JSON.stringify(meta)}` : "";
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaText}\n`;

  if (level === "error") {
    console.error(line.trim());
  } else {
    console.log(line.trim());
  }

  fs.appendFileSync(logFilePath, line, "utf8");
};

const logger = {
  info: (message, meta) => writeLog("info", message, meta),
  warn: (message, meta) => writeLog("warn", message, meta),
  error: (message, meta) => writeLog("error", message, meta),
};

module.exports = logger;