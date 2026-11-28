/**
 * 版本二：抓取「24365 国家大学生就业服务平台」(ncss.cn) 校招职位 → 存入 Supabase
 *
 * 为什么选它：
 *   - 教育部官方平台，纯校招/实习岗位，正好对应「校招雷达」
 *   - 公开 JSON 接口，免登录、免签名、免验证码，返回的就是结构化中文数据（无需翻译）
 *
 * 接口（已实测可用）：
 *   GET https://www.ncss.cn/student/jobs/jobslist/ajax/
 *   参数：areaCode 省份代码 | jobName 职位关键词 | offset 页码(从1开始) | limit 每页条数(上限20)
 *        sourcesName=0 只看官方来源
 *   详情页：https://www.ncss.cn/student/jobs/{jobId}/detail.html
 *
 * 依赖：npm i dotenv @supabase/supabase-js
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 想抓的省份（GB/T 2260 前两位），留空数组表示只抓默认的几个
const AREA_CODES = {
  北京: '11', 天津: '12', 河北: '13', 山西: '14', 内蒙古: '15',
  辽宁: '21', 吉林: '22', 黑龙江: '23', 上海: '31', 江苏: '32', 浙江: '33',
  安徽: '34', 福建: '35', 江西: '36', 山东: '37', 河南: '41', 湖北: '42',
  湖南: '43', 广东: '44', 广西: '45', 海南: '46', 重庆: '50', 四川: '51',
  贵州: '52', 云南: '53', 陕西: '61', 甘肃: '62',
};

const TARGET_PROVINCES = ['北京', '上海', '广东', '浙江', '江苏']; // 改成你想抓的省份
const KEYWORD = ''; // 职位关键词，如 '前端'、'算法'，留空抓全部
const PAGE_SIZE = 20; // 官方单页上限就是 20
const MAX_PAGES = 5; // 每个省份最多翻几页

const API_URL = 'https://www.ncss.cn/student/jobs/jobslist/ajax/';
const DETAIL_URL = (jobId) => `https://www.ncss.cn/student/jobs/${jobId}/detail.html`;
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Referer: 'https://www.ncss.cn/student/jobs/index.html',
  Accept: 'application/json, text/plain, */*',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- 抓取

async function fetchProvince(provinceName) {
  const areaCode = AREA_CODES[provinceName];
  if (!areaCode) {
    console.error(`❌ 未知省份：${provinceName}`);
    return [];
  }

  const jobs = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({
      jobType: '',
      areaCode,
      jobName: KEYWORD,
      monthPay: '',
      industrySectors: '',
      property: '',
      categoryCode: '',
      memberLevel: '',
      recruitType: '',
      offset: String(page),
      limit: String(PAGE_SIZE),
      keyUnits: '',
      degreeCode: '',
      sourcesName: '0',
      sourcesType: '',
      _: String(Date.now()),
    });

    let data;
    try {
      const res = await fetch(`${API_URL}?${params}`, { headers: HEADERS });
      data = await res.json();
    } catch (error) {
      console.error(`❌ ${provinceName} 第 ${page} 页请求失败：`, error.message);
      break;
    }

    if (!data.flag) break;
    const list = data.data?.list || [];
    if (list.length === 0) break;

    jobs.push(...list.map((item) => normalize(item, provinceName)));

    // 已经翻到最后一页
    const total = data.data?.pagenation?.count || 0;
    if (page * PAGE_SIZE >= total || list.length < PAGE_SIZE) break;

    await sleep(300); // 礼貌限频
  }

  console.log(`🔎 ${provinceName}：抓取到 ${jobs.length} 条`);
  return jobs;
}

/** 把官方字段映射成 jobs 表的五列（与版本一保持同一套结构） */
function normalize(item, provinceName) {
  return {
    company: item.recName || '',
    position: item.jobName || '',
    location: item.areaCodeName || provinceName,
    source: '24365 校招',
    url: DETAIL_URL(item.jobId),
  };
}

// ---------------------------------------------------------------- 入库

async function saveToDatabase(jobsArray) {
  console.log(`正在存入数据库 (${jobsArray.length} 条)...`);
  let inserted = 0;

  for (const job of jobsArray) {
    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('url', job.url)
      .limit(1);

    if (existing && existing.length > 0) continue; // 跳过已存在的

    const { error } = await supabase.from('jobs').insert([job]);
    if (error) {
      console.error(`❌ 存入失败:`, error.message);
    } else {
      inserted++;
      console.log(`✅ 成功存入: ${job.company} / ${job.position} / ${job.location}`);
    }
  }
  console.log(`🎉 完成，本次新增 ${inserted} 条。`);
}

// ---------------------------------------------------------------- 入口

async function main() {
  console.log('🚀 校招雷达 Worker 已启动（24365 国家大学生就业服务平台）！');

  const all = [];
  for (const province of TARGET_PROVINCES) {
    all.push(...(await fetchProvince(province)));
  }

  if (all.length === 0) {
    console.log('ℹ️ 没有抓到数据，任务结束。');
    return;
  }
  await saveToDatabase(all);
}

main();
