// ===== Leitner 间隔重复引擎 =====

const srs = {
  // 间隔天数：box 1-5
  INTERVALS: [0, 1, 3, 7, 14, 30],

  // 获取单词的SRS状态
  getState(userId, vocabId) {
    const progress = storage.getProgress(userId);
    if (!progress.srsState[vocabId]) {
      return { box: 0, nextReview: 0, streak: 0 };
    }
    return progress.srsState[vocabId];
  },

  // 保存单词的SRS状态
  setState(userId, vocabId, state) {
    const progress = storage.getProgress(userId);
    progress.srsState[vocabId] = state;
    storage.saveProgress(userId, progress);
  },

  // 回答正确：升级
  answerCorrect(userId, vocabId) {
    const state = this.getState(userId, vocabId);
    const newBox = Math.min(state.box + 1, 5);
    const interval = this.INTERVALS[newBox];
    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

    this.setState(userId, vocabId, {
      box: newBox,
      nextReview,
      streak: state.streak + 1,
    });

    // 标记已学
    storage.markWordLearned(userId, vocabId);
    return newBox;
  },

  // 回答错误：降回box 1
  answerWrong(userId, vocabId) {
    this.setState(userId, vocabId, {
      box: 1,
      nextReview: Date.now() + this.INTERVALS[1] * 24 * 60 * 60 * 1000,
      streak: 0,
    });
  },

  // 获取今日需要复习的单词
  getDueWords(userId) {
    const progress = storage.getProgress(userId);
    const now = Date.now();
    const due = [];

    for (const vocabId in progress.srsState) {
      const state = progress.srsState[vocabId];
      if (state.nextReview <= now) {
        due.push(parseInt(vocabId));
      }
    }
    return due;
  },

  // 获取今日待学的新单词（未学过的）
  getNewWords(userId, count = 5) {
    const progress = storage.getProgress(userId);
    const learned = new Set(Object.keys(progress.srsState).map(Number));
    const newWords = VOCAB_DATA.filter(v => !learned.has(v.id));
    // 按难度排序，先学简单的
    newWords.sort((a, b) => a.difficulty - b.difficulty);
    return newWords.slice(0, count).map(v => v.id);
  },

  // 获取今日学习计划：先复习到期的，再学新的
  getTodayCards(userId) {
    const due = this.getDueWords(userId);
    const newWords = due.length >= 5 ? [] : this.getNewWords(userId, 5 - due.length);
    const allIds = [...due, ...newWords];

    // 打乱顺序
    for (let i = allIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
    }

    return allIds.map(id => VOCAB_DATA.find(v => v.id === id)).filter(Boolean);
  },
};
