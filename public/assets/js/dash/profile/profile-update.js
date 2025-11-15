document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-container");
  const submitBtn = form.querySelector(".p-save-ch-btn");

  let errorModal = document.createElement("div");
  errorModal.className = "error-modal";
  form.parentElement.appendChild(errorModal);

  const userFullName = document.querySelector(".profile-name");

  const fullName = localStorage.getItem("userName");

  if (fullName !== "") {
    userFullName.textContent = `${fullName}`;
  } else {
    userFullName.textContent = "No name yet";
  }

  const errorIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M12 0C5.372 0 0 5.373 0 12c0 6.628 5.372 12 12 12s12-5.372 12-12C24 5.373 18.628 0 12 0zm1 17h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  `;

  function showError(message) {
    errorModal.innerHTML = `${errorIcon}<span>${message}</span>`;
    errorModal.style.display = "flex";
  }

  function hideError() {
    errorModal.style.display = "none";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    const token = localStorage.getItem("authToken");

    if (!token) {
      window.location.href = "/login.html";
      return;
    }
    const fullName = document.getElementById("fullname").value.trim();

    const payload = { fullName };

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span> `;

    try {
      const response = await fetch(
        "https://api-stop-reg.onrender.com/api/v1/user/update/fullname",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ send token here
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("Response:", data);

      // 🔥 FIX: Handle OTP request BEFORE success/error blocks
      if (data.message === "verify_email") {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      if (response.ok) {
        localStorage.removeItem("userName");
        localStorage.setItem("userName", fullName);
        iziToast.success({
          message: "Account updated successfully!",
          position: "topRight",
        });

        setTimeout(() => {
          window.location.reload();
        }, 0);

        form.reset();
      } else {
        showError(data.description || data.message || "Login failed!");
      }
    } catch (err) {
      showError("Network error — please try again later.");
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
