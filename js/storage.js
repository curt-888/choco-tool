// ===== localStorage 存储管理 =====

const storage = {
  // 获取所有档案
  getProfiles() {
    return JSON.parse(localStorage.getItem('profiles') || '[]');
  },

  // 保存档案列表
  saveProfiles(profiles) {
    localStorage.setItem('profiles', JSON.stringify(profiles));
  },

  // 创建新档案
  createProfile(name, role, avatar) {
    const profiles = this.getProfiles();
    const profile = {
      id: Date.now().toString(),
      name,
      role,
      avatar,
      createdAt: new Date().toISOString(),
    };
    profiles.push(profile);
    this.saveProfiles(profiles);
    // 初始化该用户的进度数据
    this.initProgress(profile.id);
    return profile;
  },

  // 获取当前活跃档案ID
  getActiveProfileId() {
    return localStorage.getItem('activeProfile');
  },

  // 设置当前活跃档案
  setActiveProfile(id) {
    localStorage.setItem('activeProfile', id);
  },

  // 获取当前档案
  getActiveProfile() {
    const id = this.getActiveProfileId();
    if (!id) return null;
    return this.getProfiles().find(p => p.id === id) || null;
  },

  // 初始化用户进度
  initProgress(userId) {
    const key = `progress_${userId}`;
    if (localStorage.getItem(key)) return;
    const progress = {
      learnedWords: [],       // 已学会的单词ID列表
      learnedSentences: [],   // 已学会的句子ID列表
      stars: 0,               // 星星数
      streak: 0,              // 连续天数
      lastStudyDate: null,    // 上次学习日期
      quizzesDone: 0,         // 完成听力练习次数
      challengesDone: 0,      // 完成闯关次数
      perfectMatch: 0,        // 完美配对次数
      unlockedAchievements: [], // 已解锁成就ID
      srsState: {},           // SRS状态: { vocabId: { box, nextReview, streak } }
    };
    localStorage.setItem(key, JSON.stringify(progress));
  },

  // 获取用户进度
  getProgress(userId) {
    const key = `progress_${userId}`;
    const data = localStorage.getItem(key);
    if (!data) {
      this.initProgress(userId);
      return this.getProgress(userId);
    }
    return JSON.parse(data);
  },

  // 保存用户进度
  saveProgress(userId, progress) {
    const key = `progress_${userId}`;
    localStorage.setItem(key, JSON.stringify(progress));
  },

  // 更新连续天数
  updateStreak(userId) {
    const progress = this.getProgress(userId);
    const today = new Date().toDateString();
    if (progress.lastStudyDate === today) return progress.streak;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (progress.lastStudyDate === yesterday.toDateString()) {
      progress.streak += 1;
    } else if (progress.lastStudyDate !== today) {
      progress.streak = 1;
    }
    progress.lastStudyDate = today;
    this.saveProgress(userId, progress);
    return progress.streak;
  },

  // 标记单词已学
  markWordLearned(userId, vocabId) {
    const progress = this.getProgress(userId);
    if (!progress.learnedWords.includes(vocabId)) {
      progress.learnedWords.push(vocabId);
      this.saveProgress(userId, progress);
    }
  },

  // 标记句子已学
  markSentenceLearned(userId, sentenceId) {
    const progress = this.getProgress(userId);
    if (!progress.learnedSentences.includes(sentenceId)) {
      progress.learnedSentences.push(sentenceId);
      this.saveProgress(userId, progress);
    }
  },

  // 增加星星
  addStars(userId, count) {
    const progress = this.getProgress(userId);
    progress.stars += count;
    this.saveProgress(userId, progress);
    return progress.stars;
  },

  // 增加听力练习次数
  incrementQuizzes(userId) {
    const progress = this.getProgress(userId);
    progress.quizzesDone += 1;
    this.saveProgress(userId, progress);
  },

  // 增加闯关次数
  incrementChallenges(userId) {
    const progress = this.getProgress(userId);
    progress.challengesDone += 1;
    this.saveProgress(userId, progress);
  },

  // 增加完美配对次数
  incrementPerfectMatch(userId) {
    const progress = this.getProgress(userId);
    progress.perfectMatch += 1;
    this.saveProgress(userId, progress);
  },

  // 解锁成就
  unlockAchievement(userId, achievementId) {
    const progress = this.getProgress(userId);
    if (!progress.unlockedAchievements.includes(achievementId)) {
      progress.unlockedAchievements.push(achievementId);
      this.saveProgress(userId, progress);
      return true; // 新解锁
    }
    return false; // 已有
  },

  // 获取分类完成情况
  getCategoryProgress(userId) {
    const progress = this.getProgress(userId);
    const result = {};
    for (const cat in CATEGORIES) {
      const catWords = VOCAB_DATA.filter(v => v.category === cat);
      const learned = catWords.filter(v => progress.learnedWords.includes(v.id));
      result[cat] = {
        total: catWords.length,
        learned: learned.length,
        percent: catWords.length > 0 ? Math.round(learned.length / catWords.length * 100) : 0,
      };
    }
    return result;
  },
};
