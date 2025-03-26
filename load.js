/**
 * Pie Factory Main Script
 */
gsap.config({ nullTargetWarn: false });

// Global vimeo players storage
window.vimeoPlayers = {};

// Navigation with X-Translation Progress
function initDotNavigation() {
  const sections = document.querySelectorAll(`[b-section]`);

  sections.forEach((section) => {
    const sectionName = section.getAttribute("b-section");
    const link = document.querySelector(`[b-nav-link="${sectionName}"]`);
    const bg = link.querySelector(".nav-link-bg");

    if (!link || !bg) {
      return;
    }

    // Initial State - width 0%
    gsap.set(bg, { width: "0%", opacity: 1 });

    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        gsap.set(bg, { width: `${progress * 100}%` });
      },
      onLeave: () => {
        // End state - width 100%
        gsap.to(bg, { width: "100%", duration: 0.3, ease: "Power3.inOut" });
      },
    });
  });
}

function initCSSMarquee() {
  const pixelsPerSecond = 75; // Set the marquee speed (pixels per second)
  const marquees = document.querySelectorAll("[data-css-marquee]");

  // Duplicate each [data-css-marquee-list] element inside its container
  marquees.forEach((marquee) => {
    marquee.querySelectorAll("[data-css-marquee-list]").forEach((list) => {
      const duplicate = list.cloneNode(true);
      marquee.appendChild(duplicate);
    });
  });

  // Create an IntersectionObserver to check if the marquee container is in view
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target
          .querySelectorAll("[data-css-marquee-list]")
          .forEach((list) => (list.style.animationPlayState = entry.isIntersecting ? "running" : "paused"));
      });
    },
    { threshold: 0 }
  );

  // Calculate the width and set the animation duration accordingly
  marquees.forEach((marquee) => {
    marquee.querySelectorAll("[data-css-marquee-list]").forEach((list) => {
      list.style.animationDuration = list.offsetWidth / pixelsPerSecond + "s";
      list.style.animationPlayState = "paused";
    });
    observer.observe(marquee);
  });
}

function initVimeoBGVideo() {
  // Select all elements that have [data-vimeo-bg-init]
  const vimeoPlayers = document.querySelectorAll("[data-vimeo-bg-init]");

  vimeoPlayers.forEach(function (vimeoElement, index) {
    // Add Vimeo URL ID to the iframe [src]
    // Looks like: https://player.vimeo.com/video/1019191082
    const vimeoVideoID = vimeoElement.getAttribute("data-vimeo-video-id");
    if (!vimeoVideoID) return;
    const vimeoVideoURL = `https://player.vimeo.com/video/${vimeoVideoID}?api=1&background=1&autoplay=1&loop=1&muted=1`;
    vimeoElement.querySelector("iframe").setAttribute("src", vimeoVideoURL);

    // Assign an ID to each element
    const videoIndexID = "vimeo-player-index-" + index;
    vimeoElement.setAttribute("id", videoIndexID);

    const iframeID = vimeoElement.id;
    const player = new Vimeo.Player(iframeID);

    player.setVolume(0);

    player.on("bufferend", function () {
      vimeoElement.setAttribute("data-vimeo-activated", "true");
      vimeoElement.setAttribute("data-vimeo-loaded", "true");
    });

    // Update Aspect Ratio if [data-vimeo-update-size="true"]
    let videoAspectRatio;
    if (vimeoElement.getAttribute("data-vimeo-update-size") === "true") {
      player.getVideoWidth().then(function (width) {
        player.getVideoHeight().then(function (height) {
          videoAspectRatio = height / width;
          const beforeEl = vimeoElement.querySelector(".vimeo-player__before");
          if (beforeEl) {
            beforeEl.style.paddingTop = videoAspectRatio * 100 + "%";
          }
        });
      });
    }

    // Function to adjust video sizing
    function adjustVideoSizing() {
      const containerAspectRatio = (vimeoElement.offsetHeight / vimeoElement.offsetWidth) * 100;

      const iframeWrapper = vimeoElement.querySelector(".vimeo-bg__iframe-wrapper");
      if (iframeWrapper && videoAspectRatio) {
        if (containerAspectRatio > videoAspectRatio * 100) {
          iframeWrapper.style.width = `${(containerAspectRatio / (videoAspectRatio * 100)) * 100}%`;
        } else {
          iframeWrapper.style.width = "";
        }
      }
    }
    // Adjust video sizing initially
    if (vimeoElement.getAttribute("data-vimeo-update-size") === "true") {
      adjustVideoSizing();
      player.getVideoWidth().then(function () {
        player.getVideoHeight().then(function () {
          adjustVideoSizing();
        });
      });
    } else {
      adjustVideoSizing();
    }
    // Adjust video sizing on resize
    window.addEventListener("resize", adjustVideoSizing);
  });
}

function initTabSystem() {
  const wrappers = document.querySelectorAll('[data-tabs="wrapper"]');

  wrappers.forEach((wrapper) => {
    const contentItems = wrapper.querySelectorAll('[data-tabs="content-item"]');
    const visualItems = wrapper.querySelectorAll('[data-tabs="visual-item"]');
    const autoplay = wrapper.dataset.tabsAutoplay === "true";
    const autoplayDuration = parseInt(wrapper.dataset.tabsAutoplayDuration) || 5000;

    let activeContent = null;
    let activeVisual = null;
    let isAnimating = false;
    let progressBarTween = null;

    function startProgressBar(index) {
      if (progressBarTween) progressBarTween.kill();
      const bar = contentItems[index].querySelector('[data-tabs="item-progress"]');
      if (!bar) return;

      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
      progressBarTween = gsap.to(bar, {
        scaleX: 1,
        duration: autoplayDuration / 1000,
        ease: "power1.inOut",
        onComplete: () => {
          if (!isAnimating) {
            const nextIndex = (index + 1) % contentItems.length;
            switchTab(nextIndex);
          }
        },
      });
    }

    function switchTab(index) {
      if (isAnimating || contentItems[index] === activeContent) return;

      isAnimating = true;
      if (progressBarTween) progressBarTween.kill();

      const outgoingContent = activeContent;
      const outgoingVisual = activeVisual;
      const outgoingBar = outgoingContent?.querySelector('[data-tabs="item-progress"]');

      const incomingContent = contentItems[index];
      const incomingVisual = visualItems[index];
      const incomingBar = incomingContent.querySelector('[data-tabs="item-progress"]');

      outgoingContent?.classList.remove("active");
      outgoingVisual?.classList.remove("active");
      incomingContent.classList.add("active");
      incomingVisual.classList.add("active");

      const tl = gsap.timeline({
        defaults: { duration: 0.65, ease: "power3" },
        onComplete: () => {
          activeContent = incomingContent;
          activeVisual = incomingVisual;
          isAnimating = false;
          if (autoplay) startProgressBar(index);
        },
      });

      if (outgoingContent) {
        tl.set(outgoingBar, { transformOrigin: "right center" })
          .to(outgoingBar, { scaleX: 0, duration: 0.3 }, 0)
          .to(outgoingVisual, { autoAlpha: 0, xPercent: 3 }, 0)
          .to(outgoingContent.querySelector('[data-tabs="item-details"]'), { height: 0 }, 0);
      }

      tl.fromTo(incomingVisual, { autoAlpha: 0, xPercent: 3 }, { autoAlpha: 1, xPercent: 0 }, 0.3)
        .fromTo(incomingContent.querySelector('[data-tabs="item-details"]'), { height: 0 }, { height: "auto" }, 0)
        .set(incomingBar, { scaleX: 0, transformOrigin: "left center" }, 0);
    }

    switchTab(0);

    contentItems.forEach((item, i) =>
      item.addEventListener("click", () => {
        if (item === activeContent) return;
        switchTab(i);
      })
    );
  });
}

function initNumberCounters() {
  const numberElements = document.querySelectorAll(".number-text");
  if (numberElements.length === 0) return;

  function parseNumberFromString(str) {
    const numStr = str.replace(/[^\d.]/g, "");
    return parseFloat(numStr);
  }

  function formatNumber(num, originalStr) {
    if (originalStr.includes(",")) {
      return num.toLocaleString();
    } else if (/\d\s\d/.test(originalStr)) {
      return num.toLocaleString().replace(/,/g, " ");
    }
    return num.toString();
  }

  function extractPrefixAndSuffix(str) {
    const numberPattern = /[\d,.\s]+/;
    const match = str.match(numberPattern);

    if (!match) return { prefix: "", suffix: "" };

    const numberStr = match[0];
    const startIndex = str.indexOf(numberStr);
    const endIndex = startIndex + numberStr.length;

    return {
      prefix: str.substring(0, startIndex),
      suffix: str.substring(endIndex),
    };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const originalText = element.textContent;
          const targetNumber = parseNumberFromString(originalText);
          const startNumber = Math.round(targetNumber * 0.75);
          const { prefix, suffix } = extractPrefixAndSuffix(originalText);

          let counter = { value: startNumber };

          gsap.to(counter, {
            value: targetNumber,
            duration: 2,
            ease: "power2.out",
            onUpdate: function () {
              const currentValue = Math.round(counter.value);
              element.textContent = prefix + formatNumber(currentValue, originalText) + suffix;
            },
          });

          observer.unobserve(element);
        }
      });
    },
    { threshold: 0.1 }
  );

  numberElements.forEach((element) => observer.observe(element));
}

// Register GSAP plugins
gsap.registerPlugin(Draggable, InertiaPlugin);

function initSliders() {
  // Find all sections that might contain sliders
  const sliderSections = document.querySelectorAll("section");

  sliderSections.forEach((section) => {
    // Find slider list within this section
    const wrapper = section.querySelector('[data-slider="list"]');
    if (!wrapper) return; // Skip if no slider list found

    // Find slides within this wrapper
    const slides = gsap.utils.toArray(wrapper.querySelectorAll('[data-slider="slide"]'));
    if (slides.length === 0) return; // Skip if no slides found

    // Find navigation buttons within this section
    const nextButton = section.querySelector('[data-slider="button-next"]');
    const prevButton = section.querySelector('[data-slider="button-prev"]');
    if (!nextButton || !prevButton) return; // Skip if buttons not found

    let activeElement;

    // Add active class to the second slide initially (or first if only one exists)
    // This matches the offset design pattern used in the onChange handler
    if (slides.length > 0) {
      const initialActiveSlide = slides.length > 1 ? slides[1] : slides[0];
      initialActiveSlide.classList.add("active");
      activeElement = initialActiveSlide;
    }

    const loop = horizontalLoop(slides, {
      paused: true,
      draggable: true,
      center: false,
      onChange: (element, index) => {
        // We add the active class to the 'next' element because our design is offset slightly
        activeElement && activeElement.classList.remove("active");
        const nextSibling = element.nextElementSibling || slides[0];
        nextSibling.classList.add("active");
        activeElement = nextSibling;
      },
    });

    // Similar to above, we subtract 1 from our clicked index on click because our design is offset
    slides.forEach((slide, i) =>
      slide.addEventListener("click", () => loop.toIndex(i - 1, { ease: "power3", duration: 0.725 }))
    );

    nextButton.addEventListener("click", () => loop.next({ ease: "power3", duration: 0.725 }));
    prevButton.addEventListener("click", () => loop.previous({ ease: "power3", duration: 0.725 }));
  });
}

function horizontalLoop(items, config) {
  let timeline;
  items = gsap.utils.toArray(items);
  config = config || {};
  gsap.context(() => {
    let onChange = config.onChange,
      lastIndex = 0,
      tl = gsap.timeline({
        repeat: config.repeat,
        onUpdate:
          onChange &&
          function () {
            let i = tl.closestIndex();
            if (lastIndex !== i) {
              lastIndex = i;
              onChange(items[i], i);
            }
          },
        paused: config.paused,
        defaults: { ease: "none" },
        onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
      }),
      length = items.length,
      startX = items[0].offsetLeft,
      times = [],
      widths = [],
      spaceBefore = [],
      xPercents = [],
      curIndex = 0,
      indexIsDirty = false,
      center = config.center,
      pixelsPerSecond = (config.speed || 1) * 100,
      snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1), // some browsers shift by a pixel to accommodate flex layouts, so for example if width is 20% the first element's width might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
      timeOffset = 0,
      container = center === true ? items[0].parentNode : gsap.utils.toArray(center)[0] || items[0].parentNode,
      totalWidth,
      getTotalWidth = () =>
        items[length - 1].offsetLeft +
        (xPercents[length - 1] / 100) * widths[length - 1] -
        startX +
        spaceBefore[0] +
        items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], "scaleX") +
        (parseFloat(config.paddingRight) || 0),
      populateWidths = () => {
        let b1 = container.getBoundingClientRect(),
          b2;
        items.forEach((el, i) => {
          widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
          xPercents[i] = snap(
            (parseFloat(gsap.getProperty(el, "x", "px")) / widths[i]) * 100 + gsap.getProperty(el, "xPercent")
          );
          b2 = el.getBoundingClientRect();
          spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
          b1 = b2;
        });
        gsap.set(items, {
          // convert "x" to "xPercent" to make things responsive, and populate the widths/xPercents Arrays to make lookups faster.
          xPercent: (i) => xPercents[i],
        });
        totalWidth = getTotalWidth();
      },
      timeWrap,
      populateOffsets = () => {
        timeOffset = center ? (tl.duration() * (container.offsetWidth / 2)) / totalWidth : 0;
        center &&
          times.forEach((t, i) => {
            times[i] = timeWrap(tl.labels["label" + i] + (tl.duration() * widths[i]) / 2 / totalWidth - timeOffset);
          });
      },
      getClosest = (values, value, wrap) => {
        let i = values.length,
          closest = 1e10,
          index = 0,
          d;
        while (i--) {
          d = Math.abs(values[i] - value);
          if (d > wrap / 2) {
            d = wrap - d;
          }
          if (d < closest) {
            closest = d;
            index = i;
          }
        }
        return index;
      },
      populateTimeline = () => {
        let i, item, curX, distanceToStart, distanceToLoop;
        tl.clear();
        for (i = 0; i < length; i++) {
          item = items[i];
          curX = (xPercents[i] / 100) * widths[i];
          distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0];
          distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
          tl.to(
            item,
            {
              xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
              duration: distanceToLoop / pixelsPerSecond,
            },
            0
          )
            .fromTo(
              item,
              { xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]) * 100) },
              {
                xPercent: xPercents[i],
                duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
                immediateRender: false,
              },
              distanceToLoop / pixelsPerSecond
            )
            .add("label" + i, distanceToStart / pixelsPerSecond);
          times[i] = distanceToStart / pixelsPerSecond;
        }
        timeWrap = gsap.utils.wrap(0, tl.duration());
      },
      refresh = (deep) => {
        let progress = tl.progress();
        tl.progress(0, true);
        populateWidths();
        deep && populateTimeline();
        populateOffsets();
        deep && tl.draggable ? tl.time(times[curIndex], true) : tl.progress(progress, true);
      },
      onResize = () => refresh(true),
      proxy;
    gsap.set(items, { x: 0 });
    populateWidths();
    populateTimeline();
    populateOffsets();
    window.addEventListener("resize", onResize);
    function toIndex(index, vars) {
      vars = vars || {};
      Math.abs(index - curIndex) > length / 2 && (index += index > curIndex ? -length : length); // always go in the shortest direction
      let newIndex = gsap.utils.wrap(0, length, index),
        time = times[newIndex];
      if (time > tl.time() !== index > curIndex && index !== curIndex) {
        // if we're wrapping the timeline's playhead, make the proper adjustments
        time += tl.duration() * (index > curIndex ? 1 : -1);
      }
      if (time < 0 || time > tl.duration()) {
        vars.modifiers = { time: timeWrap };
      }
      curIndex = newIndex;
      vars.overwrite = true;
      gsap.killTweensOf(proxy);
      return vars.duration === 0 ? tl.time(timeWrap(time)) : tl.tweenTo(time, vars);
    }
    tl.toIndex = (index, vars) => toIndex(index, vars);
    tl.closestIndex = (setCurrent) => {
      let index = getClosest(times, tl.time(), tl.duration());
      if (setCurrent) {
        curIndex = index;
        indexIsDirty = false;
      }
      return index;
    };
    tl.current = () => (indexIsDirty ? tl.closestIndex(true) : curIndex);
    tl.next = (vars) => toIndex(tl.current() + 1, vars);
    tl.previous = (vars) => toIndex(tl.current() - 1, vars);
    tl.times = times;
    tl.progress(1, true).progress(0, true); // pre-render for performance
    if (config.reversed) {
      tl.vars.onReverseComplete();
      tl.reverse();
    }
    if (config.draggable && typeof Draggable === "function") {
      proxy = document.createElement("div");
      let wrap = gsap.utils.wrap(0, 1),
        ratio,
        startProgress,
        draggable,
        dragSnap,
        lastSnap,
        initChangeX,
        wasPlaying,
        align = () => tl.progress(wrap(startProgress + (draggable.startX - draggable.x) * ratio)),
        syncIndex = () => tl.closestIndex(true);
      typeof InertiaPlugin === "undefined" &&
        console.warn("InertiaPlugin required for momentum-based scrolling and snapping. https://greensock.com/club");
      draggable = Draggable.create(proxy, {
        trigger: items[0].parentNode,
        type: "x",
        onPressInit() {
          let x = this.x;
          gsap.killTweensOf(tl);
          wasPlaying = !tl.paused();
          tl.pause();
          startProgress = tl.progress();
          refresh();
          ratio = 1 / totalWidth;
          initChangeX = startProgress / -ratio - x;
          gsap.set(proxy, { x: startProgress / -ratio });
        },
        onDrag: align,
        onThrowUpdate: align,
        overshootTolerance: 0,
        inertia: true,
        snap(value) {
          if (Math.abs(startProgress / -ratio - this.x) < 10) {
            return lastSnap + initChangeX;
          }
          let time = -(value * ratio) * tl.duration(),
            wrappedTime = timeWrap(time),
            snapTime = times[getClosest(times, wrappedTime, tl.duration())],
            dif = snapTime - wrappedTime;
          Math.abs(dif) > tl.duration() / 2 && (dif += dif < 0 ? tl.duration() : -tl.duration());
          lastSnap = (time + dif) / tl.duration() / -ratio;
          return lastSnap;
        },
        onRelease() {
          syncIndex();
          draggable.isThrowing && (indexIsDirty = true);
        },
        onThrowComplete: () => {
          syncIndex();
          wasPlaying && tl.play();
        },
      })[0];
      tl.draggable = draggable;
    }
    tl.closestIndex(true);
    lastIndex = curIndex;
    onChange && onChange(items[curIndex], curIndex);
    timeline = tl;
    return () => window.removeEventListener("resize", onResize);
  });
  return timeline;
}

function initModalBasic() {
  const modalGroup = document.querySelector("[data-modal-group-status]");
  const modals = document.querySelectorAll("[data-modal-name]");
  const modalTargets = document.querySelectorAll("[data-modal-target]");

  // Open modal
  modalTargets.forEach((modalTarget) => {
    modalTarget.addEventListener("click", function () {
      const modalTargetName = this.getAttribute("data-modal-target");

      // Close all modals
      modalTargets.forEach((target) => target.setAttribute("data-modal-status", "not-active"));
      modals.forEach((modal) => modal.setAttribute("data-modal-status", "not-active"));

      // Activate clicked modal
      document.querySelector(`[data-modal-target="${modalTargetName}"]`).setAttribute("data-modal-status", "active");
      document.querySelector(`[data-modal-name="${modalTargetName}"]`).setAttribute("data-modal-status", "active");

      // Set group to active
      if (modalGroup) {
        modalGroup.setAttribute("data-modal-group-status", "active");
      }
    });
  });

  // Close modal
  document.querySelectorAll("[data-modal-close]").forEach((closeBtn) => {
    closeBtn.addEventListener("click", closeAllModals);
  });

  // Close modal on `Escape` key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      // Find any active modals with Vimeo videos
      document.querySelectorAll('[data-modal-status="active"]').forEach((modal) => {
        const vimeoElement = modal.querySelector("[data-vimeo-bg-init]");
        if (vimeoElement && vimeoElement.id && window.vimeoPlayers[vimeoElement.id]) {
          // Pause the video
          window.vimeoPlayers[vimeoElement.id].pause();
        }
      });

      closeAllModals();
    }
  });

  // Function to close all modals
  function closeAllModals() {
    modalTargets.forEach((target) => target.setAttribute("data-modal-status", "not-active"));

    if (modalGroup) {
      modalGroup.setAttribute("data-modal-group-status", "not-active");
    }
  }

  // Handle Vimeo controls within modals
  document.querySelectorAll('[data-vimeo-control="pause"]').forEach((control) => {
    control.addEventListener("click", function () {
      // Find the modal containing this control
      const modal = this.closest("[data-modal-name]");
      if (!modal) return;

      // Find the Vimeo player in this modal
      const vimeoElement = modal.querySelector("[data-vimeo-bg-init]");
      if (!vimeoElement || !vimeoElement.id) return;

      // If we have a player instance for this ID
      if (window.vimeoPlayers[vimeoElement.id]) {
        // Pause the video
        window.vimeoPlayers[vimeoElement.id].pause();
      }
    });
  });

  // Store Vimeo player instances when they're created
  // This function will be called from initVimeoBGVideo
  window.registerVimeoPlayer = function (id, player) {
    window.vimeoPlayers[id] = player;

    // Configure player to hide controls
    player
      .ready()
      .then(function () {
        // Set player options
        player.setVolume(1); // Ensure volume is set to 1 for modal videos
      })
      .catch(function (error) {
        console.error("Error configuring Vimeo player:", error);
      });
  };
}

// Function to handle Vimeo videos in modals
function initModalVimeoVideos() {
  console.log("Initializing modal Vimeo videos");

  // Find all Vimeo videos in modals
  document.querySelectorAll("[data-modal-name] [data-vimeo-bg-init]").forEach((vimeoElement, index) => {
    const vimeoVideoID = vimeoElement.getAttribute("data-vimeo-video-id");
    if (!vimeoVideoID) return;

    // Get the modal name
    const modalName = vimeoElement.closest("[data-modal-name]").getAttribute("data-modal-name");
    console.log(`Setting up Vimeo video in modal: ${modalName}, video ID: ${vimeoVideoID}`);

    // Make sure the video has an ID
    if (!vimeoElement.id) {
      vimeoElement.id = `modal-vimeo-${modalName}-${index}`;
    }

    // Update the iframe src to ensure it's not set to background mode and has audio enabled
    const iframe = vimeoElement.querySelector("iframe");
    if (iframe) {
      // Add a class to hide controls
      iframe.classList.add("vimeo-no-controls");

      // Add CSS to hide controls if not already added
      if (!document.getElementById("vimeo-controls-css")) {
        const style = document.createElement("style");
        style.id = "vimeo-controls-css";
        style.textContent = `
            .vimeo-no-controls {
              pointer-events: none !important;
            }
            /* Additional CSS to hide controls */
            .vimeo-player__controls {
              display: none !important;
            }
          `;
        document.head.appendChild(style);
      }
      // Parse the current URL
      try {
        const url = new URL(iframe.getAttribute("src"));

        // Set the correct parameters for modal videos
        url.searchParams.set("api", "1");
        url.searchParams.set("background", "0");
        url.searchParams.set("muted", "0");
        url.searchParams.set("controls", "0"); // Hide Vimeo's native controls

        // Update the src
        iframe.setAttribute("src", url.toString());
        console.log(`Updated iframe src: ${url.toString()}`);
      } catch (e) {
        console.error("Error updating iframe src:", e);

        // Fallback to string replacement if URL parsing fails
        let src = iframe.getAttribute("src");
        // Remove background=1 and muted=1 parameters if present
        src = src.replace("background=1", "background=0");
        src = src.replace("muted=1", "muted=0");
        // Make sure we have the right parameters for modal videos
        if (!src.includes("background=0")) {
          src = src.includes("?") ? src + "&background=0" : src + "?background=0";
        }
        if (!src.includes("muted=0")) {
          src = src + "&muted=0";
        }
        if (!src.includes("controls=0")) {
          src = src + "&controls=0";
        }
        iframe.setAttribute("src", src);
      }
    }

    // Get the player instance
    const player = new Vimeo.Player(vimeoElement.id);

    // Store the player reference in the global object
    window.vimeoPlayers[vimeoElement.id] = player;

    // Ensure volume is set to 1 for modal videos
    player.setVolume(1);

    // Add loaded event handler
    player.on("loaded", () => {
      console.log(`Vimeo player for modal ${modalName} loaded`);
    });
  });

  // Handle play controls that open modals
  document.querySelectorAll('[data-vimeo-control="play"][data-modal-target]').forEach((control) => {
    control.addEventListener("click", function () {
      const modalTarget = this.getAttribute("data-modal-target");
      console.log(`Play button clicked for modal: ${modalTarget}`);

      // Give the modal time to open
      setTimeout(() => {
        console.log(`Attempting to play video in modal: ${modalTarget}`);

        // Find the Vimeo element in the modal
        const modal = document.querySelector(`[data-modal-name="${modalTarget}"]`);
        if (!modal) {
          console.warn(`Modal not found: ${modalTarget}`);
          return;
        }

        const vimeoElement = modal.querySelector("[data-vimeo-bg-init]");
        if (!vimeoElement || !vimeoElement.id) {
          console.warn(`Vimeo element not found in modal: ${modalTarget}`);
          return;
        }

        // Get the player from the global object
        const player = window.vimeoPlayers[vimeoElement.id];
        if (!player) {
          console.warn(`Player not found for: ${vimeoElement.id}`);
          return;
        }

        // Make sure volume is set to 1 (with audio) and play
        player
          .setVolume(1)
          .then(() => {
            console.log("Volume set to 1");
            return player.play();
          })
          .then(() => {
            console.log("Video playing");
          })
          .catch((error) => {
            console.error("Error playing video:", error);

            // Try again with a longer delay if first attempt fails
            setTimeout(() => {
              console.log("Retrying play...");
              player.play().catch((e) => console.error("Retry failed:", e));
            }, 1000);
          });
      }, 800); // Increased delay to ensure modal is fully visible
    });
  });

  // Handle pause controls in modals
  document.querySelectorAll('[data-modal-name] [data-vimeo-control="pause"]').forEach((control) => {
    const modal = control.closest("[data-modal-name]");
    if (!modal) return;

    control.addEventListener("click", function () {
      const modalName = modal.getAttribute("data-modal-name");
      console.log(`Pausing video in modal: ${modalName}`);

      // Find the Vimeo element in the modal
      const vimeoElement = modal.querySelector("[data-vimeo-bg-init]");
      if (!vimeoElement || !vimeoElement.id) {
        console.warn(`Vimeo element not found in modal: ${modalName}`);
        return;
      }

      // Get the player from the global object
      const player = window.vimeoPlayers[vimeoElement.id];
      if (!player) {
        console.warn(`Player not found for: ${vimeoElement.id}`);
        return;
      }

      player.pause().catch((error) => {
        console.error("Error pausing video:", error);
      });
    });
  });

  // Pause videos when modals are closed
  document.querySelectorAll("[data-modal-close]").forEach((closeBtn) => {
    closeBtn.addEventListener("click", function () {
      const modal = this.closest("[data-modal-name]");
      if (!modal) return;

      const modalName = modal.getAttribute("data-modal-name");
      console.log(`Closing modal: ${modalName}`);

      // Find the Vimeo element in the modal
      const vimeoElement = modal.querySelector("[data-vimeo-bg-init]");
      if (!vimeoElement || !vimeoElement.id) {
        console.warn(`Vimeo element not found in modal: ${modalName}`);
        return;
      }

      // Get the player from the global object
      const player = window.vimeoPlayers[vimeoElement.id];
      if (!player) {
        console.warn(`Player not found for: ${vimeoElement.id}`);
        return;
      }

      console.log(`Pausing video on modal close: ${modalName}`);
      player.pause().catch((error) => {
        console.error("Error pausing video on close:", error);
      });
    });
  });

  // Pause videos when Escape key is pressed
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      // Find any active modals
      document.querySelectorAll('[data-modal-status="active"]').forEach((modal) => {
        const modalName = modal.getAttribute("data-modal-name");
        console.log(`Escape key pressed, found active modal: ${modalName}`);

        // Find the Vimeo element in the modal
        const vimeoElement = modal.querySelector("[data-vimeo-bg-init]");
        if (!vimeoElement || !vimeoElement.id) {
          console.warn(`Vimeo element not found in modal: ${modalName}`);
          return;
        }

        // Get the player from the global object
        const player = window.vimeoPlayers[vimeoElement.id];
        if (!player) {
          console.warn(`Player not found for: ${vimeoElement.id}`);
          return;
        }

        console.log(`Pausing video on Escape key: ${modalName}`);
        player.pause().catch((error) => {
          console.error("Error pausing video on escape:", error);
        });
      });
    }
  });
}

// Initialize all components when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initDotNavigation();
  initCSSMarquee();
  initVimeoBGVideo();
  initTabSystem();
  initNumberCounters();
  initSliders();
  initModalBasic();
  initModalVimeoVideos();
});
