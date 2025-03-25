// Note: The Javascript is optional. Read the documentation below how to use the CSS Only version.
gsap.config({ nullTargetWarn: false });

// Create a global vimeoPlayers object to store all player instances
window.vimeoPlayers = {};

// Initialize dot navigation and progress bar when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initDotNavigation();
});

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

// Initialize CSS Marquee
document.addEventListener("DOMContentLoaded", function () {
  initCSSMarquee();
});

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

// Initialize Vimeo Background Video
document.addEventListener("DOMContentLoaded", function () {
  initVimeoBGVideo();
});

function initTabSystem() {
  const wrappers = document.querySelectorAll('[data-tabs="wrapper"]');

  wrappers.forEach((wrapper) => {
    const contentItems = wrapper.querySelectorAll('[data-tabs="content-item"]');
    const visualItems = wrapper.querySelectorAll('[data-tabs="visual-item"]');

    const autoplay = wrapper.dataset.tabsAutoplay === "true";
    const autoplayDuration = parseInt(wrapper.dataset.tabsAutoplayDuration) || 5000;

    let activeContent = null; // keep track of active item/link
    let activeVisual = null;
    let isAnimating = false;
    let progressBarTween = null; // to stop/start the progress bar

    function startProgressBar(index) {
      if (progressBarTween) progressBarTween.kill();
      const bar = contentItems[index].querySelector('[data-tabs="item-progress"]');
      if (!bar) return;

      // In this function, you can basically do anything you want, that should happen as a tab is active
      // Maybe you have a circle filling, some other element growing, you name it.
      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
      progressBarTween = gsap.to(bar, {
        scaleX: 1,
        duration: autoplayDuration / 1000,
        ease: "power1.inOut",
        onComplete: () => {
          if (!isAnimating) {
            const nextIndex = (index + 1) % contentItems.length;
            switchTab(nextIndex); // once bar is full, set next to active – this is important
          }
        },
      });
    }

    function switchTab(index) {
      if (isAnimating || contentItems[index] === activeContent) return;

      isAnimating = true;
      if (progressBarTween) progressBarTween.kill(); // Stop any running progress bar here

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
          if (autoplay) startProgressBar(index); // Start autoplay bar here
        },
      });

      // Wrap 'outgoing' in a check to prevent warnings on first run of the function
      // Of course, during first run (on page load), there's no 'outgoing' tab yet!
      if (outgoingContent) {
        outgoingContent.classList.remove("active");
        outgoingVisual?.classList.remove("active");
        tl.set(outgoingBar, { transformOrigin: "right center" })
          .to(outgoingBar, { scaleX: 0, duration: 0.3 }, 0)
          .to(outgoingVisual, { autoAlpha: 0, xPercent: 3 }, 0)
          .to(outgoingContent.querySelector('[data-tabs="item-details"]'), { height: 0 }, 0);
      }

      incomingContent.classList.add("active");
      incomingVisual.classList.add("active");
      tl.fromTo(incomingVisual, { autoAlpha: 0, xPercent: 3 }, { autoAlpha: 1, xPercent: 0 }, 0.3)
        .fromTo(incomingContent.querySelector('[data-tabs="item-details"]'), { height: 0 }, { height: "auto" }, 0)
        .set(incomingBar, { scaleX: 0, transformOrigin: "left center" }, 0);
    }

    // on page load, set first to active
    // idea: you could wrap this in a scrollTrigger
    // so it will only start once a user reaches this section
    switchTab(0);

    // switch tabs on click
    contentItems.forEach((item, i) =>
      item.addEventListener("click", () => {
        if (item === activeContent) return; // ignore click if current one is already active
        switchTab(i);
      })
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTabSystem();
  initNumberCounters();
});

function initNumberCounters() {
  // Find all elements with the number-text class
  const numberElements = document.querySelectorAll(".number-text");

  if (numberElements.length === 0) return;

  // Function to parse number from string (handling separators like commas)
  function parseNumberFromString(str) {
    // Remove all non-numeric characters except decimal points
    const numStr = str.replace(/[^\d.]/g, "");
    return parseFloat(numStr);
  }

  // Function to format number with the same separators as the original
  function formatNumber(num, originalStr) {
    // Check if original has commas as thousand separators
    if (originalStr.includes(",")) {
      return num.toLocaleString();
    }
    // Check if original has spaces as thousand separators
    else if (/\d\s\d/.test(originalStr)) {
      return num.toLocaleString().replace(/,/g, " ");
    }
    // No separators
    return num.toString();
  }

  // Create an intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const originalText = element.textContent;
          const targetNumber = parseNumberFromString(originalText);

          // Calculate starting number (25% less than target)
          const startNumber = Math.round(targetNumber * 0.75);

          // Store the original text to preserve any prefix/suffix
          const prefix = originalText.split(targetNumber.toString())[0] || "";
          const suffix = originalText.split(targetNumber.toString())[1] || "";

          // Animate the number
          gsap.fromTo(
            element,
            {
              innerText: startNumber,
            },
            {
              innerText: targetNumber,
              duration: 2,
              ease: "power2.out",
              onUpdate: function () {
                const currentValue = Math.round(this.targets()[0]._gsap.innerText);
                element.textContent = prefix + formatNumber(currentValue, originalText) + suffix;
              },
            }
          );

          // Unobserve after animation starts
          observer.unobserve(element);
        }
      });
    },
    { threshold: 0.1 }
  ); // Trigger when at least 10% of the element is visible

  // Observe all number elements
  numberElements.forEach((element) => {
    observer.observe(element);
  });
}

document.addEventListener("DOMContentLoaded", (event) => {
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

  initSliders();
});

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

// Initialize Basic Modal
document.addEventListener("DOMContentLoaded", () => {
  initModalBasic();
  initModalVimeoVideos();
});

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

// Function to initialize dot navigation and progress bar
function initDotNavigation() {
  // Configuration
  const navDots = document.querySelectorAll(".side-nav .dot"); // Adjust selector to match your dot elements
  const progressBar = document.querySelector(".header__progress"); // Main progress bar
  const sections = []; // Will store section data
  const offset = 10; // Offset in pixels from top of viewport to trigger active state
  const activeClass = "active"; // Custom active class

  // Skip if no dots or sections found
  if (navDots.length === 0) return;

  // Initialize sections data
  navDots.forEach((dot) => {
    // Get the section ID from the dot's data attribute
    const sectionId = dot.getAttribute("data-section");
    const section = document.querySelector(sectionId);

    if (section) {
      sections.push({
        id: sectionId,
        element: section,
        dot: dot,
        top: 0, // Will be calculated
        bottom: 0, // Will be calculated
        height: 0, // Will be calculated
      });
    }
  });

  // Skip if no valid sections found
  if (sections.length === 0) return;

  // Function to update section positions (called on load and resize)
  function updateSectionPositions() {
    sections.forEach((section) => {
      const rect = section.element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      section.top = rect.top + scrollTop;
      section.height = rect.height;
      section.bottom = section.top + section.height;
    });

    // Sort sections by their position from top to bottom
    sections.sort((a, b) => a.top - b.top);
  }

  // Function to update active dot and progress bar
  function updateActiveSection() {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );

    // Calculate total scrollable distance
    const totalScrollableDistance = documentHeight - viewportHeight;

    // Find the current active section
    let activeSection = null;
    let activeSectionIndex = -1;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // Check if the section is at the top of the viewport (with offset)
      if (scrollPosition >= section.top - offset) {
        activeSection = section;
        activeSectionIndex = i;
      } else {
        // Once we find a section that's below the top, we can stop
        break;
      }
    }

    // If we found an active section
    if (activeSection) {
      // Remove active class from all dots
      navDots.forEach((dot) => {
        dot.classList.remove(activeClass);
      });

      // Add active class to current dot
      activeSection.dot.classList.add(activeClass);

      // Calculate progress within the current section
      let sectionProgress = 0;

      if (activeSectionIndex < sections.length - 1) {
        // If not the last section, calculate progress between this section and the next
        const nextSection = sections[activeSectionIndex + 1];
        const sectionScrolled = scrollPosition - activeSection.top;
        const sectionDistance = nextSection.top - activeSection.top;

        // Calculate progress as percentage (0-100)
        sectionProgress = Math.min(100, Math.max(0, (sectionScrolled / sectionDistance) * 100));
      } else {
        // If it's the last section, calculate progress within the section
        const sectionScrolled = scrollPosition - activeSection.top;

        // Calculate progress as percentage (0-100)
        // We consider the section "complete" when we've scrolled through most of it
        // or reached the bottom of the page
        const isAtBottom = scrollPosition + viewportHeight >= documentHeight - 50;

        if (isAtBottom) {
          sectionProgress = 100;
        } else {
          sectionProgress = Math.min(100, Math.max(0, (sectionScrolled / activeSection.height) * 100));
        }
      }

      // Update progress states with data attributes
      navDots.forEach((dot, index) => {
        if (index < activeSectionIndex) {
          // Sections before active are completed
          dot.setAttribute("data-progress", "completed");
        } else if (index === activeSectionIndex) {
          // Active section is in progress
          dot.setAttribute("data-progress", "in-progress");
        } else {
          // Sections after active are not started
          dot.setAttribute("data-progress", "not-started");
        }
      });

      // Update the header progress bar
      if (progressBar) {
        progressBar.style.width = `${sectionProgress}%`;
      }
    }
  }

  // Initialize
  updateSectionPositions();
  updateActiveSection();

  // Update on scroll
  window.addEventListener("scroll", updateActiveSection);

  // Update positions on window resize
  window.addEventListener("resize", function () {
    updateSectionPositions();
    updateActiveSection();
  });

  // Smooth scroll when clicking dots
  navDots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", function () {
      // Remove active class from all dots and add to clicked dot
      navDots.forEach((d) => d.classList.remove(activeClass));
      this.classList.add(activeClass);

      // Update data attributes for tracking progress state
      navDots.forEach((navDot, index) => {
        if (index < dotIndex) {
          // Sections before clicked dot are completed
          navDot.setAttribute("data-progress", "completed");
        } else if (index === dotIndex) {
          // Clicked dot is just starting
          navDot.setAttribute("data-progress", "starting");
        } else {
          // Sections after clicked dot are not started
          navDot.setAttribute("data-progress", "not-started");
        }
      });

      // Reset the header progress bar
      if (progressBar) {
        progressBar.style.width = "0%";
      }

      const sectionId = this.getAttribute("data-section");
      const targetSection = document.querySelector(sectionId);

      if (targetSection) {
        // Scroll to section with smooth behavior
        window.scrollTo({
          top: targetSection.offsetTop - offset,
          behavior: "smooth",
        });
      }
    });
  });
}
