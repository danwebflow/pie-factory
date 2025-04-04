gsap.registerPlugin(SplitText, CustomEase, ScrambleTextPlugin, Flip, Draggable, InertiaPlugin);

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

  // Perform the initial split
  splitText(next);

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
  let hero = next.querySelector(".section");
  let lines = hero.querySelectorAll(".single-line");
  let revealItems = next.querySelectorAll('[data-load-items="reveal"]');
  let fadeItems = next.querySelectorAll('[data-load-items="fade"]');
  let progessLinesSidebar = document.querySelector("[data-progress='vertical']"); // height 100%
  let progessVertical = document.querySelectorAll(
    "[data-progress='vertical-section']"); // height 100%
  let progessWidth = document.querySelectorAll("[data-progress='width']"); // width 100%

  let tl = gsap.timeline({
    defaults: {
      ease: "osmo-ease",
      duration: 1.2,
    },
    onComplete: () => {
      ScrollTrigger.refresh();
    },
  });

  tl.set(progessVertical, { height: "0vw" }, 0);
  tl.set(progessWidth, { width: "0%" }, 0);
  tl.set(progessLinesSidebar, { height: "0%" }, 0);

  tl.set(hero, { autoAlpha: 1 }, 0);

  //Progress Lines Animation
  tl.to(
      progessLinesSidebar,
      {
        height: "100%",
      },
      "<"
    )
    .to(
      progessVertical,
      {
        height: "75vw",
      },
      "<"
    )
    .to(
      progessWidth,
      {
        width: "100%",
      },
      "<"
    );

  tl.to(lines, { y: 0, stagger: staggerDefault },
      "<+=0.6") // Synchronize lines animation with progress completion
    .to(nav, { y: 0 }, "<")

    .from(
      revealItems,
      {
        yPercent: 20,
        autoAlpha: 0,
        stagger: staggerDefault,
      },
      "<"
    );

  //Fade other items below fold on load
  if (fadeItems.length > 1) {
    tl.to(
      fadeItems,
      {
        opacity: 1,
        stagger: staggerDefault,
      },
      "<+=0.4" // Synchronize with revealItems
    );
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
        navFadeTargets, { autoAlpha: 1, y: "0em" },
        {
          autoAlpha: 0,
          y: "-3em",
          stagger: 0.01,
        },
        "<"
      )
      .fromTo(menu, { yPercent: -120 }, { yPercent: 0 }, "<+=0.2")
      .fromTo(
        menuDrawIn, { duration: 0.5, autoAlpha: 0, width: "0%" },
        {
          autoAlpha: 1,
          width: "100%",
          stagger: 0.15,
        },
        "<+=0.20"
      )
      .fromTo(
        ".menu_link-text", { autoAlpha: 0, yPercent: 50 },
        {
          autoAlpha: 1,
          yPercent: 0,
          stagger: 0.05,
        },
        "<+=0.25"
      )
      .fromTo(
        menuFadeTargets, { autoAlpha: 0, yPercent: 50 },
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
      .to(navFadeTargets, { autoAlpha: 1, y: "0em", stagger: { each: 0.05, from: "end" } },
        "<+=0.2")
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
// Animation Load Functions
//

function initGeneral(next) {
  initLenis();
  initLenisCheckScrollUpDown();
  initSplit(next);
  initLoad(next);
  initTextScroll(next);
  initCurrentYear(next);
}

// Initialize functions on page load

initGeneral(document);
