"use client";

import { useState, useEffect } from "react";
import { Search, Plus, X, Play, Image, FileText, Grid, List, ExternalLink, Lock, Unlock, Settings, Shield, Key, FolderOpen, Trash2, Edit3, GripVertical, Eye, EyeOff, Save, Menu } from "lucide-react";

interface Work {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  type: "image" | "video" | "document" | "other";
  description: string;
  preview: string;
  cloudUrl: string;
}

interface MenuItem {
  id: string;
  name: string;
  type: "all" | "type" | "category" | "subcategory";
  value: string;
  order: number;
  enabled: boolean;
  level?: number; // 菜单层级 1=一级, 2=二级, 3=三级
  parentId?: string; // 父级菜单ID
  children?: MenuItem[]; // 子菜单
}

interface AuthState {
  enabled: boolean;
  hasPassword: boolean;
  hasProtectionPassword: boolean;
}

// 解析外链类型
function parseExternalUrl(url: string): { type: "youtube" | "bilibili" | "image" | "drive" | "wechat" | "other"; embedUrl: string; originalUrl: string } {
  if (!url) return { type: "other", embedUrl: "", originalUrl: "" };
  
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`, originalUrl: url };
  }
  
  const bilibiliMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+|av\d+)/);
  if (bilibiliMatch) {
    return { type: "bilibili", embedUrl: `https://player.bilibili.com/player.html?autoplay=0&bvid=${bilibiliMatch[1]}`, originalUrl: url };
  }
  
  if (url.includes("drive.google.com")) {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return { type: "drive", embedUrl: `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`, originalUrl: url };
    }
  }
  
  if (url.includes("mp.weixin.qq.com")) {
    return { type: "wechat", embedUrl: url, originalUrl: url };
  }
  
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || url.includes("unsplash.com") || url.includes("imgur.com")) {
    return { type: "image", embedUrl: url, originalUrl: url };
  }
  
  return { type: "other", embedUrl: url, originalUrl: url };
}

function getTypeIcon(type: string) {
  switch (type) {
    case "video": return <Play className="w-4 h-4" />;
    case "image": return <Image className="w-4 h-4" />;
    case "document": return <FileText className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "video": return "bg-red-100 text-red-700";
    case "image": return "bg-blue-100 text-blue-700";
    case "document": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function VideoPreview({ url }: { url: string }) {
  const { type, embedUrl, originalUrl } = parseExternalUrl(url);
  
  if (!url) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Play className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">请粘贴视频链接</p>
          <p className="text-xs mt-1">支持 YouTube / B站</p>
        </div>
      </div>
    );
  }
  
  if (type === "youtube" || type === "bilibili") {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  
  if (url.includes(".mp4") || url.includes(".webm")) {
    return <video src={url} controls className="w-full rounded-lg" />;
  }
  
  return (
    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
      <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition">
        <ExternalLink className="w-5 h-5" />在新窗口打开
      </a>
    </div>
  );
}

function ImagePreview({ url }: { url: string }) {
  const { type, originalUrl } = parseExternalUrl(url);
  
  if (!url || type !== "image") {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Image className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">请粘贴图片链接</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative group">
      <img src={originalUrl} alt="预览" className="w-full h-64 object-cover rounded-lg" />
      <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
        <ExternalLink className="w-8 h-8 text-white" />
      </a>
    </div>
  );
}

function DocumentPreview({ url }: { url: string }) {
  const { type, originalUrl } = parseExternalUrl(url);
  
  if (!url) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">请粘贴文档链接</p>
          <p className="text-xs mt-1">支持 Google Drive / PDF / 微信公众号</p>
        </div>
      </div>
    );
  }
  
  if (url.includes("drive.google.com") || url.includes(".pdf")) {
    return (
      <div className="h-80 rounded-lg overflow-hidden border">
        <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`} className="w-full h-full" />
      </div>
    );
  }
  
  if (type === "wechat") {
    return (
      <div className="h-80 rounded-lg overflow-hidden border bg-gray-50">
        <iframe src={originalUrl} className="w-full h-full" sandbox="allow-same-origin allow-scripts allow-popups" />
      </div>
    );
  }
  
  return (
    <div className="aspect-video bg-blue-50 rounded-lg flex items-center justify-center">
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        <ExternalLink className="w-5 h-5" />打开文档
      </a>
    </div>
  );
}

export default function HomePage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  
  // 密码相关状态
  const [authState, setAuthState] = useState<AuthState>({ enabled: false, hasPassword: false, hasProtectionPassword: false });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [passwordAction, setPasswordAction] = useState<"add" | "delete" | "settings">("add");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // 设置密码状态
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  
  // 菜单管理状态
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [menuFormData, setMenuFormData] = useState({ 
    name: "", 
    type: "category" as "type" | "category" | "subcategory", 
    value: "",
    level: 1 as number,
    parentId: "" as string
  });
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: "",
    category: "image",
    subcategory: "",
    type: "image" as "image" | "video" | "document" | "other",
    description: "",
    preview: "",
    cloudUrl: "",
  });

  useEffect(() => {
    fetchAuthState();
    fetchData();
  }, []);
  
  async function fetchAuthState() {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.success) {
        setAuthState(data.data);
      }
    } catch (error) {
      console.error("获取认证状态失败:", error);
    }
  }
  
  async function fetchData() {
    try {
      const res = await fetch("/api/works");
      const data = await res.json();
      if (data.success) {
        setWorks(data.data);
        setMenus(data.menus || []);
      }
    } catch (error) {
      console.error("加载失败:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWorks() {
    try {
      const url = new URL("/api/works", window.location.origin);
      
      // 根据选中的菜单发送正确的筛选参数
      if (selectedMenuId !== "all") {
        const selectedMenu = menus.find(m => m.id === selectedMenuId);
        if (selectedMenu) {
          if (selectedMenu.type === "type") {
            url.searchParams.set("type", selectedMenu.value);
          } else if (selectedMenu.type === "category") {
            url.searchParams.set("category", selectedMenu.value);
          } else if (selectedMenu.type === "subcategory") {
            url.searchParams.set("subcategory", selectedMenu.value);
          }
        }
      }
      
      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setWorks(data.data);
        setMenus(data.menus || []);
      }
    } catch (error) {
      console.error("加载失败:", error);
    }
  }

  function openPasswordModal(action: "add" | "delete" | "settings", callback?: () => void) {
    if (!authState.enabled) {
      if (callback) callback();
      return;
    }
    setPasswordAction(action);
    setPasswordInput("");
    setPasswordError("");
    setPendingAction(() => callback || null);
    setShowPasswordModal(true);
  }

  async function handlePasswordSubmit() {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verifyAdmin", password: passwordInput }),
      });
      const data = await res.json();
      if (data.success && data.data.valid) {
        setShowPasswordModal(false);
        setPasswordInput("");
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
      } else {
        setPasswordError("密码错误");
      }
    } catch (error) {
      setPasswordError("验证失败");
    }
  }

  async function handleDeleteWork(id: string) {
    try {
      const res = await fetch(`/api/works?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": passwordInput },
      });
      const data = await res.json();
      if (data.success) {
        await fetchWorks();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("删除失败");
    }
  }

  async function handleAddWork() {
    if (!formData.title || !formData.cloudUrl) {
      alert("请填写标题和链接");
      return;
    }
    setIsFormSubmitting(true);
    try {
      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": passwordInput },
        body: JSON.stringify({ action: "addWork", ...formData }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        resetForm();
        await fetchWorks();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("添加失败");
    } finally {
      setIsFormSubmitting(false);
    }
  }

  function resetForm() {
    setFormData({ title: "", category: "image", subcategory: "", type: "image", description: "", preview: "", cloudUrl: "" });
  }

  // 菜单管理函数
  async function handleSaveMenu() {
    if (!menuFormData.name) {
      alert("请输入菜单名称");
      return;
    }
    try {
      let res;
      if (editingMenu) {
        res = await fetch("/api/works", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-password": passwordInput },
          body: JSON.stringify({ action: "updateMenu", id: editingMenu.id, ...menuFormData, value: menuFormData.value || menuFormData.name }),
        });
      } else {
        res = await fetch("/api/works", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-password": passwordInput },
          body: JSON.stringify({ action: "addMenu", ...menuFormData, value: menuFormData.value || menuFormData.name }),
        });
      }
      const data = await res.json();
      if (data.success) {
        setShowMenuModal(false);
        setEditingMenu(null);
        setMenuFormData({ name: "", type: "category", value: "", level: 1, parentId: "" });
        await fetchWorks();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("保存失败");
    }
  }

  async function handleDeleteMenu(id: string) {
    if (id === "all") {
      alert("不能删除全部作品");
      return;
    }
    if (!confirm("确定删除这个菜单吗？")) return;
    try {
      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": passwordInput },
        body: JSON.stringify({ action: "deleteMenu", id }),
      });
      const data = await res.json();
      if (data.success) {
        if (selectedMenuId === id) setSelectedMenuId("all");
        await fetchWorks();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("删除失败");
    }
  }

  async function handleToggleMenuEnabled(menu: MenuItem) {
    try {
      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": passwordInput },
        body: JSON.stringify({ action: "updateMenu", id: menu.id, enabled: !menu.enabled }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchWorks();
      }
    } catch (error) {
      console.error("更新菜单失败");
    }
  }

  // 设置密码函数
  async function handleSetPassword() {
    if (!newPassword || newPassword.length < 4) {
      setSettingsError("密码长度至少4位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSettingsError("两次密码不一致");
      return;
    }
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setAdmin", password: newPassword, currentPassword: authState.hasPassword ? currentPassword : undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSuccess("管理密码设置成功");
        setNewPassword("");
        setConfirmPassword("");
        setCurrentPassword("");
        fetchAuthState();
      } else {
        setSettingsError(data.error);
      }
    } catch (error) {
      setSettingsError("设置失败");
    }
  }

  async function handleTogglePassword(enable: boolean) {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: enable ? "enable" : "disable", password: passwordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSuccess(data.message);
        setPasswordInput("");
        fetchAuthState();
      } else {
        setSettingsError(data.error);
      }
    } catch (error) {
      setSettingsError("操作失败");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">创意作品集</h1>
              {authState.enabled ? (
                <Lock className="w-5 h-5 text-green-600" />
              ) : (
                <Unlock className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openPasswordModal("add", () => setShowModal(true))} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="w-5 h-5" />添加作品
              </button>
              <button onClick={() => openPasswordModal("settings", () => setShowMenuModal(true))} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={() => openPasswordModal("settings", () => setShowSettingsModal(true))} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* 搜索框 */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchWorks()}
              placeholder="搜索作品..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      {/* 菜单导航 - 支持多级展开 */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-sm">
            {/* 一级菜单（不展开） */}
            {menus.filter(m => m.enabled && (!m.level || m.level === 1)).sort((a, b) => a.order - b.order).map((menu) => {
              const hasChildren = menus.some(m => m.enabled && m.parentId === menu.id);
              const isExpanded = expandedMenus.has(menu.id);
              
              return (
                <div key={menu.id} className="flex items-center">
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        // 有子菜单，展开/折叠
                        const newExpanded = new Set(expandedMenus);
                        if (isExpanded) {
                          newExpanded.delete(menu.id);
                        } else {
                          newExpanded.add(menu.id);
                        }
                        setExpandedMenus(newExpanded);
                      } else {
                        // 无子菜单，选中并筛选
                        setSelectedMenuId(menu.id);
                        fetchWorks();
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                      selectedMenuId === menu.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {menu.type === "all" && <FolderOpen className="w-4 h-4" />}
                    {menu.type === "type" && getTypeIcon(menu.value)}
                    <span>{menu.name}</span>
                    {hasChildren && <span className="text-xs">{isExpanded ? "▲" : "▼"}</span>}
                  </button>
                  
                  {/* 二级/三级菜单（展开时显示） */}
                  {hasChildren && isExpanded && (
                    <div className="flex items-center ml-1 gap-1">
                      {menus.filter(m => m.enabled && m.parentId === menu.id).sort((a, b) => a.order - b.order).map((child) => {
                        const hasGrandChildren = menus.some(m => m.enabled && m.parentId === child.id);
                        const isChildExpanded = expandedMenus.has(child.id);
                        const indent = child.level === 3 ? "ml-4" : "ml-1";
                        
                        return (
                          <div key={child.id} className="flex items-center">
                            <button
                              onClick={() => {
                                if (hasGrandChildren) {
                                  const newExpanded = new Set(expandedMenus);
                                  if (isChildExpanded) {
                                    newExpanded.delete(child.id);
                                  } else {
                                    newExpanded.add(child.id);
                                  }
                                  setExpandedMenus(newExpanded);
                                } else {
                                  setSelectedMenuId(child.id);
                                  fetchWorks();
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg whitespace-nowrap transition text-gray-600 ${
                                selectedMenuId === child.id ? "bg-blue-100 text-blue-700 font-medium" : "hover:bg-gray-100"
                              }`}
                              style={{ fontSize: '13px' }}
                            >
                              {child.type === "all" && <FolderOpen className="w-3 h-3" />}
                              {child.type === "type" && getTypeIcon(child.value)}
                              <span>{child.name}</span>
                              {hasGrandChildren && <span className="text-xs">{isChildExpanded ? "▲" : "▼"}</span>}
                            </button>
                            
                            {/* 三级菜单 */}
                            {hasGrandChildren && isChildExpanded && (
                              <div className="flex items-center ml-1 gap-1">
                                {menus.filter(m => m.enabled && m.parentId === child.id).sort((a, b) => a.order - b.order).map((grandChild) => (
                                  <button
                                    key={grandChild.id}
                                    onClick={() => {
                                      setSelectedMenuId(grandChild.id);
                                      fetchWorks();
                                    }}
                                    className={`flex items-center gap-1 px-2 py-1 rounded whitespace-nowrap transition ${
                                      selectedMenuId === grandChild.id ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-500 hover:bg-gray-50"
                                    }`}
                                    style={{ fontSize: '12px' }}
                                  >
                                    {grandChild.type === "all" && <FolderOpen className="w-3 h-3" />}
                                    {grandChild.type === "type" && getTypeIcon(grandChild.value)}
                                    <span>{grandChild.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 作品列表 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">{works.length} 个作品</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}>
              <Grid className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}>
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {works.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>暂无作品</p>
            <button onClick={() => openPasswordModal("add", () => setShowModal(true))} className="mt-4 text-blue-600 hover:underline">添加第一个作品</button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {works.map((work) => (
              <div key={work.id} onClick={() => setSelectedWork(work)} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer">
                <div className="aspect-video bg-gray-100">
                  {work.type === "image" ? <img src={work.cloudUrl} alt={work.title} className="w-full h-full object-cover" /> : work.type === "video" ? (
                    work.cloudUrl ? <VideoPreview url={work.cloudUrl} /> : <div className="w-full h-full flex items-center justify-center"><Play className="w-8 h-8 text-gray-400" /></div>
                  ) : <div className="w-full h-full flex items-center justify-center"><FileText className="w-8 h-8 text-gray-400" /></div>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-900 truncate">{work.title}</h3>
                    <button onClick={(e) => { e.stopPropagation(); openPasswordModal("delete", () => handleDeleteWork(work.id)); }} className="p-1 text-gray-400 hover:text-red-500 transition">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">{work.description || "暂无描述"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(work.type)}`}>
                      {getTypeIcon(work.type)}
                      {work.type === "video" ? "视频" : work.type === "image" ? "图片" : "文档"}
                    </span>
                    {work.subcategory && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{work.subcategory}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {works.map((work) => (
              <div key={work.id} onClick={() => setSelectedWork(work)} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer flex gap-4">
                <div className="w-48 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {work.type === "image" ? <img src={work.cloudUrl} alt={work.title} className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      {work.type === "video" ? <Play className="w-8 h-8 text-gray-400" /> : <FileText className="w-8 h-8 text-gray-400" />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{work.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{work.description}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); openPasswordModal("delete", () => handleDeleteWork(work.id)); }} className="p-1.5 text-gray-400 hover:text-red-500 transition">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(work.type)}`}>
                      {getTypeIcon(work.type)}
                      {work.type === "video" ? "视频" : work.type === "image" ? "图片" : "文档"}
                    </span>
                    {work.subcategory && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{work.subcategory}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 详情弹窗 */}
      {selectedWork && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedWork(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedWork.title}</h2>
              <button onClick={() => setSelectedWork(null)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                {selectedWork.type === "image" && <ImagePreview url={selectedWork.cloudUrl} />}
                {selectedWork.type === "video" && <VideoPreview url={selectedWork.cloudUrl} />}
                {selectedWork.type === "document" && <DocumentPreview url={selectedWork.cloudUrl} />}
              </div>
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">作品描述</h3>
                <p className="text-gray-600">{selectedWork.description || "暂无描述"}</p>
              </div>
              {selectedWork.cloudUrl && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">资源链接</h3>
                  <a href={selectedWork.cloudUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
                    <ExternalLink className="w-4 h-4" />
                    {selectedWork.cloudUrl.length > 50 ? selectedWork.cloudUrl.substring(0, 50) + "..." : selectedWork.cloudUrl}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className={`px-2 py-0.5 rounded ${getTypeColor(selectedWork.type)}`}>
                  {selectedWork.type === "video" ? "视频" : selectedWork.type === "image" ? "图片" : "文档"}
                </span>
                {selectedWork.subcategory && <span>{selectedWork.subcategory}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 密码验证弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">输入密码</h2>
                <p className="text-sm text-gray-500">
                  {passwordAction === "add" && "添加作品需要验证密码"}
                  {passwordAction === "delete" && "删除作品需要验证密码"}
                  {passwordAction === "settings" && "修改设置需要验证密码"}
                </p>
              </div>
            </div>
            <input type="password" value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }} placeholder="请输入管理密码" className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
            {passwordError && <p className="text-red-500 text-sm mt-2">{passwordError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowPasswordModal(false); setPasswordInput(""); setPendingAction(null); }} className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">取消</button>
              <button onClick={handlePasswordSubmit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">确认</button>
            </div>
          </div>
        </div>
      )}

      {/* 菜单管理弹窗 */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">菜单管理</h2>
              <button onClick={() => { setShowMenuModal(false); setEditingMenu(null); setMenuFormData({ name: "", type: "category", value: "", level: 1, parentId: "" }); }} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* 现有菜单列表 */}
              <div className="space-y-2">
                {menus.sort((a, b) => a.order - b.order).map((menu) => (
                  <div key={menu.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 font-medium">{menu.name}</span>
                    <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-200 rounded">{menu.type}</span>
                    <button onClick={() => handleToggleMenuEnabled(menu)} className={`p-1 rounded ${menu.enabled ? "text-green-600" : "text-gray-400"}`}>
                      {menu.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { if (menu.type !== "all") { setEditingMenu(menu); setMenuFormData({ name: menu.name, type: menu.type as "type" | "category" | "subcategory", value: menu.value, level: (menu as any).level || 1, parentId: (menu as any).parentId || "" }); }}} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit3 className="w-4 h-4" /></button>
                    {menu.id !== "all" && <button onClick={() => handleDeleteMenu(menu.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
              
              {/* 添加/编辑菜单表单 */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">{editingMenu ? "编辑菜单" : "添加新菜单"}</h3>
                <div className="space-y-3">
                  <input type="text" value={menuFormData.name} onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })} placeholder="菜单名称" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <select value={menuFormData.type} onChange={(e) => setMenuFormData({ ...menuFormData, type: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="category">分类菜单</option>
                    <option value="subcategory">子分类菜单</option>
                    <option value="type">类型菜单</option>
                  </select>
                  <button onClick={handleSaveMenu} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />
                    {editingMenu ? "保存修改" : "添加菜单"}
                  </button>
                  {editingMenu && (
                    <button onClick={() => { setEditingMenu(null); setMenuFormData({ name: "", type: "category", value: "", level: 1, parentId: "" }); }} className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">取消编辑</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 密码设置弹窗 */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">密码设置</h2>
              <button onClick={() => { setShowSettingsModal(false); setNewPassword(""); setConfirmPassword(""); setCurrentPassword(""); setSettingsError(""); setSettingsSuccess(""); }} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {authState.enabled ? <Lock className="w-6 h-6 text-green-600" /> : <Unlock className="w-6 h-6 text-gray-400" />}
                    <div>
                      <p className="font-medium text-gray-900">密码保护：{authState.enabled ? "已开启" : "已关闭"}</p>
                      <p className="text-sm text-gray-500">管理密码：用于添加/删除作品 | 保护密码：用于开启/关闭保护</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 管理密码设置 */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">管理密码</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">用于添加/删除作品</span>
                </div>
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">新管理密码</label>
                  <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setSettingsError(""); }} placeholder="至少4位字符" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">确认新密码</label>
                  <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setSettingsError(""); }} placeholder="再次输入新密码" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button onClick={handleSetPassword} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  {authState.hasPassword ? "修改管理密码" : "设置管理密码"}
                </button>
              </div>
              
              {/* 开启/关闭密码保护 */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-gray-900">保护设置</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">输入密码直接开启/关闭</span>
                </div>
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">保护密码</label>
                  <input type="password" value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setSettingsError(""); }} placeholder="输入保护密码" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <button onClick={() => handleTogglePassword(!authState.enabled)} disabled={!passwordInput} className={`w-full px-4 py-2 rounded-lg transition ${authState.enabled ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-500 text-white hover:bg-green-600"} ${!passwordInput ? "opacity-50 cursor-not-allowed" : ""}`}>
                  {authState.enabled ? "暂时关闭保护" : "开启保护"}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  {authState.enabled ? "关闭后添加/删除作品无需密码" : "开启后添加/删除作品需要管理密码"}
                </p>
              </div>
              
              {settingsError && <p className="text-red-500 text-sm">{settingsError}</p>}
              {settingsSuccess && <p className="text-green-600 text-sm">{settingsSuccess}</p>}
            </div>
          </div>
        </div>
      )}

      {/* 添加作品弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">添加作品</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作品标题 *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="给作品起个名字" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">作品类型 *</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="image">图片</option>
                    <option value="video">视频</option>
                    <option value="document">文档</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">子分类</label>
                  <select value={formData.subcategory} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">选择子分类</option>
                    {menus.filter((m: any) => m.type === "category" && m.level === 2 && m.enabled).map((menu: any) => (
                      <option key={menu.id} value={menu.value}>{menu.name}</option>
                    ))}
                    <option value="__new__">+ 输入新子分类</option>
                  </select>
                  {formData.subcategory === "__new__" && (
                    <input type="text" value="" onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2" placeholder="输入新子分类名称" />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作品描述</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} placeholder="简单描述一下这个作品" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{formData.type === "video" ? "视频链接 *" : "资源链接 *"}</label>
                <textarea value={formData.cloudUrl} onChange={(e) => setFormData({ ...formData, cloudUrl: e.target.value, preview: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} placeholder={formData.type === "video" ? "粘贴 YouTube / B站 视频链接\n例如: https://www.youtube.com/watch?v=xxx" : formData.type === "image" ? "粘贴图片链接\n例如: https://i.imgur.com/xxx.jpg" : "粘贴 Google Drive 分享链接\n或 PDF 直链"} />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.type === "video" && "支持 YouTube、B站、Vimeo 或直接 MP4 链接"}
                  {formData.type === "image" && "支持任何公开图片链接"}
                  {formData.type === "document" && "支持 Google Drive、PDF 直链"}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">免费托管方案推荐</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>视频</strong>：上传到 YouTube / B站，获取分享链接</li>
                  <li>• <strong>图片</strong>：上传到 imgur / 图壳，获取链接</li>
                  <li>• <strong>文档</strong>：上传到 Google Drive，开启分享</li>
                </ul>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">取消</button>
                <button onClick={handleAddWork} disabled={!formData.title || !formData.cloudUrl || isFormSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {isFormSubmitting ? "添加中..." : "添加作品"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
