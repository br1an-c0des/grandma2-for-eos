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

// Restore saved theme
const savedTheme = localStorage.getItem("theme") || "dark";
setTheme(savedTheme);

// ===== Mobile Menu Toggle =====
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// Close sidebar on link click (mobile)
sidebar.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    sidebar.classList.remove("open");
  }
});

// ===== Load Content & Build Page =====
const sectionsContainer = document.getElementById("sections");
const tocList = document.getElementById("tocList");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const searchResultsList = document.getElementById("searchResultsList");

// Sections that act as group headers (no content of their own)
const GROUP_HEADERS = [
  "A few core concepts about MA2",
  "Non-Similar Commands & Syntax - Important commands on MA2",
];

let allSections = [];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function renderSpans(segments) {
  return segments
    .map((seg) => {
      let text = escapeHtml(seg.text);
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

function renderSection(section) {
  const slug = slugify(section.title);
  const isGroup = GROUP_HEADERS.includes(section.title);

  if (isGroup) {
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

function buildToc(sections) {
  let html = "";
  for (const section of sections) {
    const slug = slugify(section.title);
    const isGroup = GROUP_HEADERS.includes(section.title);

    if (isGroup) {
      html += `<li><span class="toc-group-header">${escapeHtml(section.title)}</span></li>`;
    } else {
      html += `<li><a href="#${slug}" data-section="${slug}">${escapeHtml(section.title)}</a></li>`;
    }
  }
  return html;
}

// ===== Search =====
function buildSearchIndex(sections) {
  const index = [];
  for (const section of sections) {
    if (GROUP_HEADERS.includes(section.title)) continue;
    for (const line of section.lines) {
      const text = getLineText(line);
      if (text.trim() && !isSeparator(text)) {
        index.push({
          sectionTitle: section.title,
          sectionSlug: slugify(section.title),
          text: text,
          segments: line,
        });
      }
    }
  }
  return index;
}

let searchIndex = [];
let searchTimeout = null;

function performSearch(query) {
  if (!query || query.length < 2) {
    searchResults.hidden = true;
    sectionsContainer.hidden = false;
    document.querySelector(".hero").hidden = false;
    return;
  }

  const lower = query.toLowerCase();
  const results = searchIndex.filter((item) =>
    item.text.toLowerCase().includes(lower)
  );

  sectionsContainer.hidden = true;
  document.querySelector(".hero").hidden = true;
  searchResults.hidden = false;

  if (results.length === 0) {
    searchResultsList.innerHTML =
      '<p class="no-results">No results found.</p>';
    return;
  }

  // Limit display and group
  const limited = results.slice(0, 50);
  searchResultsList.innerHTML = limited
    .map((r) => {
      const highlighted = highlightMatch(escapeHtml(r.text), query);
      return `<div class="search-result-item" data-slug="${r.sectionSlug}">
        <div class="search-result-section">${escapeHtml(r.sectionTitle)}</div>
        <div class="search-result-text">${highlighted}</div>
      </div>`;
    })
    .join("");

  // Click to navigate
  searchResultsList.querySelectorAll(".search-result-item").forEach((el) => {
    el.addEventListener("click", () => {
      const slug = el.dataset.slug;
      searchInput.value = "";
      searchResults.hidden = true;
      sectionsContainer.hidden = false;
      document.querySelector(".hero").hidden = false;
      const target = document.getElementById(slug);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
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
  const tocLinks = document.querySelectorAll(".toc-list a[data-section]");
  const sectionEls = [];

  tocLinks.forEach((link) => {
    const el = document.getElementById(link.dataset.section);
    if (el) sectionEls.push({ el, link });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          tocLinks.forEach((l) => l.classList.remove("active"));
          const match = sectionEls.find((s) => s.el === entry.target);
          if (match) match.link.classList.add("active");
        }
      });
    },
    { rootMargin: "-10% 0px -80% 0px" }
  );

  sectionEls.forEach((s) => observer.observe(s.el));
}

// ===== Init =====
fetch("content.json")
  .then((r) => r.json())
  .then((sections) => {
    allSections = sections;
    sectionsContainer.innerHTML = sections.map(renderSection).join("");
    tocList.innerHTML = buildToc(sections);
    searchIndex = buildSearchIndex(sections);
    setupScrollSpy();
  });
