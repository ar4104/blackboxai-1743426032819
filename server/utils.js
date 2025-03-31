const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Генерация случайного числа в диапазоне
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Проверка и создание директории, если не существует
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Валидация URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

// Очистка строки от XSS
const sanitizeString = (str) => {
  return str.replace(/</g, '<').replace(/>/g, '>');
};

// Форматирование времени
const formatTime = (ms) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};

// Генерация уникального ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

module.exports = {
  randomInt,
  ensureDirectoryExists,
  isValidUrl,
  sanitizeString,
  formatTime,
  generateId
};