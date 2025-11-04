document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");
  const tableBody = document.getElementById("table-body-inner");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  try {
    const response = await fetch(
      "https://api-stop-reg.onrender.com/api/v1/manage/domain/fetch",
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
      const blockedDomain = userDomain.filter(
        (blocked) => blocked.type === "blocked"
      );
      //  console.log("User  blocked domans:", blockedDomain);

      tableBody.innerHTML = blockedDomain
        .map((user) => {
          return `
    <tr class="table-inner" id="${user._id}">
      <td class="table-inner-inner">${user.domain}</td>
      <td>${user.status}</td>
      <td class="comment-td">${user.comment}</td>
      <td>
        <label class="switch">
          <input type="checkbox" ${user.status === "active" ? "checked" : ""} />
          <span class="slider round"></span>
        </label>
      </td>
    </tr>
  `;
        })
        .join("");
    } else {
      console.error("Error fetching user:", data);

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        window.location.href = "/login.html";
      }
    }
  } catch (error) {
    console.error("Network error:", error);
  }
});
