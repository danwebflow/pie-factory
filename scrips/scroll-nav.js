// Scroll Navigation with Progress Bar
document.addEventListener("DOMContentLoaded", function () {
  // Configuration
  const navLinks = document.querySelectorAll('.side-nav a[href^="#"]'); // Adjust selector to match your side nav links
  const progressBar = document.querySelector(".header__progress"); // Main progress bar
  const sections = []; // Will store section data
  const offset = 10; // Offset in pixels from top of viewport to trigger active state

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
        link.classList.remove("w--current");
      });

      // Add active class to current link
      activeSection.link.classList.add("w--current");

      // Calculate progress within the current section
      let progress = 0;

      if (activeSectionIndex < sections.length - 1) {
        // If not the last section, calculate progress between this section and the next
        const nextSection = sections[activeSectionIndex + 1];
        const sectionScrolled = scrollPosition - activeSection.top;
        const sectionDistance = nextSection.top - activeSection.top;

        // Calculate progress as percentage (0-100)
        progress = Math.min(100, Math.max(0, (sectionScrolled / sectionDistance) * 100));
      } else {
        // If it's the last section, calculate progress within the section
        const sectionScrolled = scrollPosition - activeSection.top;

        // Calculate progress as percentage (0-100)
        // We consider the section "complete" when we've scrolled through most of it
        // or reached the bottom of the page
        const isAtBottom = scrollPosition + viewportHeight >= document.body.scrollHeight - 50;

        if (isAtBottom) {
          progress = 100;
        } else {
          progress = Math.min(100, Math.max(0, (sectionScrolled / activeSection.height) * 100));
        }
      }

      // Update the progress bar width
      if (progressBar) {
        // Calculate overall progress
        const overallProgress = ((activeSectionIndex + progress / 100) / sections.length) * 100;
        progressBar.style.width = `${overallProgress}%`;
      }

      // Optional: Update individual progress bars if you have them
      updateIndividualProgress(activeSectionIndex, progress);
    }
  }

  // Function to update individual progress bars (if you decide to use them)
  function updateIndividualProgress(activeIndex, progress) {
    // If you have individual progress bars inside each nav link
    // You can update them here
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
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

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
