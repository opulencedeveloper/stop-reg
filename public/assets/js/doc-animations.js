
document.addEventListener("DOMContentLoaded", () => {
  // Mobile check helper
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  function initDocAnimations() {
       // 1. Select elements
       const docItems = document.querySelectorAll('.documen-content-item');
       const headerText = document.querySelector('.docs-header-sect-one');
       const headerImg = document.querySelector('.docs-header-img');
     
       // 2. Animation Classes Pool (for content items)
       const contentAnimations = [
         'doc-anim-fade-up',
         'doc-anim-scale',
         'doc-anim-blur'
       ];
     
       // 3. Initialize Observer
       const observerOptions = {
         root: null,
         threshold: 0, 
         rootMargin: "0px 0px 100px 0px"
       };
     
       const observer = new IntersectionObserver((entries, observer) => {
         entries.forEach((entry) => {
           if (entry.isIntersecting) {
             const item = entry.target;
             
             // Remove init class (hidden state)
             item.classList.remove('doc-animate-init');
     
             // Determine specific animation based on element
             if (item === headerText) {
                item.classList.add('doc-anim-header-text');
             } else if (item === headerImg) {
                // Slight delay for image for visual interest
                setTimeout(() => {
                  item.classList.add('doc-anim-header-img');
                }, 200);
             } else {
                // Standard Content Item: Pick Random Premium Animation
                const randomAnim = contentAnimations[Math.floor(Math.random() * contentAnimations.length)];
                item.classList.add(randomAnim);
             }
     
             // Stop observing this item
             observer.unobserve(item);
           }
         });
       }, observerOptions);
     
       // 4. Setup Content Elements
       if (docItems.length) {
         docItems.forEach((item, index) => {
           // Ensure hidden state is present (backup for HTML)
           item.classList.add('doc-animate-init');
     
           // Special Case: First Article animates ON LOAD (not on view)
           if (index === 0) {
             // Wait for header animations to start (approx 100ms), then trigger first article
             setTimeout(() => {
                item.classList.remove('doc-animate-init');
                item.classList.add('doc-anim-fade-up'); // Consistent premium fade up
             }, 100);
           } else {
             // All other items wait for scroll
             observer.observe(item);
           }
         });
       }
     
       // 5. Setup Header Elements
       if (headerText) {
         headerText.classList.add('doc-animate-init');
         observer.observe(headerText);
       }
       if (headerImg) {
         headerImg.classList.add('doc-animate-init');
         observer.observe(headerImg);
       }
  }

  if (document.querySelector('.entrance-overlay')) {
      window.addEventListener('entrance-complete', initDocAnimations);
  } else {
      initDocAnimations();
  }
});
