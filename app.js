// ===== 奖品池 =====
const PRIZES = [
  { id: 'ck', emoji: '🎂', name: '生日蛋糕', desc: '不知道巧克力和开心果搭配\n会不会一样美味' },
  { id: 'ph', emoji: '📱', name: '手机背带', desc: '哈哈哈这也能算礼物吗？' },
  { id: 'kb', emoji: '⌨️', name: '定制键盘', desc: '这真的是独一无二的键盘呢，嘻嘻' },
  { id: 'hp', emoji: '🎧', name: '耳机', desc: '耳机还得是带麦克风的，实用' },
  { id: 'nk', emoji: '📿', name: '项链', desc: '希望这个项链能受到宝的青睐' },
  { id: 'fl', emoji: '💐', name: '永生花', desc: '你说你不喜欢看鲜花凋零' },
  { id: 'lt', emoji: '💌', name: '信', desc: '好久不写信，连写字都生疏了\n希望不会来得太晚' }
];

// 固定抽奖顺序：蛋糕→背带→随机→...→信最后
const FIXED_ORDER = ['ck', 'ph', null, null, null, null, 'lt'];

// ===== 任务池（牵、抱、亲、唱歌、自拍、许愿）=====
const TASKS = [
  { id: 't1', icon: '🤝', text: '牵我的手', reward: '手心的温度刚刚好' },
  { id: 't2', icon: '🤗', text: '抱我一下', reward: '拥抱是最好的充电方式' },
  { id: 't3', icon: '😘', text: '亲我一下', reward: '能量已充满！' },
  { id: 't4', icon: '🎵', text: '唱一句歌给我听', reward: '全世界最好听的声音' },
  { id: 't5', icon: '📸', text: '跟我自拍一张', reward: '存入永久记忆库' },
  { id: 't6', icon: '🌟', text: '许一个愿', reward: '愿望一定会实现的' }
];

// ===== 状态 =====
let state = {
  chances: 1,
  wonPrizes: [],
  doneTasks: [],
  spokenCount: 0,
  started: false
};

// 加载存储
function loadState() {
  const s = localStorage.getItem('bday-draw');
  if (s) state = JSON.parse(s);
}
function saveState() {
  localStorage.setItem('bday-draw', JSON.stringify(state));
}

// ===== 粒子背景 =====
function initParticles() {
  const c = document.querySelector('.particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;animation-duration:${Math.random()*8+6}s;animation-delay:${Math.random()*5}s;opacity:${Math.random()*.5+.2}`;
    c.appendChild(p);
  }
}

// ===== 渲染 =====
function render() {
  // 奖品格子
  const grid = document.getElementById('prizeGrid');
  grid.innerHTML = '';
  PRIZES.forEach(p => {
    const won = state.wonPrizes.includes(p.id);
    const d = document.createElement('div');
    d.className = 'prize-slot' + (won ? ' won' : '');
    d.id = 'slot-' + p.id;
    d.innerHTML = `<span class="emoji">${won ? p.emoji : '❓'}</span><span class="pname">${won ? p.name : '???'}</span>`;
    grid.appendChild(d);
  });

  // 机会数
  document.getElementById('chanceNum').textContent = state.chances;

  // 抽奖按钮
  const btn = document.getElementById('drawBtn');
  const remaining = PRIZES.length - state.wonPrizes.length;
  if (remaining === 0) {
    btn.disabled = true;
    btn.textContent = '已全部开启';
    setTimeout(showFinish, 600);
  } else if (state.chances <= 0) {
    btn.disabled = true;
    btn.textContent = '完成互动解锁';
  } else {
    btn.disabled = false;
    btn.textContent = '开启';
  }

  // 任务列表
  const tl = document.getElementById('taskList');
  tl.innerHTML = '';
  TASKS.forEach(t => {
    const done = state.doneTasks.includes(t.id);
    const d = document.createElement('div');
    d.className = 'task-item' + (done ? ' done' : '');
    d.innerHTML = `<span class="ticon">${t.icon}</span><div class="tinfo">${t.text}</div>`;
    if (!done && state.wonPrizes.length < PRIZES.length) {
      const b = document.createElement('button');
      b.className = 'task-btn';
      b.textContent = done ? '✓' : '完成';
      b.onclick = () => completeTask(t.id, t.reward);
      d.appendChild(b);
    } else if (done) {
      const s = document.createElement('span');
      s.style.cssText = 'color:rgba(255,107,157,.5);font-size:.8em;letter-spacing:1px';
      s.textContent = '✓';
      d.appendChild(s);
    }
    tl.appendChild(d);
  });

  saveState();
}

// ===== 抽奖动画 =====
function doDraw() {
  if (state.chances <= 0) return;
  const remaining = PRIZES.filter(p => !state.wonPrizes.includes(p.id));
  if (remaining.length === 0) return;

  state.chances--;
  const btn = document.getElementById('drawBtn');
  btn.disabled = true;

  // 随机跑马灯动画
  const slots = document.querySelectorAll('.prize-slot:not(.won)');
  let count = 0;
  const totalFlashes = 15 + Math.floor(Math.random() * 8);
  let speed = 80;
  let currentIdx = 0;

  function flash() {
    slots.forEach(s => s.classList.remove('drawing'));
    if (count >= totalFlashes) {
      // 按固定顺序决定中奖
      const drawIndex = state.wonPrizes.length; // 这是第几次抽(0-based)
      const fixedId = FIXED_ORDER[drawIndex] || null;
      let winner;
      if (fixedId) {
        winner = remaining.find(p => p.id === fixedId) || remaining[Math.floor(Math.random() * remaining.length)];
      } else {
        // 中间随机，但排除最后一个(信)
        const pool = remaining.filter(p => p.id !== 'lt' || remaining.length === 1);
        winner = pool[Math.floor(Math.random() * pool.length)];
      }
      state.wonPrizes.push(winner.id);
      saveState();
      render();
      showModal(winner);
      return;
    }
    currentIdx = count % slots.length;
    slots[currentIdx].classList.add('drawing');
    count++;
    speed += 8;
    setTimeout(flash, speed);
  }
  flash();
}

// ===== 完成任务 =====
function completeTask(id, reward) {
  if (state.doneTasks.includes(id)) return;
  state.doneTasks.push(id);
  state.chances++;
  render();
}

// ===== 弹窗 =====
function showModal(prize) {
  const overlay = document.getElementById('modal');
  document.getElementById('modalEmoji').textContent = prize.emoji;
  document.getElementById('modalTitle').textContent = '恭喜获得：' + prize.name;
  document.getElementById('modalDesc').innerHTML = prize.desc.replace(/\n/g, '<br>');
  overlay.classList.add('show');
  spawnConfetti();
}
function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

// ===== 彩带效果 =====
function spawnConfetti() {
  const colors = ['#ff6b9d','#c44dff','#6ec6ff','#ffd700','#ff6b6b','#51e898'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.cssText = `left:${Math.random()*100}vw;width:${Math.random()*8+4}px;height:${Math.random()*8+4}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>.5?'50%':'2px'};animation:confettiFall ${Math.random()*2+1.5}s ease-out forwards;animation-delay:${Math.random()*.3}s`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
  // 动态注入动画
  if (!document.getElementById('confettiStyle')) {
    const s = document.createElement('style');
    s.id = 'confettiStyle';
    s.textContent = `@keyframes confettiFall{0%{transform:translateY(-10px)rotate(0);opacity:1}100%{transform:translateY(100vh)rotate(${360+Math.random()*360}deg);opacity:0}}`;
    document.head.appendChild(s);
  }
}

// ===== 完成页 =====
function showFinish() {
  document.querySelector('.main').classList.remove('show');
  document.querySelector('.finish').classList.add('show');
  spawnConfetti();
}

// ===== 开场 =====
function startGame() {
  state.started = true;
  saveState();
  document.getElementById('intro').classList.add('hide');
  document.querySelector('.main').classList.add('show');
  setTimeout(() => document.getElementById('intro').style.display = 'none', 600);
}

// ===== 重置(调试用) =====
function resetGame() {
  if (confirm('确定重置所有进度？')) {
    localStorage.removeItem('bday-draw');
    location.reload();
  }
}

// ===== 初始化 =====
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  initParticles();
  if (state.started) {
    document.getElementById('intro').style.display = 'none';
    if (state.wonPrizes.length >= PRIZES.length) {
      document.querySelector('.finish').classList.add('show');
    } else {
      document.querySelector('.main').classList.add('show');
    }
  }
  render();
});
