document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("authToken"); // Needed for Authorization header
    const tableBody = document.getElementById("table-body-inner");

    // Spinner management
    if (typeof window.showSpinner === "function") {
        window.showSpinner();
    }

    const fetchBlockedDomains = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/v1/manage/domain/fetch?status=blocked", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

                    if (await window.handleAuthError(response)) return;

            const data = await response.json();
            if (response.ok) {
                const blockedDomains = Array.isArray(data?.data) ? data.data : [];

                if (tableBody) {
                    if (blockedDomains.length === 0) {
                        tableBody.innerHTML = "<tr><td colspan='4' style='text-align:center;padding:20px;'>No blocked domains</td></tr>";
                    } else {
                        tableBody.innerHTML = blockedDomains.map(user => `
                            <tr class="table-inner" id="${user._id}">
                                <td class="table-inner-inner">${user.domain}</td>
                                <td>${user.status}</td>
                                <td class="comment-td">${user.comment || ""}</td>
                                <td>
                                    <button class="deleteEmail" data-id="${user._id}">Delete</button>
                                </td>
                            </tr>
                        `).join("");

                        attachDeleteHandlers();
                    }
                }
            } else {
                throw new Error(data?.description || data?.message || "Failed to fetch domains.");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            if (typeof iziToast !== "undefined") {
                iziToast.error({ title: "Error", message: error.message, position: "topRight" });
            }
        } finally {
            if (typeof window.hideSpinner === "function") {
                window.hideSpinner();
            }
        }
    };

    const attachDeleteHandlers = () => {
        document.querySelectorAll(".deleteEmail").forEach(btn => {
            btn.addEventListener("click", async () => {
                const domainId = btn.getAttribute("data-id");
                const originalText = btn.textContent;
                btn.disabled = true;
                btn.innerHTML = `<span class="btn-spinner"></span> Deleting...`;

                try {
                    const response = await fetch(`http://localhost:8080/api/v1/manage/domain/delete/?domainId=${domainId}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (window.handleAuthError(response)) return;

                    const data = await response.json();
                    if (response.ok) {
                        document.getElementById(domainId)?.remove();
                    } else {
                        throw new Error(data.message || "Failed to delete domain.");
                    }
                } catch (error) {
                    console.error("Delete error:", error);
                    if (typeof iziToast !== "undefined") {
                        iziToast.error({ title: "Error", message: error.message, position: "topRight" });
                    }
                } finally {
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            });
        });
    };

    // Initial load
    fetchBlockedDomains();
});
