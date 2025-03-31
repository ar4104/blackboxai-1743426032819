'use strict';

const { randomInt } = require('./utils');
const logger = require('./logger');

const learning = require('./learning-engine');

async function humanLikeActions(page) {
  try {
    const sessionData = {
      mouseMovements: [],
      scrolls: [],
      clicks: [],
      timestamp: Date.now()
    };

    // Случайные движения мыши (2-5 движений)
    const mouseMoves = randomInt(2, 5);
    for (let i = 0; i < mouseMoves; i++) {
      const x = randomInt(100, 700);
      const y = randomInt(100, 500);
      const steps = randomInt(5, 15);
      const delay = randomInt(200, 800);
      
      await page.mouse.move(x, y, { steps });
      await page.waitForTimeout(delay);
      
      sessionData.mouseMovements.push({ x, y, steps, delay, timestamp: Date.now() });
    }

    // Случайные скроллы (1-3 скролла)
    const scrolls = randomInt(1, 3);
    for (let i = 0; i < scrolls; i++) {
      const amount = randomInt(-300, 300);
      const delay = randomInt(500, 1500);
      
      await page.evaluate((scrollAmount) => {
        window.scrollBy({
          top: scrollAmount,
          left: 0,
          behavior: 'smooth'
        });
      }, amount);
      await page.waitForTimeout(delay);
      
      sessionData.scrolls.push({ amount, delay, timestamp: Date.now() });
    }

    // Случайные клики по элементам (50% вероятность)
    if (Math.random() > 0.5) {
      const clickable = await page.$$('a, button, input[type=submit]');
      if (clickable.length > 0) {
        const element = clickable[randomInt(0, clickable.length - 1)];
        const delay = randomInt(1000, 3000);
        
        await element.click();
        await page.waitForTimeout(delay);
        
        const rect = await element.boundingBox();
        sessionData.clicks.push({
          x: rect.x + rect.width/2,
          y: rect.y + rect.height/2,
          delay,
          timestamp: Date.now()
        });
      }
    }

    // Финальная задержка (1-5 секунд)
    const finalDelay = randomInt(1000, 5000);
    await page.waitForTimeout(finalDelay);
    
    // Сохраняем сессию и анализируем
    learning.savePattern(sessionData);
    const stats = learning.analyzeSession(sessionData);
    
    logger.log(`Human-like actions completed. Stats: ${JSON.stringify(stats)}`, 'info');
  } catch (error) {
    logger.log(`Human-like actions failed: ${error.message}`, 'error');
    throw error;
  }
}

module.exports = { humanLikeActions };