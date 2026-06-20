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
  let adminsPage = 1;
  const adminsPageSize = 20;

  // --- UTILITIES ---

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  const showToast = (message, type = "success") => {
    if (typeof iziToast !== "undefined") {
      iziToast[type]({
        title: type.charAt(0).toUpperCase() + type.slice(1),
        message: message,
        position: "topRight",
        timeout: 4000,
      });
    }
  };

  const formatRoleName = (role) => {
    if (role === "super_admin") return "Super Admin";
    if (role === "admin") return "Admin";
    return role;
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

      currentAdminIsSuperAdmin = admin.role === "super_admin";

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
      const createdAt = new Date(inv.createdAt).toLocaleString();
      const acceptedAt = inv.acceptedAt ? new Date(inv.acceptedAt).toLocaleString() : "-";
      const acceptedByName = inv.acceptedByAdminId ? `${inv.acceptedByAdminId.name}` : "-";
      const revokedAt = inv.revokedAt ? new Date(inv.revokedAt).toLocaleString() : "-";
      const revokedByName = inv.revokedByAdminId ? `${inv.revokedByAdminId.name}` : "-";
      const statusBadge = getStatusBadge(inv.status);

      row.innerHTML = `
        <td>${inv.email}</td>
        <td>${formatRoleName(inv.role)}</td>
        <td>${statusBadge}</td>
        <td>${invitedByName}</td>
        <td>${expiresAt}</td>
        <td>${createdAt}</td>
        <td>${acceptedAt}</td>
        <td>${acceptedByName}</td>
        <td>${revokedAt}</td>
        <td>${revokedByName}</td>
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
      const resolvedData = await data;
      const logs = resolvedData.data.logs || [];
      const pagination = resolvedData.data.pagination || {};

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
      const resourceTypeLabel = log.resourceType || "-";
      const detailsLabel = formatDetailsLabel(log);
      const ipAddressLabel = log.ipAddress || "-";
      const userAgentLabel = log.userAgent ? log.userAgent.substring(0, 50) + "..." : "-";

      row.innerHTML = `
        <td class="td-nowrap">${createdAt}</td>
        <td>${adminName}</td>
        <td class="td-nowrap"><span class="audit-action-badge ${log.action.replace(/_/g, '-')}">${actionLabel}</span></td>
        <td class="td-nowrap">${resourceTypeLabel}</td>
        <td>${detailsLabel}</td>
        <td class="td-nowrap" style="font-family: monospace; font-size: 12px; color: #6B7280;">${ipAddressLabel}</td>
        <td class="td-nowrap" style="font-size: 12px; color: #6B7280; max-width: 300px; overflow: hidden; text-overflow: ellipsis;" title="${log.userAgent || ''}">${userAgentLabel}</td>
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
      admin_suspended: "Admin Suspended",
      admin_unsuspended: "Admin Unsuspended",
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

  // --- ADMINS MANAGEMENT ---

  const loadAdminsList = async () => {
    try {
      getEl("admins-spinner").style.display = "flex";
      getEl("admins-table-wrapper").style.display = "none";
      getEl("admins-pagination").style.display = "none";
      getEl("admins-empty").style.display = "none";

      const token = getToken();
      const offset = (adminsPage - 1) * adminsPageSize;

      const response = await fetch(
        `${API_BASE_URL}/list?limit=${adminsPageSize}&offset=${offset}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch admins");
      }

      const data = await response.json();
      const admins = data.data.admins || [];
      const pagination = data.data.pagination || {};

      if (admins.length === 0) {
        getEl("admins-empty").style.display = "block";
        getEl("admins-spinner").style.display = "none";
        return;
      }

      renderAdminsList(admins);
      renderAdminsPagination(pagination);

      getEl("admins-table-wrapper").style.display = "block";
      if (pagination.pages > 1) {
        getEl("admins-pagination").style.display = "flex";
      }
    } catch (error) {
      console.error("Load admins error:", error);
      showToast("Failed to load admins", "error");
      getEl("admins-empty").style.display = "block";
    } finally {
      getEl("admins-spinner").style.display = "none";
    }
  };

  const renderAdminsList = (admins) => {
    const tbody = getEl("admins-tbody");
    tbody.innerHTML = "";

    admins.forEach((admin) => {
      const row = document.createElement("tr");
      const createdAt = new Date(admin.createdAt).toLocaleString();
      const statusBadge = admin.isSuspended
        ? '<span class="status-badge status-suspended">Suspended</span>'
        : '<span class="status-badge status-active">Active</span>';

      row.innerHTML = `
        <td>${admin.email}</td>
        <td>${formatRoleName(admin.role)}</td>
        <td>${statusBadge}</td>
        <td>${createdAt}</td>
        <td>${getAdminActionButtons(admin)}</td>
      `;

      tbody.appendChild(row);
    });
  };

  const getAdminActionButtons = (admin) => {
    const suspendBtn = `<button class="btn-action btn-suspend" onclick="suspendAdmin('${admin._id}', ${admin.isSuspended})">
      ${admin.isSuspended ? "Unsuspend" : "Suspend"}
    </button>`;
    const deleteBtn = `<button class="btn-action btn-delete" onclick="deleteAdmin('${admin._id}')">Delete</button>`;
    return `<div class="action-buttons">${suspendBtn} ${deleteBtn}</div>`;
  };

  const renderAdminsPagination = (pagination) => {
    const container = getEl("admins-pagination");
    container.innerHTML = "";

    if (pagination.pages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn";
    prevBtn.disabled = adminsPage === 1;
    prevBtn.textContent = "← Previous";
    prevBtn.onclick = () => {
      if (adminsPage > 1) {
        adminsPage--;
        loadAdminsList();
      }
    };
    container.appendChild(prevBtn);

    const pageInfo = document.createElement("span");
    pageInfo.className = "pagination-info";
    pageInfo.textContent = `Page ${adminsPage} of ${pagination.pages}`;
    container.appendChild(pageInfo);

    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn";
    nextBtn.disabled = adminsPage >= pagination.pages;
    nextBtn.textContent = "Next →";
    nextBtn.onclick = () => {
      if (adminsPage < pagination.pages) {
        adminsPage++;
        loadAdminsList();
      }
    };
    container.appendChild(nextBtn);
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

          // Load data for specific tabs
          if (tabName === "audit-logs") {
            loadAuditLogs();
          } else if (tabName === "admins") {
            loadAdminsList();
          }
        }
      });
    });
  };

  // --- MODAL STATE ---
  let pendingAdminAction = null;

  // --- MODAL SETUP ---
  const setupConfirmationModals = () => {
    // Suspend modal
    const suspendModal = getEl("suspend-admin-modal-overlay");
    const closeSuspendBtn = getEl("close-suspend-modal");
    const cancelSuspendBtn = getEl("cancel-suspend-btn");
    const confirmSuspendBtn = getEl("confirm-suspend-btn");

    if (closeSuspendBtn) closeSuspendBtn.onclick = () => closeSuspendModal();
    if (cancelSuspendBtn) cancelSuspendBtn.onclick = () => closeSuspendModal();
    if (confirmSuspendBtn) {
      confirmSuspendBtn.onclick = async () => {
        if (pendingAdminAction) {
          confirmSuspendBtn.disabled = true;
          confirmSuspendBtn.textContent = "Suspending...";
          await executeSuspendAdmin(pendingAdminAction.adminId, pendingAdminAction.isSuspended);
          confirmSuspendBtn.disabled = false;
          confirmSuspendBtn.textContent = "Yes, Suspend";
          closeSuspendModal();
        }
      };
    }

    // Delete modal
    const deleteModal = getEl("delete-admin-modal-overlay");
    const closeDeleteBtn = getEl("close-delete-modal");
    const cancelDeleteBtn = getEl("cancel-delete-btn");
    const confirmDeleteBtn = getEl("confirm-delete-btn");

    if (closeDeleteBtn) closeDeleteBtn.onclick = () => closeDeleteModal();
    if (cancelDeleteBtn) cancelDeleteBtn.onclick = () => closeDeleteModal();
    if (confirmDeleteBtn) {
      confirmDeleteBtn.onclick = async () => {
        if (pendingAdminAction) {
          confirmDeleteBtn.disabled = true;
          confirmDeleteBtn.textContent = "Deleting...";
          await executeDeleteAdmin(pendingAdminAction.adminId);
          confirmDeleteBtn.disabled = false;
          confirmDeleteBtn.textContent = "Yes, Delete";
          closeDeleteModal();
        }
      };
    }

    // Close modals on overlay click
    if (suspendModal) {
      suspendModal.addEventListener("click", (e) => {
        if (e.target === suspendModal) closeSuspendModal();
      });
    }
    if (deleteModal) {
      deleteModal.addEventListener("click", (e) => {
        if (e.target === deleteModal) closeDeleteModal();
      });
    }
  };

  const openSuspendModal = (adminEmail, adminId, isSuspended) => {
    pendingAdminAction = { adminId, isSuspended };
    getEl("suspend-target-name").textContent = adminEmail;
    const modal = getEl("suspend-admin-modal-overlay");
    modal.classList.add("is-active");
  };

  const closeSuspendModal = () => {
    const modal = getEl("suspend-admin-modal-overlay");
    modal.classList.add("is-exiting");
    setTimeout(() => {
      modal.classList.remove("is-active", "is-exiting");
      pendingAdminAction = null;
    }, 300);
  };

  const openDeleteModal = (adminEmail, adminId) => {
    pendingAdminAction = { adminId };
    getEl("delete-target-name").textContent = adminEmail;
    const modal = getEl("delete-admin-modal-overlay");
    modal.classList.add("is-active");
  };

  const closeDeleteModal = () => {
    const modal = getEl("delete-admin-modal-overlay");
    modal.classList.add("is-exiting");
    setTimeout(() => {
      modal.classList.remove("is-active", "is-exiting");
      pendingAdminAction = null;
    }, 300);
  };

  const executeSuspendAdmin = async (adminId, isSuspended) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/admins/${adminId}/suspend`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.description || "Failed to suspend admin");
      }

      showToast(`Admin ${data.data.isSuspended ? "suspended" : "unsuspended"} successfully`, "success");
      adminsPage = 1;
      loadAdminsList();
    } catch (error) {
      console.error("Suspend admin error:", error);
      showToast(error.message || "Failed to suspend admin", "error");
    }
  };

  const executeDeleteAdmin = async (adminId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/admins/${adminId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.description || "Failed to delete admin");
      }

      showToast("Admin deleted successfully", "success");
      adminsPage = 1;
      loadAdminsList();
    } catch (error) {
      console.error("Delete admin error:", error);
      showToast(error.message || "Failed to delete admin", "error");
    }
  };

  // --- GLOBAL FUNCTIONS FOR ADMIN ACTIONS ---

  window.suspendAdmin = (adminId, isSuspended) => {
    // Get admin email from the table
    const row = document.querySelector(`button[onclick*="${adminId}"]`).closest('tr');
    const adminEmail = row.querySelector('td:first-child').textContent;
    openSuspendModal(adminEmail, adminId, isSuspended);
  };

  window.deleteAdmin = (adminId) => {
    // Get admin email from the table
    const row = document.querySelector(`button[onclick*="${adminId}"]`).closest('tr');
    const adminEmail = row.querySelector('td:first-child').textContent;
    openDeleteModal(adminEmail, adminId);
  };

  // --- EVENT LISTENERS ---

  if (sendInvitationForm) {
    sendInvitationForm.addEventListener("submit", sendInvitation);
  }

  // --- INIT ---

  handleTabSwitch();
  setupConfirmationModals();
  checkAdminPermissions();
});
