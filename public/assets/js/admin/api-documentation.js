/**
 * StopReg API Documentation
 * Displays all available API endpoints with request/response examples
 * COMPLETE AND COMPREHENSIVE - All 95+ endpoints documented
 */

const APIDocumentation = {
  baseUrl: "http://localhost:8080/api/v1",
  adminPath: "/admin",

  endpoints: {
    authentication: [
      {
        method: "POST",
        path: "/auth/register",
        description: "Register a new user account",
        requiresAuth: false,
        requestBody: {
          email: { type: "string", required: true, description: "User email" },
          password: { type: "string", required: true, description: "User password" },
          fullname: { type: "string", required: true, description: "Full name" }
        },
        response: { status: 201, example: { message: "User registered successfully" } }
      },
      {
        method: "POST",
        path: "/auth/login",
        description: "User login",
        requiresAuth: false,
        requestBody: {
          email: { type: "string", required: true },
          password: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "success", data: { token: "..." } } }
      },
      {
        method: "POST",
        path: "/auth/verify/email",
        description: "Verify email with OTP",
        requiresAuth: false,
        requestBody: {
          email: { type: "string", required: true },
          otp: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "Email verified" } }
      },
      {
        method: "POST",
        path: "/auth/resend/email",
        description: "Resend email verification OTP",
        requiresAuth: false,
        requestBody: { email: { type: "string", required: true } },
        response: { status: 200, example: { message: "OTP sent" } }
      },
      {
        method: "POST",
        path: "/auth/forgot-password",
        description: "Request password reset OTP",
        requiresAuth: false,
        requestBody: { email: { type: "string", required: true } },
        response: { status: 200, example: { message: "OTP sent to email" } }
      },
      {
        method: "POST",
        path: "/auth/verify-reset-otp",
        description: "Verify password reset OTP",
        requiresAuth: false,
        requestBody: {
          email: { type: "string", required: true },
          otp: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "OTP verified" } }
      },
      {
        method: "POST",
        path: "/auth/reset-password",
        description: "Reset user password",
        requiresAuth: false,
        requestBody: {
          email: { type: "string", required: true },
          token: { type: "string", required: true },
          newPassword: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "Password reset successfully" } }
      }
    ],

    apiTokenManagement: [
      {
        method: "POST",
        path: "/api-token/create",
        description: "Create a new API token",
        requiresAuth: true,
        requestBody: {},
        response: { status: 201, example: { message: "success", data: { token: "..." } } }
      },
      {
        method: "GET",
        path: "/api-token/fetch",
        description: "Fetch all API tokens for user",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { tokens: [] } } }
      },
      {
        method: "GET",
        path: "/api-token/fetch/default",
        description: "Fetch default API token",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { token: {} } } }
      },
      {
        method: "DELETE",
        path: "/api-token/delete",
        description: "Delete an API token",
        requiresAuth: true,
        queryParams: { tokenId: { type: "string", required: true } },
        response: { status: 200, example: { message: "Token deleted" } }
      }
    ],

    emailDomainVerification: [
      {
        method: "POST",
        path: "/email-domains/add",
        description: "Add email domain (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          domain: { type: "string", required: true }
        },
        response: { status: 201, example: { message: "success" } }
      },
      {
        method: "POST",
        path: "/email-domains/check-disposable-email-domain",
        description: "Check if domain is disposable email",
        requiresAuth: true,
        requestBody: { domain: { type: "string", required: true } },
        response: { status: 200, example: { message: "success", data: { isDisposable: false } } }
      },
      {
        method: "POST",
        path: "/email-domains/bulk-verification",
        description: "Bulk verify email domains",
        requiresAuth: true,
        requestBody: { emails: { type: "array", required: true } },
        response: { status: 200, example: { message: "success", data: { results: [] } } }
      },
      {
        method: "POST",
        path: "/email-domains/bulk-verification-csv",
        description: "Bulk verify from CSV file",
        requiresAuth: true,
        requestBody: { file: { type: "file", required: true } },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "POST",
        path: "/email-domains/check-subdomain",
        description: "Check if domain is a subdomain (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          domain: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "POST",
        path: "/email-domains/check-public-email-provider",
        description: "Check if domain is public email provider (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          domain: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "POST",
        path: "/email-domains/check-disposable-email-provider",
        description: "Check if domain is disposable email provider (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          domain: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "POST",
        path: "/email-domains/reset-domain-age",
        description: "Reset domain age (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          domain: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "POST",
        path: "/email-domains/get-undefined-age",
        description: "Get domains with undefined age (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "success", data: { domains: [] } } }
      },
      {
        method: "POST",
        path: "/email-domains/update-domain-age",
        description: "Update domain age (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          domain: { type: "string", required: true },
          age: { type: "date", required: true }
        },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "POST",
        path: "/email-domains/add-subdomain",
        description: "Add subdomain (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          domain_provider: { type: "string", required: true },
          domain: { type: "string", required: true }
        },
        response: { status: 201, example: { message: "success" } }
      }
    ],

    userProfileManagement: [
      {
        method: "GET",
        path: "/user/info",
        description: "Get user profile information",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { user: {} } } }
      },
      {
        method: "GET",
        path: "/user/info/requests",
        description: "Get user's verification requests history",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { requests: [] } } }
      },
      {
        method: "PATCH",
        path: "/user/update/password",
        description: "Update user password",
        requiresAuth: true,
        requestBody: {
          currentPassword: { type: "string", required: true },
          newPassword: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "Password updated" } }
      },
      {
        method: "PATCH",
        path: "/user/update/fullname",
        description: "Update user full name",
        requiresAuth: true,
        requestBody: { fullname: { type: "string", required: true } },
        response: { status: 200, example: { message: "Name updated" } }
      }
    ],

    manageDomains: [
      {
        method: "POST",
        path: "/manage-domains/add",
        description: "Add domain to user's allow/block list",
        requiresAuth: true,
        requestBody: {
          domain: { type: "string", required: true },
          status: { type: "string", required: true, description: "allowed, blocked, or reported" }
        },
        response: { status: 201, example: { message: "success", data: {} } }
      },
      {
        method: "GET",
        path: "/manage-domains/fetch",
        description: "Fetch user's managed domains",
        requiresAuth: true,
        queryParams: {
          page: { type: "number", required: false },
          limit: { type: "number", required: false },
          status: { type: "string", required: false }
        },
        response: { status: 200, example: { message: "success", data: { domains: [] } } }
      },
      {
        method: "PATCH",
        path: "/manage-domains/update",
        description: "Update managed domain",
        requiresAuth: true,
        requestBody: {
          domainId: { type: "string", required: true },
          status: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "DELETE",
        path: "/manage-domains/delete",
        description: "Delete managed domain",
        requiresAuth: true,
        queryParams: { domainId: { type: "string", required: true } },
        response: { status: 200, example: { message: "Domain deleted" } }
      },
      {
        method: "GET",
        path: "/manage-domains/settings",
        description: "Get domain management abuse settings",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { settings: {} } } }
      },
      {
        method: "POST",
        path: "/manage-domains/settings",
        description: "Update domain management abuse settings",
        requiresAuth: true,
        requestBody: { unblockAfterDays: { type: "number", required: true } },
        response: { status: 200, example: { message: "Settings updated" } }
      }
    ],

    verificationAPI: [
      {
        method: "GET",
        path: "/verify/email/:email",
        description: "Verify email (API Token Required)",
        requiresAuth: false,
        requiresApiToken: true,
        pathParams: { email: { type: "string", required: true } },
        response: { status: 200, example: { message: "success", data: { email: {}, score: 0 } } }
      },
      {
        method: "GET",
        path: "/verify/domain/:domain",
        description: "Verify domain (API Token Required)",
        requiresAuth: false,
        requiresApiToken: true,
        pathParams: { domain: { type: "string", required: true } },
        response: { status: 200, example: { message: "success", data: { domain: {}, score: 0 } } }
      }
    ],

    publicAPI: [
      {
        method: "POST",
        path: "/my-api-token/public",
        description: "Public disposable email check API",
        requiresAuth: false,
        requestBody: { email: { type: "string", required: true } },
        response: { status: 200, example: { message: "success", data: { isDisposable: false } } }
      },
      {
        method: "GET",
        path: "/my-api-token/:token",
        description: "Check email with public API token",
        requiresAuth: false,
        pathParams: { token: { type: "string", required: true } },
        queryParams: { email: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    requestManagement: [
      {
        method: "PATCH",
        path: "/request/status/update",
        description: "Update verification request status",
        requiresAuth: true,
        requestBody: {
          requestId: { type: "string", required: true },
          status: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "Status updated" } }
      },
      {
        method: "DELETE",
        path: "/request/delete",
        description: "Delete verification request",
        requiresAuth: true,
        queryParams: { requestId: { type: "string", required: true } },
        response: { status: 200, example: { message: "Request deleted" } }
      }
    ],

    seatManagement: [
      {
        method: "POST",
        path: "/seat/invite",
        description: "Invite user to team seat",
        requiresAuth: true,
        requestBody: {
          email: { type: "string", required: true },
          role: { type: "string", required: true }
        },
        response: { status: 201, example: { message: "Invitation sent" } }
      },
      {
        method: "POST",
        path: "/seat/resend-invitation",
        description: "Resend seat invitation",
        requiresAuth: true,
        requestBody: { invitationId: { type: "string", required: true } },
        response: { status: 200, example: { message: "Invitation resent" } }
      },
      {
        method: "POST",
        path: "/seat/accept-invitation",
        description: "Accept seat invitation",
        requiresAuth: false,
        requestBody: { token: { type: "string", required: true } },
        response: { status: 200, example: { message: "Invitation accepted" } }
      },
      {
        method: "GET",
        path: "/seat/invite-details",
        description: "Get seat invitation details",
        requiresAuth: false,
        queryParams: { token: { type: "string", required: true } },
        response: { status: 200, example: { message: "success", data: { invitation: {} } } }
      },
      {
        method: "GET",
        path: "/seat/fetch",
        description: "Fetch team seats",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { seats: [] } } }
      },
      {
        method: "DELETE",
        path: "/seat/delete",
        description: "Delete team seat",
        requiresAuth: true,
        queryParams: { seatId: { type: "string", required: true } },
        response: { status: 200, example: { message: "Seat deleted" } }
      }
    ],

    subscriptionPlans: [
      {
        method: "POST",
        path: "/subscription-plan/plan",
        description: "Create subscription plan",
        requiresAuth: false,
        requestBody: {
          name: { type: "string", required: true },
          price: { type: "number", required: true },
          features: { type: "array", required: true }
        },
        response: { status: 201, example: { message: "success", data: {} } }
      },
      {
        method: "GET",
        path: "/subscription-plan/plan",
        description: "Fetch all subscription plans",
        requiresAuth: false,
        response: { status: 200, example: { message: "success", data: { plans: [] } } }
      }
    ],

    paymentProcessing: [
      {
        method: "POST",
        path: "/payment-history/initialize",
        description: "Initialize payment transaction",
        requiresAuth: true,
        requestBody: {
          planId: { type: "string", required: true },
          duration: { type: "number", required: true }
        },
        response: { status: 201, example: { message: "success", data: { paymentLink: "" } } }
      },
      {
        method: "POST",
        path: "/payment-history/webhook",
        description: "Payment gateway webhook (Public)",
        requiresAuth: false,
        requestBody: { paymentData: { type: "object", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    dnsCheck: [
      {
        method: "POST",
        path: "/dns-check/extract-domain",
        description: "Extract domain from URL",
        requiresAuth: false,
        requestBody: { url: { type: "string", required: true } },
        response: { status: 200, example: { message: "success", data: { domain: "" } } }
      },
      {
        method: "POST",
        path: "/dns-check/mx-record",
        description: "Check MX records for domain",
        requiresAuth: false,
        requestBody: { domain: { type: "string", required: true } },
        response: { status: 200, example: { message: "success", data: { mxRecords: [] } } }
      }
    ],

    contactSupport: [
      {
        method: "POST",
        path: "/contact-us/us",
        description: "Submit contact form",
        requiresAuth: false,
        requestBody: {
          name: { type: "string", required: true },
          email: { type: "string", required: true },
          message: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "Message sent successfully" } }
      }
    ],

    dataManagement: [
      {
        method: "POST",
        path: "/data-correction/",
        description: "Submit data correction request",
        requiresAuth: false,
        requestBody: {
          email: { type: "string", required: true },
          correction: { type: "string", required: true }
        },
        response: { status: 201, example: { message: "Correction submitted" } }
      }
    ],

    health: [
      {
        method: "GET",
        path: "/health/",
        description: "System health check (Requires API Key)",
        requiresAuth: false,
        requiresApiKey: true,
        response: { status: 200, example: { message: "All systems operational" } }
      }
    ],

    adminAuthentication: [
      {
        method: "POST",
        path: "/admin/login",
        description: "Admin login (separate from user login)",
        requiresAuth: false,
        requestBody: {
          email: { type: "string", required: true, description: "Admin email" },
          password: { type: "string", required: true, description: "Admin password" }
        },
        response: { status: 200, example: { message: "success", description: "Admin logged in successfully", data: { token: "..." } } }
      }
    ],

    adminDashboard: [
      {
        method: "GET",
        path: "/admin/stats",
        description: "Get dashboard statistics",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: {} } }
      },
      {
        method: "GET",
        path: "/admin/analytics",
        description: "Get platform analytics",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: {} } }
      },
      {
        method: "GET",
        path: "/admin/plans",
        description: "Get subscription plans available",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { plans: [] } } }
      },
      {
        method: "GET",
        path: "/admin/report-stats",
        description: "Get report statistics",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: {} } }
      },
      {
        method: "GET",
        path: "/admin/usage-stats",
        description: "Get usage statistics",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: {} } }
      }
    ],

    adminUsers: [
      {
        method: "GET",
        path: "/admin/users",
        description: "Get all users",
        requiresAuth: true,
        queryParams: {
          page: { type: "number", required: false },
          limit: { type: "number", required: false }
        },
        response: { status: 200, example: { message: "success", data: { users: [] } } }
      },
      {
        method: "GET",
        path: "/admin/users/search",
        description: "Search users",
        requiresAuth: true,
        queryParams: { query: { type: "string", required: true } },
        response: { status: 200, example: { message: "success", data: { users: [] } } }
      },
      {
        method: "GET",
        path: "/admin/users/:id",
        description: "Get user details",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success", data: { user: {} } } }
      },
      {
        method: "PATCH",
        path: "/admin/users/:id/suspend",
        description: "Suspend/unsuspend user",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "PATCH",
        path: "/admin/users/:id/subscription",
        description: "Upgrade user subscription",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        requestBody: {
          planId: { type: "string", required: true },
          duration: { type: "number", required: true }
        },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "DELETE",
        path: "/admin/users/:id",
        description: "Delete user",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "DELETE",
        path: "/admin/seats/:id",
        description: "Delete seat",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    adminProfile: [
      {
        method: "GET",
        path: "/admin/profile",
        description: "Get admin profile",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { admin: {} } } }
      },
      {
        method: "PATCH",
        path: "/admin/profile",
        description: "Update admin profile",
        requiresAuth: true,
        requestBody: { email: { type: "string", required: false } },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "PATCH",
        path: "/admin/password",
        description: "Update admin password",
        requiresAuth: true,
        requestBody: {
          currentPassword: { type: "string", required: true },
          newPassword: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    adminInvitations: [
      {
        method: "POST",
        path: "/admin/invitations/send",
        description: "Send admin invitation",
        requiresAuth: true,
        requestBody: { email: { type: "string", required: true } },
        response: { status: 201, example: { message: "Invitation sent" } }
      },
      {
        method: "POST",
        path: "/admin/invitations/verify",
        description: "Verify invitation token",
        requiresAuth: false,
        requestBody: { token: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "POST",
        path: "/admin/invitations/accept",
        description: "Accept admin invitation",
        requiresAuth: false,
        requestBody: {
          token: { type: "string", required: true },
          password: { type: "string", required: true }
        },
        response: { status: 201, example: { message: "Admin account created" } }
      },
      {
        method: "GET",
        path: "/admin/list",
        description: "Get admin list",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { admins: [] } } }
      },
      {
        method: "GET",
        path: "/admin/invitations",
        description: "Get admin invitations",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { invitations: [] } } }
      },
      {
        method: "GET",
        path: "/admin/audit-logs",
        description: "Get admin audit logs",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { logs: [] } } }
      }
    ],

    adminManagement: [
      {
        method: "PATCH",
        path: "/admin/admins/:id/suspend",
        description: "Suspend admin",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "DELETE",
        path: "/admin/admins/:id",
        description: "Delete admin",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    adminDomains: [
      {
        method: "GET",
        path: "/admin/domains",
        description: "Get managed domains",
        requiresAuth: true,
        queryParams: {
          page: { type: "number", required: false },
          limit: { type: "number", required: false }
        },
        response: { status: 200, example: { message: "success", data: { domains: [] } } }
      },
      {
        method: "PATCH",
        path: "/admin/domains/:id/block",
        description: "Block domain",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "DELETE",
        path: "/admin/domains/:id",
        description: "Delete domain",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    adminDomainManagement: [
      {
        method: "GET",
        path: "/admin/domain-management",
        description: "List domain management entries (Disposable, Public, Relay, Username)",
        requiresAuth: true,
        queryParams: {
          page: { type: "number", required: false },
          limit: { type: "number", required: false },
          type: { type: "string", required: false }
        },
        response: { status: 200, example: { message: "success", data: { records: [] } } }
      },
      {
        method: "POST",
        path: "/admin/domain-management",
        description: "Add domain entry (Disposable/Public/Relay/Username) with validation",
        requiresAuth: true,
        requestBody: {
          type: { type: "string", required: true, description: "username, relay, disposable, or public" },
          provider: { type: "string", required: false },
          value: { type: "string", required: true }
        },
        response: { status: 201, example: { message: "success", data: {} } }
      },
      {
        method: "PATCH",
        path: "/admin/domain-management/:id",
        description: "Update domain entry",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        requestBody: {
          type: { type: "string", required: false },
          provider: { type: "string", required: false },
          value: { type: "string", required: false }
        },
        response: { status: 200, example: { message: "success", data: {} } }
      },
      {
        method: "DELETE",
        path: "/admin/domain-management/:id",
        description: "Delete domain entry",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    adminMxMatching: [
      {
        method: "GET",
        path: "/admin/mx-matching",
        description: "Get MX matching records",
        requiresAuth: true,
        queryParams: {
          page: { type: "number", required: false },
          limit: { type: "number", required: false }
        },
        response: { status: 200, example: { message: "success", data: { records: [] } } }
      },
      {
        method: "POST",
        path: "/admin/mx-matching",
        description: "Add MX matching record",
        requiresAuth: true,
        requestBody: {
          domain: { type: "string", required: true },
          mxRecords: { type: "array", required: true }
        },
        response: { status: 201, example: { message: "success", data: {} } }
      },
      {
        method: "PATCH",
        path: "/admin/mx-matching/:id",
        description: "Update MX matching record",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        requestBody: {
          domain: { type: "string", required: false },
          mxRecords: { type: "array", required: false }
        },
        response: { status: 200, example: { message: "success", data: {} } }
      },
      {
        method: "DELETE",
        path: "/admin/mx-matching/:id",
        description: "Delete MX matching record",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    adminRiskyDomains: [
      {
        method: "GET",
        path: "/admin/risky-domains",
        description: "Get risky domains list",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { domains: [] } } }
      }
    ],

    adminCustomPlans: [
      {
        method: "POST",
        path: "/admin/custom-plans",
        description: "Create custom subscription plan",
        requiresAuth: true,
        requestBody: {
          name: { type: "string", required: true },
          price: { type: "number", required: true },
          features: { type: "array", required: true }
        },
        response: { status: 201, example: { message: "success", data: {} } }
      },
      {
        method: "GET",
        path: "/admin/custom-plans",
        description: "Get all custom plans",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { plans: [] } } }
      },
      {
        method: "PUT",
        path: "/admin/custom-plans/:planId",
        description: "Update custom plan",
        requiresAuth: true,
        pathParams: { planId: { type: "string", required: true } },
        requestBody: {},
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "DELETE",
        path: "/admin/custom-plans/:planId",
        description: "Delete custom plan",
        requiresAuth: true,
        pathParams: { planId: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      },
      {
        method: "POST",
        path: "/admin/custom-plans/assign",
        description: "Assign custom plan to user",
        requiresAuth: true,
        requestBody: {
          userId: { type: "string", required: true },
          planId: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "Plan assigned" } }
      }
    ],

    adminTldRdap: [
      {
        method: "GET",
        path: "/admin/misc/tld-rdap",
        description: "Get TLD RDAP mappings",
        requiresAuth: true,
        queryParams: {
          page: { type: "number", required: false },
          limit: { type: "number", required: false }
        },
        response: { status: 200, example: { message: "success", data: { records: [] } } }
      },
      {
        method: "POST",
        path: "/admin/misc/tld-rdap",
        description: "Add TLD RDAP mapping",
        requiresAuth: true,
        requestBody: {
          domain_suffix: { type: "string", required: true },
          rdap_url: { type: "string", required: true }
        },
        response: { status: 201, example: { message: "success", data: {} } }
      },
      {
        method: "PATCH",
        path: "/admin/misc/tld-rdap/:id",
        description: "Update TLD RDAP mapping",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        requestBody: {
          domain_suffix: { type: "string", required: false },
          rdap_url: { type: "string", required: false }
        },
        response: { status: 200, example: { message: "success", data: {} } }
      },
      {
        method: "DELETE",
        path: "/admin/misc/tld-rdap/:id",
        description: "Delete TLD RDAP mapping",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    adminSubdomainProviders: [
      {
        method: "GET",
        path: "/admin/misc/subdomain-providers",
        description: "Get subdomain providers",
        requiresAuth: true,
        queryParams: {
          page: { type: "number", required: false },
          limit: { type: "number", required: false }
        },
        response: { status: 200, example: { message: "success", data: { records: [] } } }
      },
      {
        method: "POST",
        path: "/admin/misc/subdomain-providers",
        description: "Add subdomain provider",
        requiresAuth: true,
        requestBody: {
          domain_provider: { type: "string", required: true },
          domain: { type: "string", required: true },
          premium_status: { type: "boolean", required: true },
          domain_age: { type: "string", required: false },
          approval_mode: { type: "string", required: false }
        },
        response: { status: 201, example: { message: "success", data: {} } }
      },
      {
        method: "PATCH",
        path: "/admin/misc/subdomain-providers/:id",
        description: "Update subdomain provider",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        requestBody: {},
        response: { status: 200, example: { message: "success", data: {} } }
      },
      {
        method: "DELETE",
        path: "/admin/misc/subdomain-providers/:id",
        description: "Delete subdomain provider",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    adminSuperSubdomains: [
      {
        method: "GET",
        path: "/admin/misc/super-subdomains",
        description: "Get super subdomains",
        requiresAuth: true,
        queryParams: {
          page: { type: "number", required: false },
          limit: { type: "number", required: false }
        },
        response: { status: 200, example: { message: "success", data: { records: [] } } }
      },
      {
        method: "POST",
        path: "/admin/misc/super-subdomains",
        description: "Add super subdomain",
        requiresAuth: true,
        requestBody: { domain: { type: "string", required: true } },
        response: { status: 201, example: { message: "success", data: {} } }
      },
      {
        method: "PATCH",
        path: "/admin/misc/super-subdomains/:id",
        description: "Update super subdomain",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        requestBody: { domain: { type: "string", required: false } },
        response: { status: 200, example: { message: "success", data: {} } }
      },
      {
        method: "DELETE",
        path: "/admin/misc/super-subdomains/:id",
        description: "Delete super subdomain",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    adminIgnoreDomains: [
      {
        method: "GET",
        path: "/admin/misc/ignore-domains",
        description: "Get ignore domains",
        requiresAuth: true,
        queryParams: {
          page: { type: "number", required: false },
          limit: { type: "number", required: false }
        },
        response: { status: 200, example: { message: "success", data: { records: [] } } }
      },
      {
        method: "POST",
        path: "/admin/misc/ignore-domains",
        description: "Add ignore domain with validation against SubdomainProvider, SuperSubdomain",
        requiresAuth: true,
        requestBody: { domain: { type: "string", required: true } },
        response: { status: 201, example: { message: "success", data: {} } }
      },
      {
        method: "PATCH",
        path: "/admin/misc/ignore-domains/:id",
        description: "Update ignore domain",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        requestBody: { domain: { type: "string", required: false } },
        response: { status: 200, example: { message: "success", data: {} } }
      },
      {
        method: "DELETE",
        path: "/admin/misc/ignore-domains/:id",
        description: "Delete ignore domain",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    adminRdapIp: [
      {
        method: "GET",
        path: "/admin/rdap-ip/",
        description: "Get RDAP IP whitelist",
        requiresAuth: true,
        response: { status: 200, example: { message: "success", data: { ips: [] } } }
      },
      {
        method: "POST",
        path: "/admin/rdap-ip/",
        description: "Add IP to RDAP whitelist",
        requiresAuth: true,
        requestBody: { ip: { type: "string", required: true } },
        response: { status: 201, example: { message: "success", data: {} } }
      },
      {
        method: "PATCH",
        path: "/admin/rdap-ip/:id",
        description: "Update RDAP IP",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        requestBody: { ip: { type: "string", required: false } },
        response: { status: 200, example: { message: "success", data: {} } }
      },
      {
        method: "DELETE",
        path: "/admin/rdap-ip/:id",
        description: "Delete RDAP IP",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    adminSubmittedDomains: [
      {
        method: "GET",
        path: "/admin/submitted-domains/",
        description: "Get submitted domains",
        requiresAuth: true,
        queryParams: {
          page: { type: "number", required: false },
          limit: { type: "number", required: false }
        },
        response: { status: 200, example: { message: "success", data: { domains: [] } } }
      },
      {
        method: "DELETE",
        path: "/admin/submitted-domains/:id",
        description: "Delete submitted domain",
        requiresAuth: true,
        pathParams: { id: { type: "string", required: true } },
        response: { status: 200, example: { message: "success" } }
      }
    ],

    botAPITldRdap: [
      {
        method: "POST",
        path: "/tld-rdap/add",
        description: "Add TLD RDAP mapping (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          domain_suffix: { type: "string", required: true },
          rdap_url: { type: "string", required: true }
        },
        response: { status: 201, example: { message: "success" } }
      },
      {
        method: "POST",
        path: "/tld-rdap/get",
        description: "Get TLD RDAP mapping (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          domain_suffix: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "success", data: {} } }
      }
    ],

    botAPIMxMatching: [
      {
        method: "POST",
        path: "/mx-matching/add",
        description: "Add MX matching record (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          domain: { type: "string", required: true },
          mxRecords: { type: "array", required: true }
        },
        response: { status: 201, example: { message: "success" } }
      }
    ],

    botAPISuperSubdomains: [
      {
        method: "POST",
        path: "/super-subdomains/bot-check",
        description: "Check if domain is a super subdomain (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          is_super_subdomain: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "success", data: { is_super_subdomain: false } } }
      }
    ],

    botAPIIgnoreDomains: [
      {
        method: "POST",
        path: "/ignore-domains/bot-check",
        description: "Check if domain is ignored (Bot API)",
        requiresAuth: false,
        botAuth: true,
        requestBody: {
          bot_username: { type: "string", required: true },
          bot_password: { type: "string", required: true },
          is_ignored: { type: "string", required: true }
        },
        response: { status: 200, example: { message: "success", data: { is_ignored: false } } }
      }
    ]
  },

  init() {
    this.renderEndpoints();
    this.setupEventListeners();
  },

  renderEndpoints() {
    const container = document.getElementById("api-endpoints-container");
    container.innerHTML = "";

    Object.entries(this.endpoints).forEach(([category, endpointsInCategory]) => {
      const group = document.createElement("div");
      group.className = "api-endpoint-group";

      const title = document.createElement("div");
      title.className = "api-endpoint-group-title";
      title.textContent = this.formatCategoryName(category);

      group.appendChild(title);

      endpointsInCategory.forEach((endpoint) => {
        const item = document.createElement("div");
        item.className = "api-endpoint-item";
        item.setAttribute("data-method", endpoint.method);
        item.setAttribute("data-path", endpoint.path);
        item.setAttribute("data-description", endpoint.description);

        item.innerHTML = this.createEndpointHTML(endpoint);

        // Only toggle on header click, not on content click or text selection
        const header = item.querySelector(".api-endpoint-header");
        header.addEventListener("click", (e) => {
          // Don't toggle if user is selecting text
          const selection = window.getSelection();
          if (selection.toString().length > 0) {
            return;
          }

          if (!e.target.closest(".api-code-copy-btn")) {
            item.classList.toggle("expanded");
          }
        });

        group.appendChild(item);
      });

      container.appendChild(group);
    });

    this.setupCopyButtons();
  },

  createEndpointHTML(endpoint) {
    let authBadge = '';
    if (endpoint.botAuth) {
      authBadge = '<span class="api-auth-badge api-auth-bot"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" fill="currentColor"/></svg> Bot API</span>';
    } else if (endpoint.requiresApiToken) {
      authBadge = '<span class="api-auth-badge api-auth-token"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="currentColor"/></svg> Token</span>';
    } else if (endpoint.requiresApiKey) {
      authBadge = '<span class="api-auth-badge api-auth-key"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2z" fill="currentColor"/></svg> API Key</span>';
    } else if (endpoint.requiresAuth) {
      authBadge = '<span class="api-auth-badge api-auth-required"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="currentColor"/></svg> Auth</span>';
    } else {
      authBadge = '<span class="api-auth-badge api-auth-public"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg> Public</span>';
    }
    const auth = authBadge;

    const hasBody = endpoint.requestBody && Object.keys(endpoint.requestBody).length > 0;

    let detailsHTML = `
      <div class="api-endpoint-details">
        ${
          endpoint.requiresAuth || endpoint.botAuth || endpoint.requiresApiToken || endpoint.requiresApiKey
            ? '<div class="api-security-section">' +
              '<div class="api-security-header">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="currentColor"/></svg>' +
              '<span class="api-security-label">Security</span>' +
              '</div>' +
              '<div class="api-security-content">' +
              (endpoint.botAuth
                ? '<div class="api-security-type"><strong>Bot Auth:</strong> Bot credentials (bot_username, bot_password)</div>'
                : endpoint.requiresApiToken
                  ? '<div class="api-security-type"><strong>API Token:</strong> Authorization header or query parameter</div>'
                  : endpoint.requiresApiKey
                    ? '<div class="api-security-type"><strong>API Key:</strong> X-Health-Check-Key header</div>'
                    : '<div class="api-security-type"><strong>Bearer Token:</strong> User token in Authorization header</div>') +
              '</div>' +
              '</div>'
            : ""
        }
    `;

    if (endpoint.pathParams && Object.keys(endpoint.pathParams).length > 0) {
      detailsHTML += `<div class="api-detail-section">
        <label class="api-detail-label">Path Parameters</label>
        <div class="api-parameter-list">
          ${Object.entries(endpoint.pathParams)
            .map(
              ([name, param]) => `
            <div class="api-parameter">
              <div class="api-parameter-name">:${name}</div>
              <div><span class="api-parameter-type">${param.type}</span><span class="api-required">Required</span></div>
              <div class="api-parameter-description">${param.description || ""}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>`;
    }

    if (endpoint.queryParams && Object.keys(endpoint.queryParams).length > 0) {
      detailsHTML += `<div class="api-detail-section">
        <label class="api-detail-label">Query Parameters</label>
        <div class="api-parameter-list">
          ${Object.entries(endpoint.queryParams)
            .map(
              ([name, param]) => `
            <div class="api-parameter">
              <div class="api-parameter-name">?${name}</div>
              <div><span class="api-parameter-type">${param.type}</span><span class="${param.required ? "api-required" : "api-optional"}">${param.required ? "Required" : "Optional"}</span></div>
              <div class="api-parameter-description">${param.description || ""}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>`;
    }

    if (hasBody) {
      detailsHTML += `<div class="api-detail-section">
        <label class="api-detail-label">Request Body</label>
        <div class="api-code-block">
          <div class="api-code-header">
            <span>application/json</span>
            <button class="api-code-copy-btn" data-type="request-body">Copy</button>
          </div>
          <div class="api-code-content">
            <code>${JSON.stringify(
              Object.entries(endpoint.requestBody).reduce((acc, [key, val]) => {
                acc[key] = `<${val.type}> ${val.description || ""}`;
                return acc;
              }, {}),
              null,
              2
            )}</code>
          </div>
        </div>
      </div>`;
    }

    if (endpoint.response) {
      detailsHTML += `<div class="api-detail-section">
        <label class="api-detail-label">Response (${endpoint.response.status})</label>
        <div class="api-code-block">
          <div class="api-code-header">
            <span>application/json</span>
            <button class="api-code-copy-btn" data-type="response">Copy</button>
          </div>
          <div class="api-code-content">
            <code>${JSON.stringify(endpoint.response.example, null, 2)}</code>
          </div>
        </div>
      </div>`;
    }

    detailsHTML += `</div>`;

    const fullPath = `${this.baseUrl}${endpoint.path.startsWith("/admin") ? "" : endpoint.path.startsWith("/") ? "" : "/"}${endpoint.path}`;

    return `
      <div class="api-endpoint-header">
        <div class="api-endpoint-left">
          <span class="api-method-badge ${endpoint.method}">${endpoint.method}</span>
          <div class="api-endpoint-path">${fullPath}</div>
          <div class="api-endpoint-description">${endpoint.description}</div>
          ${auth}
        </div>
        <div class="api-endpoint-toggle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
      ${detailsHTML}
    `;
  },

  formatCategoryName(category) {
    return category
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  },

  setupEventListeners() {
    const searchInput = document.getElementById("api-search-input");
    const filterBtns = document.querySelectorAll(".api-filter-btn");

    searchInput?.addEventListener("input", (e) => this.filterEndpoints());
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.filterEndpoints();
      });
    });
  },

  filterEndpoints() {
    const searchTerm = document.getElementById("api-search-input")?.value.toLowerCase() || "";
    const activeFilter = document.querySelector(".api-filter-btn.active")?.dataset.method || "ALL";

    const items = document.querySelectorAll(".api-endpoint-item");
    const groups = document.querySelectorAll(".api-endpoint-group");
    let visibleCount = 0;

    items.forEach((item) => {
      const method = item.dataset.method;
      const path = item.dataset.path.toLowerCase();
      const description = item.dataset.description.toLowerCase();

      const matchesSearch = !searchTerm || path.includes(searchTerm) || description.includes(searchTerm);
      const matchesFilter = activeFilter === "ALL" || method === activeFilter;

      if (matchesSearch && matchesFilter) {
        item.style.display = "";
        visibleCount++;
      } else {
        item.style.display = "none";
      }
    });

    // Hide/show groups based on visible items
    groups.forEach((group) => {
      const groupItems = group.querySelectorAll(".api-endpoint-item");
      const visibleItemsInGroup = Array.from(groupItems).filter(
        (item) => window.getComputedStyle(item).display !== "none"
      ).length;
      if (visibleItemsInGroup === 0) {
        group.style.display = "none";
      } else {
        group.style.display = "";
      }
    });

    const emptyState = document.getElementById("api-empty-state");
    if (visibleCount === 0) {
      emptyState.style.display = "flex";
    } else {
      emptyState.style.display = "none";
    }
  },

  setupCopyButtons() {
    document.querySelectorAll(".api-code-copy-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const codeContent = btn.closest(".api-code-block").querySelector("code").textContent;
        navigator.clipboard.writeText(codeContent).then(() => {
          const notification = document.getElementById("copy-notification");
          notification.style.display = "block";
          setTimeout(() => {
            notification.style.display = "none";
          }, 2000);
        });
      });
    });
  }
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  APIDocumentation.init();
});
