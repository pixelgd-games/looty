// src/admin/game-form.js
import { supabase } from "../lib/supabaseClient.js";
import "./auth.js";

const form = document.getElementById("gameForm");
const params = new URLSearchParams(window.location.search);
const gameId = params.get("id");

// --- helpers ---
function slugSanity(slug) {
  const s = String(slug || "").trim();
  if (!s) return { ok: false, msg: "slug 不能為空" };
  if (/\s/.test(s)) return { ok: false, msg: "slug 不能包含空格" };
  if (!/^[a-z0-9-]+$/.test(s))
    return { ok: false, msg: "slug 只能用小寫英數與 -" };
  return { ok: true, slug: s };
}

function val(id) {
  return document.getElementById(id)?.value ?? "";
}
function checked(id) {
  return !!document.getElementById(id)?.checked;
}

function parseSortOrder(rawValue) {
  const value = String(rawValue || "").trim();

  if (!value) return { ok: true, value: null };
  if (!/^-?\d+$/.test(value)) {
    return { ok: false, msg: "sort order 只能填整數" };
  }

  return { ok: true, value: Number(value) };
}

async function loadGame() {
  const { data, error } = await supabase
    .from("games")
    .select("id,name,slug,thumbnail,type,supports_live,published,launch_url,sort_order")
    .eq("id", gameId)
    .maybeSingle();

  if (error) {
    alert("讀取失敗：" + error.message);
    return;
  }
  if (!data) {
    alert("找不到遊戲（可能已被刪除）");
    window.location.href = "/admin/games/";
    return;
  }

  document.getElementById("name").value = data.name ?? "";
  document.getElementById("slug").value = data.slug ?? "";
  document.getElementById("thumbnail").value = data.thumbnail ?? "";
  document.getElementById("type").value = data.type ?? "slot";
  document.getElementById("supports_live").checked = !!data.supports_live;
  document.getElementById("published").checked = !!data.published;
  document.getElementById("launch_url").value = data.launch_url ?? "";
  document.getElementById("sort_order").value = data.sort_order ?? "";

  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";
}

async function submitForm(e) {
  e.preventDefault();

  const name = val("name").trim();
  const slugCheck = slugSanity(val("slug"));
  if (!slugCheck.ok) return alert(slugCheck.msg);
  const sortOrderCheck = parseSortOrder(val("sort_order"));
  if (!sortOrderCheck.ok) return alert(sortOrderCheck.msg);
  const launchUrl = val("launch_url").trim();

  const payload = {
    name,
    slug: slugCheck.slug,
    thumbnail: val("thumbnail").trim(),
    type: val("type"),
    supports_live: checked("supports_live"),
    published: checked("published"),
    launch_url: launchUrl || null,
    sort_order: sortOrderCheck.value,
  };

  if (!payload.name) return alert("名稱不能為空");
  if (payload.published && !launchUrl) {
    return alert("已上架遊戲需要 launch url");
  }

  // 防止連點
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    if (gameId) {
      const { error } = await supabase.from("games").update(payload).eq("id", gameId);
      if (error) return alert("更新失敗：" + error.message);
    } else {
      const { error } = await supabase.from("games").insert([payload]);
      if (error) return alert("新增失敗：" + error.message);
    }

    // ✅ 導回正確的後台首頁（資料夾 index）
    window.location.href = "/admin/games/";
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function initFormPage() {
  const ok = await window.LootyAdminAuth.requireAdmin();
  if (!ok) return;

  if (gameId) {
    await loadGame();
  } else {
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "none";
  }

  form.addEventListener("submit", submitForm);
}

initFormPage();
