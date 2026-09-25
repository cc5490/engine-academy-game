/* ============ 知识闯关 ============ */
const QuizLevelData = [
  {
    name: '第一关 · 火眼金睛',
    desc: '观察发动机动画，判断当前是哪个冲程',
    questions: [
      { type: 'stroke', angle: 95, answer: 0,
        prompt: '下图中活塞向下、进气门打开，这是哪个冲程？',
        explain: '进气门打开、活塞向下运动，气缸吸入汽油和空气的混合物——这是<b>吸气冲程</b>。' },
      { type: 'stroke', angle: 270, answer: 1,
        prompt: '两个气门都关闭、活塞向上运动，这是哪个冲程？',
        explain: '两气门关闭、活塞向上压缩混合物——这是<b>压缩冲程</b>，此过程中<b>机械能转化为内能</b>。' },
      { type: 'stroke', angle: 455, answer: 2,
        prompt: '火花塞刚点火、燃气推动活塞向下，这是哪个冲程？',
        explain: '火花塞点燃混合物，高温高压燃气推动活塞向下——这是<b>做功冲程</b>，<b>内能转化为机械能</b>，是唯一对外做功的冲程。' },
      { type: 'stroke', angle: 635, answer: 3,
        prompt: '排气门打开、活塞向上运动，这是哪个冲程？',
        explain: '排气门打开、活塞向上把废气排出——这是<b>排气冲程</b>。' }
    ]
  },
  {
    name: '第二关 · 冲程排序',
    desc: '把四个冲程按工作循环的先后顺序排好',
    questions: [
      {
        type: 'order',
        prompt: '请按先后顺序排列汽油机一个工作循环的四个冲程：',
        tiles: ['做功冲程', '排气冲程', '吸气冲程', '压缩冲程'],
        answer: ['吸气冲程', '压缩冲程', '做功冲程', '排气冲程'],
        explain: '口诀：<b>吸—压—做—排</b>！吸气、压缩靠飞轮惯性开始，做功冲程提供动力，最后排气。'
      },
      {
        type: 'single',
        prompt: '火花塞点火发生在哪个冲程的末尾？',
        options: ['吸气冲程', '压缩冲程', '做功冲程', '排气冲程'],
        answer: 1,
        explain: '<b>压缩冲程末</b>，火花塞产生电火花点燃混合物，随后才进入做功冲程。'
      },
      {
        type: 'single',
        prompt: '四个冲程中，唯一对外输出动力（做功）的是？',
        options: ['吸气冲程', '压缩冲程', '做功冲程', '排气冲程'],
        answer: 2,
        explain: '只有<b>做功冲程</b>是燃气推动活塞对外做功；其余三个冲程靠飞轮的惯性完成。'
      }
    ]
  },
  {
    name: '第三关 · 气门机关',
    desc: '搞清楚每个冲程进气门、排气门的开闭',
    questions: [
      {
        type: 'single',
        prompt: '吸气冲程中，两个气门的状态是？',
        options: ['进气门开，排气门关', '两个气门都开', '两个气门都关', '进气门关，排气门开'],
        answer: 0,
        explain: '吸气时<b>进气门打开</b>吸入混合物，<b>排气门关闭</b>。'
      },
      {
        type: 'single',
        prompt: '排气冲程中，两个气门的状态是？',
        options: ['进气门开，排气门关', '两个气门都开', '两个气门都关', '进气门关，排气门开'],
        answer: 3,
        explain: '排气时<b>排气门打开</b>排出废气，<b>进气门关闭</b>。'
      },
      {
        type: 'single',
        prompt: '压缩冲程和做功冲程中，两个气门的状态是？',
        options: ['进气门开，排气门关', '两个气门都关闭', '两个气门都打开', '进气门关，排气门开'],
        answer: 1,
        explain: '压缩和做功时需要密封气缸形成高压，所以<b>两个气门都关闭</b>。'
      }
    ]
  },
  {
    name: '第四关 · 能量转化',
    desc: '压缩与做功冲程中能量是怎样转化的？',
    questions: [
      {
        type: 'single',
        prompt: '压缩冲程中，能量是怎样转化的？',
        options: ['内能 → 机械能', '机械能 → 内能', '化学能 → 光能', '内能 → 化学能'],
        answer: 1,
        explain: '活塞压缩混合物做功，混合物温度升高、内能增大：<b>机械能 → 内能</b>。'
      },
      {
        type: 'single',
        prompt: '做功冲程中，能量是怎样转化的？',
        options: ['机械能 → 内能', '内能 → 机械能', '光能 → 化学能', '机械能 → 电能'],
        answer: 1,
        explain: '燃气燃烧膨胀推动活塞做功：<b>内能 → 机械能</b>。'
      },
      {
        type: 'single',
        prompt: '关于做功冲程，下列说法正确的是？',
        options: [
          '靠飞轮惯性完成，不对外做功',
          '燃气推动活塞向下，把内能转化为机械能',
          '活塞向上运动，排出废气',
          '进气门和排气门都打开'
        ],
        answer: 1,
        explain: '做功冲程中燃气推动活塞向下，通过连杆带动曲轴，<b>内能转化为机械能</b>，两气门均关闭。'
      }
    ]
  },
  {
    name: '第五关 · 循环密码',
    desc: '一个工作循环里的冲程数、往复次数、转数',
    questions: [
      {
        type: 'single',
        prompt: '汽油机一个工作循环包含几个冲程？',
        options: ['2 个', '3 个', '4 个', '6 个'],
        answer: 2,
        explain: '一个工作循环 = <b>4 个冲程</b>：吸气、压缩、做功、排气。'
      },
      {
        type: 'single',
        prompt: '一个工作循环中，活塞往复运动几次？曲轴转动几周？',
        options: ['往复 1 次，曲轴 1 周', '往复 2 次，曲轴 2 周', '往复 2 次，曲轴 1 周', '往复 4 次，曲轴 2 周'],
        answer: 1,
        explain: '一个冲程活塞走“半程”，4 个冲程活塞<b>往复 2 次</b>；曲轴每往复一次转一周，共<b>转 2 周</b>。'
      },
      {
        type: 'single',
        prompt: '一个工作循环中，汽油机对外做功几次？',
        options: ['1 次', '2 次', '3 次', '4 次'],
        answer: 0,
        explain: '只有做功冲程对外做功，所以一个循环<b>对外做功 1 次</b>。记忆口诀：<b>4-2-2-1</b>。'
      }
    ]
  },
  {
    name: '第六关 · 汽油 VS 柴油',
    desc: '两种内燃机的结构与点火方式大比拼',
    questions: [
      {
        type: 'single',
        prompt: '汽油机气缸顶部安装的是？',
        options: ['喷油嘴', '火花塞', '气门芯', '活塞环'],
        answer: 1,
        explain: '汽油机顶部有<b>火花塞</b>，靠电火花<b>点燃</b>混合气；柴油机顶部是喷油嘴。'
      },
      {
        type: 'single',
        prompt: '柴油机的点火方式是？',
        options: ['火花塞点燃', '压燃式（压缩空气使柴油自燃）', '靠摩擦生热点燃', '人工点火'],
        answer: 1,
        explain: '柴油机压缩的是空气，压缩程度更大、温度更高，喷入的柴油遇高温空气<b>自行燃烧（压燃式）</b>。'
      },
      {
        type: 'single',
        prompt: '与汽油机相比，柴油机的特点是？',
        options: [
          '效率更低、更轻便',
          '压缩程度更大、效率较高，但较笨重',
          '吸入汽油和空气的混合物',
          '也需要火花塞点火'
        ],
        answer: 1,
        explain: '柴油机<b>压缩程度更大、效率较高</b>，但笨重、震动大，常用于卡车、轮船等大型机械。'
      }
    ]
  }
];

const Quiz = (() => {
  const el = id => document.getElementById(id);
  let level = 0, qi = 0, correct = 0, combo = 0, orderSel = [], qSim = null, qRen = null, locked = false;

  function enterMap() {
    el('quiz-play').classList.add('hidden');
    el('quiz-result').classList.add('hidden');
    el('quiz-map').classList.remove('hidden');
    renderMap();
  }

  function renderMap() {
    const map = el('quiz-map');
    map.innerHTML = '';
    QuizLevelData.forEach((lv, i) => {
      const stars = Store.data.quizStars[i] || 0;
      const unlocked = i === 0 || Store.data.quizCleared[i - 1];
      const card = document.createElement('div');
      card.className = 'level-card';
      card.innerHTML = `
        <div class="level-num">LEVEL ${i + 1}</div>
        <h3>${lv.name.replace(/^第.关 · /, '')}</h3>
        <p>${lv.desc}</p>
        <div class="level-stars">
          ${[1,2,3].map(n => `<span class="${n <= stars ? '' : 'off'}">⭐</span>`).join('')}
        </div>
        <button class="level-go">${stars ? '再次挑战' : '开始挑战'}</button>
        ${unlocked ? '' : '<div class="level-lock">🔒<span>通过上一关解锁</span></div>'}
      `;
      card.querySelector('.level-go').addEventListener('click', () => { if (unlocked) startLevel(i); });
      map.appendChild(card);
    });
  }

  function startLevel(i) {
    level = i; qi = 0; correct = 0; combo = 0;
    el('quiz-map').classList.add('hidden');
    el('quiz-result').classList.add('hidden');
    el('quiz-play').classList.remove('hidden');
    renderQuestion();
  }

  function renderQuestion() {
    locked = false;
    const q = QuizLevelData[level].questions[qi];
    const total = QuizLevelData[level].questions.length;
    el('q-progress').style.width = (qi / total * 100) + '%';
    el('q-combo').textContent = combo;
    el('q-prompt').textContent = (qi + 1) + '. ' + q.prompt;
    el('q-explain').classList.add('hidden');
    el('q-next').classList.add('hidden');

    const opts = el('q-options');
    opts.className = 'q-options';
    opts.innerHTML = '';

    if (q.type === 'stroke') {
      el('q-engine').classList.remove('hidden');
      showEngineAt(q.angle);
    } else {
      el('q-engine').classList.add('hidden');
    }

    if (q.type === 'single' || q.type === 'stroke') {
      if (q.type === 'single') opts.classList.add('single');
      const names = ['吸气冲程', '压缩冲程', '做功冲程', '排气冲程'];
      const options = q.options || names;
      options.forEach((text, k) => {
        const b = document.createElement('button');
        b.className = 'opt';
        b.textContent = String.fromCharCode(65 + k) + '. ' + text;
        b.addEventListener('click', () => answerSingle(k, b));
        opts.appendChild(b);
      });
    } else if (q.type === 'order') {
      orderSel = [];
      renderOrder(q);
    }
  }

  function renderOrder(q) {
    const opts = el('q-options');
    opts.innerHTML = `
      <div class="order-slots" style="grid-column:1/-1">
        ${[0,1,2,3].map(i => `<div class="slot" data-i="${i}"><span class="ord-no">第 ${i+1} 步</span></div>`).join('')}
      </div>
      <div class="order-tiles" style="grid-column:1/-1"></div>
      <div class="order-actions" style="grid-column:1/-1">
        <button class="ctl-btn" id="q-undo">↩ 撤销</button>
        <button class="big-btn" id="q-confirm" style="margin:0">确认顺序</button>
      </div>`;
    const tiles = opts.querySelector('.order-tiles');
    const shuffled = [...q.tiles].sort(() => Math.random() - 0.5);
    shuffled.forEach(name => {
      const t = document.createElement('button');
      t.className = 'opt';
      t.textContent = name;
      t.dataset.name = name;
      t.addEventListener('click', () => {
        if (locked || t.classList.contains('used') || orderSel.length >= 4) return;
        orderSel.push(name);
        t.classList.add('used');
        paintSlots();
      });
      tiles.appendChild(t);
    });
    const paintSlots = () => {
      opts.querySelectorAll('.slot').forEach((s, i) => {
        if (orderSel[i]) { s.classList.add('filled'); s.innerHTML = `<span class="ord-no">第 ${i+1} 步</span>${orderSel[i]}`; }
        else { s.classList.remove('filled'); s.innerHTML = `<span class="ord-no">第 ${i+1} 步</span>`; }
      });
    };
    paintSlots();
    opts.querySelector('#q-undo').addEventListener('click', () => {
      if (locked) return;
      const name = orderSel.pop();
      if (name) [...tiles.children].find(t => t.dataset.name === name && t.classList.contains('used'))
        ?.classList.remove('used');
      paintSlots();
    });
    opts.querySelector('#q-confirm').addEventListener('click', () => {
      if (orderSel.length < 4) { opts.querySelector('#q-confirm').textContent = '还没排完！';
        setTimeout(() => opts.querySelector('#q-confirm').textContent = '确认顺序', 900); return; }
      const ok = orderSel.every((n, i) => n === q.answer[i]);
      finishOrder(ok, q);
    });
  }

  function answerSingle(k, btn) {
    if (locked) return;
    locked = true;
    const q = QuizLevelData[level].questions[qi];
    const btns = [...document.querySelectorAll('#q-options .opt')];
    btns.forEach(b => b.classList.add('disabled'));
    const ok = k === q.answer;
    if (ok) {
      btn.classList.add('correct');
      correct++; combo++;
    } else {
      btn.classList.add('wrong');
      btns[q.answer].classList.add('correct');
      combo = 0;
    }
    el('q-combo').textContent = combo;
    showExplain(q.explain);
  }

  function finishOrder(ok, q) {
    locked = true;
    if (ok) { correct++; combo++; } else { combo = 0; }
    el('q-combo').textContent = combo;
    const slots = document.querySelectorAll('#q-options .slot');
    q.answer.forEach((name, i) => {
      slots[i].style.borderColor = ok ? '#7cff6b' : (orderSel[i] === name ? '#7cff6b' : '#ff5470');
    });
    document.querySelectorAll('#q-options .opt').forEach(b => b.classList.add('disabled'));
    showExplain(q.explain);
  }

  function showExplain(html) {
    const box = el('q-explain');
    box.innerHTML = '💡 <b>解析：</b>' + html;
    box.classList.remove('hidden');
    const btn = el('q-next');
    btn.classList.remove('hidden');
    btn.textContent = qi + 1 >= QuizLevelData[level].questions.length ? '查看结果 🏁' : '继续 →';
  }

  function next() {
    qi++;
    if (qi >= QuizLevelData[level].questions.length) return finishLevel();
    renderQuestion();
  }

  function finishLevel() {
    const total = QuizLevelData[level].questions.length;
    const ratio = correct / total;
    const stars = correct === total ? 3 : ratio >= 0.6 ? 2 : 1;
    const pass = correct >= 1;
    Store.data.quizStars[level] = Math.max(Store.data.quizStars[level] || 0, stars);
    if (pass) Store.data.quizCleared[level] = true;
    Store.save();
    Achievements.checkQuiz();

    el('quiz-play').classList.add('hidden');
    el('quiz-result').classList.remove('hidden');
    el('qr-stars').innerHTML = [1,2,3].map(n =>
      n <= stars ? '⭐' : '<span style="opacity:.2">⭐</span>').join('');
    el('qr-title').textContent = pass ? '关卡完成！' : '再接再厉！';
    el('qr-text').innerHTML = pass
      ? `答对 <b>${correct}</b> / ${total} 题，获得 <b>${stars}</b> 星！${stars === 3 ? '满分通关，太棒了！' : '再试一次冲击满分三星吧～'}`
      : `一题都没答对哦，回到实验室观察一下动画，再来挑战！`;
  }

  /* 用引擎渲染器生成某角度的静态"快照"（先空转至该角度，让粒子/气门状态自然成形） */
  function showEngineAt(angle) {
    requestAnimationFrame(() => {
      const cv = el('q-canvas');
      if (!qRen) { qSim = new EngineSim(); qRen = new EngineRenderer(cv); }
      qSim.playing = true; qSim.rpm = 360; qSim.angle = 0; qSim.cycles = 0;
      qRen.resetParticles();
      let guard = 0;
      const dt = 1 / 120;
      while (qSim.angle < angle && guard++ < 400) {
        qSim.update(dt);
        qRen.draw(qSim, { dt, crop: { x: 92, y: 14, w: 296, h: 440 } });
      }
      qSim.playing = false;
      qRen.draw(qSim, { dt: 0, crop: { x: 92, y: 14, w: 296, h: 440 } });
    });
  }

  function bind() {
    el('q-next').addEventListener('click', next);
    el('q-quit').addEventListener('click', enterMap);
    el('qr-retry').addEventListener('click', () => startLevel(level));
    el('qr-back').addEventListener('click', enterMap);
  }

  window.addEventListener('DOMContentLoaded', bind);

  return { enterMap, startLevel };
})();
