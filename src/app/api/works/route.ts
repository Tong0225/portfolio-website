import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// 简单哈希函数
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// 内存存储
let works: any[] = [];
let menus: any[] = [];
let adminPassword: string | null = hashPassword("0000");
let protectionPassword: string | null = hashPassword("0000");
let passwordEnabled = false;

// GitHub 数据文件路径
const WORKS_FILE = "data/works.json";
const MENUS_FILE = "data/menus.json";
const AUTH_FILE = "data/auth.json";

// GitHub API 配置 - Token 通过环境变量设置
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Tong0225';
const GITHUB_REPO = process.env.GITHUB_REPO || 'portfolio-website';

// 验证管理密码
function verifyAdminPassword(password: string): boolean {
  return hashPassword(password) === adminPassword;
}

// 验证保护密码
function verifyProtectionPassword(password: string): boolean {
  return hashPassword(password) === protectionPassword;
}

// 获取文件 SHA
async function getFileSha(path: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data.sha;
    }
    return null;
  } catch {
    return null;
  }
}

// 保存数据到 GitHub
async function saveToGitHub(path: string, content: string, message: string): Promise<boolean> {
  try {
    const sha = await getFileSha(path);
    const body: Record<string, unknown> = {
      message,
      content: Buffer.from(content).toString('base64'),
    };
    if (sha) body.sha = sha;

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

// 从 GitHub 读取数据
async function readFromGitHub(path: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch {
    return null;
  }
}

// 初始化默认作品
const defaultWorks = [
  { id: "1", title: "城市建筑摄影系列", category: "image", subcategory: "摄像", type: "image", description: "城市建筑线条与光影的探索", preview: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", cloudUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=90", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "2", title: "纪录片《手艺人生》", category: "video", subcategory: "导演", type: "video", description: "记录传统手工艺人的坚守与传承 - 请粘贴您的B站/YouTube视频链接", preview: "", cloudUrl: "", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "3", title: "环保主题海报设计", category: "image", subcategory: "海报", type: "image", description: "呼吁保护海洋生态的视觉设计", preview: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80", cloudUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1920&q=90", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "4", title: "深度报道《数字时代的乡村》", category: "text", subcategory: "文章", type: "document", description: "探讨数字化转型对乡村发展的影响 - 请粘贴微信公众号文章链接", preview: "", cloudUrl: "", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "5", title: "国际摄影大赛金奖", category: "award", subcategory: "获奖作品", type: "image", description: "2025国际自然摄影大赛金奖作品", preview: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80", cloudUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=90", createdAt: Date.now(), updatedAt: Date.now() },
];

const defaultMenus = [
  { id: "all", name: "全部作品", type: "all", value: "all", order: 0, enabled: true },
  { id: "image", name: "图片", type: "type", value: "image", order: 1, enabled: true },
  { id: "video", name: "视频", type: "type", value: "video", order: 2, enabled: true },
  { id: "document", name: "文档", type: "type", value: "document", order: 3, enabled: true },
  { id: "other", name: "其他", type: "type", value: "other", order: 4, enabled: true },
];

// 从 GitHub 加载数据
async function loadData() {
  try {
    const worksData = await readFromGitHub(WORKS_FILE);
    if (worksData) {
      works = JSON.parse(worksData);
    } else {
      works = [...defaultWorks];
      await saveToGitHub(WORKS_FILE, JSON.stringify(works, null, 2), "初始化作品数据");
    }

    const menusData = await readFromGitHub(MENUS_FILE);
    if (menusData) {
      const parsed = JSON.parse(menusData);
      // 确保是数组
      menus = Array.isArray(parsed) ? parsed : (parsed.menus || []);
    } else {
      menus = [...defaultMenus];
      await saveToGitHub(MENUS_FILE, JSON.stringify(menus, null, 2), "初始化菜单数据");
    }

    const authData = await readFromGitHub(AUTH_FILE);
    if (authData) {
      const auth = JSON.parse(authData);
      adminPassword = auth.adminPassword || hashPassword("0000");
      protectionPassword = auth.protectionPassword || hashPassword("0000");
      passwordEnabled = auth.passwordEnabled || false;
    }
  } catch {
    works = [...defaultWorks];
    menus = [...defaultMenus];
  }
}

// 初始化数据
loadData();

export { works, menus, adminPassword, protectionPassword, passwordEnabled, verifyAdminPassword, verifyProtectionPassword, saveToGitHub, readFromGitHub, WORKS_FILE, MENUS_FILE };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const type = searchParams.get("type");
  const search = searchParams.get("search")?.toLowerCase();

  // 重新加载数据确保最新
  await loadData();

  let filteredWorks = works;

  // 按类型筛选（图片/视频/文档）
  if (type && type !== "全部" && type !== "all") {
    filteredWorks = filteredWorks.filter((w) => w.type === type);
  }

  // 按分类筛选
  if (category && category !== "全部" && category !== "all") {
    filteredWorks = filteredWorks.filter((w) => w.category === category);
  }

  // 按子分类筛选
  if (subcategory && subcategory !== "全部") {
    filteredWorks = filteredWorks.filter((w) => w.subcategory === subcategory);
  }

  // 搜索
  if (search) {
    filteredWorks = filteredWorks.filter(
      (w) =>
        w.title.toLowerCase().includes(search) ||
        w.description.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    success: true,
    data: filteredWorks,
    total: filteredWorks.length,
    menus: menus,
    passwordRequired: passwordEnabled,
  });
}

export async function POST(request: NextRequest) {
  try {
    if (passwordEnabled) {
      const authHeader = request.headers.get("x-admin-password");
      if (!authHeader || !verifyAdminPassword(authHeader)) {
        return NextResponse.json({ success: false, error: "需要管理密码验证" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { action } = body;

    // 处理菜单操作
    if (action === "addMenu") {
      const { name, type, value } = body;
      const newMenu = {
        id: uuidv4(),
        name,
        type: type || "type",
        value: value || name,
        order: menus.length,
        enabled: true,
      };
      menus.push(newMenu);
      const saved = await saveToGitHub(MENUS_FILE, JSON.stringify(menus, null, 2), `添加菜单: ${name}`);
      return NextResponse.json({ success: saved, data: newMenu });
    }

    if (action === "updateMenu") {
      const { id, ...updates } = body;
      const index = menus.findIndex((m) => m.id === id);
      if (index === -1) return NextResponse.json({ success: false, error: "菜单不存在" }, { status: 404 });
      menus[index] = { ...menus[index], ...updates };
      const saved = await saveToGitHub(MENUS_FILE, JSON.stringify(menus, null, 2), `更新菜单: ${menus[index].name}`);
      return NextResponse.json({ success: saved, data: menus[index] });
    }

    if (action === "deleteMenu") {
      const { id } = body;
      const index = menus.findIndex((m) => m.id === id);
      if (index === -1) return NextResponse.json({ success: false, error: "菜单不存在" }, { status: 404 });
      const deleted = menus.splice(index, 1)[0];
      const saved = await saveToGitHub(MENUS_FILE, JSON.stringify(menus, null, 2), `删除菜单: ${deleted.name}`);
      return NextResponse.json({ success: saved, message: "删除成功" });
    }

    // 添加作品
    const { title, category, subcategory, type, description, preview, cloudUrl, fileKey } = body;
    if (!title) return NextResponse.json({ success: false, error: "标题不能为空" }, { status: 400 });

    const newWork = {
      id: uuidv4(),
      title,
      category: category || "other",
      subcategory: subcategory || "其他",
      type: type || "other",
      description: description || "",
      preview: preview || "",
      cloudUrl: cloudUrl || "",
      fileKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    works.unshift(newWork);
    const saved = await saveToGitHub(WORKS_FILE, JSON.stringify(works, null, 2), `添加作品: ${title}`);
    return NextResponse.json({ success: saved, data: newWork });
  } catch (error) {
    return NextResponse.json({ success: false, error: "操作失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (passwordEnabled) {
      const authHeader = request.headers.get("x-admin-password");
      if (!authHeader || !verifyAdminPassword(authHeader)) {
        return NextResponse.json({ success: false, error: "需要管理密码验证" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { id, ...updates } = body;
    const index = works.findIndex((w) => w.id === id);
    if (index === -1) return NextResponse.json({ success: false, error: "作品不存在" }, { status: 404 });

    works[index] = { ...works[index], ...updates, updatedAt: Date.now() };
    const saved = await saveToGitHub(WORKS_FILE, JSON.stringify(works, null, 2), `更新作品: ${works[index].title}`);
    return NextResponse.json({ success: saved, data: works[index] });
  } catch (error) {
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (passwordEnabled) {
      const authHeader = request.headers.get("x-admin-password");
      if (!authHeader || !verifyAdminPassword(authHeader)) {
        return NextResponse.json({ success: false, error: "需要管理密码验证" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "缺少ID" }, { status: 400 });

    const index = works.findIndex((w) => w.id === id);
    if (index === -1) return NextResponse.json({ success: false, error: "作品不存在" }, { status: 404 });

    const deleted = works.splice(index, 1)[0];
    const saved = await saveToGitHub(WORKS_FILE, JSON.stringify(works, null, 2), `删除作品: ${deleted.title}`);
    return NextResponse.json({ success: saved, message: "删除成功" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
