// Year + live GitHub repo grid (no build step)
document.getElementById("year").textContent = new Date().getFullYear();

const grid = document.getElementById("repo-grid");
const USER = "al0nkr";
const SKIP = new Set(["al0nkr.github.io", "homepage"]); // curated above; avoid dupes

async function loadRepos() {
  try {
    const res = await fetch(`https://api.github.com/users/${USER}/repos?sort=updated&per_page=30`);
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const repos = await res.json();
    const list = repos.filter((r) => !r.fork && !SKIP.has(r.name));
    if (!list.length) {
      grid.innerHTML = '<p class="muted">No additional repositories.</p>';
      return;
    }
    grid.innerHTML = list
      .map(
        (r) => `
      <div class="repo">
        <a href="${r.html_url}" target="_blank" rel="noopener">${r.name}</a>
        <p>${r.description ? escapeHtml(r.description) : "No description."}</p>
        <span class="lang">${r.language || ""} ${r.stargazers_count ? `★ ${r.stargazers_count}` : ""}</span>
      </div>`
      )
      .join("");
  } catch (e) {
    grid.innerHTML = '<p class="muted">Could not load live repos (API rate limit offline). See <a href="https://github.com/al0nkr?tab=repositories">all repositories on GitHub</a>.</p>';
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

loadRepos();
