// ===== 句子生成器 =====
// 通过模板 + 词汇组合，动态生成 2000+ 句子

const sentenceGenerator = {
  // 句子模板：{ template, blanks, difficulty }
  // 模板中 {0} {1} 等表示需要填入的词汇槽位
  TEMPLATES: [
    // ---- 难度1：简单句 ----
    { t: "I have a {0}.", blanks: 1, d: 1, cat: ['animals'] },
    { t: "This is {0}.", blanks: 1, d: 1, cat: ['colors'] },
    { t: "I want {0}.", blanks: 1, d: 1, cat: ['food'] },
    { t: "I like {0}.", blanks: 1, d: 1, cat: ['food', 'animals', 'colors'] },
    { t: "Look at the {0}.", blanks: 1, d: 1, cat: ['animals'] },
    { t: "I see a {0}.", blanks: 1, d: 1, cat: ['animals'] },
    { t: "It is {0}.", blanks: 1, d: 1, cat: ['colors'] },
    { t: "I love {0}.", blanks: 1, d: 1, cat: ['family', 'food'] },
    { t: "The {0} is big.", blanks: 1, d: 1, cat: ['animals'] },
    { t: "The {0} is small.", blanks: 1, d: 1, cat: ['animals'] },
    { t: "I am {0}.", blanks: 1, d: 1, cat: ['emotions'] },
    { t: "I have {0}.", blanks: 1, d: 1, cat: ['food', 'toys'] },
    { t: "I can see a {0}.", blanks: 1, d: 1, cat: ['animals'] },
    { t: "I am a {0}.", blanks: 1, d: 1, cat: ['family'] },
    { t: "This is my {0}.", blanks: 1, d: 1, cat: ['family', 'toys', 'body'] },
    { t: "I eat {0}.", blanks: 1, d: 1, cat: ['food'] },
    { t: "I drink {0}.", blanks: 1, d: 1, cat: ['food'] },
    { t: "I have a {0} {0}.", blanks: 1, d: 1, cat: ['colors', 'animals'] },
    { t: "My {0} is {0}.", blanks: 2, d: 1, cat: ['body', 'colors'] },
    { t: "The {0} is {0}.", blanks: 2, d: 1, cat: ['animals', 'colors'] },
    { t: "I see {0} {0}.", blanks: 2, d: 1, cat: ['numbers', 'animals'] },
    { t: "I have {0} {0}.", blanks: 2, d: 1, cat: ['numbers', 'food'] },
    { t: "The {0} is on the {0}.", blanks: 2, d: 1, cat: ['animals', 'house'] },
    { t: "I play with my {0}.", blanks: 1, d: 1, cat: ['toys'] },
    { t: "I read a {0}.", blanks: 1, d: 1, cat: ['school'] },
    { t: "I wear a {0}.", blanks: 1, d: 1, cat: ['clothes'] },
    { t: "I wash my {0}.", blanks: 1, d: 1, cat: ['body'] },
    { t: "I use a {0}.", blanks: 1, d: 1, cat: ['school', 'house'] },
    { t: "I draw a {0}.", blanks: 1, d: 1, cat: ['animals', 'colors'] },
    { t: "I need a {0}.", blanks: 1, d: 1, cat: ['food', 'clothes'] },

    // ---- 难度2：复合句 ----
    { t: "I have a {0} and a {0}.", blanks: 2, d: 2, cat: ['animals'] },
    { t: "The {0} is {0} and {0}.", blanks: 3, d: 2, cat: ['animals', 'colors'] },
    { t: "I like {0} and {0}.", blanks: 2, d: 2, cat: ['food'] },
    { t: "She has a {0}.", blanks: 1, d: 2, cat: ['animals', 'toys'] },
    { t: "He has a {0}.", blanks: 1, d: 2, cat: ['animals', 'toys'] },
    { t: "She is {0}.", blanks: 1, d: 2, cat: ['emotions'] },
    { t: "He is {0}.", blanks: 1, d: 2, cat: ['emotions'] },
    { t: "My mom is {0}.", blanks: 1, d: 2, cat: ['emotions'] },
    { t: "My dad is {0}.", blanks: 1, d: 2, cat: ['emotions'] },
    { t: "We like {0}.", blanks: 1, d: 2, cat: ['food', 'sports'] },
    { t: "They have {0}.", blanks: 1, d: 2, cat: ['animals', 'food'] },
    { t: "I want to {0}.", blanks: 1, d: 2, cat: ['actions'] },
    { t: "I like to {0}.", blanks: 1, d: 2, cat: ['actions'] },
    { t: "I can {0}.", blanks: 1, d: 2, cat: ['actions'] },
    { t: "I go to {0}.", blanks: 1, d: 2, cat: ['places'] },
    { t: "I come from {0}.", blanks: 1, d: 2, cat: ['places'] },
    { t: "The {0} is in the {0}.", blanks: 2, d: 2, cat: ['animals', 'house'] },
    { t: "The {0} is on the {0}.", blanks: 2, d: 2, cat: ['food', 'house'] },
    { t: "The {0} is under the {0}.", blanks: 2, d: 2, cat: ['animals', 'house'] },
    { t: "The {0} is next to the {0}.", blanks: 2, d: 2, cat: ['animals', 'house'] },
    { t: "I put the {0} on the {0}.", blanks: 2, d: 2, cat: ['food', 'house'] },
    { t: "This {0} is very {0}.", blanks: 2, d: 2, cat: ['animals', 'emotions'] },
    { t: "That {0} is very {0}.", blanks: 2, d: 2, cat: ['food', 'emotions'] },
    { t: "I have a {0} {0}.", blanks: 2, d: 2, cat: ['colors', 'animals'] },
    { t: "My {0} is {0}.", blanks: 2, d: 2, cat: ['body', 'colors'] },
    { t: "I want a {0} {0}.", blanks: 2, d: 2, cat: ['colors', 'food'] },
    { t: "Please give me {0}.", blanks: 1, d: 2, cat: ['food'] },
    { t: "Can I have {0}?", blanks: 1, d: 2, cat: ['food'] },
    { t: "Do you like {0}?", blanks: 1, d: 2, cat: ['food', 'animals'] },
    { t: "Is this a {0}?", blanks: 1, d: 2, cat: ['animals'] },

    // ---- 难度3：复杂句 ----
    { t: "I want to {0} with my {0}.", blanks: 2, d: 3, cat: ['actions', 'family'] },
    { t: "My {0} likes to {0}.", blanks: 2, d: 3, cat: ['family', 'actions'] },
    { t: "The {0} {0} is very {0}.", blanks: 3, d: 3, cat: ['colors', 'animals', 'emotions'] },
    { t: "I see a {0} {0} in the {0}.", blanks: 3, d: 3, cat: ['colors', 'animals', 'nature'] },
    { t: "She wants to {0} the {0}.", blanks: 2, d: 3, cat: ['actions', 'animals'] },
    { t: "He likes to {0} {0}.", blanks: 2, d: 3, cat: ['actions', 'food'] },
    { t: "We are going to the {0}.", blanks: 1, d: 3, cat: ['places'] },
    { t: "They are playing with a {0}.", blanks: 1, d: 3, cat: ['toys'] },
    { t: "The {0} is sleeping on the {0}.", blanks: 2, d: 3, cat: ['animals', 'house'] },
    { t: "I like to eat {0} with {0}.", blanks: 2, d: 3, cat: ['food'] },
    { t: "My {0} is wearing a {0} {0}.", blanks: 3, d: 3, cat: ['family', 'colors', 'clothes'] },
    { t: "Can you {0} the {0}?", blanks: 2, d: 3, cat: ['actions', 'animals'] },
    { t: "Let's {0} to the {0}.", blanks: 2, d: 3, cat: ['actions', 'places'] },
    { t: "I need to {0} my {0}.", blanks: 2, d: 3, cat: ['actions', 'body'] },
    { t: "The {0} in the {0} is {0}.", blanks: 3, d: 3, cat: ['animals', 'nature', 'colors'] },
    { t: "Don't {0} the {0}.", blanks: 2, d: 3, cat: ['actions', 'animals'] },
    { t: "I want {0} and {0} for {0}.", blanks: 3, d: 3, cat: ['food', 'food', 'meals'] },
    { t: "Every {0} I {0}.", blanks: 2, d: 3, cat: ['time', 'actions'] },
    { t: "When it is {0}, I {0}.", blanks: 2, d: 3, cat: ['weather', 'actions'] },
    { t: "My favorite {0} is {0}.", blanks: 2, d: 3, cat: ['category', 'animals'] },
  ],

  // 运行时生成句子
  _sentences: null,
  _sentenceIdCounter: 0,

  // 生成所有句子
  generateAll() {
    if (this._sentences) return this._sentences;
    this._sentences = [];
    this._sentenceIdCounter = 0;

    this.TEMPLATES.forEach(tmpl => {
      const sentences = this.fillTemplate(tmpl);
      this._sentences.push(...sentences);
    });

    return this._sentences;
  },

  // 根据模板生成句子
  fillTemplate(tmpl) {
    const results = [];
    const slotCategories = tmpl.cat || ['food'];
    const blankCount = tmpl.blanks;

    // 获取每个槽位的候选词
    const slotCandidates = [];
    for (let i = 0; i < Math.max(blankCount, 1); i++) {
      const cat = slotCategories[i % slotCategories.length];
      const words = VOCAB_DATA.filter(v => v.category === cat);
      if (words.length === 0) {
        slotCandidates.push(VOCAB_DATA.slice(0, 10));
      } else {
        slotCandidates.push(words);
      }
    }

    // 生成组合（限制每个模板最多生成一定数量）
    const maxPerTemplate = 50;
    let count = 0;

    // 对于单槽位模板
    if (blankCount <= 1) {
      const words = slotCandidates[0];
      for (const word of words) {
        if (count >= maxPerTemplate) break;
        const en = tmpl.t.replace('{0}', word.en);
        const zh = this.translateTemplate(tmpl.t, word);
        this._sentenceIdCounter++;
        results.push({
          id: this._sentenceIdCounter,
          en,
          zh,
          emoji: word.emoji,
          difficulty: tmpl.d,
          blankWord: word,
          template: tmpl.t,
        });
        count++;
      }
    } else {
      // 对于多槽位模板，使用组合
      const words0 = slotCandidates[0];
      const words1 = slotCandidates[1] || slotCandidates[0];
      for (const w0 of words0) {
        for (const w1 of words1) {
          if (count >= maxPerTemplate) break;
          if (w0.id === w1.id) continue;
          let en = tmpl.t.replace('{0}', w0.en);
          if (blankCount >= 2) en = en.replace('{0}', w1.en);
          const zh = this.translateTemplate(tmpl.t, w0, w1);
          this._sentenceIdCounter++;
          results.push({
            id: this._sentenceIdCounter,
            en,
            zh,
            emoji: w0.emoji,
            difficulty: tmpl.d,
            blankWord: w0, // 第一个空白词为主考词
            template: tmpl.t,
          });
          count++;
        }
      }
    }

    return results;
  },

  // 翻译模板（中文提示）
  translateTemplate(template, w0, w1) {
    let zh = template;
    // 简单替换翻译
    const translations = {
      "I have a {0}.": `我有一个${w0.zh}。`,
      "This is {0}.": `这是${w0.zh}。`,
      "I want {0}.": `我想要${w0.zh}。`,
      "I like {0}.": `我喜欢${w0.zh}。`,
      "Look at the {0}.": `看那个${w0.zh}。`,
      "I see a {0}.": `我看见一个${w0.zh}。`,
      "It is {0}.": `它是${w0.zh}的。`,
      "I love {0}.": `我爱${w0.zh}。`,
      "The {0} is big.": `这个${w0.zh}很大。`,
      "The {0} is small.": `这个${w0.zh}很小。`,
      "I am {0}.": `我很${w0.zh}。`,
      "I have {0}.": `我有${w0.zh}。`,
      "I can see a {0}.": `我能看见一个${w0.zh}。`,
      "I am a {0}.": `我是${w0.zh}。`,
      "This is my {0}.": `这是我的${w0.zh}。`,
      "I eat {0}.": `我吃${w0.zh}。`,
      "I drink {0}.": `我喝${w0.zh}。`,
      "I play with my {0}.": `我玩我的${w0.zh}。`,
      "I read a {0}.": `我读${w0.zh}。`,
      "I wear a {0}.": `我穿${w0.zh}。`,
      "I wash my {0}.": `我洗${w0.zh}。`,
      "I use a {0}.": `我用${w0.zh}。`,
      "I draw a {0}.": `我画一个${w0.zh}。`,
      "I need a {0}.": `我需要一个${w0.zh}。`,
      "She has a {0}.": `她有一个${w0.zh}。`,
      "He has a {0}.": `他有一个${w0.zh}。`,
      "She is {0}.": `她很${w0.zh}。`,
      "He is {0}.": `他很${w0.zh}。`,
      "My mom is {0}.": `我妈妈很${w0.zh}。`,
      "My dad is {0}.": `我爸爸很${w0.zh}。`,
      "We like {0}.": `我们喜欢${w0.zh}。`,
      "They have {0}.": `他们有${w0.zh}。`,
      "I want to {0}.": `我想去${w0.zh}。`,
      "I like to {0}.": `我喜欢${w0.zh}。`,
      "I can {0}.": `我会${w0.zh}。`,
      "I go to {0}.": `我去${w0.zh}。`,
      "I come from {0}.": `我来自${w0.zh}。`,
      "Please give me {0}.": `请给我${w0.zh}。`,
      "Can I have {0}?": `我可以要${w0.zh}吗？`,
      "Do you like {0}?": `你喜欢${w0.zh}吗？`,
      "Is this a {0}?": `这是${w0.zh}吗？`,
      "We are going to the {0}.": `我们要去${w0.zh}。`,
      "They are playing with a {0}.": `他们在玩${w0.zh}。`,
      "Don't {0} the {0}.": `不要${w0.zh}那个${w1 ? w1.zh : ''}。`,
    };

    if (translations[template]) return translations[template];

    // 通用翻译（替换占位符）
    let result = template.replace('{0}', w0.zh);
    if (w1) result = result.replace('{0}', w1.zh);
    return result;
  },

  // 按难度获取句子
  getByDifficulty(difficulty) {
    const all = this.generateAll();
    return all.filter(s => s.difficulty === difficulty);
  },

  // 获取指定数量的随机句子（从简到难）
  getRandom(count, startDifficulty = 1) {
    const all = this.generateAll();
    // 按难度排序
    const sorted = [...all].sort((a, b) => a.difficulty - b.difficulty);
    // 从指定难度开始取
    const filtered = sorted.filter(s => s.difficulty >= startDifficulty);
    // 打乱并取指定数量
    const shuffled = this.shuffle(filtered);
    return shuffled.slice(0, count);
  },

  // 按难度分层获取句子（保证从简到难）
  getProgressive(count) {
    const all = this.generateAll();
    const d1 = this.shuffle(all.filter(s => s.difficulty === 1));
    const d2 = this.shuffle(all.filter(s => s.difficulty === 2));
    const d3 = this.shuffle(all.filter(s => s.difficulty === 3));

    const result = [];
    // 按比例分配：简单40%，中等35%，困难25%
    const easyCount = Math.ceil(count * 0.4);
    const medCount = Math.ceil(count * 0.35);
    const hardCount = count - easyCount - medCount;

    result.push(...d1.slice(0, easyCount));
    result.push(...d2.slice(0, medCount));
    result.push(...d3.slice(0, hardCount));

    return this.shuffle(result);
  },

  // 获取总句子数
  getTotalCount() {
    return this.generateAll().length;
  },

  // 工具函数：洗牌
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
};
