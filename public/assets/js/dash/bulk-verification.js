document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".bulk-verification-form");
  const submitBtn = form.querySelector(".bulk-verify-domain-btn");

  const token = localStorage.getItem("authToken");

  const bulkLinks = document.getElementById("bulk-links");
  const disposableResult = document.getElementById("disposableResult");
  const downloadBtn = document.getElementById("bulk-domain-download");

  if (downloadBtn) downloadBtn.classList.add("hidden"); // hide by default

  // Support for dashboard spinner architecture
  // Since this page doesn't fetch data on load, but others might be loading,
  // we just call hideSpinner() to signal we're ready.
  if (typeof window.hideSpinner === 'function') {
    window.hideSpinner();
  }

  // Store the API response data for CSV download and pagination
  let storedResponseData = [];
  let currentPage = 1;
  let rowsPerPage = 6;
  let totalPages = 1;
  let totalDocs = 0;


  function renderEmptyState() {
    if (!disposableResult) return;
    disposableResult.innerHTML = "";

    const tr = document.createElement("tr");
    tr.className = "empty-state-row"; // Changed class slightly to distinguish

    const td = document.createElement("td");
    td.colSpan = 10; // Span all columns (SN, Input, Disp, Relay, Pub, Role, Alias, Prov, Block, MX)
    td.style.padding = "0";

    const container = document.createElement("div");
    container.className = "empty-state-animated";

    container.innerHTML = `
        <div class="empty-state-icon-wrapper">
             <img src="/assets/icons/search-status.svg" alt="No Results" onerror="this.src='/assets/icons/empty.svg'" />
        </div>
        <p class="empty-state-text">Ready to Verify</p>
        <p class="empty-state-subtext">Enter your list of domains or emails above and click Start Verification to see results.</p>
    `;

    td.appendChild(container);
    tr.appendChild(td);
    disposableResult.appendChild(tr);

    if (downloadBtn) downloadBtn.classList.add("hidden");
    
    // Hide pagination controls if empty
    const paginationContainer = document.querySelector('.table-pagination');
    if(paginationContainer) paginationContainer.style.display = 'none';
  }

  renderEmptyState(); // Show animated empty state by default

  // Function to extract domain from URL
  function extractDomain(input) {
    let cleaned = input.trim();
    cleaned = cleaned.replace(/^https?:\/\//i, '');
    cleaned = cleaned.replace(/^ftp:\/\//i, '');
    cleaned = cleaned.replace(/^www\./i, '');
    cleaned = cleaned.split('/')[0];
    cleaned = cleaned.split(':')[0];
    cleaned = cleaned.split('?')[0];
    cleaned = cleaned.split('#')[0];
    return cleaned.trim();
  }

  // Validation function for email and domain
  function isValidEmailOrDomain(input) {
    const trimmed = input.trim();
    if (!trimmed) return false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (emailPattern.test(trimmed)) return true;
    const extractedDomain = extractDomain(trimmed);
    if (extractedDomain && extractedDomain.length > 0 && domainPattern.test(extractedDomain)) return true;
    if (domainPattern.test(trimmed)) return true;
    return false;
  }

  // Format textarea content - put each item on a new line
  function formatTextarea() {
    if (!bulkLinks) return;
    const text = bulkLinks.value;
    if (!text) return;

    const items = text.split(/[\s,\n]+/).filter((v) => v.trim() !== "");
    const formattedItems = [];
    const invalidItems = [];

    items.forEach((item) => {
      const trimmed = item.trim();
      if (trimmed && isValidEmailOrDomain(trimmed)) {
        const cleaned = trimmed.includes('@') ? trimmed : extractDomain(trimmed);
        formattedItems.push(cleaned);
      } else if (trimmed) {
        invalidItems.push(trimmed);
      }
    });

    if (invalidItems.length > 0) {
      const errorMessage = `Invalid email/domain: ${invalidItems.join(", ")}`;
      if (typeof iziToast !== 'undefined') {
        iziToast.warning({
          title: 'Invalid Input',
          message: errorMessage,
          position: "topRight",
          timeout: 5000,
        });
      }
    }

    if (formattedItems.length > 0) {
      bulkLinks.value = formattedItems.join('\n');
    }
  }

  if (bulkLinks) {
    let lastValue = '';
    // Intercept Space key to create new line
    bulkLinks.addEventListener("keydown", (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        // Insert newline at cursor and move cursor after it
        bulkLinks.setRangeText('\n', bulkLinks.selectionStart, bulkLinks.selectionEnd, 'end');
      }
    });

    // Remove the previous complicated input listener
    // bulkLinks.addEventListener("input", (e) => { ... });

    bulkLinks.addEventListener("paste", (e) => {
      setTimeout(() => {
        formatTextarea();
        bulkLinks.setSelectionRange(bulkLinks.value.length, bulkLinks.value.length);
      }, 10);
    });
  }

  function getLinksArray() {
    if (!bulkLinks) return [];
    const text = bulkLinks.value.trim();
    if (!text) return [];
    const items = text.split(/[\n\s,]+/).filter((v) => v.trim() !== "");
    const links = [];
    items.forEach((item) => {
      const trimmed = item.trim();
      if (trimmed && isValidEmailOrDomain(trimmed)) {
        const cleaned = trimmed.includes('@') ? trimmed : extractDomain(trimmed);
        if (cleaned) links.push(cleaned);
      }
    });
    return [...new Set(links)];
  }

  function renderTablePage() {
    if (!disposableResult) return;
    disposableResult.innerHTML = "";

    if (storedResponseData.length === 0) {
      renderEmptyState();
      return;
    }

    const paginationContainer = document.querySelector('.table-pagination');
    if (paginationContainer) paginationContainer.style.display = totalPages > 1 ? '' : 'none';

    if (downloadBtn) downloadBtn.classList.remove("hidden");

    const startIndex = (currentPage - 1) * rowsPerPage;

    const formatValue = (val) => {
        if (val === true) return `<div class="status-badge status-bool-yes"><span>Yes</span></div>`;
        if (val === false) return '-';
        return val || '-';
    };

    storedResponseData.forEach((item, index) => {
        const tr = document.createElement("tr");
        const domain = item.domain || '-';
        const isDisposable = formatValue(item.isDiposableDomain);
        const isRelay = formatValue(item.isRelayDomain);
        const publicVal = item.publicProvider === 1;
        const isPublic = formatValue(publicVal);
        const isRole = formatValue(item.isRoleDomain);
        const isAlias = formatValue(item.isAliasDomain);
        const isProvider = item.provider || '-';
        const isBlocklisted = formatValue(item.isBlocklisted);
        const isMx = formatValue(item.hasMxRecords);
        const date = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-';
        const unresolvedVal = (item.unresolved || 0);
        const isUnresolvedBool = unresolvedVal > 0;
        const isUnresolved = isUnresolvedBool
            ? `<div class="status-badge status-bool-yes"><span>Yes</span></div>`
            : '-';

        tr.innerHTML = `
          <td>${startIndex + index + 1}</td>
          <td>${domain}</td>
          <td>${isProvider}</td>
          <td>${isUnresolved}</td>
          <td>${isDisposable}</td>
          <td>${isRelay}</td>
          <td>${isPublic}</td>
          <td>${isRole}</td>
          <td>${isAlias}</td>
          <td>${isBlocklisted}</td>
          <td>${isMx}</td>
          <td>${date}</td>
        `;
        disposableResult.appendChild(tr);
    });

    renderPaginationControls();
  }

  // Fetch Requests on Load
  const fetchRequests = async (page = 1) => {
    currentPage = page;

    if (disposableResult) {
        disposableResult.innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; padding: 40px;">
                    <div class="stopreg-spinner" style="border-top-color: #1452CA; border-right-color: #1452CA; margin: 0 auto;"></div>
                </td>
            </tr>
        `;
    }
    const paginationContainer = document.querySelector('.table-pagination');
    if (paginationContainer) paginationContainer.style.display = 'none';

    try {
        const response = await fetch(
            `https://api.stopreg.com/api/v1/user/info/requests?last30Days=true&page=${page}&limit=${rowsPerPage}&requestType=bulk`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const result = await response.json();

        if (await window.handleAuthError(response)) return;

        if (result.message === "success" && result.data && result.data.docs) {
            storedResponseData = result.data.docs;
            totalPages = result.data.meta.totalPages || 1;
            totalDocs = result.data.meta.totalDocs || 0;
            renderTablePage();
        } else {
            throw new Error(result.message || "Failed to load requests");
        }
    } catch (error) {
        console.error("Error fetching requests:", error);
        if (window.handleAuthError && await window.handleAuthError(error)) return;
        if (disposableResult) {
            disposableResult.innerHTML = `
                <tr>
                    <td colspan="12" style="text-align: center; color: var(--error-color); padding: 20px;">
                        Failed to load data. <button onclick="window.retryBulkFetch()" style="text-decoration: underline; background: none; border: none; cursor: pointer; color: inherit;">Retry</button>
                    </td>
                </tr>
            `;
        }
    }
  };

  // Expose for retry button
  window.retryBulkFetch = () => fetchRequests(currentPage);

  fetchRequests(1);

  function renderPaginationControls() {
      const controlsDiv = document.querySelector('.pagination-controls');
      if (!controlsDiv) return;

      const prev = controlsDiv.querySelector('.prev-btn');
      const next = controlsDiv.querySelector('.next-btn');

      if (prev) prev.disabled = currentPage === 1;
      if (next) next.disabled = currentPage === totalPages || totalPages === 0;

      controlsDiv.innerHTML = '';
      if (prev) controlsDiv.appendChild(prev);

      const addPageBtn = (pageNum) => {
          const btn = document.createElement('button');
          btn.className = `page-number ${pageNum === currentPage ? 'active' : ''}`;
          btn.textContent = pageNum;
          btn.addEventListener('click', () => fetchRequests(pageNum));
          controlsDiv.appendChild(btn);
      };

      const addDots = () => {
          const span = document.createElement('span');
          span.className = 'page-dots';
          span.textContent = '...';
          controlsDiv.appendChild(span);
      };

      if (totalPages <= 7) {
          for (let i = 1; i <= totalPages; i++) addPageBtn(i);
      } else {
          addPageBtn(1);
          if (currentPage > 3) addDots();

          const start = Math.max(2, currentPage - 1);
          const end = Math.min(totalPages - 1, currentPage + 1);
          for (let i = start; i <= end; i++) addPageBtn(i);

          if (currentPage < totalPages - 2) addDots();
          addPageBtn(totalPages);
      }

      if (next) controlsDiv.appendChild(next);
  }

  // Setup Pagination Event Listeners (Once)
  const paginationSelect = document.querySelector('.pagination-select');
  if (paginationSelect) {
      paginationSelect.addEventListener('change', (e) => {
          const val = parseInt(e.target.value);
          if (!isNaN(val)) {
              rowsPerPage = val;
              fetchRequests(1);
          }
      });
  }

  const prevBtn = document.querySelector('.prev-btn');
  if (prevBtn) {
      prevBtn.addEventListener('click', () => {
          if (currentPage > 1) fetchRequests(currentPage - 1);
      });
  }

  const nextBtn = document.querySelector('.next-btn');
  if (nextBtn) {
      nextBtn.addEventListener('click', () => {
          if (currentPage < totalPages) fetchRequests(currentPage + 1);
      });
  }

  function populateTable(disposal) {
    if (!disposableResult) return;
    disposableResult.innerHTML = "";
    if (!disposal || disposal.length === 0) {
      renderEmptyState();
      storedResponseData = [];
      return;
    }
    storedResponseData = disposal;
    currentPage = 1;

    renderTablePage();
   
    if (downloadBtn) downloadBtn.classList.remove("hidden");
  }

  async function downloadTableData() {
    if (storedResponseData.length === 0) return;
    
    // Send full request history to backend for CSV generation
    const requests = storedResponseData; 
    const originalText = downloadBtn.innerHTML; 
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Downloading...`;

    try {
        const response = await fetch("https://api.stopreg.com/api/v1/email-domains/bulk-verification-csv", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ requests }),
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "bulk-verification-results.csv";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            if (await window.handleAuthError(response)) {
                return;
            }
            const data = await response.json().catch(() => ({}));
            const errorMessage = data.description || data.message || "Download failed!";
            if (typeof iziToast !== 'undefined') {
                iziToast.error({ title: 'Error', message: errorMessage, position: "topRight" });
            }
        }
    } catch (err) {
        console.error(err);
        if (window.handleAuthError && await window.handleAuthError(err)) {
            return;
        }
        if (typeof iziToast !== 'undefined') {
            iziToast.error({ title: 'Network Error', message: "Failed to download CSV.", position: "topRight" });
        }
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalText;
    }
  }

  if (downloadBtn) downloadBtn.addEventListener("click", downloadTableData);

  // Lock Bulk Verification for Premium Users Only
  document.addEventListener("planLoaded", (e) => {
    const planName = e.detail;
    if (planName === "Free") {
        if (form) {
            form.innerHTML = `
               <div style="text-align:center; padding: 40px 20px; background: #f9f9fa; border-radius: 8px; border: 1px solid #e0e0e0; margin-top: 15px;">
                   <div style="margin-bottom: 16px;">
                       <img src="/assets/icons/bi_stars.svg" alt="Premium Feature" style="width: 48px; height: 48px; border-radius: 50%; background: #e8eefa; padding: 10px;">
                   </div>
                   <h3 style="color: #1A1D1F; font-size: 20px; font-weight: 700; margin-bottom: 12px;">Premium Feature</h3>
                   <p style="color: #6F767E; font-size: 15px; margin-bottom: 24px;">Bulk Verification is only available on premium plans. Upgrade your account to verify up to 10,000 domains at once.</p>
                   <a href="/dashboard/payments.html" class="bulk-verify-domain-btn" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; max-width: 200px; margin: 0 auto;">Upgrade Now</a>
               </div>
            `;
        }
        
        // Hide history table to emphasize locked state
        if (document.querySelector(".dash-inner-inner-verification-status")) {
            document.querySelector(".dash-inner-inner-verification-status").style.display = "none";
        }
        
        // Hide Download Button
        if (downloadBtn) downloadBtn.classList.add("hidden");
    }
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const links = getLinksArray();
      if (links.length === 0) {
        if (typeof iziToast !== 'undefined') {
          iziToast.warning({
            title: 'Warning',
            message: "Please enter at least one domain or email address.",
            position: "topRight",
          });
        }
        return;
      }
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Verifying...`;
      try {
        const response = await fetch("https://api.stopreg.com/api/v1/email-domains/bulk-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({  emailDomains: links }),
        });
        const data = await response.json();
        if (response.ok) {
          // Refetch table data to show updated history (background)
          fetchRequests();
          bulkLinks.value = "";
          if (typeof iziToast !== 'undefined') {
            iziToast.success({
              title: 'Success',
              message: "Bulk verification completed successfully!",
              position: "topRight",
            });
          }
        } else {
          if (await window.handleAuthError(response)) {
            return;
          }
          const errorMessage = data.description || data.message || "Verification failed!";
          if (typeof iziToast !== 'undefined') {
            iziToast.error({ title: 'Error', message: errorMessage, position: "topRight" });
          }
        }
      } catch (err) {
        console.error(err);
        if (window.handleAuthError && await window.handleAuthError(err)) {
          return;
        }
        if (typeof iziToast !== 'undefined') {
          iziToast.error({ title: 'Network Error', message: "Network error,  please try again later.", position: "topRight" });
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
});

