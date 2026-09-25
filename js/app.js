/* ============ 全局导航 / 首页动画 / 成就系统 ============ */

const Achievements = (() => {
  const DEFS = [
    { id: 'spark1',    emoji: '🔥', name: '初次点火', desc: '在驾驶挑战中成功完成一次点火' },
    { id: 'perfect10', emoji: '🎯', name: '点火大师', desc: '累计完成 10 次 Perfect 完美点火' },
    { id: 'combo10',   emoji: '🌪️', name: '连击达人', desc: '单局挑战达成 10 连击' },
    { id: 'redline',   emoji: '🚀', name: '红线转速', desc: '驾驶时转速突破 4800 RPM' },
    { id: 'overheat',  emoji: '🌡️', name: '红温警告', desc: '发动机过热一次（别学我）' },
    { id: 'distance',  emoji: '🏁', name: '老司机', desc: '单局行驶距离超过 3000 米' },
    { id: 'quizpass',  emoji: '🎓', name: '知识新星', desc: '通过任意一个知识关卡' },
    { id: 'allstars',  emoji: '🏅', name: '满分毕业', desc: '六大关卡全部获得三星' },
    { id: 'allparts',  emoji: '🧩', name: '全图鉴收集', desc: '解锁全部 10 个零件图鉴' }
  ];
  const toast = document.getElementById('ach-toast');
  let toastTimer = null;

  function unlock(id) {
    const d = DEFS.find(a => a.id === id);
    if (!d || Store.data.achievements[id]) return;
    Store.data.achievements[id] = Date.now();
    Store.save();
    document.getElementById('ach-toast-name').textContent = d.emoji + ' ' + d.name;
    toast.classList.remove('hidden');
    toast.style.animation = 'none';
    void toast.offsetWidth;
    toast.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
    if (document.getElementById('achieve-grid')) Codex.renderAchievements();
  }
  function checkParts() {
    if (Object.keys(Store.data.labClicks).length >= PARTS.length) unlock('allparts');
  }
  function checkQuiz() {
    unlock('quizpass');
    if (QuizLevelData.every((_, i) => Store.data.quizStars[i] === 3)) unlock('allstars');
  }
  return { DEFS, unlock, checkParts, checkQuiz };
})();

const App = (() => {
  const screens = ['home', 'lab', 'drive', 'quiz', 'codex'];
  let homeSim = null, homeRenderer = null, homeRAF = null, homeLast = 0;

  function show(name) {
    screens.forEach(n => document.getElementById('screen-' + n).classList.toggle('active', n === name));
    window.scrollTo(0, 0);
    if (name === 'home') startHome(); else stopHome();
    if (name === 'lab') Lab.enter();
    if (name === 'drive') Drive.enter();
    if (name === 'quiz') Quiz.enterMap();
    if (name === 'codex') Codex.enter();
  }

  function startHome() {
    const cv = document.getElementById('home-engine');
    if (!homeSim) {
      homeSim = new EngineSim();
      homeSim.rpm = 130;
      homeRenderer = new EngineRenderer(cv);
    }
    cancelAnimationFrame(homeRAF);
    const loop = (t) => {
      const dt = Math.min(0.05, (t - homeLast) / 1000 || 0.016);
      homeLast = t;
      homeSim.update(dt);
      homeRenderer.draw(homeSim, { dt });
      homeRAF = requestAnimationFrame(loop);
    };
    homeRAF = requestAnimationFrame(loop);
  }
  function stopHome() { cancelAnimationFrame(homeRAF); }

  function bind() {
    document.body.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]');
      if (go) show(go.dataset.go);
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('确定要清空所有分数、星级和解锁记录吗？')) {
        Store.reset();
        location.reload();
      }
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    bind();
    show('home');
  });

  return { show };
})();
