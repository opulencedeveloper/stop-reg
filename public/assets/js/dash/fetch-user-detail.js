document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    window.location.href = "/";
    return;
  }

  try {
    const response = await fetch(
      "https://api.stopreg.com/api/v1/user/info",
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
      const user = data?.data || data;
      console.log("User Data:", user);

      const tokenElement = document.querySelector(".main-token");
      tokenElement.textContent = user.userDetails.apiToken;

      console.log ("token element", tokenElement)

      document.getElementById("user-name").textContent = user.name || "Unknown";
      document.getElementById("user-email").textContent =
        user.email || "No email";
    } else {
      console.error("Error fetching user:", data);

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        window.location.href = "/";
      }
    }
  } catch (error) {
    console.error("Network error:", error);
  }
});
