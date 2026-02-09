require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const MDLoader = require('./md-loader');
const LinkedInSearch = require('./linkedin-search');
const prompts = require('./prompts/linkedin-prompt');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const mdLoader = new MDLoader({
  mdDir: path.join(__dirname, 'merchant-md'),
  cacheFile: path.join(__dirname, 'data', 'md-cache.json')
});

let mdData = null;

mdLoader.loadAll().then(data => {
  mdData = data;
  console.log('========================================');
  console.log('MD data loaded');
  console.log(`Total merchants: ${data.merchantCount}`);
  console.log(`Cities: ${data.cityCount}`);
  console.log('========================================');
}).catch(err => {
  console.error('MD data load error:', err.message);
  mdData = null;
});

// 明确配置静态文件路由
app.get('/style.css', (req, res) => {
  res.sendFile(__dirname + '/style.css');
});

app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + '/script.js');
});

// 根路径路由
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

// Initialize LinkedIn search module
const linkedinSearch = new LinkedInSearch({
  serperApiKey: process.env.SERPER_API_KEY
});

app.post('/api/search', async (req, res) => {
  try {
    const { city, category, keyword, mode = 'balanced', forceGemini = false } = req.body;

    console.log('Search request:', { city, category, mode, forceGemini });

    if (!city && !category && !keyword) {
      return res.status(400).json({ error: 'Please enter city, merchant type, or keyword' });
    }

    const startTime = Date.now();

    // Gemini API 搜索（"再搜索"按钮）
    if (forceGemini && model) {
      console.log('Starting Gemini API search');

      try {
        const geminiPrompt = `Search merchant information:

City: ${city || '不限'}
Merchant Type: ${category || '不限'}
Keyword: ${keyword || '无'}

Return a JSON array of merchants (maximum 10) with these fields:
- 商户名称
- 验证地址
- 联系电话
- 电子邮箱
- 官方链接
- 创始人
- 业务亮点
- LinkedIn URL (LinkedIn公司页面地址，if available)
- 创始人 LinkedIn (创始人LinkedIn URL)
- 验证状态: "AI生成"
- 来源: "AI搜索"

For each merchant, try to:
1. Find official website
2. Identify if there is a LinkedIn company page (official company LinkedIn)
3. Identify the founder or key executives
4. Include their LinkedIn profile if publicly available
5. Verify contact information if possible

Return the results in this exact JSON format:
[
  {
    "商户名称": "company name",
    "验证地址": "address",
    "联系电话": "phone",
    "电子邮箱": "email",
    "官方链接": "website",
    "创始人": "founder name",
    "业务亮点": "business description",
    "创始人 LinkedIn": "founder LinkedIn URL or N/A",
    "公司 LinkedIn": "company LinkedIn URL or N/A",
    "验证状态": "AI生成",
    "来源": "AI搜索"
  }
]`;

        const result = await model.generateContent(geminiPrompt);
        const responseText = result.response.text();

        const duration = ((Date.now() - startTime) / 1000).toFixed(3);
        console.log(`Gemini search completed, took ${duration}s`);

        let geminiMerchants = [];
        try {
          // 尝试解析 JSON
          const jsonMatch = responseText.match(/\[[\s]*\{[\s\S]*?\}\s*\]/);
          if (jsonMatch) {
            const jsonText = jsonMatch[0];
            geminiMerchants = JSON.parse(jsonText);
          }
        } catch (e) {
          console.log('Failed to parse JSON from response, will use raw response');
        }

        if (geminiMerchants && geminiMerchants.length > 0) {
          console.log(`Parsed ${geminiMerchants.length} merchants from Gemini`);

          // 增强 LinkedIn 信息
          const enhancedMerchants = await enhanceWithLinkedIn(geminiMerchants);

          const duration = ((Date.now() - startTime) / 1000).toFixed(3);
          console.log(`LinkedIn enhancement completed, total time: ${duration}s`);

          return res.json({
            merchants: enhancedMerchants,
            source: 'gemini',
            geminiRawResponse: responseText,
            geminiUsed: true,
            linkedinEnhanced: true,
            duration: `${duration}s`,
            message: `Found ${enhancedMerchants.length} merchants from Gemini API (with LinkedIn enhancement)`
          });
        }

        return res.json({
          merchants: [],
          source: 'gemini',
          geminiRawResponse: responseText,
          geminiUsed: true,
          duration: `${duration}s`,
          message: 'Results from Gemini API (JSON parsing required)'
        });
      } catch (error) {
        console.error('Gemini API error:', error.message);
        return res.status(500).json({
          error: 'Gemini search failed',
          details: error.message
        });
      }
    }

    // MD文件搜索（"数据库搜索"按钮）
    if (mdData && mdData.allMerchants && mdData.allMerchants.length > 0) {
      console.log(`MD search started: ${mdData.merchantCount} merchants, ${mdData.cityCount} cities`);
      const mdResults = mdLoader.search({ city, category, keyword });
      const duration = ((Date.now() - startTime) / 1000).toFixed(3);

      console.log(`MD search completed: found ${mdResults.length} merchants, took ${duration}s`);

      if (mdResults.length > 0) {
        // 增强 LinkedIn 信息
        const enhancedMerchants = await enhanceWithLinkedIn(mdResults);

        const duration = ((Date.now() - startTime) / 1000).toFixed(3);
        console.log(`LinkedIn enhancement completed, total time: ${duration}s`);

        return res.json({
          merchants: enhancedMerchants,
          source: 'md',
          mdCount: mdResults.length,
          geminiUsed: false,
          linkedinEnhanced: true,
          duration: `${duration}s`,
          message: `Found ${enhancedMerchants.length} merchants from MD files (with LinkedIn enhancement)`
        });
      }
    }

    // 所有搜索都未找到结果
    const duration = ((Date.now() - startTime) / 1000).toFixed(3);
    console.log(`No matching merchants found, took ${duration}s`);

    return res.json({
      merchants: [],
      source: 'none',
      mdCount: 0,
      geminiUsed: false,
      duration: `${duration}s`,
      message: 'No matching merchants found. Try different search criteria or enable Gemini API search.'
    });

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed, please retry', details: error.message });
  }
});

app.post('/api/generate-email', async (req, res) => {
  try {
    const { merchant, userProfile } = req.body;

    // 验证商户信息
    if (!merchant || !merchant['商户名称']) {
      return res.status(400).json({ error: '商户信息不完整' });
    }

    // 验证用户资料（必填字段）
    if (!userProfile || !userProfile['姓名'] || !userProfile['职位'] || !userProfile['邮箱']) {
      return res.status(400).json({
        error: '请先填写您的个人资料',
        message: '请点击右上角"我的资料"按钮填写姓名、职位和邮箱信息'
      });
    }

    console.log('Email generation request:', {
      merchant: merchant['商户名称'],
      user: userProfile['姓名']
    });

    // 构建动态 Prompt（不使用模板）
    const merchantInfo = `
Merchant Info:
- Name: ${merchant['商户名称']}
- Founder: ${merchant['创始人'] || 'N/A'}
- Business: ${merchant['业务亮点'] || 'N/A'}
- Email: ${merchant['电子邮箱'] || 'N/A'}
- Address: ${merchant['验证地址'] || 'N/A'}
- Phone: ${merchant['联系电话'] || 'N/A'}
- Website: ${merchant['官方链接'] || 'N/A'}
`;

    const senderInfo = `
Sender Info:
- Name: ${userProfile['姓名']}
- Title: ${userProfile['职位']}
- Email: ${userProfile['邮箱']}
- Phone: ${userProfile['电话'] || 'N/A'}
- Company: ${userProfile['公司名称'] || 'N/A'}
- Business: ${userProfile['公司业务'] || 'N/A'}
- Website: ${userProfile['公司网址'] || 'N/A'}
- Address: ${userProfile['公司地址'] || 'N/A'}
`;

    const emailPrompt = `${merchantInfo}
${senderInfo}

Please generate a personalized business partnership email based on the above information.

Requirements:
1. **Language Selection**: Automatically identify the appropriate language based on merchant address
2. **Personalized Content**: Find potential cooperation points by combining merchant's business highlights and sender's company business
3. **Cooperation Expectation**: Clearly express specific expectations and vision for cooperation
4. **Invite Offline Meeting**: Propose inviting for coffee or meeting when appropriate for deeper communication
5. **Open Attitude**: Express that even if we cannot reach cooperation, we hope to become friends and keep in touch
6. **Professional and Sincere**: Use professional business tone while maintaining sincerity and friendliness
7. **Avoid Fabrication**: Do not fabricate any non-existent information; skip content if field is N/A

Email Format:
Subject: [Subject]
Salutation: [Salutation]
Body: [Email Body Content]
Closing: [Closing]
Signature: [Signature]

Please generate a sincere, professional, and personalized business email.`;

    console.log(`Prompt built, length: ${emailPrompt.length}`);

    // 调用 Gemini API
    const result = await model.generateContent(emailPrompt);
    const responseText = result.response.text();
    console.log(`Gemini 返回内容，长度: ${responseText.length}`);

    const lines = responseText.split('\n');
    let email = {
      subject: '',
      salutation: '',
      body: '',
      closing: '',
      signature: ''
    };
    let currentSection = '';
    let bodyLines = [];
    let inSalutation = false;
    let inSignature = false;

    lines.forEach(line => {
      const trimmedLine = line.trim();

      const fieldMatch = trimmedLine.match(/^(\*\*)?(主题|Subject|称呼|Salutation|正文|Body|结尾|Closing|签名|Signature)[：:]/);
      if (fieldMatch) {
        const field = fieldMatch[2];

        if (field === '主题' || field === 'Subject') {
          const valueMatch = trimmedLine.match(/(?:\*\*)?(?:主题|Subject)[：:]\s*(.*)/);
          email.subject = valueMatch ? valueMatch[1].trim() : '';
          currentSection = '';
          inSalutation = false;
          inSignature = false;
        } else if (field === '称呼' || field === 'Salutation') {
          const valueMatch = trimmedLine.match(/(?:\*\*)?(?:称呼|Salutation)[：:]\s*(.*)/);
          if (valueMatch && valueMatch[1].trim()) {
            email.salutation = valueMatch[1].trim();
            inSalutation = false;
          } else {
            inSalutation = true;
          }
          currentSection = '';
          inSignature = false;
        } else if (field === '正文' || field === 'Body') {
          currentSection = 'body';
          inSalutation = false;
          inSignature = false;
        } else if (field === '结尾' || field === 'Closing') {
          const valueMatch = trimmedLine.match(/(?:\*\*)?(?:结尾|Closing)[：:]\s*(.*)/);
          email.closing = valueMatch ? valueMatch[1].trim() : '';
          currentSection = '';
          inSalutation = false;
          inSignature = false;
        } else if (field === '签名' || field === 'Signature') {
          currentSection = '';
          inSalutation = false;
          inSignature = true;
        }
      } else if (inSalutation && trimmedLine) {
        if (email.salutation) {
          email.salutation += ' ' + trimmedLine;
        } else {
          email.salutation = trimmedLine;
        }
      } else if (currentSection === 'body' && trimmedLine && !trimmedLine.match(/^(主题|Subject|称呼|Salutation|正文|Body|结尾|Closing|签名|Signature)[：:]/i)) {
        bodyLines.push(line);
      } else if (inSignature && trimmedLine) {
        if (email.signature) {
          email.signature += '\n' + trimmedLine;
        } else {
          email.signature = trimmedLine;
        }
      }
    });

    email.body = bodyLines.join('\n').trim();
    email.signature = email.signature.trim();

    console.log('Email parsed successfully:', {
      subject: email.subject,
      bodyLength: email.body.length
    });

    res.json({ email });
  } catch (error) {
    console.error('Email generation error:', error.message);
    res.status(500).json({ error: 'Email generation failed, please retry', details: error.message });
  }
});

// 用户资料保存接口
app.post('/api/save-profile', (req, res) => {
  try {
    const profile = req.body;

    // 验证必填字段
    if (!profile['姓名'] || !profile['职位'] || !profile['邮箱']) {
      return res.status(400).json({ error: '请填写姓名、职位和邮箱' });
    }

    // 确保目录存在
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 保存到文件
    const profilePath = path.join(dataDir, 'user-profile.json');
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2), 'utf-8');

    console.log(`User profile saved: ${profile['姓名']}`);
    res.json({ success: true, message: 'Profile saved successfully' });
  } catch (error) {
    console.error('Save user profile error:', error.message);
    res.status(500).json({ error: 'Save failed, please retry' });
  }
});

// 用户资料获取接口
app.get('/api/get-profile', (req, res) => {
  try {
    const profilePath = path.join(__dirname, 'data', 'user-profile.json');

    if (!fs.existsSync(profilePath)) {
      return res.json({ profile: null });
    }

    const profileData = fs.readFileSync(profilePath, 'utf-8');
    const profile = JSON.parse(profileData);

    console.log(`User profile loaded: ${profile['姓名'] || 'Not set'}`);
    res.json({ profile });
  } catch (error) {
    console.error('Load user profile error:', error.message);
    res.status(500).json({ error: 'Load failed, please retry' });
  }
});

// LinkedIn 搜索接口
app.post('/api/search-linkedin', async (req, res) => {
  try {
    const { merchants } = req.body;

    if (!Array.isArray(merchants) || merchants.length === 0) {
      return res.status(400).json({
        error: 'Please provide merchants array'
      });
    }

    console.log(`LinkedIn search started for ${merchants.length} merchants`);

    const startTime = Date.now();

    // 批量搜索 LinkedIn
    const results = await linkedinSearch.batchSearch(merchants, {
      delay: 500, // 500ms 延迟避免 API 限制
      onProgress: (completed, total) => {
        console.log(`LinkedIn search progress: ${completed}/${total}`);
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`LinkedIn search completed in ${duration}s`);

    res.json({
      merchants: results,
      duration: `${duration}s`,
      message: `LinkedIn search completed for ${results.length} merchants`
    });

  } catch (error) {
    console.error('LinkedIn search error:', error.message);
    res.status(500).json({
      error: 'LinkedIn search failed',
      details: error.message
    });
  }
});

// LinkedIn 验证接口
app.post('/api/validate-linkedin', async (req, res) => {
  try {
    const { merchants } = req.body;

    if (!Array.isArray(merchants) || merchants.length === 0) {
      return res.status(400).json({
        error: 'Please provide merchants array'
      });
    }

    console.log(`LinkedIn validation started for ${merchants.length} merchants`);

    const results = merchants.map(merchant => {
      const companyLinkedin = merchant['公司 LinkedIn'];
      const founderLinkedin = merchant['创始人 LinkedIn'];

      // 验证公司 LinkedIn
      let companyValidation = { valid: false, type: null, url: companyLinkedin };
      if (companyLinkedin && companyLinkedin !== 'N/A') {
        companyValidation = linkedinSearch.validateLinkedInUrl(companyLinkedin);
      }

      // 验证创始人 LinkedIn
      let founderValidation = { valid: false, type: null, url: founderLinkedin };
      if (founderLinkedin && founderLinkedin !== 'N/A') {
        founderValidation = linkedinSearch.validateLinkedInUrl(founderLinkedin);
      }

      return {
        ...merchant,
        '公司 LinkedIn验证': companyValidation,
        '创始人 LinkedIn验证': founderValidation
      };
    });

    console.log(`LinkedIn validation completed for ${results.length} merchants`);

    res.json({
      merchants: results,
      message: `LinkedIn validation completed for ${results.length} merchants`
    });

  } catch (error) {
    console.error('LinkedIn validation error:', error.message);
    res.status(500).json({
      error: 'LinkedIn validation failed',
      details: error.message
    });
  }
});

// 辅助函数：检查 LinkedIn URL 是否有效
function isValidLinkedInUrl(url) {
  if (!url || url === 'N/A') return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('linkedin.com/');
}

// 辅助函数：增强商户的 LinkedIn 信息
async function enhanceWithLinkedIn(merchants) {
  if (!merchants || merchants.length === 0) {
    return merchants;
  }

  // 只为没有有效 LinkedIn 的商户搜索
  const needsSearch = merchants.filter(m =>
    !isValidLinkedInUrl(m['公司 LinkedIn']) ||
    !isValidLinkedInUrl(m['创始人 LinkedIn'])
  );

  if (needsSearch.length === 0) {
    console.log('All merchants already have valid LinkedIn information');
    return merchants;
  }

  console.log(`Enhancing ${needsSearch.length} merchants with LinkedIn data`);

  try {
    const enhancedMerchants = await linkedinSearch.batchSearch(needsSearch, {
      delay: 500
    });

    // 创建查找映射
    const enhancedMap = new Map(
      enhancedMerchants.map(m => [m['商户名称'], m])
    );

    // 更新原商户数组
    const result = merchants.map(merchant => {
      const enhanced = enhancedMap.get(merchant['商户名称']);
      if (enhanced) {
        return {
          ...merchant,
          '公司 LinkedIn': enhanced['公司 LinkedIn'],
          '公司 LinkedIn置信度': enhanced['公司 LinkedIn置信度'],
          '创始人 LinkedIn': enhanced['创始人 LinkedIn'],
          '创始人 LinkedIn置信度': enhanced['创始人 LinkedIn置信度'],
          'LinkedIn来源': enhanced['LinkedIn来源'],
          '验证状态': enhanced['验证状态']
        };
      }
      return merchant;
    });

    return result;

  } catch (error) {
    console.error('LinkedIn enhancement failed:', error.message);
    // 如果失败，返回原商户数据
    return merchants;
  }
}

app.listen(PORT, () => {
  console.log('========================================');
  console.log(`Server started`);
  console.log(`Visit: http://localhost:${PORT}`);
  console.log('========================================');
});
