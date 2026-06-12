// ===== 自然拼读引擎 =====
// 自动将英文单词拆解为自然拼读音节，标注每个部分怎么读

const phonics = {
  // 辅音字母发音
  CONSONANT_SOUNDS: {
    b: 'b(波)', c: 'k(克)', d: 'd(得)', f: 'f(夫)',
    g: 'g(哥)', h: 'h(喝)', j: 'j(吉)', k: 'k(克)',
    l: 'l(了)', m: 'm(摸)', n: 'n(呢)', p: 'p(泼)',
    q: 'kw(夸)', r: 'r(若)', s: 's(丝)', t: 't(特)',
    v: 'v(维)', w: 'w(乌)', x: 'ks(克斯)', y: 'y(耶)',
    z: 'z(兹)',
  },

  // 元音短音
  SHORT_VOWELS: {
    a: 'æ(哎)', e: 'e(诶)', i: 'i(衣)', o: 'o(哦)', u: 'u(乌)',
  },

  // 元音长音
  LONG_VOWELS: {
    a: 'eɪ(诶一)', e: 'iː(衣衣)', i: 'aɪ(啊一)', o: 'oʊ(欧)', u: 'juː(优)',
  },

  // 元音组合
  VOWEL_TEAMS: {
    ai: 'eɪ(诶一)',  ay: 'eɪ(诶一)',  ea: 'iː(衣衣)',  ee: 'iː(衣衣)',
    ie: 'aɪ(啊一)',   oa: 'oʊ(欧)',    oo: 'uː(乌乌)',  ou: 'aʊ(啊乌)',
    au: 'ɔː(奥)',     aw: 'ɔː(奥)',    oi: 'ɔɪ(奥一)',  oy: 'ɔɪ(奥一)',
    ew: 'juː(优)',    ui: 'uː(乌乌)',  ue: 'uː(乌乌)',  ei: 'eɪ(诶一)',
    ey: 'iː(衣衣)',  ie: 'iː(衣衣)',
  },

  // 辅音组合
  CONSONANT_BLENDS: {
    ch: 'tʃ(吃)',  sh: 'ʃ(诗)',   th: 'θ(丝舌)',  th_voiced: 'ð(兹舌)',
    wh: 'w(乌)',   ph: 'f(夫)',   gh: '',          ng: 'ŋ(嗯)',
    nk: 'ŋk(嗯克)', ck: 'k(克)',
    bl: 'bl(波了)', cl: 'kl(克了)', fl: 'fl(夫了)', gl: 'gl(哥了)',
    pl: 'pl(泼了)', sl: 'sl(丝了)', br: 'br(波若)', cr: 'kr(克若)',
    dr: 'dr(得若)', fr: 'fr(夫若)', gr: 'gr(哥若)', pr: 'pr(泼若)',
    tr: 'tr(特若)', sc: 'sk(丝克)', sk: 'sk(丝克)', sm: 'sm(丝摸)',
    sn: 'sn(丝呢)', sp: 'sp(丝泼)', st: 'st(丝特)', sw: 'sw(丝乌)',
    tw: 'tw(特乌)', str: 'str(丝特若)', spl: 'spl(丝泼了)',
    spr: 'spr(丝泼若)', scr: 'skr(丝克若)',
  },

  // 特殊后缀
  SUFFIXES: {
    tion: 'ʃən(深)',   sion: 'ʒən(忍)',  ture: 'tʃər(扯)',
    ous: 'əs(额斯)',   ful: 'fəl(否)',    ing: 'ɪŋ(英)',
    ed_t: 't(特)',     ed_d: 'd(得)',     ed_id: 'ɪd(一得)',
    er: 'ər(额)',      est: 'ɪst(一斯特)', ly: 'li(里)',
    ness: 'nəs(尼斯)', ment: 'mənt(门特)', able: 'əbəl(额波)',
    ize: 'aɪz(啊一兹)', ise: 'aɪz(啊一兹)',
  },

  // 特殊前缀
  PREFIXES: {
    un: 'ʌn(安)',  re: 'riː(日衣)', pre: 'priː(扑日衣)',
    dis: 'dɪs(迪斯)', mis: 'mɪs(密斯)', over: 'oʊvər(欧我)',
    under: 'ʌndər(安得)', out: 'aʊt(啊乌特)',
  },

  // 核心方法：拆解单词
  breakdown(word) {
    word = word.toLowerCase().trim();
    if (!word) return [];

    // 先检查整体是否有已知映射
    const wholeMap = this.WORD_MAP[word];
    if (wholeMap) return wholeMap;

    // 尝试按规则拆解
    return this.autoBreakdown(word);
  },

  // 自动拆解算法
  autoBreakdown(word) {
    const result = [];
    let i = 0;
    const len = word.length;

    while (i < len) {
      // 1. 检查前缀
      if (i === 0) {
        const prefix = this.matchPrefix(word, i);
        if (prefix) {
          result.push({ part: prefix.part, sound: prefix.sound });
          i += prefix.part.length;
          continue;
        }
      }

      // 2. 检查后缀
      const suffix = this.matchSuffix(word, i);
      if (suffix && i + suffix.part.length === len) {
        result.push({ part: suffix.part, sound: suffix.sound });
        i += suffix.part.length;
        continue;
      }

      // 3. 检查辅音组合（双字母或三字母）
      const blend = this.matchBlend(word, i);
      if (blend) {
        result.push({ part: blend.part, sound: blend.sound });
        i += blend.part.length;
        continue;
      }

      // 4. 检查元音组合
      const vowelTeam = this.matchVowelTeam(word, i);
      if (vowelTeam) {
        result.push({ part: vowelTeam.part, sound: vowelTeam.sound });
        i += vowelTeam.part.length;
        continue;
      }

      // 5. 检查 magic e 模式 (CVC + e)
      if (i + 3 < len && this.isConsonant(word[i]) && this.isVowel(word[i+1]) &&
          this.isConsonant(word[i+2]) && word[i+3] === 'e') {
        const v = word[i+1];
        result.push({ part: word[i], sound: this.CONSONANT_SOUNDS[word[i]] || word[i] });
        result.push({ part: v + word[i+2] + 'e', sound: (this.LONG_VOWELS[v] || v) + '+' + (this.CONSONANT_SOUNDS[word[i+2]] || word[i+2]) });
        i += 4;
        continue;
      }

      // 6. 单个元音
      if (this.isVowel(word[i])) {
        // 判断短音还是长音（简单启发：后面跟辅音+元音=长音，跟辅音+辅音/结尾=短音）
        const nextIsConsonant = i+1 < len && this.isConsonant(word[i+1]);
        const afterThat = i+2 < len ? word[i+2] : '';
        const isLong = nextIsConsonant && this.isVowel(afterThat);

        const sound = isLong ? this.LONG_VOWELS[word[i]] : this.SHORT_VOWELS[word[i]];
        result.push({ part: word[i], sound: sound || word[i] });
        i++;
        continue;
      }

      // 7. 单个辅音
      if (this.isConsonant(word[i])) {
        result.push({ part: word[i], sound: this.CONSONANT_SOUNDS[word[i]] || word[i] });
        i++;
        continue;
      }

      // 8. 其他字符（数字、符号等直接跳过）
      result.push({ part: word[i], sound: word[i] });
      i++;
    }

    return result;
  },

  // 匹配前缀
  matchPrefix(word, start) {
    for (const [p, sound] of Object.entries(this.PREFIXES)) {
      if (word.substring(start, start + p.length) === p) {
        return { part: p, sound };
      }
    }
    return null;
  },

  // 匹配后缀
  matchSuffix(word, pos) {
    for (const [s, sound] of Object.entries(this.SUFFIXES)) {
      if (word.substring(pos, pos + s.length) === s) {
        // ed 有三种读法，这里简化
        return { part: s, sound };
      }
    }
    return null;
  },

  // 匹配辅音组合
  matchBlend(word, pos) {
    // 先试三字母
    const tri = word.substring(pos, pos + 3);
    if (this.CONSONANT_BLENDS[tri]) {
      return { part: tri, sound: this.CONSONANT_BLENDS[tri] };
    }
    // 再试双字母
    const di = word.substring(pos, pos + 2);
    if (this.CONSONANT_BLENDS[di]) {
      return { part: di, sound: this.CONSONANT_BLENDS[di] };
    }
    return null;
  },

  // 匹配元音组合
  matchVowelTeam(word, pos) {
    const di = word.substring(pos, pos + 2);
    if (this.VOWEL_TEAMS[di]) {
      return { part: di, sound: this.VOWEL_TEAMS[di] };
    }
    return null;
  },

  isVowel(ch) {
    return 'aeiou'.includes(ch);
  },

  isConsonant(ch) {
    return ch >= 'a' && ch <= 'z' && !this.isVowel(ch);
  },

  // 生成显示用的拼读文本
  displayText(word) {
    const parts = this.breakdown(word);
    return parts.map(p => p.part).join(' - ');
  },

  // 生成音标提示文本
  soundText(word) {
    const parts = this.breakdown(word);
    return parts.map(p => p.sound).join(' ');
  },

  // 生成详细的拼读教学 HTML
  teachingHTML(word) {
    const parts = this.breakdown(word);
    return parts.map(p => {
      const color = this.isVowel(p.part[0]) ? '#FF6B6B' : '#4ECDC4';
      return `<span class="phonics-part" style="border-bottom: 3px solid ${color}">
        <span class="phonics-letter">${p.part}</span>
        <span class="phonics-sound">${p.sound}</span>
      </span>`;
    }).join('<span class="phonics-dot">·</span>');
  },

  // 常见单词的手动精确映射（覆盖自动拆解的常见错误）
  WORD_MAP: {
    the: [{ part: 'the', sound: 'ðə(的额)' }],
    a: [{ part: 'a', sound: 'ə(额)' }],
    an: [{ part: 'an', sound: 'æn(安)' }],
    is: [{ part: 'is', sound: 'ɪz(一兹)' }],
    are: [{ part: 'are', sound: 'ɑːr(啊)' }],
    was: [{ part: 'was', sound: 'wɒz(我兹)' }],
    were: [{ part: 'were', sound: 'wɜːr(我)' }],
    have: [{ part: 'ha', sound: 'hæ(哈)' }, { part: 've', sound: 'v(夫)' }],
    has: [{ part: 'has', sound: 'hæz(哈兹)' }],
    do: [{ part: 'do', sound: 'duː(杜)' }],
    does: [{ part: 'does', sound: 'dʌz(达兹)' }],
    said: [{ part: 'said', sound: 'sed(赛的)' }],
    says: [{ part: 'says', sound: 'sez(赛兹)' }],
    eye: [{ part: 'eye', sound: 'aɪ(啊一)' }],
    one: [{ part: 'one', sound: 'wʌn(万)' }],
    two: [{ part: 'two', sound: 'tuː(兔)' }],
    eight: [{ part: 'eight', sound: 'eɪt(诶特)' }],
    right: [{ part: 'righ', sound: 'raɪ(如啊一)' }, { part: 't', sound: 't(特)' }],
    light: [{ part: 'ligh', sound: 'laɪ(了啊一)' }, { part: 't', sound: 't(特)' }],
    night: [{ part: 'nigh', sound: 'naɪ(呢啊一)' }, { part: 't', sound: 't(特)' }],
    know: [{ part: 'k', sound: '(不发音)' }, { part: 'now', sound: 'noʊ(呢欧)' }],
    knee: [{ part: 'k', sound: '(不发音)' }, { part: 'nee', sound: 'niː(妮)' }],
    write: [{ part: 'wr', sound: 'r(若)' }, { part: 'i', sound: 'aɪ(啊一)' }, { part: 'te', sound: 't(特)' }],
    who: [{ part: 'wh', sound: 'h(喝)' }, { part: 'o', sound: 'uː(乌)' }],
    what: [{ part: 'wh', sound: 'w(乌)' }, { part: 'a', sound: 'ɒ(哦)' }, { part: 't', sound: 't(特)' }],
    school: [{ part: 'sch', sound: 'sk(丝克)' }, { part: 'oo', sound: 'uː(乌乌)' }, { part: 'l', sound: 'l(了)' }],
    chair: [{ part: 'ch', sound: 'tʃ(吃)' }, { part: 'air', sound: 'eə(诶额)' }],
    phone: [{ part: 'ph', sound: 'f(夫)' }, { part: 'o', sound: 'oʊ(欧)' }, { part: 'ne', sound: 'n(呢)' }],
    elephant: [{ part: 'e', sound: 'e(诶)' }, { part: 'le', sound: 'l(了)' }, { part: 'ph', sound: 'f(夫)' }, { part: 'ant', sound: 'ənt(恩特)' }],
    beautiful: [{ part: 'beau', sound: 'bjuː(比优)' }, { part: 'ti', sound: 'tə(特额)' }, { part: 'ful', sound: 'fəl(否)' }],
  },
};
