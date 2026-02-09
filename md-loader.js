const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');

class MDLoader {
  constructor(config) {
    this.mdDir = config.mdDir || path.join(__dirname, 'merchant-md');
    this.cacheFile = config.cacheFile || path.join(__dirname, 'data', 'md-cache.json');
    this.cache = null;
    this.cityIndex = {};
    this.allMerchants = [];
    this.fuseIndex = null;

    this.fuseOptions = {
      keys: [
        { name: '商户名称', weight: 5 },
        { name: '业务亮点', weight: 3 },
        { name: '验证地址', weight: 2 },
        { name: 'MD城市', weight: 2 },
        { name: '创始人', weight: 1 },
        { name: '电子邮箱', weight: 1 },
        { name: '国家', weight: 1 },
        { name: '采购需求', weight: 2 }
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
      useExtendedSearch: false
    };
  }

  async loadAll() {
    console.log('========================================');
    console.log('MD data load start');
    console.log('Time:', new Date().toISOString());
    console.log('========================================');

    try {
      if (await this.isCacheValid()) {
        console.log('Cache valid, loading from cache');
        this.cache = this.loadCache();
        this.cityIndex = this.cache.cityIndex || {};
        this.allMerchants = this.cache.allMerchants || [];
        console.log(`Loaded ${this.allMerchants.length} merchants from cache`);
        console.log(`City index: ${Object.keys(this.cityIndex).length} cities`);

        this.fuseIndex = new Fuse(this.allMerchants, this.fuseOptions);
        console.log('🔍 Fuse 搜索索引已从缓存初始化');
        console.log('========================================');
        return this.cache;
      }

      console.log('🔄 缓存无效，重新加载 MD 文件');
      const data = await this.parseMDFiles();
      this.saveCache(data);

      this.cache = data;
      this.cityIndex = data.cityIndex;
      this.allMerchants = data.allMerchants;

      console.log('========================================');
      console.log('✅ MD 数据加载完成');
      console.log(`📊 文件数: ${data.fileCount}`);
      console.log(`👥 商户数: ${data.merchantCount}`);
      console.log(`🏙️  城市数: ${data.cityCount}`);

      this.fuseIndex = new Fuse(data.allMerchants, this.fuseOptions);
      console.log('🔍 Fuse 搜索索引已初始化');
      console.log('========================================');

      return data;
    } catch (error) {
      console.error('❌ MD 数据加载失败:', error);
      throw error;
    }
  }

  async parseMDFiles() {
    if (!fs.existsSync(this.mdDir)) {
      console.log('⚠️  MD 目录不存在');
      return this.createEmptyCache();
    }

    const files = fs.readdirSync(this.mdDir);
    const mdFiles = files.filter(file =>
      file.match(/\.md$/) && file !== 'index.md'
    );

    console.log(`📁 找到 ${mdFiles.length} 个 MD 文件`);

    if (mdFiles.length === 0) {
      console.log('⚠️  MD 目录为空');
      return this.createEmptyCache();
    }

    const allMerchants = [];
    const cityIndex = {};
    let successCount = 0;

    for (const filename of mdFiles) {
      const filepath = path.join(this.mdDir, filename);
      const cityName = path.basename(filename, '.md');

      try {
        const merchants = this.parseSingleMDFile(filepath, cityName);
        allMerchants.push(...merchants);

        if (merchants.length > 0) {
          cityIndex[cityName] = merchants;
          successCount++;
        }

        console.log(`✅ ${cityName}.md: ${merchants.length} 个商户`);
      } catch (error) {
        console.error(`❌ 解析失败: ${filename}`, error.message);
      }
    }

    return {
      loadTime: new Date().toISOString(),
      version: '1.0',
      fileCount: mdFiles.length,
      successCount: successCount,
      merchantCount: allMerchants.length,
      cityCount: Object.keys(cityIndex).length,
      allMerchants: allMerchants,
      cityIndex: cityIndex
    };
  }

  parseSingleMDFile(filepath, cityName) {
    const content = fs.readFileSync(filepath, 'utf-8');

    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      console.log(`⚠️  未找到 JSON 数据: ${cityName}.md`);
      return [];
    }

    const jsonStr = jsonMatch[1];
    const merchants = JSON.parse(jsonStr);

    if (!Array.isArray(merchants)) {
      console.log(`⚠️  JSON 数据格式错误: ${cityName}.md`);
      return [];
    }

    return merchants.map(merchant => ({
      ...merchant,
      'MD城市': cityName,
      'MD来源': 'MD文件'
    }));
  }

  search({ city, category, keyword }) {
    if (!this.allMerchants || this.allMerchants.length === 0) {
      return [];
    }

    let searchResults = this.allMerchants;

    if (city || category || keyword) {
      let searchQueries = [];

      if (city) {
        searchQueries.push(city);
      }
      if (category) {
        searchQueries.push(category);
      }
      if (keyword) {
        searchQueries.push(keyword);
      }

      const queryString = searchQueries.join(' ');

      if (this.fuseIndex) {
        const fuseResults = this.fuseIndex.search(queryString);
        searchResults = fuseResults.map(result => ({
          ...result.item,
          匹配分数: Math.round((1 - result.score) * 100),
          匹配字段: 'Fuse模糊搜索'
        }));
      } else {
        const results = [];
        for (const merchant of this.allMerchants) {
          let matchScore = 0;
          const name = (merchant['商户名称'] || '').toLowerCase();
          const address = (merchant['验证地址'] || '').toLowerCase();
          const business = (merchant['业务亮点'] || '').toLowerCase();
          const mdCity = (merchant['MD城市'] || '').toLowerCase();

          const searchLower = queryString.toLowerCase();
          if (name.includes(searchLower) || address.includes(searchLower) ||
              business.includes(searchLower) || mdCity.includes(searchLower)) {
            matchScore = name.includes(searchLower) ? 5 :
                        mdCity.includes(searchLower) ? 3 : 2;
            results.push({ ...merchant, 匹配分数: matchScore });
          }
        }
        results.sort((a, b) => b.匹配分数 - a.匹配分数);
        searchResults = results;
      }
    }

    return searchResults.slice(0, 50);
  }

  searchByCity(city) {
    if (!this.cityIndex) {
      return [];
    }

    const cityLower = city.toLowerCase();

    for (const [cityName, merchants] of Object.entries(this.cityIndex)) {
      if (cityName.toLowerCase() === cityLower) {
        return merchants;
      }
    }

    return [];
  }

  saveCache(data) {
    const cacheDir = path.dirname(this.cacheFile);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log('💾 缓存已保存:', this.cacheFile);
  }

  loadCache() {
    if (!fs.existsSync(this.cacheFile)) {
      return null;
    }

    try {
      const data = fs.readFileSync(this.cacheFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ 加载缓存失败:', error);
      return null;
    }
  }

  async isCacheValid() {
    const cache = this.loadCache();
    if (!cache) {
      return false;
    }

    if (cache.loadTime) {
      const cacheTime = new Date(cache.loadTime);
      const now = new Date();
      const age = (now - cacheTime) / (1000 * 60 * 60);

      if (age > 24) {
        console.log('🔄 缓存超过 24 小时，重新加载');
        return false;
      }
    }

    return true;
  }

  createEmptyCache() {
    return {
      loadTime: new Date().toISOString(),
      version: '1.0',
      fileCount: 0,
      successCount: 0,
      merchantCount: 0,
      cityCount: 0,
      allMerchants: [],
      cityIndex: {}
    };
  }

  clearCache() {
    if (fs.existsSync(this.cacheFile)) {
      fs.unlinkSync(this.cacheFile);
      console.log('🗑️  缓存已清除');
    }
    this.cache = null;
    this.cityIndex = {};
    this.allMerchants = [];
    this.fuseIndex = null;
    console.log('🔍 Fuse 索引已清除');
  }

  async reload() {
    console.log('🔄 重新加载 MD 数据...');
    this.clearCache();
    return await this.loadAll();
  }

  getCacheInfo() {
    if (!this.cache) {
      return null;
    }

    return {
      loadTime: this.cache.loadTime,
      fileCount: this.cache.fileCount,
      successCount: this.cache.successCount,
      merchantCount: this.cache.merchantCount,
      cityCount: this.cache.cityCount,
      cities: Object.keys(this.cache.cityIndex || {})
    };
  }
}

module.exports = MDLoader;
