/**
 * Handles initialization of Paddle payments from the dashboard.
 */
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("authToken");

    // Helper to extract plan ID from buttons
    const handlePlanSelection = async (event) => {
        const button = event.target.closest("[data-plan-id]");
        if (!button) return;

        event.preventDefault();

        const planId = button.getAttribute("data-plan-id");
        if (!planId || planId === "enterprise_plan_id") {
            // Enterprise or invalid plan, let default behavior happen (e.g. redirect to contact)
            return;
        }

        // Show loading state
        const originalContent = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `
            <span class="pricing-btn-loading">
                <span class="pricing-btn-spinner"></span>
                Processing...
            </span>
        `;

        try {
            const response = await fetch("https://api.stopreg.com/api/v1/payment/initialize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ planId }),
            });

            const data = await response.json();

            if (response.ok) {
                const transactionId = data?.data?.transactionId;
                if (transactionId) {
                    // Open Paddle Overlay Checkout
                    Paddle.Checkout.open({
                        settings: {
                            displayMode: "overlay",
                            theme: "light",
                            locale: "en"
                        },
                        transactionId: transactionId,
                        eventCallback: (event) => {
                            if (event.name === "checkout.closed") {
                                button.disabled = false;
                                button.innerHTML = originalContent;
                            }
                        }
                    });
                    
                    // Fallback revert after a few seconds even if callback doesn't fire
                    setTimeout(() => {
                        button.disabled = false;
                        button.innerHTML = originalContent;
                    }, 5000);
                } else {
                    throw new Error("Transaction ID not received from server.");
                }
            } else {
                const errorMsg = data.description || data.message || "Failed to initialize payment.";
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error("Payment initialization error:", error);
            
            // Revert button state immediately on error
            button.disabled = false;
            button.innerHTML = originalContent;

            // Show error toast
            if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    title: 'Error',
                    message: error.message,
                    position: "topRight",
                    timeout: 5000,
                });
            } else {
                alert("Error: " + error.message);
            }
        }
    };

    // Attach listeners to pricing buttons
    // Note: subscription-plan.js might dynamically render some buttons, 
    // so we use event delegation or wait for it.
    document.body.addEventListener("click", (e) => {
        if (e.target.closest("[data-plan-id]")) {
            handlePlanSelection(e);
        }
    });
});
