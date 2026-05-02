// src/admin/games.js
import { supabase } from "../lib/supabaseClient.js";
import "./auth.js";
import { ERROR_CODES, showErrorModal } from "../ui/error-modal.js";

function $(sel) {
  return document.querySelector(sel);
}

let gameRows = [];

async function main() {
  // admin 保護
  const ok = await window.LootyAdminAuth.requireAdmin();
  if (!ok) return;

  // 登出
  $("#btnLogout")?.addEventListener("click", window.LootyAdminAuth.signOut);

  $("#status").textContent = "讀取 games 中…";

  const { data, error } = await supabase
    .from("games")
    .select("id,name,slug,thumbnail,type,supports_live,published,launch_url,sort_order,created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    $("#status").textContent = "讀取失敗：" + error.message;
    showErrorModal({
      code: ERROR_CODES.ADMIN_GAMES_READ_FAILED,
      title: "後台遊戲列表讀取失敗",
      message: "目前無法取得遊戲列表，請稍後再試。",
      error,
    });
    return;
  }

  gameRows = data || [];
  updateStatus();

  const list = $("#list");
  list.innerHTML = "";

  if (gameRows.length === 0) {
    list.textContent = "目前沒有遊戲。";
    return;
  }

  const table = document.createElement("table");
  table.border = "1";
  table.cellPadding = "6";
  table.style.borderCollapse = "collapse";

  table.innerHTML = `
    <thead>
      <tr>
        <th>名稱</th>
        <th>slug</th>
        <th>縮圖</th>
        <th>類型</th>
        <th>直播</th>
        <th>上架</th>
        <th>排序</th>
        <th>launch url</th>
        <th>建立時間</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  for (const g of gameRows) {
    const tr = document.createElement("tr");

    const editUrl = `/admin/games/edit/?id=${encodeURIComponent(g.id)}`;
    const loaderUrl = `/game/?slug=${encodeURIComponent(g.slug)}`;
    const staticUrl = `/game/${encodeURIComponent(g.slug)}/index.html`;
    const launchUrl = (g.launch_url || "").trim();
    const showStaticLink = launchUrl === staticUrl;
    const actionLinks = [
      `<a href="${editUrl}">編輯</a>`,
      `<a href="${loaderUrl}" target="_blank" rel="noopener">Loader</a>`,
    ];

    if (showStaticLink) {
      actionLinks.push(`<a href="${staticUrl}" target="_blank" rel="noopener">靜態</a>`);
    }

    if (launchUrl) {
      actionLinks.push(`<a href="${escapeHtml(launchUrl)}" target="_blank" rel="noopener">啟動</a>`);
    }

    tr.innerHTML = `
      <td>${escapeHtml(g.name || "")}</td>
      <td>${escapeHtml(g.slug || "")}</td>
      <td>${
        g.thumbnail
          ? `<a href="${escapeHtml(g.thumbnail)}" target="_blank" rel="noopener">thumbnail</a>`
          : ""
      }</td>
      <td>${escapeHtml(g.type || "")}</td>
      <td>${g.supports_live ? "✅" : "❌"}</td>
      <td>${g.published ? "✅" : "❌"}</td>
      <td>${g.sort_order ?? ""}</td>
      <td>${
        launchUrl
          ? `<a href="${escapeHtml(launchUrl)}" target="_blank" rel="noopener">${escapeHtml(launchUrl)}</a>`
          : ""
      }</td>
      <td>${escapeHtml(g.created_at || "")}</td>
      <td>
        ${actionLinks.join("&nbsp;|&nbsp;")}
        &nbsp;|&nbsp;
        <button data-del="${g.id}">刪除</button>
      </td>
    `;

    tbody.appendChild(tr);
  }

  list.appendChild(table);

  // 刪除
  list.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-del]");
    if (!btn) return;

    const id = btn.getAttribute("data-del");
    if (!id) return;

    if (!confirm("確定刪除這個遊戲？")) return;

    const { error: delErr } = await supabase.from("games").delete().eq("id", id);

    if (delErr) {
      showErrorModal({
        code: ERROR_CODES.ADMIN_DELETE_FAILED,
        title: "刪除遊戲失敗",
        message: "目前無法刪除這筆遊戲資料，請稍後再試。",
        error: delErr,
        reload: false,
      });
      return;
    }

    gameRows = gameRows.filter((game) => game.id !== id);
    btn.closest("tr")?.remove();
    updateStatus();

    if (gameRows.length === 0) {
      list.textContent = "目前沒有遊戲。";
    }
  });
}

function updateStatus() {
  const status = $("#status");
  if (status) status.textContent = `共 ${gameRows.length} 筆遊戲`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

main();
