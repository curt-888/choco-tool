// ===== 主应用：路由 + 页面渲染 + 事件绑定 =====

// ---- 路由系统 ----
const router = {
  currentPage: null,

  navigate(page) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    // 更新导航高亮
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add('active');

    // 显示目标页面
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
      pageEl.classList.remove('hidden');
      this.currentPage = page;
      // 触发页面初始化
      this.onPageEnter(page);
    }

    // 更新 hash
    window.location.hash = page;
  },

  onPageEnter(page) {
    const userId = storage.getActiveProfileId();
    switch (page) {
      case 'dashboard': dashboardPage.render(userId); break;
      case 'sentence': sentencePage.render(userId); break;
      case 'flashcard': flashcardPage.render(userId); break;
      case 'listening': listeningPage.render(userId); break;
      case 'listenfill': listenFillPage.render(userId); break;
      case 'challenge': challengePage.render(); break;
      case 'achievements': achievementsPage.render(userId); break;
    }
  },

  init() {
    window.addEventListener('hashchange', () => {
      const page = window.location.hash.slice(1) || 'dashboard';
      if (page !== this.currentPage) {
        this.navigate(page);
      }
    });
  },
};

// ---- 档案设置页 ----
const setup = {
  selectedAvatar: '🐱',
  selectedRole: 'child',

  init() {
    // 生成头像选项
    const avatars = ['🐱', '🐶', '🐰', '🐻', '🦊', '🐼', '🐸', '🦋', '🌟', '🌈', '🦄', '🐙'];
    const picker = document.getElementById('avatar-picker');
    picker.innerHTML = avatars.map(a =>
      `<div class="avatar-option ${a === this.selectedAvatar ? 'selected' : ''}" onclick="setup.selectAvatar('${a}', this)">${a}</div>`
    ).join('');
  },

  selectAvatar(emoji, el) {
    this.selectedAvatar = emoji;
    document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
    el.classList.add('selected');
  },

  selectRole(role) {
    this.selectedRole = role;
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.role-btn[data-role="${role}"]`).classList.add('active');
  },

  createProfile() {
    const name = document.getElementById('setup-name').value.trim();
    if (!name) {
      ui.toast('请输入你的名字哦！', '✏️');
      return;
    }
    const profile = storage.createProfile(name, this.selectedRole, this.selectedAvatar);
    storage.setActiveProfile(profile.id);
    // 应用模式
    document.body.classList.toggle('child-mode', this.selectedRole === 'child');
    this.updateNavProfile(profile);
    router.navigate('dashboard');
    ui.toast(`欢迎你，${name}！`, '🎉');
    ui.confetti();
  },

  updateNavProfile(profile) {
    const nav = document.getElementById('nav-profile');
    nav.innerHTML = `
      <span style="font-size:1.5em">${profile.avatar}</span>
      <span style="font-weight:600">${profile.name}</span>
    `;
    nav.onclick = () => {
      if (confirm('要切换用户吗？')) {
        storage.setActiveProfile(null);
        location.reload();
      }
    };
  },
};

// ---- 首页仪表盘 ----
const dashboardPage = {
  render(userId) {
    if (!userId) return;
    const profile = storage.getActiveProfile();
    const progress = storage.getProgress(userId);

    // 更新连续天数
    storage.updateStreak(userId);
    const updatedProgress = storage.getProgress(userId);

    // 欢迎语
    const hour = new Date().getHours();
    let greeting = '早上好';
    if (hour >= 12 && hour < 18) greeting = '下午好';
    else if (hour >= 18) greeting = '晚上好';
    document.getElementById('dash-greeting').textContent = `${greeting}，${profile.name} ${profile.avatar}`;
    document.getElementById('dash-subtitle').textContent = '今天也要加油学英语哦！';

    // 统计
    document.getElementById('stat-streak').textContent = updatedProgress.streak;
    document.getElementById('stat-stars').textContent = updatedProgress.stars;
    document.getElementById('stat-words').textContent = updatedProgress.learnedWords.length;

    // 今日任务状态
    const dueCount = srs.getDueWords(userId).length;
    document.getElementById('action-review-status').textContent =
      dueCount > 0 ? `${dueCount}个单词待复习` : '没有待复习的';
    const sentenceDone = updatedProgress.learnedSentences.length;
    document.getElementById('action-sentence-status').textContent =
      `已学 ${sentenceDone}/${SENTENCE_DATA.length}`;

    // 分类进度
    const catProgress = storage.getCategoryProgress(userId);
    const grid = document.getElementById('category-grid');
    grid.innerHTML = Object.entries(CATEGORIES).map(([key, cat]) => {
      const p = catProgress[key] || { learned: 0, total: 10, percent: 0 };
      return `
        <div class="category-card" onclick="router.navigate('flashcard')">
          <span class="category-emoji">${cat.emoji}</span>
          <div class="category-name">${cat.name}</div>
          <div class="category-progress">
            <div class="category-progress-bar" style="width:${p.percent}%"></div>
          </div>
          <div class="category-count">${p.learned}/${p.total}</div>
        </div>
      `;
    }).join('');
  },
};

// ---- 每日一句 ----
const sentencePage = {
  currentIndex: 0,

  render(userId) {
    if (!userId) return;
    const progress = storage.getProgress(userId);
    // 找到下一个未学的句子
    const unlearned = SENTENCE_DATA.filter(s => !progress.learnedSentences.includes(s.id));
    if (unlearned.length === 0) {
      document.getElementById('sentence-emoji').textContent = '🎉';
      document.getElementById('sentence-en').textContent = 'All done!';
      document.getElementById('sentence-zh').textContent = '你已经学会了所有句子！太棒了！';
      document.getElementById('sentence-progress-text').textContent = `${SENTENCE_DATA.length}/${SENTENCE_DATA.length}`;
      return;
    }
    this.currentIndex = 0;
    this.currentSentence = unlearned[0];
    this.showSentence(userId);
  },

  showSentence(userId) {
    const s = this.currentSentence;
    document.getElementById('sentence-emoji').textContent = s.emoji;
    document.getElementById('sentence-en').textContent = s.en;
    document.getElementById('sentence-zh').textContent = s.zh;
    const progress = storage.getProgress(userId);
    document.getElementById('sentence-progress-text').textContent =
      `已学 ${progress.learnedSentences.length}/${SENTENCE_DATA.length}`;
    // 自动播放语音
    setTimeout(() => speech.speak(s.en, 0.7), 500);
  },

  playSound() {
    if (this.currentSentence) {
      speech.speak(this.currentSentence.en, 0.7);
    }
  },

  markLearned() {
    const userId = storage.getActiveProfileId();
    if (!this.currentSentence) return;
    storage.markSentenceLearned(userId, this.currentSentence.id);
    storage.updateStreak(userId);
    storage.addStars(userId, 2);
    ui.toast('学会了！+2⭐', '📖');
    ui.checkAchievements(userId);
    // 切换到下一句
    this.render(userId);
  },
};

// ---- 单词卡片 ----
const flashcardPage = {
  cards: [],
  currentIndex: 0,
  isFlipped: false,

  render(userId) {
    if (!userId) return;
    this.cards = srs.getTodayCards(userId);
    this.currentIndex = 0;
    if (this.cards.length === 0) {
      document.getElementById('card-emoji').textContent = '🎉';
      document.getElementById('card-en').textContent = '全部完成！';
      document.getElementById('card-zh').textContent = '今天没有需要复习的单词';
      document.getElementById('card-category').textContent = '';
      document.getElementById('flashcard-buttons').style.display = 'none';
      document.getElementById('flashcard-hint').textContent = '明天再来吧！';
      return;
    }
    this.showCard();
  },

  showCard() {
    const card = this.cards[this.currentIndex];
    if (!card) return;
    document.getElementById('card-emoji').textContent = card.emoji;
    document.getElementById('card-en').textContent = card.en;
    document.getElementById('card-zh').textContent = card.zh;
    const cat = CATEGORIES[card.category];
    document.getElementById('card-category').textContent = cat ? cat.emoji + ' ' + cat.name : '';
    // 重置翻转
    document.getElementById('flashcard').classList.remove('flipped');
    document.getElementById('flashcard-buttons').style.display = 'none';
    document.getElementById('flashcard-hint').textContent = '👆 点击卡片翻转';
    this.isFlipped = false;
  },

  flip() {
    if (this.isFlipped) return;
    document.getElementById('flashcard').classList.add('flipped');
    document.getElementById('flashcard-buttons').style.display = 'flex';
    document.getElementById('flashcard-hint').textContent = '';
    this.isFlipped = true;
    // 播放语音
    const card = this.cards[this.currentIndex];
    if (card) speech.speak(card.en);
  },

  playSound() {
    const card = this.cards[this.currentIndex];
    if (card) speech.speak(card.en);
  },

  answer(correct) {
    const userId = storage.getActiveProfileId();
    const card = this.cards[this.currentIndex];
    if (!card) return;

    if (correct) {
      srs.answerCorrect(userId, card.id);
      storage.addStars(userId, 1);
      ui.toast('答对了！+1⭐', '✅');
    } else {
      srs.answerWrong(userId, card.id);
      ui.toast('没关系，再记记！', '💪');
    }

    storage.updateStreak(userId);
    ui.checkAchievements(userId);

    // 下一张
    this.currentIndex++;
    if (this.currentIndex >= this.cards.length) {
      ui.toast('今日卡片已全部完成！', '🎉');
      ui.confetti();
      this.render(userId);
    } else {
      this.showCard();
    }
  },
};

// ---- 听力练习 ----
const listeningPage = {
  currentWord: null,
  options: [],
  score: 0,
  combo: 0,

  render(userId) {
    if (!userId) return;
    this.score = 0;
    this.combo = 0;
    document.getElementById('listening-score').textContent = '0';
    document.getElementById('listening-combo').textContent = '';
    document.getElementById('listening-feedback').textContent = '';
    this.nextRound();
  },

  nextRound() {
    // 随机选一个单词
    this.currentWord = VOCAB_DATA[Math.floor(Math.random() * VOCAB_DATA.length)];

    // 生成4个选项（1个正确 + 3个干扰）
    const others = VOCAB_DATA.filter(v => v.id !== this.currentWord.id);
    const distractors = [];
    while (distractors.length < 3 && others.length > 0) {
      const idx = Math.floor(Math.random() * others.length);
      distractors.push(others.splice(idx, 1)[0]);
    }
    this.options = [this.currentWord, ...distractors];
    // 打乱
    for (let i = this.options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.options[i], this.options[j]] = [this.options[j], this.options[i]];
    }

    this.renderOptions();
    document.getElementById('listening-feedback').textContent = '';
    // 自动播放
    setTimeout(() => this.playSound(), 300);
  },

  renderOptions() {
    const container = document.getElementById('listening-options');
    container.innerHTML = this.options.map(opt => `
      <button class="listening-option" onclick="listeningPage.select(${opt.id}, this)">
        <span class="opt-emoji">${opt.emoji}</span>
        <span>${opt.zh}</span>
      </button>
    `).join('');
  },

  playSound() {
    if (this.currentWord) speech.speak(this.currentWord.en);
  },

  select(vocabId, element) {
    const userId = storage.getActiveProfileId();
    if (vocabId === this.currentWord.id) {
      // 正确
      this.combo++;
      const bonus = Math.min(this.combo, 5);
      this.score += bonus;
      document.getElementById('listening-score').textContent = this.score;
      document.getElementById('listening-combo').textContent = this.combo > 1 ? `🔥 ${this.combo}连击！` : '';
      element.classList.add('correct');
      document.getElementById('listening-feedback').textContent = `✅ 太棒了！${this.currentWord.en} = ${this.currentWord.zh}`;
      storage.addStars(userId, bonus);
      storage.updateStreak(userId);
      storage.incrementQuizzes(userId);
      ui.checkAchievements(userId);

      // 禁用所有选项
      document.querySelectorAll('.listening-option').forEach(o => o.style.pointerEvents = 'none');

      setTimeout(() => this.nextRound(), 1500);
    } else {
      // 错误
      this.combo = 0;
      element.classList.add('wrong');
      document.getElementById('listening-combo').textContent = '';
      document.getElementById('listening-feedback').textContent = `❌ 再想想哦～正确答案是 ${this.currentWord.zh}`;
      ui.flashWrong(element);
      storage.incrementQuizzes(userId);

      // 显示正确答案
      document.querySelectorAll('.listening-option').forEach(o => {
        if (o.onclick.toString().includes(this.currentWord.id)) {
          o.classList.add('correct');
        }
        o.style.pointerEvents = 'none';
      });

      setTimeout(() => this.nextRound(), 2000);
    }
  },
};

// ---- 趣味闯关 ----
const challengePage = {
  timer: null,
  timeLeft: 0,
  score: 0,

  back() {
    this.stopTimer();
    document.getElementById('challenge-select').classList.remove('hidden');
    document.getElementById('challenge-game').classList.add('hidden');
  },

  startTimer(seconds) {
    this.timeLeft = seconds;
    document.getElementById('challenge-timer').textContent = `⏱️ ${this.timeLeft}s`;
    this.timer = setInterval(() => {
      this.timeLeft--;
      document.getElementById('challenge-timer').textContent = `⏱️ ${this.timeLeft}s`;
      if (this.timeLeft <= 0) {
        this.stopTimer();
        this.timeUp();
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  },

  timeUp() {
    const userId = storage.getActiveProfileId();
    storage.addStars(userId, this.score);
    storage.incrementChallenges(userId);
    ui.checkAchievements(userId);
    ui.toast(`时间到！获得 ${this.score}⭐`, '⏱️');
    if (this.score > 0) ui.confetti();
    this.back();
  },

  // ---- 配对游戏 ----
  startMatch() {
    this.score = 0;
    document.getElementById('challenge-score').textContent = '⭐ 0';
    document.getElementById('challenge-select').classList.add('hidden');
    document.getElementById('challenge-game').classList.remove('hidden');

    // 选6个单词做配对
    const words = this.shuffle(VOCAB_DATA).slice(0, 6);
    const cards = [];
    words.forEach(w => {
      cards.push({ id: w.id, type: 'en', display: w.emoji + ' ' + w.en, matchId: w.id });
      cards.push({ id: w.id + 1000, type: 'zh', display: w.zh, matchId: w.id });
    });
    this.matchCards = this.shuffle(cards);
    this.matchSelected = null;
    this.matchedCount = 0;

    const board = document.getElementById('challenge-board');
    board.innerHTML = `<div class="match-board">${this.matchCards.map((c, i) => `
      <div class="match-card" data-idx="${i}" onclick="challengePage.matchClick(${i})">${c.display}</div>
    `).join('')}</div>`;

    this.startTimer(60);
  },

  matchClick(idx) {
    const cards = document.querySelectorAll('.match-card');
    const card = this.matchCards[idx];
    if (cards[idx].classList.contains('matched')) return;

    if (this.matchSelected === null) {
      this.matchSelected = idx;
      cards[idx].classList.add('selected');
    } else {
      const prev = this.matchCards[this.matchSelected];
      const prevIdx = this.matchSelected;
      this.matchSelected = null;

      if (prev.matchId === card.matchId && prev.type !== card.type) {
        // 配对成功
        cards[prevIdx].classList.remove('selected');
        cards[prevIdx].classList.add('matched');
        cards[idx].classList.add('matched');
        this.matchedCount++;
        this.score++;
        document.getElementById('challenge-score').textContent = `⭐ ${this.score}`;

        if (this.matchedCount >= 6) {
          this.stopTimer();
          const userId = storage.getActiveProfileId();
          storage.addStars(userId, this.score);
          storage.incrementChallenges(userId);
          if (this.score === 6) storage.incrementPerfectMatch(userId);
          ui.checkAchievements(userId);
          ui.toast('全部配对完成！🎉', '⭐');
          ui.confetti();
          setTimeout(() => this.back(), 2000);
        }
      } else {
        // 配对失败
        cards[prevIdx].classList.remove('selected');
        cards[idx].classList.add('wrong');
        setTimeout(() => cards[idx].classList.remove('wrong'), 500);
      }
    }
  },

  // ---- 句子排序 ----
  startOrder() {
    this.score = 0;
    document.getElementById('challenge-score').textContent = '⭐ 0';
    document.getElementById('challenge-select').classList.add('hidden');
    document.getElementById('challenge-game').classList.remove('hidden');

    // 随机选一个句子
    const sentence = SENTENCE_DATA[Math.floor(Math.random() * SENTENCE_DATA.length)];
    this.orderSentence = sentence;
    const words = sentence.en.replace('.', '').split(' ');
    this.orderWords = words;
    this.orderAnswer = [];
    this.shuffledWords = this.shuffle([...words]);

    const board = document.getElementById('challenge-board');
    board.innerHTML = `
      <p style="color: var(--text-light); margin-bottom: 16px;">中文提示：${sentence.zh}</p>
      <div class="order-sentence" id="order-sentence"></div>
      <div class="order-answer" id="order-answer"></div>
      <div class="order-words" id="order-words">
        ${this.shuffledWords.map((w, i) => `
          <div class="order-word" data-idx="${i}" onclick="challengePage.orderClick(${i})">${w}</div>
        `).join('')}
      </div>
      <button class="btn btn-secondary" onclick="challengePage.checkOrder()" style="margin-top:16px">检查答案</button>
    `;

    this.startTimer(30);
  },

  orderClick(idx) {
    const word = this.shuffledWords[idx];
    if (!word) return;
    this.orderAnswer.push({ word, idx });
    this.shuffledWords[idx] = null;
    this.renderOrder();
  },

  removeOrderAnswer(idx) {
    const item = this.orderAnswer[idx];
    this.shuffledWords[item.idx] = item.word;
    this.orderAnswer.splice(idx, 1);
    this.renderOrder();
  },

  renderOrder() {
    document.getElementById('order-answer').innerHTML = this.orderAnswer.map((a, i) =>
      `<div class="order-answer-word" onclick="challengePage.removeOrderAnswer(${i})">${a.word}</div>`
    ).join('');
    document.getElementById('order-words').innerHTML = this.shuffledWords.map((w, i) =>
      w ? `<div class="order-word" onclick="challengePage.orderClick(${i})">${w}</div>` : ''
    ).join('');
  },

  checkOrder() {
    this.stopTimer();
    const answer = this.orderAnswer.map(a => a.word).join(' ');
    const correct = this.orderWords.join(' ');
    const userId = storage.getActiveProfileId();

    if (answer === correct) {
      this.score = 5;
      storage.addStars(userId, 5);
      storage.incrementChallenges(userId);
      ui.checkAchievements(userId);
      document.getElementById('order-sentence').textContent = '✅ 正确！太棒了！';
      document.getElementById('order-sentence').style.color = 'var(--success)';
      ui.toast('句子排序正确！+5⭐', '🎉');
      ui.confetti();
    } else {
      document.getElementById('order-sentence').textContent = `❌ 正确答案：${this.orderSentence.en}`;
      document.getElementById('order-sentence').style.color = 'var(--danger)';
      storage.incrementChallenges(userId);
    }

    setTimeout(() => this.back(), 3000);
  },

  // 工具函数
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
};

// ---- 听句填空 ----
const listenFillPage = {
  questionCount: 10,
  difficulty: 0, // 0=全部, 1=简单, 2=中等, 3=困难
  sentences: [],
  currentIndex: 0,
  correctCount: 0,
  score: 0,
  phonicsVisible: true,

  render(userId) {
    if (!userId) return;
    // 显示设置面板
    document.getElementById('fill-settings').classList.remove('hidden');
    document.getElementById('fill-quiz').classList.add('hidden');
    document.getElementById('fill-result').classList.add('hidden');
    // 显示可用句子数
    const total = sentenceGenerator.getTotalCount();
    document.getElementById('fill-sentence-count').textContent = `共有 ${total} 道题目可用`;
  },

  setCount(count, el) {
    this.questionCount = count;
    document.querySelectorAll('#fill-count-options .settings-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
  },

  setDifficulty(diff, el) {
    this.difficulty = diff;
    document.querySelectorAll('#fill-diff-options .settings-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
  },

  start() {
    const userId = storage.getActiveProfileId();
    if (!userId) return;

    // 获取句子
    if (this.difficulty === 0) {
      this.sentences = sentenceGenerator.getProgressive(this.questionCount);
    } else {
      const pool = sentenceGenerator.getByDifficulty(this.difficulty);
      // 洗牌并取指定数量
      this.sentences = sentenceGenerator.shuffle(pool).slice(0, this.questionCount);
    }

    if (this.sentences.length === 0) {
      ui.toast('没有找到题目，请调整设置', '😅');
      return;
    }

    this.currentIndex = 0;
    this.correctCount = 0;
    this.score = 0;
    this.phonicsVisible = true;

    // 切换显示
    document.getElementById('fill-settings').classList.add('hidden');
    document.getElementById('fill-quiz').classList.remove('hidden');
    document.getElementById('fill-result').classList.add('hidden');

    this.showQuestion();
  },

  showQuestion() {
    const sentence = this.sentences[this.currentIndex];
    if (!sentence) {
      this.showResult();
      return;
    }

    const blankWord = sentence.blankWord;
    if (!blankWord) {
      // 如果没有空白词，跳过
      this.currentIndex++;
      this.showQuestion();
      return;
    }

    // 更新进度
    const total = this.sentences.length;
    document.getElementById('fill-progress-text').textContent = `${this.currentIndex + 1} / ${total}`;
    document.getElementById('fill-progress-fill').style.width = `${(this.currentIndex / total) * 100}%`;
    document.getElementById('fill-correct-count').textContent = `✅ ${this.correctCount}`;
    document.getElementById('fill-score').textContent = `⭐ ${this.score}`;

    // 构建带空白的句子显示
    const sentenceHTML = this.buildSentenceHTML(sentence, blankWord);
    document.getElementById('fill-sentence').innerHTML = sentenceHTML;
    document.getElementById('fill-emoji').textContent = sentence.emoji;

    // 自然拼读提示
    const phonicsHTML = phonics.teachingHTML(blankWord.en);
    const phonicsSound = phonics.soundText(blankWord.en);
    document.getElementById('fill-phonics-body').innerHTML = `
      ${phonicsHTML}
      <div style="width:100%;text-align:center;margin-top:8px;color:var(--text-light);font-size:0.9em;">
        整体读音：${phonicsSound}
      </div>
    `;
    // 默认显示拼读提示
    document.getElementById('fill-phonics').style.display = this.phonicsVisible ? 'block' : 'none';

    // 生成选项（4选1）
    this.currentBlankWord = blankWord;
    const options = this.generateOptions(blankWord);
    const optionsContainer = document.getElementById('fill-options');
    optionsContainer.innerHTML = options.map(opt => `
      <button class="fill-option" onclick="listenFillPage.checkAnswer('${opt.en}', this)">
        ${opt.emoji} ${opt.en}
        <span style="color:var(--text-light);font-size:0.8em;margin-left:4px">${opt.zh}</span>
      </button>
    `).join('');

    // 清除反馈
    document.getElementById('fill-feedback').textContent = '';
    document.getElementById('fill-next-btn').classList.add('hidden');

    // 自动播放语音
    setTimeout(() => this.playSound(), 500);
  },

  buildSentenceHTML(sentence, blankWord) {
    // 将句子中的空白单词替换为 ____ 显示
    const en = sentence.en;
    const regex = new RegExp(`\\b${blankWord.en}\\b`, 'i');
    return en.replace(regex, `<span class="fill-blank">____</span>`);
  },

  generateOptions(correctWord) {
    const options = [correctWord];
    // 选3个干扰项（同类别优先，不同类别补充）
    const sameCat = VOCAB_DATA.filter(v => v.category === correctWord.category && v.id !== correctWord.id);
    const diffCat = VOCAB_DATA.filter(v => v.category !== correctWord.category);

    // 从同类别选2个
    const shuffledSame = sentenceGenerator.shuffle(sameCat);
    options.push(...shuffledSame.slice(0, 2));

    // 从不同类别选1个
    const shuffledDiff = sentenceGenerator.shuffle(diffCat);
    options.push(shuffledDiff[0]);

    // 打乱选项顺序
    return sentenceGenerator.shuffle(options.filter(Boolean));
  },

  checkAnswer(selected, element) {
    const userId = storage.getActiveProfileId();
    const isCorrect = selected === this.currentBlankWord.en;

    // 禁用所有选项
    document.querySelectorAll('.fill-option').forEach(o => o.classList.add('disabled'));

    if (isCorrect) {
      element.classList.add('correct');
      this.correctCount++;
      this.score += 10;
      document.getElementById('fill-feedback').innerHTML = `✅ <span style="color:var(--success)">正确！</span> ${this.currentBlankWord.en} = ${this.currentBlankWord.zh}`;
      storage.addStars(userId, 2);
      storage.markWordLearned(userId, this.currentBlankWord.id);
    } else {
      element.classList.add('wrong');
      // 高亮正确答案
      document.querySelectorAll('.fill-option').forEach(o => {
        if (o.textContent.includes(this.currentBlankWord.en)) {
          o.classList.add('correct');
        }
      });
      document.getElementById('fill-feedback').innerHTML = `❌ 正确答案是：<strong>${this.currentBlankWord.en}</strong> (${this.currentBlankWord.zh})`;
    }

    storage.updateStreak(userId);
    ui.checkAchievements(userId);

    // 更新分数显示
    document.getElementById('fill-correct-count').textContent = `✅ ${this.correctCount}`;
    document.getElementById('fill-score').textContent = `⭐ ${this.score}`;

    // 显示下一题按钮
    document.getElementById('fill-next-btn').classList.remove('hidden');

    // 播放正确答案语音
    speech.speak(this.currentBlankWord.en);
  },

  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex >= this.sentences.length) {
      this.showResult();
    } else {
      this.showQuestion();
    }
  },

  showResult() {
    const userId = storage.getActiveProfileId();
    document.getElementById('fill-quiz').classList.add('hidden');
    document.getElementById('fill-result').classList.remove('hidden');

    const total = this.sentences.length;
    const percent = Math.round(this.correctCount / total * 100);

    document.getElementById('fill-result-correct').textContent = this.correctCount;
    document.getElementById('fill-result-total').textContent = total;
    document.getElementById('fill-result-stars').textContent = this.score;

    // 根据成绩显示不同表情
    let emoji = '🎉';
    let title = '练习完成！';
    if (percent >= 90) { emoji = '🏆'; title = '太棒了！完美！'; }
    else if (percent >= 70) { emoji = '😊'; title = '做得很好！'; }
    else if (percent >= 50) { emoji = '💪'; title = '继续加油！'; }
    else { emoji = '📚'; title = '多练习就会进步！'; }

    document.getElementById('fill-result-emoji').textContent = emoji;
    document.getElementById('fill-result-title').textContent = title;

    storage.addStars(userId, this.score);
    storage.incrementQuizzes(userId);
    ui.checkAchievements(userId);

    if (percent >= 90) ui.confetti();
  },

  restart() {
    this.render(storage.getActiveProfileId());
  },

  playSound() {
    const sentence = this.sentences[this.currentIndex];
    if (sentence) speech.speak(sentence.en, 0.75);
  },

  togglePhonics() {
    this.phonicsVisible = !this.phonicsVisible;
    document.getElementById('fill-phonics').style.display = this.phonicsVisible ? 'block' : 'none';
  },
};

// ---- 成就页面 ----
const achievementsPage = {
  render(userId) {
    if (!userId) return;
    const progress = storage.getProgress(userId);
    const grid = document.getElementById('achievements-grid');
    grid.innerHTML = ACHIEVEMENTS.map(ach => {
      const unlocked = progress.unlockedAchievements.includes(ach.id);
      return `
        <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${ach.emoji}</div>
          <div class="achievement-name">${ach.name}</div>
          <div class="achievement-desc">${ach.desc}</div>
        </div>
      `;
    }).join('');
  },
};

// ---- 应用初始化 ----
function initApp() {
  router.init();
  setup.init();

  const profile = storage.getActiveProfile();
  if (profile) {
    document.body.classList.toggle('child-mode', profile.role === 'child');
    setup.updateNavProfile(profile);
    const page = window.location.hash.slice(1) || 'dashboard';
    router.navigate(page);
  } else {
    document.getElementById('page-setup').classList.remove('hidden');
  }
}

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', initApp);
