'use strict';

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { humanLikeActions } = require('./human-actions');
const logger = require('./logger');
const devices = require('./devices.json');
const proxies = require('./proxy-list.json');

puppeteer.use(StealthPlugin());

class Bot {
  constructor(id) {
    this.id = id;
    this.browser = null;
    this.page = null;
    this.status = 'ready';
    this.completedTasks = 0;
    this.currentProxy = this.selectProxy();
    this.currentDevice = this.selectDevice();
  }

  selectProxy() {
    return proxies.proxies[Math.floor(Math.random() * proxies.proxies.length)];
  }

  selectDevice() {
    return devices.profiles[Math.floor(Math.random() * devices.profiles.length)];
  }

  async init() {
    try {
      const proxyConfig = this.currentProxy.type === 'socks5'
        ? `socks5://${this.currentProxy.host}:${this.currentProxy.port}`
        : `http://${this.currentProxy.host}:${this.currentProxy.port}`;

      this.browser = await puppeteer.launch({
        headless: process.env.PUPPETEER_HEADLESS !== 'false',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          `--proxy-server=${proxyConfig}`
        ],
        timeout: 30000
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(this.currentDevice.userAgent);
      await this.page.setViewport(this.currentDevice.viewport);
      
      if (this.currentDevice.touchSupport) {
        await this.page.emulate(puppeteer.devices['iPhone X']);
      }

      logger.log(`Bot ${this.id} initialized with ${this.currentDevice.name} and ${this.currentProxy.host}`, 'success');
      return true;
    } catch (error) {
      logger.log(`Bot ${this.id} init error: ${error.message}`, 'error');
      throw error;
    }
  }

  async performTask(taskSteps, humanLike = true) {
    if (!this.browser || !this.page) {
      throw new Error('Bot not initialized');
    }

    this.status = 'working';
    try {
      for (const step of taskSteps) {
        await this.page.goto(step.url, {
          waitUntil: 'networkidle2',
          timeout: 60000
        });

        if (humanLike) {
          await humanLikeActions(this.page);
        }

        const delay = step.duration * 1000 || 
          Math.random() * 5000 + 3000; // 3-8 sec default delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      this.completedTasks++;
      logger.log(`Bot ${this.id} completed task`, 'success');
    } catch (error) {
      logger.log(`Bot ${this.id} task error: ${error.message}`, 'error');
      throw error;
    } finally {
      this.status = 'ready';
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

class BotsManager {
  constructor() {
    this.bots = [];
    this.maxBots = parseInt(process.env.MAX_BOTS) || 10;
    this.completedTasks = 0;
  }

  async createBot(id) {
    if (this.bots.length >= this.maxBots) {
      throw new Error(`Maximum bots limit reached (${this.maxBots})`);
    }

    const bot = new Bot(id);
    await bot.init();
    this.bots.push(bot);
    return bot;
  }

  getActiveBots() {
    return this.bots.filter(bot => bot.status === 'working');
  }

  getActiveBotsCount() {
    return this.getActiveBots().length;
  }

  async shutdownAll() {
    await Promise.all(this.bots.map(bot => bot.close()));
    this.bots = [];
  }
}

module.exports = { Bot, BotsManager };