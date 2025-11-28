document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("verify-form");
  const submitBtn = form.querySelector(".bulk-check-email-btn");
  const overLay = document.getElementById("overlay");
  const token = localStorage.getItem("authToken");
  const disposalResult = document.querySelector(".disposal-email-result-cont");

  disposalResult.innerHTML = "";

  // Hide spinner since this page doesn't fetch initial data
  if (typeof window.hideSpinner === 'function') {
    window.hideSpinner();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!token) {
      window.location.href = "/";
      return;
    }

    const email = document.getElementById("disposal-email").value.trim();
    const payload = { email };

    // Add spinner
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span> Verifying...`;

    try {
      const response = await fetch(
        "https://api.stopreg.com/api/v1/email-domains/check-disposable-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("Response:", data);

      if (response.ok) {
        const disposal = data?.data;

        // Determine YES/NO status for disposable only
        const disposableStatus = disposal.isDisposable ? "YES" : "NO";

        // Apply dynamic class
        const disposableClass =
          disposableStatus === "YES"
            ? "disposal-result-inner-cont"
            : "disposal-result-inner-cont result-false";

        disposalResult.style.display = "flex";
        disposalResult.innerHTML = `
          <h4 class="disposal-result-title">
            The email provided <b>${email}</b> ${
          disposal.isDisposable ? "is" : "is not"
        } a verified disposable email
          </h4>

          <div class="${disposableClass}">
            <div class="disposal-result">
              <div class="disposable-result-cont">
                <h3 class="disposal-result-head">Disposable</h3>
                <p class="disposal-result-para">
                  ${
                    disposableStatus === "YES"
                      ? "This email is from a disposable email provider."
                      : "This email is not from a disposable email provider."
                  }
                </p>
              </div>
              <p class="disposal-result-bolean">${disposableStatus}</p>
            </div>
          </div>
        `;

        form.reset();
      } else {
        const errorMessage = data.description || data.message || "Verification failed!";
        if (typeof iziToast !== 'undefined') {
          iziToast.error({
            title: 'Error',
            message: errorMessage,
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 9999,
          });
        } else {
          alert(errorMessage);
        }
      }
    } catch (err) {
      console.error("Network error:", err);
      if (typeof iziToast !== 'undefined') {
        iziToast.error({
          title: 'Network Error',
          message: "Network error — please try again later.",
          position: "topRight",
          timeout: 5000,
          drag: false,
          displayMode: 1,
          zindex: 9999,
        });
      } else {
        alert("Network error — please try again later.");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
