// Scroll Navigation with Progress Bar
document.addEventListener("DOMContentLoaded", function () {
  // Configuration
  const navLinks = document.querySelectorAll('.side-nav a[href^="#"]'); // Adjust selector to match your side nav links
  const progressBar = document.querySelector(".header__progress"); // Main progress bar
  const sections = []; // Will store section data
  const offset = 10; // Offset in pixels from top of viewport to trigger active state
  const activeClass = "active"; // Custom active class instead of Webflow's w--current

  // Prevent Webflow's default functionality
  disableWebflowNavigation();

  // Initialize sections data
  navLinks.forEach((link) => {
    const sectionId = link.getAttribute("href");
    const section = document.querySelector(sectionId);

    if (section) {
      sections.push({
        id: sectionId,
        element: section,
        link: link,
        top: 0, // Will be calculated
        bottom: 0, // Will be calculated
        height: 0, // Will be calculated
      });
    }
  });

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

  // Function to update active link and progress bar
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
      // Remove active class from all links
      navLinks.forEach((link) => {
        link.classList.remove(activeClass);
        link.classList.remove("w--current"); // Also remove Webflow's class just in case
      });

      // Add active class to current link
      activeSection.link.classList.add(activeClass);

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

      // Update the progress bar width
      if (progressBar) {
        // Calculate overall progress based on total scroll position
        // This ensures the progress bar matches the actual scroll progress
        let overallProgress;

        if (totalScrollableDistance > 0) {
          // Calculate progress based on overall scroll position
          overallProgress = (scrollPosition / totalScrollableDistance) * 100;
        } else {
          // Fallback to section-based calculation if totalScrollableDistance is invalid
          overallProgress = ((activeSectionIndex + sectionProgress / 100) / sections.length) * 100;
        }

        // Ensure progress is between 0-100%
        overallProgress = Math.min(100, Math.max(0, overallProgress));
        progressBar.style.width = `${overallProgress}%`;
      }

      // Update individual progress bars if you have them
      updateIndividualProgress(activeSectionIndex, sectionProgress);
    }
  }

  // Function to update individual progress bars
  function updateIndividualProgress(activeIndex, progress) {
    // If you have individual progress bars inside each nav link
    navLinks.forEach((link, index) => {
      const individualProgress = link.querySelector(".link-progress");
      if (individualProgress) {
        if (index < activeIndex) {
          // Sections before active are 100% complete
          individualProgress.style.width = "100%";
        } else if (index === activeIndex) {
          // Active section shows current progress
          individualProgress.style.width = `${progress}%`;
        } else {
          // Sections after active are 0%
          individualProgress.style.width = "0%";
        }
      }
    });
  }

  // Function to disable Webflow's default navigation behavior
  function disableWebflowNavigation() {
    // Create a style element to override Webflow's default behavior
    const style = document.createElement("style");
    style.textContent = `
      /* Disable Webflow's default navigation highlighting */
      .w-nav-link.w--current {
        color: inherit !important;
        background-color: inherit !important;
        font-weight: inherit !important;
        /* Add any other properties that Webflow might be changing */
      }
      
      /* Your custom active class styling */
      .side-nav a.active {
        /* Add your custom active styling here */
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);

    // Remove any existing w--current classes
    document.querySelectorAll(".w--current").forEach((el) => {
      el.classList.remove("w--current");
    });

    // Observe DOM changes to remove any w--current classes that Webflow might add
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target.classList.contains("w--current")
        ) {
          // If Webflow adds w--current, remove it
          mutation.target.classList.remove("w--current");
        }
      });
    });

    // Observe all navigation links
    navLinks.forEach((link) => {
      observer.observe(link, { attributes: true });
    });
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

  // Smooth scroll when clicking nav links
  navLinks.forEach((link, linkIndex) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      // Remove active class from all links and add to clicked link
      navLinks.forEach((l) => l.classList.remove(activeClass));
      this.classList.add(activeClass);

      // Reset all individual progress bars
      navLinks.forEach((navLink, index) => {
        const progressBar = navLink.querySelector(".link-progress");
        if (progressBar) {
          if (index < linkIndex) {
            // Sections before clicked link are 100% complete
            progressBar.style.width = "100%";
          } else if (index === linkIndex) {
            // Clicked link's progress starts at 0%
            progressBar.style.width = "0%";
          } else {
            // Sections after clicked link are 0%
            progressBar.style.width = "0%";
          }
        }
      });

      const targetId = this.getAttribute("href");
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        // Scroll to section with smooth behavior
        window.scrollTo({
          top: targetSection.offsetTop - offset,
          behavior: "smooth",
        });
      }
    });
  });
});
