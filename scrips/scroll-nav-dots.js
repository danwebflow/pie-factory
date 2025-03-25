// Scroll Navigation with Progress Bar for Dot Navigation
document.addEventListener("DOMContentLoaded", function () {
  // Configuration
  const navDots = document.querySelectorAll(".side-nav .dot"); // Adjust selector to match your dot elements
  const progressBar = document.querySelector(".header__progress"); // Main progress bar
  const sections = []; // Will store section data
  const offset = 10; // Offset in pixels from top of viewport to trigger active state
  const activeClass = "active"; // Custom active class

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

      // Update individual progress bars and the header progress
      updateIndividualProgress(activeSectionIndex, sectionProgress);
    }
  }

  // Function to update individual progress bars
  function updateIndividualProgress(activeIndex, progress) {
    // Update progress for each dot
    navDots.forEach((dot, index) => {
      const individualProgress = dot.querySelector(".dot-progress");

      // Update progress state with data attributes
      if (index < activeIndex) {
        // Sections before active are completed
        dot.setAttribute("data-progress", "completed");
      } else if (index === activeIndex) {
        // Active section is in progress
        dot.setAttribute("data-progress", "in-progress");
      } else {
        // Sections after active are not started
        dot.setAttribute("data-progress", "not-started");
      }

      // Update the visual progress bar if it exists
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

    // Update the header progress bar
    const headerProgress = document.querySelector(".header__progress");
    if (headerProgress) {
      headerProgress.style.width = `${progress}%`;
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

      // Reset all individual progress bars and update data attributes
      navDots.forEach((navDot, index) => {
        // Update data attributes for tracking progress state
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

        // Update visual progress bars
        const progressBar = navDot.querySelector(".dot-progress");
        if (progressBar) {
          if (index < dotIndex) {
            // Sections before clicked dot are 100% complete
            progressBar.style.width = "100%";
          } else if (index === dotIndex) {
            // Clicked dot's progress starts at 0%
            progressBar.style.width = "0%";
          } else {
            // Sections after clicked dot are 0%
            progressBar.style.width = "0%";
          }
        }
      });

      // Also reset the header progress bar
      const headerProgress = document.querySelector(".header__progress");
      if (headerProgress) {
        headerProgress.style.width = "0%";
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
});
