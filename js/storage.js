/* ============ 本地存档 ============ */
const Store = (() => {
  const KEY = 'engine-academy-save-v1';
  const defaults = {
    labClicks: {},          // 已查看零件
    quizStars: {},          // 各关卡最佳星级
    quizCleared: {},        // 关卡是否通过
    driveBest: 0,           // 最远距离
    drivePerfects: 0,       // 累计完美点火
    drivePlayed: false,
    achievements: {},       // 成就解锁记录
    maxCombo: 0
  };
  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? Object.assign({}, defaults, JSON.parse(raw)) : { ...defaults };
    } catch (e) { return { ...defaults }; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  return {
    get data() { return data; },
    save,
    set(k, v) { data[k] = v; save(); },
    patch(obj) { Object.assign(data, obj); save(); },
    unlockPart(id) {
      if (!data.labClicks[id]) { data.labClicks[id] = true; save(); return true; }
      return false;
    },
    reset() { data = JSON.parse(JSON.stringify(defaults)); save(); }
  };
})();
