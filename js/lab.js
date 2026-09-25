/* ============ 自由实验室 ============ */
const Lab = (() => {
  let sim, renderer, raf = 0, lastT = 0, started = false;

  const el = id => document.getElementById(id);

  function enter() {
    if (!started) {
      started = true;
      sim = new EngineSim();
      sim.rpm = 150;
      renderer = new EngineRenderer(el('lab-canvas'));
      bind();
    }
    cancelAnimationFrame(raf);
    lastT = 0;
    const loop = (t) => {
      const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
      lastT = t;
      sim.update(dt);
      renderer.draw(sim, { dt, hitRegions: true });
      syncPanel();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function syncPanel() {
    const i = sim.stroke, s = STROKES[i];
    const float = el('lab-stroke-float');
    float.textContent = s.name;
    float.style.color = s.color;
    float.style.borderColor = s.color + '88';
    float.style.textShadow = `0 0 14px ${s.color}`;

    document.querySelectorAll('#lab-dots span').forEach((d, k) => d.classList.toggle('on', k === i));
    el('lab-intake').textContent = s.intake;
    el('lab-exhaust').textContent = s.exhaust;
    el('lab-piston').textContent = s.piston;
    el('lab-energy').textContent = s.energy;
    el('lab-cycles').textContent = sim.cycles;
    el('lab-angle').textContent = Math.round(sim.angle) + '°';
    el('lab-tip').textContent = s.tip;
  }

  function showPart(id) {
    const p = PARTS.find(x => x.id === id);
    if (!p) return;
    el('part-emoji').textContent = p.emoji;
    el('part-name').textContent = p.name;
    el('part-desc').textContent = p.desc;
    const isNew = Store.unlockPart(id);
    el('part-unlock').textContent = isNew ? '🔓 已收入图鉴！' : '✅ 图鉴中已收录';
    el('part-unlock').style.display = '';
    Achievements.checkParts();
    el('part-modal').classList.remove('hidden');
  }

  function bind() {
    el('part-close').addEventListener('click', () => el('part-modal').classList.add('hidden'));
    el('part-modal').addEventListener('click', e => {
      if (e.target.id === 'part-modal') el('part-modal').classList.add('hidden');
    });

    const pickHandler = (cx, cy) => {
      const { x, y } = renderer.worldFromClient(cx, cy);
      const id = renderer.pick(x, y);
      if (id) showPart(id);
    };
    el('lab-canvas').addEventListener('click', (e) => pickHandler(e.clientX, e.clientY));
    // 手机触摸点选零件
    el('lab-canvas').addEventListener('touchend', (e) => {
      if (e.changedTouches.length) {
        const t = e.changedTouches[0];
        pickHandler(t.clientX, t.clientY);
      }
    });

    el('lab-play').addEventListener('click', () => {
      sim.playing = !sim.playing;
      el('lab-play').textContent = sim.playing ? '⏸ 暂停' : '▶ 播放';
      el('lab-play').classList.toggle('primary', sim.playing);
    });

    el('lab-step').addEventListener('click', () => {
      sim.playing = false;
      el('lab-play').textContent = '▶ 播放';
      el('lab-play').classList.remove('primary');
      // 前进 8°（照常触发点火/循环事件）
      sim.playing = true;
      sim.update(8 / (sim.rpm * 6));
      sim.playing = false;
    });

    document.querySelectorAll('.jump-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = +btn.dataset.stroke;
        // 从冲程起点快速"预热"到中段，让粒子（混合气/火焰/废气）自然成形
        const wasPlaying = sim.playing;
        sim.playing = true;
        sim.angle = k * 180;
        sim.primed = false;
        renderer.resetParticles();
        const dt = 1 / 120;
        let guard = 0;
        while (sim.angle < k * 180 + 32 && guard++ < 200) {
          sim.update(dt);
          renderer.draw(sim, { dt, hitRegions: true });
        }
        sim.playing = wasPlaying;
      });
    });

    el('lab-speed').addEventListener('input', (e) => {
      const m = +e.target.value;
      sim.rpm = 250 * m;
      el('lab-speed-val').textContent = m.toFixed(2) + '×';
    });
  }

  return { enter, showPart };
})();
