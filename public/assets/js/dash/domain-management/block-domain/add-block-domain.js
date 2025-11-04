document.addEventListener("DOMContentLoaded", () => {
  const addBlockForm = document.getElementById("report-container");
  const submitBtn = document.querySelector(".report-container-btn");
  const domainInput = document.getElementById("domain");
  const commentInput = document.getElementById("comment");
  const reportDomainOverlay = document.getElementById("report-domain-overlay");
  const token = localStorage.getItem("authToken");

  let errorModal = document.querySelector(".error-modal");

  //   addBlockForm.parentElement.appendChild(errorModal);

  const errorIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M12 0C5.372 0 0 5.373 0 12c0 6.628 5.372 12 12 12s12-5.372 12-12C24 5.373 18.628 0 12 0zm1 17h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  `;

  function showError(message) {
    errorModal.innerHTML = `${errorIcon}<span>${message}</span>`;
    errorModal.style.display = "flex";
  }

  function isValidDomain(domain) {
    const domainRegex = /^www\.([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,}$/;
    return domainRegex.test(domain.trim());
  }

  function toggleButtonState() {
    const domain = domainInput.value.trim();
    const comment = commentInput.value.trim();
    submitBtn.disabled = !domain || !comment; // disable if empty
  }

  domainInput.addEventListener("input", toggleButtonState);
  commentInput.addEventListener("input", toggleButtonState);

  toggleButtonState();

  // 🧩 Form submit
  addBlockForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!token) {
      window.location.href = "/login.html";
      return;
    }

    const domain = domainInput.value.trim();
    const comment = commentInput.value.trim();

    if (!domain || !comment) {
      showError("Please fill in both the domain and comment fields.");
      return;
    }

    if (!isValidDomain(domain)) {
      showError("Please enter a valid domain name (e.g. www.example.com).");
      domainInput.focus();
      return;
    }

    // ✅ Construct payload
    const payload = { domain, comment, status: "active", type: "blocked" };
    console.log("📦 Payload to send:", payload);

    // Simulate API call
    submitBtn.disabled = true;
    submitBtn.textContent = "Blocking...";

    try {
      const response = await fetch(
        "https://api-stop-reg.onrender.com/api/v1/manage/domain/add",
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
        iziToast.success({
          message: "Domain Blocked successfully!",
          position: "topRight",
          drag: false,
          displayMode: 1,
        });
        
        addBlockForm.reset();
        reportDomainOverlay.style.display = "none";
      } else {
        showError(data.description || data.message || "Blocking failed!");
      }
      addBlockForm.reset();
    } catch (err) {
      console.error("Error:", err);
      showError("Something went wrong. Try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Block";
      toggleButtonState();
    }
  });
});
