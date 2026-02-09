/**
 * LinkedIn 搜索和验证的 Prompt 模板
 */

module.exports = {
  /**
   * LinkedIn 分析和验证 Prompt
   * @param {object} merchant - 商户信息
   * @param {Array} searchResults - Serper 搜索结果
   * @returns {string} - Prompt 文本
   */
  linkedinAnalysis: (merchant, searchResults) => `
You are a professional LinkedIn verification expert.

You will analyze LinkedIn search results for a company and determine the validity of LinkedIn information.

---

## Company Information
- Name: ${merchant['商户名称']}
- Founder: ${merchant['创始人'] || 'N/A'}
- Business: ${merchant['业务亮点'] || 'N/A'}
- City: ${merchant['验证地址'] || 'N/A'}

---

## LinkedIn Search Results (from Serper API)
${JSON.stringify(searchResults, null, 2)}

---

## Your Task

Please analyze the search results and provide a structured assessment:

### 1. Identify Company LinkedIn Page
- Find the official company LinkedIn page
- Validate if the URL format is correct (should be: linkedin.com/company/[company-id])
- Check if the company name matches
- Return the most reliable company LinkedIn URL or "N/A"

### 2. Identify Founder's LinkedIn Profile
- Find the founder's personal LinkedIn profile
- Validate if the URL format is correct (should be: linkedin.com/in/[profile-id])
- Check if the founder name matches
- Return the most reliable founder LinkedIn URL or "N/A"

### 3. Assess Confidence Level
- Rate each LinkedIn URL on a scale of 0-100
- High confidence (80-100): Multiple sources confirm, URL format correct
- Medium confidence (50-79): Some sources confirm, URL looks correct
- Low confidence (0-49): Limited sources, uncertain validity

### 4. Return Structured Result

\`\`\`json
{
  "公司 LinkedIn": "validated_url_or_N/A",
  "公司 LinkedIn置信度": number (0-100),
  "创始人 LinkedIn": "validated_url_or_N/A",
  "创始人 LinkedIn置信度": number (0-100),
  "验证状态": "AI验证+搜索",
  "来源": "Serper搜索",
  "备注": "any additional notes about the validation process"
}
\`\`\`

## Important Guidelines

- If you cannot find a valid LinkedIn URL, use "N/A"
- Do not fabricate LinkedIn URLs - only use URLs from the search results
- Be conservative with confidence scores - it's better to be honest about uncertainty
- Include the full URL (including https://)
- If multiple LinkedIn URLs are found, choose the one with the highest confidence
`,

  /**
   * 商户搜索增强 LinkedIn Prompt
   * @param {string} city - 城市
   * @param {string} category - 商户类型
   * @param {string} keyword - 关键词
   * @returns {string} - Prompt 文本
   */
  merchantSearchWithLinkedIn: (city, category, keyword) => `
Search for merchant information with enhanced LinkedIn search capabilities.

---

## Search Parameters
- City: ${city || '不限'}
- Merchant Type: ${category || '不限'}
- Keyword: ${keyword || '无'}

---

## Instructions

### Phase 1: Basic Merchant Information

First, search for the following merchant information:
1. 商户名称
2. 验证地址
3. 联系电话
4. 电子邮箱
5. 官方链接
6. 创始人
7. 业务亮点

Focus on companies that match the search criteria. Provide accurate and verified information.

### Phase 2: LinkedIn Information Enhancement

For each merchant found, also search for LinkedIn information:

1. **Company LinkedIn Page**
   - Use search query: site:linkedin.com/company "[company name]"
   - Find the official company LinkedIn page
   - Validate the URL format

2. **Founder's LinkedIn Profile**
   - Use search query: site:linkedin.com/in "[founder name] [company name]"
   - Find the founder's personal LinkedIn profile
   - Validate the URL format

### Phase 3: Return Structured Results

Return a JSON array of merchants (maximum 10) with these fields:

\`\`\`json
[
  {
    "商户名称": "company name",
    "验证地址": "address",
    "联系电话": "phone",
    "电子邮箱": "email",
    "官方链接": "website",
    "创始人": "founder name",
    "业务亮点": "business description",
    "公司 LinkedIn": "company LinkedIn URL or N/A",
    "创始人 LinkedIn": "founder LinkedIn URL or N/A",
    "公司 LinkedIn置信度": 85,
    "创始人 LinkedIn置信度": 70,
    "验证状态": "AI生成+LinkedIn搜索",
    "来源": "AI搜索+Serper"
  }
]
\`\`\`

## Important Guidelines

- Only return merchants that match the search criteria
- For LinkedIn information, provide the most reliable URL or "N/A"
- Assign confidence scores (0-100) based on reliability
- Be accurate and do not fabricate information
- Use "N/A" if information is not available or uncertain
- Focus on quality over quantity - it's better to have 5 accurate results than 10 inaccurate ones
`,

  /**
   * LinkedIn URL 验证 Prompt
   * @param {object} merchant - 商户信息
   * @param {string} linkedinUrl - LinkedIn URL
   * @returns {string} - Prompt 文本
   */
  validateLinkedInUrl: (merchant, linkedinUrl) => `
You are a LinkedIn URL validation expert.

---

## Merchant Information
- Company Name: ${merchant['商户名称']}
- Founder: ${merchant['创始人'] || 'N/A'}
- Business: ${merchant['业务亮点'] || 'N/A'}

---

## LinkedIn URL to Validate
${linkedinUrl || 'N/A'}

---

## Your Task

Please validate the LinkedIn URL and provide an assessment:

### 1. URL Format Validation
- Check if the URL follows the correct LinkedIn format:
  - Company page: https://www.linkedin.com/company/[company-id]
  - Personal profile: https://www.linkedin.com/in/[profile-id]
- Return: valid or invalid

### 2. Content Match Validation
- For company pages: Does the company name match?
- For personal profiles: Does the founder name match?
- Return: matched or unmatched

### 3. Confidence Assessment
- Rate the overall validity on a scale of 0-100
- Consider: format, content match, and any other indicators

### 4. Return Structured Result

\`\`\`json
{
  "url": "${linkedinUrl || 'N/A'}",
  "valid": true/false,
  "type": "company/profile/invalid",
  "matched": true/false,
  "confidence": 85,
  "notes": "detailed explanation of validation"
}
\`\`\`

## Important Guidelines

- Be thorough in your validation
- If the URL is invalid, explain why
- If the URL does not match the merchant, explain the discrepancy
- Provide specific reasons for your confidence score
`,

  /**
   * 批量 LinkedIn 验证 Prompt
   * @param {Array} merchants - 商户数组
   * @returns {string} - Prompt 文本
   */
  batchValidateLinkedIn: (merchants) => `
You are a LinkedIn verification expert specializing in batch validation.

---

## Batch Validation Task

You will validate LinkedIn URLs for ${merchants.length} merchants.

---

## Instructions

For each merchant, validate the LinkedIn information:

1. **Company LinkedIn URL**
   - Check URL format: linkedin.com/company/[id]
   - Verify company name match
   - Assess reliability (0-100)

2. **Founder LinkedIn URL**
   - Check URL format: linkedin.com/in/[id]
   - Verify founder name match
   - Assess reliability (0-100)

3. **Overall Assessment**
   - Provide confidence scores for both URLs
   - Note any issues or discrepancies
   - Return "N/A" if URL is invalid or unreliable

### Return Format

\`\`\`json
[
  {
    "商户名称": "merchant name",
    "公司 LinkedIn": "validated_url_or_N/A",
    "公司 LinkedIn置信度": 85,
    "创始人 LinkedIn": "validated_url_or_N/A",
    "创始人 LinkedIn置信度": 70,
    "验证状态": "AI验证+批量搜索",
    "来源": "Serper批量验证",
    "备注": "validation notes"
  }
]
\`\`\`

## Guidelines

- Be accurate and conservative
- Use "N/A" for unreliable URLs
- Provide detailed confidence assessments
- Do not fabricate any information
`
};
