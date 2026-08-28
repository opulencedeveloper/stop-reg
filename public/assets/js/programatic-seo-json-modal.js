document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('jsonModal');
  const modalTrigger = document.getElementById('jsonModalTrigger');
  const modalClose = document.getElementById('jsonModalClose');
  const modalContinue = document.getElementById('jsonModalContinue');
  const modalOverlay = document.querySelector('.json-modal-overlay');

  if (!modal || !modalTrigger) return;

  function openModal() {
    modal.classList.remove('closing');
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.add('closing');
    setTimeout(() => {
      modal.classList.remove('active', 'closing');
    }, 300);
  }

  modalTrigger.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  modalContinue.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
});
