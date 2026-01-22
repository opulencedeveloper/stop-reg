 

 
  
document.addEventListener("DOMContentLoaded", () => {
    const legacyBtn = document.querySelector(".ratoken-btn");
    const generateBtn = document.getElementById("generate-token-btn");

    if (legacyBtn) legacyBtn.addEventListener("click", () => handleRegenerate(legacyBtn));
    if (generateBtn) generateBtn.addEventListener("click", () => handleRegenerate(generateBtn));
});

async function handleRegenerate(btn) {
    const token = localStorage.getItem("authToken");
    const originalText = btn.innerHTML; // Store HTML to preserve icon if any
    const isNewBtn = btn.id === "generate-token-btn";
    
    // Loading state
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-spinner"></span> ${isNewBtn ? "Generating..." : "Requesting..."}`;

    if (!token) {
        window.location.href = "/";
        return;
    }

    try {
        const response = await fetch(
            "https://api-stop-reg.onrender.com/api/v1/user/regenerate/token",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();
        console.log("Regenerate Response:", data);

        if (response.ok) {
            const newApiToken = data?.data?.apiToken;
            console.log("New token:", newApiToken);

            if (newApiToken) {
                // 1. Update Legacy Token Display
                const tokenElement = document.querySelector(".main-token");
                if (tokenElement) {
                    tokenElement.textContent = newApiToken;
                }

                // 2. Update New Token Display
                const apiTokenTextEl = document.getElementById("api-token-text");
                if (apiTokenTextEl) {
                    const truncatedToken = newApiToken.length > 25 ? newApiToken.substring(0, 25) + "..." : newApiToken;
                    apiTokenTextEl.textContent = truncatedToken;
                    apiTokenTextEl.dataset.fullText = newApiToken;
                }

                // 3. Update Link
                const linkContainer = document.querySelector(".link-container");
                if (linkContainer) {
                    const newLink = ` https://api-stop-reg.onrender.com/api/v1/check/${newApiToken}?email=test@test.com`;
                    linkContainer.href = newLink;
                    
                    const linkTitle = linkContainer.querySelector(".token-link-title");
                    if (linkTitle) {
                        linkTitle.textContent = newLink;
                    }
                }

                if (typeof iziToast !== 'undefined') {
                    iziToast.success({
                        title: 'Success',
                        message: "API token regenerated successfully!",
                        position: "topRight",
                        timeout: 5000
                    });
                }
            } else {
                 if (typeof iziToast !== 'undefined') {
                    iziToast.error({
                        title: 'Error',
                        message: "Failed to regenerate token.",
                        position: "topRight"
                    });
                }
            }
        } else {
            console.error("Error regenerating token:", data);
            const errorMessage = data.description || data.message || "Failed to regenerate token.";
             if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    title: 'Error',
                    message: errorMessage,
                    position: "topRight"
                });
            }

            if (response.status === 401) {
                localStorage.removeItem("authToken");
                window.location.href = "/";
            }
        }
    } catch (error) {
        console.error("❌ Network error:", error);
         if (typeof iziToast !== 'undefined') {
            iziToast.error({
                title: 'Network Error',
                message: "Network error — please try again later.",
                position: "topRight"
            });
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
 

 
  
