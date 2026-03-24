document.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const totalReqEl = document.querySelector(".dash-total-1");
  const successfulReqEl = document.querySelector(".dash-total-2");
  const blockReqEl = document.querySelector(".dash-total-3");
  const chartContainer = document.querySelector(".chart-container");
  
  const apiRequestLeftEl = document.querySelector(".api-request-left");
  const planNameEl = document.querySelector(".Current-plan-plan");
  const expiresDateEl = document.querySelector(".current-plan-date");
  const apiTokenEl = document.getElementById("api-token-text");
  
  const token = localStorage.getItem("authToken");

  if (!token) {
    window.clearUserSession();
    window.location.href = "/sign-in.html";
    return;
  }

  // ------------------------------------------------------
  // 1. INITIALIZE INDEPENDENT SPINNERS
  // ------------------------------------------------------
  // Black/Dark spinner for visibility on white cards
  const spinnerHtml = `<span class="stopreg-btn-spinner" style="border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important;"></span>`;
  
  // Cards
  if (totalReqEl) totalReqEl.innerHTML = spinnerHtml;
  if (successfulReqEl) successfulReqEl.innerHTML = spinnerHtml;
  if (blockReqEl) blockReqEl.innerHTML = spinnerHtml;

  // Plan & Token
  if (apiRequestLeftEl) apiRequestLeftEl.innerHTML = spinnerHtml;
  if (planNameEl) planNameEl.innerHTML = spinnerHtml;
  if (expiresDateEl) expiresDateEl.innerHTML = spinnerHtml;
  if (apiTokenEl) apiTokenEl.innerHTML = spinnerHtml; // Using ID

  // Trends
  const trendTexts = document.querySelectorAll(".trend-text");
  trendTexts.forEach(el => el.innerHTML = `<span class="stopreg-btn-spinner" style="width: 12px; height: 12px; border-width: 2px !important; border-color: rgba(0,0,0,0.1) !important; border-top-color: currentColor !important; vertical-align: baseline;"></span>`);

  // Chart Spinner
  const chartSpinnerId = "chart-loading-spinner";
  if (chartContainer) {
    let existingCanvas = document.getElementById("lineChart");
    const chartSpinnerDiv = document.createElement("div");
    chartSpinnerDiv.id = chartSpinnerId;
    chartSpinnerDiv.style.position = "absolute";
    chartSpinnerDiv.style.top = "0";
    chartSpinnerDiv.style.left = "0";
    chartSpinnerDiv.style.width = "100%";
    chartSpinnerDiv.style.height = "100%";
    chartSpinnerDiv.style.display = "flex";
    chartSpinnerDiv.style.alignItems = "center";
    chartSpinnerDiv.style.justifyContent = "center";
    chartSpinnerDiv.style.background = "rgba(255, 255, 255, 0.7)";
    chartSpinnerDiv.style.zIndex = "10";
    // Checks secondary color var or fallback
    chartSpinnerDiv.innerHTML = `<div class="stopreg-btn-spinner" style="width: 40px; height: 40px; border-width: 3px !important; border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important;"></div>`;
    
    const computedStyle = window.getComputedStyle(chartContainer);
    if (computedStyle.position === "static") {
      chartContainer.style.position = "relative";
    }
    chartContainer.appendChild(chartSpinnerDiv);
  }

  // ------------------------------------------------------
  // 2. GLOBAL SPINNER LOGIC
  // ------------------------------------------------------
  const hideGlobalSpinner = () => {
    if (typeof window.hideSpinner === 'function') {
      window.hideSpinner();
    }
  };
  if (document.readyState === 'complete') {
    hideGlobalSpinner();
  } else {
    window.addEventListener('load', hideGlobalSpinner);
  }

  // ------------------------------------------------------
  // 3. FETCH USER INFO (Plan, Token, etc.)
  // ------------------------------------------------------
  async function fetchUserInfo() {
    try {
      const response = await fetch("https://api.stopreg.com/api/v1/user/info", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data?.data || data;
        const userDetails = user.userDetails;
        console.log("userDetails", userDetails);

        if (userDetails) {
           // Re-select elements to ensure we target live DOM
           const apiTokenEl = document.getElementById("api-token-text");
           const expiresDateEl = document.querySelector(".current-plan-date");
           const planNameEl = document.querySelector(".Current-plan-plan");
           const apiRequestLeftEl = document.querySelector(".api-request-left");
           

           // Update Plan Details
           if (expiresDateEl && userDetails.tokenExpiresAt) {
             const expiresDate = new Date(userDetails.tokenExpiresAt);
             expiresDateEl.innerHTML = "";
             expiresDateEl.textContent = `Expires: ${expiresDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`;
           }

           if (planNameEl && userDetails.planId?.name) {
             planNameEl.innerHTML = "";
             planNameEl.textContent = `${userDetails.planId.name} Account`;
           }

            if (apiRequestLeftEl && userDetails.planId) {
              const free = userDetails.extraApiLimitLeft || 0;
              const paid = userDetails.apiRequestLeft || 0;
              const total = free + paid;
              const breakdown = paid > 0 ? ` (${free.toLocaleString()} Base + ${paid.toLocaleString()} Extra)` : '';
              const durationInDays = userDetails.planId.durationInDays ?? 30;
              
              apiRequestLeftEl.innerHTML = "";
              apiRequestLeftEl.textContent = `${total.toLocaleString()}${breakdown} API requests in ${durationInDays} days`;
            }

            // Update Link Container
            const apiToken = userDetails.apiToken;
            if (apiToken) {
               const linkContainer = document.querySelector(".link-container");
               if (linkContainer) {
                 const newLink = ` https://api.stopreg.com/api/v1/check/${apiToken}?email=test@test.com`;
                 linkContainer.href = newLink;
                 const linkTitle = linkContainer.querySelector(".token-link-title");
                 if (linkTitle) linkTitle.textContent = newLink;
               }
            }
          }
      } else {
          if (window.handleAuthError && await window.handleAuthError(response)) {
             return;
          }
          handleUserInfoError();
      }
    } catch (error) {
       console.error("Error fetching user info:", error);
       handleUserInfoError();
    }
  }
  
  function handleUserInfoError() {
      const apiCard = document.querySelector(".dash-card-api");
      const planCard = document.querySelector(".dash-card-plan");
      
      const retryFn = () => fetchUserInfo();

      // HTML Restorations
      const apiRestoreHtml = `
          <div class="dash-card-header">
            <h3>Block disposable emails</h3>
             <div class="info-icon-wrapper">
                <img src="/assets/icons/question.svg" alt="Info" class="info-icon" data-hide-on-error />
            </div>
          </div>
          <div class="input-group" id="api-token-section">
            <label>API Token</label>
            <div class="copy-input-field">
              <span class="truncated-text" id="api-token-text"><span class="stopreg-btn-spinner" style="border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important;"></span></span>
              <button class="copy-btn"><img src="/assets/icons/copy.svg" alt="Copy" /> Copy</button>
            </div>
          </div>
          <div class="api-actions">
            <button class="btn btn-primary" id="generate-token-btn">Generate API Token</button>
            <a href="/documentation.html" class="btn btn-outline" style="text-decoration: none; display: flex; align-items: center; justify-content: center;">Read the Docs</a>
          </div>
          <div class="divider"></div>
          <div class="input-group">
            <label>Email Verification API Endpoint</label>
            <div class="copy-input-field grey-bg">
              <span class="truncated-text" id="email-endpoint-text">https://api.stopreg.com/api/v1/verify/email</span>
              <button class="copy-btn"><img src="/assets/icons/copy.svg" alt="Copy" /> Copy</button>
            </div>
          </div>
          <div class="input-group">
            <label>Domain Verification API Endpoint</label>
            <div class="copy-input-field grey-bg">
              <span class="truncated-text" id="domain-endpoint-text">https://api.stopreg.com/api/v1/verify/domain</span>
              <button class="copy-btn"><img src="/assets/icons/copy.svg" alt="Copy" /> Copy</button>
            </div>
          </div>`;

      const planRestoreHtml = `
          <div class="dash-card-header flex-header">
             <h3>Current plan</h3>
             <span class="expire-text current-plan-date"><span class="stopreg-btn-spinner" style="border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important;"></span></span>
          </div>
          <div class="plan-info-box">
             <p class="plan-name Current-plan-plan"><span class="stopreg-btn-spinner" style="border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important;"></span></p>
             <p class="plan-usage api-request-left"><span class="stopreg-btn-spinner" style="border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important;"></span></p>
          </div>
          <button class="btn btn-light-blue">Upgrade</button>
          <div class="plan-divider"></div>
          <div class="dash-card-header"><h3>Seats</h3></div>
          <div class="seats-container">
            <p class="seats-title">You have invited 3 users</p>
             <div class="seat-list">
               <div class="seat-item"><span class="seat-email">cynthia44@gmail.com</span><span class="seat-status">Registered</span></div>
               <div class="seat-item"><span class="seat-email">cynthia44@gmail.com</span><span class="seat-status">Registered</span></div>
             </div>
             <div class="seats-actions">
               <a href="#" id="add-seats-trigger" class="action-link-blue">Add more</a>
               <a href="/dashboard/seats.html" class="action-link-blue">View All</a>
             </div>
          </div>`;

      if (typeof renderErrorState === 'function') {
          if (apiCard) renderErrorState(apiCard, retryFn, apiRestoreHtml);
          if (planCard) renderErrorState(planCard, retryFn, planRestoreHtml);
      }
  }

  // ------------------------------------------------------
  // 4. FETCH REQUESTS (Cards, Chart, Table)
  // ------------------------------------------------------
  async function fetchRequests() {
    let requests = [];
    // Table Loading State
    const tableBody = document.querySelector(".req-table tbody");
    const donutContainer = document.querySelector(".chart-donut-container");
    const trendContainer = document.querySelector(".dash-plan-inner-cont");
    const lineChartContainer = document.querySelector(".chart-container");
    
    if (tableBody) {
       tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px;"><div class="stopreg-btn-spinner" style="border-width: 3px !important; border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important; width: 30px; height: 30px; margin: 0 auto;"></div></td></tr>`;
    }

    try {
       const response = await fetch("https://api.stopreg.com/api/v1/user/info/requests", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
       });
       
       if (response.ok) {
           const result = await response.json();
           // Structure: { message, description, data: { request: [...] } }
           requests = result?.data?.docs || [];
           console.log("result?.data?", result?.data?.docs)
           
       } else {
            console.error("Error fetching requests:", await response.text());
            if (window.handleAuthError && await window.handleAuthError(response)) {
                return;
            }
            handleRequestsError(tableBody, donutContainer, trendContainer, lineChartContainer);
            return;
        }
    } catch (e) {
        console.error("Network error, fetching requests:", e);
        handleRequestsError(tableBody, donutContainer, trendContainer, lineChartContainer);
        return;
    }
    
    processRequests(requests);
    renderTable(requests);
  }
  window.fetchRequests = fetchRequests;
  
  function handleRequestsError(tableBody, donutElem, trendElem, chartElem) {
      const retryFn = () => fetchRequests();
      
      const trendRestoreHtml = `
                <!-- Total Request -->
                <div class="dash-plan-analysis">
                  <div class="card-trend-col">
                    <div class="card-trend-row positive">
                      <div class="trend-icon-wrapper"></div>
                      <span class="trend-text"><span class="stopreg-btn-spinner" style="width: 12px; height: 12px; border-width: 2px !important; border-color: rgba(0,0,0,0.1) !important; border-top-color: currentColor !important; vertical-align: baseline;"></span></span>
                    </div>
                    <div class="card-value-row">
                      <p class="dash-plan-total dash-total-1"><span class="stopreg-btn-spinner" style="border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important;"></span></p>
                    </div>
                  </div>
                  <div class="card-title-row">
                    <p class="dash-plan-anaylysis-title">Total Request</p>
                  </div>
                </div>
                <!-- Successful Request -->
                <div class="dash-plan-analysis">
                  <div class="card-trend-col">
                    <div class="card-trend-row positive">
                      <div class="trend-icon-wrapper"></div>
                      <span class="trend-text"><span class="stopreg-btn-spinner" style="width: 12px; height: 12px; border-width: 2px !important; border-color: rgba(0,0,0,0.1) !important; border-top-color: currentColor !important; vertical-align: baseline;"></span></span>
                    </div>
                    <div class="card-value-row">
                      <p class="dash-plan-total dash-total-2"><span class="stopreg-btn-spinner" style="border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important;"></span></p>
                    </div>
                  </div>
                  <div class="card-title-row">
                    <p class="dash-plan-anaylysis-title">Successful Request</p>
                  </div>
                </div>
                <!-- Blocked Request -->
                <div class="dash-plan-analysis">
                  <div class="card-trend-col">
                    <div class="card-trend-row negative">
                       <div class="trend-icon-wrapper"></div>
                      <span class="trend-text"><span class="stopreg-btn-spinner" style="width: 12px; height: 12px; border-width: 2px !important; border-color: rgba(0,0,0,0.1) !important; border-top-color: currentColor !important; vertical-align: baseline;"></span></span>
                    </div>
                    <div class="card-value-row">
                      <p class="dash-plan-total dash-total-3"><span class="stopreg-btn-spinner" style="border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important;"></span></p>
                    </div>
                  </div>
                  <div class="card-title-row">
                    <p class="dash-plan-anaylysis-title">Blocked Request</p>
                  </div>
                </div>`;
      
      const chartRestoreHtml = `<canvas id="lineChart"></canvas><div id="chart-tooltip" class="custom-tooltip"><strong></strong><span></span></div>`;
      const donutRestoreHtml = `<div class="donut-chart-wrapper"><div class="chart-spinner"></div></div>`;

      if (typeof renderErrorState === 'function') {
          if (donutElem) renderErrorState(donutElem, retryFn, donutRestoreHtml);
          if (trendElem) renderErrorState(trendElem, retryFn, trendRestoreHtml);
          if (chartElem) renderErrorState(chartElem, retryFn, chartRestoreHtml);
          
          if (tableBody) {
             tableBody.innerHTML = `
                <tr>
                  <td colspan="7" style="padding: 0; border: none; height: 300px;">
                     <div class="fetch-error-state">
                        <div class="error-icon-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 class="error-title">Failed to load requests</h3>
                        <p class="error-desc">We couldn't fetch the latest data. Please check your connection.</p>
                        <button class="retry-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Try Again
                        </button>
                    </div>
                  </td>
                </tr>
              `;
             const btn = tableBody.querySelector('.retry-btn');
             if (btn) btn.onclick = retryFn;
          }
      }
  }


    


  function renderTable(requests) {
      const tableBody = document.querySelector(".req-table tbody");
      if (!tableBody) return;

      // Show/Hide View More Button
      const viewMoreBtn = document.querySelector(".req-view-more-btn");
      if (viewMoreBtn) {
          if (requests && requests.length > 0) {
              viewMoreBtn.style.display = "block";
          } else {
              viewMoreBtn.style.display = "none";
          }
      }

      if (!requests || requests.length === 0) {
          // Mind blowing empty state animation
          tableBody.innerHTML = `
            <tr>
              <td colspan="8" style="padding: 0; border: none;">
                <div class="empty-state-container">
                  <img src="/assets/icons/empty.svg" alt="No Data" class="empty-state-svg" />
                  <h4 class="empty-state-title">No Requests Yet</h4>
                  <p class="empty-state-desc">You haven't made any API requests. Once you do, they'll appear here instantly.</p>
                </div>
              </td>
            </tr>
          `;
          return;
      }

      // Sort by createdAt desc (Newest first) and take top 10
      const sortedReqs = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

      tableBody.innerHTML = sortedReqs.map(req => {
          const status = req.status || "-";
          let badgeClass = "";
          let badgeIcon = "";
          let badgeText = "";

          // Map Status Badge
          switch (status.toLowerCase()) {
              case "blocked":
                  badgeClass = "status-blocked";
                  badgeIcon = "block-outline.svg";
                  badgeText = "Blocked";
                  break;
              case "reported":
                  badgeClass = "status-reported";
                  badgeIcon = "flag-linear.svg";
                  badgeText = "Reported";
                  break;
              case "allow":
                  badgeClass = "status-allowed";
                  badgeIcon = "approve-outline.svg";
                  badgeText = "Allow";
                  break;
              default: // "-" or Unresolved
                  badgeClass = ""; 
                  badgeIcon = ""; 
                  badgeText = "-";
                  break;
          }

          // Action Button Logic
          // Action Button Logic
          // Action Button Logic (Dropdown)
          const reqId = req._id || req.id || "";
          const reqComment = req.comment ? req.comment.replace(/"/g, '&quot;') : ""; // Escape quotes
          const btnAttrs = `data-id="${reqId}" data-comment="${reqComment}"`;

          // Construct Dropdown Menu
          actionBtn = `
            <div class="action-dropdown">
                <button class="action-menu-trigger" aria-label="Actions">
                    <img src="/assets/icons/more-vert.svg" alt="More" />
                </button>
                <div class="action-dropdown-menu">
                    <!-- Add to Allowlist -->
                    <button class="dropdown-item action-btn btn-add-allow" ${btnAttrs}>
                        <img src="/assets/icons/add-duotone.svg" alt="Add" />
                        <span>Add to Allowlist</span>
                    </button>
                    <!-- Add to Blocklist -->
                    <button class="dropdown-item action-btn btn-add-block" ${btnAttrs}>
                        <img src="/assets/icons/add-duotone.svg" alt="Block" />
                        <span>Add to blocklist</span>
                    </button>
                    <!-- Report -->
                    <button class="dropdown-item action-btn btn-report" ${btnAttrs}>
                        <img src="/assets/icons/flag-linear.svg" alt="Report" />
                        <span>Report</span>
                    </button>
                </div>
            </div>
          `;

          // If valid status, build badge HTML
          let badgeHtml = "";
          if (badgeClass) {
              badgeHtml = `
                <div class="status-badge ${badgeClass}">
                  <img src="/assets/icons/${badgeIcon}" alt="${badgeText}" />
                  <span>${badgeText}</span>
                </div>
              `;
          } else {
              // Just text for "-"
              badgeHtml = `<span style="color: #667085; font-size: 14px;">-</span>`;
          }

          // Helper to get color for boolean flags
          const getFlagHtml = (val) => {
              const text = val ? 'Yes' : 'No';
              const className = val ? 'status-bool-yes' : 'status-bool-no';
              return `<div class="status-badge ${className}"><span>${text}</span></div>`;
          };

          const getUnresolvedHtml = (val) => {
             // Logic: > 0 -> True (Yes/Caution), 0 -> False (No/Red)
             const isTrue = val > 0;
             const text = isTrue ? "Yes" : "No";
             const className = isTrue ? 'status-bool-unresolved' : 'status-bool-no';
             return `<div class="status-badge ${className}"><span>${text}</span></div>`;
          };

          const disposableHtml = getFlagHtml(req.isDiposableDomain);
          const relayHtml = getFlagHtml(req.isRelayDomain);
          const providerHtml = req.provider || '-';
          const unresolvedHtml = getUnresolvedHtml(req.unresolved || 0);

          return `
            <tr>
              <td>${req.domain || "Unknown"}</td>
              <td class="table-center">${providerHtml}</td>
              <td class="table-center">${unresolvedHtml}</td>
              <td class="table-center">${disposableHtml}</td>
              <td class="table-center">${relayHtml}</td>
              <td class="table-center">${req.requestCount || 0}</td>
              <td class="table-center">${badgeHtml}</td>
              <td class="table-center">${actionBtn}</td>
            </tr>
          `;
      }).join("");
  }

  function processRequests(requests) {
     // --- A. Calculate Card Totals ---
     let total = 0;
     let successful = 0; 
     let blocked = 0;    
     
     requests.forEach(req => {
        // 1. Successful Request Logic
        // IF (unresolved > 0 OR isFreeEmailProvider is true)
        // THEN add requestCount
        if ((req.unresolved || 0) > 0 || (req.isFreeEmailProvider === true)) {
            successful += (req.requestCount || 0);
        }

        // 2. Blocked Request Logic
        // IF (isDiposableDomain is true OR isRelayDomain is true)
        // THEN add requestCount
        if (req.isDiposableDomain === true || req.isRelayDomain === true) {
            blocked += (req.requestCount || 0);
        }
     });
     
     // 3. Total
     // Successful Request + Blocked Request
     total = successful + blocked;
     
     // Re-select total elements
     const totalReqEl = document.querySelector(".dash-total-1");
     const successfulReqEl = document.querySelector(".dash-total-2");
     const blockReqEl = document.querySelector(".dash-total-3");

     if (totalReqEl) totalReqEl.textContent = total.toLocaleString();
     if (successfulReqEl) successfulReqEl.textContent = successful.toLocaleString();
     if (blockReqEl) blockReqEl.textContent = blocked.toLocaleString();
     
     // --- B. Prepare Chart Data & Calculate Trends (Today vs Yesterday) ---
     const currentDate = new Date();
     const currentDay = currentDate.getDate();
     const currentMonth = currentDate.getMonth() + 1; 
     const currentYear = currentDate.getFullYear();
     
     // Calculate Yesterday
     const yesterdayDate = new Date(currentDate);
     yesterdayDate.setDate(currentDay - 1);
     const prevDay = yesterdayDate.getDate();
     const prevMonth = yesterdayDate.getMonth() + 1;
     const prevYear = yesterdayDate.getFullYear();

     const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
     const daysLabels = Array.from({length: daysInMonth}, (_, i) => i + 1);
     
     // Data Arrays for Chart
     const dataPublic = Array(daysInMonth).fill(0);
     const dataDisposable = Array(daysInMonth).fill(0);
     const dataRelay = Array(daysInMonth).fill(0);
     const dataUnresolved = Array(daysInMonth).fill(0);

     // Trend Accumulators
     const stats = {
        today: { total: 0, successful: 0, blocked: 0 },
        yesterday: { total: 0, successful: 0, blocked: 0 }
     };

     requests.forEach(req => {
         // Helper to check date match
         const isToday = req.day === currentDay && req.month === currentMonth && req.year === currentYear;
         const isYesterday = req.day === prevDay && req.month === prevMonth && req.year === prevYear;

         // Calculate values for this request based on same logic
         let sVal = 0;
         let bVal = 0;

         if ((req.unresolved || 0) > 0 || (req.isFreeEmailProvider === true)) {
            sVal = (req.requestCount || 0);
         }

         if (req.isDiposableDomain === true || req.isRelayDomain === true) {
            bVal = (req.requestCount || 0);
         }
         
         const tVal = sVal + bVal;

         if (isToday) {
            stats.today.successful += sVal;
            stats.today.blocked += bVal;
            stats.today.total += tVal;
         }
         if (isYesterday) {
            stats.yesterday.successful += sVal;
            stats.yesterday.blocked += bVal;
            stats.yesterday.total += tVal;
         }

         // Chart Data (Current Month)
         if (req.month === currentMonth && req.year === currentYear) {
             const dayIdx = req.day - 1;
             if (dayIdx >= 0 && dayIdx < daysInMonth) {
                 dataPublic[dayIdx] += (req.publicProvider || 0);
                 dataDisposable[dayIdx] += (req.disposableDomainsCount || 0);
                 dataRelay[dayIdx] += (req.relayDomains || 0);
                 dataUnresolved[dayIdx] += (req.unresolved || 0);
             }
         }
     });
     
     // Update Trends
     const calculateTrend = (curr, prev) => {
        if (prev === 0) return curr > 0 ? 100 : 0; 
        return Math.round(((curr - prev) / prev) * 100);
     };

     const trends = [
        calculateTrend(stats.today.total, stats.yesterday.total),
        calculateTrend(stats.today.successful, stats.yesterday.successful),
        calculateTrend(stats.today.blocked, stats.yesterday.blocked)
     ];

     document.querySelectorAll(".card-trend-row").forEach((row, index) => {
        if(index < 3) {
            const pct = trends[index];
            const isPositive = pct >= 0;
            const textEl = row.querySelector(".trend-text");
            const iconWrapper = row.querySelector(".trend-icon-wrapper");
            
            // Remove spinner
            if(textEl) {
                // Determine Class & Icon
                
                // 2. Add new
                row.classList.add(isPositive ? "positive" : "negative");
                
                // Explicitly set text color
                textEl.style.color = isPositive ? "#008000" : "#CC0000";
                textEl.textContent = `${isPositive ? '+' : ''}${pct}%`;
                
                // 3. Update Icon
            if(iconWrapper) {
                const iconName = isPositive ? "arrow-up-green.svg" : "arrow-down-red.svg";
                iconWrapper.innerHTML = `<img src="/assets/icons/${iconName}" alt="${isPositive ? 'up' : 'down'}" />`;
            }
            
            // 4. Update Main Value Color (Sync with trend)
            // Override the hardcoded CSS classes (.dash-total-1, etc) to match trend
            const valueEl = row.parentElement ? row.parentElement.parentElement.querySelector(".dash-plan-total") : null;
            if (valueEl) {
                // If it's the 3rd card (Blocked Request), always red
                if (valueEl.classList.contains("dash-total-3")) {
                     valueEl.style.setProperty("color", "#cc0000", "important");
                } 
            }
            }
        }
     });


     renderChart(daysLabels, dataPublic, dataDisposable, dataRelay, dataUnresolved);
     
     // Update Donut Chart
     updateMonitoringCard(requests);
  }

  function updateMonitoringCard(requests) {
      // 1. Calculate Counts
      let blockedCount = 0;
      let cleanCount = 0; 
      
      requests.forEach(req => {
        // Blocked: isDiposableDomain=true OR isRelayDomain=true -> add requestCount
        if (req.isDiposableDomain === true || req.isRelayDomain === true) {
            blockedCount += (req.requestCount || 0);
        }
        // Clean: unresolved > 0 OR isFreeEmailProvider=true -> add requestCount
        if ((req.unresolved || 0) > 0 || (req.isFreeEmailProvider === true)) {
            cleanCount += (req.requestCount || 0);
        }
      });
      
      const total = blockedCount + cleanCount;
      // If total is 0, we avoid division by zero
      
      // 2. Select Elements
      const donutContainer = document.querySelector(".chart-donut-container");
      if (!donutContainer) return;
      
      // 3. Calculate Percentages & Metrics (Circumference ~ 502.65 for r=80)
      const C = 502.65;
      
      const blockedPct = total > 0 ? (blockedCount / total) : 0;
      const cleanPct = total > 0 ? (cleanCount / total) : 0; // Clean/Allow
      
      const blockedVal = blockedPct * 100;
      const cleanVal = cleanPct * 100;
      
      // Stroke (Green=Clean, Red=Blocked)
      const cleanStroke = cleanPct * C;
      const blockedStroke = blockedPct * C;
      
      // Rotations
      // Green (Clean) starts at -90
      const cleanRot = -90; 
      // Red (Blocked) starts at -90 + (cleanPct * 360)
      const blockedRot = -90 + (cleanPct * 360);
      
      const donutHtml = `
                  <div class="donut-chart-wrapper">
                    <svg width="200" height="200" viewBox="0 0 200 200" class="donut-svg">
                      ${total === 0 ? `
                        <!-- Empty State Gray Segment -->
                        <circle cx="100" cy="100" r="80" fill="transparent" stroke="#E5E7EB" stroke-width="40"
                          stroke-dasharray="502.65 502.65" stroke-dashoffset="0" transform="rotate(-90 100 100)">
                        </circle>
                        <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" fill="#9CA3AF" font-size="14" font-family="Inter_28pt-SemiBold" font-weight="600" style="pointer-events:none;">0%</text>
                      ` : `
                        <!-- Green Segment (Clean/Allow) -->
                        ${cleanCount > 0 ? `<circle cx="100" cy="100" r="80" fill="transparent" stroke="#009900" stroke-width="40"
                          stroke-dasharray="${cleanStroke.toFixed(1)} ${C}" stroke-dashoffset="0" transform="rotate(${cleanRot} 100 100)">
                        </circle>` : ''}

                        <!-- Red Segment (Blocked) -->
                        ${blockedCount > 0 ? `<circle cx="100" cy="100" r="80" fill="transparent" stroke="#F1416C" stroke-width="40"
                          stroke-dasharray="${blockedStroke.toFixed(1)} ${C}" stroke-dashoffset="0" transform="rotate(${blockedRot} 100 100)"
                          stroke-linecap="round"></circle>` : ''}

                        <!-- Text Labels -->
                        ${cleanCount > 0 ? (() => {
                            const angle = -90 + ((cleanPct * 360) / 2);
                            const rad = angle * (Math.PI / 180);
                            const x = 100 + (80 * Math.cos(rad));
                            const y = 100 + (80 * Math.sin(rad));
                            return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="14" font-family="Inter_28pt-SemiBold" font-weight="600" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5); pointer-events:none;">${cleanVal.toFixed(1)}%</text>`;
                        })() : ''}
                        
                        ${blockedCount > 0 ? (() => {
                            const blockedDeg = blockedPct * 360;
                            const angle = -90 + (cleanPct * 360) + (blockedDeg / 2);
                            const rad = angle * (Math.PI / 180);
                            const x = 100 + (80 * Math.cos(rad));
                            const y = 100 + (80 * Math.sin(rad));
                            return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="14" font-family="Inter_28pt-SemiBold" font-weight="600" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5); pointer-events:none;">${blockedVal.toFixed(1)}%</text>`;
                        })() : ''}
                      `}
                    </svg>
                    <div class="chart-total-label">Total - ${total.toLocaleString()}</div>
                  </div>
      `;
      
      donutContainer.innerHTML = donutHtml;
      
      // 4. Update Legend
      const legendContainer = document.querySelector(".chart-legend");
      if (legendContainer) {
          legendContainer.innerHTML = `
                  <div class="legend-item">
                    <span class="legend-indicator indicator-blocked"></span>
                    <div class="legend-text">
                      <p class="legend-value">${blockedVal.toFixed(1)}% - ${blockedCount.toLocaleString()}</p>
                      <p class="legend-label">Blocked Email</p>
                    </div>
                  </div>
                  <div class="legend-item">
                    <span class="legend-indicator indicator-clean"></span>
                    <div class="legend-text">
                      <p class="legend-value">${cleanVal.toFixed(1)}% - ${cleanCount.toLocaleString()}</p>
                      <p class="legend-label">Clean Email</p>
                    </div>
                  </div>
          `;
      }
  }

  function renderChart(labels, dPublic, dDisposable, dRelay, dUnresolved) {
      const spinner = document.getElementById(chartSpinnerId);
      if (spinner) spinner.remove();
      
      const canvas = document.getElementById("lineChart");
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      if (window.myDashboardChart) window.myDashboardChart.destroy();
      
      const selectorImg = new Image();
      selectorImg.src = "/assets/icons/Selector.svg";
      const selectorScale = 1.0;
      
      // Plugin
      const customSelectorPlugin = {
          id: "customSelector",
          afterDraw: (chart) => {
            const activePoints = chart.tooltip._active || [];
            if (!activePoints.length) return;
            
            const ctx = chart.ctx;
            const x = activePoints[0].element.x;
            // Find highest point (smallest y value) to anchor the line and pill
            const minY = Math.min(...activePoints.map(p => p.element.y));
            const bottomY = chart.scales.y.bottom;
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, minY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#049286";
            ctx.setLineDash([5, 5]); // Optional: dashed line if desired, but user image looks solid/faint. keeping solid.
            ctx.globalAlpha = 0.5; // Slightly transparent line
            ctx.stroke();
            ctx.restore();
            
            // Draw Pill/Handle
            ctx.save();
            const pillW = 24;
            const pillH = 10;
            const radius = 4;
            ctx.fillStyle = "#049286";
            
            // Draw Rounded Rectangle centered at (x, minY) or slightly below?
            // Image shows it ON the line. Let's center it at (x, minY).
            const pX = x - pillW / 2;
            const pY = minY - pillH / 2;
            
            ctx.beginPath();
            ctx.roundRect(pX, pY, pillW, pillH, radius);
            ctx.fill();
            ctx.restore();
          },
      };

      const chartData = {
        labels: labels,
        datasets: [
          {
            label: 'Public Provider',
            data: dPublic,
            borderColor: '#0000ff',
            backgroundColor: '#0000ff',
            tension: 0.45,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
          {
            label: 'Disposable Domains',
            data: dDisposable,
            borderColor: '#cc0000',
            backgroundColor: '#cc0000',
            tension: 0.45,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
          {
            label: 'Relay domains',
            data: dRelay,
            borderColor: '#CCCCCC',
            backgroundColor: '#CCCCCC',
            tension: 0.45,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
          {
            label: 'Unresolved',
            data: dUnresolved,
            borderColor: '#049286',
            backgroundColor: '#049286',
            tension: 0.45,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 0,
          }
        ],
      };

      const config = {
        type: "line",
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: false,
              external: function (context) {
                const { chart, tooltip } = context;
                const tooltipEl = document.getElementById("chart-tooltip");
                if (tooltip.opacity === 0) {
                  tooltipEl.style.opacity = 0;
                  tooltipEl.style.display = "none";
                  return;
                }
                
                if (tooltip.body) {
                    const dataPoints = tooltip.dataPoints || [];
                    const title = tooltip.title || [];
                    const currentDate = new Date();
                    const monthName = currentDate.toLocaleString('default', { month: 'long' });
                    
                    // Instead of just total, we want to show category values
                    // Let's create a small list or stack of values
                    // Assuming tooltipEl has a container for this.
                    // Existing structure: <strong>Total</strong> <span>Date</span>
                    // We might need to change the innerHTML structure entirely if the CSS allows.
                    // Or we just format the strong tag to have breaks?
                    
                    // Let's check the user request: "The tool tip should also show if it is Public Provider ... or Unresolved"
                    // Since it's a line chart with 'index' interaction, we have values for all 4 categories for that day.
                    // We should list them.
                    
                    let contentHtml = `<div style="text-align: left; margin-bottom: 4px; font-size: 14px;"><strong>${title[0]} ${monthName}</strong></div>`;
                    
                    dataPoints.forEach(point => {
                           // Remove filtered check to show 0 values if hovered directly, matching 'nearest' behavior
                           const color = point.dataset.borderColor;
                           contentHtml += `<div style="font-size: 14px; color: #404040; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                                              <span style="display:flex; align-items:center; gap:4px;"><span style="width:6px; height:6px; border-radius:50%; background-color:${color}; display:inline-block; flex-shrink: 0;"></span> ${point.dataset.label}</span>
                                              <strong>${point.raw}</strong>
                                           </div>`;
                    });
                    
                    // We need to inject this into tooltipEl. 
                    // The existing structure is rigid (strong, span). We might need to replace innerHTML of tooltipEl content container.
                    // tooltipEl -> background image bubble.
                    // Let's replace the whole inner content if possible or target a container?
                    // Previous code: tooltipEl.querySelector("strong").innerHTML = ...
                    
                    // Let's rewrite the tooltipEl HTML structure on the fly?
                    // But we need to keep the background style.
                    // Let's try to overwrite the internal text container.
                    // Assuming the tooltip is empty initially or we can clear it.
                    
                    // Warning: The CSS for .custom-tooltip sets specific width/height (125x62).
                    // If we add a list, it will overflow or break.
                    // We might need to adjust height dynamically or override it.
                    tooltipEl.style.height = "auto";
                    tooltipEl.style.padding = "10px";
                    tooltipEl.style.backgroundImage = "none"; // Remove fixed bubble bg if we are expanding it
                    tooltipEl.style.backgroundColor = "#fff"; // Use white bg
                    tooltipEl.style.borderRadius = "8px";
                    tooltipEl.style.border = "1px solid #ededed";
                    
                    tooltipEl.innerHTML = contentHtml;
                }

                const activePoints = chart.tooltip._active || [];
                if(activePoints.length > 0){
                    const x = activePoints[0].element.x;
                    // Find highest point (smallest y value)
                    const minY = Math.min(...activePoints.map(p => p.element.y));
                    
                    tooltipEl.style.opacity = 1;
                    tooltipEl.style.display = "block";
                    tooltipEl.style.left = x + "px";
                    tooltipEl.style.top = (minY - 10) + "px";
                    tooltipEl.style.transform = "translate(-50%, -100%)"; // Center above point
                    tooltipEl.style.pointerEvents = "none"; // Ensure it doesn't block mouse
                }
              },
            },
          },
          interaction: { intersect: false, mode: "nearest" },
          scales: {
            x: {
              grid: { color: "#eee", drawTicks: false },
              ticks: { color: "#000", padding: 10 },
              border: { display: true, color: "#ccc" },
              title: {
                 display: true,
                 text: 'Days',
                 color: '#666',
                 font: { size: 12, weight: 'bold' }
              }
            },
            y: {
              grid: { display: false },
              ticks: { 
                  display: true,
                  precision: 0 // Ensure integers
              },
              beginAtZero: true,
              title: {
                 display: true,
                 text: 'Values',
                 color: '#666',
                 font: { size: 12, weight: 'bold' }
              }
            },
          },
           layout: { padding: { left: 0, right: 0 } },
        },
        plugins: [
            customSelectorPlugin, 
            {
              id: "hideGridBottomBand",
              afterDraw: (chart) => {
                const { ctx, chartArea } = chart;
                if (!chartArea) return;
                const bandHeight = 12;
                ctx.save();
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(chartArea.left, chartArea.bottom - bandHeight/2, chartArea.width, bandHeight);
                ctx.restore();
              }
            }
        ]
      };
      
      selectorImg.onload = () => {
          if(window.myDashboardChart) window.myDashboardChart.update();
      };

      window.myDashboardChart = new Chart(ctx, config);
  }

  // Execute
  fetchUserInfo();
  fetchRequests();
  initMonthDropdown();

  // --- Month Dropdown & API Logic ---
  function initMonthDropdown() {
      const dropdown = document.getElementById('month-dropdown');
      if (!dropdown) return;
  
      const trigger = dropdown.querySelector('.dropdown-trigger');
      const valueSpan = dropdown.querySelector('.selected-value');
      const menu = dropdown.querySelector('.dropdown-menu');
  
      // 1. Generate Months
      const months = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
      ];
  
      const currentMonthIndex = new Date().getMonth(); // 0-11
      
      // Set Default Text
      valueSpan.textContent = months[currentMonthIndex];
  
      // Populate Menu
      menu.innerHTML = '';
      months.forEach((m, i) => {
          const item = document.createElement('div');
          item.className = 'dropdown-item';
          // API expects 1-based index (e.g., ?month=1 for Jan)
          item.dataset.value = i + 1; 
          item.textContent = m;
          
          if (i === currentMonthIndex) {
              item.classList.add('selected');
          }
          
          item.addEventListener('click', (e) => {
              e.stopPropagation();
              // Update UI
              valueSpan.textContent = m;
              dropdown.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('selected'));
              item.classList.add('selected');
              dropdown.classList.remove('active');
              
              // Fetch Data
              fetchMonthData(i + 1);
          });
          
          menu.appendChild(item);
      });
  
      // Toggle Dropdown
      trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('active');
      });
  
      // Close on click outside
      document.addEventListener('click', (e) => {
          if (!dropdown.contains(e.target)) {
              dropdown.classList.remove('active');
          }
      });
  }
  
  function renderErrorState(container, onRetry, restoreHtml) {
      if (!container) return;
      
      container.innerHTML = `
          <div class="fetch-error-state">
              <div class="error-icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
              </div>
              <h3 class="error-title">Failed to load data</h3>
              <p class="error-desc">We couldn't fetch the latest stats. Please try again.</p>
              <button class="retry-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
              </button>
          </div>
      `;
      
      const btn = container.querySelector('.retry-btn');
      if (btn && onRetry) {
          btn.addEventListener('click', (e) => {
              e.stopPropagation(); // Prevent dropdown toggles etc
              // Restore functionality if restoreHtml is passed
              if (restoreHtml) {
                container.innerHTML = restoreHtml;
              }
              onRetry();
          });
      }
  }
  
  async function fetchMonthData(monthIndex) {
      const token = localStorage.getItem("authToken");
      if (!token) return;
  
      // Show loading state
      const donutContainer = document.querySelector(".chart-donut-container");
      if (donutContainer) {
         donutContainer.innerHTML = `
          <div class="chart-loading-state">
              <div class="chart-spinner"></div>
              <span class="chart-loading-text">Loading
                data...</span>
          </div>`;
      }
  
      try {
          const url = `https://api.stopreg.com/api/v1/user/info/requests?month=${monthIndex}`;
          const response = await fetch(url, {
               method: "GET",
               headers: {
                   "Content-Type": "application/json",
                   "Authorization": `Bearer ${token}`
               }
          });
  
          if (response.ok) {
              const result = await response.json();
              // Correctly access nested data structure: result.data.request
              const requests = result?.data?.docs || [];
              updateMonitoringCard(requests);
          } else {
               console.error("Failed to fetch month data");
               renderErrorState(donutContainer, () => fetchMonthData(monthIndex));
          }
      } catch (err) {
          console.error("Network error, fetching month data", err);
          renderErrorState(donutContainer, () => fetchMonthData(monthIndex));
      }
  }

    // ------------------------------------------------------
    // 3.1 FETCH API TOKEN (Default)
    // ------------------------------------------------------
    async function fetchApiToken() {
        const apiTokenEl = document.getElementById("api-token-text");
        if (!apiTokenEl) return;

        try {
            const response = await fetch("https://api.stopreg.com/api/v1/api-token/fetch/default", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                const tokenData = result?.data;
                const apiToken = tokenData?.token;
                console.log("apiToken", apiToken);

                if (apiToken) {
                    apiTokenEl.textContent = apiToken;
                    apiTokenEl.dataset.fullText = apiToken;

                    // Update Link Container if needed
                    const linkContainer = document.querySelector(".link-container");
                    // if (linkContainer) {
                    //     const newLink = ` https://api.stopreg.com/api/v1/check/${apiToken}?email=test@test.com`;
                    //     linkContainer.href = newLink;
                    //     const linkTitle = linkContainer.querySelector(".token-link-title");
                    //     if (linkTitle) linkTitle.textContent = newLink;
                    // }
                } else {
                    apiTokenEl.textContent = "No Default Token";
                }
            } else {
                const errorText = await response.text();
                console.error("Failed to fetch default API token. Status:", response.status, "Response:", errorText);
                let displayMsg = "Error loading token";
                try {
                    const errorJson = JSON.parse(errorText);
                    if(errorJson.message) displayMsg = errorJson.description;
                } catch (e) {
                    // Not JSON, keep default or use status
                    if(response.status !== 200) displayMsg = `Error: ${response.status}`;
                }
                apiTokenEl.textContent = displayMsg;
            }
        } catch (error) {
            console.error("Error fetching API token:", error);
            apiTokenEl.textContent = "Error loading token";
        }
    }

    // Call fetchApiToken along with other fetches
    fetchApiToken();

});


