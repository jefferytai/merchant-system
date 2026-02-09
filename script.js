const STORAGE_KEY = 'merchantData';
const USER_PROFILE_KEY = 'userProfile';
let userProfile = null;

let cityInput;
let categoryInput;
let searchInput;
let searchBtn;
let searchAgainBtn;
let saveBtn;
let results;
let merchantList;
let merchantCount;
let emailSection;
let copyBtn;
let closeBtn;
let clearAllBtn;
let searchProgressContainer;
let searchProgressBar;
let searchProgressText;
let emailProgressContainer;
let emailProgressBar;
let emailProgressText;

let currentEmail = '';
let currentMerchantEmail = '';
let searchProgressInterval = null;
let emailProgressInterval = null;
let currentSearchMode = 'balanced';

let userNameInput;
let userTitleInput;
let userEmailInput;
let userPhoneInput;
let companyNameInput;
let companyBusinessInput;
let companyWebsiteInput;
let companyAddressInput;

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
  const className = isValid ? '' : 'invalid-link';
  const displayText = isValid ? text : `${url} (invalid)`;

  const href = url.startsWith('http') ? url : 'https://' + url;

  return `<a href="${href}" target="_blank">${displayText}</a>`;
}



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
    cityInput = document.getElementById('cityInput');
    categoryInput = document.getElementById('categoryInput');
    searchInput = document.getElementById('searchInput');
    searchBtn = document.getElementById('searchBtn');
    searchAgainBtn = document.getElementById('searchAgainBtn');
    saveBtn = document.getElementById('saveBtn');
    results = document.getElementById('results');
    merchantList = document.getElementById('merchantList');
    merchantCount = document.getElementById('merchantCount');
    emailSection = document.getElementById('emailOverlay');
    copyBtn = document.getElementById('copyBtn');
    closeBtn = document.getElementById('closeBtn');
    clearAllBtn = document.getElementById('clearAllBtn');
    searchProgressContainer = document.getElementById('searchProgressContainer');
    searchProgressBar = document.getElementById('searchProgressBar');
    searchProgressText = document.getElementById('searchProgressText');
    emailProgressContainer = document.getElementById('emailProgressContainer');
    emailProgressBar = document.getElementById('emailProgressBar');
    emailProgressText = document.getElementById('emailProgressText');

    // 商户添加弹窗元素
    const addMerchantBtn = document.getElementById('addMerchantBtn');
    const addMerchantOverlay = document.getElementById('addMerchantOverlay');
    const cancelAddMerchantBtn = document.getElementById('cancelAddMerchantBtn');
    const submitAddMerchantBtn = document.getElementById('submitAddMerchantBtn');

    // 用户资料弹窗元素
    const myProfileBtn = document.getElementById('myProfileBtn');
    const profileOverlay = document.getElementById('profileOverlay');
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    userNameInput = document.getElementById('userName');
    userTitleInput = document.getElementById('userTitle');
    userEmailInput = document.getElementById('userEmail');
    userPhoneInput = document.getElementById('userPhone');
    companyNameInput = document.getElementById('companyName');
    companyBusinessInput = document.getElementById('companyBusiness');
    companyWebsiteInput = document.getElementById('companyWebsite');
    companyAddressInput = document.getElementById('companyAddress');

    // Excel 导入弹窗元素
    const importExcelBtn = document.getElementById('importExcelBtn');
    const importExcelOverlay = document.getElementById('importExcelOverlay');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    const importBtn = document.getElementById('importBtn');
    const excelFileInput = document.getElementById('excelFileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const uploadArea = document.getElementById('uploadArea');
    const fileList = document.getElementById('fileList');
    const fileListItems = document.getElementById('fileListItems');
    const clearFileListBtn = document.getElementById('clearFileListBtn');
    const importProgress = document.getElementById('importProgress');
    const importProgressBar = document.getElementById('importProgressBar');
    const importProgressText = document.getElementById('importProgressText');

    searchBtn.addEventListener('click', () => handleSearch(false));
    searchAgainBtn.addEventListener('click', () => handleSearch(true));
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

    // 添加商户按钮
    addMerchantBtn.addEventListener('click', openAddMerchantModal);

    // 取消添加商户
    cancelAddMerchantBtn.addEventListener('click', closeAddMerchantModal);

    // 提交添加商户
    submitAddMerchantBtn.addEventListener('click', handleAddMerchant);

    // 我的资料按钮
    myProfileBtn.addEventListener('click', openProfileModal);

    // 取消保存资料
    cancelProfileBtn.addEventListener('click', closeProfileModal);

    // 保存资料
    saveProfileBtn.addEventListener('click', handleSaveProfile);

    // 导入 Excel 按钮
    importExcelBtn.addEventListener('click', openImportModal);

    // 取消导入
    cancelImportBtn.addEventListener('click', closeImportModal);

    // 选择文件按钮
    selectFileBtn.addEventListener('click', () => {
        excelFileInput.click();
    });

    // 文件选择变化
    excelFileInput.addEventListener('change', handleFileSelect);

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.name.match(/\.(xlsx|xls)$/)
        );
        if (files.length > 0) {
            handleFiles(files);
        }
    });

    // 清空文件列表
    clearFileListBtn.addEventListener('click', clearFileList);

    // 开始导入
    importBtn.addEventListener('click', handleImport);

    // 点击遮罩层关闭商户添加弹窗
    addMerchantOverlay.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeAddMerchantModal();
        }
    });

    // 点击遮罩层关闭资料弹窗
    profileOverlay.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeProfileModal();
        }
    });

    // 统一ESC键监听器（优先级：资料 > 添加商户 > 邮件）
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!profileOverlay.classList.contains('hidden')) {
                closeProfileModal();
            } else if (!addMerchantOverlay.classList.contains('hidden')) {
                closeAddMerchantModal();
            } else if (!emailOverlay.classList.contains('hidden')) {
                closeEmailModal();
            }
        }
    });

    // 点击遮罩层关闭邮件弹窗
    document.getElementById('emailOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeEmailModal();
        }
    });

    // 邮件正文输入更新
    document.getElementById('emailBody').addEventListener('input', updateCurrentEmail);

    // 复制邮件按钮
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

    // 关闭邮件弹窗按钮
    closeBtn.addEventListener('click', closeEmailModal);

    // 加载用户资料
    userProfile = loadUserProfile();

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

async function handleSearch(forceGemini = false) {
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
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({ city, category, keyword, mode, forceGemini })
        });

        const data = await response.json();

        stopSearchProgress();

        if (data.merchants && data.merchants.length > 0) {
            const { data: allData, added } = addMerchants(data.merchants);
            renderMerchants(allData);
            results.classList.remove('hidden');

            // 根据数据来源显示不同的提示
            if (data.source === 'md') {
                alert(`搜索完成！从数据库找到 ${data.merchants.length} 个商户`);
            } else if (data.source === 'gemini') {
                alert(`AI搜索完成！新增 ${added} 个商户`);
            } else {
                alert(`搜索完成！新增 ${added} 个商户`);
            }
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
        const source = merchant['来源'] || 'AI搜索';
        const officialLink = merchant['官方链接'] || 'N/A';
        const founderLinkedin = merchant['创始人 LinkedIn'] || 'N/A';
        const companyLinkedin = merchant['公司 LinkedIn'] || 'N/A';
        const hidden = merchant['hidden'] || false;

        const statusBadge = contacted
            ? '<span class="status-badge status-contacted">✓</span>'
            : '<span class="status-badge status-uncontacted">○</span>';

        const verificationBadge = (() => {
            if (source === 'Excel数据') {
                return '<span class="verification-badge verification-badge-excel" title="Excel数据">📊 Excel数据</span>';
            } else if (source === 'AI搜索') {
                return '<span class="verification-badge verification-badge-ai" title="AI搜索">🤖 AI搜索</span>';
            } else if (source === '自填写') {
                return '<span class="verification-badge verification-badge-self-added" title="自填写">📝 自填写</span>';
            } else if (verificationStatus === '已验证') {
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

        // 如果商户被隐藏，只显示基本信息
        if (hidden) {
            return `
                <div class="merchant-card hidden" data-index="${index}">
                    <div class="card-header">
                        <div class="card-header-left">
                            <button class="status-badge ${contacted ? 'status-contacted' : 'status-uncontacted'}"
                                    onclick="toggleMerchantContacted(${index})"
                                    title="${contacted ? '已联系' : '未联系'}">
                                ${contacted ? '✓' : '○'}
                            </button>
                            <div class="merchant-name">${merchant['商户名称'] || 'N/A'} (已隐藏)</div>
                            ${verificationBadge}
                        </div>
                        <div class="card-actions">
                            <button class="action-icon-btn" onclick="toggleMerchantHidden(${index})" title="显示详情">
                                👁️
                            </button>
                            <button class="action-icon-btn" onclick="deleteMerchantRow(${index})" title="删除商户">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // 显示完整信息
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
                        <button class="action-icon-btn" onclick="toggleMerchantHidden(${index})" title="隐藏商户">
                            👁️
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

window.toggleMerchantHidden = function(index) {
    const data = loadMerchantData();
    data[index].hidden = !data[index].hidden;
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
    if (!(await checkUserProfile())) {
        return;
    }

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
            body: JSON.stringify({ merchant, userProfile })
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

function updateCurrentEmail() {
    const subject = document.getElementById('emailSubject').textContent || '';
    const salutation = document.getElementById('emailSalutation').textContent || '';
    const body = document.getElementById('emailBody').value || '';
    const closing = document.getElementById('emailClosing').textContent || '';
    const signature = document.getElementById('emailSignature').textContent || '';

    currentEmail = `主题：${subject}\n\n称呼：${salutation}\n收件人：${currentMerchantEmail}\n\n正文：\n${body}\n\n结尾：${closing}\n签名：${signature}`;
}

// 商户添加相关函数
function openAddMerchantModal() {
    const overlay = document.getElementById('addMerchantOverlay');
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('visible'), 10);

    // 清空表单
    document.getElementById('merchantName').value = '';
    document.getElementById('merchantAddress').value = '';
    document.getElementById('merchantPhone').value = '';
    document.getElementById('merchantEmail').value = '';
    document.getElementById('merchantWebsite').value = '';
    document.getElementById('merchantFounder').value = '';
    document.getElementById('merchantHighlights').value = '';
    document.getElementById('merchantFounderLinkedin').value = '';
    document.getElementById('merchantCompanyLinkedin').value = '';
}

function closeAddMerchantModal() {
    const overlay = document.getElementById('addMerchantOverlay');
    overlay.classList.remove('visible');
    setTimeout(() => overlay.classList.add('hidden'), 250);
}

function validateMerchantForm() {
    const name = document.getElementById('merchantName').value.trim();
    const address = document.getElementById('merchantAddress').value.trim();
    const email = document.getElementById('merchantEmail').value.trim();

    if (!name) {
        alert('请输入商户名称');
        return false;
    }

    if (!address) {
        alert('请输入验证地址');
        return false;
    }

    if (!email) {
        alert('请输入电子邮箱');
        return false;
    }

    if (!validateEmail(email)) {
        alert('请输入有效的电子邮箱地址');
        return false;
    }

    return true;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function createMerchantObject() {
    return {
        '商户名称': document.getElementById('merchantName').value.trim(),
        '验证地址': document.getElementById('merchantAddress').value.trim(),
        '联系电话': document.getElementById('merchantPhone').value.trim() || 'N/A',
        '电子邮箱': document.getElementById('merchantEmail').value.trim(),
        '官方链接': document.getElementById('merchantWebsite').value.trim() || 'N/A',
        '创始人': document.getElementById('merchantFounder').value.trim() || 'N/A',
        '业务亮点': document.getElementById('merchantHighlights').value.trim() || 'N/A',
        '创始人 LinkedIn': document.getElementById('merchantFounderLinkedin').value.trim() || 'N/A',
        '公司 LinkedIn': document.getElementById('merchantCompanyLinkedin').value.trim() || 'N/A',
        '已联系': false,
        '创建时间': new Date().toISOString(),
        '来源': '自填写',
        '验证状态': '自填写'
    };
}

function handleAddMerchant() {
    if (!validateMerchantForm()) {
        return;
    }

    const newMerchant = createMerchantObject();
    const { data: allData, added } = addMerchants([newMerchant]);

    if (added > 0) {
        renderMerchants(allData);
        closeAddMerchantModal();
        alert('商户添加成功！');
    } else {
        alert('该商户已存在，无需重复添加');
    }
}

// 用户资料管理函数
function loadUserProfile() {
    // 先尝试从 localStorage 加载（兼容旧版本）
    const localData = localStorage.getItem(USER_PROFILE_KEY);
    if (localData) {
        return JSON.parse(localData);
    }

    // 如果 localStorage 没有，尝试从后端加载
    return fetch('/api/get-profile')
        .then(response => response.json())
        .then(data => {
            if (data.profile) {
                // 同时保存到 localStorage
                localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(data.profile));
                return data.profile;
            }
            return null;
        })
        .catch(error => {
            console.error('从后端加载用户资料失败:', error);
            return null;
        });
}

function saveUserProfile(profile) {
    userProfile = profile;
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}
 
async function openProfileModal() {
    const profile = await loadUserProfile();

    if (profile) {
        userNameInput.value = profile['姓名'] || '';
        userTitleInput.value = profile['职位'] || '';
        userEmailInput.value = profile['邮箱'] || '';
        userPhoneInput.value = profile['电话'] || '';
        companyNameInput.value = profile['公司名称'] || '';
        companyBusinessInput.value = profile['公司业务'] || '';
        companyWebsiteInput.value = profile['公司网址'] || '';
        companyAddressInput.value = profile['公司地址'] || '';
    }

    profileOverlay.classList.remove('hidden');
    setTimeout(() => profileOverlay.classList.add('visible'), 10);
}

function closeProfileModal() {
    profileOverlay.classList.remove('visible');
    setTimeout(() => profileOverlay.classList.add('hidden'), 250);
}

function validateProfileForm() {
    const name = userNameInput.value.trim();
    const title = userTitleInput.value.trim();
    const email = userEmailInput.value.trim();
    const company = companyNameInput.value.trim();

    if (!name) {
        alert('请输入您的姓名');
        return false;
    }

    if (!title) {
        alert('请输入您的职位');
        return false;
    }

    if (!email) {
        alert('请输入您的邮箱');
        return false;
    }

    if (!validateEmail(email)) {
        alert('请输入有效的邮箱地址');
        return false;
    }

    if (!company) {
        alert('请输入公司名称');
        return false;
    }

    return true;
}

function handleSaveProfile() {
    console.log('=== handleSaveProfile 开始执行 ===');
    
    // 检查DOM元素是否存在
    if (!userNameInput) {
        console.error('userNameInput 为 null');
        alert('系统错误：无法找到输入框');
        return;
    }
    
    console.log('DOM元素检查通过');
    console.log('姓名:', userNameInput.value);
    console.log('职位:', userTitleInput.value);
    console.log('邮箱:', userEmailInput.value);
    console.log('公司:', companyNameInput.value);
    
    if (!validateProfileForm()) {
        console.log('表单验证失败');
        return;
    }
    
    console.log('表单验证通过，开始构建profile对象');
    
    const profile = {
        '姓名': userNameInput.value.trim(),
        '职位': userTitleInput.value.trim(),
        '邮箱': userEmailInput.value.trim(),
        '电话': userPhoneInput.value.trim() || 'N/A',
        '公司名称': companyNameInput.value.trim(),
        '公司业务': companyBusinessInput.value.trim() || 'N/A',
        '公司网址': companyWebsiteInput.value.trim() || 'N/A',
        '公司地址': companyAddressInput.value.trim() || 'N/A',
        '更新时间': new Date().toISOString()
    };
    
    console.log('构建的profile对象:', profile);
    
    try {
        console.log('开始保存到localStorage...');
        saveUserProfile(profile);
        console.log('保存成功！');

        // 同时保存到后端
        console.log('开始保存到后端...');
        fetch('/api/save-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('后端保存成功！');
            } else {
                console.error('后端保存失败:', data.error);
            }
        })
        .catch(error => {
            console.error('后端保存错误:', error);
        });

        // 验证保存
        const saved = localStorage.getItem(USER_PROFILE_KEY);
        console.log('验证保存的数据:', saved);

        closeProfileModal();
        console.log('弹窗已关闭');
        alert('资料保存成功！');
        console.log('=== handleSaveProfile 执行完成 ===');
    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败：' + error.message);
    }
}

async function checkUserProfile() {
    console.log('=== checkUserProfile 开始 ===');
    userProfile = await loadUserProfile();
    console.log('加载的userProfile:', userProfile);

    if (!userProfile) {
        console.log('userProfile为空，使用降级方案（允许生成邮件）');
        // 不再阻止邮件生成，使用空userProfile对象
        userProfile = {
            '姓名': '',
            '职位': '',
            '邮箱': '',
            '电话': 'N/A',
            '公司名称': '',
            '公司业务': '',
            '公司网址': 'N/A',
            '公司地址': 'N/A',
            '更新时间': new Date().toISOString()
        };
        console.log('使用空userProfile对象，可以生成邮件');
    }

    console.log('checkUserProfile 完成，userProfile已设置');
    return true;
}

// Excel 导入相关函数
let selectedFiles = [];

function openImportModal() {
    importExcelOverlay.classList.remove('hidden');
    setTimeout(() => importExcelOverlay.classList.add('visible'), 10);
    clearFileList();
}

function closeImportModal() {
    importExcelOverlay.classList.remove('visible');
    setTimeout(() => importExcelOverlay.classList.add('hidden'), 250);
    clearFileList();
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

function handleFiles(files) {
    selectedFiles = [...selectedFiles, ...files];
    renderFileList();

    // 更新导入按钮状态
    importBtn.disabled = selectedFiles.length === 0;
}

function renderFileList() {
    if (selectedFiles.length === 0) {
        fileList.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        return;
    }

    fileList.classList.remove('hidden');
    uploadArea.classList.add('hidden');

    fileListItems.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <div class="file-info">
                <span class="file-icon">📊</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="removeFile(${index})">✕</button>
        </div>
    `).join('');
}

window.removeFile = function(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
    importBtn.disabled = selectedFiles.length === 0;
}

function clearFileList() {
    selectedFiles = [];
    excelFileInput.value = '';
    renderFileList();
    importBtn.disabled = true;
    importProgress.classList.add('hidden');
}

async function handleImport() {
    if (selectedFiles.length === 0) {
        alert('请先选择要导入的 Excel 文件');
        return;
    }

    importBtn.disabled = true;
    cancelImportBtn.disabled = true;
    importProgress.classList.remove('hidden');

    let totalMerchants = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = Math.round(((i + 1) / selectedFiles.length) * 100);
        importProgressBar.style.width = progress + '%';
        importProgressText.textContent = `正在导入 ${i + 1}/${selectedFiles.length}: ${file.name}`;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/import-excel', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                totalMerchants = [...totalMerchants, ...data.merchants];
                successCount += data.count;
            } else {
                failCount++;
                console.error(`导入失败: ${file.name}`, data.error);
            }
        } catch (error) {
            failCount++;
            console.error(`导入错误: ${file.name}`, error);
        }
    }

    importProgressBar.style.width = '100%';
    importProgressText.textContent = '导入完成！';

    // 合并到现有数据
    if (totalMerchants.length > 0) {
        const { data: allData, added } = addMerchants(totalMerchants);
        renderMerchants(allData);
        results.classList.remove('hidden');

        setTimeout(() => {
            alert(`导入完成！\n\n成功导入 ${successCount} 个文件\n新增 ${added} 个商户\n失败 ${failCount} 个文件`);
            closeImportModal();
        }, 500);
    } else {
        setTimeout(() => {
            alert('导入失败，请检查文件格式');
            importBtn.disabled = false;
            cancelImportBtn.disabled = false;
        }, 500);
    }
}

