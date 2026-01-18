document.addEventListener("DOMContentLoaded", () => {
  // Intersection Observer Options
  const observerOptions = {
    root: null, // viewport
    rootMargin: "0px",
    threshold: 0.05, // Trigger almost immediately
  };

  // Callback function
  const observerCallback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Add active class to start animation
        entry.target.classList.add("privacy-anim-active");

        // Stop observing once animated
        observer.unobserve(entry.target);
      }
    });
  };

  // Create Observer
  const observer = new IntersectionObserver(observerCallback, observerOptions);

  // Select all animated elements
  const animatedElements = document.querySelectorAll(
    ".privacy-anim-item, .privacy-anim-blur"
  );

  // Start observing
  animatedElements.forEach((el) => observer.observe(el));
});
