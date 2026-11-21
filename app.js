// ============================================================================
// Main Application Controller: Routing, Search, Clipboard, Theme & Mobile Menu
// ============================================================================

let currentPageId = 'quickstart';

// iFrame-safe clipboard helper using document.execCommand('copy')
function copyToClipboard(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch (e) {}
  document.body.removeChild(ta);
}

function copyTextWithFeedback(text, btn) {
  copyToClipboard(text);
  const label = btn.querySelector('.copy-label');
  if (label) {
    const orig = label.textContent;
    label.textContent = 'Copied!';
    btn.classList.add('border-emerald-500/50', 'text-emerald-600', 'dark:text-emerald-400');
    setTimeout(() => {
      label.textContent = orig;
      btn.classList.remove('border-emerald-500/50', 'text-emerald-600', 'dark:text-emerald-400');
    }, 1500);
  }
}

function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  const groups = {};
  DOC_PAGES.forEach((p) => {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(p);
  });

  nav.innerHTML = Object.entries(groups)
    .map(([groupName, items]) => {
      const links = items
        .map((p) => {
          const isActive = p.id === currentPageId;
          const cls = isActive
            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium border-sky-500/30'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 border-transparent';
          return `
            <li>
              <button
                type="button"
                data-nav="${p.id}"
                class="w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${cls}"
              >
                ${escapeHtml(p.title)}
              </button>
            </li>
          `;
        })
        .join('');

      return `
        <div>
          <div class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            ${escapeHtml(groupName)}
          </div>
          <ul class="space-y-1">${links}</ul>
        </div>
      `;
    })
    .join('');
}

function renderPageNav() {
  const pageNav = document.getElementById('page-nav');
  if (!pageNav) return;

  const idx = DOC_PAGES.findIndex((p) => p.id === currentPageId);
  const prev = idx > 0 ? DOC_PAGES[idx - 1] : null;
  const next = idx < DOC_PAGES.length - 1 ? DOC_PAGES[idx + 1] : null;

  const prevHtml = prev
    ? `
      <button
        type="button"
        data-nav="${prev.id}"
        class="group flex flex-col items-start rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-left hover:border-sky-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
      >
        <span class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">&larr; Previous</span>
        <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">${escapeHtml(prev.title)}</span>
      </button>
    `
    : '<div></div>';

  const nextHtml = next
    ? `
      <button
        type="button"
        data-nav="${next.id}"
        class="group flex flex-col items-end rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-right hover:border-sky-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
      >
        <span class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Next &rarr;</span>
        <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">${escapeHtml(next.title)}</span>
      </button>
    `
    : '<div></div>';

  pageNav.innerHTML = prevHtml + nextHtml;
}

function closeSidebar() {
  const sidebarEl = document.getElementById('sidebar');
  const backdropEl = document.getElementById('sidebar-backdrop');
  if (sidebarEl) sidebarEl.classList.add('-translate-x-full');
  if (backdropEl) backdropEl.classList.add('hidden');
}

function openSidebar() {
  const sidebarEl = document.getElementById('sidebar');
  const backdropEl = document.getElementById('sidebar-backdrop');
  if (sidebarEl) sidebarEl.classList.remove('-translate-x-full');
  if (backdropEl) backdropEl.classList.remove('hidden');
}

function navigateTo(pageId) {
  const page = DOC_PAGES.find((p) => p.id === pageId) || DOC_PAGES[0];
  currentPageId = page.id;

  try {
    history.replaceState(null, '', '#' + page.id);
  } catch (e) {}

  const contentEl = document.getElementById('doc-content');
  if (contentEl) {
    contentEl.innerHTML = page.render();
  }

  renderSidebar();
  renderPageNav();
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (page.id === 'playground') {
    PlaygroundManager.mount();
  } else {
    PlaygroundManager.unmount();
  }
}

function syncThemeIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');
  if (iconSun) iconSun.classList.toggle('hidden', !isDark);
  if (iconMoon) iconMoon.classList.toggle('hidden', isDark);
}

// ============================================================================
// Global Event Delegation & Initialization
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  syncThemeIcons();

  // Delegated click handler for navigation, copy buttons, and action tabs
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      const targetPage = navBtn.getAttribute('data-nav');
      const searchInput = document.getElementById('doc-search');
      const searchResults = document.getElementById('search-results');
      const clearBtn = document.getElementById('clear-search-btn');
      if (searchInput && searchResults && clearBtn) {
        searchInput.value = '';
        searchResults.classList.add('hidden');
        clearBtn.classList.add('hidden');
      }
      navigateTo(targetPage);
      return;
    }

    const copyIdBtn = e.target.closest('[data-copy-id]');
    if (copyIdBtn) {
      const code = CODE_SNIPPETS[copyIdBtn.getAttribute('data-copy-id')];
      if (code) copyTextWithFeedback(code, copyIdBtn);
      return;
    }

    const copyTextBtn = e.target.closest('[data-copy-text]');
    if (copyTextBtn) {
      const text = copyTextBtn.getAttribute('data-copy-text');
      if (text) copyTextWithFeedback(text, copyTextBtn);
      return;
    }

    const tabBtn = e.target.closest('[data-action-tab]');
    if (tabBtn) {
      activeActionTab = tabBtn.getAttribute('data-action-tab');
      const container = document.getElementById('action-tabs-container');
      if (container) container.innerHTML = renderActionTabsHtml();
    }
  });

  // Mobile drawer buttons
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const closeSidebarBtn = document.getElementById('close-sidebar-btn');
  const backdropEl = document.getElementById('sidebar-backdrop');
  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
  if (backdropEl) backdropEl.addEventListener('click', closeSidebar);

  // Theme toggle
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      syncThemeIcons();
    });
  }

  // Live search input
  const searchInput = document.getElementById('doc-search');
  const searchResultsEl = document.getElementById('search-results');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  if (searchInput && searchResultsEl && clearSearchBtn) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        searchResultsEl.classList.add('hidden');
        clearSearchBtn.classList.add('hidden');
        return;
      }

      clearSearchBtn.classList.remove('hidden');
      const matches = DOC_PAGES.filter((p) => {
        const hay = `${p.title} ${p.description} ${p.group} ${p.keywords.join(' ')}`.toLowerCase();
        return hay.includes(q);
      });

      if (matches.length === 0) {
        searchResultsEl.innerHTML = `
          <div class="p-3 text-xs text-zinc-500 dark:text-zinc-400 text-center">
            No matching docs found for "${escapeHtml(q)}"
          </div>
        `;
      } else {
        searchResultsEl.innerHTML = matches
          .map((p) => {
            const matchedKw = p.keywords.find((k) => k.toLowerCase().includes(q));
            const badge = matchedKw
              ? `<span class="mt-1 inline-block rounded bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] text-sky-600 dark:text-sky-400">${escapeHtml(matchedKw)}</span>`
              : '';
            return `
              <button
                type="button"
                data-nav="${p.id}"
                class="w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors"
              >
                <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">${escapeHtml(p.title)}</div>
                <div class="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">${escapeHtml(p.description)}</div>
                ${badge}
              </button>
            `;
          })
          .join('');
      }

      searchResultsEl.classList.remove('hidden');
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchResultsEl.classList.add('hidden');
      clearSearchBtn.classList.add('hidden');
      searchInput.focus();
    });
  }

  // Initial route
  const initialHash = window.location.hash.replace('#', '');
  const initialPage = DOC_PAGES.some((p) => p.id === initialHash) ? initialHash : 'quickstart';
  navigateTo(initialPage);
});
