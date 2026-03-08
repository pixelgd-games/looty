// src/admin/auth.js
import { supabase } from "../lib/supabaseClient.js";

// 取得 DOM（你的 login 頁 id 是 btnLogin/btnLogout/status）
function $(sel) { return document.querySelector(sel); }

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: location.origin + "/admin/login/",
      // 強制每次都跳帳號選擇
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) alert("登入失敗：" + error.message);
}

async function signOut() {
  await supabase.auth.signOut();
  location.href = "/admin/login/";
}

async function requireAdmin() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    location.href = "/admin/login/";
    return null;
  }

  const user = session.user;
  const email = user.email || "";
  console.log("LOGIN EMAIL:", email);

  const { data, error } = await supabase
    .from("admin_users")
    .select("id,email")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    alert("白名單檢查失敗：" + error.message);
    await supabase.auth.signOut();
    location.href = "/admin/login/";
    return null;
  }

  if (!data) {
    alert("你不是管理員（不在 admin_users 白名單）");
    await supabase.auth.signOut();
    location.href = "/admin/login/";
    return null;
  }

  return { session, user };
}

async function initLoginPage() {
  const statusEl = $("#status");
  const btnLogin = $("#btnLogin");
  const btnLogout = $("#btnLogout");

  if (btnLogin) btnLogin.addEventListener("click", signInWithGoogle);
  if (btnLogout) btnLogout.addEventListener("click", signOut);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    if (statusEl) statusEl.textContent = "尚未登入";
    return;
  }

  if (statusEl) statusEl.textContent = "已登入，檢查管理員白名單中…";
  const ok = await requireAdmin();
  if (ok) location.href = "/admin/games/";
}

// 讓其他頁也能用
window.LootyAdminAuth = { requireAdmin, signOut };

// 只在 login 頁跑
if (location.pathname.startsWith("/admin/login")) {
  initLoginPage();
}