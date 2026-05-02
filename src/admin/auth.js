// src/admin/auth.js
import { supabase } from "../lib/supabaseClient.js";
import { ERROR_CODES, showErrorModal } from "../ui/error-modal.js";

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
  if (error) {
    showErrorModal({
      code: ERROR_CODES.ADMIN_OAUTH_FAILED,
      title: "後台登入失敗",
      message: "目前無法啟動 Google 登入，請稍後再試。",
      error,
      reload: false,
    });
  }
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    showErrorModal({
      code: ERROR_CODES.ADMIN_SIGN_OUT_FAILED,
      title: "後台登出失敗",
      message: "目前無法完成登出，請稍後再試。",
      error,
      reload: false,
    });
    return;
  }

  location.href = "/admin/login/";
}

async function requireAdmin(options = {}) {
  const {
    redirectIfMissing = true,
    showDeniedModal = true,
  } = options;

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    showErrorModal({
      code: ERROR_CODES.ADMIN_AUTH_READ_FAILED,
      title: "後台登入狀態讀取失敗",
      message: "目前無法確認後台登入狀態，請稍後再試。",
      error: sessionError,
    });
    return null;
  }

  if (!session?.user) {
    if (redirectIfMissing) {
      location.href = "/admin/login/";
    }
    return null;
  }

  const user = session.user;
  const email = user.email || "";

  const { data, error } = await supabase
    .from("admin_users")
    .select("id,email")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    showErrorModal({
      code: ERROR_CODES.ADMIN_AUTH_READ_FAILED,
      title: "後台白名單檢查失敗",
      message: "目前無法確認管理員權限，請稍後再試。",
      error,
    });
    return null;
  }

  if (!data) {
    if (showDeniedModal) {
      showErrorModal({
        code: ERROR_CODES.ADMIN_NOT_ALLOWED,
        title: "沒有後台權限",
        message: "目前登入的帳號不是管理員，請使用管理員 Google 帳號登入。",
        reload: false,
        primaryAction: {
          label: "前往後台登入",
          onClick: () => {
            location.href = "/admin/login/";
          },
        },
      });
    }
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
  if (btnLogout) btnLogout.hidden = true;

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    if (statusEl) statusEl.textContent = "登入狀態讀取失敗";
    showErrorModal({
      code: ERROR_CODES.ADMIN_AUTH_READ_FAILED,
      title: "後台登入狀態讀取失敗",
      message: "目前無法確認後台登入狀態，請稍後再試。",
      error,
    });
    return;
  }

  if (!session?.user) {
    if (statusEl) statusEl.textContent = "尚未登入";
    return;
  }

  if (statusEl) statusEl.textContent = "已登入，檢查管理員白名單中…";
  const ok = await requireAdmin({
    redirectIfMissing: false,
    showDeniedModal: false,
  });
  if (ok) location.href = "/admin/games/";
  else if (statusEl) {
    statusEl.textContent = "目前登入的帳號不是管理員，請使用管理員 Google 帳號登入。";
  }
}

// 讓其他頁也能用
window.LootyAdminAuth = { requireAdmin, signOut };

// 只在 login 頁跑
if (location.pathname.startsWith("/admin/login")) {
  initLoginPage();
}
