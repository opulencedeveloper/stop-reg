document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("verify-form");
  const token = localStorage.getItem("authToken");
  
  // Select results elements
  const resultsContainer = document.querySelector(".check-email-right");
  const resultTitle = document.querySelector(".disposal-result-main-title");
  const resultsList = document.querySelector(".disposal-results-list");

  // Hide spinner since this page might be waiting for user input, 
  // but also to fix the "keeps loading" issue if fetch-user-detail.js is slow or fails
  if (typeof window.hideSpinner === 'function') {
    window.hideSpinner();
  }

  if (!form) return;
  const submitBtn = form.querySelector(".bulk-check-email-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!token) {
      window.location.href = "/";
      return;
    }

    const emailInput = document.getElementById("disposal-email");
    const email = emailInput.value.trim();
    if (!email) return;

    const payload = { email };

    // Update button state
    const originalText = "Verify";
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Verifying...`;

    try {
      const response = await fetch(
        "https://api-stop-reg.onrender.com/api/v1/email-domains/check-disposable-email",
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
      console.log("Verification Response:", data);

      if (response.ok) {
        const disposal = data?.data;
        
        // Update the main title
        if (resultTitle) {
          resultTitle.innerHTML = `The email provided <b>${email}</b> ${disposal.isDisposable ? "is" : "is not"} a verified disposable email`;
        }

        // Update individual result cards
        if (resultsList) {
          const cards = resultsList.querySelectorAll(".result-card");
          
          // Helper to update a card
          const updateCard = (card, value, title, trueDesc, falseDesc) => {
            if (!card) return;
            const isTrue = !!value;
            card.className = `result-card ${isTrue ? 'status-true' : 'status-false'}`;
            const head = card.querySelector(".result-head");
            const desc = card.querySelector(".result-desc");
            const bool = card.querySelector(".result-boolean");
            
            if (head) head.textContent = title;
            if (desc) desc.textContent = isTrue ? trueDesc : falseDesc;
            if (bool) bool.textContent = isTrue ? "True" : "False";
          };

          // Mapping API fields to cards
          updateCard(cards[0], disposal.mxRecord ?? disposal.mx_record, "MX Record", 
            "This domain has an MX record and can receive emails.", 
            "This domain does not have a valid mail server.");
          
          updateCard(cards[1], disposal.isDisposable ?? disposal.disposable_domain, "Disposable", 
            "This domain appears to be from a disposable email provider.", 
            "This domain does not appear to be from a disposable provider.");
          
          updateCard(cards[2], disposal.isPublic ?? disposal.public_email_provider, "Public email provider", 
            "This domain is from a public email provider (e.g. Gmail).", 
            "This domain is not from a public email provider.");
            
          updateCard(cards[3], disposal.isRelay ?? disposal.relay_domain, "Relay domain", 
            "This domain acts as a relay or alias service.", 
            "This domain does not appear to be a relay domain.");
        }

        if (typeof iziToast !== 'undefined') {
          iziToast.success({
            title: 'Success',
            message: 'Email verified successfully',
            position: "topRight",
            timeout: 3000
          });
        }

      } else {
        const errorMessage = data.description || data.message || "Verification failed!";
        if (typeof iziToast !== 'undefined') {
          iziToast.error({
            title: 'Error',
            message: errorMessage,
            position: "topRight",
            timeout: 5000,
          });
        }
      }
    } catch (err) {
      console.error("Network error:", err);
      if (typeof iziToast !== 'undefined') {
        iziToast.error({
          title: 'Network Error',
          message: "Could not connect to the server. Please check your connection.",
          position: "topRight",
          timeout: 5000,
        });
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
