
document.addEventListener("DOMContentLoaded", function () {
    const accordionContainer = document.querySelector(".accordion");
    if (!accordionContainer || !window.FAQ_DATA) return;

    accordionContainer.innerHTML = "";
    window.FAQ_DATA.forEach((item, index) => {
        const itemNumber = index + 1;
        const animIndex = [5, 5, 4, 2, 5, 5, 4, 2][index % 8] || 5;
        
        const accordionItem = document.createElement("div");
        accordionItem.className = `accordion-item box animation${animIndex}`;
        
        accordionItem.innerHTML = `
            <button class="accordion-button" aria-expanded="false" aria-controls="faq-${itemNumber}">
                ${itemNumber}. ${item.question}
                <span class="accordion-icon" aria-hidden="true">
                    <img src="/assets/icons/drop-down.svg" alt="" />
                </span>
            </button>
            <div id="faq-${itemNumber}" class="accordion-content">
                <div class="faq-answer-inner">
                    ${item.answer.includes('<p>') ? item.answer : `<p>${item.answer}</p>`}
                </div>
            </div>
        `;
        
        accordionContainer.appendChild(accordionItem);
    });

    // 3. Attach standard accordion logic
    const buttons = accordionContainer.querySelectorAll(".accordion-button");
    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const isExpanded = button.getAttribute("aria-expanded") === "true";
            
            // Close all others (Exclusive toggle)
            buttons.forEach((btn) => {
                btn.setAttribute("aria-expanded", "false");
                btn.classList.remove("active");
                const content = btn.nextElementSibling;
                if (content) content.style.maxHeight = null;
            });

            // Toggle current
            if (!isExpanded) {
                button.setAttribute("aria-expanded", "true");
                button.classList.add("active");
                const content = button.nextElementSibling;
                if (content) {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            }
        });
    });

    // 4. Trigger Scroll Animations
    // Check if initScrollAnimations exists (from main.js)
    if (typeof initScrollAnimations === 'function') {
        initScrollAnimations("body");
    } else {
        // Fallback: manually handle visibility if observer is available
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible-ani");
                }
            });
        }, { threshold: 0.1 });
        
        accordionContainer.querySelectorAll(".box").forEach(box => observer.observe(box));
    }
});
