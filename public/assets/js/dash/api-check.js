document.addEventListener("DOMContentLoaded", () => {
  // Hide the loading spinner since this page doesn't need initial data fetch
  if (typeof window.hideSpinner === 'function') {
    window.hideSpinner();
  }

  const form = document.getElementById("api-check-form");
  const submitBtn = form.querySelector(".api-check-submit-btn") || form.querySelector(".bulk-check-email-btn");
  const resultContainer = document.getElementById("api-check-result");

  resultContainer.innerHTML = "";
  resultContainer.style.display = "none";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const apiToken = document.getElementById("api-token").value.trim();
    const email = document.getElementById("check-email").value.trim();

    if (!apiToken || !email) {
      if (typeof iziToast !== 'undefined') {
        iziToast.error({
          title: 'Error',
          message: "Please fill in both API token and email address",
          position: "topRight",
          timeout: 5000,
          drag: false,
          displayMode: 1,
          zindex: 9999,
        });
      } else {
        alert("Please fill in both API token and email address");
      }
      return;
    }

    // Add spinner
    const buttonText = submitBtn.querySelector('#button-text') || submitBtn;
    const originalText = buttonText.textContent;
    submitBtn.disabled = true;
    if (buttonText.id === 'button-text') {
      buttonText.innerHTML = `<span class="btn-spinner"></span> Checking...`;
    } else {
      submitBtn.innerHTML = `<span class="btn-spinner"></span> Checking...`;
    }

    try {
      // Construct the URL with API token and email
      const url = `https://api.stopreg.com/api/v1/check/${apiToken}?email=${encodeURIComponent(email)}`;
      
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
        
        // Show error toast
        if (typeof iziToast !== 'undefined') {
          iziToast.error({
            title: 'Error',
            message: errorDescription,
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 9999,
          });
        }
        
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
        // Show success toast
        if (typeof iziToast !== 'undefined') {
          iziToast.success({
            title: 'Success',
            message: "Email check completed successfully!",
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 9999,
          });
        }
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
              
              // Create a descriptive message based on the key and value
              let description = '';
              if (key.toLowerCase().includes('disposable')) {
                description = displayValue === 'YES' 
                  ? 'This email is from a disposable email provider' 
                  : 'This email is not from a disposable email provider';
              } else if (key.toLowerCase().includes('mx') || key.toLowerCase().includes('record')) {
                description = displayValue === 'YES' 
                  ? 'This domain has MX records and can receive emails' 
                  : 'This domain does not have valid MX records';
              } else if (key.toLowerCase().includes('public')) {
                description = displayValue === 'YES' 
                  ? 'This is a public email provider (e.g., Gmail, Yahoo)' 
                  : 'This is not a public email provider';
              } else if (key.toLowerCase().includes('relay')) {
                description = displayValue === 'YES' 
                  ? 'This domain acts as a relay domain' 
                  : 'This domain does not appear to be a relay domain';
              } else {
                description = `Value: ${displayValue}`;
              }
              
              resultHTML += `
                <div class="disposal-result-inner-cont ${valueClass}">
                  <div class="disposal-result">
                    <div class="disposable-result-cont">
                      <h3 class="disposal-result-head">${formattedKey}</h3>
                      <p class="disposal-result-para">
                        ${description}
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
      
      // Show error toast
      if (typeof iziToast !== 'undefined') {
        iziToast.error({
          title: 'Network Error',
          message: err.message || "Network error — please try again later.",
          position: "topRight",
          timeout: 5000,
          drag: false,
          displayMode: 1,
          zindex: 9999,
        });
      }
      
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
      const buttonText = submitBtn.querySelector('#button-text') || submitBtn;
      if (buttonText.id === 'button-text') {
        buttonText.textContent = originalText;
      } else {
        submitBtn.textContent = originalText;
      }
    }
  });
});

