// ===== UI 效果：撒花、Toast、动画 =====

const ui = {
  // === 撒花效果 ===
  confetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A29BFE', '#FD79A8', '#00B894'];

    // 创建粒子
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vy += 0.05; // 重力
      });

      if (frame < 120) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    animate();
  },

  // === Toast 通知 ===
  toast(message, icon = '✨') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  },

  // === 星星飞入动画 ===
  starAnimation(fromElement) {
    const star = document.createElement('div');
    star.textContent = '⭐';
    star.style.cssText = `
      position: fixed;
      font-size: 24px;
      z-index: 10001;
      pointer-events: none;
      transition: all 0.8s ease-in;
    `;

    const rect = fromElement.getBoundingClientRect();
    star.style.left = rect.left + rect.width / 2 + 'px';
    star.style.top = rect.top + 'px';
    document.body.appendChild(star);

    // 飞向右上角星星计数器
    requestAnimationFrame(() => {
      star.style.left = '90%';
      star.style.top = '10px';
      star.style.opacity = '0';
      star.style.transform = 'scale(0.3)';
    });

    setTimeout(() => star.remove(), 1000);
  },

  // === 正确/错误反馈 ===
  flashCorrect(element) {
    element.style.transition = 'background 0.2s';
    element.style.background = '#E0FFF5';
    setTimeout(() => { element.style.background = ''; }, 500);
  },

  flashWrong(element) {
    element.style.transition = 'background 0.2s';
    element.style.background = '#FFE0E0';
    setTimeout(() => { element.style.background = ''; }, 500);
    // 抖动效果
    element.style.animation = 'shake 0.4s ease';
    setTimeout(() => { element.style.animation = ''; }, 400);
  },

  // === 显示新成就解锁 ===
  showAchievementUnlock(achievement) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6); z-index: 10002;
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.3s ease;
    `;
    overlay.innerHTML = `
      <div style="background: white; border-radius: 24px; padding: 40px; text-align: center; max-width: 320px; animation: bounceIn 0.5s ease;">
        <div style="font-size: 4em; margin-bottom: 16px;">${achievement.emoji}</div>
        <div style="font-size: 0.9em; color: #636E72; margin-bottom: 8px;">🎉 新成就解锁！</div>
        <div style="font-size: 1.5em; font-weight: bold; margin-bottom: 8px;">${achievement.name}</div>
        <div style="color: #636E72; margin-bottom: 24px;">${achievement.desc}</div>
        <button onclick="this.closest('div[style]').parentElement.remove()"
                style="background: #FF6B6B; color: white; border: none; padding: 12px 32px; border-radius: 12px; font-size: 1.1em; cursor: pointer;">
          太棒了！
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    this.confetti();
  },

  // === 检查并解锁成就 ===
  checkAchievements(userId) {
    const progress = storage.getProgress(userId);
    const stats = {
      learnedWords: progress.learnedWords.length,
      learnedSentences: progress.learnedSentences.length,
      streak: progress.streak,
      quizzesDone: progress.quizzesDone,
      challengesDone: progress.challengesDone,
      perfectMatch: progress.perfectMatch,
      stars: progress.stars,
      categoryComplete: {},
    };

    // 检查分类完成情况
    for (const cat in CATEGORIES) {
      const catWords = VOCAB_DATA.filter(v => v.category === cat);
      stats.categoryComplete[cat] = catWords.every(v => progress.learnedWords.includes(v.id));
    }

    ACHIEVEMENTS.forEach(ach => {
      if (ach.condition(stats)) {
        const isNew = storage.unlockAchievement(userId, ach.id);
        if (isNew) {
          this.showAchievementUnlock(ach);
        }
      }
    });
  },
};

// 添加 shake 动画到 CSS
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
  @keyframes bounceIn {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.95); }
    100% { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(shakeStyle);
