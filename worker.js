// 1. 引入刚才安装的 cheerio 库（把它当成 Node.js 版的 jQuery）
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });// 自动读取环境变量
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase（读取你 .env.local 里的配置）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. 写一个异步函数，专门用来抓取网页
async function fetchAndSaveJob() {
  try {
    const url = 'https://example.com'; // 换成你想抓的网址
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 假设我们提取到了这些数据（真实场景你要根据网页的 HTML 结构用 $('.class') 去找）
    // 这里我们先手动造假数据来测试入库流程
    const jobData = {
      company: '测试科技有限公司',
      position: '前端开发工程师',
      location: '北京',
      source: url,
      url: url
    };

    console.log('提取到数据：', jobData);
    await saveToDatabase(jobData);

  } catch (error) {
    console.error('抓取失败：', error);
  }
}
async function saveToDatabase(job) {
  console.log('正在存入数据库...');
  
  // 向 jobs 表插入数据
  const { data, error } = await supabase
    .from('jobs')
    .insert([job])
    .select();

  if (error) {
    console.error('❌ 存入失败，报错信息：', error.message);
  } else {
    console.log('✅ 存入成功！数据ID：', data[0].id);
  }
}

// 5. 执行测试：随便拿一个允许爬取的网站练手（比如百度或我们学校的官网）
// 这里用 example.com，这是一个专门用来给开发者做测试的网站，绝对不会封你 IP

fetchAndSaveJob();