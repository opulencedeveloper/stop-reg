 

 
  
document.addEventListener("DOMContentLoaded", async () => {
    const legacyBtn = document.querySelector(".ratoken-btn");
    const generateBtn = document.getElementById("generate-token-btn");
    const generateBtnCount = document.getElementById("generate-token-btn-count");

    if (legacyBtn) legacyBtn.addEventListener("click", () => handleRegenerate(legacyBtn));
    if (generateBtn) generateBtn.addEventListener("click", () => handleRegenerate(generateBtn));
    if (generateBtnCount) generateBtnCount.addEventListener("click", () => handleRegenerate(generateBtnCount));

    // --- RUTHLESS PLAN CHECK ---
    const token = localStorage.getItem("authToken");
    if (token) {
        try {
            const response = await fetch("http://localhost:8080/api/v1/user/info", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                const user = data?.data || data;
                const planName = user.userDetails?.planId?.name;
                if (planName === "Free") {
                    window.isStopRegFreeUser = true;
                }
            }
        } catch (error) {
            console.error("Plan check failed:", error);
        }
    }
});

async function handleRegenerate(btn) {
    if (window.isStopRegFreeUser) {
        if (typeof iziToast !== 'undefined') {
            iziToast.info({
                title: 'Premium Feature',
                message: "The Free plan is limited to one API token. Please upgrade your plan to generate more.",
                position: "topRight"
            });
        }
        return;
    }

    const token = localStorage.getItem("authToken");
    const originalText = btn.innerHTML; // Store HTML to preserve icon if any
    const isNewBtn = btn.id === "generate-token-btn" || btn.id === "generate-token-btn-count";
    let isSuccess = false;
    
    // Loading state
    btn.disabled = true;
    btn.innerHTML = `<div class="stopreg-btn-spinner" style="border-color: rgba(255,255,255,0.2) !important; border-top-color: #FFFFFF !important;"></div> ${isNewBtn ? "Generating..." : "Requesting..."}`;

    if (!token) {
        window.clearUserSession();
        window.location.href = "/sign-in.html";
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:8080/api/v1/api-token/create",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();
    
        if (response.ok) {
            isSuccess = true;
            if (typeof iziToast !== 'undefined') {
                iziToast.success({
                    title: 'Success',
                    message: "API token generated successfully!",
                    position: "topRight",
                    timeout: 2000
                });
            }
            
            // If we are on api-count page, refresh the table instead of redirecting
            // Check if window.fetchApiRequests is available or if we are on the specific page
            if (window.fetchApiRequests && typeof window.fetchApiRequests === 'function') {
                // Wait a small moment to ensure the toast is seen/backend is ready?
                // Usually instant is fine.
                window.fetchApiRequests(1, 10); // Refresh first page
            } else {
                // Otherwise redirect
                 // Redirect after short delay
                setTimeout(() => {
                    window.location.href = "/dashboard/api-count.html";
                }, 1000);
            }

        } else {
            console.error("Error regenerating token:", data, "Status:", response.status);
            const errorMessage = data?.description || data?.message || data?.error || "Failed to generate token.";
            console.error("Error message to display:", errorMessage);

            if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    title: 'Error',
                    message: errorMessage,
                    position: "topRight",
                    timeout: 5000
                });
            }

            if (response.status === 401) {
                window.handleAuthError(401);
            }
        }
    } catch (error) {
        console.error("❌ Error:", error);
        const errorMessage = error?.message || "An error occurred";

        let title = 'Error';
        let displayMessage = errorMessage;

        // Detect network errors
        if (errorMessage === 'Failed to fetch' || errorMessage.includes('NetworkError')) {
            title = 'Network Error';
            displayMessage = 'Please check your internet connection and try again.';
        }

        if (typeof iziToast !== 'undefined') {
            iziToast.error({
                title: title,
                message: displayMessage,
                position: "topRight",
                timeout: 5000
            });
        } else {
            console.error("iziToast not available, showing alert");
            alert(displayMessage);
        }
    } finally {
        // Reset if:
        // 1. Error (success is false)
        // 2. Success AND we are refreshing in place (not redirecting)
        // If success and redirecting, keep spinner so user sees transition
        
        const isRedirecting = isSuccess && (!window.fetchApiRequests || typeof window.fetchApiRequests !== 'function');

        if (!isRedirecting) {
             btn.disabled = false;
             btn.innerHTML = originalText;
        }
    }
}
 

 
  
