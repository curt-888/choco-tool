// ===== Web Speech API 语音封装 =====

const speech = {
  // 播放英文语音
  speak(text, rate = 0.8) {
    if (!('speechSynthesis' in window)) {
      console.warn('浏览器不支持语音合成');
      return;
    }
    // 取消之前的语音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;     // 语速，儿童用慢一点
    utterance.pitch = 1.1;    // 音调稍高，更清晰
    utterance.volume = 1;

    // 尝试选择英文语音
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en')) ||
                    voices.find(v => v.lang.includes('US')) ||
                    voices.find(v => v.lang.includes('GB'));
    if (enVoice) utterance.voice = enVoice;

    window.speechSynthesis.speak(utterance);
  },

  // 慢速播放（给儿童用）
  speakSlow(text) {
    this.speak(text, 0.6);
  },

  // 获取可用语音列表（调试用）
  getVoices() {
    return new Promise(resolve => {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(window.speechSynthesis.getVoices());
        };
      }
    });
  },
};

// 预加载语音列表
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
