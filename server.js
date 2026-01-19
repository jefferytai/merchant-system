require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

app.post('/api/search', async (req, res) => {
  try {
    const { city, category, keyword, mode = 'balanced' } = req.body;
    
    if (!city && !category && !keyword) {
      return res.status(400).json({ error: '请输入城市、商户类型或关键词' });
    }

    let searchPrompt = '';

    if (mode === 'strict') {
      searchPrompt = `# Role
你是一位拥有严谨数据验证能力的专业市场研究员。你的核心能力是结合你的内部知识库与实时网络搜索（RAG），提供经过双重验证的商业数据。

# Goal
搜索并整理 ${city || '[城市名称]'} 的 ${category || '[商户类别]'} 数据。你不仅需要寻找数据，更重要的是必须对每一条数据进行严格的真实性和有效性验证。

# Context & Constraints
用户需要一份可以直接投入使用的高质量列表，任何过时、虚假或链接失效的信息都是不可接受的。

# Workflow (必须严格执行以下步骤)

## 第1步：广泛检索 (Broad Retrieval)
结合你的预训练数据和通过搜索引擎进行广泛搜索，列出该城市该类别的潜在商户名单。

## 第2步：真实性验证 (Authenticity Verification)
对第1步中的每一个潜在商户进行联网核查。
- **检查状态**：确认商户是否显示为"营业中"。剔除"已关闭"或"暂停营业"的商户。
- **交叉验证**：寻找至少两个来源（如官方网站、Google地图评论、或本地黄页）佐证其存在。

## 第3步：链接与连通性测试 (Link Connectivity Check)
- **浏览测试**：利用你的工具访问商户的官方链接。
- **有效性判断**：如果你无法成功访问该页面，或者页面返回404错误，必须将该链接标记为无效，并尝试寻找替代的有效链接。如果找不到有效链接，请在最终输出中剔除该商户或明确标注"无官网"。

## 第4步：LinkedIn 链接验证 (LinkedIn Link Verification)
- **访问测试**：尝试访问创始人和公司的 LinkedIn 页面。
- **有效性判断**：
  - 如果页面显示 "Page Not Available"、"404 Not Found"、"Profile Not Found"、"Company Not Found" 或其他错误，必须将该 LinkedIn 链接标记为 "N/A"。
  - 如果 LinkedIn 个人资料或公司页面已关闭或不存在，不要提供过时的链接。
  - 只提供经过验证可以正常访问的 LinkedIn 链接。
  - **优先级**：宁可不提供 LinkedIn 链接，也不要提供失效的链接。

## 第5步：最终输出 (Final Output)
仅输出经过第2步和第3步和第4步验证成功的商户。请使用以下JSON格式数组，不要使用Markdown表格：

[
  {
    "商户名称": "名称",
    "验证地址": "地址",
    "官方链接": "URL（已验证）或 N/A",
    "联系电话": "电话或 N/A",
    "业务亮点": "描述",
    "创始人": "创始人或 N/A",
    "创始人 LinkedIn": "LinkedIn URL（N/A）",
    "公司 LinkedIn": "LinkedIn URL（N/A）",
    "电子邮箱": "邮箱（N/A）",
    "已联系": false
  }
]

# Safety & Accuracy
- 如果你不确定某个信息的真实性，请不要将其包含在内。
- 宁可数据量少但准确，也不要提供未经验证的大量数据。
- 搜索结束时，请说明你排除了多少个无效或无法验证的条目。

# Start Task
目标城市：${city || '请指定城市'}
目标商户类别：${category || '请指定商户类别'}
${keyword ? `附加关键词：${keyword}` : ''}

开始执行检索与验证流程。`;
      
    } else if (mode === 'balanced') {
      searchPrompt = `# Role
你是一位拥有严谨数据验证能力的专业市场研究员。你的核心能力是结合你的内部知识库与实时网络搜索（RAG），提供经过双重验证的商业数据。

# Goal
搜索并整理 ${city || '[城市名称]'} 的 ${category || '[商户类别]'} 数据。你不仅需要寻找数据，更重要的是必须对每一条数据进行严格的真实性和有效性验证。

# Context & Constraints
用户需要一份可以直接投入使用的高质量列表，任何过时、虚假或链接失效的信息都是不可接受的。

# Workflow (平衡模式)

## 第1步：广泛检索 (Broad Retrieval)
结合你的预训练数据和通过搜索引擎进行广泛搜索，列出该城市该类别的潜在商户名单。

## 第2步：基础验证 (Basic Verification)
- **必须验证**：商户名称、验证地址、联系电话、电子邮箱
- **验证要求**：这些信息必须存在且格式正确
- **排除标准**：名称为空、地址为空、电话为空、邮箱为空的商户

## 第3步：官网标注 (Link Annotation)
- **访问测试**：尝试访问商户的官方链接
- **标注规则**：
  - 如果成功访问：标记为 "官方网站（已验证）"
  - 如果无法访问：标记为 "官方网站（待验证）"
  - **重要**：不要因为官网未验证就剔除商户，保留商户并标注状态

## 第4步：LinkedIn 标注 (LinkedIn Annotation)
- **访问测试**：尝试访问创始人和公司的 LinkedIn 页面
- **标注规则**：
  - 如果成功访问：提供 LinkedIn 链接，标记为 "（已验证）"
  - 如果无法访问：标记为 "（待验证）" 或 "N/A"
  - **优先级**：优先显示已验证的 LinkedIn，未验证的标记为"待验证"而不是"N/A"

## 第5步：最终输出
- 输出格式：JSON 数组
- 预期数量：10-30 个商户
- 验证状态：字段标注（已验证/待验证）

[
  {
    "商户名称": "名称",
    "验证地址": "地址",
    "官方链接": "URL（已验证）" 或 "URL（待验证）" 或 "无官网"
  }
  ...
]

# Safety & Accuracy
- 如果你不确定某个信息的真实性，请不要将其包含在内。
- 在质量和数量之间找到平衡，对于不确定的信息标注"待验证"
- 搜索结束时，请说明你找到了多少个商户，以及标注为"已验证"和"待验证"的商户数量。

# Start Task
目标城市：${city || '请指定城市'}
目标商户类别：${category || '请指定商户类别'}
${keyword ? `附加关键词：${keyword}` : ''}

开始执行基础检索和标注流程。`;
      
    } else if (mode === 'fast') {
      searchPrompt = `# Role
你是一位拥有严谨数据验证能力的专业市场研究员。你的核心能力是结合你的内部知识库与实时网络搜索（RAG），提供经过双重验证的商业数据。

# Goal
搜索并整理 ${city || '[城市名称]'} 的 ${category || '[商户类别]'} 数据。你不仅需要寻找数据，更重要的是必须对每一条数据进行严格的真实性和有效性验证。

# Context & Constraints
用户需要一份可以直接投入使用的高质量列表，任何过时、虚假或链接失效的信息都是不可接受的。

# Workflow (快速搜索模式)

## 第1步：广泛检索 (Broad Retrieval)
结合你的预训练数据和通过搜索引擎进行广泛搜索，列出该城市该类别的潜在商户名单。

## 第2步：基础信息收集 (Basic Info Collection)
- 收集商户名称、验证地址、联系电话、电子邮箱
- **不进行任何验证**：只要有基本信息的商户都保留

## 第3步：标注所有待验证
- 所有字段标注为"待验证"
- 官网链接：标注为"官方网站（待验证）"
- LinkedIn：标注为"LinkedIn（待验证）"或 "N/A"

## 第4步：最终输出
- 输出格式：JSON 数组
- 预期数量：50-100 个商户
- 验证状态：全部标记为"待验证"

 [
   {
     "商户名称": "名称",
     "验证地址": "地址",
     "官方链接": "官方网站（待验证）" 或 "无官网",
     "联系电话": "电话或 N/A",
     "业务亮点": "描述",
     "创始人": "创始人或 N/A",
     "创始人 LinkedIn": "LinkedIn（待验证）" 或 "N/A",
     "公司 LinkedIn": "LinkedIn（待验证）" 或 "N/A",
     "电子邮箱": "邮箱（N/A）",
     "已联系": false,
     "验证状态": "全部待验证"
   }
   ...
 ]

# Safety & Accuracy
- 提供尽可能多的候选商户，让用户自行筛选和验证。
- 所有信息必须来自你的内部知识库或网络搜索，不得编造信息。
- 搜索结束时，请说明你找到了多少个商户。

# Start Task
目标城市：${city || '请指定城市'}
目标商户类别：${category || '请指定商户类别'}
${keyword ? `附加关键词：${keyword}` : ''}

开始执行快速搜索模式。`;
      
    }
    
    const result = await model.generateContent(searchPrompt);
    const responseText = result.response.text();
    
    let merchants;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      merchants = JSON.parse(jsonStr);
    } catch (e) {
      merchants = [];
    }

    merchants = merchants.map(m => {
      let verificationStatus = '全部待验证';
      
      if (mode === 'strict') {
        verificationStatus = '已验证';
      } else if (mode === 'balanced') {
        const officialLink = m['官方链接'] || '';
        const founderLinkedIn = m['创始人 LinkedIn'] || '';
        const companyLinkedIn = m['公司 LinkedIn'] || '';
        
        const hasVerified = officialLink.includes('已验证') || 
                          founderLinkedIn.includes('已验证') || 
                          companyLinkedIn.includes('已验证');
        
        verificationStatus = hasVerified ? '部分已验证' : '全部待验证';
      }
      
      return {
        ...m,
        已联系: m.已联系 || false,
        创建时间: m.创建时间 || new Date().toISOString(),
        验证状态: m.验证状态 || verificationStatus
      };
    });

    res.json({ merchants });
    
  } catch (error) {
    console.error('搜索错误:', error);
    res.status(500).json({ error: '搜索失败，请重试' });
  }
});

app.post('/api/generate-email', async (req, res) => {
  try {
    const { merchant } = req.body;

    if (!merchant || !merchant['商户名称']) {
      return res.status(400).json({ error: '商户信息不完整' });
    }

    const emailPrompt = `基于以下商家信息，起草一封合作邀请邮件：

商户名称：${merchant['商户名称']}
创始人：${merchant['创始人']}
业务亮点：${merchant['业务亮点']}
电子邮箱：${merchant['电子邮箱']}
验证地址：${merchant['验证地址']}
官方链接：${merchant['官方链接']}

要求：
1. 表达合作意图，希望能见面商谈
2. 基于对方的业务亮点和特点，个性化定制内容
3. 专业、简洁、礼貌的商务邮件格式
4. 包含：主题行、称呼、正文、结尾、签名

请以以下格式返回：
主题：[邮件主题]
称呼：[称呼]
正文：
[邮件正文内容]
结尾：[结尾]
签名：[签名]`;

    const result = await model.generateContent(emailPrompt);
    const responseText = result.response.text();
    
    let email = {
      subject: '',
      salutation: '',
      body: '',
      closing: '',
      signature: ''
    };

    const lines = responseText.split('\n');
    let currentSection = '';
    let bodyLines = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('**主题：**') || trimmedLine.startsWith('主题：')) {
        email.subject = trimmedLine.replace(/\*\*主题：\*\*|主题：/, '').trim();
        currentSection = '';
      } else if (trimmedLine.startsWith('**称呼：**') || trimmedLine.startsWith('称呼：')) {
        email.salutation = trimmedLine.replace(/\*\*称呼：\*\*|称呼：/, '').trim();
        currentSection = '';
      } else if (trimmedLine.startsWith('**正文：**') || trimmedLine.startsWith('正文：')) {
        currentSection = 'body';
      } else if (trimmedLine.startsWith('**结尾：**') || trimmedLine.startsWith('结尾：')) {
        email.closing = trimmedLine.replace(/\*\*结尾：\*\*|结尾：/, '').trim();
        currentSection = '';
      } else if (trimmedLine.startsWith('**签名：**') || trimmedLine.startsWith('签名：')) {
        currentSection = 'signature';
      } else if (currentSection === 'body' && trimmedLine && !trimmedLine.startsWith('**')) {
        bodyLines.push(line);
      } else if (currentSection === 'signature' && trimmedLine) {
        email.signature += trimmedLine + '\n';
      }
    });

    email.body = bodyLines.join('\n').trim();
    email.signature = email.signature.trim();

    res.json({ email });
  } catch (error) {
    console.error('邮件生成错误:', error);
    res.status(500).json({ error: '邮件生成失败，请重试' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
