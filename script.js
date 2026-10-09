/* =====================================================================
   JOHN'S PORTFOLIO - script.js (vanilla JavaScript, no libraries)
   Features: 1 Helpers  2 Footer year  3 Mobile menu  4 Scroll progress
             5 Scroll reveal + skill bars  6 Active nav link  7 Typing
             8 3D tilt cards  9 Cursor glow  10 Particles
   ===================================================================== */
(() => {
  "use strict";

  /* ---------- 1. HELPERS ---------- */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  // true when the visitor asked their device to reduce motion
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReducedMotion = () => motionQuery.matches;

  // true on devices with a real mouse (hover effects only make sense there)
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- 2. FOOTER YEAR ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 3. MOBILE MENU ---------- */
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");
  const navBackdrop = $("#navBackdrop");

  function setMenu(open) {
    navMenu.classList.toggle("is-open", open);
    navBackdrop.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  navToggle.addEventListener("click", () => setMenu(!navMenu.classList.contains("is-open")));
  navBackdrop.addEventListener("click", () => setMenu(false));
  $$(".nav__link", navMenu).forEach((link) => link.addEventListener("click", () => setMenu(false)));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navMenu.classList.contains("is-open")) {
      setMenu(false);
      navToggle.focus(); // return focus to the button
    }
  });

  // If the window is resized to desktop while the menu is open, reset it
  window.matchMedia("(min-width: 820px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- 4. SCROLL PROGRESS BAR ---------- */
  const progressBar = $("#progressBar");
  let progressTicking = false;

  function updateProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressBar.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
    progressTicking = false;
  }

  window.addEventListener("scroll", () => {
    // requestAnimationFrame keeps updates in sync with the screen (smooth)
    if (!progressTicking) {
      progressTicking = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* ---------- 5. SCROLL REVEAL + SKILL BARS ---------- */
  // Set each skill bar's target level from its data-level attribute
  $$(".skill").forEach((skill) => skill.style.setProperty("--level", skill.dataset.level || 50));

  const revealItems = $$(".reveal");

  if ("IntersectionObserver" in window && !prefersReducedMotion()) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // animate once only
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    // Fallback: show everything immediately
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------- 6. ACTIVE NAV LINK (highlights the section you're viewing) ---------- */
  const navLinks = $$(".nav__link");
  const sections = $$("main section[id]");

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
          if (isCurrent) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- 7. TYPING ANIMATION ---------- */
  const typedEl = $("#typed");
  // EDIT: change the headline here (also update aria-label in index.html)
  const headline = "AI & Data Science Student | Future Innovator.";

  if (typedEl) {
    if (prefersReducedMotion()) {
      typedEl.textContent = headline; // no animation, show instantly
    } else {
      let index = 0;
      const typeNext = () => {
        typedEl.textContent = headline.slice(0, ++index);
        if (index < headline.length) setTimeout(typeNext, 55);
      };
      setTimeout(typeNext, 900); // wait for the name reveal first
    }
  }

  /* ---------- 8. 3D TILT PROJECT CARDS ---------- */
  if (hasFinePointer) {
    const MAX_TILT = 9; // degrees

    $$(".tilt").forEach((card) => {
      let frame = null;

      card.addEventListener("pointermove", (event) => {
        if (prefersReducedMotion()) return;
        if (frame) cancelAnimationFrame(frame);

        frame = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;   // 0 to 1
          const y = (event.clientY - rect.top) / rect.height;   // 0 to 1

          card.style.setProperty("--ry", `${(x - 0.5) * MAX_TILT * 2}deg`);
          card.style.setProperty("--rx", `${(0.5 - y) * MAX_TILT * 2}deg`);
          card.style.setProperty("--mx", `${x * 100}%`);
          card.style.setProperty("--my", `${y * 100}%`);
        });
      });

      card.addEventListener("pointerleave", () => {
        if (frame) cancelAnimationFrame(frame);
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- 9. GLOWING CURSOR ---------- */
  const glow = $("#cursorGlow");

  if (glow && hasFinePointer && !prefersReducedMotion()) {
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0, running = false;

    const follow = () => {
      // Move 15% of the remaining distance each frame (smooth trailing)
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

      if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        requestAnimationFrame(follow);
      } else {
        running = false; // stop the loop when the cursor rests
      }
    };

    window.addEventListener("pointermove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      glow.classList.add("is-active");
      if (!running) { running = true; requestAnimationFrame(follow); }
    }, { passive: true });

    document.documentElement.addEventListener("pointerleave", () => glow.classList.remove("is-active"));
  }

  /* ---------- 10. BACKGROUND PARTICLES (canvas) ---------- */
  const canvas = $("#particles");

  if (canvas && !prefersReducedMotion()) {
    const ctx = canvas.getContext("2d");
    const COLORS = ["184, 255, 61", "139, 92, 246"]; // lime, purple (RGB)
    let particles = [];
    let width = 0, height = 0, rafId = null;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Fewer particles on small screens for better performance
      const count = Math.min(70, Math.floor((width * height) / 22000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.6,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.5 + 0.2,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // wrap around the edges
        if (p.x < 0) p.x = width;  else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height; else if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150); // wait until resizing stops
    });

    // Pause drawing when the tab is hidden (saves battery)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(rafId);
      else draw();
    });

    // Stop everything if the user turns on reduced motion while browsing
    motionQuery.addEventListener("change", () => {
      if (prefersReducedMotion()) { cancelAnimationFrame(rafId); canvas.style.display = "none"; }
    });
  }
})();
