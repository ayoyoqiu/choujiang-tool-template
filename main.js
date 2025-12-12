// 默认名单
const defaultNames = [
  '测试1', '测试2', '测试3', '测试4', '测试5', '测试6', '测试7', '测试8', '测试9', '测试10'
];

const STORAGE_KEY = '抽奖名单存储v1';
const RESULT_KEY = '抽奖结果存储v1';
const MODE_KEY = '抽取模式存储v1';
const PRIZE_CONFIG_KEY = '奖品配置存储v1';
const BACKGROUND_KEY = '背景配置存储v1';
const CLICK_COUNT_KEY = '点击次数存储v1';

let names = [];
let resultList = [];
let timer = null;
let batchTimer = null;
let rollTimer = null; // 批量抽取时的滚动定时器
let running = false;
let batchRunning = false; // 批量抽取运行状态
let drawMode = 'single'; // 'single' 或 'batch'
let batchNameDisplays = []; // 批量抽取时的多个名字显示元素

// 默认背景图片
const defaultBackground = 'https://www.img520.com/Q82HvE.png';

// 默认奖品配置
const defaultPrizeRounds = [
  {
    name: '奖品1 纯棉贝壳文化衫',
    count: 5,
    img: 'https://www.img520.com/fh57ic.jpg'
  },
  {
    name: '奖品2 法兰绒毛毯',
    count: 5,
    img: 'https://www.img520.com/WXocfm.png'
  },
  {
    name: '奖品3 闹海健身包',
    count: 5,
    img: 'https://www.img520.com/qMwsiE.png'
  }
];

// 奖品轮次与图片（可变）
let prizeRounds = [];
let currentRound = 0;

// 记录每轮已中奖名单
let roundWinners = [];

const nameDisplayContainer = document.getElementById('nameDisplayContainer');
const nameDisplay = document.getElementById('nameDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const editBtn = document.getElementById('editBtn');
const configBtn = document.getElementById('configBtn');
const resultListDiv = document.getElementById('resultList');
const editModal = document.getElementById('editModal');
const configModal = document.getElementById('configModal');
const nameTextarea = document.getElementById('nameTextarea');
const saveNamesBtn = document.getElementById('saveNamesBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeConfigBtn = document.getElementById('closeConfigBtn');
const exportBtn = document.getElementById('exportBtn');
const modeRadios = document.querySelectorAll('input[name="drawMode"]');
const prizeConfigList = document.getElementById('prizeConfigList');
const addPrizeBtn = document.getElementById('addPrizeBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const backgroundBtn = document.getElementById('backgroundBtn');
const backgroundModal = document.getElementById('backgroundModal');
const backgroundUrlInput = document.getElementById('backgroundUrlInput');
const backgroundPreviewImg = document.getElementById('backgroundPreviewImg');
const resetBackgroundBtn = document.getElementById('resetBackgroundBtn');
const saveBackgroundBtn = document.getElementById('saveBackgroundBtn');
const closeBackgroundBtn = document.getElementById('closeBackgroundBtn');
const clickCounter = document.getElementById('clickCounter');

function loadNames() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    names = saved.split('\n').map(s => s.trim()).filter(Boolean);
  } else {
    names = [...defaultNames];
  }
}

function saveNames() {
  localStorage.setItem(STORAGE_KEY, names.join('\n'));
}

function loadPrizeConfig() {
  const saved = localStorage.getItem(PRIZE_CONFIG_KEY);
  if (saved) {
    try {
      prizeRounds = JSON.parse(saved);
      // 确保至少有一个奖品
      if (prizeRounds.length === 0) {
        prizeRounds = JSON.parse(JSON.stringify(defaultPrizeRounds));
      }
    } catch (e) {
      prizeRounds = JSON.parse(JSON.stringify(defaultPrizeRounds));
    }
  } else {
    prizeRounds = JSON.parse(JSON.stringify(defaultPrizeRounds));
  }
  // 初始化roundWinners数组
  roundWinners = prizeRounds.map(() => []);
}

function savePrizeConfig() {
  localStorage.setItem(PRIZE_CONFIG_KEY, JSON.stringify(prizeRounds));
  // 重新初始化roundWinners数组
  roundWinners = prizeRounds.map(() => []);
  saveResults();
}

function loadBackground() {
  const saved = localStorage.getItem(BACKGROUND_KEY);
  const bgUrl = saved || defaultBackground;
  applyBackground(bgUrl);
  return bgUrl;
}

function saveBackground(url) {
  if (url && url.trim() !== '') {
    localStorage.setItem(BACKGROUND_KEY, url.trim());
  } else {
    localStorage.removeItem(BACKGROUND_KEY);
  }
  applyBackground(url || defaultBackground);
}

function applyBackground(url) {
  const body = document.body;
  const mainLayout = document.querySelector('.main-flex-layout');
  if (body && mainLayout) {
    body.style.backgroundImage = `url('${url}')`;
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundPosition = 'center center';
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundSize = 'cover';
    mainLayout.style.backgroundImage = `url('${url}')`;
    mainLayout.style.backgroundRepeat = 'no-repeat';
    mainLayout.style.backgroundPosition = 'center center';
    mainLayout.style.backgroundAttachment = 'fixed';
    mainLayout.style.backgroundSize = 'cover';
  }
}

function loadResults() {
  const saved = localStorage.getItem(RESULT_KEY);
  if (saved) {
    try {
      const savedWinners = JSON.parse(saved);
      // 确保roundWinners数组长度与prizeRounds一致
      if (savedWinners.length === prizeRounds.length) {
        roundWinners = savedWinners;
      } else {
        // 如果长度不一致，重新初始化
        roundWinners = prizeRounds.map(() => []);
      }
    } catch (e) {
      roundWinners = prizeRounds.map(() => []);
    }
  } else {
    roundWinners = prizeRounds.map(() => []);
  }
}

function saveResults() {
  localStorage.setItem(RESULT_KEY, JSON.stringify(roundWinners));
}

function loadMode() {
  const saved = localStorage.getItem(MODE_KEY);
  if (saved) {
    drawMode = saved;
    // 更新单选按钮状态
    modeRadios.forEach(radio => {
      if (radio.value === drawMode) {
        radio.checked = true;
      }
    });
  }
  updateButtonText();
}

function loadClickCount() {
  const saved = localStorage.getItem(CLICK_COUNT_KEY);
  return saved ? parseInt(saved, 10) : 0;
}

function saveClickCount(count) {
  localStorage.setItem(CLICK_COUNT_KEY, count.toString());
}

function updateClickCounter() {
  const count = loadClickCount();
  if (clickCounter) {
    clickCounter.textContent = `浏览次数: ${count}`;
  }
}

function incrementClickCount() {
  const currentCount = loadClickCount();
  const newCount = currentCount + 1;
  saveClickCount(newCount);
  updateClickCounter();
}

function saveMode() {
  localStorage.setItem(MODE_KEY, drawMode);
}

function updateResultList() {
  if (roundWinners[currentRound].length) {
    resultListDiv.innerHTML = roundWinners[currentRound].map((name, idx) => {
      if (idx === roundWinners[currentRound].length - 1) {
        return `<div class="result-item red">${name}</div>`;
      } else {
        return `<div class="result-item">${name}</div>`;
      }
    }).join('');
  } else {
    resultListDiv.innerHTML = '';
  }
}

function getAvailableNames() {
  // 当前轮次已中奖名单
  const allWinners = roundWinners.flat();
  return names.filter(n => !allWinners.includes(n));
}

function startRoll() {
  if (running || batchRunning) return;
  
  // 当前轮次已抽满不可再抽
  if (roundWinners[currentRound].length >= prizeRounds[currentRound].count) {
    alert('本轮奖品已抽满！');
    return;
  }
  
  const available = getAvailableNames();
  if (available.length === 0) {
    nameDisplay.textContent = '名单已抽完';
    return;
  }
  
  // 根据模式执行不同逻辑
  if (drawMode === 'batch') {
    startBatchDraw();
  } else {
    startSingleRoll();
  }
}

function resetNameDisplay() {
  // 清除批量抽取时的多个显示元素
  batchNameDisplays.forEach(el => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
  batchNameDisplays = [];
  
  // 恢复单次抽取的显示
  nameDisplayContainer.innerHTML = '<div class="name-display" id="nameDisplay">中奖区</div>';
  const newNameDisplay = document.getElementById('nameDisplay');
  nameDisplayContainer.classList.remove('batch-mode');
  if (newNameDisplay && newNameDisplay.textContent === '中奖区') {
    newNameDisplay.style.color = '#999';
  }
  return newNameDisplay;
}

function startSingleRoll() {
  // 确保是单次抽取模式
  const currentNameDisplay = document.getElementById('nameDisplay');
  if (!currentNameDisplay) {
    resetNameDisplay();
  }
  const nameDisplayEl = document.getElementById('nameDisplay');
  
  running = true;
  nameDisplayEl.classList.remove('paused');
  nameDisplayEl.style.color = '#fff';
  timer = setInterval(() => {
    const pool = getAvailableNames();
    if (pool.length === 0) {
      clearInterval(timer);
      nameDisplayEl.textContent = '名单已抽完';
      running = false;
      return;
    }
    const idx = Math.floor(Math.random() * pool.length);
    nameDisplayEl.textContent = pool[idx];
    nameDisplayEl.style.color = '#fff';
  }, 5);
}

function startBatchDraw() {
  batchRunning = true;
  startBtn.disabled = true;
  pauseBtn.textContent = '暂停';
  
  // 计算需要抽取的数量
  const prizeCount = prizeRounds[currentRound].count;
  const alreadyDrawn = roundWinners[currentRound].length;
  const needToDraw = prizeCount - alreadyDrawn;
  
  if (needToDraw <= 0) {
    stopBatchDraw();
    alert('本轮奖品已全部抽取完成！');
    return;
  }
  
  // 检查是否还有可用名单
  const available = getAvailableNames();
  if (available.length === 0) {
    stopBatchDraw();
    alert('名单已全部抽完！');
    return;
  }
  
  if (available.length < needToDraw) {
    stopBatchDraw();
    alert(`可用名单不足！需要${needToDraw}个，但只有${available.length}个可用。`);
    return;
  }
  
  // 清除之前的显示，创建多个名字显示元素
  nameDisplayContainer.innerHTML = '';
  nameDisplayContainer.classList.add('batch-mode');
  
  // 根据数量动态调整容器样式
  if (needToDraw > 10) {
    nameDisplayContainer.style.maxWidth = '100%';
  } else if (needToDraw > 5) {
    nameDisplayContainer.style.maxWidth = '95%';
  } else {
    nameDisplayContainer.style.maxWidth = '90%';
  }
  
  batchNameDisplays = [];
  
  for (let i = 0; i < needToDraw; i++) {
    const nameEl = document.createElement('div');
    nameEl.className = 'name-display';
    nameEl.textContent = '中奖区';
    nameEl.style.color = '#999';
    nameEl.dataset.index = i;
    nameDisplayContainer.appendChild(nameEl);
    batchNameDisplays.push(nameEl);
  }
  
  // 开始滚动所有名字
  let rollCount = 0;
  const maxRolls = 50; // 滚动50次，约250ms
  
  // 清除之前的滚动定时器（如果有）
  if (rollTimer) {
    clearInterval(rollTimer);
  }
  
  rollTimer = setInterval(() => {
    // 检查是否应该停止
    if (!batchRunning) {
      clearInterval(rollTimer);
      rollTimer = null;
      return;
    }
    
    const pool = getAvailableNames();
    if (pool.length === 0) {
      clearInterval(rollTimer);
      rollTimer = null;
      stopBatchDraw();
      alert('名单已全部抽完！');
      return;
    }
    
    // 同时更新所有名字显示
    batchNameDisplays.forEach(nameEl => {
      const idx = Math.floor(Math.random() * pool.length);
      nameEl.textContent = pool[idx];
      nameEl.classList.remove('paused');
      nameEl.style.color = '#fff';
    });
  }, 5);
}

function stopBatchDraw() {
  batchRunning = false;
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  if (rollTimer) {
    clearInterval(rollTimer);
    rollTimer = null;
  }
  startBtn.disabled = false;
  pauseBtn.textContent = '暂停';
}

function pauseRoll() {
  // 批量模式下，暂停按钮用于确认中奖者
  if (batchRunning && rollTimer) {
    // 停止滚动
    clearInterval(rollTimer);
    rollTimer = null;
    
    // 确认所有正在显示的名字为中奖者
    const prizeCount = prizeRounds[currentRound].count;
    const alreadyDrawn = roundWinners[currentRound].length;
    const needToDraw = prizeCount - alreadyDrawn;
    
    if (needToDraw > 0 && batchNameDisplays.length > 0) {
      const pool = getAvailableNames();
      const winners = [];
      const usedNames = new Set();
      
      // 收集所有正在显示的名字（不重复）
      batchNameDisplays.forEach(nameEl => {
        const name = nameEl.textContent;
        if (name && name !== '--' && name !== '中奖区' && !usedNames.has(name) && pool.includes(name)) {
          winners.push(name);
          usedNames.add(name);
        }
      });
      
      // 如果因为重复导致数量不足，从剩余可用名单中补充
      while (winners.length < needToDraw && pool.length > 0) {
        const remaining = pool.filter(n => !usedNames.has(n));
        if (remaining.length === 0) break;
        const idx = Math.floor(Math.random() * remaining.length);
        const name = remaining[idx];
        winners.push(name);
        usedNames.add(name);
      }
      
      // 添加到中奖名单
      winners.forEach(winner => {
        if (roundWinners[currentRound].length < prizeCount) {
          roundWinners[currentRound].push(winner);
        }
      });
      
      saveResults();
      updateResultList();
      renderPrizeRoundsBar();
      
      // 高亮显示所有中奖者
      batchNameDisplays.forEach((nameEl, idx) => {
        if (winners[idx]) {
          nameEl.textContent = winners[idx];
          nameEl.classList.add('paused');
          nameEl.style.color = '#FF3030';
        }
      });
    }
    
    stopBatchDraw();
    return;
  }
  
  // 单次模式下的原有逻辑
  if (!running) return;
  const nameDisplayEl = document.getElementById('nameDisplay');
  if (!nameDisplayEl) return;
  
  clearInterval(timer);
  running = false;
  nameDisplayEl.classList.add('paused');
  nameDisplayEl.style.color = '#FF3030';
  const currentName = nameDisplayEl.textContent;
  const available = getAvailableNames();
  // 当前轮次未抽满且未重复才可加入
  if (available.includes(currentName) && roundWinners[currentRound].length < prizeRounds[currentRound].count) {
    roundWinners[currentRound].push(currentName);
    saveResults();
    updateResultList();
    renderPrizeRoundsBar();
  }
}

function openEditModal() {
  nameTextarea.value = names.join('\n');
  editModal.classList.add('show');
}

function closeEditModal() {
  editModal.classList.remove('show');
}

function saveEditedNames() {
  const newNames = nameTextarea.value.split('\n').map(s => s.trim()).filter(Boolean);
  if (newNames.length === 0) {
    alert('名单不能为空！');
    return;
  }
  names = newNames;
  saveNames();
  // 清空已抽结果
  roundWinners = prizeRounds.map(() => []);
  saveResults();
  updateResultList();
  closeEditModal();
  
  // 重置显示
  resetNameDisplay();
  const nameDisplayEl = document.getElementById('nameDisplay');
  if (nameDisplayEl) {
    nameDisplayEl.textContent = '中奖区';
    nameDisplayEl.classList.remove('paused');
    nameDisplayEl.style.color = '#999';
  }
}

function updatePrizeImage() {
  const area = document.getElementById('prizeImageArea');
  if (!prizeRounds[currentRound]) return;
  const prize = prizeRounds[currentRound];
  // 如果名称包含空格，尝试分割；否则完整显示
  const nameParts = prize.name.split(' ');
  const prizeLevel = nameParts.length > 1 ? nameParts[0] : prize.name;
  const prizeName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  
  area.innerHTML = `
    <img src="${prize.img || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3E无图片%3C/text%3E%3C/svg%3E'}" alt="${prize.name}" title="${prize.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3E无图片%3C/text%3E%3C/svg%3E'">
    <div class="prize-desc">
      <div class="prize-level">${prizeLevel}</div>
      ${prizeName ? `<div class="prize-name">${prizeName}</div>` : ''}
      <div class="prize-count">${prize.count}个</div>
    </div>
  `;
}

function nextRound() {
  if (currentRound < prizeRounds.length - 1) {
    currentRound++;
    resultList = [];
    saveResults();
    updateResultList();
    updatePrizeImage();
    nameDisplay.textContent = '中奖区';
    nameDisplay.classList.remove('paused');
    nameDisplay.style.color = '#999';
  }
}

function renderPrizeRoundsBar() {
  const bar = document.getElementById('prizeRoundsBar');
  bar.innerHTML = prizeRounds.map((prize, idx) => {
    // 显示奖品名称，如果名称包含空格，显示第一部分；否则显示完整名称（最多8个字符）
    const nameParts = prize.name.split(' ');
    const displayTitle = nameParts.length > 1 ? nameParts[0] : (prize.name.length > 8 ? prize.name.substring(0, 8) + '...' : prize.name);
    const imgSrc = prize.img || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3E无图片%3C/text%3E%3C/svg%3E';
    return `<button class="prize-round-btn${idx === currentRound ? ' active' : ''}" data-idx="${idx}" ${roundWinners[idx] && roundWinners[idx].length >= prize.count ? 'disabled' : ''}>
      <img class='prize-btn-img' src='${imgSrc}' alt='${prize.name}' onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3E无图片%3C/text%3E%3C/svg%3E'">
      <span class='prize-btn-title'>${displayTitle}</span>
      <span class='prize-btn-count'>${roundWinners[idx] ? roundWinners[idx].length : 0}/${prize.count}</span>
    </button>`;
  }).join('');
  // 绑定点击事件
  bar.querySelectorAll('.prize-round-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      if (idx !== currentRound) {
        // 如果正在运行，先停止
        if (running) {
          clearInterval(timer);
          running = false;
        }
        if (batchRunning) {
          stopBatchDraw();
        }
        currentRound = idx;
        updateResultList();
        updatePrizeImage();
        renderPrizeRoundsBar();
        
        // 重置显示
        resetNameDisplay();
        const nameDisplayEl = document.getElementById('nameDisplay');
        if (nameDisplayEl) {
          nameDisplayEl.textContent = '中奖区';
          nameDisplayEl.classList.remove('paused');
          nameDisplayEl.style.color = '#999';
        }
      }
    };
  });
}

function exportWinners() {
  let csv = '\uFEFF奖项,姓名\n';
  prizeRounds.forEach((prize, idx) => {
    roundWinners[idx].forEach(name => {
      csv += `${prize.name},${name}\n`;
    });
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '中奖名单.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function updateButtonText() {
  pauseBtn.textContent = '暂停';
}

// 奖品配置相关函数
// 解析奖品名称，分离标识和名称
function parsePrizeName(fullName) {
  // 尝试按空格分割，第一部分作为标识，剩余部分作为名称
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1) {
    return {
      prefix: parts[0],
      name: parts.slice(1).join(' ')
    };
  }
  // 如果没有空格，尝试匹配"奖品1"、"一等奖"等格式
  const match = fullName.match(/^(奖品\d+|一等奖|二等奖|三等奖|特等奖|.*奖)/);
  if (match) {
    return {
      prefix: match[1],
      name: fullName.substring(match[1].length).trim() || '奖品'
    };
  }
  // 默认情况
  return {
    prefix: '奖品',
    name: fullName || '奖品'
  };
}

function renderPrizeConfig() {
  prizeConfigList.innerHTML = '';
  prizeRounds.forEach((prize, index) => {
    const parsed = parsePrizeName(prize.name);
    const prizeItem = document.createElement('div');
    prizeItem.className = 'prize-config-item';
    prizeItem.innerHTML = `
      <div class="prize-config-header">
        <span class="prize-config-number">序号 ${index + 1}</span>
        <button class="remove-prize-btn" data-index="${index}">删除</button>
      </div>
      <div class="prize-config-fields">
        <div class="config-field">
          <label>奖品标识（如：奖品1、一等奖、特等奖等）：</label>
          <input type="text" class="prize-prefix-input" value="${parsed.prefix}" data-index="${index}" placeholder="例如：奖品1 或 一等奖">
        </div>
        <div class="config-field">
          <label>奖品名称（如：纯棉文化衫、iPhone15等）：</label>
          <input type="text" class="prize-name-input" value="${parsed.name}" data-index="${index}" placeholder="例如：纯棉文化衫">
        </div>
        <div class="config-field">
          <label>奖品图片URL：</label>
          <input type="text" class="prize-img-input" value="${prize.img}" data-index="${index}" placeholder="https://example.com/image.jpg">
        </div>
        <div class="config-field">
          <label>奖品数量：</label>
          <input type="number" class="prize-count-input" value="${prize.count}" data-index="${index}" min="1" placeholder="5">
        </div>
        <div class="config-field">
          <label>图片预览：</label>
          <img src="${prize.img}" alt="预览" class="prize-preview-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3E无图片%3C/text%3E%3C/svg%3E'">
        </div>
      </div>
    `;
    prizeConfigList.appendChild(prizeItem);
  });
  
  // 绑定输入框事件，实时更新预览
  prizeConfigList.querySelectorAll('.prize-img-input').forEach(input => {
    input.addEventListener('input', function() {
      const index = parseInt(this.dataset.index);
      const previewImg = this.closest('.prize-config-item').querySelector('.prize-preview-img');
      previewImg.src = this.value || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23ddd\' width=\'100\' height=\'100\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3E无图片%3C/text%3E%3C/svg%3E';
    });
  });
  
  // 绑定删除按钮事件
  prizeConfigList.querySelectorAll('.remove-prize-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      if (prizeRounds.length <= 1) {
        alert('至少需要保留一个奖品！');
        return;
      }
      if (confirm(`确定要删除"${prizeRounds[index].name}"吗？`)) {
        prizeRounds.splice(index, 1);
        renderPrizeConfig();
      }
    });
  });
  
  // 更新奖品完整名称的函数
  function updatePrizeFullName(index) {
    const prefixInput = prizeConfigList.querySelector(`.prize-prefix-input[data-index="${index}"]`);
    const nameInput = prizeConfigList.querySelector(`.prize-name-input[data-index="${index}"]`);
    if (prefixInput && nameInput) {
      const prefix = prefixInput.value.trim();
      const name = nameInput.value.trim();
      prizeRounds[index].name = prefix && name ? `${prefix} ${name}` : (prefix || name || '奖品');
    }
  }
  
  // 绑定前缀输入框变化事件
  prizeConfigList.querySelectorAll('.prize-prefix-input').forEach(input => {
    input.addEventListener('input', function() {
      const index = parseInt(this.dataset.index);
      updatePrizeFullName(index);
    });
  });
  
  // 绑定名称输入框变化事件
  prizeConfigList.querySelectorAll('.prize-name-input').forEach(input => {
    input.addEventListener('input', function() {
      const index = parseInt(this.dataset.index);
      updatePrizeFullName(index);
    });
  });
  
  prizeConfigList.querySelectorAll('.prize-img-input').forEach(input => {
    input.addEventListener('input', function() {
      const index = parseInt(this.dataset.index);
      prizeRounds[index].img = this.value;
    });
  });
  
  prizeConfigList.querySelectorAll('.prize-count-input').forEach(input => {
    input.addEventListener('input', function() {
      const index = parseInt(this.dataset.index);
      const count = parseInt(this.value) || 1;
      prizeRounds[index].count = Math.max(1, count);
      this.value = prizeRounds[index].count;
    });
  });
}

function addPrizeItem() {
  prizeRounds.push({
    name: `奖品${prizeRounds.length + 1} 新奖品`,
    count: 1,
    img: ''
  });
  renderPrizeConfig();
  // 滚动到新添加的奖品项
  setTimeout(() => {
    const lastItem = prizeConfigList.lastElementChild;
    if (lastItem) {
      lastItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 100);
}

function openConfigModal() {
  // 重新加载配置（以防外部修改）
  renderPrizeConfig();
  configModal.classList.add('show');
}

function closeConfigModal() {
  configModal.classList.remove('show');
}

function saveConfigAndUpdate() {
  // 先更新所有奖品的完整名称
  for (let i = 0; i < prizeRounds.length; i++) {
    const prefixInput = prizeConfigList.querySelector(`.prize-prefix-input[data-index="${i}"]`);
    const nameInput = prizeConfigList.querySelector(`.prize-name-input[data-index="${i}"]`);
    if (prefixInput && nameInput) {
      const prefix = prefixInput.value.trim();
      const name = nameInput.value.trim();
      if (!prefix && !name) {
        alert(`第${i + 1}个奖品的标识和名称不能都为空！`);
        return;
      }
      prizeRounds[i].name = prefix && name ? `${prefix} ${name}` : (prefix || name || '奖品');
    }
  }
  
  // 验证配置
  for (let i = 0; i < prizeRounds.length; i++) {
    const prize = prizeRounds[i];
    if (!prize.name || prize.name.trim() === '') {
      alert(`第${i + 1}个奖品的名称不能为空！`);
      return;
    }
    if (!prize.count || prize.count < 1) {
      alert(`第${i + 1}个奖品的数量必须大于0！`);
      return;
    }
  }
  
  // 保存配置
  savePrizeConfig();
  
  // 重置当前轮次
  if (currentRound >= prizeRounds.length) {
    currentRound = 0;
  }
  
  // 更新界面
  updatePrizeImage();
  renderPrizeRoundsBar();
  updateResultList();
  
  // 重置显示
  resetNameDisplay();
  const nameDisplayEl = document.getElementById('nameDisplay');
  if (nameDisplayEl) {
    nameDisplayEl.textContent = '中奖区';
    nameDisplayEl.classList.remove('paused');
    nameDisplayEl.style.color = '#999';
  }
  
  closeConfigModal();
  alert('奖品配置已保存！');
}

// 修改init函数，初始化奖品图片和轮次按钮
function init() {
  loadPrizeConfig(); // 先加载奖品配置
  loadNames();
  loadResults(); // 再加载结果（依赖prizeRounds）
  loadMode();
  loadBackground(); // 加载背景配置
  updateResultList();
  
  // 初始化名字显示
  resetNameDisplay();
  const nameDisplayEl = document.getElementById('nameDisplay');
  if (nameDisplayEl) {
    nameDisplayEl.textContent = '中奖区';
    nameDisplayEl.classList.remove('paused');
    nameDisplayEl.style.color = '#999';
  }
  
  updatePrizeImage();
  renderPrizeRoundsBar();
  
  // 初始化点击计数器
  updateClickCounter();
  
  // 添加点击事件监听器
  document.addEventListener('click', incrementClickCount);
  
  // 绑定模式切换事件
  modeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        // 如果正在运行，先停止
        if (running) {
          clearInterval(timer);
          running = false;
        }
        if (batchRunning) {
          stopBatchDraw();
        }
        drawMode = this.value;
        saveMode();
        updateButtonText();
        
        // 重置显示
        resetNameDisplay();
        const nameDisplayEl = document.getElementById('nameDisplay');
        if (nameDisplayEl) {
          nameDisplayEl.textContent = '中奖区';
          nameDisplayEl.classList.remove('paused');
          nameDisplayEl.style.color = '#999';
        }
      }
    });
  });
}

startBtn.onclick = startRoll;
pauseBtn.onclick = pauseRoll;
editBtn.onclick = openEditModal;
configBtn.onclick = openConfigModal;
closeModalBtn.onclick = closeEditModal;
closeConfigBtn.onclick = closeConfigModal;
saveNamesBtn.onclick = saveEditedNames;
saveConfigBtn.onclick = saveConfigAndUpdate;
addPrizeBtn.onclick = addPrizeItem;
exportBtn.onclick = exportWinners;

// 背景配置相关函数
function openBackgroundModal() {
  // 加载当前背景配置
  const currentBg = localStorage.getItem(BACKGROUND_KEY) || defaultBackground;
  if (backgroundUrlInput) {
    backgroundUrlInput.value = currentBg;
  }
  if (backgroundPreviewImg) {
    backgroundPreviewImg.src = currentBg;
  }
  
  // 绑定实时预览事件
  if (backgroundUrlInput) {
    backgroundUrlInput.oninput = function() {
      const url = this.value.trim();
      if (backgroundPreviewImg) {
        if (url) {
          backgroundPreviewImg.src = url;
        } else {
          backgroundPreviewImg.src = defaultBackground;
        }
      }
    };
  }
  
  // 绑定重置按钮事件
  if (resetBackgroundBtn) {
    resetBackgroundBtn.onclick = function() {
      if (backgroundUrlInput) {
        backgroundUrlInput.value = defaultBackground;
      }
      if (backgroundPreviewImg) {
        backgroundPreviewImg.src = defaultBackground;
      }
    };
  }
  
  backgroundModal.classList.add('show');
}

function closeBackgroundModal() {
  backgroundModal.classList.remove('show');
}

function saveBackgroundConfig() {
  if (!backgroundUrlInput) {
    alert('无法获取背景配置输入框！');
    return;
  }
  
  const bgUrl = backgroundUrlInput.value.trim();
  if (bgUrl) {
    // 验证URL格式
    try {
      new URL(bgUrl);
      saveBackground(bgUrl);
      closeBackgroundModal();
      alert('背景配置已保存！');
    } catch (e) {
      alert('背景图片URL格式不正确，请输入有效的URL地址！');
      return;
    }
  } else {
    saveBackground(defaultBackground);
    closeBackgroundModal();
    alert('背景已恢复为默认！');
  }
}

// 点击弹窗外关闭弹窗
editModal.onclick = function(e) {
  if (e.target === editModal) closeEditModal();
};
configModal.onclick = function(e) {
  if (e.target === configModal) closeConfigModal();
};
backgroundModal.onclick = function(e) {
  if (e.target === backgroundModal) closeBackgroundModal();
};

// 绑定背景配置按钮事件
if (backgroundBtn) {
  backgroundBtn.onclick = openBackgroundModal;
}
if (saveBackgroundBtn) {
  saveBackgroundBtn.onclick = saveBackgroundConfig;
}
if (closeBackgroundBtn) {
  closeBackgroundBtn.onclick = closeBackgroundModal;
}

window.onload = init;

// 移除N键切换 