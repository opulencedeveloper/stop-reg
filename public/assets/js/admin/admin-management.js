document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "https://api.stopreg.com/api/v1/admin";
  const TOKEN_KEY = "adminToken";

  // --- ELEMENT SELECTORS ---
  const getEl = (id) => document.getElementById(id);

  // Admin check
  const invitationSection = getEl("invitation-section");
  const insufficientPermissions = getEl("insufficient-permissions");

  // Invitation form
  const sendInvitationForm = getEl("send-invitation-form");
  const inviteeEmail = getEl("invitee-email");
  const adminRole = getEl("admin-role");
  const invitationFeedback = getEl("invitation-feedback");

  // Audit logs
  const auditLogsSpinner = getEl("audit-logs-spinner");
  const auditLogsTableWrapper = getEl("audit-logs-table-wrapper");
  const auditLogsTbody = getEl("audit-logs-tbody");
  const auditLogsPagination = getEl("audit-logs-pagination");
  const auditLogsEmpty = getEl("audit-logs-empty");

  // --- STATE ---
  let currentAdminIsSuperAdmin = false;
  let auditLogsPage = 1;
  const auditLogsPageSize = 20;

  // --- UTILITIES ---

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  const showToast = (message, type = "success") => {
    iziToast[type]({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message: message,
      position: "topRight",
      timeout: 4000,
    });
  };

  const clearFeedback = () => {
    invitationFeedback.innerHTML = "";
    invitationFeedback.className = "invitation-feedback";
  };

  const showFeedback = (message, type = "success") => {
    clearFeedback();
    invitationFeedback.classList.add(`feedback-${type}`);
    invitationFeedback.innerHTML = `
      <div class="feedback-content">
        <svg class="feedback-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${
            type === "success"
              ? '<path d="M10 15.586L6.707 12.293L5.293 13.707L10 18.414L18.707 9.707L17.293 8.293L10 15.586Z" fill="currentColor"/>'
              : '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>'
          }
        </svg>
        <span>${message}</span>
      </div>
    `;
  };

  // --- PERMISSION CHECK ---

  const checkAdminPermissions = async () => {
    try {
      const token = getToken();
      if (!token) {
        window.location.href = "/admin-login/index.html";
        return;
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/admin-login/index.html";
          return;
        }
        throw new Error("Failed to fetch admin profile");
      }

      const data = await response.json();
      const admin = data.data;

      currentAdminIsSuperAdmin = admin.isSuperAdmin;

      if (currentAdminIsSuperAdmin) {
        invitationSection.style.display = "block";
        insufficientPermissions.style.display = "none";
        loadAuditLogs();
      } else {
        invitationSection.style.display = "none";
        insufficientPermissions.style.display = "block";
        auditLogsTableWrapper.style.display = "none";
      }
    } catch (error) {
      console.error("Permission check error:", error);
      showToast("Failed to load admin permissions", "error");
    }
  };

  // --- SEND INVITATION ---

  const sendInvitation = async (event) => {
    event.preventDefault();

    const email = inviteeEmail.value.trim();
    const role = adminRole.value;

    if (!email || !role) {
      showFeedback("Please fill in all fields", "error");
      return;
    }

    try {
      clearFeedback();
      const submitBtn = sendInvitationForm.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Sending...</span>`;

      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/invitations/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.description || "Failed to send invitation");
      }

      showFeedback(`Invitation sent to ${email}!`, "success");
      sendInvitationForm.reset();
      showToast(`Invitation sent to ${email}`, "success");

      // Reload audit logs
      auditLogsPage = 1;
      loadAuditLogs();
    } catch (error) {
      console.error("Send invitation error:", error);
      showFeedback(error.message || "Failed to send invitation", "error");
      showToast(error.message || "Failed to send invitation", "error");
    } finally {
      const submitBtn = sendInvitationForm.querySelector("button[type='submit']");
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Send Invitation</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1V15M8 1L1 8M8 1L15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
    }
  };

  // --- AUDIT LOGS ---

  const loadAuditLogs = async () => {
    try {
      auditLogsSpinner.style.display = "flex";
      auditLogsTableWrapper.style.display = "none";
      auditLogsPagination.style.display = "none";
      auditLogsEmpty.style.display = "none";

      const token = getToken();
      const offset = (auditLogsPage - 1) * auditLogsPageSize;

      const response = await fetch(
        `${API_BASE_URL}/audit-logs?limit=${auditLogsPageSize}&offset=${offset}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = response.json();
      const logs = (await data).data.logs || [];
      const pagination = (await data).data.pagination || {};

      if (logs.length === 0) {
        auditLogsEmpty.style.display = "block";
        auditLogsSpinner.style.display = "none";
        return;
      }

      renderAuditLogs(logs);
      renderAuditLogsPagination(pagination);

      auditLogsTableWrapper.style.display = "table";
      if (pagination.pages > 1) {
        auditLogsPagination.style.display = "flex";
      }
    } catch (error) {
      console.error("Load audit logs error:", error);
      showToast("Failed to load audit logs", "error");
      auditLogsEmpty.style.display = "block";
    } finally {
      auditLogsSpinner.style.display = "none";
    }
  };

  const renderAuditLogs = (logs) => {
    auditLogsTbody.innerHTML = "";

    logs.forEach((log) => {
      const row = document.createElement("tr");
      const createdAt = new Date(log.createdAt).toLocaleString();
      const adminName = log.adminId
        ? `${log.adminId.firstName} ${log.adminId.lastName}`
        : "System";
      const actionLabel = formatActionLabel(log.action);
      const resourceLabel = log.resourceType || "-";
      const detailsLabel = formatDetailsLabel(log);

      row.innerHTML = `
        <td class="audit-cell-datetime">${createdAt}</td>
        <td class="audit-cell-admin">${adminName}</td>
        <td class="audit-cell-action"><span class="action-badge action-${log.action}">${actionLabel}</span></td>
        <td class="audit-cell-resource">${resourceLabel}</td>
        <td class="audit-cell-details">${detailsLabel}</td>
      `;

      auditLogsTbody.appendChild(row);
    });
  };

  const renderAuditLogsPagination = (pagination) => {
    auditLogsPagination.innerHTML = "";

    if (pagination.pages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn";
    prevBtn.disabled = auditLogsPage === 1;
    prevBtn.textContent = "← Previous";
    prevBtn.onclick = () => {
      if (auditLogsPage > 1) {
        auditLogsPage--;
        loadAuditLogs();
      }
    };
    auditLogsPagination.appendChild(prevBtn);

    const pageInfo = document.createElement("span");
    pageInfo.className = "pagination-info";
    pageInfo.textContent = `Page ${auditLogsPage} of ${pagination.pages}`;
    auditLogsPagination.appendChild(pageInfo);

    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn";
    nextBtn.disabled = auditLogsPage >= pagination.pages;
    nextBtn.textContent = "Next →";
    nextBtn.onclick = () => {
      if (auditLogsPage < pagination.pages) {
        auditLogsPage++;
        loadAuditLogs();
      }
    };
    auditLogsPagination.appendChild(nextBtn);
  };

  const formatActionLabel = (action) => {
    const labels = {
      invite_sent: "Invitation Sent",
      invite_accepted: "Invitation Accepted",
      invite_expired: "Invitation Expired",
      invite_revoked: "Invitation Revoked",
      role_changed: "Role Changed",
      record_deleted: "Record Deleted",
      password_changed: "Password Changed",
      admin_created: "Admin Created",
      admin_deleted: "Admin Deleted",
    };
    return labels[action] || action;
  };

  const formatDetailsLabel = (log) => {
    if (!log.details) return "-";

    if (log.action === "invite_sent") {
      return `${log.details.inviteeEmail} (${log.details.role})`;
    }
    if (log.action === "admin_created") {
      return `${log.details.newAdminEmail} (${log.details.role})`;
    }
    if (log.action === "record_deleted") {
      return log.details.resourceName || "-";
    }

    return "-";
  };

  // --- EVENT LISTENERS ---

  sendInvitationForm.addEventListener("submit", sendInvitation);

  // --- INIT ---

  checkAdminPermissions();
});
