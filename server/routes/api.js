const express = require('express');
const router = express.Router();
const { BotsManager } = require('../bots');
const logger = require('../logger');
const { AppError } = require('../error-handler');
const { isValidUrl, randomInt, sanitizeString } = require('../utils');

const botsManager = new BotsManager();

// Маршрут для получения статистики
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      activeBots: botsManager.getActiveBotsCount(),
      totalBots: botsManager.bots.length,
      completedTasks: botsManager.completedTasks
    };
    res.json(stats);
  } catch (error) {
    logger.log(`Ошибка при получении статистики: ${error.message}`, 'error');
    throw new AppError('Не удалось получить статистику', 500);
  }
});

// Маршрут для создания задачи
router.post('/create-task', async (req, res) => {
  const { taskText, botCount = 1, humanLike = true } = req.body;

  if (!taskText) {
    throw new AppError('Текст задачи обязателен', 400);
  }

  try {
    const sanitizedText = sanitizeString(taskText);
    const taskSteps = parseTask(sanitizedText);
    const startedBots = [];

    // Ограничиваем максимальное количество ботов
    const botsToStart = Math.min(parseInt(botCount), 10);
    
    for (let i = 0; i < botsToStart; i++) {
      const bot = botsManager.createBot(`bot-${Date.now()}-${i}`);
      await bot.init();
      bot.performTask(taskSteps, humanLike);
      startedBots.push(bot.id);
    }

    logger.log(`Создана новая задача: "${sanitizedText.substring(0, 50)}..."`, 'info');
    res.json({
      status: 'success',
      started: startedBots.length,
      task: sanitizedText
    });
  } catch (error) {
    logger.log(`Ошибка создания задачи: ${error.message}`, 'error');
    throw new AppError(`Ошибка создания задачи: ${error.message}`, 500);
  }
});

// Маршрут для получения логов
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const logs = logger.getLogs(limit * page).slice(0, limit);
    res.json({
      status: 'success',
      results: logs.length,
      logs
    });
  } catch (error) {
    throw new AppError('Не удалось получить логи', 500);
  }
});

// Парсинг задачи из текста
function parseTask(taskText) {
  // Реализация парсинга задачи
  // ...
  return [];
}

module.exports = router;