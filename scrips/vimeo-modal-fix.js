// Vimeo Modal Video Fix
document.addEventListener("DOMContentLoaded", function () {
  // Store all Vimeo player instances
  window.vimeoPlayers = {};

  // Initialize modal Vimeo videos
  initModalVimeoVideos();
});

function initModalVimeoVideos() {
  console.log("Initializing Vimeo modal videos");

  // Find all Vimeo videos in modals
  const modalVimeoElements = document.querySelectorAll("[data-modal-name] [data-vimeo-bg-init]");
  console.log(`Found ${modalVimeoElements.length} Vimeo videos in modals`);

  if (modalVimeoElements.length === 0) return;

  // Process each Vimeo element in modals
  modalVimeoElements.forEach((vimeoElement, index) => {
    const vimeoVideoID = vimeoElement.getAttribute("data-vimeo-video-id");
    if (!vimeoVideoID) {
      console.warn("Vimeo element missing video ID:", vimeoElement);
      return;
    }

    // Get the modal name
    const modal = vimeoElement.closest("[data-modal-name]");
    if (!modal) return;

    const modalName = modal.getAttribute("data-modal-name");
    console.log(`Setting up Vimeo video in modal: ${modalName}, video ID: ${vimeoVideoID}`);

    // Make sure the video has an ID
    if (!vimeoElement.id) {
      vimeoElement.id = `modal-vimeo-${modalName}-${index}`;
    }

    // Update iframe src to ensure proper parameters
    const iframe = vimeoElement.querySelector("iframe");
    if (iframe) {
      // Create a proper URL with all needed parameters
      const vimeoURL = new URL(iframe.src);
      vimeoURL.searchParams.set("api", "1");
      vimeoURL.searchParams.set("background", "0");
      vimeoURL.searchParams.set("muted", "0");
      vimeoURL.searchParams.set("autoplay", "0");
      vimeoURL.searchParams.set("loop", "0");

      iframe.src = vimeoURL.toString();
      console.log(`Updated iframe src: ${iframe.src}`);
    } else {
      console.warn("No iframe found in Vimeo element:", vimeoElement);
    }

    // Create Vimeo player instance
    try {
      const player = new Vimeo.Player(vimeoElement.id);

      // Store the player reference
      window.vimeoPlayers[modalName] = player;

      // Set up event listeners
      player.on("loaded", function () {
        console.log(`Vimeo player loaded for modal: ${modalName}`);
      });

      player.on("play", function () {
        console.log(`Vimeo player playing in modal: ${modalName}`);
      });

      player.on("pause", function () {
        console.log(`Vimeo player paused in modal: ${modalName}`);
      });

      player.on("error", function (error) {
        console.error(`Vimeo player error in modal ${modalName}:`, error);
      });

      // Ensure volume is set to 1
      player
        .setVolume(1)
        .then(function () {
          console.log(`Volume set to 1 for modal: ${modalName}`);
        })
        .catch(function (error) {
          console.error(`Error setting volume for modal ${modalName}:`, error);
        });
    } catch (error) {
      console.error(`Error creating Vimeo player for modal ${modalName}:`, error);
    }
  });

  // Handle play buttons that open modals
  const playButtons = document.querySelectorAll('[data-vimeo-control="play"][data-modal-target]');
  console.log(`Found ${playButtons.length} play buttons for modals`);

  playButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const modalTarget = this.getAttribute("data-modal-target");
      console.log(`Play button clicked for modal: ${modalTarget}`);

      if (!modalTarget || !window.vimeoPlayers[modalTarget]) {
        console.warn(`No Vimeo player found for modal: ${modalTarget}`);
        return;
      }

      // Give the modal time to open
      setTimeout(function () {
        const player = window.vimeoPlayers[modalTarget];

        // Ensure volume is set to 1 and play
        player
          .setVolume(1)
          .then(function () {
            console.log(`Playing video in modal: ${modalTarget}`);
            return player.play();
          })
          .catch(function (error) {
            console.error(`Error playing video in modal ${modalTarget}:`, error);

            // Try again with a longer delay if first attempt fails
            setTimeout(function () {
              console.log(`Retrying play for modal: ${modalTarget}`);
              player.play().catch(function (error) {
                console.error(`Retry failed for modal ${modalTarget}:`, error);
              });
            }, 1000);
          });
      }, 800);
    });
  });

  // Handle pause buttons in modals
  const pauseButtons = document.querySelectorAll('[data-modal-name] [data-vimeo-control="pause"]');
  console.log(`Found ${pauseButtons.length} pause buttons in modals`);

  pauseButtons.forEach((button) => {
    const modal = button.closest("[data-modal-name]");
    if (!modal) return;

    const modalName = modal.getAttribute("data-modal-name");

    button.addEventListener("click", function () {
      console.log(`Pause button clicked for modal: ${modalName}`);

      if (!window.vimeoPlayers[modalName]) {
        console.warn(`No Vimeo player found for modal: ${modalName}`);
        return;
      }

      window.vimeoPlayers[modalName].pause().catch(function (error) {
        console.error(`Error pausing video in modal ${modalName}:`, error);
      });
    });
  });

  // Pause videos when modals are closed
  const closeButtons = document.querySelectorAll("[data-modal-close]");
  console.log(`Found ${closeButtons.length} close buttons`);

  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const modal = this.closest("[data-modal-name]");
      if (!modal) return;

      const modalName = modal.getAttribute("data-modal-name");
      console.log(`Close button clicked for modal: ${modalName}`);

      if (!window.vimeoPlayers[modalName]) {
        console.warn(`No Vimeo player found for modal: ${modalName}`);
        return;
      }

      window.vimeoPlayers[modalName].pause().catch(function (error) {
        console.error(`Error pausing video on close for modal ${modalName}:`, error);
      });
    });
  });

  // Pause videos when Escape key is pressed
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      console.log("Escape key pressed, checking for active modals");

      document.querySelectorAll('[data-modal-status="active"]').forEach((modal) => {
        const modalName = modal.getAttribute("data-modal-name");
        console.log(`Found active modal: ${modalName}`);

        if (!window.vimeoPlayers[modalName]) {
          console.warn(`No Vimeo player found for modal: ${modalName}`);
          return;
        }

        window.vimeoPlayers[modalName].pause().catch(function (error) {
          console.error(`Error pausing video on escape for modal ${modalName}:`, error);
        });
      });
    }
  });
}
