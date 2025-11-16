document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("api-check-form");
  const submitBtn = form.querySelector(".bulk-check-email-btn");
  const resultContainer = document.getElementById("api-check-result");

  resultContainer.innerHTML = "";
  resultContainer.style.display = "none";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const apiToken = document.getElementById("api-token").value.trim();
    const email = document.getElementById("check-email").value.trim();

    if (!apiToken || !email) {
      alert("Please fill in both API token and email address");
      return;
    }

    // Add spinner
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span> Checking...`;

    try {
      // Construct the URL with API token and email
      const url = `https://api-stop-reg.onrender.com/api/v1/check/${apiToken}?email=${encodeURIComponent(email)}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Response:", data);

      resultContainer.style.display = "flex";

      // Check if the response indicates an error (even if status is 200)
      if (data.message === "error" || !response.ok) {
        // Handle error response - display description
        const errorDescription = data.description || data.message || 'Request failed';
        resultContainer.innerHTML = `
          <h4 class="disposal-result-title" style="color: var(--tertiary-color);">
            Error: ${errorDescription}
          </h4>
          <div class="disposal-result-inner-cont result-false">
            <div class="disposal-result">
              <div class="disposable-result-cont">
                <h3 class="disposal-result-head">Error Details</h3>
                <p class="disposal-result-para">
                  ${errorDescription}
                </p>
              </div>
            </div>
          </div>
        `;
      } else {
        // Display the response data
        // Format the response for display
        let resultHTML = `
          <h4 class="disposal-result-title">
            API Check Result for <b>${email}</b>
          </h4>
        `;

        // Display the response data in a readable format
        if (data.data) {
          const responseData = data.data;
          
          // Check if it's an object with properties
          if (typeof responseData === 'object' && responseData !== null) {
            for (const [key, value] of Object.entries(responseData)) {
              const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const displayValue = typeof value === 'boolean' ? (value ? 'YES' : 'NO') : value;
              const valueClass = typeof value === 'boolean' && value ? '' : 'result-false';
              
              resultHTML += `
                <div class="disposal-result-inner-cont ${valueClass}">
                  <div class="disposal-result">
                    <div class="disposable-result-cont">
                      <h3 class="disposal-result-head">${formattedKey}</h3>
                      <p class="disposal-result-para">
                        ${formattedKey}: ${displayValue}
                      </p>
                    </div>
                    <p class="disposal-result-bolean">${displayValue}</p>
                  </div>
                </div>
              `;
            }
          } else {
            // If it's a simple value, just display it
            resultHTML += `
              <div class="disposal-result-inner-cont">
                <div class="disposal-result">
                  <div class="disposable-result-cont">
                    <h3 class="disposal-result-head">Result</h3>
                    <p class="disposal-result-para">
                      ${JSON.stringify(responseData, null, 2)}
                    </p>
                  </div>
                </div>
              </div>
            `;
          }
        } else {
          // Display the entire response if no data property
          resultHTML += `
            <div class="disposal-result-inner-cont">
              <div class="disposal-result">
                <div class="disposable-result-cont">
                  <h3 class="disposal-result-head">Response</h3>
                  <p class="disposal-result-para" style="white-space: pre-wrap; font-family: monospace;">
                    ${JSON.stringify(data, null, 2)}
                  </p>
                </div>
              </div>
            </div>
          `;
        }

        resultContainer.innerHTML = resultHTML;
      }
    } catch (err) {
      console.error("Network error:", err);
      resultContainer.style.display = "flex";
      resultContainer.innerHTML = `
        <h4 class="disposal-result-title" style="color: var(--tertiary-color);">
          Network Error
        </h4>
        <div class="disposal-result-inner-cont result-false">
          <div class="disposal-result">
            <div class="disposable-result-cont">
              <h3 class="disposal-result-head">Error</h3>
              <p class="disposal-result-para">
                ${err.message || "Network error — please try again later."}
              </p>
            </div>
          </div>
        </div>
      `;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});

