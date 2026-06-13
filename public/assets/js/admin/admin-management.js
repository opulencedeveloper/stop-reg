document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "https://api.stopreg.com/api/v1/admin";
  const TOKEN_KEY = "adminToken";

  // --- ELEMENT SELECTORS ---
  const getEl = (id) => document.getElementById(id);

  // Admin check
  const adminManagementContent = getEl("admin-management-content");
  const insufficientPermissionsView = getEl("insufficient-permissions-view");

  // Validate critical elements exist
  if (!adminManagementContent || !insufficientPermissionsView) {
    console.error("Critical elements not found on page");
    return;
  }

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
    invitationFeedback.classList.add(type);
    invitationFeedback.textContent = message;
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
        adminManagementContent.style.display = "block";
        insufficientPermissionsView.style.display = "none";
        loadAdminInvitations();
      } else {
        adminManagementContent.style.display = "none";
        insufficientPermissionsView.style.display = "block";
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

  // --- ADMIN INVITATIONS ---

  let invitationsPage = 1;
  const invitationsPageSize = 20;

  const loadAdminInvitations = async () => {
    try {
      getEl("invitations-spinner").style.display = "flex";
      getEl("invitations-table-wrapper").style.display = "none";
      getEl("invitations-pagination").style.display = "none";
      getEl("invitations-empty").style.display = "none";

      const token = getToken();
      const offset = (invitationsPage - 1) * invitationsPageSize;

      const response = await fetch(
        `${API_BASE_URL}/invitations?limit=${invitationsPageSize}&offset=${offset}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch invitations");
      }

      const data = await response.json();
      const invitations = data.data.invitations || [];
      const pagination = data.data.pagination || {};

      if (invitations.length === 0) {
        getEl("invitations-empty").style.display = "block";
        getEl("invitations-spinner").style.display = "none";
        return;
      }

      renderAdminInvitations(invitations);
      renderAdminInvitationsPagination(pagination);

      getEl("invitations-table-wrapper").style.display = "block";
      if (pagination.pages > 1) {
        getEl("invitations-pagination").style.display = "flex";
      }
    } catch (error) {
      console.error("Load invitations error:", error);
      showToast("Failed to load invitations", "error");
      getEl("invitations-empty").style.display = "block";
    } finally {
      getEl("invitations-spinner").style.display = "none";
    }
  };

  const renderAdminInvitations = (invitations) => {
    const tbody = getEl("invitations-tbody");
    tbody.innerHTML = "";

    invitations.forEach((inv) => {
      const row = document.createElement("tr");
      const invitedByName = inv.invitedBy
        ? `${inv.invitedBy.name}`
        : "System";
      const expiresAt = new Date(inv.tokenExpiresAt).toLocaleString();
      const statusBadge = getStatusBadge(inv.status);

      row.innerHTML = `
        <td>${inv.email}</td>
        <td>${formatRoleName(inv.role)}</td>
        <td>${statusBadge}</td>
        <td>${invitedByName}</td>
        <td>${expiresAt}</td>
        <td>${getRevokeButton(inv)}</td>
      `;

      tbody.appendChild(row);
    });
  };

  const getStatusBadge = (status) => {
    let displayText = status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="invitation-status-badge status-${status}">${displayText}</span>`;
  };

  const getRevokeButton = (inv) => {
    if (inv.status === "pending") {
      return `<button class="btn-revoke" onclick="revokeInvitation('${inv._id}')">Revoke</button>`;
    }
    return "-";
  };

  const renderAdminInvitationsPagination = (pagination) => {
    const container = getEl("invitations-pagination");
    container.innerHTML = "";

    if (pagination.pages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn";
    prevBtn.disabled = invitationsPage === 1;
    prevBtn.textContent = "← Previous";
    prevBtn.onclick = () => {
      if (invitationsPage > 1) {
        invitationsPage--;
        loadAdminInvitations();
      }
    };
    container.appendChild(prevBtn);

    const pageInfo = document.createElement("span");
    pageInfo.className = "pagination-info";
    pageInfo.textContent = `Page ${invitationsPage} of ${pagination.pages}`;
    container.appendChild(pageInfo);

    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn";
    nextBtn.disabled = invitationsPage >= pagination.pages;
    nextBtn.textContent = "Next →";
    nextBtn.onclick = () => {
      if (invitationsPage < pagination.pages) {
        invitationsPage++;
        loadAdminInvitations();
      }
    };
    container.appendChild(nextBtn);
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

      auditLogsTableWrapper.style.display = "block";
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
        <td>${createdAt}</td>
        <td>${adminName}</td>
        <td><span class="audit-action-badge ${log.action.replace(/_/g, '-')}">${actionLabel}</span></td>
        <td>${resourceLabel}</td>
        <td>${detailsLabel}</td>
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

  // --- TAB SWITCHING ---

  const handleTabSwitch = () => {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.getAttribute("data-tab");

        // Remove active class from all buttons and contents
        tabButtons.forEach((b) => b.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));

        // Add active class to clicked button and corresponding content
        btn.classList.add("active");
        const activeContent = document.getElementById(`${tabName}-content`);
        if (activeContent) {
          activeContent.classList.add("active");

          // Load data for audit logs tab if switching to it
          if (tabName === "audit-logs") {
            loadAuditLogs();
          }
        }
      });
    });
  };

  // --- EVENT LISTENERS ---

  if (sendInvitationForm) {
    sendInvitationForm.addEventListener("submit", sendInvitation);
  }

  // --- INIT ---

  handleTabSwitch();
  checkAdminPermissions();
});
