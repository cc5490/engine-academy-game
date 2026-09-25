/* ============ 驾驶挑战 ============ */
const Drive = (() => {
  let sim, renderer, raf = 0, lastT = 0, started = false, bound = false;
  let roadCtx, roadW = 0, roadH = 0;
  const state = {};

  const el = id => document.getElementById(id);
  const cv = () => document.getElementById('drive-canvas');

  function resetState() {
    Object.assign(state, {
      running: false, time: 60, score: 0, distance: 0,
      rpm: 1400, heat: 12, combo: 0, maxCombo: 0,
      wheelSpin: 0, scroll: 0, scrollFar: 0, scrollMid: 0,
      fireLock: false, overheatT: 0, nitro: 0, shake: 0,
      perfects: 0, redlineHit: false, overheatHit: false
    });
  }

  function enter() {
    if (!started) {
      started = true;
      sim = new EngineSim();
      sim.autoSpark = false;
      sim.rpm = 120;
      renderer = new EngineRenderer(el('drive-engine'));
      const c = cv();
      roadCtx = c.getContext('2d');
      resizeRoad();
      window.addEventListener('resize', resizeRoad);
      bind();
    }
    resetState();
    sim.angle = 180;
    sim.playing = true;
    sim.primed = false;
    renderer.resetParticles();
    el('dr-overlay').classList.remove('hidden');
    el('dr-over-title').textContent = '🔥 点火节奏挑战';
    el('dr-over-text').innerHTML = '每个循环活塞快到<b style="color:#ffb340">压缩上止点</b>时是最佳点火时机。<br>等<b style="color:#fff">白色滑块</b>进入<b style="color:#7CFF6B">绿色区域</b>时，立刻按 <kbd>空格</kbd> 或点「点火」！<br>按早按晚也有动力只是分数低，整个循环内按都有效——放心按、多练习！';
    el('dr-over-stat').innerHTML = Store.data.driveBest > 0
      ? `历史最远距离：<b>${Store.data.driveBest} m</b>` : '';
    el('dr-start').textContent = '开始挑战';
    cancelAnimationFrame(raf);
    lastT = 0;
    raf = requestAnimationFrame(loop);
  }

  function resizeRoad() {
    const c = cv(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    roadW = c.clientWidth || 800; roadH = c.clientHeight || 440;
    c.width = Math.round(roadW * dpr);
    c.height = Math.round(roadH * dpr);
    roadCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function startGame() {
    resetState();
    state.running = true;
    sim.angle = 180;
    sim.primed = false;
    el('dr-overlay').classList.add('hidden');
  }

  /* ---------- 点火判定（全循环有效，越晚越靠近 Perfect）---------- */
  function ignite() {
    if (!state.running) return;
    if (state.fireLock) return;
    const a = sim.angle % 720;
    let quality = null, label = '', desc = '';
    // Perfect 窗口：384~420°（压缩上止点附近，与绿色判定区严格对齐）
    if (a < 180)      { quality = 'early';   label = '太早了！'; desc = '活塞还在吸气冲程，混合气还没进来呢'; }
    else if (a < 240) { quality = 'early';   label = '太早了！'; desc = '压缩冲程刚开始，再等活塞往上压一压'; }
    else if (a < 300) { quality = 'premature'; label = '偏早';   desc = '压缩中后段，点火有动力但不是最佳时机'; }
    else if (a < 340) { quality = 'good';    label = 'GOOD 偏早'; desc = '接近最佳点火角！下次再稍等一瞬'; }
    else if (a < 384) { quality = 'good';    label = 'GOOD 偏早'; desc = '马上就 Perfect 了，再压一点点'; }
    else if (a <= 420){ quality = 'perfect'; label = 'PERFECT!'; desc = '完美点火！活塞将到上止点，动力拉满'; }
    else if (a <= 460){ quality = 'good';    label = 'GOOD 偏晚'; desc = '刚过最佳角，燃气推动还是有效的'; }
    else if (a <= 500){ quality = 'premature'; label = '偏晚';   desc = '活塞已开始做功下行，有点浪费了'; }
    else if (a <= 580){ quality = 'late';    label = '太晚了！'; desc = '做功冲程都过半了，点火基本没动力'; }
    else              { quality = 'late';    label = '太晚了！'; desc = '已进入排气冲程，下个循环再来！'; }

    state.fireLock = true;

    if (quality === 'perfect') {
      state.perfects++; state.combo++;
      state.score += 120 + Math.min(state.combo, 20) * 10;
      state.rpm = Math.min(2400, state.rpm + 300);
      state.heat = Math.max(0, state.heat - 5);
      state.nitro = 0.5; state.shake = 0.25;
      sim.primeSpark('perfect');
      Store.patch({ drivePerfects: Store.data.drivePerfects + 1 });
      Achievements.unlock('spark1');
      if (Store.data.drivePerfects + 1 >= 10) Achievements.unlock('perfect10');
    } else if (quality === 'good') {
      state.combo++;
      state.score += 60;
      state.rpm = Math.min(2400, state.rpm + 90);
      state.heat = Math.max(0, state.heat - 1);
      state.nitro = 0.25;
      sim.primeSpark('good');
      Achievements.unlock('spark1');
    } else if (quality === 'premature') {
      state.combo++;
      state.score += 25;
      state.rpm = Math.min(2400, state.rpm + 70);
      state.nitro = 0.12;
      sim.primeSpark('weak');
      Achievements.unlock('spark1');
    } else {
      // early / late：不给动力，但惩罚很轻
      state.combo = 0;
      state.heat = Math.min(100, state.heat + 5);
      state.shake = 0.18;
    }
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    if (state.combo >= 10) Achievements.unlock('combo10');
    const cls = quality === 'perfect' ? 'perfect' : (quality === 'good' ? 'good' : (quality === 'premature' ? 'good' : 'miss'));
    popJudge(label, cls);
    showFireHint(label, desc, cls);
    flashFireBtn();
  }

  function missCycle(reason) {
    state.combo = 0;
    state.rpm = Math.max(800, state.rpm * 0.88); // 惩罚减轻：88% 而不是 80%
    state.heat = Math.min(100, state.heat + 6);
    state.shake = 0.15;
    popJudge(reason, 'miss');
    showFireHint('Miss 错过点火', '没有在压缩上止点附近点火，这圈燃气没燃烧，损失一圈动力', 'miss');
  }

  function popJudge(text, cls) {
    const j = el('dr-judge');
    j.textContent = text;
    j.className = 'judge-pop show ' + cls;
    clearTimeout(j._t);
    j._t = setTimeout(() => j.className = 'judge-pop ' + cls, 700);
  }
  function flashFireBtn() {
    const b = el('dr-fire');
    b.classList.add('firing');
    setTimeout(() => b.classList.remove('firing'), 130);
  }

  /* 点火结果反馈板（常驻大字+原因说明，而不是一闪而过的提示） */
  function showFireHint(label, desc, cls) {
    let h = el('dr-hint');
    if (!h) {
      h = document.createElement('div');
      h.id = 'dr-hint';
      h.innerHTML = '<b></b><p></p>';
      el('dr-overlay').parentElement.appendChild(h);
    }
    h.querySelector('b').textContent = label;
    h.querySelector('p').textContent = desc;
    h.className = 'fire-hint show ' + cls;
    clearTimeout(h._t);
    h._t = setTimeout(() => h.classList.remove('show'), 2800);
  }

  /* ---------- 主循环 ---------- */
  function loop(t) {
    const dt = Math.min(0.045, (t - lastT) / 1000 || 0.016);
    lastT = t;

    if (state.running) {
      state.time -= dt;
      // 转速物理
      let target = 1500;
      if (state.overheatT > 0) { state.overheatT -= dt; target = 1100; }
      state.rpm += (target - state.rpm) * 0.25 * dt;
      state.rpm -= 70 * dt; // 风阻
      state.rpm = Math.max(650, state.rpm);
      if (state.rpm >= 2200 && !state.redlineHit) {
        state.redlineHit = true; Achievements.unlock('redline');
      }
      // 温度：恢复正常更快，不容易憋到过热线
      state.heat = Math.max(8, state.heat - 3.6 * dt);
      if (state.heat >= 100 && state.overheatT <= 0) {
        state.overheatT = 3;
        if (!state.overheatHit) { state.overheatHit = true; Achievements.unlock('overheat'); }
        popJudge('发动机过热！', 'miss');
      }
      // 速度与距离（转速上限压到2400便于瞄准，车速由挡位补偿不影响速度感）
      const gear = state.rpm < 1100 ? 1 : state.rpm < 1400 ? 2 :
                   state.rpm < 1700 ? 3 : state.rpm < 2000 ? 4 : 5;
      const overheatMul = state.overheatT > 0 ? 0.45 : 1;
      const speed = Math.min(280, state.rpm / 12 + (gear - 1) * 42) * overheatMul;
      state.distance += speed / 3.6 * dt;
      state.score += dt * 8 * overheatMul;
      state.scroll += speed * dt * 0.55;
      state.scrollFar += speed * dt * 0.12;
      state.scrollMid += speed * dt * 0.3;
      state.wheelSpin += speed * dt * 0.02;
      state.nitro = Math.max(0, state.nitro - dt);
      state.shake = Math.max(0, state.shake - dt);
      state._gear = gear; state._speed = speed;

      // 错过点火检测：越过 425°（Perfect窗口刚过）且未 prime
      const a = sim.angle % 720;
      if (a > 425 && a < 540 && !sim.primed && !state.fireLock) {
        state.fireLock = true;
        missCycle('Miss 错过点火');
      }
      // 循环结束解锁
      if (a < 40) state.fireLock = false;

      if (state.time <= 0) endGame();
    }

    // 仿真转速跟随游戏转速
    // 判定节奏独立于仪表盘转速：曲轴仿真固定 150 RPM（一个循环约4.8秒），
    // 绿色 Perfect 区（14°）停留约 0.16 秒，整条压缩末段（120°）扫过约 1.3 秒，容易瞄准
    sim.rpm = 150;
    sim.update(dt);
    renderer.draw(sim, {
      dt,
      crop: { x: 84, y: 8, w: 272, h: 452 }
    });
    updateMarker();
    drawRoad(dt);
    syncHUD();
    raf = requestAnimationFrame(loop);
  }

  function updateMarker() {
    const m = el('dr-marker');
    const a = sim.angle % 720;
    // 滑块映射 300°~420°（压缩末段），绿色 Perfect 区 70%~100% → 384°~420°
    if (a >= 300 && a <= 420) {
      m.style.opacity = '1';
      m.style.left = ((a - 300) / 120 * 100) + '%';
    } else {
      m.style.opacity = '0.18';
      m.style.left = a < 300 ? '0%' : '100%';
    }
  }

  function syncHUD() {
    el('dr-score').textContent = Math.round(state.score);
    el('dr-dist').textContent = Math.round(state.distance) + ' m';
    el('dr-time').textContent = Math.max(0, Math.ceil(state.time));
    el('dr-gear').textContent = state.running ? 'D' + (state._gear || 1) : '--';
    el('g-rpm').style.width = Math.min(100, state.rpm / 24) + '%';
    el('g-rpm-val').textContent = Math.round(state.rpm);
    el('g-heat').style.width = state.heat + '%';
    el('g-heat-val').textContent = state.heat > 80 ? '过热！' : state.heat > 45 ? '高温' : '正常';
    document.querySelector('.gauge.heat').classList.toggle('hot', state.heat > 70);
    document.querySelector('#dr-combo b').textContent = '×' + state.combo;
  }

  function endGame() {
    state.running = false;
    const d = Math.round(state.distance);
    const best = Math.max(Store.data.driveBest, d);
    Store.patch({ driveBest: best, drivePlayed: true, maxCombo: Math.max(Store.data.maxCombo, state.maxCombo) });
    if (d >= 3000) Achievements.unlock('distance');
    el('dr-over-title').textContent = '🏁 挑战结束';
    el('dr-over-text').innerHTML = '休息一下，看看你的战绩：';
    el('dr-over-stat').innerHTML =
      `行驶距离：<b>${d} m</b>　历史最佳：<b>${best} m</b><br>` +
      `得分：<b>${Math.round(state.score)}</b>　Perfect：<b>${state.perfects}</b> 次　最高连击：<b>${state.maxCombo}</b>`;
    el('dr-start').textContent = '再来一局';
    el('dr-overlay').classList.remove('hidden');
  }

  /* ---------- 公路与跑车绘制 ---------- */
  function drawRoad(dt) {
    const ctx = roadCtx, W = roadW, H = roadH;
    const speed = state._speed || 0;
    const horizon = H * 0.52, roadY = H * 0.72;

    // 抖动
    if (state.shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - .5) * 6 * state.shake * 4,
                   (Math.random() - .5) * 4 * state.shake * 4);
    }

    // 天空
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#0d1830'); sky.addColorStop(.7, '#243b63'); sky.addColorStop(1, '#3d5a86');
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, W + 40, horizon + 40);
    // 太阳
    ctx.fillStyle = 'rgba(255,210,140,.85)';
    ctx.beginPath(); ctx.arc(W * 0.72, horizon * 0.5, 34, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,210,140,.12)';
    ctx.beginPath(); ctx.arc(W * 0.72, horizon * 0.5, 60, 0, 7); ctx.fill();

    // 远山（慢层）
    drawHills(ctx, W, horizon, state.scrollFar * 0.4, '#20304f', 90, 1.2);
    drawHills(ctx, W, horizon, state.scrollMid * 0.7, '#2c4066', 60, 0.7);

    // 地面
    const gr = ctx.createLinearGradient(0, horizon, 0, H);
    gr.addColorStop(0, '#1c2b22'); gr.addColorStop(1, '#101a16');
    ctx.fillStyle = gr;
    ctx.fillRect(-20, horizon, W + 40, H - horizon + 20);

    // 路边灯柱（中层）
    const lampGap = 220;
    const off = state.scrollMid % lampGap;
    for (let x = -off; x < W + lampGap; x += lampGap) {
      ctx.strokeStyle = '#3a4a66'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x, horizon + 6); ctx.lineTo(x, roadY - 30);
      ctx.lineTo(x + 26, roadY - 40); ctx.stroke();
      ctx.fillStyle = 'rgba(255,230,150,.8)';
      ctx.beginPath(); ctx.arc(x + 28, roadY - 40, 4, 0, 7); ctx.fill();
    }

    // 公路
    ctx.fillStyle = '#232a35';
    ctx.fillRect(-20, roadY - 8, W + 40, H - roadY + 40);
    ctx.fillStyle = '#11161e';
    ctx.fillRect(-20, roadY - 8, W + 40, 6);
    // 车道虚线
    const dashGap = 90, dashW = 46;
    const doff = state.scroll % dashGap;
    ctx.fillStyle = '#ffd75e';
    for (let x = -doff; x < W + dashGap; x += dashGap) {
      ctx.fillRect(x, roadY + 14, dashW, 6);
    }

    // 高速线
    if (speed > 120) {
      ctx.strokeStyle = `rgba(255,255,255,${Math.min(.35, (speed - 120) / 400)})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const y = roadY + 30 + i * 22;
        const xx = (W * 0.9 - state.scroll * (2 + i * .3)) % (W + 200);
        ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx - 70, y); ctx.stroke();
      }
    }

    drawCar(ctx, W, roadY, speed);

    // 过热红屏
    if (state.overheatT > 0) {
      const a = 0.18 + Math.sin(performance.now() / 90) * 0.06;
      ctx.fillStyle = `rgba(255,60,40,${a})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (state.shake > 0) ctx.restore();
  }

  function drawHills(ctx, W, horizon, off, color, h, periodMul) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    const step = 60;
    for (let x = 0; x <= W + step; x += step) {
      const y = horizon - h * (0.5 + 0.5 * Math.sin((x + off) * 0.004 * periodMul))
                     - 20 * Math.sin((x + off) * 0.013 * periodMul + 2);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();
  }

  function drawCar(ctx, W, roadY, speed) {
    const cx = W * 0.24;
    const bob = Math.sin(performance.now() / 80) * (speed > 50 ? 1.2 : 0);
    const cy = roadY + bob;

    // 尾气/氮气
    if (state.nitro > 0) {
      for (let i = 0; i < 4; i++) {
        const fx = cx - 92 + (Math.random() - .5) * 6;
        const fy = cy - 8 + (Math.random() - .5) * 8;
        const r = 8 + Math.random() * 12;
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
        g.addColorStop(0, 'rgba(120,220,255,.8)');
        g.addColorStop(.5, 'rgba(80,140,255,.4)');
        g.addColorStop(1, 'rgba(80,140,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(fx, fy, r, 0, 7); ctx.fill();
      }
    }
    // 过热黑烟
    if (state.overheatT > 0) {
      for (let i = 0; i < 2; i++) {
        const fx = cx - 88, fy = cy - 14;
        const g = ctx.createRadialGradient(fx, fy - 10, 2, fx, fy - 24, 14);
        g.addColorStop(0, 'rgba(60,60,60,.7)'); g.addColorStop(1, 'rgba(40,40,40,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(fx, fy - 18, 13, 0, 7); ctx.fill();
      }
    }

    // 车身阴影
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 22, 105, 8, 0, 0, 7); ctx.fill();

    // 车轮
    drawWheel(ctx, cx - 58, cy + 14, 18);
    drawWheel(ctx, cx + 58, cy + 14, 18);

    // 车身
    const body = ctx.createLinearGradient(0, cy - 34, 0, cy + 14);
    body.addColorStop(0, '#ff8a3d'); body.addColorStop(.5, '#e8472a'); body.addColorStop(1, '#a3221a');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(cx - 96, cy - 6);
    ctx.quadraticCurveTo(cx - 94, cy - 18, cx - 70, cy - 20);
    ctx.lineTo(cx - 42, cy - 32);
    ctx.quadraticCurveTo(cx - 10, cy - 38, cx + 24, cy - 32);
    ctx.lineTo(cx + 56, cy - 20);
    ctx.quadraticCurveTo(cx + 88, cy - 18, cx + 96, cy - 6);
    ctx.lineTo(cx + 94, cy + 6);
    ctx.lineTo(cx - 94, cy + 6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5; ctx.stroke();

    // 车窗
    ctx.fillStyle = '#bfe6ff';
    ctx.beginPath();
    ctx.moveTo(cx - 38, cy - 30);
    ctx.quadraticCurveTo(cx - 8, cy - 35, cx + 22, cy - 30);
    ctx.lineTo(cx + 30, cy - 20); ctx.lineTo(cx - 46, cy - 20);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(30,50,80,.55)';
    ctx.fillRect(cx - 6, cy - 33, 3, 14);

    // 车灯
    ctx.fillStyle = 'rgba(255,245,200,.95)';
    ctx.beginPath(); ctx.ellipse(cx + 90, cy - 8, 6, 4, 0, 0, 7); ctx.fill();
    // 尾灯
    ctx.fillStyle = '#ff3b3b';
    ctx.fillRect(cx - 95, cy - 12, 5, 7);
    // 火焰贴花
    ctx.font = '20px sans-serif';
    ctx.fillText('🔥', cx - 14, cy - 6);
  }

  function drawWheel(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#0c0f14';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.rotate(state.wheelSpin);
    ctx.fillStyle = '#9aa7c2';
    for (let i = 0; i < 5; i++) {
      ctx.rotate(Math.PI * 2 / 5);
      ctx.fillRect(-2, -r * .7, 4, r * 1.4);
    }
    ctx.fillStyle = '#d8e2f5';
    ctx.beginPath(); ctx.arc(0, 0, r * .32, 0, 7); ctx.fill();
    ctx.restore();
  }

  function bind() {
    if (bound) return; bound = true;
    el('dr-start').addEventListener('click', startGame);
    let touchFireAt = 0;
    el('dr-fire').addEventListener('click', () => {
      if (Date.now() - touchFireAt < 600) return; // 忽略触摸后合成的 click
      ignite();
    });
    // 手机触摸：touchstart 立即点火（比 click 快约300ms，节奏游戏关键）
    el('dr-fire').addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchFireAt = Date.now();
      if (!state.running && !el('dr-overlay').classList.contains('hidden')) startGame();
      else ignite();
    }, { passive: false });
    // 公路画布上也可触摸点火（手机上更好按）
    cv().addEventListener('touchstart', (e) => {
      if (el('dr-overlay').classList.contains('hidden')) { e.preventDefault(); ignite(); }
    }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && document.getElementById('screen-drive').classList.contains('active')) {
        e.preventDefault();
        if (!state.running && !el('dr-overlay').classList.contains('hidden')) startGame();
        else ignite();
      }
    });
  }

  return { enter };
})();
