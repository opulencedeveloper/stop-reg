document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");
  const tableBody = document.getElementById("table-body-inner");
  if (!token) {
    window.location.href = "/";
    return;
  }

  // Spinner is already visible for dashboard pages
  // Increment counter to keep it visible during fetch
  if (typeof window.showSpinner === 'function') {
    window.showSpinner();
  }

  try {
    const response = await fetch(
      "https://api.stopreg.com/api/v1/manage/domain/fetch",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ send token here
        },
      }
    );

    const data = await response.json();
    console.log("User Info Response:", data);

    if (response.ok) {
      const userDomain = data?.data || data;
      //   console.log("User domans:", userDomain);
      const reportDomain = userDomain.filter(
        (blocked) => blocked.type === "reported"
      );

      tableBody.innerHTML = reportDomain
        .map((user) => {
          return `
    <tr class="table-inner" id="${user._id}">
      <td class="table-inner-inner">${user.domain}</td>
      <td>${user.status}</td>
      <td class="comment-td">${user.comment}</td>
      <td>
          <button class="deleteEmail" data-id="${user._id}">
              Delete
          </button>
      </td>
    </tr>
  `;
        })
        .join("");
      document.querySelectorAll(".deleteEmail").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const domainId = btn.getAttribute("data-id");

          // Show spinner inside button
          const originalText = btn.textContent;
          btn.disabled = true;
          btn.innerHTML = `<span class="btn-spinner"></span> Deleting...`;

          try {
            const deleteResponse = await fetch(
              `https://api.stopreg.com/api/v1/manage/domain/delete/?domainId=${domainId}`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const deleteData = await deleteResponse.json();
            console.log("Delete response:", deleteData);

            if (deleteResponse.ok) {
              // Remove row from UI
              document.getElementById(domainId)?.remove();
            } else {
              const errorMessage = deleteData.message || "Failed to delete domain.";
              if (typeof iziToast !== 'undefined') {
                iziToast.error({
                  title: 'Error',
                  message: errorMessage,
                  position: "topRight",
                  timeout: 5000,
                  drag: false,
                  displayMode: 1,
                  zindex: 9999,
                });
              } else {
                alert(errorMessage);
              }
            }
          } catch (error) {
            console.error("Delete error:", error);
          } finally {
            btn.disabled = false;
            btn.textContent = originalText;
          }
        });
      });
    } else {
      console.error("Error fetching user:", data);

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        window.location.href = "/";
      } else {
        const errorMessage = data.description || data.message || "Failed to fetch domains.";
        if (typeof iziToast !== 'undefined') {
          iziToast.error({
            title: 'Error',
            message: errorMessage,
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 9999,
          });
        }
      }
    }
  } catch (error) {
    console.error("Network error:", error);
    if (typeof iziToast !== 'undefined') {
      iziToast.error({
        title: 'Network Error',
        message: "Network error — please try again later.",
        position: "topRight",
        timeout: 5000,
        drag: false,
        displayMode: 1,
        zindex: 9999,
      });
    }
  } finally {
    // Hide spinner after data is loaded
    if (typeof window.hideSpinner === 'function') {
      window.hideSpinner();
    }
  }
});
