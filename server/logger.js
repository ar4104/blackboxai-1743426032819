const fs = require('fs');
const path = require('path');
const { formatTime, generateId } = require('./utils');

class Logger {
  constructor(logDir = 'logs') {
    this.logDir = logDir;
    this.ensureLogDirectory();
    this.logFile = path.join(this.logDir, 'activity.log');
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(message, type = 'info', botId = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: generateId(),
      timestamp,
      type,
      botId,
      message
    };

    // Запись в файл
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');

    // Вывод в консоль
    const coloredMessage = this.getColoredMessage(type, message);
    console.log(`[${timestamp}] ${coloredMessage}`);
  }

  getColoredMessage(type, message) {
    const colors = {
      info: '\x1b[36m', // голубой
      success: '\x1b[32m', // зеленый
      warning: '\x1b[33m', // желтый
      error: '\x1b[31m' // красный
    };
    const resetColor = '\x1b[0m';
    return `${colors[type] || ''}${message}${resetColor}`;
  }

  getLogs(limit = 100) {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }

    const logData = fs.readFileSync(this.logFile, 'utf8');
    const logs = logData
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    return logs.slice(-limit);
  }

  clearLogs() {
    if (fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }
  }
}

module.exports = new Logger();