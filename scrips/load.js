/**
 * Pie Factory Main Script
 *
 * Development Mode:
 * To enable development mode, add the devMode attribute to the script tag:
 * <script devMode="true" src="https://danwebflow.github.io/pie-factory/scrips/load.js"></script>
 */

// Check for development mode and load scripts accordingly
(function () {
  // Find the script tag that loaded this file
  let scripts = document.getElementsByTagName("script");
  let currentScript = null;

  // Loop through all scripts to find the one with our src
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.includes("pie-factory/scrips/load.js")) {
      currentScript = scripts[i];
      break;
    }
  }

  // If we couldn't find it, use the last script as a fallback
  if (!currentScript && scripts.length > 0) {
    currentScript = scripts[scripts.length - 1];
  }

  // Check if the devMode attribute is set to "true"
  const isDevMode = currentScript && currentScript.getAttribute("devMode") === "true";

  // Store the dev mode state globally
  window.pieFactoryDevMode = isDevMode;

  // If in dev mode, create a visual indicator
  if (isDevMode) {
    window.addEventListener("DOMContentLoaded", function () {
      const devIndicator = document.createElement("div");
      devIndicator.style.position = "fixed";
      devIndicator.style.bottom = "10px";
      devIndicator.style.right = "10px";
      devIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      devIndicator.style.color = "white";
      devIndicator.style.padding = "5px 10px";
      devIndicator.style.borderRadius = "3px";
      devIndicator.style.fontFamily = "monospace";
      devIndicator.style.fontSize = "12px";
      devIndicator.style.zIndex = "9999";
      devIndicator.textContent = "Pie Factory Dev Mode";
      document.body.appendChild(devIndicator);
    });
  }

  // Local development server configuration
  const localDevConfig = {
    port: 5500, // Default port for Live Server VSCode extension
    host: "localhost",
    protocol: "http",
  };

  /**
   * Checks if the local development server is running
   * @returns {Promise<boolean>} True if the server is running, false otherwise
   */
  async function isLocalServerRunning() {
    if (!isDevMode) return false;

    const testUrl = `${localDevConfig.protocol}://${localDevConfig.host}:${localDevConfig.port}/scrips/load.js`;

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 400) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      };

      xhr.onerror = () => resolve(false);
      xhr.ontimeout = () => resolve(false);

      try {
        xhr.open("HEAD", testUrl, true);
        xhr.timeout = 1000;
        xhr.send();
      } catch (e) {
        resolve(false);
      }
    });
  }

  /**
   * Loads scripts based on environment (local or remote)
   */
  async function loadScripts() {
    // Check if local server is running (only if in dev mode)
    const isLocalAvailable = await isLocalServerRunning();

    // Set base URL based on environment
    let baseUrl;
    if (isDevMode && isLocalAvailable) {
      baseUrl = `${localDevConfig.protocol}://${localDevConfig.host}:${localDevConfig.port}/scrips/`;
      console.log("Pie Factory: Development mode active - loading from local server");
      window.scriptLoadedFrom = "local";
    } else {
      // Get the base URL from the current script
      baseUrl = currentScript.src.substring(0, currentScript.src.lastIndexOf("/") + 1);
      console.log("Pie Factory: Loading from remote server:", baseUrl);
    }

    // Define script files to load
    const scriptFiles = [];

    // Add cache-busting for local development
    const scripts = scriptFiles.map((file) => {
      if (isDevMode && isLocalAvailable) {
        return `${baseUrl}${file}?t=${new Date().getTime()}`; // Add cache-busting
      }
      return baseUrl + file;
    });

    // Load scripts sequentially
    function loadNextScript(index) {
      if (index >= scripts.length) return; // All scripts loaded

      const script = document.createElement("script");
      script.src = scripts[index];

      script.onload = () => loadNextScript(index + 1);

      script.onerror = () => {
        // If local script fails, try remote version
        if (isDevMode && isLocalAvailable && script.src.includes(localDevConfig.host)) {
          console.log(`Pie Factory: Local script failed to load: ${script.src}`);

          // Get remote URL
          const filename = script.src.split("/").pop().split("?")[0];
          const remoteUrl = currentScript.src.substring(0, currentScript.src.lastIndexOf("/") + 1) + filename;

          console.log(`Pie Factory: Falling back to remote script: ${remoteUrl}`);

          const fallbackScript = document.createElement("script");
          fallbackScript.src = remoteUrl;
          fallbackScript.onload = () => loadNextScript(index + 1);
          fallbackScript.onerror = () => {
            console.error(`Pie Factory: Remote script also failed to load: ${remoteUrl}`);
            loadNextScript(index + 1); // Continue with next script
          };

          document.head.appendChild(fallbackScript);
        } else {
          console.warn(`Pie Factory: Script failed to load: ${script.src}`);
          loadNextScript(index + 1); // Continue with next script
        }
      };

      document.head.appendChild(script);
    }

    // Start loading scripts
    loadNextScript(0);
  }

  // Load scripts when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadScripts);
  } else {
    loadScripts();
  }
})();

// Note: The Javascript is optional. Read the documentation below how to use the CSS Only version.
gsap.config({ nullTargetWarn: false });

// Create a global vimeoPlayers object to store all player instances
window.vimeoPlayers = {};

// Initialize dot navigation and progress bar when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  if (typeof initDotNavigation === "function") {
    initDotNavigation();
  }
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
