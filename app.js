// ===== Theme Toggle =====
const themeToggle = document.getElementById("themeToggle");
const themeIcon = themeToggle.querySelector(".theme-icon");
const html = document.documentElement;

function setTheme(theme) {
  html.setAttribute("data-theme", theme);
  themeIcon.textContent = theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
  localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
  const current = html.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
});

const savedTheme = localStorage.getItem("theme") || "dark";
setTheme(savedTheme);

// ===== Mobile Menu Toggle =====
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

sidebar.addEventListener("click", (e) => {
  if (e.target.tagName === "A" || e.target.closest(".toc-group-link")) {
    sidebar.classList.remove("open");
  }
});

// ===== DOM refs =====
const pagesContainer = document.getElementById("pages");
const tocList = document.getElementById("tocList");
const searchInput = document.getElementById("searchInput");
const searchResultsList = document.getElementById("searchResultsList");
const homeLink = document.getElementById("homeLink");
const homeNav = document.getElementById("homeNav");

// ===== Section Groups =====
const SECTION_GROUPS = [
  {
    id: "introduction",
    label: "Introduction",
    description: "Background, purpose, and how to read this guide",
    sections: ["Introduction", "Tips for reading the guide"],
  },
  {
    id: "core-concepts",
    label: "Core Concepts",
    description: "Syntax order, channel selection, the programmer, fixtures, and attributes",
    sections: [
      "A few core concepts about MA2",
      "SYNTAX ORDER",
      "CHANNEL SELECTION",
      'THE \u201cPROGRAMMER\u201d',
      "FIXTURE # VS CHANNEL #",
      "ORGANIZATION OF ATTRIBUTES",
      "A NOTE ON WORKFLOW AND COMMANDS",
    ],
  },
  {
    id: "commands",
    label: "Commands",
    description: "General commands, displays, patch, presets, effects, and more",
    sections: [
      "GENERAL COMMANDS AND TERMS",
      "DISPLAYS & VIEWS",
      "PATCH",
      "MORE COMMANDS",
      "PRESETS",
      "IF",
      "OTHER COMMANDS",
      "EFFECTS",
    ],
  },
  {
    id: "non-similar",
    label: "Non-Similar Commands",
    description: "Commands unique to MA2 with no direct Eos equivalent",
    sections: [
      "Non-Similar Commands & Syntax - Important commands on MA2",
      "BLIND & PREVIEW",
      "EXECUTOR/FADER OPTIONS",
    ],
  },
  {
    id: "resources",
    label: "Resources",
    description: "External links and further reading",
    sections: ["External Resources"],
  },
];

// Sections that are just group intro text (no real content)
const GROUP_INTRO_HEADERS = [
  "A few core concepts about MA2",
  "Non-Similar Commands & Syntax - Important commands on MA2",
];

let allSections = [];
let searchIndex = [];
let searchTimeout = null;
let currentPage = "home";

// ===== Helpers =====
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getLineText(segments) {
  return segments.map((s) => s.text).join("");
}

function isSeparator(text) {
  const stripped = text.replace(/[\u2014\u2013\u2015\u2500\u2501-]/g, "").trim();
  return stripped.length === 0 && text.length > 5;
}

function formatTocName(title) {
  if (title === title.toUpperCase() && title.length > 3) {
    return title
      .split(" ")
      .map((w) => {
        if (["&", "VS", "#"].includes(w)) return w.toLowerCase();
        return w.charAt(0) + w.slice(1).toLowerCase();
      })
      .join(" ");
  }
  return title;
}

function renderSpans(segments) {
  return segments
    .map((seg) => {
      const text = escapeHtml(seg.text);
      const classes = [];
      if (seg.color === "ma2") classes.push("ma2");
      if (seg.color === "eos") classes.push("eos");
      if (seg.bold) classes.push("bold-text");
      if (classes.length > 0) {
        return `<span class="${classes.join(" ")}">${text}</span>`;
      }
      return text;
    })
    .join("");
}

// ===== Rendering =====
function renderSection(section) {
  const slug = slugify(section.title);

  if (GROUP_INTRO_HEADERS.includes(section.title)) {
    return `<div class="section" id="${slug}">
      <div class="section-group-title">${escapeHtml(section.title)}</div>
    </div>`;
  }

  let linesHtml = "";
  for (const line of section.lines) {
    const text = getLineText(line);
    if (isSeparator(text)) {
      linesHtml += '<hr class="line-separator">';
    } else if (text.startsWith("**")) {
      linesHtml += `<p class="note">${renderSpans(line)}</p>`;
    } else {
      linesHtml += `<p class="line">${renderSpans(line)}</p>`;
    }
  }

  return `<div class="section" id="${slug}">
    <h2 class="section-title">${escapeHtml(section.title)}</h2>
    ${linesHtml}
  </div>`;
}

function renderPage(group, sections) {
  const groupSections = sections.filter((s) =>
    group.sections.includes(s.title)
  );

  let sectionsHtml = groupSections.map(renderSection).join("");

  // Prev/next navigation
  const idx = SECTION_GROUPS.indexOf(group);
  const prev = idx > 0 ? SECTION_GROUPS[idx - 1] : null;
  const next = idx < SECTION_GROUPS.length - 1 ? SECTION_GROUPS[idx + 1] : null;

  let navHtml = '<div class="page-nav">';
  if (prev) {
    navHtml += `<a href="#" class="prev" data-page="${prev.id}">
      <span class="nav-label">\u2190 Previous</span>
      <span class="nav-title">${escapeHtml(prev.label)}</span>
    </a>`;
  }
  if (next) {
    navHtml += `<a href="#" class="next" data-page="${next.id}">
      <span class="nav-label">Next \u2192</span>
      <span class="nav-title">${escapeHtml(next.label)}</span>
    </a>`;
  }
  navHtml += "</div>";

  return `<div class="page" id="page-${group.id}">
    <h1 class="page-title">${escapeHtml(group.label)}</h1>
    ${sectionsHtml}
    ${navHtml}
  </div>`;
}

// ===== Navigation =====
function showPage(pageId) {
  currentPage = pageId;

  // Hide all pages
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("visible"));

  // Show target page
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add("visible");

  // Update sidebar active states
  document.querySelectorAll(".toc-group-link").forEach((link) => {
    const isActive = link.dataset.page === pageId;
    link.classList.toggle("active", isActive);
    // Expand sub-list for active group
    const sublist = link.nextElementSibling;
    if (sublist && sublist.classList.contains("toc-sublist")) {
      sublist.classList.toggle("expanded", isActive);
    }
  });

  // Scroll to top of content
  window.scrollTo({ top: 0, behavior: "instant" });

  // Update URL hash
  if (pageId === "home") {
    history.replaceState(null, "", window.location.pathname);
  } else {
    history.replaceState(null, "", `#${pageId}`);
  }
}

function navigateToSection(pageId, sectionSlug) {
  showPage(pageId);
  // Small delay to ensure the page is visible before scrolling
  requestAnimationFrame(() => {
    const el = document.getElementById(sectionSlug);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  });
}

// ===== TOC =====
function buildToc() {
  let html = "";
  for (const group of SECTION_GROUPS) {
    html += `<li>
      <a href="#" class="toc-group-link" data-page="${group.id}">${escapeHtml(group.label)}</a>
      <ul class="toc-sublist" data-group="${group.id}">`;

    for (const title of group.sections) {
      if (GROUP_INTRO_HEADERS.includes(title)) continue;
      const slug = slugify(title);
      const displayName = formatTocName(title);
      html += `<li><a href="#" data-page="${group.id}" data-section="${slug}">${escapeHtml(displayName)}</a></li>`;
    }

    html += `</ul></li>`;
  }
  return html;
}

// ===== Home Nav Cards =====
function buildHomeNav() {
  return SECTION_GROUPS.map(
    (group) =>
      `<a href="#" class="home-nav-card" data-page="${group.id}">
        <h3>${escapeHtml(group.label)}</h3>
        <p>${escapeHtml(group.description)}</p>
      </a>`
  ).join("");
}

// ===== Search =====
function buildSearchIndex(sections) {
  // Build section-to-group lookup
  const sectionToGroup = {};
  for (const group of SECTION_GROUPS) {
    for (const title of group.sections) {
      sectionToGroup[title] = group.id;
    }
  }

  const index = [];
  for (const section of sections) {
    if (GROUP_INTRO_HEADERS.includes(section.title)) continue;
    const groupId = sectionToGroup[section.title];
    for (const line of section.lines) {
      const text = getLineText(line);
      if (text.trim() && !isSeparator(text)) {
        index.push({
          sectionTitle: section.title,
          sectionSlug: slugify(section.title),
          groupId: groupId,
          text: text,
        });
      }
    }
  }
  return index;
}

function performSearch(query) {
  const pageHome = document.getElementById("page-home");
  const pageSearch = document.getElementById("page-search");

  if (!query || query.length < 2) {
    pageSearch.hidden = true;
    // Return to previous page
    showPage(currentPage === "search" ? "home" : currentPage);
    return;
  }

  // Hide all pages, show search
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("visible"));
  pageSearch.hidden = false;
  pageSearch.classList.add("visible");

  // Clear active states in sidebar
  document.querySelectorAll(".toc-group-link").forEach((l) => l.classList.remove("active"));
  document.querySelectorAll(".toc-sublist").forEach((l) => l.classList.remove("expanded"));

  const lower = query.toLowerCase();
  const results = searchIndex.filter((item) =>
    item.text.toLowerCase().includes(lower)
  );

  if (results.length === 0) {
    searchResultsList.innerHTML = '<p class="no-results">No results found.</p>';
    return;
  }

  const limited = results.slice(0, 50);
  searchResultsList.innerHTML = limited
    .map((r) => {
      const highlighted = highlightMatch(escapeHtml(r.text), query);
      return `<div class="search-result-item" data-page="${r.groupId}" data-section="${r.sectionSlug}">
        <div class="search-result-section">${escapeHtml(r.sectionTitle)}</div>
        <div class="search-result-text">${highlighted}</div>
      </div>`;
    })
    .join("");
}

function highlightMatch(text, query) {
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  return text.replace(regex, "<mark>$1</mark>");
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch(searchInput.value.trim());
  }, 200);
});

// ===== Scroll Spy =====
function setupScrollSpy() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll(".toc-sublist a").forEach((a) => {
            a.classList.toggle("active", a.dataset.section === id);
          });
        }
      });
    },
    { rootMargin: "-10% 0px -80% 0px" }
  );

  document.querySelectorAll(".section[id]").forEach((el) => observer.observe(el));
}

// ===== Click Handlers (delegated) =====
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-page]");
  if (!link) return;
  e.preventDefault();

  const pageId = link.dataset.page;
  const sectionSlug = link.dataset.section;

  // Clear search if navigating away
  if (searchInput.value) {
    searchInput.value = "";
    document.getElementById("page-search").hidden = true;
  }

  if (sectionSlug) {
    navigateToSection(pageId, sectionSlug);
  } else {
    showPage(pageId);
  }
});

homeLink.addEventListener("click", (e) => {
  e.preventDefault();
  if (searchInput.value) {
    searchInput.value = "";
    document.getElementById("page-search").hidden = true;
  }
  showPage("home");
});

// ===== Init =====
fetch("content.json")
  .then((r) => r.json())
  .then((sections) => {
    allSections = sections;

    // Build pages
    pagesContainer.innerHTML = SECTION_GROUPS.map((g) =>
      renderPage(g, sections)
    ).join("");

    // Build sidebar TOC
    tocList.innerHTML = buildToc();

    // Build home nav cards
    homeNav.innerHTML = buildHomeNav();

    // Build search index
    searchIndex = buildSearchIndex(sections);

    // Set up scroll spy
    setupScrollSpy();

    // Handle initial hash
    const hash = window.location.hash.slice(1);
    if (hash && SECTION_GROUPS.some((g) => g.id === hash)) {
      showPage(hash);
    } else {
      showPage("home");
    }
  });
