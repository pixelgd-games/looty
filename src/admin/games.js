// src/admin/games.js
import { supabase } from "../lib/supabaseClient.js";
import "./auth.js";

function $(sel) {
  return document.querySelector(sel);
}

async function main() {
  // admin 保護
  const ok = await window.LootyAdminAuth.requireAdmin();
  if (!ok) return;

  // 登出
  $("#btnLogout")?.addEventListener("click", window.LootyAdminAuth.signOut);

  $("#status").textContent = "讀取 games 中…";

  const { data, error } = await supabase
    .from("games")
    .select("id,name,slug,thumbnail,type,supports_live,published,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    $("#status").textContent = "讀取失敗：" + error.message;
    return;
  }

  $("#status").textContent = `共 ${data.length} 筆遊戲`;

  const list = $("#list");
  list.innerHTML = "";

  if (data.length === 0) {
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
        <th>建立時間</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  for (const g of data) {
    const tr = document.createElement("tr");

    const editUrl = `/admin/games/edit/?id=${encodeURIComponent(g.id)}`;
    const playUrl = `/game?slug=${encodeURIComponent(g.slug)}`;
    const staticUrl = `/public/game/${encodeURIComponent(g.slug)}/index.html`;

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
      <td>${escapeHtml(g.created_at || "")}</td>
      <td>
        <a href="${editUrl}">編輯</a>
        &nbsp;|&nbsp;
        <a href="${playUrl}" target="_blank" rel="noopener">Lobby</a>
        &nbsp;|&nbsp;
        <a href="${staticUrl}" target="_blank" rel="noopener">靜態</a>
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
      alert("刪除失敗：" + delErr.message);
      return;
    }

    location.reload();
  });
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