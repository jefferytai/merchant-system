/**
 * 邮件模板模块
 * 支持 25+ 种语言的商务邮件生成
 */

// 语言检测规则
const languageRules = [
  // 英语国家
  { language: 'en', name: 'English', keywords: ['usa', 'us', 'united states', 'uk', 'united kingdom', 'britain', 'england', 'scotland', 'wales', 'australia', 'au', 'new zealand', 'nz', 'singapore', 'sg', 'canada', 'ca', 'south africa', 'ireland', 'jamaica', 'bahamas', 'kenya', 'nigeria', 'ghana', 'uganda', 'tanzania', 'zambia', 'zimbabwe', 'botswana', 'namibia', 'philippines', 'india', 'pakistan', 'bangladesh', 'srilanka', 'maldives', 'fiji', 'papua new guinea', 'solomon islands', 'vanuatu', 'samoa', 'tonga', 'tuvalu', 'kiribati', 'marshall islands', 'micronesia', 'palau', 'nauru'] },

  // 中文（简体/繁体）
  { language: 'zh', name: 'Chinese', keywords: ['中国', 'china', '北京', 'beijing', '上海', 'shanghai', '广州', 'guangzhou', '深圳', 'shenzhen', '杭州', 'hangzhou', '南京', 'nanjing', '成都', 'chengdu', '重庆', 'chongqing', '武汉', 'wuhan', '西安', 'xian', '香港', 'hong kong', 'hk', '澳门', 'macau', '台湾', 'taiwan', '台北', 'taipei'] },

  // 日语
  { language: 'ja', name: 'Japanese', keywords: ['日本', 'japan', 'jp', '東京', 'tokyo', '大阪', 'osaka', '京都', 'kyoto', '横滨', 'yokohama', '名古屋', 'nagoya', '札幌', 'sapporo', '福岡', 'fukuoka', '神戸', 'kobe', '広島', 'hiroshima', '仙台', 'sendai'] },

  // 韩语
  { language: 'ko', name: 'Korean', keywords: ['韩国', 'korea', 'kr', '서울', 'seoul', '부산', 'busan', '인천', 'incheon', '대구', 'daegu', '광주', 'gwangju', '대전', 'daejeon', '울산', 'ulsan'] },

  // 德语
  { language: 'de', name: 'German', keywords: ['德国', 'germany', 'de', 'deutschland', 'berlin', '柏林', 'munich', '慕尼黑', ' münchen', 'hamburg', '汉堡', 'frankfurt', '法兰克福', 'cologne', '科隆', 'köln', 'stuttgart', '斯图加特', 'düsseldorf', '杜塞尔多夫', 'dresden', '德累斯顿'] },

  // 法语
  { language: 'fr', name: 'French', keywords: ['法国', 'france', 'fr', 'paris', '巴黎', 'marseille', '马赛', 'lyon', '里昂', 'nice', '尼斯', 'toulouse', '图卢兹', 'nantes', '南特', 'strasbourg', '斯特拉斯堡', 'montpellier', '蒙彼利埃', 'bordeaux', '波尔多', 'lille', '里尔', 'rennes', '雷恩'] },

  // 西班牙语
  { language: 'es', name: 'Spanish', keywords: ['西班牙', 'spain', 'es', 'españa', 'madrid', '马德里', 'barcelona', '巴塞罗那', 'valencia', '瓦伦西亚', 'sevilla', '塞维利亚', 'zaragoza', '萨拉戈萨', 'málaga', '马拉加', 'murcia', '穆尔西亚', 'palma de mallorca', 'las palmas', 'baleares', 'mexico', 'méxico', 'mx', 'argentina', 'ar', 'colombia', 'co', 'peru', 'pe', 'chile', 'cl', 'venezuela', 've', 'ecuador', 'ec', 'bolivia', 'bo', 'paraguay', 'py', 'uruguay', 'uy', 'cuba', 'cu', 'dominican republic', 'do', 'puerto rico', 'pr', 'panama', 'pa', 'costa rica', 'cr', 'guatemala', 'gt', 'el salvador', 'sv', 'honduras', 'hn', 'nicaragua', 'ni'] },

  // 意大利语
  { language: 'it', name: 'Italian', keywords: ['意大利', 'italy', 'it', 'italia', 'rome', '罗马', 'roma', 'milan', '米兰', 'milano', 'naples', '那不勒斯', 'napoli', 'turin', '都灵', 'torino', 'palermo', '巴勒莫', 'genoa', '热那亚', 'genova', 'bologna', '博洛尼亚', 'florence', '佛罗伦萨', 'firenze', 'venice', '威尼斯', 'venezia', 'verona', '维罗纳'] },

  // 葡萄牙语
  { language: 'pt', name: 'Portuguese', keywords: ['葡萄牙', 'portugal', 'pt', 'lisbon', '里斯本', 'lisboa', 'porto', '波尔图', 'braga', '布拉加', 'coimbra', '科英布拉', 'funchal', 'funchal', 'brazil', 'brasil', 'br', 'são paulo', '圣保罗', 'rio de janeiro', '里约热内卢', 'belo horizonte', 'salvador', 'brasília', '巴西利亚', 'fortaleza', 'curitiba', 'recife', 'manaus'] },

  // 荷兰语
  { language: 'nl', name: 'Dutch', keywords: ['荷兰', 'netherlands', 'nl', 'nederland', 'amsterdam', '阿姆斯特丹', 'rotterdam', '鹿特丹', 'the hague', '海牙', 'den haag', 'utrecht', '乌得勒支', 'eindhoven', '埃因霍温', 'groningen', '格罗宁根', 'tilburg', '蒂尔堡', 'almere', '阿尔梅勒', 'breda', '布雷达', 'nijmegen', '奈梅亨', 'apeldoorn', '阿珀尔多伦', 'enschede', '恩斯赫德', 'haarlem', '哈勒姆'] },

  // 瑞典语
  { language: 'sv', name: 'Swedish', keywords: ['瑞典', 'sweden', 'se', 'sverige', 'stockholm', '斯德哥尔摩', 'gothenburg', '哥德堡', 'göteborg', 'malmö', '马尔默', 'uppsala', '乌普萨拉', 'västerås', '韦斯特罗斯', 'örebro', '厄勒布鲁', 'linköping', '林雪平', 'helsingborg', '赫尔辛堡', 'jönköping', '延雪平'] },

  // 挪威语
  { language: 'no', name: 'Norwegian', keywords: ['挪威', 'norway', 'no', 'norge', 'oslo', '奥斯陆', 'bergen', '卑尔根', 'trondheim', '特隆赫姆', 'stavanger', '斯塔万格', 'fredrikstad', '腓特烈斯塔', 'tromsø', '特罗姆瑟', 'drammen', '德拉门', 'skien', '斯基恩', 'sandnes', '桑内斯', 'porsgrunn', '波什格伦'] },

  // 丹麦语
  { language: 'da', name: 'Danish', keywords: ['丹麦', 'denmark', 'dk', 'danmark', 'copenhagen', '哥本哈根', 'københavn', 'aarhus', '奥尔胡斯', 'odense', '欧登塞', 'aalborg', '奥尔堡', 'esbjerg', '埃斯比约', 'randers', '兰讷斯', 'kolding', '科灵', 'vejle', '瓦埃勒', 'herning', '海宁', 'horsens', '霍尔森斯'] },

  // 芬兰语
  { language: 'fi', name: 'Finnish', keywords: ['芬兰', 'finland', 'fi', 'suomi', 'helsinki', '赫尔辛基', 'espoo', '埃斯波', 'tampere', '坦佩雷', 'vantaa', '万塔', 'turku', '图尔库', 'oulu', '奥卢', 'jyväskylä', '于韦斯屈莱', 'lahti', '拉赫蒂', 'kuopio', '库奥皮奥', 'pori', '波里', 'kouvola', '科沃拉', 'joensuu', '约恩苏'] },

  // 波兰语
  { language: 'pl', name: 'Polish', keywords: ['波兰', 'poland', 'pl', 'polska', 'warsaw', '华沙', 'warszawa', 'kraków', '克拉科夫', 'cracow', 'Łódź', '罗兹', 'wrocław', '弗罗茨瓦夫', 'poznań', '波兹南', 'gdansk', '格但斯克', 'gdynia', '格丁尼亚', 'szczecin', '什切青', 'bydgoszcz', '比得哥什', 'lublin', '卢布林', 'katowice', '卡托维兹', 'białystok', '比亚韦斯托克'] },

  // 捷克语
  { language: 'cs', name: 'Czech', keywords: ['捷克', 'czech', 'czech republic', 'cz', 'česko', 'prague', '布拉格', 'praha', 'brno', '布尔诺', 'ostrava', '俄斯特拉发', 'plzeň', '比尔森', 'liberec', '利贝雷茨', 'olomouc', '奥洛穆茨', 'budějovice', '布杰约维采', 'hradec', '赫拉德茨', 'pardubice', '帕尔杜比采'] },

  // 匈牙利语
  { language: 'hu', name: 'Hungarian', keywords: ['匈牙利', 'hungary', 'hu', 'magyarország', 'budapest', '布达佩斯', 'debrecen', '德布勒森', 'szeged', '塞格德', 'miskolc', '米什科尔茨', 'pécs', '佩奇', 'győr', '杰尔', 'nyíregyháza', '尼赖吉哈佐', 'kecskemét', '凯奇凯梅特', 'székesfehérvár', '塞克什白堡'] },

  // 罗马尼亚语
  { language: 'ro', name: 'Romanian', keywords: ['罗马尼亚', 'romania', 'ro', 'românia', 'bucharest', '布加勒斯特', 'bucurești', 'cluj-napoca', '克卢日-纳波卡', 'timișoara', '蒂米什瓦拉', 'iași', '雅西', 'constanța', '康斯坦察', 'craiova', '克拉约瓦', 'brașov', '布拉索夫', 'galati', '加拉茨', 'ploiești', '普洛耶什蒂', 'brasov', '布拉索夫'] },

  // 土耳其语
  { language: 'tr', name: 'Turkish', keywords: ['土耳其', 'turkey', 'tr', 'türkiye', 'istanbul', '伊斯坦布尔', 'ankara', '安卡拉', 'izmir', '伊兹密尔', 'bursa', '布尔萨', 'antalya', '安塔利亚', 'adana', '阿达纳', 'gaziantep', '加济安泰普', 'konya', '科尼亚', 'mersin', '梅尔辛', 'eskisehir', '埃斯基谢希尔', 'samsun', '萨姆松', 'diyarbakir', '迪亚巴克尔'] },

  // 俄语
  { language: 'ru', name: 'Russian', keywords: ['俄罗斯', 'russia', 'ru', 'россия', 'moscow', '莫斯科', 'moskva', 'saint petersburg', '圣彼得堡', 'sankt-peterburg', 'novosibirsk', '新西伯利亚', 'yekaterinburg', '叶卡捷琳堡', 'nizhny novgorod', '下诺夫哥罗德', 'kazan', '喀山', 'chelyabinsk', '车里雅宾斯克', 'omsk', '鄂木斯克', 'samara', '萨马拉', 'rostov-on-don', '顿河畔罗斯托夫', 'ufa', '乌法'] },

  // 越南语
  { language: 'vi', name: 'Vietnamese', keywords: ['越南', 'vietnam', 'vn', 'hanoi', '河内', 'hà nội', 'ho chi minh city', '胡志明市', 'thành phố hồ chí minh', 'hai phong', '海防', 'hải phòng', 'da nang', '岘港', 'đà nẵng', 'can tho', '芹苴', 'cần thơ', 'hue', '顺化', 'huế', 'nha trang', '芽庄', 'quang ninh', '广宁'] },

  // 泰语
  { language: 'th', name: 'Thai', keywords: ['泰国', 'thailand', 'th', 'ประเทศไทย', 'bangkok', '曼谷', 'กรุงเทพมหานคร', 'chon buri', '春武里', 'ชลบุรี', 'phuket', '普吉', 'ภูเก็ต', 'chiang mai', '清迈', 'เชียงใหม่', 'pattaya', '芭提雅', 'พัทยา', 'hat yai', '合艾', 'หาดใหญ่', 'khon kaen', '孔敬', 'ขอนแก่น', 'nakhon ratchasima', '那空叻差是玛', 'นครราชสีมา'] },

  // 印尼语
  { language: 'id', name: 'Indonesian', keywords: ['印尼', '印度尼西亚', 'indonesia', 'id', 'jakarta', '雅加达', 'surabaya', '泗水', 'bandung', '万隆', 'medan', '棉兰', 'bekasi', '勿加泗', 'semarang', '三宝垄', 'tangerang', '丹格朗', 'makassar', '望加锡', 'south tangerang', '南丹格朗', 'tangerang selatan', 'bogor', '茂物', 'malang', '玛琅', 'padang', '巴东'] },

  // 马来语
  { language: 'ms', name: 'Malay', keywords: ['马来西亚', 'malaysia', 'my', 'kuala lumpur', '吉隆坡', 'george town', '乔治市', 'ipoh', '怡保', 'shah alam', '沙阿南', 'petaling jaya', '八打灵再也', 'johor bahru', '新山', 'malacca', '马六甲', 'kuching', '古晋', 'kinabalu', '基纳巴卢', 'kota kinabalu', '亚庇', 'seremban', '芙蓉', 'klang', '巴生'] },

  // 阿拉伯语
  { language: 'ar', name: 'Arabic', keywords: ['阿拉伯', 'arabic', 'saudi arabia', '沙特阿拉伯', 'sa', 'السعودية', 'riyadh', '利雅得', 'الرياض', 'jeddah', '吉达', 'جدة', 'mecca', '麦加', 'مكة', 'medina', '麦地那', 'المدينة', 'united arab emirates', '阿联酋', 'uae', 'dubai', '迪拜', 'دبي', 'abu dhabi', '阿布扎比', 'أبو ظبي', 'sharjah', '沙迦', 'الشارقة', 'ajman', '阿治曼', 'عجمان', 'qatar', '卡塔尔', 'qa', 'doha', '多哈', 'الدوحة', 'kuwait', '科威特', 'kw', 'الكويت', 'kuwait city', '科威特城', 'مدينة الكويت', 'oman', '阿曼', 'om', 'muscat', '马斯喀特', 'مسقط', 'bahrain', '巴林', 'bh', 'manama', '麦纳麦', 'المنامة'] }
];

/**
 * 检测商户地址的语言
 * @param {string} address - 商户地址
 * @returns {string} - 语言代码 (zh, en, ja, ko, de, fr, es, it, pt, nl, sv, no, da, fi, pl, cs, hu, ro, tr, ru, vi, th, id, ms, ar)
 */
function detectLanguage(address) {
  if (!address) {
    return 'zh'; // 默认中文
  }

  const addr = address.toLowerCase();

  // 优先检查精确匹配
  for (const rule of languageRules) {
    for (const keyword of rule.keywords) {
      // 检查是否包含完整的关键词（不是部分匹配）
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(addr)) {
        return rule.language;
      }
    }
  }

  return 'zh'; // 默认中文
}

/**
 * 获取语言名称
 * @param {string} languageCode - 语言代码
 * @returns {string} - 语言名称
 */
function getLanguageName(languageCode) {
  const rule = languageRules.find(r => r.language === languageCode);
  return rule ? rule.name : 'Chinese';
}

/**
 * 构建邮件 Prompt
 * @param {Object} merchant - 商户信息
 * @param {Object} userProfile - 用户资料
 * @param {string} language - 语言代码
 * @returns {string} - Prompt
 */
function buildEmailPrompt(merchant, userProfile, language) {
  const merchantInfo = `
商户名称：${merchant['商户名称'] || 'N/A'}
创始人：${merchant['创始人'] || 'N/A'}
业务亮点：${merchant['业务亮点'] || 'N/A'}
电子邮箱：${merchant['电子邮箱'] || 'N/A'}
地址：${merchant['验证地址'] || 'N/A'}
联系电话：${merchant['联系电话'] || 'N/A'}
官方网站：${merchant['官方链接'] || 'N/A'}
`;

  const senderInfo = `
发件人姓名：${userProfile?.姓名 || 'N/A'}
发件人职位：${userProfile?.职位 || 'N/A'}
发件人邮箱：${userProfile?.邮箱 || 'N/A'}
发件人电话：${userProfile?.电话 || 'N/A'}
公司名称：${userProfile?.公司名称 || 'N/A'}
公司业务：${userProfile?.公司业务 || 'N/A'}
公司网址：${userProfile?.公司网址 || 'N/A'}
公司地址：${userProfile?.公司地址 || 'N/A'}
`;

  // 根据语言生成不同的 prompt
  const prompts = {
    zh: `${merchantInfo}
${senderInfo}

请生成中文商务合作邀请邮件。
要求：
1. 如果发件人信息为 "N/A"，请跳过该字段，不要在邮件中包含该信息
2. 不要编造任何不存在的信息
3. 使用专业的商务语气
4. 邮件内容要简洁明了，突出合作价值

格式：
主题：[主题]
称呼：[称呼]
正文：[内容]
结尾：[结尾]
签名：[签名]`,

    en: `${merchantInfo}
${senderInfo}

Please generate a business partnership invitation email in English.
Requirements:
1. If sender information is "N/A", skip that field - do not include it in the email
2. Do not fabricate any non-existent information
3. Use professional business tone
4. Keep email content concise and highlight partnership value

Format:
Subject: [Subject]
Salutation: [Salutation]
Body: [Content]
Closing: [Closing]
Signature: [Signature]`,

    ja: `${merchantInfo}
${senderInfo}

日本語のビジネスパートナーシップ招待メールを生成してください。
要件：
1. 送信者情報が "N/A" の場合、そのフィールドをスキップし、メールに含めないでください
2. 存在しない情報を作成しないでください
3. 専門的なビジネストーンを使用してください
4. メールの内容を簡潔にし、パートナーシップの価値を強調してください

フォーマット：
件名：[件名]
宛名：[宛名]
本文：[本文]
結び：[結び]
署名：[署名]`,

    ko: `${merchantInfo}
${senderInfo}

한국어 비즈니스 파트너십 초대 이메일을 생성하세요.
요구사항:
1. 발신자 정보가 "N/A"인 경우 해당 필드를 건너뛰고 이메일에 포함하지 마세요
2. 존재하지 않는 정보를 만들지 마세요
3. 전문적인 비즈니스 톤을 사용하세요
4. 이메일 내용을 간결하게 유지하고 파트너십의 가치를 강조하세요

형식:
제목: [제목]
호칭: [호칭]
본문: [본문]
마무리: [마무리]
서명: [서명]`,

    de: `${merchantInfo}
${senderInfo}

Erstellen Sie eine geschäftliche Partnerschaftseinladung auf Deutsch.
Anforderungen:
1. Wenn Absenderinformationen "N/A" sind, überspringen Sie dieses Feld und fügen Sie es nicht in die E-Mail ein
2. Erfinden Sie keine nicht existierenden Informationen
3. Verwenden Sie einen professionellen Geschäftston
4. Halten Sie den E-Mail-Inhalt prägnant und heben Sie den Partnerschaftswert hervor

Format:
Betreff: [Betreff]
Anrede: [Anrede]
Text: [Text]
Grußformel: [Grußformel]
Signatur: [Signatur]`,

    fr: `${merchantInfo}
${senderInfo}

Générez un email d'invitation de partenariat commercial en français.
Exigences:
1. Si les informations de l'expéditeur sont "N/A", ignorez ce champ et ne l'incluez pas dans l'email
2. Ne fabriquez aucune information inexistante
3. Utilisez un ton professionnel
4. Gardez le contenu de l'email concis et mettez en valeur la proposition de partenariat

Format:
Sujet: [Sujet]
Salutation: [Salutation]
Corps: [Corps]
Formule de politesse: [Formule de politesse]
Signature: [Signature]`,

    es: `${merchantInfo}
${senderInfo}

Genere un correo de invitación de alianza comercial en español.
Requisitos:
1. Si la información del remitente es "N/A", omita ese campo y no lo incluya en el correo
2. No fabrique información que no exista
3. Use un tono profesional
4. Mantenga el contenido del correo conciso y destaque el valor de la alianza

Formato:
Asunto: [Asunto]
Saludo: [Saludo]
Cuerpo: [Cuerpo]
Cierre: [Cierre]
Firma: [Firma]`,

    it: `${merchantInfo}
${senderInfo}

Generare un'email di invito alla partnership commerciale in italiano.
Requisiti:
1. Se le informazioni del mittente sono "N/A", saltare quel campo e non includerlo nell'email
2. Non inventare informazioni inesistenti
3. Usare un tono professionale
4. Mantenere il contenuto dell'email conciso ed evidenziare il valore della partnership

Formato:
Oggetto: [Oggetto]
Saluto: [Saluto]
Corpo: [Corpo]
Chiusura: [Chiusura]
Firma: [Firma]`,

    pt: `${merchantInfo}
${senderInfo}

Gerar um e-mail de convite para parceria comercial em português.
Requisitos:
1. Se as informações do remetente forem "N/A", omita esse campo e não o inclua no e-mail
2. Não invente informações inexistentes
3. Use um tom profissional
4. Mantenha o conteúdo do e-mail conciso e destaque o valor da parceria

Formato:
Assunto: [Assunto]
Saudação: [Saudação]
Corpo: [Corpo]
Fecho: [Fecho]
Assinatura: [Assinatura]`,

    nl: `${merchantInfo}
${senderInfo}

Genereer een zakelijke uitnodiging voor partnerschap in het Nederlands.
Vereisten:
1. Als de informatie van de afzender "N/A" is, sla dat veld over en neem het niet op in de e-mail
2. Verzin geen niet-bestaande informatie
3. Gebruik een professionele toon
4. Houd de inhoud van de e-mail beknopt en benadruk de waarde van de partnerschap

Formaat:
Onderwerp: [Onderwerp]
Aanhef: [Aanhef]
Tekst: [Tekst]
Groet: [Groet]
Handtekening: [Handtekening]`,

    sv: `${merchantInfo}
${senderInfo}

Generera ett företagsinbjudningsmejl på svenska.
Krav:
1. Om avsändarinformationen är "N/A", hoppa över det fältet och inkludera det inte i mejlet
2. Uppfin inte ingen information som inte finns
3. Använd en professionell ton
4. Håll mejlinnehållet koncist och lyft fram partnerskapets värde

Format:
Ämne: [Ämne]
Hälsning: [Hälsning]
Text: [Text]
Avslut: [Avslut]
Underskrift: [Underskrift]`,

    no: `${merchantInfo}
${senderInfo}

Generer en forretningsinvitasjon på norsk.
Krav:
1. Hvis avsenderinformasjonen er "N/A", hopp over det feltet og inkluder det ikke i e-posten
2. Ikke oppfinn informasjon som ikke finnes
3. Bruk en profesjonell tone
4. Hold e-postinnholdet konsist og fremhev partnerskapets verdi

Format:
Emne: [Emne]
Hilsen: [Hilsen]
Tekst: [Tekst]
Avslutning: [Avslutning]
Underskrift: [Underskrift]`,

    da: `${merchantInfo}
${senderInfo}

Generer en forretningsinvitation på dansk.
Krav:
1. Hvis afsenderoplysningerne er "N/A", spring over det felt og medtag det ikke i e-mailen
2. Opfind ikke oplysninger, der ikke findes
3. Brug en professionel tone
4. Hold e-mailindholdet kortfattet og fremhæv partnerskabets værdi

Format:
Emne: [Emne]
Hilsen: [Hilsen]
Tekst: [Tekst]
Afslutning: [Afslutning]
Underskrift: [Underskrift]`,

    fi: `${merchantInfo}
${senderInfo}

Luo kaupallinen kumppanuuskutsu suomeksi.
Vaatimukset:
1. Jos lähettäjän tiedot ovat "N/A", ohita se kenttä ja älä sisällytä sitä sähköpostiin
2. Älä keksi tietoja, joita ei ole olemassa
3. Käytä ammattimaista sävyä
4. Pidä sähköpostin sisältö tiivistettynä ja korosta kumppanuuden arvoa

Muoto:
Aihe: [Aihe]
Tervehdys: [Tervehdys]
Teksti: [Teksti]
Lopetus: [Lopetus]
Allekirjoitus: [Allekirjoitus]`,

    pl: `${merchantInfo}
${senderInfo}

Wygeneruj zaproszenie o współpracę biznesową w języku polskim.
Wymagania:
1. Jeśli informacje o nadawcy to "N/A", pomiń to pole i nie umieszczaj go w e-mailu
2. Nie wymyślaj nieistniejących informacji
3. Użyj profesjonalnego tonu
4. Zachowaj treść e-maila zwięzłą i podkreśl wartość współpracy

Format:
Temat: [Temat]
Powitanie: [Powitanie]
Treść: [Treść]
Zakończenie: [Zakończenie]
Podpis: [Podpis]`,

    cs: `${merchantInfo}
${senderInfo}

Vygenerujte obchodní pozvánku k partnerství v češtině.
Požadavky:
1. Pokud jsou informace o odesílateli "N/A", přeskočte toto pole a nezahrnujte jej do e-mailu
2. Nevymýšlejte neexistující informace
3. Použijte profesionální tón
4. Udržujte obsah e-mailu stručný a zdůrazněte hodnotu partnerství

Formát:
Předmět: [Předmět]
Oslovení: [Oslovení]
Text: [Text]
Ukončení: [Ukončení]
Podpis: [Podpis]`,

    hu: `${merchantInfo}
${senderInfo}

Generáljon üzleti partnerség meghívást magyarul.
Követelmények:
1. Ha a feladó adatai "N/A", hagyja ki ezt a mezőt és ne tartalmazza az e-mailben
2. Ne találjon ki nem létező információkat
3. Használjon professzionális hangnemet
4. Tartsa az e-mail tartalmát tömör és emelje ki a partnerség értékét

Formátum:
Tárgy: [Tárgy]
Megszólítás: [Megszólítás]
Szöveg: [Szöveg]
Lezárás: [Lezárás]
Aláírás: [Aláírás]`,

    ro: `${merchantInfo}
${senderInfo}

Generați o invitație de parteneriat comercial în limba română.
Cerințe:
1. Dacă informațiile despre expeditor sunt "N/A", omiteți acest câmp și nu îl includeți în e-mail
2. Nu inventați informații care nu există
3. Folosiți un ton profesional
4. Păstrați conținutul e-mailului concis și evidențiați valoarea parteneriatului

Format:
Subiect: [Subiect]
Salut: [Salut]
Corp: [Corp]
Încheiere: [Încheiere]
Semnătură: [Semnătură]`,

    tr: `${merchantInfo}
${senderInfo}

Türkçe bir iş ortaklığı daveti e-postası oluşturun.
Gereksinimler:
1. Gönderici bilgileri "N/A" ise, bu alanı atlayın ve e-postaya dahil etmeyin
2. Var olmayan bilgileri uydurmayın
3. Profesyonel bir ton kullanın
4. E-posta içeriğini öz tutun ve ortaklığın değerini vurgulayın

Format:
Konu: [Konu]
Selamlama: [Selamlama]
Metin: [Metin]
Kapanış: [Kapanış]
İmza: [İmza]`,

    ru: `${merchantInfo}
${senderInfo}

Создайте приглашение к деловому партнерству на русском языке.
Требования:
1. Если информация об отправителе "N/A", пропустите это поле и не включайте его в письмо
2. Не придумывайте несуществующую информацию
3. Используйте профессиональный тон
4. Содержание письма должно быть кратким и подчеркивать ценность партнерства

Формат:
Тема: [Тема]
Приветствие: [Приветствие]
Текст: [Текст]
Завершение: [Завершение]
Подпись: [Подпись]`,

    vi: `${merchantInfo}
${senderInfo}

Tạo thư mời hợp tác kinh doanh bằng tiếng Việt.
Yêu cầu:
1. Nếu thông tin người gửi là "N/A", hãy bỏ qua trường đó và không bao gồm nó trong email
2. Đừng bịa đặt thông tin không tồn tại
3. Sử dụng giọng điệu chuyên nghiệp
4. Giữ nội dung email ngắn gọn và làm nổi bật giá trị hợp tác

Định dạng:
Chủ đề: [Chủ đề]
Lời chào: [Lời chào]
Nội dung: [Nội dung]
Kết thúc: [Kết thúc]
Chữ ký: [Chữ ký]`,

    th: `${merchantInfo}
${senderInfo}

สร้างอีเมลเชิญชวนความร่วมมือทางธุรกิจเป็นภาษาไทย
ข้อกำหนด:
1. หากข้อมูลผู้ส่งเป็น "N/A" ให้ข้ามฟิลด์นั้นและไม่รวมในอีเมล
2. อย่าสร้างข้อมูลที่ไม่มีอยู่จริง
3. ใช้โทนเสียงมืออาชีพ
4. เก็บเนื้อหาอีเมลให้กระชับและเน้นคุณค่าของความร่วมมือ

รูปแบบ:
หัวข้อ: [หัวข้อ]
คำนำ: [คำนำ]
เนื้อหา: [เนื้อหา]
จบ: [จบ]
ลายเซ็น: [ลายเซ็น]`,

    id: `${merchantInfo}
${senderInfo}

Buat undangan kemitraan bisnis dalam bahasa Indonesia.
Persyaratan:
1. Jika informasi pengirim adalah "N/A", lewati kolom tersebut dan jangan masukkan dalam email
2. Jangan buat informasi yang tidak ada
3. Gunakan nada profesional
4. Jaga konten email ringkas dan soroti nilai kemitraan

Format:
Subjek: [Subjek]
Salam: [Salam]
Isi: [Isi]
Penutup: [Penutup]
Tanda Tangan: [Tanda Tangan]`,

    ms: `${merchantInfo}
${senderInfo}

Buat jemputan perkongsian perniagaan dalam bahasa Melayu.
Keperluan:
1. Jika maklumat penghantar adalah "N/A", langkau medan itu dan jangan masukkan dalam e-mel
2. Jangan cipta maklumat yang tidak wujud
3. Gunakan nada profesional
4. Kekalkan kandungan e-mel ringkas dan soroti nilai perkongsian

Format:
Subjek: [Subjek]
Salam: [Salam]
Isi: [Isi]
Penutup: [Penutup]
Tandatangan: [Tandatangan]`,

    ar: `${merchantInfo}
${senderInfo}

أنشئ دعوة شراكة تجارية باللغة العربية.
المتطلبات:
1. إذا كانت معلومات المرسل "N/A"، فتخطى هذا الحقل ولا تقم بتضمينه في البريد الإلكتروني
2. لا تخترع معلومات غير موجودة
3. استخدم نبرة مهنية
4. اجعل محتوى البريد الإلكتروني موجزًا وأبرز قيمة الشراكة

التنسيق:
الموضوع: [الموضوع]
التحية: [التحية]
النص: [النص]
الختام: [الختام]
التوقيع: [التوقيع]`
  };

  return prompts[language] || prompts['zh'];
}

module.exports = {
  detectLanguage,
  getLanguageName,
  buildEmailPrompt
};
