document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".bulk-verification-form");
  const submitBtn = form.querySelector(".bulk-verify-domain-btn");

  const token = localStorage.getItem("authToken");

  const bulkLinks = document.getElementById("bulk-links");

  bulkLinks.addEventListener("keyup", (e) => {
    if ([" ", "Enter", ","].includes(e.key)) {
      formatLinks();
    }
  });

  bulkLinks.addEventListener("blur", formatLinks);

  function formatLinks() {
    const text = bulkLinks.innerText.trim();
    const links = text.split(/[\s,]+/).filter((v) => v.trim() !== "");

    bulkLinks.innerHTML = links
      .map((link) => `<span>${link}</span>`)
      .join(" ");
  }

  function getLinksArray() {
    return Array.from(bulkLinks.querySelectorAll("span")).map((el) =>
      el.innerText.trim()
    );
  }

  // document
  //   .querySelector(".bulk-verify-domain-btn")
  //   .addEventListener("click", () => {
  //     const links = getLinksArray();
  //     console.log("✅ Links Array:", links);
  //   });

  // disposalResult.innerHTML = "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!token) {
      window.location.href = "/login.html";
      return;
    }

    // ✅ Collect domains as array of strings
    const links = getLinksArray();

    if (links.length === 0) {
      alert("Please enter at least one domain or email address.");
      return;
    }

    const payload = { domains: links };

    console.log("📦 Payload to send:", payload);

  
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span> Verifying...`;

    try {
      const response = await fetch(
        "https://api-stop-reg.onrender.com/api/v1/email-domains/bulk-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload), // ✅ send correct JSON
        }
      );

      const data = await response.json();
      console.log("Response:", data);

      if (response.ok) {
        const disposal = data?.data;
        disposalResult.innerHTML = `<pre>${JSON.stringify(disposal, null, 2)}</pre>`;
        bulkLinks.innerHTML = ""; // clear input
      } else {
        alert(data.description || data.message || "Verification failed!");
      }
    } catch (err) {

    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
