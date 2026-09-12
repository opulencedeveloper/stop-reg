document.addEventListener('DOMContentLoaded', function() {
  const accordionContainer = document.querySelector('.accordion');
  if (!accordionContainer) {
    return;
  }

  if (accordionContainer.__seoAccordionInit) {
    return;
  }
  accordionContainer.__seoAccordionInit = true;

  const buttons = accordionContainer.querySelectorAll('.accordion-button');

  buttons.forEach((button) => {
    button.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';

      buttons.forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('active');
        const content = btn.nextElementSibling;
        if (content) {
          content.style.maxHeight = null;
        }
      });

      if (!isExpanded) {
        this.setAttribute('aria-expanded', 'true');
        this.classList.add('active');
        const content = this.nextElementSibling;
        if (content) {
          const height = content.scrollHeight;
          content.style.maxHeight = height + 'px';
        }
      }
    });
  });

  setTimeout(() => {
    const boxElements = accordionContainer.querySelectorAll('.box');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible-ani');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    boxElements.forEach((box) => {
      observer.observe(box);
    });
  }, 50);
});
