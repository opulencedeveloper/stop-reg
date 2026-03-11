/**
 * Admin Profile Page Logic
 * Handles tab switching and password visibility toggle.
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabSwitching();
    initPasswordVisibility();
    initFormSubmissions();
});

/**
 * Initializes tab switching for both desktop and mobile layouts.
 */
function initTabSwitching() {
    const desktopBtns = document.querySelectorAll('.profile-nav-btn');
    const mobileBtns = document.querySelectorAll('.mobile-tab-btn');
    const panes = document.querySelectorAll('.profile-pane');

    function switchTab(tabId) {
        // Update Side Nav (Desktop)
        desktopBtns.forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update Horizontal Tabs (Mobile)
        mobileBtns.forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update Panes
        panes.forEach(pane => {
            if (pane.id === `${tabId}-pane`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    }

    // Attach click events to desktop buttons
    desktopBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Attach click events to mobile buttons
    mobileBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

/**
 * Initializes password visibility toggle logic.
 */
function initPasswordVisibility() {
    const toggles = document.querySelectorAll('.password-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const wrapper = toggle.closest('.password-input-wrapper');
            const input = wrapper.querySelector('input');
            const icon = toggle.querySelector('img');

            if (input.type === 'password') {
                input.type = 'text';
                icon.src = '/assets/icons/obsure.svg'; // Show eye (Visible state)
            } else {
                input.type = 'password';
                icon.src = '/assets/icons/obsured.svg'; // Slashed eye (Hidden state)
            }
        });
    });
}

/**
 * Handles dummy form submissions for showcase.
 */
function initFormSubmissions() {
    const personalForm = document.getElementById('personal-details-form');
    const passwordForm = document.getElementById('update-password-form');

    if (personalForm) {
        personalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = personalForm.querySelector('.profile-submit-btn');
            const originalText = submitBtn.textContent;

            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;

            setTimeout(() => {
                alert('Personal details updated successfully!');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1000);
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPwd = document.getElementById('new-password').value;
            const retypePwd = document.getElementById('retype-password').value;

            if (newPwd !== retypePwd) {
                alert('Passwords do not match!');
                return;
            }

            const submitBtn = passwordForm.querySelector('.profile-submit-btn');
            const originalText = submitBtn.textContent;

            submitBtn.textContent = 'Updating...';
            submitBtn.disabled = true;

            setTimeout(() => {
                alert('Password updated successfully!');
                passwordForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1000);
        });
    }
}
