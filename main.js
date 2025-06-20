import './style.css'

// 游戏状态
const GameState = {
  MENU: 'menu',
  PLAYING: 'playing',
  GAME_OVER: 'gameOver',
  INSTRUCTIONS: 'instructions'
};

// 游戏配置
const CONFIG = {
  CANVAS_WIDTH: window.innerWidth,
  CANVAS_HEIGHT: window.innerHeight,
  PLAYER_SPEED: 10,  // 增加玩家初始速度
  BULLET_SPEED: 16, // 增加子弹初始速度
  ENEMY_SPEED: 5,   // 增加敌人初始速度
  PARTICLE_COUNT: 50,
  POWER_UP_CHANCE: 0.15,
  SOUND_ENABLED: true,
  BOSS_SPAWN_SCORE: 1000, // Boss出现分数
  METEOR_CHANCE: 0.02, // 陨石出现概率
  ACHIEVEMENT_STORAGE_KEY: 'space_explorer_achievements',
  HIGH_SCORE_KEY: 'space_explorer_high_score',
  GAME_SPEED_MULTIPLIER: 1.0 // 游戏速度倍率
};

// 武器类型
const WeaponType = {
  NORMAL: 'normal',
  LASER: 'laser',
  MISSILE: 'missile',
  SHOTGUN: 'shotgun',
  PLASMA: 'plasma'
};

// 武器升级类型
const WeaponUpgradeType = {
  DAMAGE: 'damage',      // 伤害升级
  SPEED: 'speed',        // 射速升级
  RANGE: 'range',        // 射程升级
  SPREAD: 'spread',      // 散射升级
  PENETRATION: 'penetration' // 穿透升级
};

// 武器升级配置
const WeaponUpgradeConfig = {
  [WeaponType.NORMAL]: {
    maxLevel: 5,
    upgrades: {
      [WeaponUpgradeType.DAMAGE]: { maxLevel: 3, damageMultiplier: [1, 1.5, 2, 2.5] },
      [WeaponUpgradeType.SPEED]: { maxLevel: 3, cooldownMultiplier: [1, 0.8, 0.6, 0.4] },
      [WeaponUpgradeType.SPREAD]: { maxLevel: 2, bulletCount: [1, 2, 3] }
    }
  },
  [WeaponType.LASER]: {
    maxLevel: 4,
    upgrades: {
      [WeaponUpgradeType.DAMAGE]: { maxLevel: 3, damageMultiplier: [1, 1.3, 1.7, 2.2] },
      [WeaponUpgradeType.RANGE]: { maxLevel: 2, lengthMultiplier: [1, 1.5, 2] },
      [WeaponUpgradeType.PENETRATION]: { maxLevel: 2, pierceCount: [1, 2, 3] }
    }
  },
  [WeaponType.MISSILE]: {
    maxLevel: 4,
    upgrades: {
      [WeaponUpgradeType.DAMAGE]: { maxLevel: 3, damageMultiplier: [1, 1.4, 1.8, 2.3] },
      [WeaponUpgradeType.SPEED]: { maxLevel: 2, speedMultiplier: [1, 1.3, 1.6] },
      [WeaponUpgradeType.SPREAD]: { maxLevel: 2, bulletCount: [1, 2, 3] }
    }
  },
  [WeaponType.SHOTGUN]: {
    maxLevel: 4,
    upgrades: {
      [WeaponUpgradeType.DAMAGE]: { maxLevel: 3, damageMultiplier: [1, 1.2, 1.5, 1.8] },
      [WeaponUpgradeType.SPREAD]: { maxLevel: 3, bulletCount: [5, 7, 9, 12] },
      [WeaponUpgradeType.RANGE]: { maxLevel: 2, rangeMultiplier: [1, 1.3, 1.6] }
    }
  },
  [WeaponType.PLASMA]: {
    maxLevel: 4,
    upgrades: {
      [WeaponUpgradeType.DAMAGE]: { maxLevel: 3, damageMultiplier: [1, 1.3, 1.7, 2.1] },
      [WeaponUpgradeType.SPEED]: { maxLevel: 2, cooldownMultiplier: [1, 0.7, 0.5] },
      [WeaponUpgradeType.PENETRATION]: { maxLevel: 2, pierceCount: [1, 2, 4] }
    }
  }
};

// 敌人类型扩展
const EnemyType = {
  BASIC: 'basic',
  FAST: 'fast',
  TRACKER: 'tracker', // 追踪型
  DODGER: 'dodger',   // 闪避型
  BOSS: 'boss'
};

// 成就系统
const Achievements = {
  FIRST_KILL: { id: 'first_kill', name: '首次击杀', desc: '击败第一个敌人', reward: 100 },
  SCORE_1000: { id: 'score_1000', name: '新手猎手', desc: '达到1000分', reward: 200 },
  SCORE_5000: { id: 'score_5000', name: '太空战士', desc: '达到5000分', reward: 500 },
  BOSS_KILLER: { id: 'boss_killer', name: 'Boss终结者', desc: '击败Boss', reward: 1000 },
  WEAPON_MASTER: { id: 'weapon_master', name: '武器大师', desc: '使用所有武器类型', reward: 300 },
  SURVIVOR: { id: 'survivor', name: '生存专家', desc: '单局存活5分钟', reward: 400 }
};

// 音效系统
class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = CONFIG.SOUND_ENABLED;
    this.initSounds();
  }
  
  initSounds() {
    // 使用Web Audio API创建音效
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.createSounds();
  }
  
  createSounds() {
    // 创建射击音效
    this.sounds.shoot = this.createTone(800, 0.1, 'square');
    // 创建爆炸音效
    this.sounds.explosion = this.createNoise(0.3);
    // 创建能量球收集音效
    this.sounds.powerup = this.createTone(1200, 0.2, 'sine');
    // 创建碰撞音效
    this.sounds.hit = this.createTone(200, 0.2, 'sawtooth');
  }
  
  createTone(frequency, duration, type = 'sine') {
    return () => {
      if (!this.enabled) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }
  
  createNoise(duration) {
    return () => {
      if (!this.enabled) return;
      
      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    };
  }
  
  play(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName]();
    }
  }
  
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// 数据存储管理
class GameStorage {
  static saveHighScore(score) {
    const currentHigh = this.getHighScore();
    if (score > currentHigh) {
      localStorage.setItem(CONFIG.HIGH_SCORE_KEY, score.toString());
      return true;
    }
    return false;
  }
  
  static getHighScore() {
    return parseInt(localStorage.getItem(CONFIG.HIGH_SCORE_KEY) || '0');
  }
  
  static saveAchievement(achievementId) {
    const achievements = this.getAchievements();
    if (!achievements.includes(achievementId)) {
      achievements.push(achievementId);
      localStorage.setItem(CONFIG.ACHIEVEMENT_STORAGE_KEY, JSON.stringify(achievements));
      return true;
    }
    return false;
  }
  
  static getAchievements() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.ACHIEVEMENT_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }
  
  static hasAchievement(achievementId) {
    return this.getAchievements().includes(achievementId);
  }
}

// 成就管理器
class AchievementManager {
  constructor(game) {
    this.game = game;
    this.unlockedThisSession = [];
  }
  
  checkAchievements() {
    // 检查分数成就
    if (this.game.score >= 1000 && !GameStorage.hasAchievement('score_1000')) {
      this.unlockAchievement('score_1000');
    }
    if (this.game.score >= 5000 && !GameStorage.hasAchievement('score_5000')) {
      this.unlockAchievement('score_5000');
    }
    
    // 检查生存时间
    const survivalTime = Date.now() - this.game.gameStartTime;
    if (survivalTime >= 300000 && !GameStorage.hasAchievement('survivor')) { // 5分钟
      this.unlockAchievement('survivor');
    }
  }
  
  unlockAchievement(achievementId) {
    if (GameStorage.saveAchievement(achievementId)) {
      this.unlockedThisSession.push(achievementId);
      this.showAchievementNotification(achievementId);
      // 给予奖励
      const achievement = Object.values(Achievements).find(a => a.id === achievementId);
      if (achievement) {
        this.game.score += achievement.reward;
        this.game.updateUI();
      }
    }
  }
  
  showAchievementNotification(achievementId) {
    const achievement = Object.values(Achievements).find(a => a.id === achievementId);
    if (achievement) {
      // 创建通知元素
      const notification = document.createElement('div');
      notification.className = 'achievement-notification';
      notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-text">
          <div class="achievement-title">${achievement.name}</div>
          <div class="achievement-desc">${achievement.desc}</div>
          <div class="achievement-reward">+${achievement.reward}分</div>
        </div>
      `;
      document.body.appendChild(notification);
      
      // 3秒后移除
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;
      this.state = GameState.MENU;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.combo = 0;
    this.maxCombo = 0;
    this.gameStartTime = 0;
    this.bossSpawned = false;
    this.currentWeapon = WeaponType.NORMAL;
    
    // 初始化音效系统
    this.soundManager = new SoundManager();
    this.achievementManager = new AchievementManager(this);
      this.player = new Player(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 100);
    this.player.upgradePoints = 3; // 给玩家3个初始升级点数
    
    // 初始化游戏对象数组
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerUps = [];
    this.meteors = [];
    this.bosses = [];
    this.stars = [];
    
    this.keys = {};
    this.lastEnemySpawn = 0;
    this.enemySpawnRate = 2000; // 2秒
    
    this.initializeStars();
    this.setupEventListeners();
    this.setupUI();
    
    this.gameLoop();
  }
  
  initializeStars() {
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.5
      });
    }
  }
  
  setupEventListeners() {    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.state === GameState.PLAYING) {
          this.player.shoot(this.bullets);
        }
      }
        // 武器切换快捷键
      if (this.state === GameState.PLAYING) {
        switch (e.code) {
          case 'Digit1':
            this.player.weaponType = WeaponType.NORMAL;
            this.updateUI();
            break;
          case 'Digit2':
            if (this.player.weaponAmmo[WeaponType.LASER] > 0) {
              this.player.weaponType = WeaponType.LASER;
              this.updateUI();
            }
            break;
          case 'Digit3':
            if (this.player.weaponAmmo[WeaponType.MISSILE] > 0) {
              this.player.weaponType = WeaponType.MISSILE;
              this.updateUI();
            }
            break;
          case 'Digit4':
            this.player.weaponType = WeaponType.SHOTGUN;
            this.updateUI();
            break;
          case 'Digit5':
            if (this.player.weaponAmmo[WeaponType.PLASMA] > 0) {
              this.player.weaponType = WeaponType.PLASMA;
              this.updateUI();
            }
            break;          // 游戏速度调节 (调试功能)
          case 'Equal': // + 键加速
            CONFIG.GAME_SPEED_MULTIPLIER = Math.min(Math.round((CONFIG.GAME_SPEED_MULTIPLIER + 0.1) * 10) / 10, 2.0);
            console.log('游戏速度:', CONFIG.GAME_SPEED_MULTIPLIER.toFixed(1) + 'x');
            this.updateUI();
            break;
          case 'Minus': // - 键减速
            CONFIG.GAME_SPEED_MULTIPLIER = Math.max(Math.round((CONFIG.GAME_SPEED_MULTIPLIER - 0.1) * 10) / 10, 0.1);
            console.log('游戏速度:', CONFIG.GAME_SPEED_MULTIPLIER.toFixed(1) + 'x');
            this.updateUI();
            break;
          case 'Digit0': // 0 键重置速度
            CONFIG.GAME_SPEED_MULTIPLIER = 1.0;
            console.log('游戏速度重置为: 1.0x');
            this.updateUI();
            break;
          
          // 武器升级快捷键
          case 'KeyQ': // Q 键升级伤害
            if (this.player.upgradeWeapon(this.player.weaponType, WeaponUpgradeType.DAMAGE)) {
              console.log(`${this.player.weaponType} 伤害升级成功!`);
              this.updateUI();
            } else {
              console.log('升级失败：升级点数不足或已达最大等级');
            }
            break;
          case 'KeyE': // E 键升级射速
            if (this.player.upgradeWeapon(this.player.weaponType, WeaponUpgradeType.SPEED)) {
              console.log(`${this.player.weaponType} 射速升级成功!`);
              this.updateUI();
            } else {
              console.log('升级失败：升级点数不足或已达最大等级');
            }
            break;
          case 'KeyR': // R 键升级散射/射程
            const upgradeType = [WeaponType.NORMAL, WeaponType.MISSILE, WeaponType.SHOTGUN].includes(this.player.weaponType) 
              ? WeaponUpgradeType.SPREAD : WeaponUpgradeType.RANGE;
            
            if (this.player.upgradeWeapon(this.player.weaponType, upgradeType)) {
              console.log(`${this.player.weaponType} ${upgradeType === WeaponUpgradeType.SPREAD ? '散射' : '射程'}升级成功!`);
              this.updateUI();
            } else {
              console.log('升级失败：升级点数不足或已达最大等级');
            }
            break;
          case 'KeyT': // T 键升级穿透（仅激光和等离子）
            if ([WeaponType.LASER, WeaponType.PLASMA].includes(this.player.weaponType)) {
              if (this.player.upgradeWeapon(this.player.weaponType, WeaponUpgradeType.PENETRATION)) {
                console.log(`${this.player.weaponType} 穿透升级成功!`);
                this.updateUI();
              } else {
                console.log('升级失败：升级点数不足或已达最大等级');
              }
            }
            break;
        }
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      CONFIG.CANVAS_WIDTH = window.innerWidth;
      CONFIG.CANVAS_HEIGHT = window.innerHeight;
    });
  }
  
  setupUI() {
    document.getElementById('startBtn').addEventListener('click', () => {
      this.startGame();
    });
    
    document.getElementById('instructionsBtn').addEventListener('click', () => {
      this.showInstructions();
    });
    
    document.getElementById('backBtn').addEventListener('click', () => {
      this.showMenu();
    });
    
    document.getElementById('restartBtn').addEventListener('click', () => {
      this.startGame();
    });
      document.getElementById('menuBtn').addEventListener('click', () => {
      this.showMenu();
    });
    
    document.getElementById('soundToggle').addEventListener('click', () => {
      const enabled = this.soundManager.toggle();
      document.getElementById('soundStatus').textContent = enabled ? '开启' : '关闭';
    });
  }
    startGame() {
    this.state = GameState.PLAYING;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.combo = 0;
    this.maxCombo = 0;
    this.gameStartTime = Date.now();
    this.bossSpawned = false;
    this.currentWeapon = WeaponType.NORMAL;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerUps = [];
    this.meteors = [];
    this.bosses = [];
    this.player = new Player(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 100);
    this.player.upgradePoints = 3; // 给玩家3个初始升级点数
    this.lastEnemySpawn = 0;
    
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('instructionsScreen').classList.add('hidden');
    
    this.updateUI();
    
    // 记录游戏开始时间
    this.gameStartTime = Date.now();
  }
  
  showMenu() {
    this.state = GameState.MENU;
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('instructionsScreen').classList.add('hidden');
  }
  
  showInstructions() {
    this.state = GameState.INSTRUCTIONS;
    document.getElementById('instructionsScreen').classList.remove('hidden');
    document.getElementById('menu').classList.add('hidden');
  }
    gameOver() {
    this.state = GameState.GAME_OVER;
    
    // 检查是否刷新最高分
    const isNewRecord = GameStorage.saveHighScore(this.score);
    if (isNewRecord) {
      document.getElementById('finalScore').innerHTML = `${this.score} <span style="color: #FFD700;">🏆 新记录!</span>`;
    } else {
      document.getElementById('finalScore').textContent = this.score;
    }
    
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    // 创建爆炸效果
    this.createExplosion(this.player.x, this.player.y, 20);
    this.soundManager.play('explosion');
    
    // 检查并保存最高分
    GameStorage.saveHighScore(this.score);
    
    // 检查成就
    this.achievementManager.checkAchievements();
  }  updateUI() {
    try {
      if (document.getElementById('scoreValue')) {
        document.getElementById('scoreValue').textContent = this.score;
      }
      if (document.getElementById('livesValue')) {
        document.getElementById('livesValue').textContent = this.lives;
      }
      if (document.getElementById('levelValue')) {
        document.getElementById('levelValue').textContent = this.level;
      }
      if (document.getElementById('shieldValue')) {
        document.getElementById('shieldValue').textContent = this.player.shield;
      }
      
      // 显示武器信息和升级等级
      if (this.player && this.player.weaponUpgrades) {
        const weaponUpgrade = this.player.weaponUpgrades[this.player.weaponType];
        const weaponName = this.getWeaponName(this.player.weaponType);
        if (document.getElementById('weaponValue')) {
          document.getElementById('weaponValue').textContent = `${weaponName} Lv.${weaponUpgrade?.level || 0}`;
        }
      }
      
      if (document.getElementById('comboValue')) {
        document.getElementById('comboValue').textContent = this.combo;
      }
      if (document.getElementById('highScoreValue')) {
        document.getElementById('highScoreValue').textContent = GameStorage.getHighScore();
      }
      if (document.getElementById('speedValue')) {
        document.getElementById('speedValue').textContent = CONFIG.GAME_SPEED_MULTIPLIER.toFixed(1) + 'x';
      }
      
      // 显示升级点数
      if (document.getElementById('upgradePointsValue') && this.player) {
        document.getElementById('upgradePointsValue').textContent = this.player.upgradePoints;
      }
    } catch (error) {
      console.error('updateUI error:', error);
    }
  }
  
  getWeaponName(weaponType) {
    const names = {
      [WeaponType.NORMAL]: '标准',
      [WeaponType.LASER]: '激光',
      [WeaponType.MISSILE]: '导弹',
      [WeaponType.SHOTGUN]: '散弹',
      [WeaponType.PLASMA]: '等离子'
    };
    return names[weaponType] || '标准';
  }
    handleInput() {
    if (this.state !== GameState.PLAYING) return;
    
    const baseSpeed = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 
                     CONFIG.PLAYER_SPEED * 1.5 : CONFIG.PLAYER_SPEED;
    const speed = baseSpeed * CONFIG.GAME_SPEED_MULTIPLIER;
    
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      this.player.y = Math.max(0, this.player.y - speed);
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      this.player.y = Math.min(CONFIG.CANVAS_HEIGHT - this.player.height, this.player.y + speed);
    }
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.player.x = Math.max(0, this.player.x - speed);
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.player.x = Math.min(CONFIG.CANVAS_WIDTH - this.player.width, this.player.x + speed);
    }
  }
    spawnEnemies() {
    if (this.state !== GameState.PLAYING) return;
    
    const now = Date.now();
    
    // 生成Boss
    if (this.score >= CONFIG.BOSS_SPAWN_SCORE && !this.bossSpawned && this.bosses.length === 0) {
      this.bosses.push(new Boss(CONFIG.CANVAS_WIDTH / 2 - 60, 50));
      this.bossSpawned = true;
      this.soundManager.play('explosion'); // Boss出现音效
    }
    
    // 生成普通敌人
    if (now - this.lastEnemySpawn > this.enemySpawnRate) {
      const rand = Math.random();
      let enemyType = EnemyType.BASIC;
      
      if (rand < 0.1) enemyType = EnemyType.TRACKER;
      else if (rand < 0.2) enemyType = EnemyType.DODGER;
      else if (rand < 0.5) enemyType = EnemyType.FAST;
      
      this.enemies.push(new Enemy(
        Math.random() * (CONFIG.CANVAS_WIDTH - 50),
        -50,
        enemyType
      ));
      this.lastEnemySpawn = now;
      
      // 随等级增加敌人生成速度
      this.enemySpawnRate = Math.max(300, 2000 - this.level * 100);
    }
    
    // 生成陨石
    if (Math.random() < CONFIG.METEOR_CHANCE) {
      this.meteors.push(new Meteor(
        Math.random() * (CONFIG.CANVAS_WIDTH - 50),
        -50
      ));
    }
  }
  
  updateGame() {
    if (this.state !== GameState.PLAYING) return;
      // 更新星空背景
    this.stars.forEach(star => {
      star.y += star.speed * CONFIG.GAME_SPEED_MULTIPLIER;
      if (star.y > CONFIG.CANVAS_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * CONFIG.CANVAS_WIDTH;
      }
    });
    
    // 更新子弹
    this.bullets = this.bullets.filter(bullet => {
      bullet.update();
      return bullet.y > -10;
    });
      // 更新敌人
    this.enemies = this.enemies.filter(enemy => {
      enemy.update();
      return enemy.y < CONFIG.CANVAS_HEIGHT + 50;
    });
    
    // 更新Boss
    this.bosses = this.bosses.filter(boss => {
      boss.update();
      return boss.health > 0;
    });
    
    // 更新陨石
    this.meteors = this.meteors.filter(meteor => {
      meteor.update();
      return meteor.y < CONFIG.CANVAS_HEIGHT + 50;
    });
    
    // 更新粒子效果
    this.particles = this.particles.filter(particle => {
      particle.update();
      return particle.life > 0;
    });
    
    // 更新能量球
    this.powerUps = this.powerUps.filter(powerUp => {
      powerUp.update();
      return powerUp.y < CONFIG.CANVAS_HEIGHT + 50;
    });
    
    // 更新Boss
    this.bosses = this.bosses.filter(boss => {
      boss.update();
      return boss.y < CONFIG.CANVAS_HEIGHT + 50;
    });
    
    // 更新陨石
    this.meteors = this.meteors.filter(meteor => {
      meteor.update();
      return meteor.y < CONFIG.CANVAS_HEIGHT + 50;
    });
    
    // 碰撞检测
    this.checkCollisions();
    
    // 检查等级升级
    if (this.score > this.level * 1000) {
      this.level++;
      this.updateUI();
    }
  }
    checkCollisions() {
    // 子弹与敌人碰撞（支持穿透）
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      let bulletRemoved = false;
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (this.checkCollision(bullet, enemy)) {
          this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 8);
          this.soundManager.play('explosion');
          
          // 处理穿透逻辑
          bullet.piercedEnemies++;
          if (bullet.piercedEnemies >= bullet.pierceCount) {
            this.bullets.splice(i, 1);
            bulletRemoved = true;
          }
          
          this.enemies.splice(j, 1);
          this.score += enemy.type === 'fast' ? 200 : 100;
          
          // 随机掉落能量球
          if (Math.random() < CONFIG.POWER_UP_CHANCE) {
            this.powerUps.push(new PowerUp(enemy.x, enemy.y));
          }
          
          this.updateUI();
          
          if (bulletRemoved) break;
        }
      }
    }
      // 子弹与Boss碰撞（支持穿透）
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      for (let j = this.bosses.length - 1; j >= 0; j--) {
        const boss = this.bosses[j];
        if (this.checkCollision(bullet, boss)) {
          // 处理穿透逻辑
          bullet.piercedEnemies++;
          if (bullet.piercedEnemies >= bullet.pierceCount) {
            bullet.y = -100; // 子弹消失
          }
          
          if (boss.takeDamage(bullet.damage)) {
            this.createExplosion(boss.x + boss.width/2, boss.y + boss.height/2, 15);
            this.soundManager.play('explosion');
            this.bosses.splice(j, 1);
            this.score += 1000;
            
            // Boss 被击败时给予升级点数奖励
            this.player.upgradePoints += 5;
            console.log('击败Boss! 获得5个升级点数!');
            
            this.updateUI();
          }
          break;
        }
      }
    }
    
    // 玩家与敌人碰撞
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];      if (this.checkCollision(this.player, enemy)) {
        if (this.player.shield > 0) {
          this.player.shield--;
        } else {
          this.lives--;
        }
        
        this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 10);
        this.soundManager.play('hit');
        this.enemies.splice(i, 1);
        this.updateUI();
        
        if (this.lives <= 0) {
          this.gameOver();
          return;
        }
      }
    }
    
    // 玩家与Boss碰撞
    for (let i = this.bosses.length - 1; i >= 0; i--) {
      const boss = this.bosses[i];      if (this.checkCollision(this.player, boss)) {
        if (this.player.shield > 0) {
          this.player.shield--;
        } else {
          this.lives--;
        }
        
        this.createExplosion(boss.x + boss.width/2, boss.y + boss.height/2, 15);
        this.soundManager.play('hit');
        this.bosses.splice(i, 1);
        this.updateUI();
        
        if (this.lives <= 0) {
          this.gameOver();
          return;
        }
      }
    }
    
    // 玩家与能量球碰撞
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];      if (this.checkCollision(this.player, powerUp)) {
        powerUp.applyEffect(this.player);
        this.soundManager.play('powerup');
        this.powerUps.splice(i, 1);
        this.updateUI();
      }
    }
    
    // 玩家与陨石碰撞
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const meteor = this.meteors[i];      if (this.checkCollision(this.player, meteor)) {
        if (this.player.shield > 0) {
          this.player.shield--;
        } else {
          this.lives--;
        }
        
        this.createExplosion(meteor.x + meteor.width/2, meteor.y + meteor.height/2, 10);
        this.soundManager.play('hit');
        this.meteors.splice(i, 1);
        this.updateUI();
        
        if (this.lives <= 0) {
          this.gameOver();
          return;
        }
      }
    }
    
    // 玩家与Boss子弹碰撞
    for (let b = 0; b < this.bosses.length; b++) {
      const boss = this.bosses[b];
      for (let k = boss.bullets.length - 1; k >= 0; k--) {
        const bossBullet = boss.bullets[k];
        if (this.checkCollision(this.player, bossBullet)) {
          if (this.player.shield > 0) {
            this.player.shield--;
          } else {
            this.lives--;
          }
          this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 8);
          this.soundManager.play('hit');
          boss.bullets.splice(k, 1);
          this.updateUI();
          if (this.lives <= 0) {
            this.gameOver();
            return;
          }
        }
      }
    }
  }
  
  checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  }
  
  createExplosion(x, y, particleCount = 10) {
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new Particle(x, y));
    }
  }
  
  render() {
    // 清空画布
    this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
    this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // 绘制星空
    this.stars.forEach(star => {
      this.ctx.save();
      this.ctx.globalAlpha = star.opacity;
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
      this.ctx.restore();
    });
    
    if (this.state === GameState.PLAYING) {      // 绘制游戏对象
      this.player.draw(this.ctx);
      this.bullets.forEach(bullet => bullet.draw(this.ctx));
      this.enemies.forEach(enemy => enemy.draw(this.ctx));
      this.bosses.forEach(boss => boss.draw(this.ctx));
      this.meteors.forEach(meteor => meteor.draw(this.ctx));
      this.particles.forEach(particle => particle.draw(this.ctx));
      this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
      this.bosses.forEach(boss => boss.draw(this.ctx));
      this.meteors.forEach(meteor => meteor.draw(this.ctx));
      
      // 绘制武器升级信息（如果有升级点数）
      if (this.player.upgradePoints > 0) {
        this.drawUpgradeHints();
      }
    }
  }
  
  drawUpgradeHints() {
    const ctx = this.ctx;
    const hintY = 50;
    
    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, hintY - 30, 400, 120);
    
    // 标题
    ctx.fillStyle = '#FFD700';
    ctx.font = '18px Arial';
    ctx.fillText(`升级点数: ${this.player.upgradePoints}`, 20, hintY - 10);
    
    // 升级提示
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.fillText('按键升级当前武器:', 20, hintY + 15);
    ctx.fillText('Q - 伤害升级', 20, hintY + 35);
    ctx.fillText('E - 射速升级', 20, hintY + 55);
    
    const weaponType = this.player.weaponType;
    if ([WeaponType.NORMAL, WeaponType.MISSILE, WeaponType.SHOTGUN].includes(weaponType)) {
      ctx.fillText('R - 散射升级', 200, hintY + 35);
    } else {
      ctx.fillText('R - 射程升级', 200, hintY + 35);
    }
    
    if ([WeaponType.LASER, WeaponType.PLASMA].includes(weaponType)) {
      ctx.fillText('T - 穿透升级', 200, hintY + 55);
    }
    
    // 当前武器升级状态
    const upgrade = this.player.weaponUpgrades[weaponType];
    ctx.fillStyle = '#00FF00';
    ctx.fillText(`当前武器: ${this.getWeaponName(weaponType)} (总等级: ${upgrade.level})`, 20, hintY + 75);
  }
  
  gameLoop() {
    this.handleInput();
    this.spawnEnemies();
    this.updateGame();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// 玩家类
class Player {  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.shield = 0;
    this.weaponType = WeaponType.NORMAL;
    this.weaponLevel = 1;
    this.lastShot = 0;
    this.shootCooldown = 200;
    this.weaponAmmo = { // 特殊武器弹药
      [WeaponType.MISSILE]: 10,
      [WeaponType.LASER]: 20,
      [WeaponType.PLASMA]: 15
    };
    
    // 武器升级系统
    this.weaponUpgrades = {
      [WeaponType.NORMAL]: {
        level: 0,
        upgrades: {
          [WeaponUpgradeType.DAMAGE]: 0,
          [WeaponUpgradeType.SPEED]: 0,
          [WeaponUpgradeType.SPREAD]: 0
        }
      },
      [WeaponType.LASER]: {
        level: 0,
        upgrades: {
          [WeaponUpgradeType.DAMAGE]: 0,
          [WeaponUpgradeType.RANGE]: 0,
          [WeaponUpgradeType.PENETRATION]: 0
        }
      },
      [WeaponType.MISSILE]: {
        level: 0,
        upgrades: {
          [WeaponUpgradeType.DAMAGE]: 0,
          [WeaponUpgradeType.SPEED]: 0,
          [WeaponUpgradeType.SPREAD]: 0
        }
      },
      [WeaponType.SHOTGUN]: {
        level: 0,
        upgrades: {
          [WeaponUpgradeType.DAMAGE]: 0,
          [WeaponUpgradeType.SPREAD]: 0,
          [WeaponUpgradeType.RANGE]: 0
        }
      },
      [WeaponType.PLASMA]: {
        level: 0,
        upgrades: {
          [WeaponUpgradeType.DAMAGE]: 0,
          [WeaponUpgradeType.SPEED]: 0,
          [WeaponUpgradeType.PENETRATION]: 0
        }
      }
    };
    this.upgradePoints = 0; // 升级点数
  }
  
  // 升级武器
  upgradeWeapon(weaponType, upgradeType) {
    if (this.upgradePoints <= 0) return false;
    
    const weaponUpgrade = this.weaponUpgrades[weaponType];
    const maxLevel = WeaponUpgradeConfig[weaponType].upgrades[upgradeType]?.maxLevel || 0;
    
    if (weaponUpgrade.upgrades[upgradeType] >= maxLevel) return false;
    
    weaponUpgrade.upgrades[upgradeType]++;
    weaponUpgrade.level++;
    this.upgradePoints--;
    
    return true;
  }
    // 获取武器升级倍率
  getWeaponUpgradeMultiplier(weaponType, upgradeType) {
    try {
      if (!this.weaponUpgrades || !this.weaponUpgrades[weaponType]) {
        return 1;
      }
      
      const upgradeLevel = this.weaponUpgrades[weaponType].upgrades[upgradeType] || 0;
      const upgradeConfig = WeaponUpgradeConfig[weaponType]?.upgrades[upgradeType];
      
      if (!upgradeConfig) return 1;
      
      if (upgradeType === WeaponUpgradeType.DAMAGE) {
        return upgradeConfig.damageMultiplier?.[upgradeLevel] || 1;
      } else if (upgradeType === WeaponUpgradeType.SPEED) {
        return upgradeConfig.cooldownMultiplier?.[upgradeLevel] || upgradeConfig.speedMultiplier?.[upgradeLevel] || 1;
      } else if (upgradeType === WeaponUpgradeType.RANGE) {
        return upgradeConfig.lengthMultiplier?.[upgradeLevel] || upgradeConfig.rangeMultiplier?.[upgradeLevel] || 1;
      } else if (upgradeType === WeaponUpgradeType.SPREAD) {
        return upgradeConfig.bulletCount?.[upgradeLevel] || 1;
      } else if (upgradeType === WeaponUpgradeType.PENETRATION) {
        return upgradeConfig.pierceCount?.[upgradeLevel] || 1;
      }
      
      return 1;
    } catch (error) {
      console.error('getWeaponUpgradeMultiplier error:', error);
      return 1;
    }
  }shoot(bullets) {
    const now = Date.now();
    const speedMultiplier = this.getWeaponUpgradeMultiplier(this.weaponType, WeaponUpgradeType.SPEED);
    const adjustedCooldown = this.shootCooldown * speedMultiplier;
    
    if (now - this.lastShot < adjustedCooldown) return;
    
    // 播放射击音效
    if (window.game && window.game.soundManager) {
      window.game.soundManager.play('shoot');
    }
    
    switch (this.weaponType) {
      case WeaponType.NORMAL:
        this.shootNormal(bullets);
        break;
      case WeaponType.LASER:
        if (this.weaponAmmo[WeaponType.LASER] > 0) {
          this.weaponAmmo[WeaponType.LASER]--;
          this.shootLaser(bullets);
        } else {
          this.weaponType = WeaponType.NORMAL;
          this.shootNormal(bullets);
        }
        break;
      case WeaponType.MISSILE:
        if (this.weaponAmmo[WeaponType.MISSILE] > 0) {
          this.weaponAmmo[WeaponType.MISSILE]--;
          this.shootMissile(bullets);
        } else {
          this.weaponType = WeaponType.NORMAL;
          this.shootNormal(bullets);
        }
        break;
      case WeaponType.SHOTGUN:
        this.shootShotgun(bullets);
        break;
      case WeaponType.PLASMA:
        if (this.weaponAmmo[WeaponType.PLASMA] > 0) {
          this.weaponAmmo[WeaponType.PLASMA]--;
          this.shootPlasma(bullets);
        } else {
          this.weaponType = WeaponType.NORMAL;
          this.shootNormal(bullets);
        }
        break;
    }
    
    this.lastShot = now;
  }
  
  shootNormal(bullets) {
    const damageMultiplier = this.getWeaponUpgradeMultiplier(WeaponType.NORMAL, WeaponUpgradeType.DAMAGE);
    const bulletCount = this.getWeaponUpgradeMultiplier(WeaponType.NORMAL, WeaponUpgradeType.SPREAD);
    
    if (bulletCount === 1) {
      bullets.push(new Bullet(this.x + this.width/2 - 2, this.y, -CONFIG.BULLET_SPEED, 'normal', 0, damageMultiplier));
    } else if (bulletCount === 2) {
      bullets.push(new Bullet(this.x + 5, this.y, -CONFIG.BULLET_SPEED, 'normal', 0, damageMultiplier));
      bullets.push(new Bullet(this.x + this.width - 5, this.y, -CONFIG.BULLET_SPEED, 'normal', 0, damageMultiplier));
    } else {
      bullets.push(new Bullet(this.x + this.width/2 - 2, this.y, -CONFIG.BULLET_SPEED, 'normal', 0, damageMultiplier));
      bullets.push(new Bullet(this.x + 5, this.y, -CONFIG.BULLET_SPEED, 'normal', 0, damageMultiplier));
      bullets.push(new Bullet(this.x + this.width - 5, this.y, -CONFIG.BULLET_SPEED, 'normal', 0, damageMultiplier));
    }
  }
  
  shootLaser(bullets) {
    const damageMultiplier = this.getWeaponUpgradeMultiplier(WeaponType.LASER, WeaponUpgradeType.DAMAGE);
    const rangeMultiplier = this.getWeaponUpgradeMultiplier(WeaponType.LASER, WeaponUpgradeType.RANGE);
    const pierce = this.getWeaponUpgradeMultiplier(WeaponType.LASER, WeaponUpgradeType.PENETRATION);
    
    bullets.push(new Bullet(this.x + this.width/2 - 1, this.y, -CONFIG.BULLET_SPEED * 2, 'laser', 0, damageMultiplier, rangeMultiplier, pierce));
  }
  
  shootMissile(bullets) {
    const damageMultiplier = this.getWeaponUpgradeMultiplier(WeaponType.MISSILE, WeaponUpgradeType.DAMAGE);
    const speedMultiplier = this.getWeaponUpgradeMultiplier(WeaponType.MISSILE, WeaponUpgradeType.SPEED);
    const bulletCount = this.getWeaponUpgradeMultiplier(WeaponType.MISSILE, WeaponUpgradeType.SPREAD);
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = bulletCount > 1 ? (i - (bulletCount-1)/2) * 0.3 : 0;
      bullets.push(new Bullet(
        this.x + this.width/2 - 3, 
        this.y, 
        -CONFIG.BULLET_SPEED * 0.8 * speedMultiplier, 
        'missile', 
        angle, 
        damageMultiplier
      ));
    }
  }
  
  shootShotgun(bullets) {
    const damageMultiplier = this.getWeaponUpgradeMultiplier(WeaponType.SHOTGUN, WeaponUpgradeType.DAMAGE);
    const bulletCount = this.getWeaponUpgradeMultiplier(WeaponType.SHOTGUN, WeaponUpgradeType.SPREAD);
    const rangeMultiplier = this.getWeaponUpgradeMultiplier(WeaponType.SHOTGUN, WeaponUpgradeType.RANGE);
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = (i - (bulletCount-1)/2) * 0.4;
      bullets.push(new Bullet(
        this.x + this.width/2 - 1, 
        this.y, 
        -CONFIG.BULLET_SPEED * rangeMultiplier,
        'shotgun',
        angle,
        damageMultiplier
      ));
    }
  }
  
  shootPlasma(bullets) {
    const damageMultiplier = this.getWeaponUpgradeMultiplier(WeaponType.PLASMA, WeaponUpgradeType.DAMAGE);
    const pierce = this.getWeaponUpgradeMultiplier(WeaponType.PLASMA, WeaponUpgradeType.PENETRATION);
    
    bullets.push(new Bullet(this.x + this.width/2 - 4, this.y, -CONFIG.BULLET_SPEED * 1.5, 'plasma', 0, damageMultiplier, 1, pierce));
  }
  
  draw(ctx) {
    // 绘制飞船
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // 绘制飞船细节
    ctx.fillStyle = '#0088ff';
    ctx.fillRect(this.x + 10, this.y + 10, 20, 10);
    
    // 绘制护盾效果
    if (this.shield > 0) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 + 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // 绘制推进器效果
    ctx.fillStyle = '#ff4444';
    const flameHeight = Math.random() * 10 + 5;
    ctx.fillRect(this.x + 8, this.y + this.height, 8, flameHeight);
    ctx.fillRect(this.x + 24, this.y + this.height, 8, flameHeight);
  }
}

// 子弹类
class Bullet {
  constructor(x, y, speedY, type = 'normal', angle = 0, damageMultiplier = 1, rangeMultiplier = 1, pierceCount = 1) {
    this.x = x;
    this.y = y;
    this.speedY = speedY;
    this.speedX = Math.sin(angle) * Math.abs(speedY) * 0.3;
    this.type = type;
    this.baseDamage = this.getBaseDamage();
    this.damage = this.baseDamage * damageMultiplier;
    this.width = this.getWidth();
    this.height = this.getHeight() * rangeMultiplier;
    this.color = this.getColor();
    this.pierceCount = pierceCount; // 穿透次数
    this.piercedEnemies = 0; // 已穿透的敌人数量
    this.damageMultiplier = damageMultiplier;
  }
    getBaseDamage() {
    const damages = {
      'normal': 1,
      'laser': 3,
      'missile': 5,
      'shotgun': 1,
      'plasma': 4
    };
    return damages[this.type] || 1;
  }
  
  getWidth() {
    const widths = {
      'normal': 4,
      'laser': 2,
      'missile': 6,
      'shotgun': 3,
      'plasma': 8
    };
    return widths[this.type] || 4;
  }
  
  getHeight() {
    const heights = {
      'normal': 10,
      'laser': 20,
      'missile': 12,
      'shotgun': 8,
      'plasma': 6
    };
    return heights[this.type] || 10;
  }
  
  getColor() {
    const colors = {
      'normal': '#ffff00',
      'laser': '#00ffff',
      'missile': '#ff4444',
      'shotgun': '#ffaa00',
      'plasma': '#aa00ff'
    };
    return colors[this.type] || '#ffff00';
  }
    update() {
    this.y += this.speedY * CONFIG.GAME_SPEED_MULTIPLIER;
    this.x += this.speedX * CONFIG.GAME_SPEED_MULTIPLIER;
  }
  
  draw(ctx) {
    ctx.fillStyle = this.color;
    
    if (this.type === 'laser') {
      // 激光特效
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.shadowBlur = 0;
    } else if (this.type === 'plasma') {
      // 等离子球特效
      ctx.beginPath();
      ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillRect(this.x, this.y, this.width, this.height);
      
      // 添加发光效果
      if (this.type !== 'shotgun') {
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
      }
    }
  }
}

// 敌人类
class Enemy {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = type === 'fast' ? 30 : 50;
    this.height = type === 'fast' ? 30 : 40;
    this.speed = type === 'fast' ? CONFIG.ENEMY_SPEED * 2 : CONFIG.ENEMY_SPEED;
    this.color = type === 'fast' ? '#ff4444' : '#ff8800';
  }
    update() {
    this.y += this.speed * CONFIG.GAME_SPEED_MULTIPLIER;
  }
  
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // 绘制敌人细节
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 5);
    
    if (this.type === 'fast') {
      // 快速敌人的特殊标记
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(this.x + this.width/2 - 2, this.y + this.height/2 - 2, 4, 4);
    }
  }
}

// 粒子效果类
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10;
    this.life = 1.0;
    this.decay = Math.random() * 0.02 + 0.01;
    this.size = Math.random() * 4 + 2;
    this.color = Math.random() < 0.5 ? '#ff4444' : '#ffaa00';
  }
    update() {
    this.x += this.vx * CONFIG.GAME_SPEED_MULTIPLIER;
    this.y += this.vy * CONFIG.GAME_SPEED_MULTIPLIER;
    this.life -= this.decay * CONFIG.GAME_SPEED_MULTIPLIER;
    this.vx *= 0.98;
    this.vy *= 0.98;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}

// 能量球类
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.speed = 2;
    this.pulse = 0;
      // 随机确定能量球类型
    const rand = Math.random();
    if (rand < 0.2) this.type = 'shield';
    else if (rand < 0.3) this.type = 'weapon_upgrade';
    else if (rand < 0.4) this.type = 'upgrade_points'; // 新增升级点数
    else if (rand < 0.5) this.type = 'damage_upgrade'; // 新增伤害升级
    else if (rand < 0.6) this.type = 'speed_upgrade';  // 新增射速升级
    else if (rand < 0.7) this.type = 'laser';
    else if (rand < 0.8) this.type = 'missile';
    else if (rand < 0.9) this.type = 'shotgun';
    else this.type = 'plasma';
  }
    update() {
    this.y += this.speed * CONFIG.GAME_SPEED_MULTIPLIER;
    this.pulse += 0.1 * CONFIG.GAME_SPEED_MULTIPLIER;
  }
  
  draw(ctx) {
    const pulseSize = Math.sin(this.pulse) * 3;
    const size = this.width + pulseSize;
      const colors = {
      'shield': '#00ffff',
      'weapon_upgrade': '#ff00ff',
      'upgrade_points': '#ffff00',
      'damage_upgrade': '#ff6600',
      'speed_upgrade': '#00ff00',
      'laser': '#00aaff',
      'missile': '#ff4444',
      'shotgun': '#ffaa00',
      'plasma': '#aa00ff'
    };
    
    ctx.fillStyle = colors[this.type] || '#00ffff';
    ctx.fillRect(this.x - pulseSize/2, this.y - pulseSize/2, size, size);
    
    // 添加发光效果
    ctx.shadowBlur = 15;
    ctx.shadowColor = colors[this.type] || '#00ffff';
    ctx.fillRect(this.x - pulseSize/2, this.y - pulseSize/2, size, size);
    ctx.shadowBlur = 0;
    
    // 绘制类型图标
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';    const icons = {
      'shield': '🛡️',
      'weapon_upgrade': '⚡',
      'upgrade_points': '⭐',
      'damage_upgrade': '💪',
      'speed_upgrade': '⚡',
      'laser': '💥',
      'missile': '🚀',
      'shotgun': '💨',
      'plasma': '⚡'
    };
    ctx.fillText(icons[this.type] || '?', this.x + this.width/2, this.y + this.height/2 + 4);
  }
    applyEffect(player) {
    switch (this.type) {
      case 'shield':
        player.shield = Math.min(player.shield + 1, 5);
        break;
      case 'weapon_upgrade':
        player.weaponLevel = Math.min(player.weaponLevel + 1, 3);
        break;
      case 'upgrade_points':
        player.upgradePoints += 2; // 给予2个升级点数
        break;
      case 'damage_upgrade':
        // 自动升级当前武器的伤害
        if (player.upgradeWeapon(player.weaponType, WeaponUpgradeType.DAMAGE)) {
          console.log(`${player.weaponType} 伤害升级!`);
        }
        break;
      case 'speed_upgrade':
        // 自动升级当前武器的射速
        if (player.upgradeWeapon(player.weaponType, WeaponUpgradeType.SPEED)) {
          console.log(`${player.weaponType} 射速升级!`);
        }
        break;
      case 'laser':
        player.weaponType = WeaponType.LASER;
        player.weaponAmmo[WeaponType.LASER] = Math.min(player.weaponAmmo[WeaponType.LASER] + 10, 30);
        break;
      case 'missile':
        player.weaponType = WeaponType.MISSILE;
        player.weaponAmmo[WeaponType.MISSILE] = Math.min(player.weaponAmmo[WeaponType.MISSILE] + 5, 20);
        break;
      case 'shotgun':
        player.weaponType = WeaponType.SHOTGUN;
        break;
      case 'plasma':
        player.weaponType = WeaponType.PLASMA;
        player.weaponAmmo[WeaponType.PLASMA] = Math.min(player.weaponAmmo[WeaponType.PLASMA] + 8, 25);
        break;
    }
  }
}

// Boss类
class Boss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 80;
    this.health = 50;
    this.maxHealth = 50;
    this.speed = 1;
    this.direction = 1;
    this.shootCooldown = 1000;
    this.lastShot = 0;
    this.phase = 1; // Boss阶段
    this.bullets = [];
    this.color = '#ff0066';
  }
    update() {
    // Boss移动模式
    this.x += this.speed * this.direction * CONFIG.GAME_SPEED_MULTIPLIER;
    if (this.x <= 0 || this.x >= CONFIG.CANVAS_WIDTH - this.width) {
      this.direction *= -1;
      this.y += 20 * CONFIG.GAME_SPEED_MULTIPLIER;
    }
    
    // Boss射击
    const now = Date.now();
    if (now - this.lastShot > this.shootCooldown) {
      this.shoot();
      this.lastShot = now;
    }
    
    // 更新Boss子弹
    this.bullets = this.bullets.filter(bullet => {
      bullet.update();
      return bullet.y < CONFIG.CANVAS_HEIGHT + 50;
    });
    
    // 根据血量改变阶段
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent < 0.5 && this.phase === 1) {
      this.phase = 2;
      this.shootCooldown = 500; // 更快射击
      this.speed = 2;
    }
  }
  
  shoot() {
    // 三发散射
    for (let i = -1; i <= 1; i++) {
      this.bullets.push(new BossBullet(
        this.x + this.width/2,
        this.y + this.height,
        i * 2, // 散射角度
        4
      ));
    }
  }
  
  takeDamage(damage = 1) {
    this.health -= damage;
    return this.health <= 0;
  }
  
  draw(ctx) {
    // 绘制Boss主体
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // 绘制细节
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, 10);
    ctx.fillRect(this.x + 20, this.y + 30, this.width - 40, 20);
    
    // 绘制血条
    const barWidth = this.width;
    const barHeight = 8;
    const healthPercent = this.health / this.maxHealth;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(this.x, this.y - 15, barWidth, barHeight);
    
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : 
                    healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(this.x, this.y - 15, barWidth * healthPercent, barHeight);
    
    // 绘制Boss子弹
    this.bullets.forEach(bullet => bullet.draw(ctx));
    
    // 阶段2特效
    if (this.phase === 2) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
      ctx.setLineDash([]);
    }
  }
}

// Boss子弹类
class BossBullet {
  constructor(x, y, angleOffset = 0, speed = 3) {
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 12;
    this.speed = speed;
    this.angle = Math.PI/2 + angleOffset; // 向下射击
    this.vx = Math.sin(this.angle) * this.speed;
    this.vy = Math.cos(this.angle) * this.speed;
  }
    update() {
    this.x += this.vx * CONFIG.GAME_SPEED_MULTIPLIER;
    this.y += this.vy * CONFIG.GAME_SPEED_MULTIPLIER;
  }
  
  draw(ctx) {
    ctx.fillStyle = '#ff0066';
    ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    
    // 发光效果
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0066';
    ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    ctx.shadowBlur = 0;
  }
}

// 陨石类
class Meteor {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40 + Math.random() * 30;
    this.height = this.width;
    this.speed = 1 + Math.random() * 2;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.health = 3;
  }
    update() {
    this.y += this.speed * CONFIG.GAME_SPEED_MULTIPLIER;
    this.rotation += this.rotationSpeed * CONFIG.GAME_SPEED_MULTIPLIER;
  }
  
  takeDamage() {
    this.health--;
    return this.health <= 0;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width/2, this.y + this.height/2);
    ctx.rotate(this.rotation);
    
    // 绘制陨石
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    
    // 添加纹理
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(-this.width/2 + 5, -this.height/2 + 5, this.width - 10, 8);
    ctx.fillRect(-this.width/2 + 8, -this.height/2 + 20, this.width - 16, 6);
    
    ctx.restore();
  }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game();
    window.game = game; // 全局引用
    console.log('游戏初始化成功');
  } catch (error) {
    console.error('游戏初始化失败:', error);
  }
});
