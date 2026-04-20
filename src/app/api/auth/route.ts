import { NextRequest, NextResponse } from "next/server";

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

// GitHub 配置 - Token 通过环境变量设置
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Tong0225';
const GITHUB_REPO = process.env.GITHUB_REPO || 'portfolio-website';
const AUTH_FILE = 'data/auth.json';

// 内存存储
let adminPassword: string | null = hashPassword("0000");
let protectionPassword: string | null = hashPassword("0000");
let passwordEnabled = false;

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

// 保存认证状态
async function saveAuthState() {
  const authData = {
    adminPassword,
    protectionPassword,
    passwordEnabled,
    updatedAt: Date.now(),
  };
  await saveToGitHub(AUTH_FILE, JSON.stringify(authData, null, 2), '更新密码设置');
}

// 加载认证状态
async function loadAuthState() {
  try {
    const data = await readFromGitHub(AUTH_FILE);
    if (data) {
      const auth = JSON.parse(data);
      adminPassword = auth.adminPassword || hashPassword("0000");
      protectionPassword = auth.protectionPassword || hashPassword("0000");
      passwordEnabled = auth.passwordEnabled || false;
    }
  } catch {
    // 使用默认值
  }
}

// 初始化
loadAuthState();

export async function GET() {
  await loadAuthState();
  return NextResponse.json({
    success: true,
    data: {
      enabled: passwordEnabled,
      hasAdminPassword: !!adminPassword,
      hasProtectionPassword: !!protectionPassword,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    await loadAuthState();
    const body = await request.json();
    const { action, password, currentPassword, protectionPwd } = body;

    if (action === "setAdmin") {
      if (!password || password.length < 4) {
        return NextResponse.json({ success: false, error: "密码长度至少4位" }, { status: 400 });
      }
      if (adminPassword && currentPassword) {
        if (hashPassword(currentPassword) !== adminPassword) {
          return NextResponse.json({ success: false, error: "原密码错误" }, { status: 401 });
        }
      }
      adminPassword = hashPassword(password);
      await saveAuthState();
      return NextResponse.json({ success: true, message: "管理密码设置成功", data: { hasAdminPassword: true } });
    }

    if (action === "setProtection") {
      if (!protectionPwd || protectionPwd.length < 4) {
        return NextResponse.json({ success: false, error: "保护密码长度至少4位" }, { status: 400 });
      }
      if (protectionPassword && currentPassword) {
        if (hashPassword(currentPassword) !== protectionPassword) {
          return NextResponse.json({ success: false, error: "原保护密码错误" }, { status: 401 });
        }
      }
      protectionPassword = hashPassword(protectionPwd);
      await saveAuthState();
      return NextResponse.json({ success: true, message: "保护密码设置成功", data: { hasProtectionPassword: true } });
    }

    if (action === "verifyAdmin") {
      if (!password) return NextResponse.json({ success: false, error: "请输入密码" }, { status: 400 });
      const isValid = hashPassword(password) === adminPassword;
      return NextResponse.json({ success: isValid, data: { valid: isValid } });
    }

    if (action === "verifyProtection") {
      if (!password) return NextResponse.json({ success: false, error: "请输入保护密码" }, { status: 400 });
      const isValid = hashPassword(password) === protectionPassword;
      return NextResponse.json({ success: isValid, data: { valid: isValid } });
    }

    if (action === "disable") {
      if (protectionPassword && password) {
        if (hashPassword(password) !== protectionPassword) {
          return NextResponse.json({ success: false, error: "保护密码错误" }, { status: 401 });
        }
      }
      passwordEnabled = false;
      await saveAuthState();
      return NextResponse.json({ success: true, message: "密码保护已关闭", data: { enabled: false } });
    }

    if (action === "enable") {
      if (!protectionPassword) return NextResponse.json({ success: false, error: "请先设置保护密码" }, { status: 400 });
      if (!password || hashPassword(password) !== protectionPassword) {
        return NextResponse.json({ success: false, error: "保护密码错误" }, { status: 401 });
      }
      passwordEnabled = true;
      await saveAuthState();
      return NextResponse.json({ success: true, message: "密码保护已开启", data: { enabled: true } });
    }

    if (action === "changeAdmin") {
      if (!currentPassword) return NextResponse.json({ success: false, error: "请输入原管理密码" }, { status: 400 });
      if (!password || password.length < 4) return NextResponse.json({ success: false, error: "新密码长度至少4位" }, { status: 400 });
      if (hashPassword(currentPassword) !== adminPassword) {
        return NextResponse.json({ success: false, error: "原管理密码错误" }, { status: 401 });
      }
      adminPassword = hashPassword(password);
      await saveAuthState();
      return NextResponse.json({ success: true, message: "管理密码修改成功", data: { hasAdminPassword: true } });
    }

    if (action === "changeProtection") {
      if (!currentPassword) return NextResponse.json({ success: false, error: "请输入原保护密码" }, { status: 400 });
      if (!password || password.length < 4) return NextResponse.json({ success: false, error: "新保护密码长度至少4位" }, { status: 400 });
      if (hashPassword(currentPassword) !== protectionPassword) {
        return NextResponse.json({ success: false, error: "原保护密码错误" }, { status: 401 });
      }
      protectionPassword = hashPassword(password);
      await saveAuthState();
      return NextResponse.json({ success: true, message: "保护密码修改成功", data: { hasProtectionPassword: true } });
    }

    return NextResponse.json({ success: false, error: "未知操作" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "操作失败" }, { status: 500 });
  }
}
