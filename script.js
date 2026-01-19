const cityInput = document.getElementById('cityInput');
const categoryInput = document.getElementById('categoryInput');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchAgainBtn = document.getElementById('searchAgainBtn');
const saveBtn = document.getElementById('saveBtn');
const results = document.getElementById('results');
const merchantList = document.getElementById('merchantList');
const merchantCount = document.getElementById('merchantCount');
const emailSection = document.getElementById('emailOverlay');
const copyBtn = document.getElementById('copyBtn');
const closeBtn = document.getElementById('closeBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const searchProgressContainer = document.getElementById('searchProgressContainer');
const searchProgressBar = document.getElementById('searchProgressBar');
const searchProgressText = document.getElementById('searchProgressText');
const emailProgressContainer = document.getElementById('emailProgressContainer');
const emailProgressBar = document.getElementById('emailProgressBar');
const emailProgressText = document.getElementById('emailProgressText');

const STORAGE_KEY = 'merchantData';

let currentEmail = '';
let currentMerchantEmail = '';
let searchProgressInterval = null;
let emailProgressInterval = null;
let currentSearchMode = 'balanced';

function saveMerchantData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存数据失败:', e);
    alert('存储空间不足，请清理部分数据');
  }
}

function loadMerchantData() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function addMerchants(newMerchants) {
  const existingData = loadMerchantData();
  const existingNames = new Set(existingData.map(m => m['商户名称']));
  
  const uniqueNewMerchants = newMerchants.filter(m => !existingNames.has(m['商户名称']));
  
  const mergedData = [...existingData, ...uniqueNewMerchants];
  saveMerchantData(mergedData);
  return { data: mergedData, added: uniqueNewMerchants.length };
}

function deleteMerchant(index) {
  const data = loadMerchantData();
  data.splice(index, 1);
  saveMerchantData(data);
  return data;
}

function toggleContacted(index) {
  const data = loadMerchantData();
  data[index].已联系 = !data[index].已联系;
  saveMerchantData(data);
  return data;
}

function clearAllMerchants() {
  localStorage.removeItem(STORAGE_KEY);
  return [];
}

function exportToJSON() {
  const data = loadMerchantData();

  if (data.length === 0) {
    alert('暂无数据可导出');
    return;
  }

  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `商户数据_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`已成功导出 ${data.length} 条商户数据`);
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败，请重试');
  }
}

function isValidLinkedInUrl(url) {
  if (!url || url === 'N/A') return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('linkedin.com/in/') || lowerUrl.includes('linkedin.com/company/');
}

function renderLinkedInUrl(url, text) {
  if (!url || url === 'N/A') return 'N/A';

  const isValid = isValidLinkedInUrl(url);
  const warningIcon = isValid ? '' : ' ⚠️';
  const className = isValid ? '' : 'invalid-link';
  const displayText = text === '查看' ? `查看${warningIcon}` : `${url}${warningIcon}`;

  const href = url.startsWith('http') ? url : 'https://' + url;
  return `<a href="${href}" target="_blank" class="${className}" title="${isValid ? '点击访问' : '链接可能无效，请验证'}">${displayText}</a>`;
}

searchBtn.addEventListener('click', handleSearch);
searchAgainBtn.addEventListener('click', handleSearch);
saveBtn.addEventListener('click', exportToJSON);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
categoryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

clearAllBtn.addEventListener('click', () => {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        const data = clearAllMerchants();
        renderMerchants(data);
    }
});

// 搜索模式选择器
document.querySelectorAll('input[name="searchMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const mode = e.target.value;
        currentSearchMode = mode;
        
        // 更新选中状态的UI
        document.querySelectorAll('.mode-option').forEach(option => {
            option.classList.remove('selected');
        });
        e.target.closest('.mode-option').classList.add('selected');
        
        // 显示模式说明
        showModeDescription(mode);
    });
});

function showModeDescription(mode) {
    let message = '';
    
    switch(mode) {
        case 'strict':
            message = '严格验证模式：返回5-15个经过严格验证的商户，所有信息都已确认准确可靠。适合需要高质量数据的场景。';
            break;
        case 'balanced':
            message = '平衡模式：返回10-30个商户，部分已验证，部分标注为"待验证"。在质量和数量之间找到平衡。适合大多数使用场景。';
            break;
        case 'fast':
            message = '快速搜索模式：返回50-100个商户，全部标注为"待验证"。提供大量候选商户，适合快速筛选和批量处理。';
            break;
    }
    
    alert(message);
}

window.addEventListener('DOMContentLoaded', () => {
    const data = loadMerchantData();
    if (data.length > 0) {
        renderMerchants(data);
        results.classList.remove('hidden');
    }
});

function startSearchProgress() {
    searchProgressContainer.classList.remove('hidden');
    let progress = 10;
    searchProgressBar.style.width = progress + '%';
    searchProgressText.textContent = progress + '%';
    
    searchProgressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.floor(Math.random() * 20) + 10;
            if (progress > 90) progress = 90;
            searchProgressBar.style.width = progress + '%';
            searchProgressText.textContent = progress + '%';
        }
    }, 1000);
}

function stopSearchProgress() {
    if (searchProgressInterval) {
        clearInterval(searchProgressInterval);
        searchProgressInterval = null;
    }
    searchProgressBar.style.width = '100%';
    searchProgressText.textContent = '100%';
    setTimeout(() => {
        searchProgressContainer.classList.add('hidden');
        searchProgressBar.style.width = '0%';
    }, 500);
}

function startEmailProgress() {
    emailProgressContainer.classList.remove('hidden');
    let progress = 10;
    emailProgressBar.style.width = progress + '%';
    emailProgressText.textContent = progress + '%';
    
    emailProgressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.floor(Math.random() * 25) + 10;
            if (progress > 90) progress = 90;
            emailProgressBar.style.width = progress + '%';
            emailProgressText.textContent = progress + '%';
        }
    }, 1000);
}

function stopEmailProgress() {
    if (emailProgressInterval) {
        clearInterval(emailProgressInterval);
        emailProgressInterval = null;
    }
    emailProgressBar.style.width = '100%';
    emailProgressText.textContent = '100%';
    setTimeout(() => {
        emailProgressContainer.classList.add('hidden');
        emailProgressBar.style.width = '0%';
    }, 500);
}

async function handleSearch() {
    const city = cityInput.value.trim();
    const category = categoryInput.value.trim();
    const keyword = searchInput.value.trim();
    const mode = document.querySelector('input[name="searchMode"]:checked')?.value || 'balanced';

    if (!city && !category && !keyword) {
        alert('请输入城市、商户类型或关键词');
        return;
    }

    results.classList.add('hidden');
    emailSection.classList.remove('visible');
    startSearchProgress();

    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city, category, keyword, mode })
        });

        const data = await response.json();

        stopSearchProgress();

        if (data.merchants && data.merchants.length > 0) {
            const { data: allData, added } = addMerchants(data.merchants);
            renderMerchants(allData);
            results.classList.remove('hidden');
            alert(`搜索完成！新增 ${added} 个商户`);
        } else {
            merchantList.innerHTML = `
                <div class="no-results">
                    <div class="icon">🔍</div>
                    <h3>未找到相关商家</h3>
                    <p>请尝试其他关键词或放宽搜索条件</p>
                </div>
            `;
            results.classList.remove('hidden');
        }
    } catch (error) {
        stopSearchProgress();
        alert('搜索失败，请检查网络连接');
    }
}

function renderMerchants(merchants) {
    merchantCount.textContent = merchants.length;

    if (merchants.length === 0) {
        merchantList.innerHTML = `
            <div class="no-results">
                <div class="icon">📋</div>
                <h3>暂无商户数据</h3>
                <p>请使用上方搜索框查找商户</p>
            </div>
        `;
        return;
    }

    merchantList.innerHTML = merchants.map((merchant, index) => {
        const contacted = merchant['已联系'] || false;
        const verificationStatus = merchant['验证状态'] || '全部待验证';
        const officialLink = merchant['官方链接'] || 'N/A';
        const founderLinkedin = merchant['创始人 LinkedIn'] || 'N/A';
        const companyLinkedin = merchant['公司 LinkedIn'] || 'N/A';

        const statusBadge = contacted 
            ? '<span class="status-badge status-contacted">✓</span>'
            : '<span class="status-badge status-uncontacted">○</span>';

        const verificationBadge = (() => {
            if (verificationStatus === '已验证') {
                return '<span class="verification-badge verification-verified" title="已验证">✓ 已验证</span>';
            } else if (verificationStatus === '部分已验证') {
                return '<span class="verification-badge verification-partial" title="部分已验证">⚠️ 部分已验证</span>';
            } else {
                return '<span class="verification-badge verification-pending" title="待验证">○ 待验证</span>';
            }
        })();

        const officialLinkHtml = officialLink !== 'N/A'
            ? `<a href="${officialLink.startsWith('http') ? officialLink : 'https://' + officialLink}" target="_blank">访问官网</a>`
            : 'N/A';

        return `
            <div class="merchant-card" data-index="${index}">
                <div class="card-header">
                    <div class="card-header-left">
                        <button class="status-badge ${contacted ? 'status-contacted' : 'status-uncontacted'}" 
                                onclick="toggleMerchantContacted(${index})"
                                title="${contacted ? '已联系' : '未联系'}">
                            ${contacted ? '✓' : '○'}
                        </button>
                        <div class="merchant-name">${merchant['商户名称'] || 'N/A'}</div>
                        ${verificationBadge}
                    </div>
                    <div class="card-actions">
                        <button class="action-icon-btn" onclick="generateEmail(${index})" title="生成邮件">
                            ✉️
                        </button>
                        <button class="action-icon-btn" onclick="deleteMerchantRow(${index})" title="删除商户">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">地址</div>
                            <div class="info-value">${merchant['验证地址'] || 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">电话</div>
                            <div class="info-value">${merchant['联系电话'] || 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">创始人</div>
                            <div class="info-value">${merchant['创始人'] || 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">邮箱</div>
                            <div class="info-value">${merchant['电子邮箱'] || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="business-highlight">
                        <div class="info-label">业务亮点</div>
                        <div class="info-value">${merchant['业务亮点'] || 'N/A'}</div>
                    </div>
                </div>
                <button class="toggle-details-btn" onclick="toggleDetails(this)">
                    <span class="label">展开详情</span>
                    <span class="icon">▼</span>
                </button>
                <div class="card-details">
                    <div class="card-details-content">
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">官方链接</div>
                                <div class="info-value">${officialLinkHtml}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">创始人 LinkedIn</div>
                                <div class="info-value">${renderLinkedInUrl(founderLinkedin, '查看')}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">公司 LinkedIn</div>
                                <div class="info-value">${renderLinkedInUrl(companyLinkedin, '查看')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    window.merchantData = merchants;
}

window.toggleMerchantContacted = function(index) {
    const data = loadMerchantData();
    data[index].已联系 = !data[index].已联系;
    saveMerchantData(data);
    renderMerchants(data);
}

window.deleteMerchantRow = function(index) {
    if (confirm('确定要删除这个商户吗？')) {
        const data = deleteMerchant(index);
        renderMerchants(data);
    }
}

window.toggleDetails = function(button) {
    const card = button.closest('.merchant-card');
    const details = card.querySelector('.card-details');
    const label = button.querySelector('.label');
    const icon = button.querySelector('.icon');

    details.classList.toggle('expanded');
    button.classList.toggle('expanded');

    if (details.classList.contains('expanded')) {
        label.textContent = '收起详情';
        icon.style.transform = 'rotate(180deg)';
    } else {
        label.textContent = '展开详情';
        icon.style.transform = 'rotate(0deg)';
    }
}

async function generateEmail(index) {
    const merchant = window.merchantData[index];

    if (!merchant) return;

    // 获取当前卡片的进度条
    const card = document.querySelector(`.merchant-card[data-index="${index}"]`);
    if (!card) return;

    // 检查是否已经有正在生成的邮件
    const existingProgress = document.querySelector('.card-email-progress:not(.hidden)');
    if (existingProgress) {
        alert('请等待当前邮件生成完成');
        return;
    }

    // 在卡片内插入进度条
    const progressHTML = `
        <div class="card-email-progress">
            <div class="progress-label">正在分析商户信息...</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-info">
                <span class="progress-text">0%</span>
                <span class="progress-time">预计 10 秒</span>
            </div>
        </div>
    `;

    // 在卡片内容前插入进度条
    const cardContent = card.querySelector('.card-content');
    cardContent.insertAdjacentHTML('beforebegin', progressHTML);

    const progressContainer = card.querySelector('.card-email-progress');
    const progressBar = progressContainer.querySelector('.progress-fill');
    const progressText = progressContainer.querySelector('.progress-text');
    const progressTime = progressContainer.querySelector('.progress-time');
    const progressLabel = progressContainer.querySelector('.progress-label');

    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 90) {
            progress += Math.floor(Math.random() * 15) + 10;
            if (progress > 90) progress = 90;
            progressBar.style.width = progress + '%';
            progressText.textContent = progress + '%';

            // 计算剩余时间
            const remainingSeconds = Math.ceil((100 - progress) / 10);
            progressTime.textContent = `预计 ${remainingSeconds} 秒`;

            // 更新阶段文字
            if (progress < 30) {
                progressLabel.textContent = '正在分析商户信息...';
            } else if (progress < 60) {
                progressLabel.textContent = '正在起草邮件内容...';
            } else if (progress < 90) {
                progressLabel.textContent = '正在优化表达方式...';
            }
        }
    }, 1000);

    try {
        const response = await fetch('/api/generate-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ merchant })
        });

        const data = await response.json();

        clearInterval(interval);

        // 完成进度
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
        progressLabel.textContent = '邮件生成完成！';
        progressTime.textContent = '';

        // 延迟隐藏进度条并显示弹窗
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            setTimeout(() => progressContainer.remove(), 250);
            if (data.email) {
                showEmail(data.email, merchant['电子邮箱']);
            }
        }, 500);

    } catch (error) {
        clearInterval(interval);
        progressLabel.textContent = '邮件生成失败，请重试';
        progressBar.style.background = 'var(--color-danger)';
        progressTime.textContent = '';
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            setTimeout(() => progressContainer.remove(), 250);
        }, 2000);
    }
}

function showEmail(email, toEmail) {
    document.getElementById('emailSubject').textContent = email.subject || '';
    document.getElementById('emailSalutation').textContent = email.salutation || '';
    document.getElementById('emailTo').textContent = toEmail || 'N/A';
    document.getElementById('emailBody').value = email.body || '';
    document.getElementById('emailClosing').textContent = email.closing || '';
    document.getElementById('emailSignature').textContent = email.signature || '';

    currentMerchantEmail = toEmail || 'N/A';
    updateCurrentEmail();

    // 显示弹窗遮罩层
    const overlay = document.getElementById('emailOverlay');
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('visible'), 10);
}

function closeEmailModal() {
    const overlay = document.getElementById('emailOverlay');
    overlay.classList.remove('visible');
    setTimeout(() => overlay.classList.add('hidden'), 250);
}

// 点击遮罩层关闭
document.getElementById('emailOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closeEmailModal();
    }
});

// ESC 键关闭
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('emailOverlay');
        if (!overlay.classList.contains('hidden')) {
            closeEmailModal();
        }
    }
});

function updateCurrentEmail() {
    const subject = document.getElementById('emailSubject').textContent || '';
    const salutation = document.getElementById('emailSalutation').textContent || '';
    const body = document.getElementById('emailBody').value || '';
    const closing = document.getElementById('emailClosing').textContent || '';
    const signature = document.getElementById('emailSignature').textContent || '';

    currentEmail = `主题：${subject}\n\n称呼：${salutation}\n收件人：${currentMerchantEmail}\n\n正文：\n${body}\n\n结尾：${closing}\n签名：${signature}`;
}

document.getElementById('emailBody').addEventListener('input', updateCurrentEmail);

copyBtn.addEventListener('click', () => {
    updateCurrentEmail();
    if (currentEmail) {
        navigator.clipboard.writeText(currentEmail).then(() => {
            alert('邮件已复制到剪贴板');
        }).catch(() => {
            alert('复制失败，请手动复制');
        });
    }
});

closeBtn.addEventListener('click', closeEmailModal);
