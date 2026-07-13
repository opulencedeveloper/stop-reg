

class LoadingStateManager {
  constructor(config = {}) {
    this.config = {
      containerId: config.containerId || 'main-content',
      loadingId: config.loadingId || 'loading-state',
      errorId: config.errorId || 'error-state',
      retryBtnId: config.retryBtnId || 'retry-btn',
      errorMessageId: config.errorMessageId || 'error-message',
    };

    this.retryCallback = null;
    this.setupRetryButton();
  }

  setupRetryButton() {
    const retryBtn = document.getElementById(this.config.retryBtnId);
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        if (this.retryCallback) {
          this.retryCallback();
        }
      });
    }
  }

  showLoading() {
    const loading = document.getElementById(this.config.loadingId);
    const error = document.getElementById(this.config.errorId);
    const content = document.getElementById(this.config.containerId);

    if (loading) loading.style.display = 'flex';
    if (error) error.style.display = 'none';
    if (content) content.style.display = 'none';
  }

  showError(message = 'An error occurred. Please try again.') {
    const loading = document.getElementById(this.config.loadingId);
    const error = document.getElementById(this.config.errorId);
    const content = document.getElementById(this.config.containerId);
    const errorMsg = document.getElementById(this.config.errorMessageId);

    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'flex';
    if (content) content.style.display = 'none';
    if (errorMsg) errorMsg.textContent = message;
  }

  showContent() {
    const loading = document.getElementById(this.config.loadingId);
    const error = document.getElementById(this.config.errorId);
    const content = document.getElementById(this.config.containerId);

    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'none';
    if (content) content.style.display = 'block';
  }

  setRetryCallback(callback) {
    this.retryCallback = callback;
  }
}
