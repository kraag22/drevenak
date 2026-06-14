// ============================================================
// DŘEVĚNÝ MUŽ 2026 — interactivity (vanilla, no framework)
// ============================================================
(function () {
  "use strict";

  // ---------------- NAV: scrolled + scroll-spy + burger ----------------
  const nav = document.querySelector(".nav");
  const navLinksWrap = document.querySelector(".nav-links");
  const burger = document.querySelector(".nav-burger");
  const navIds = ["top", "informace", "trat", "registrace", "fotogalerie", "sponzori", "kontakt"];
  const navLinks = navIds.reduce((m, id) => {
    m[id] = document.querySelector('.nav-links a[href="#' + id + '"]');
    return m;
  }, {});

  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);
    const mid = window.scrollY + window.innerHeight * 0.32;
    let cur = "top";
    for (const id of navIds) {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= mid) cur = id;
    }
    for (const id of navIds) {
      if (navLinks[id]) navLinks[id].classList.toggle("active", id === cur);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (burger && navLinksWrap) {
    const setBurgerIcon = (open) =>
      (burger.innerHTML = open
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>');
    setBurgerIcon(false);
    burger.addEventListener("click", () => {
      const open = navLinksWrap.classList.toggle("open");
      setBurgerIcon(open);
    });
    navLinksWrap.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        navLinksWrap.classList.remove("open");
        setBurgerIcon(false);
      })
    );
  }

  // ---------------- COUNTDOWN ----------------
  const RACE_DATE = new Date("2026-08-02T10:00:00");
  const cd = document.querySelector(".countdown");
  if (cd) {
    const pad = (n) => String(n).padStart(2, "0");
    const nums = cd.querySelectorAll(".cd-num");
    const tick = () => {
      let diff = Math.max(0, RACE_DATE.getTime() - Date.now());
      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000); diff -= h * 3600000;
      const m = Math.floor(diff / 60000); diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      const vals = [String(d), pad(h), pad(m), pad(s)];
      nums.forEach((el, i) => { el.textContent = vals[i]; });
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---------------- TRAŤ: course tabs ----------------
  const COURSES = {
    kratka: { swim: { dist: 250, unit: "m", laps: "½ okruhu" }, bike: { dist: 12, unit: "km", laps: "1 okruh" }, run: { dist: 2.5, unit: "km", laps: "1 okruh" } },
    dlouha: { swim: { dist: 500, unit: "m", laps: "1 okruh" }, bike: { dist: 24, unit: "km", laps: "2 okruhy" }, run: { dist: 5, unit: "km", laps: "2 okruhy" } },
    olympijska: { swim: { dist: 1500, unit: "m", laps: "3 okruhy" }, bike: { dist: 36, unit: "km", laps: "3 okruhy" }, run: { dist: 10, unit: "km", laps: "4 okruhy" } },
  };
  const tabs = document.querySelectorAll(".course-tab");
  const discs = document.querySelectorAll(".disc[data-disc]");
  function setCourse(key) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.course === key));
    const c = COURSES[key];
    discs.forEach((disc) => {
      const d = c[disc.dataset.disc];
      if (!d) return;
      const distEl = disc.querySelector(".dist");
      distEl.innerHTML = d.dist + '<span class="u">' + d.unit + "</span>";
      distEl.classList.remove("disc-flip");
      void distEl.offsetWidth; // reflow to restart animation
      distEl.classList.add("disc-flip");
      disc.querySelector(".laps").textContent = d.laps;
    });
  }
  tabs.forEach((t) => t.addEventListener("click", () => setCourse(t.dataset.course)));

  // ---------------- TRAŤ: discipline blocks swap the map image ----------------
  const mapImg = document.getElementById("trat-map-img");
  const mapCap = document.getElementById("trat-map-cap");
  if (mapImg && discs.length) {
    const selectDisc = (disc) => {
      discs.forEach((d) => d.classList.toggle("disc-active", d === disc));
      mapImg.src = disc.dataset.img;
      mapImg.alt = disc.querySelector("h3").textContent;
      if (mapCap) mapCap.innerHTML = disc.dataset.cap;
    };
    discs.forEach((disc) => {
      disc.addEventListener("click", () => selectDisc(disc));
      disc.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectDisc(disc);
        }
      });
    });
  }

  // ---------------- LIGHTBOX (gallery + sponsors) ----------------
  const lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    const lbImg = lightbox.querySelector(".lb-img");
    const lbCount = lightbox.querySelector(".lb-count");
    let sources = [];
    let idx = -1;
    const render = () => {
      if (idx < 0) return;
      lbImg.src = sources[idx].src;
      lbImg.alt = sources[idx].cap;
      lbCount.textContent = idx + 1 + " / " + sources.length + " — " + sources[idx].cap;
    };
    const open = (groupSources, i) => { sources = groupSources; idx = i; render(); lightbox.classList.add("open"); };
    const close = () => { idx = -1; lightbox.classList.remove("open"); };
    const step = (dir) => { idx = (idx + dir + sources.length) % sources.length; render(); };

    // Each grid is its own lightbox group; prev/next stays within the group.
    document.querySelectorAll(".gallery, .sponsor-grid").forEach((group) => {
      const items = Array.from(group.querySelectorAll(".gitem, .sponsor-item"));
      const groupSources = items.map((el) => {
        const img = el.querySelector("img");
        // Show the full-size image in the lightbox, not the thumbnail.
        return { src: img.getAttribute("data-full") || img.getAttribute("src"), cap: img.getAttribute("alt") || "" };
      });
      items.forEach((el, i) => el.addEventListener("click", () => open(groupSources, i)));
    });

    lightbox.addEventListener("click", close);
    lbImg.addEventListener("click", (e) => e.stopPropagation());
    lightbox.querySelector(".lb-close").addEventListener("click", (e) => { e.stopPropagation(); close(); });
    lightbox.querySelector(".lb-prev").addEventListener("click", (e) => { e.stopPropagation(); step(-1); });
    lightbox.querySelector(".lb-next").addEventListener("click", (e) => { e.stopPropagation(); step(1); });
    window.addEventListener("keydown", (e) => {
      if (idx < 0) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
  }

  // ---------------- REVEAL on scroll ----------------
  const root = document.documentElement;
  root.classList.add("armed");
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  const reveal = (el) => el.classList.add("in");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }),
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach(reveal);
  }
  const check = () => {
    const h = window.innerHeight;
    reveals.forEach((el) => {
      if (el.classList.contains("in")) return;
      const r = el.getBoundingClientRect();
      if (r.top < h * 0.92 && r.bottom > 0) reveal(el);
    });
  };
  window.addEventListener("scroll", check, { passive: true });
  check();
  setTimeout(() => reveals.forEach(reveal), 2200);
})();
