require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const apiRouter = require('./routes/api');
const { handleErrors } = require('./error-handler');
const logger = require('./logger');
const { BotsManager } = require('./bots');
const botsManager = new BotsManager();

const app = express();
const upload = multer({ dest: 'public/uploads/' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Логирование запросов
app.use((req, res, next) => {
  logger.log(`${req.method} ${req.path}`, 'info');
  next();
});

// Основные роуты
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API роуты
app.use('/api', apiRouter);

// Управление ботами
app.get('/bots', (req, res) => {
  try {
    const bots = botsManager.bots.map(bot => ({
      id: bot.id,
      status: bot.status,
      device: bot.currentDevice?.name || 'unknown',
      proxy: bot.currentProxy?.host || 'none',
      tasksCompleted: bot.completedTasks
    }));
    res.json(bots);
  } catch (error) {
    logger.log(`Bots list error: ${error.message}`, 'error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Загрузка файлов
app.post('/api/upload', upload.array('images'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new Error('Файлы не были загружены');
    }
    
    const fileUrls = req.files.map(f => `/uploads/${f.filename}`);
    logger.log(`Загружено ${fileUrls.length} изображений`, 'success');
    
    res.json({ 
      status: 'success',
      message: 'Изображения загружены',
      files: fileUrls
    });
  } catch (error) {
    logger.log(`Ошибка загрузки: ${error.message}`, 'error');
    throw error;
  }
});

// Обработка ошибок
app.use(handleErrors);

// Инициализация сервера
const PORT = process.env.APP_PORT || 8000;
const server = app.listen(PORT, () => {
  logger.log(`Server started on port ${PORT}`, 'success');
});

// Обработка завершения работы
process.on('SIGTERM', () => {
  logger.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.log('Server closed'); 
    process.exit(0);
  });
});

// Обработка неотловленных ошибок
process.on('unhandledRejection', (err) => {
  logger.log(`Unhandled Rejection: ${err.message}`, 'error');
  server.close(() => process.exit(1));
});
