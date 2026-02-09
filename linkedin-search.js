const axios = require('axios');

class LinkedInSearch {
  constructor(config) {
    this.serperApiKey = config.serperApiKey;
    this.baseUrl = 'https://google.serper.dev/search';
  }

  /**
   * 搜索公司 LinkedIn 页面
   * @param {string} companyName - 公司名称
   * @param {string} city - 城市（可选）
   * @param {object} options - 选项
   * @returns {Promise<object>} - { url, confidence, sources }
   */
  async searchCompanyLinkedIn(companyName, city, options = {}) {
    if (!companyName || companyName === 'N/A') {
      return { url: 'N/A', confidence: 0, sources: [] };
    }

    const queries = this.buildCompanySearchQueries(companyName, city);
    const results = await this.executeSearch(queries);

    const linkedinUrl = this.extractLinkedInUrlFromResults(results, 'company');
    const confidence = this.calculateConfidence(linkedinUrl, results, 'company');

    return {
      url: linkedinUrl || 'N/A',
      confidence: confidence,
      sources: results.map(r => ({ title: r.title, link: r.link }))
    };
  }

  /**
   * 搜索创始人 LinkedIn 个人资料
   * @param {string} founderName - 创始人姓名
   * @param {string} companyName - 公司名称
   * @param {object} options - 选项
   * @returns {Promise<object>} - { url, confidence, sources }
   */
  async searchFounderLinkedIn(founderName, companyName, options = {}) {
    if (!founderName || founderName === 'N/A') {
      return { url: 'N/A', confidence: 0, sources: [] };
    }

    const queries = this.buildFounderSearchQueries(founderName, companyName);
    const results = await this.executeSearch(queries);

    const linkedinUrl = this.extractLinkedInUrlFromResults(results, 'profile');
    const confidence = this.calculateConfidence(linkedinUrl, results, 'profile');

    return {
      url: linkedinUrl || 'N/A',
      confidence: confidence,
      sources: results.map(r => ({ title: r.title, link: r.link }))
    };
  }

  /**
   * 同时搜索公司和创始人 LinkedIn
   * @param {string} companyName - 公司名称
   * @param {string} founderName - 创始人姓名
   * @param {string} city - 城市（可选）
   * @returns {Promise<object>} - { company, founder }
   */
  async searchAll(companyName, founderName, city) {
    const [companyResult, founderResult] = await Promise.all([
      this.searchCompanyLinkedIn(companyName, city),
      this.searchFounderLinkedIn(founderName, companyName)
    ]);

    return {
      company: companyResult,
      founder: founderResult
    };
  }

  /**
   * 构建 LinkedIn 搜索查询
   * @private
   */
  buildCompanySearchQueries(companyName, city) {
    const cityStr = city ? ` ${city}` : '';

    return [
      `site:linkedin.com/company "${companyName}"${cityStr}`,
      `site:linkedin.com/company "${companyName}"`,
      `"${companyName}" official LinkedIn page${cityStr}`,
      `"${companyName} company" LinkedIn${cityStr}`
    ];
  }

  buildFounderSearchQueries(founderName, companyName) {
    return [
      `site:linkedin.com/in "${founderName}" "${companyName}"`,
      `site:linkedin.com/in "${founderName}"`,
      `"${founderName}" "${companyName}" LinkedIn`,
      `"${founderName}" LinkedIn profile`
    ];
  }

  /**
   * 执行 Serper 搜索
   * @private
   */
  async executeSearch(queries) {
    const allResults = [];

    for (const query of queries) {
      try {
        const response = await axios.get(this.baseUrl, {
          params: {
            q: query,
            apiKey: this.serperApiKey,
            num: 10
          },
          timeout: 10000
        });

        if (response.data && response.data.organic) {
          allResults.push(...response.data.organic);
        }
      } catch (error) {
        console.error(`Search failed for query: ${query}`, error.message);
      }
    }

    return allResults;
  }

  /**
   * 从搜索结果中提取 LinkedIn URL
   * @private
   */
  extractLinkedInUrlFromResults(results, type) {
    if (!results || results.length === 0) {
      return null;
    }

    const linkedinResults = results.filter(r => {
      const link = (r.link || '').toLowerCase();
      return link.includes('linkedin.com/');
    });

    if (linkedinResults.length === 0) {
      return null;
    }

    // 根据类型过滤
    const typeResults = linkedinResults.filter(r => {
      const link = (r.link || '').toLowerCase();
      if (type === 'company') {
        return link.includes('/company/');
      } else if (type === 'profile') {
        return link.includes('/in/');
      }
      return true;
    });

    // 优先返回符合类型的结果
    if (typeResults.length > 0) {
      return this.normalizeLinkedInUrl(typeResults[0].link);
    }

    // 如果没有符合类型的结果，返回第一个 LinkedIn URL
    return this.normalizeLinkedInUrl(linkedinResults[0].link);
  }

  /**
   * 标准化 LinkedIn URL
   * @private
   */
  normalizeLinkedInUrl(url) {
    if (!url) return null;

    let normalized = url.trim();

    if (!normalized.startsWith('http')) {
      normalized = 'https://' + normalized;
    }

    return normalized;
  }

  /**
   * 计算置信度
   * @private
   */
  calculateConfidence(url, results, type) {
    if (!url || url === 'N/A') {
      return 0;
    }

    let score = 0;

    // 因素 1：URL 在多个搜索结果中出现
    const urlCount = results.filter(r =>
      (r.link || '').includes(url)
    ).length;
    score += Math.min(urlCount * 25, 50);

    // 因素 2：URL 格式正确
    if (this.validateLinkedInUrl(url).valid) {
      score += 20;
    }

    // 因素 3：搜索结果标题包含相关关键词
    const hasKeywords = results.some(r => {
      const title = (r.title || '').toLowerCase();
      return title.includes('official') ||
             title.includes('verified') ||
             title.includes('company') ||
             title.includes('profile');
    });
    if (hasKeywords) {
      score += 15;
    }

    // 因素 4：URL 来自 LinkedIn 官方域名
    const fromOfficial = results.some(r =>
      (r.link || '').includes('linkedin.com')
    );
    if (fromOfficial) {
      score += 10;
    }

    // 因素 5：URL 类型匹配
    const lowerUrl = url.toLowerCase();
    if (type === 'company' && lowerUrl.includes('/company/')) {
      score += 5;
    } else if (type === 'profile' && lowerUrl.includes('/in/')) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * 验证 LinkedIn URL
   * @param {string} url - LinkedIn URL
   * @returns {object} - { valid, type, url }
   */
  validateLinkedInUrl(url) {
    if (!url || url === 'N/A') {
      return { valid: false, type: null, url: 'N/A' };
    }

    const lowerUrl = url.toLowerCase();

    if (!lowerUrl.includes('linkedin.com/')) {
      return { valid: false, type: null, url };
    }

    if (lowerUrl.includes('/company/')) {
      return { valid: true, type: 'company', url };
    } else if (lowerUrl.includes('/in/')) {
      return { valid: true, type: 'profile', url };
    } else {
      return { valid: false, type: null, url };
    }
  }

  /**
   * 批量搜索 LinkedIn
   * @param {Array} merchants - 商户数组
   * @param {object} options - 选项
   * @returns {Promise<Array>} - 更新后的商户数组
   */
  async batchSearch(merchants, options = {}) {
    const results = [];

    for (const merchant of merchants) {
      try {
        const companyName = merchant['商户名称'];
        const founderName = merchant['创始人'];
        const city = merchant['MD城市'] || merchant['验证地址'] || '';

        const linkedinResult = await this.searchAll(companyName, founderName, city);

        const updatedMerchant = {
          ...merchant,
          '公司 LinkedIn': linkedinResult.company.url,
          '公司 LinkedIn置信度': linkedinResult.company.confidence,
          '创始人 LinkedIn': linkedinResult.founder.url,
          '创始人 LinkedIn置信度': linkedinResult.founder.confidence,
          'LinkedIn来源': 'Serper搜索',
          '验证状态': 'AI验证+搜索'
        };

        results.push(updatedMerchant);

        if (options.onProgress) {
          options.onProgress(results.length, merchants.length);
        }

        // 添加延迟避免 API 限制
        if (options.delay) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }

      } catch (error) {
        console.error(`LinkedIn search failed for ${merchant['商户名称']}:`, error.message);
        results.push(merchant);
      }
    }

    return results;
  }
}

module.exports = LinkedInSearch;
