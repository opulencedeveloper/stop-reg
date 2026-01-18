// Function to initialize animations
function initScrollAnimations() {
  // Small delay to ensure main.js has finished hiding/showing content
  setTimeout(() => {
    // Select all privacy sections
    const sections = document.querySelectorAll(".privacy-section");

    if (sections.length === 0) return;

    // Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const observerOptions = {
      root: null,
      threshold: 0.5, 
      rootMargin: "0px" 
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const effect = entry.target.dataset.effect;
          if (effect) {
            entry.target.classList.add(effect);
            entry.target.classList.remove("term-animate-hidden");
          }
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const effects = ["animate-fade-up", "animate-soft-scale", "animate-tilt-up", "animate-skew-slide"];

    sections.forEach((section, index) => {
      section.classList.add("term-animate-hidden");
      const effect = effects[index % effects.length];
      section.dataset.effect = effect;
      observer.observe(section);
    });

    // SAFETY FALLBACK
    setTimeout(() => {
      sections.forEach(section => {
        if (section.classList.contains("term-animate-hidden")) {
          section.classList.remove("term-animate-hidden");
          section.style.opacity = 1; 
        }
      });
    }, 3000);
  }, 100);
}

// Check if page is already loaded
if (document.readyState === "complete") {
  initScrollAnimations();
} else {
  window.addEventListener("load", initScrollAnimations);
}
