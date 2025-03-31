const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class LearningEngine {
  constructor() {
    this.patterns = [];
    this.patternFile = path.join(__dirname, 'patterns.json');
    this.loadPatterns();
  }

  loadPatterns() {
    try {
      if (fs.existsSync(this.patternFile)) {
        const data = fs.readFileSync(this.patternFile, 'utf8');
        this.patterns = JSON.parse(data);
        logger.log(`Loaded ${this.patterns.length} behavior patterns`, 'info');
      } else {
        fs.writeFileSync(this.patternFile, '[]');
        logger.log('Created new patterns file', 'info');
      }
    } catch (error) {
      logger.log(`Error loading patterns: ${error.message}`, 'error');
      throw error;
    }
  }

  savePattern(pattern) {
    try {
      this.patterns.push(pattern);
      fs.writeFileSync(this.patternFile, JSON.stringify(this.patterns, null, 2));
      logger.log('Saved new behavior pattern', 'debug');
    } catch (error) {
      logger.log(`Error saving pattern: ${error.message}`, 'error');
      throw error;
    }
  }

  generateBehavior() {
    if (this.patterns.length === 0) {
      return null;
    }

    // Select random pattern as base
    const basePattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
    
    // Add small variations to the pattern
    const variation = {
      ...basePattern,
      mouseMovements: basePattern.mouseMovements?.map(move => ({
        ...move,
        x: move.x + Math.floor(Math.random() * 20) - 10,
        y: move.y + Math.floor(Math.random() * 20) - 10,
        delay: Math.max(100, move.delay + Math.floor(Math.random() * 200) - 100)
      })) || [],
      scrolls: basePattern.scrolls?.map(scroll => ({
        ...scroll,
        amount: scroll.amount + Math.floor(Math.random() * 100) - 50,
        delay: Math.max(300, scroll.delay + Math.floor(Math.random() * 300) - 150)
      })) || []
    };

    return variation;
  }

  analyzeSession(sessionData) {
    const stats = {
      avgMovementSpeed: 0,
      clickFrequency: 0,
      scrollFrequency: 0,
      totalActions: 0
    };

    if (!sessionData) return stats;

    // Calculate mouse movement statistics
    if (sessionData.mouseMovements?.length > 1) {
      let totalDistance = 0;
      let totalTime = 0;
      
      for (let i = 1; i < sessionData.mouseMovements.length; i++) {
        const prev = sessionData.mouseMovements[i-1];
        const curr = sessionData.mouseMovements[i];
        
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const time = curr.timestamp - prev.timestamp;
        
        totalDistance += distance;
        totalTime += time;
      }
      
      stats.avgMovementSpeed = totalTime > 0 ? totalDistance / totalTime : 0;
      stats.totalActions += sessionData.mouseMovements.length;
    }

    // Calculate click statistics
    if (sessionData.clicks) {
      stats.clickFrequency = sessionData.clicks.length;
      stats.totalActions += sessionData.clicks.length;
    }

    // Calculate scroll statistics
    if (sessionData.scrolls) {
      stats.scrollFrequency = sessionData.scrolls.length;
      stats.totalActions += sessionData.scrolls.length;
    }

    return stats;
  }

  getPatternStats() {
    return {
      totalPatterns: this.patterns.length,
      lastUpdated: this.patterns.length > 0 
        ? new Date(Math.max(...this.patterns.map(p => p.timestamp)))
        : null
    };
  }
}

module.exports = new LearningEngine();
