document.addEventListener('DOMContentLoaded', function() {
  const dnsModal = document.getElementById('dnsModal');
  const dnsModalClose = document.getElementById('dnsModalClose');
  const dnsModalCloseBtn = document.getElementById('dnsModalCloseBtn');
  const dnsModalOverlay = document.querySelector('.dns-modal-overlay');
  const modalSections = document.querySelectorAll('.dns-modal-section');

  if (!dnsModal) return;

  function openModal(sectionType) {
    // Hide all sections first
    modalSections.forEach(section => {
      section.style.display = 'none';
    });

    // Show only the matching section
    if (sectionType) {
      const targetSection = document.querySelector(`[data-section-type="${sectionType}"]`);
      if (targetSection) {
        targetSection.style.display = 'block';
      }
    } else {
      // If no section specified, show all (default behavior)
      modalSections.forEach(section => {
        section.style.display = 'block';
      });
    }

    dnsModal.classList.remove('closing');
    dnsModal.classList.add('active');
    dnsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    dnsModal.classList.add('closing');
    setTimeout(() => {
      dnsModal.classList.remove('active', 'closing');
      dnsModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 300);
  }

  document.addEventListener('click', function(e) {
    const button = e.target.closest('.dns-mail-link');
    if (button) {
      e.preventDefault();
      const sectionType = button.getAttribute('data-modal-section');
      openModal(sectionType);
    }
  });

  if (dnsModalClose) dnsModalClose.addEventListener('click', closeModal);
  if (dnsModalCloseBtn) dnsModalCloseBtn.addEventListener('click', closeModal);
  if (dnsModalOverlay) dnsModalOverlay.addEventListener('click', function(e) {
    if (e.target === dnsModalOverlay) closeModal();
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && dnsModal.classList.contains('active')) {
      closeModal();
    }
  });
});
