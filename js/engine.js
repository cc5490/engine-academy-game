/* =========================================================
   汽油机核心：物理仿真 EngineSim + 剖面渲染 EngineRenderer
   一个工作循环 = 720°（曲轴转两周）
   0-180 吸气 | 180-360 压缩 | 360-540 做功 | 540-720 排气
   ========================================================= */

const STROKES = [
  {
    name: '吸气冲程', short: '吸气', color: '#4fd6ff',
    tip: '进气门打开，排气门关闭。活塞向下运动，气缸内体积变大、压强变小，汽油和空气的混合物在大气压作用下进入气缸。这个冲程靠飞轮惯性完成。',
    intake: '打开', exhaust: '关闭', piston: '向下 ↓',
    energy: '吸入油气混合物'
  },
  {
    name: '压缩冲程', short: '压缩', color: '#ffb340',
    tip: '两个气门都关闭。活塞向上运动，把混合物压缩，混合物的温度升高、内能增大。能量转化：机械能 → 内能。',
    intake: '关闭', exhaust: '关闭', piston: '向上 ↑',
    energy: '机械能 → 内能'
  },
  {
    name: '做功冲程', short: '做功', color: '#ff6a3d',
    tip: '压缩冲程末，火花塞产生电火花点燃混合物。燃气猛烈燃烧、膨胀，推动活塞向下运动，通过连杆带动曲轴转动对外做功。能量转化：内能 → 机械能。这是唯一对外做功的冲程！',
    intake: '关闭', exhaust: '关闭', piston: '向下 ↓',
    energy: '内能 → 机械能'
  },
  {
    name: '排气冲程', short: '排气', color: '#a78bfa',
    tip: '排气门打开，进气门关闭。活塞向上运动，把燃烧后的废气排出气缸，为下一个循环做准备。这个冲程也靠飞轮惯性完成。',
    intake: '关闭', exhaust: '打开', piston: '向上 ↑',
    energy: '排出废气'
  }
];

const PARTS = [
  { id: 'spark',   emoji: '⚡', name: '火花塞', desc: '装在气缸顶部。压缩冲程末产生电火花，点燃被压缩的汽油和空气混合物。汽油机靠它“点燃”，柴油机没有火花塞，靠的是“压燃”。' },
  { id: 'inport',  emoji: '🌬️', name: '进气道', desc: '汽油和空气的混合物进入气缸的通道，尽头由进气门把守。' },
  { id: 'export',  emoji: '💨', name: '排气道', desc: '燃烧后的废气排出气缸的通道，尽头由排气门把守。' },
  { id: 'invalve', emoji: '🔻', name: '进气门', desc: '吸气冲程时打开，让油气混合物进入气缸；其余冲程关闭，保证气缸密封。' },
  { id: 'exvalve', emoji: '🔺', name: '排气门', desc: '排气冲程时打开，让废气排出；其余冲程关闭。' },
  { id: 'cylinder',emoji: '🛢️', name: '气缸', desc: '圆筒形金属腔体，是混合物燃烧、膨胀的地方。活塞在气缸内做往复运动。' },
  { id: 'piston',  emoji: '🥫', name: '活塞', desc: '在气缸内上下往复运动：承受燃气的压力，再通过连杆推动曲轴转动，把“往复运动”变成“转动”。' },
  { id: 'rod',     emoji: '🔗', name: '连杆', desc: '上端连活塞、下端连曲轴，把活塞受到的力传递给曲轴。' },
  { id: 'crank',   emoji: '⚙️', name: '曲轴', desc: '把活塞的往复运动转变为旋转运动，并通过飞轮向外输出动力（带动车轮、机械等）。' },
  { id: 'flywheel',emoji: '🛞', name: '飞轮', desc: '又重又大的轮子，装在曲轴上。做功冲程时储存能量，再靠惯性带动活塞完成吸气、压缩、排气三个辅助冲程，让发动机平稳转动。' }
];

class EngineSim {
  constructor() {
    this.angle = 0;          // 曲轴转角 0-720
    this.rpm = 240;          // 每分钟转数（曲轴）
    this.playing = true;
    this.autoSpark = true;   // 实验室自动点火
    this.primed = false;     // 驾驶模式：玩家是否在本循环完成点火
    this.cycles = 0;
    this.primeQuality = null;
    // 事件（每帧刷新）
    this.evFire = false;     // 是否发生燃烧
    this.evMisfire = false;  // 该点火却没点
    this.evCycle = false;
    this.firePower = 0;      // 0-1
    // 几何参数
    this.CX = 240, this.CY = 425, this.R = 75, this.L = 170;
    this.WALL_L = 170, this.WALL_R = 310, this.HEAD_Y = 110;
    this.prevPiston = this.pistonTop(0);
    this.pistonVel = 0;
  }

  /* 曲轴销 & 活塞位置（曲柄连杆机构） */
  crankPos(angle = this.angle) {
    const r = angle * Math.PI / 180;
    return { x: this.CX + this.R * Math.sin(r), y: this.CY - this.R * Math.cos(r) };
  }
  wristPos(angle = this.angle) {
    const p = this.crankPos(angle);
    const dx = p.x - this.CX;
    return { x: this.CX, y: p.y - Math.sqrt(this.L * this.L - dx * dx) };
  }
  pistonTop(angle = this.angle) { return this.wristPos(angle).y - 30; }

  get stroke() { return Math.floor(this.angle / 180) % 4; }

  /* 气门开度 0~1，正弦平滑 */
  intakeLift(a = this.angle) {
    if (a < 180) return Math.sin(Math.PI * a / 180);
    return 0;
  }
  exhaustLift(a = this.angle) {
    if (a >= 540 && a < 720) return Math.sin(Math.PI * (a - 540) / 180);
    return 0;
  }

  primeSpark(quality) { this.primed = true; this.primeQuality = quality; }

  update(dt) {
    this.evFire = false; this.evMisfire = false; this.evCycle = false; this.firePower = 0;
    if (!this.playing) { this.pistonVel = 0; return; }

    const old = this.angle;
    this.angle += this.rpm * 6 * dt;   // rpm*360/60

    // 经过压缩上止点附近 → 点火事件
    const FIRE = 357;
    if (old < FIRE && this.angle >= FIRE && this.angle < 400) {
      if (this.autoSpark) {
        this.evFire = true; this.firePower = 1;
      } else if (this.primed) {
        this.evFire = true;
        this.firePower = this.primeQuality === 'perfect' ? 1
          : (this.primeQuality === 'good' ? 0.65
          : (this.primeQuality === 'weak' ? 0.4 : 0.25));
      } else {
        this.evMisfire = true;
      }
    }
    // 完成一个工作循环
    if (this.angle >= 720) {
      this.angle -= 720;
      this.cycles++;
      this.evCycle = true;
      this.primed = false;
      this.primeQuality = null;
    }
    const p = this.pistonTop();
    this.pistonVel = dt > 0 ? (p - this.prevPiston) / dt : 0; // 正=向下
    this.prevPiston = p;
  }
}

/* =========================================================
   渲染器
   ========================================================= */
class EngineRenderer {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.mix = []; this.flame = []; this.smoke = [];
    this.flash = 0;
    this.sparkT = 0;
    this.view = null;
    this.frameParts = [];
  }

  resetParticles() { this.mix = []; this.flame = []; this.smoke = []; }

  /* 画布自适应 + DPR，返回绘制参数 */
  _setup(crop) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = this.cv.clientWidth, ch = this.cv.clientHeight;
    if (!cw || !ch) return null;
    const bw = Math.round(cw * dpr), bh = Math.round(ch * dpr);
    if (this.cv.width !== bw || this.cv.height !== bh) { this.cv.width = bw; this.cv.height = bh; }
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);
    const c = crop || { x: 0, y: 0, w: 480, h: 560 };
    const s = Math.min(bw / c.w, bh / c.h);
    const ox = (bw - c.w * s) / 2 - c.x * s;
    const oy = (bh - c.h * s) / 2 - c.y * s;
    ctx.setTransform(s, 0, 0, s, ox, oy);
    this.view = { s, ox, oy, bw, bh };
    return ctx;
  }

  worldFromClient(clientX, clientY) {
    const r = this.cv.getBoundingClientRect();
    const bx = (clientX - r.left) / r.width * this.cv.width;
    const by = (clientY - r.top) / r.height * this.cv.height;
    const v = this.view;
    return { x: (bx - v.ox) / v.s, y: (by - v.oy) / v.s };
  }

  draw(sim, opts = {}) {
    const ctx = this._setup(opts.crop);
    if (!ctx) return;
    const s = STROKES[sim.stroke];
    const pistonY = sim.pistonTop();
    const wrist = sim.wristPos();
    const pin = sim.crankPos();
    const inLift = sim.intakeLift(), exLift = sim.exhaustLift();

    this._updateParticles(sim, opts.dt || 0, pistonY, inLift, exLift);
    this.flash = Math.max(0, this.flash - (opts.dt || 0) * 3.2);
    this.sparkT = Math.max(0, this.sparkT - (opts.dt || 0) * 3);

    this._drawCrankcase(ctx, sim);
    this._drawFlywheel(ctx, sim);
    this._drawCrank(ctx, sim, pin);
    this._drawRod(ctx, wrist, pin);
    this._drawPorts(ctx);
    this._drawCylinderWalls(ctx);

    // 气缸内粒子（裁剪）
    ctx.save();
    ctx.beginPath();
    ctx.rect(sim.WALL_L + 3, sim.HEAD_Y + 3, sim.WALL_R - sim.WALL_L - 6, pistonY - sim.HEAD_Y - 4);
    ctx.clip();
    this._drawMix(ctx);
    this._drawFlame(ctx);
    this._drawSmoke(true);
    this._drawFlash(ctx, sim, pistonY);
    ctx.restore();

    this._drawPiston(ctx, sim, pistonY, wrist);
    this._drawHead(ctx);
    this._drawValve(ctx, sim, true, inLift);
    this._drawValve(ctx, sim, false, exLift);
    this._drawSparkPlug(ctx, sim);
    // 已穿过排气门、进入排气道的废气（绘制在最上层）
    this._drawSmoke(false);

    if (opts.hitRegions) this.frameParts = this._buildHitRegions(sim, pistonY, wrist, pin);
  }

  /* ---------- 粒子系统 ---------- */
  _updateParticles(sim, dt, pistonY, inLift, exLift) {
    const st = sim.stroke;
    const chamberH = pistonY - sim.HEAD_Y - 12;

    // 吸气：从进气门涌入蓝色混合气
    if (st === 0 && inLift > 0.15 && sim.pistonVel > 5 && this.mix.length < 80) {
      const n = Math.min(3, Math.ceil(sim.pistonVel / 120));
      for (let i = 0; i < n; i++) {
        this.mix.push({
          x: 196 + (Math.random() - 0.5) * 8,
          y: sim.HEAD_Y + 8 + Math.random() * 6,
          vx: 20 + Math.random() * 40, vy: 40 + Math.random() * 60,
          r: 2.5 + Math.random() * 2.5, life: 1
        });
      }
    }
    // 燃烧事件
    if (sim.evFire) {
      this.flash = Math.min(1, 0.7 + sim.firePower * 0.4);
      this.sparkT = 1;
      const cx = sim.CX, cy = sim.HEAD_Y + 22;
      const n = Math.round(26 + 30 * sim.firePower);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 190 * sim.firePower;
        this.flame.push({
          x: cx + (Math.random() - .5) * 14, y: cy + (Math.random() - .5) * 8,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .7 - 30,
          r: 5 + Math.random() * 7 * sim.firePower, life: 1
        });
      }
      for (const m of this.mix) m.life = 0;
      this.mix.length = 0;
    }

    // 粒子运动
    for (const m of this.mix) {
      m.x += m.vx * dt; m.y += m.vy * dt;
      m.vx *= 0.985; m.vy *= 0.985;
      m.vx += (sim.CX - m.x) * 0.4 * dt;
      if (m.y > pistonY - 6) m.y = pistonY - 6 - Math.random() * 4;
      if (m.x < sim.WALL_L + 7) { m.x = sim.WALL_L + 7; m.vx *= -0.5; }
      if (m.x > sim.WALL_R - 7) { m.x = sim.WALL_R - 7; m.vx *= -0.5; }
    }
    for (const f of this.flame) {
      f.x += f.vx * dt; f.y += f.vy * dt;
      f.vy += 160 * dt; f.vx *= 0.97; f.vy *= 0.97;
      f.life -= dt * 1.5;
      if (f.y > pistonY - 4) { f.y = pistonY - 4; f.vy *= -0.3; }
    }
    this.flame = this.flame.filter(f => f.life > 0);

    // 排气：废气从排气门排出
    if (st === 3 && exLift > 0.15 && sim.pistonVel < -5 && this.smoke.length < 90) {
      const n = Math.min(3, Math.ceil(-sim.pistonVel / 110));
      const top = sim.HEAD_Y + 14, span = Math.max(12, pistonY - sim.HEAD_Y - 30);
      for (let i = 0; i < n; i++) {
        this.smoke.push({
          x: 198 + Math.random() * 92, y: top + Math.random() * span,
          vx: 30 + Math.random() * 40, vy: -70 - Math.random() * 80,
          r: 4 + Math.random() * 4, life: 1, hot: false
        });
      }
    }
    // 做功后残留热气变废气
    if (st === 3 && this.flame.length && Math.random() < 0.5 && this.smoke.length < 80) {
      const f = this.flame.shift();
      this.smoke.push({ x: f.x, y: f.y, vx: 30, vy: -70, r: 5, life: 1, hot: true });
    }
    for (const g of this.smoke) {
      g.x += g.vx * dt; g.y += g.vy * dt;
      // 流向排气门（283,108），穿过气门后沿排气道向右
      g.vx += (g.x < 283 ? 150 : 70) * dt;
      if (g.x > 300 && g.y < 108) g.vy -= 40 * dt;
      g.r += dt * 7; g.life -= dt * 0.9;
      // 被活塞上推
      if (g.y > pistonY - 8) g.y = pistonY - 8;
      if (g.x > 372) g.life -= dt * 3; // 飞出排气道
    }
    this.smoke = this.smoke.filter(g => g.life > 0);

    // 新循环清理
    if (sim.evCycle) { this.smoke.length = 0; this.flame.length = 0; }
  }

  _drawMix(ctx) {
    for (const m of this.mix) {
      ctx.beginPath();
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 2);
      g.addColorStop(0, 'rgba(140,225,255,.9)');
      g.addColorStop(1, 'rgba(80,170,255,0)');
      ctx.fillStyle = g;
      ctx.arc(m.x, m.y, m.r * 2, 0, 7);
      ctx.fill();
    }
  }
  _drawFlame(ctx) {
    for (const f of this.flame) {
      const a = Math.max(0, f.life);
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * (1.6 - a * .4));
      g.addColorStop(0, `rgba(255,240,170,${a})`);
      g.addColorStop(.45, `rgba(255,150,40,${a * .9})`);
      g.addColorStop(1, 'rgba(200,40,10,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 1.8, 0, 7); ctx.fill();
    }
  }
  _drawSmoke(inChamber) {
    const ctx = this.ctx;
    for (const g of this.smoke) {
      if (inChamber ? g.x >= 306 : g.x < 306) continue;
      const a = Math.max(0, Math.min(.5, g.life * .45));
      const grd = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      if (g.hot) {
        grd.addColorStop(0, `rgba(120,100,100,${a})`);
        grd.addColorStop(1, 'rgba(80,70,70,0)');
      } else {
        grd.addColorStop(0, `rgba(150,160,175,${a})`);
        grd.addColorStop(1, 'rgba(110,120,140,0)');
      }
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 7); ctx.fill();
    }
  }
  _drawFlash(ctx, sim, pistonY) {
    if (this.flash <= 0) return;
    const cy = sim.HEAD_Y + 30;
    const g = ctx.createRadialGradient(sim.CX, cy, 0, sim.CX, cy, 150);
    g.addColorStop(0, `rgba(255,240,180,${0.75 * this.flash})`);
    g.addColorStop(.5, `rgba(255,140,40,${0.4 * this.flash})`);
    g.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sim.WALL_L - 20, sim.HEAD_Y - 20, sim.WALL_R - sim.WALL_L + 40, pistonY - sim.HEAD_Y + 30);
  }

  /* ---------- 机体绘制 ---------- */
  _metal(ctx, x, y, w, h, c1, c2, r = 6) {
    const g = ctx.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, c1); g.addColorStop(.5, c2); g.addColorStop(1, c1);
    ctx.fillStyle = g;
    this._rr(ctx, x, y, w, h, r); ctx.fill();
  }
  _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  _drawCrankcase(ctx, sim) {
    // 曲轴箱
    const g = ctx.createLinearGradient(0, 330, 0, 530);
    g.addColorStop(0, '#3a4663'); g.addColorStop(1, '#1c2438');
    ctx.fillStyle = g;
    this._rr(ctx, 108, 330, 264, 205, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(150,180,230,.25)'; ctx.lineWidth = 2;
    this._rr(ctx, 108, 330, 264, 205, 22); ctx.stroke();
    // 螺栓
    ctx.fillStyle = '#5a6a8e';
    [[128,350],[352,350],[128,515],[352,515]].forEach(([x,y])=>{
      ctx.beginPath(); ctx.arc(x,y,5,0,7); ctx.fill();
    });
  }

  _drawFlywheel(ctx, sim) {
    const { CX, CY } = sim;
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(sim.angle * Math.PI / 180);
    // 外齿圈
    const g = ctx.createRadialGradient(0, 0, 60, 0, 0, 104);
    g.addColorStop(0, '#2a3550'); g.addColorStop(.8, '#46547a'); g.addColorStop(1, '#6b7ba6');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 100, 0, 7); ctx.fill();
    // 齿
    ctx.fillStyle = '#8293bd';
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 100, Math.sin(a) * 100, 3.2, 0, 7);
      ctx.fill();
    }
    // 轮辐
    ctx.strokeStyle = 'rgba(160,185,230,.5)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 72, Math.sin(a) * 72); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7);
    ctx.fillStyle = '#55668f'; ctx.fill();
    ctx.restore();
  }

  _drawCrank(ctx, sim, pin) {
    const { CX, CY, R } = sim;
    const a = sim.angle * Math.PI / 180;
    // 平衡重（与曲柄销反向）
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(a);
    const cg = ctx.createLinearGradient(0, -R - 26, 0, R + 26);
    cg.addColorStop(0, '#5b6c97'); cg.addColorStop(.5, '#39456a'); cg.addColorStop(1, '#5b6c97');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, R + 22, Math.PI * .55, Math.PI * 1.45);
    ctx.arc(0, 0, 18, Math.PI * 1.45, Math.PI * .55, true);
    ctx.closePath(); ctx.fill();
    // 曲柄臂
    ctx.fillStyle = '#4a5a84';
    this._rr(ctx, -11, -R, 22, R + 14, 8); ctx.fill();
    ctx.restore();
    // 曲柄销
    ctx.beginPath(); ctx.arc(pin.x, pin.y, 11, 0, 7);
    const pg = ctx.createRadialGradient(pin.x - 3, pin.y - 3, 1, pin.x, pin.y, 11);
    pg.addColorStop(0, '#cfdcfa'); pg.addColorStop(1, '#6b7ba6');
    ctx.fillStyle = pg; ctx.fill();
  }

  _drawRod(ctx, wrist, pin) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#222c44'; ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(wrist.x, wrist.y); ctx.lineTo(pin.x, pin.y); ctx.stroke();
    const g = ctx.createLinearGradient(wrist.x, wrist.y, pin.x, pin.y);
    g.addColorStop(0, '#8394be'); g.addColorStop(.5, '#aebbdb'); g.addColorStop(1, '#7688b0');
    ctx.strokeStyle = g; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(wrist.x, wrist.y); ctx.lineTo(pin.x, pin.y); ctx.stroke();
    // 大小头
    [[wrist.x, wrist.y, 8], [pin.x, pin.y, 8]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7);
      ctx.fillStyle = '#cdd9f5'; ctx.fill();
    });
    ctx.restore();
  }

  _drawPorts(ctx) {
    // 进气道（左，蓝调）
    const g1 = ctx.createLinearGradient(100, 60, 210, 110);
    g1.addColorStop(0, '#0d1a30'); g1.addColorStop(1, '#132a44');
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.moveTo(104, 66); ctx.lineTo(206, 66); ctx.lineTo(214, 112); ctx.lineTo(118, 112);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(79,214,255,.35)'; ctx.lineWidth = 2; ctx.stroke();
    // 排气道（右，灰调）
    const g2 = ctx.createLinearGradient(270, 60, 380, 110);
    g2.addColorStop(0, '#2a2326'); g2.addColorStop(1, '#161a24');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.moveTo(274, 66); ctx.lineTo(376, 66); ctx.lineTo(362, 112); ctx.lineTo(266, 112);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(167,139,250,.3)'; ctx.stroke();
  }

  _drawCylinderWalls(ctx) {
    // 气缸套
    this._metal(ctx, 138, 96, 34, 246, '#67789f', '#93a5cc', 8);
    this._metal(ctx, 308, 96, 34, 246, '#67789f', '#93a5cc', 8);
    // 镜面内壁高光
    ctx.fillStyle = 'rgba(220,235,255,.12)';
    ctx.fillRect(168, 112, 5, 228);
    ctx.fillRect(307, 112, 5, 228);
  }

  _drawPiston(ctx, sim, y, wrist) {
    const x = sim.WALL_L + 4, w = sim.WALL_R - sim.WALL_L - 8, h = 44;
    // 裙部主体
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#7d8db3'); g.addColorStop(.25, '#d4def5');
    g.addColorStop(.5, '#eef3ff'); g.addColorStop(.75, '#aebbdb'); g.addColorStop(1, '#6c7ca3');
    ctx.fillStyle = g;
    this._rr(ctx, x, y, w, h, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(30,40,60,.6)'; ctx.lineWidth = 1.5;
    this._rr(ctx, x, y, w, h, 7); ctx.stroke();
    // 活塞环
    ctx.strokeStyle = '#5a6685'; ctx.lineWidth = 2.5;
    [7, 13, 19].forEach(dy => {
      ctx.beginPath(); ctx.moveTo(x + 3, y + dy); ctx.lineTo(x + w - 3, y + dy); ctx.stroke();
    });
    // 顶部燃烧室凹形高光
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(x + 8, y + 2, w - 16, 2);
    // 活塞销
    ctx.beginPath(); ctx.arc(wrist.x, wrist.y, 7, 0, 7);
    const pg = ctx.createRadialGradient(wrist.x - 2, wrist.y - 2, 1, wrist.x, wrist.y, 7);
    pg.addColorStop(0, '#fff'); pg.addColorStop(1, '#7688b0');
    ctx.fillStyle = pg; ctx.fill();
  }

  _drawHead(ctx) {
    const g = ctx.createLinearGradient(0, 30, 0, 112);
    g.addColorStop(0, '#8393bc'); g.addColorStop(.5, '#5c6c95'); g.addColorStop(1, '#39456a');
    ctx.fillStyle = g;
    this._rr(ctx, 150, 30, 180, 82, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(180,205,240,.3)'; ctx.lineWidth = 2;
    this._rr(ctx, 150, 30, 180, 82, 10); ctx.stroke();
    // 燃烧室底缘
    ctx.fillStyle = '#202a42';
    ctx.beginPath();
    ctx.moveTo(170, 110); ctx.lineTo(310, 110);
    ctx.lineTo(300, 96); ctx.lineTo(180, 96);
    ctx.closePath(); ctx.fill();
  }

  _drawValve(ctx, sim, isIntake, lift) {
    const headX = isIntake ? 197 : 283;
    const topX = isIntake ? 187 : 293;
    const open = lift * 13;
    const seatY = 100, headY = seatY + open;
    // 气门导管
    ctx.strokeStyle = '#2c3650'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(topX, 46); ctx.lineTo(headX, headY - 4); ctx.stroke();
    // 气门杆
    const g = ctx.createLinearGradient(topX, 46, headX, headY);
    g.addColorStop(0, '#c3cfe8'); g.addColorStop(1, '#8090b8');
    ctx.strokeStyle = g; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(topX, 46); ctx.lineTo(headX, headY - 4); ctx.stroke();
    // 气门头（蘑菇头）
    ctx.fillStyle = isIntake ? '#9fc4e8' : '#c8a8e8';
    ctx.beginPath();
    ctx.moveTo(headX - 15, headY);
    ctx.quadraticCurveTo(headX, headY + 9, headX + 15, headY);
    ctx.lineTo(headX + 5, headY - 4);
    ctx.lineTo(headX - 5, headY - 4);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.stroke();
    // 气门座
    if (open < 2) {
      ctx.strokeStyle = 'rgba(255,120,120,.0)';
    }
  }

  _drawSparkPlug(ctx, sim) {
    const x = sim.CX;
    // 陶瓷体
    const g = ctx.createLinearGradient(x - 8, 34, x + 8, 34);
    g.addColorStop(0, '#b9c4da'); g.addColorStop(.5, '#f2f5fb'); g.addColorStop(1, '#93a1bd');
    ctx.fillStyle = g;
    this._rr(ctx, x - 7, 34, 14, 26, 3); ctx.fill();
    // 六角螺母
    ctx.fillStyle = '#7c8bab';
    this._rr(ctx, x - 10, 58, 20, 12, 2); ctx.fill();
    // 电极杆
    ctx.strokeStyle = '#d7e0f0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, 96); ctx.stroke();
    ctx.strokeStyle = '#d7e0f0'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 5, 92); ctx.lineTo(x, 100); ctx.stroke();
    // 电火花
    if (this.sparkT > 0) {
      const a = this.sparkT;
      ctx.save();
      ctx.shadowColor = '#ffe880'; ctx.shadowBlur = 14;
      ctx.strokeStyle = `rgba(255,240,150,${a})`; ctx.lineWidth = 2;
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * 3, 98);
        ctx.lineTo(x + k * 5 + (Math.random() - .5) * 4, 104);
        ctx.lineTo(x + k * 2, 109);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ---------- 点击热区 ---------- */
  _buildHitRegions(sim, pistonY, wrist, pin) {
    const near = (px, py, x, y, r) => Math.hypot(px - x, py - y) <= r;
    const inRect = (px, py, x, y, w, h) => px >= x && px <= x + w && py >= y && py <= y + h;
    const mid = { x: (wrist.x + pin.x) / 2, y: (wrist.y + pin.y) / 2 };
    const dCrank = (px, py) => {
      const d = Math.hypot(px - sim.CX, py - sim.CY);
      return d <= 42;
    };
    const dFly = (px, py) => {
      const d = Math.hypot(px - sim.CX, py - sim.CY);
      return d > 58 && d <= 104;
    };
    return [
      { id: 'spark', test: (x, y) => inRect(x, y, 225, 30, 30, 72) },
      { id: 'inport', test: (x, y) => inRect(x, y, 104, 60, 106, 54) },
      { id: 'export', test: (x, y) => inRect(x, y, 270, 60, 106, 54) },
      { id: 'invalve', test: (x, y) => near(x, y, 192, 106, 20) },
      { id: 'exvalve', test: (x, y) => near(x, y, 288, 106, 20) },
      { id: 'piston', test: (x, y) => inRect(x, y, 174, pistonY - 2, 132, 48) },
      { id: 'rod', test: (x, y) => near(x, y, mid.x, mid.y, 20) || near(x, y, wrist.x, wrist.y, 14) },
      { id: 'crank', test: dCrank },
      { id: 'flywheel', test: dFly },
      { id: 'cylinder', test: (x, y) => inRect(x, y, 138, 100, 32, 230) || inRect(x, y, 310, 100, 32, 230)
          || (x >= 172 && x <= 308 && y >= 112 && y <= pistonY - 6) }
    ];
  }

  pick(x, y) {
    for (const p of this.frameParts) if (p.test(x, y)) return p.id;
    return null;
  }
}
