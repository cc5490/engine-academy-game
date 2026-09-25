/* ============ 图鉴 · 对比 · 成就 ============ */
const Codex = (() => {
  const el = id => document.getElementById(id);
  let bound = false;

  function enter() {
    renderParts();
    renderAchievements();
    if (!bound) {
      bound = true;
      document.querySelectorAll('.codex-tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.codex-tabs .tab').forEach(t => t.classList.toggle('active', t === tab));
          const name = tab.dataset.tab;
          ['parts', 'compare', 'achieve'].forEach(n =>
            el('pane-' + n).classList.toggle('active', n === name));
        });
      });
    }
  }

  function renderParts() {
    const grid = el('parts-grid');
    grid.innerHTML = '';
    PARTS.forEach(p => {
      const got = !!Store.data.labClicks[p.id];
      const card = document.createElement('div');
      card.className = 'part-card' + (got ? '' : ' locked');
      card.innerHTML = `
        <div class="p-emoji">${got ? p.emoji : '❓'}</div>
        <h4>${got ? p.name : '未解锁零件'}</h4>
        <p>${got ? p.desc : '在「自由实验室」中点击发动机上的对应零件即可解锁。'}</p>
        ${got ? '' : '<div class="p-lock">🔒 实验室解锁</div>'}
      `;
      grid.appendChild(card);
    });
  }

  function renderAchievements() {
    const grid = el('achieve-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Achievements.DEFS.forEach(a => {
      const got = !!Store.data.achievements[a.id];
      const card = document.createElement('div');
      card.className = 'ach-card' + (got ? ' got' : '');
      card.innerHTML = `
        <div class="ach-emoji">${a.emoji}</div>
        <h4>${a.name}</h4>
        <p>${a.desc}</p>
        <p style="margin-top:8px;color:${got ? 'var(--gold)' : '#5a6b8c'}">${got ? '✔ 已解锁' : '未解锁'}</p>
      `;
      grid.appendChild(card);
    });
  }

  return { enter, renderAchievements };
})();
