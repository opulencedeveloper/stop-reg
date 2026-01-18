document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Mind-Blowing Entrance Animations ---
  const leftHeader = document.querySelector('.auth-left-header');
  const formContainer = document.querySelector('.auth-form-container');
  
  // Staggered sequence
  if (leftHeader) {
    setTimeout(() => {
      leftHeader.classList.add('anim-slide-up');
    }, 200);
  }
  
  if (formContainer) {
    setTimeout(() => {
      formContainer.classList.add('anim-slide-up');
    }, 400); // Wait for left side slightly
  }
  
  // --- 2. Password Toggle Logic ---
  const toggleButtons = document.querySelectorAll('.toggle-password');
  
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent form submit if button in form
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('img');
      
      if (input) {
        if (input.type === "password") {
          input.type = "text";
          if (icon) icon.src = "/assets/icons/mynaui_eye.svg"; // Show password (Open Eye)
        } else {
          input.type = "password";
          if (icon) icon.src = "/assets/icons/iconoir_eye-closed.svg"; // Hide password (Closed Eye)
        }
      }
    });
  });

  // --- 3. Mobile Menu (Standard Toggle) ---

});
