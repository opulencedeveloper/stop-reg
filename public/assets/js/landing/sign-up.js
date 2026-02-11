document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Mind-Blowing Entrance Animations ---
  const leftHeader = document.querySelector('.auth-left-header');
  const leftTitle = document.querySelector('.auth-left-tle');
  const formContainer = document.querySelector('.auth-form-container');
  
  // Staggered sequence
  if (leftHeader) {
    setTimeout(() => {
      leftHeader.classList.add('anim-slide-up');
    }, 200);
  }

  if (leftTitle) {
    setTimeout(() => {
        leftTitle.classList.add('anim-slide-up');
    }, 400); 
  }
  
  if (formContainer) {
    setTimeout(() => {
      formContainer.classList.add('anim-slide-up');
    }, 600); // Delayed to follow title
  }

  // --- 1.5 Cosmic Parallax Effect (Removed for infinite animation) ---
  // The animation is now fully handled by CSS keyframes in sign-up.css
  // for a continuous, "out of this world" experience without user input.
  
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

  // --- 4. Floating 'Threat Blocked' Particles ---
  function createParticle() {
      const section = document.querySelector('.auth-left-section');
      if (!section) return;

      const particle = document.createElement('div');
      particle.classList.add('threat-particle');
      
      // Random positioning
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      
      particle.style.left = `${startX}%`;
      particle.style.top = `${startY}%`;
      
      // Randomize delay and size
      const delay = Math.random() * 5;
      const size = Math.random() * 8 + 4; // 4px to 12px
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.animationDelay = `${delay}s`;
      
      section.appendChild(particle);
      
      // Cleanup after animation
      setTimeout(() => {
          particle.remove();
      }, 8000 + (delay * 1000));
  }

  // Generate initial batch and loop
  const particleCount = 20; 
  for (let i = 0; i < particleCount; i++) {
      createParticle();
  }
  
  setInterval(createParticle, 2000); // Continuous generation

});
