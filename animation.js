CustomEase.create("osmo-ease", "0.625, 0.05, 0, 1");

let lenis;
let staggerDefault = 0.075;
let durationDefault = 0.8;

gsap.defaults({
  ease: "osmo-ease",
  duration: durationDefault,
});
gsap.config({ nullTargetWarn: false });

let menuOpen = false;
let menuButton = document.querySelector(".menu-button");

function initLenis() {
  lenis = new Lenis({
    lerp: 0.12,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function initLenisCheckScrollUpDown() {
  var lastScrollTop = 0;
  var threshold = 50;
  var thresholdTop = 50;

  var scrollHandler = function (e) {
    var nowScrollTop = e.targetScroll;

    if (Math.abs(lastScrollTop - nowScrollTop) >= threshold) {
      // Check Scroll Direction
      if (nowScrollTop > lastScrollTop) {
        document.body.setAttribute("data-scrolling-direction", "down");
      } else {
        document.body.setAttribute("data-scrolling-direction", "up");
      }
      lastScrollTop = nowScrollTop;

      // Check if Scroll Started
      if (nowScrollTop > thresholdTop) {
        document.body.setAttribute("data-scrolling-started", "true");
      } else {
        document.body.setAttribute("data-scrolling-started", "false");
      }
    }
  };

  function startCheckScroll() {
    lenis.on("scroll", scrollHandler);
  }

  function stopCheckScroll() {
    lenis.off("scroll", scrollHandler);
  }

  startCheckScroll();
}

function isTouchScreendevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints;
}

function initCurrentYear(next) {
  const currentYear = new Date().getFullYear();
  const currentYearElements = next.querySelectorAll("[data-current-year]");
  if (currentYearElements.length > 0) {
    currentYearElements.forEach((currentYearElement) => {
      currentYearElement.textContent = currentYear;
    });
  }
}

function initSplit(next) {
  next = next || document;
  let lineTargets = next.querySelectorAll('[data-split="lines"]');
  let letterTargets = next.querySelectorAll('[data-split="letters"]');
  let splitTextLines = null;
  let splitTextLetters = [];

  function splitText(next) {
    if (splitTextLines) {
      splitTextLines.revert();
    }
    splitTextLetters.forEach((instance) => {
      if (instance) instance.revert();
    });
    splitTextLetters = [];

    // Lines
    splitTextLines = new SplitText(lineTargets, {
      type: "lines",
      linesClass: "single-line",
    });

    splitTextLines.lines.forEach((line) => {
      let wrapper = document.createElement("div");
      wrapper.classList.add("single-line-wrap");
      line.parentNode.insertBefore(wrapper, line);
      wrapper.appendChild(line);
    });

    // Letters
    splitTextLetters = Array.from(letterTargets).map((target) => {
      if (target.hasAttribute("split-ran")) return;
      return new SplitText(target, {
        type: "words, chars",
        charsClass: "single-letter",
      });
    });

    splitTextLetters.forEach((instance) => {
      if (instance) {
        instance.elements[0].setAttribute("split-ran", "true");
        if (instance.elements[0].hasAttribute("data-letters-delay")) {
          instance.chars.forEach((letter, index) => {
            let delay = index / 150 + "s";
            letter.style.setProperty("transition-delay", delay);
          });
        }
      }
    });
  }

  // Workaround for splitting lines off screen – seems to work :)
  gsap.set(".modal-wrap", { display: "block", autoAlpha: 0 });

  // Perform the initial split
  splitText(next);

  // After split, immediately reset position
  gsap.set(".modal-wrap", { display: "none", autoAlpha: 1, clearProps: true });

  // Add a debounced resize event listener
  let resizeTimeout;
  let lastWidth = window.innerWidth;

  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return; // Ignore height-only resizes

    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      lastWidth = window.innerWidth;
      splitText(next);
      initTextScroll(next);
      initLoad(next);
    }, 300);
  });
}

function initLoad(next) {
  let nav = document.querySelector(".nav-row");
  if (!nav) return;
  let header = document.querySelector(".header");
  let topLine = next.querySelector(".line-top");
  let hero = next.querySelector(".section");
  let lines = hero.querySelectorAll(".single-line");
  let pWrap = hero.querySelector('[data-load-items="wrap-p"]');
  let buttonWrap = hero.querySelector('[data-load-items="wrap-buttons"]');
  let heroTextReveal = next.querySelectorAll('[data-load-items="hero"]');
  let logoLargeReveal = next.querySelectorAll('[data-load-items="logo"]');
  let logoSmallReveal = document.querySelector(".navbar_logo");
  let revealItems = next.querySelectorAll('[data-load-items="reveal"]');
  let fadeItems = next.querySelectorAll('[data-load-items="fade"]');
  let pItems, buttons;

  if (pWrap) {
    pItems = pWrap.querySelectorAll("p");
  }
  if (buttonWrap) {
    buttons = buttonWrap.querySelectorAll(".button");
  }

  let tl = gsap.timeline({
    defaults: {
      ease: "osmo-ease",
      duration: 1.2,
    },
    onComplete: () => {
      ScrollTrigger.refresh();
    },
  });

  tl.set(hero, { autoAlpha: 1 }, 0.5);
  tl.to(lines, { y: 0, stagger: staggerDefault }, "<")
    //.to(header, { backgroundColor: "#181818" }, "<")
    .to(nav, { y: 0 }, "<");

  //reveal other items below fold on load
  if (revealItems.length > 0) {
    tl.from(
      revealItems,
      {
        yPercent: 20,
        autoAlpha: 0,
        stagger: staggerDefault,
      },
      "<"
    );
    tl.to(topLine, { width: "100%" }, "<");
  }

  if (logoLargeReveal.length > 0) {
    tl.set(logoSmallReveal, { opacity: 0 }, "<");
    tl.to(
      logoLargeReveal,
      {
        yPercent: -20,
        autoAlpha: 1,
        opacity: 1,
      },
      "<"
    );
    tl.to(
      logoLargeReveal,
      {
        yPercent: 0,
        autoAlpha: 0,
        opacity: 0,
      },
      ">=0.5"
    );
    tl.from(
      heroTextReveal,
      {
        yPercent: 20,
        autoAlpha: 0,
        stagger: staggerDefault,
      },
      ">=0.5"
    );
    tl.to(lines, { y: 0, stagger: staggerDefault }, "<");
    tl.to(
      logoSmallReveal,
      {
        opacity: 1,
      },
      "<"
    );
  }
  //reveal other items below fold on load
  if (fadeItems.length > 0) {
    tl.to(
      fadeItems,
      {
        opacity: 1,
        stagger: staggerDefault,
      },
      "<"
    );
  }

  if (pWrap) {
    tl.to(pItems, { y: 0, stagger: staggerDefault }, 0.3);
  }
  if (buttonWrap) {
    tl.from(buttons, { autoAlpha: 0, duration: 0.6, stagger: staggerDefault }, 0.8);
  }
}

function initTextScroll(next) {
  let targets = next.querySelectorAll('[data-reveal="scroll"]');

  targets.forEach((target) => {
    lines = target.querySelectorAll(".single-line");
    gsap.to(lines, {
      y: 0,
      duration: durationDefault + 0.2,
      stagger: staggerDefault,
      scrollTrigger: {
        trigger: target,
        start: "top 90%",
        once: true,
      },
    });
  });
}

function debounce(func, delay) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(func, delay);
  };
}

function initMobileMenu() {
  let menu = document.querySelector(".nav-menu");
  if (!menu) return;
  let navFadeTargets = document.querySelectorAll("[data-nav-button]");
  let menuFadeTargets = menu.querySelectorAll("[data-menu-reveal]");
  let menuDrawIn = menu.querySelectorAll(".menu_link-line");
  let menuBg = document.querySelector(".menu-bg");
  let burgerText = document.querySelectorAll(".menu_trigger-text");
  let burgerLine = document.querySelectorAll(".burger_line");

  let tl = gsap.timeline();

  const openMenu = () => {
    menuOpen = true;
    menuButton.classList.add("close");
    document.body.setAttribute("data-nav-status", "open");

    tl.clear()

      .set([menu, menuBg], { display: "flex" })
      .fromTo(menuBg, { autoAlpha: 0 }, { autoAlpha: 1 })
      .fromTo(burgerText[0], { y: 0 }, { y: -14 }, "<")
      .fromTo(burgerText[1], { y: 0 }, { y: -14 }, "<")
      .fromTo(burgerLine[0], { y: 0, rotate: 0 }, { y: 6, rotate: 45 }, "<")
      .fromTo(burgerLine[1], { y: 0, rotate: 0 }, { y: -5, rotate: -45 }, "<")
      .fromTo(
        navFadeTargets,
        { autoAlpha: 1, y: "0em" },
        {
          autoAlpha: 0,
          y: "-3em",
          stagger: 0.01,
        },
        "<"
      )
      .fromTo(menu, { yPercent: -120 }, { yPercent: 0 }, "<+=0.2")
      .fromTo(
        menuDrawIn,
        { duration: 0.5, autoAlpha: 0, width: "0%" },
        {
          autoAlpha: 1,
          width: "100%",
          stagger: 0.15,
        },
        "<+=0.20"
      )
      .fromTo(
        ".menu_link-text",
        { autoAlpha: 0, yPercent: 50 },
        {
          autoAlpha: 1,
          yPercent: 0,
          stagger: 0.05,
        },
        "<+=0.25"
      )
      .fromTo(
        menuFadeTargets,
        { autoAlpha: 0, yPercent: 50 },
        {
          autoAlpha: 1,
          yPercent: 0,
          stagger: 0.05,
        },
        "<+=0.25"
      );
  };

  const closeMenu = () => {
    menuOpen = false;
    menuButton.classList.remove("close");
    document.body.setAttribute("data-nav-status", "closed");

    // Clear the timeline and define the closing animations
    tl.clear()
      .set(menu, { display: "none" })
      .to(menu, { yPercent: -120 })
      .to(menuBg, { autoAlpha: 0, duration: 0.5 }, "<")
      .to(burgerText[0], { y: 0 }, "<")
      .to(burgerText[1], { y: 0 }, "<")
      .to(burgerLine[0], { y: 0, rotate: 0 }, "<")
      .to(burgerLine[1], { y: 0, rotate: 0 }, "<")
      .to(navFadeTargets, { autoAlpha: 1, y: "0em", stagger: { each: 0.05, from: "end" } }, "<+=0.2")
      .to(
        ".menu_link-line",
        {
          autoAlpha: 1,
          width: "0%",
          stagger: { each: 0.05, from: "end" },
          duration: 0.5,
        },
        "<+=0.25"
      )
      .to(
        ".menu_link-text",
        {
          autoAlpha: 0,
          yPercent: 50,
          duration: 0.5,
        },
        "<+=0.25"
      );
  };

  menuButton.addEventListener("click", () => {
    menuOpen ? closeMenu() : openMenu();
  });

  menuBg.addEventListener("click", () => {
    closeMenu();
  });
}
initMobileMenu();

//
// Home specific functions:
//

function homeNav() {
  gsap.set(".nav-line", { autoAlpha: 0 });
  gsap.set('[data-scrolling-direction="down"] .nav-line', { autoAlpha: 1 });

  ScrollTrigger.create({
    start: "top -5rem",
    end: 99999,
    markers: false,
    toggleClass: { className: "navbar--scrolled", targets: ".header" },
  });

  gsap.to(el, {
    opacity: 1,
    scrollTrigger: {
      trigger: el,
      start: "top -150",
      scrub: true,
    },
    color: "#fff",
  });
}

function initGeneral(next) {
  initLenis();
  initLenisCheckScrollUpDown();
  initSplit(next);
  initLoad(next);
  initTextScroll(next);
  initCurrentYear(next);
}

// Initialize functions on page load
document.addEventListener("DOMContentLoaded", () => {
  initGeneral(document);
});
