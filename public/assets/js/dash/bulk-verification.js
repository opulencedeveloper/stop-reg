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
    
    // Hide pagination controls as we are showing all data for 30 days
    const paginationContainer = document.querySelector('.table-pagination');
    if(paginationContainer) paginationContainer.style.display = 'none';

    // Show download button if we have data
    if (downloadBtn && storedResponseData.length > 0) {
        downloadBtn.classList.remove("hidden");
    } else if (downloadBtn) {
        downloadBtn.classList.add("hidden");
    }

    // No pagination slicing - show all data
    const displayedData = storedResponseData;

    // Helper for formatting values
    const formatValue = (val) => {
        if (val === true) return "Yes";
        if (val === false) return "No";
        return val || '-';
    };

    displayedData.forEach((item, index) => {
        const tr = document.createElement("tr");

        const domain = item.domain || '-';
        
        // Map API fields
        const isDisposable = formatValue(item.isDiposableDomain);
        const isRelay = formatValue(item.isRelayDomain);
        
        // Conversion for Public (0=False, 1=True)
        const publicVal = item.publicProvider === 1;
        const isPublic = formatValue(publicVal);
        
        const isRole = formatValue(item.isRoleDomain);
        const isAlias = formatValue(item.isAliasDomain);
        const isProvider = formatValue(item.isProvider); // 'Provider' column title, mapped to isProvider
        const isBlocklisted = formatValue(item.isBlocklisted);
        const isMx = formatValue(item.hasMxRecords);
        
        // Unresolved: 0=False(No/Green), 1=True(Yes/Red)
        const unresolvedVal = (item.unresolved || 0);
        const isUnresolvedBool = unresolvedVal > 0; // True if > 0 (1)
        const unresolvedText = isUnresolvedBool ? "Yes" : "No";
        const unresolvedColor = isUnresolvedBool ? "#cc0000" : "#008000";
        const isUnresolved = `<span style="color: ${unresolvedColor}">${unresolvedText}</span>`;

        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${domain}</td>
          <td>${isDisposable}</td>
          <td>${isRelay}</td>
          <td>${isPublic}</td>
          <td>${isRole}</td>
          <td>${isAlias}</td>
          <td>${isProvider}</td>
          <td>${isBlocklisted}</td>
          <td>${isMx}</td>
          <td>${isUnresolved}</td>
        `;
        disposableResult.appendChild(tr);

    });
    
    // No need to call renderPaginationControls()
  }

  // Fetch Requests on Load
  const fetchRequests = async () => {
    // Show Spinner
    if (disposableResult) {
        disposableResult.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 40px;">
                    <div class="stopreg-spinner" style="border-top-color: #1452CA; border-right-color: #1452CA; margin: 0 auto;"></div>
                </td>
            </tr>
        `;
    }

    try {
        // Fetch last 30 days requests with limit=0 (no limit)
        const response = await fetch(`https://api-stop-reg.onrender.com/api/v1/user/info/requests?last30Days=true&limit=0`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        
        if (response.status === 401) {
             localStorage.removeItem("authToken");
             localStorage.removeItem("role");
             window.location.href = "/sign-in.html";
             return;
        }

        if(result.message === "success" && result.data && result.data.docs) {
             storedResponseData = result.data.docs;
             renderTablePage();
        } else {
             // Fallback to error or empty state if weird response
             throw new Error(result.message || "Failed to load requests");
        }
    } catch (error) {
        console.error("Error fetching requests:", error);
        if (disposableResult) {
            disposableResult.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; color: var(--error-color); padding: 20px;">
                        Failed to load data. <button onclick="window.retryBulkFetch()" style="text-decoration: underline; background: none; border: none; cursor: pointer; color: inherit;">Retry</button>
                    </td>
                </tr>
            `;
        }
    }
  };
  
  // Expose for retry button
  window.retryBulkFetch = fetchRequests;
  
  fetchRequests();

  function renderPaginationControls() {
      const totalPages = Math.ceil(storedResponseData.length / rowsPerPage);
      const paginationContainer = document.querySelector('.table-pagination');
      
      if (totalPages <= 1) {
          // Hide pagination if only one page or no data (optional, or just disable buttons)
          // For now, let's just update the controls to show page 1 of 1
      }

      const prevBtn = document.querySelector('.prev-btn');
      const nextBtn = document.querySelector('.next-btn');
      const pageNumbersContainer = document.querySelector('.pagination-controls'); // Note: this contains prev/next buttons too in existing HTML structure, need to be careful.
      
      // Let's identify the specific container for numbers or recreate the middle part
      // The current HTML structure is: 
      // <div class="pagination-controls"> <button prev> <button 1> ... <button next> </div>
      // We will clear the middle buttons and re-inject them.
      
      // Select existing prev/next buttons
      if(prevBtn) prevBtn.disabled = currentPage === 1;
      if(nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;

      // Clean up old page numbers (remove all children between prev and next)
      const controlsDiv = document.querySelector('.pagination-controls');
      if(!controlsDiv) return;
      
      // Keep references to prev and next
      const prev = controlsDiv.querySelector('.prev-btn');
      const next = controlsDiv.querySelector('.next-btn');
      
      controlsDiv.innerHTML = '';
      if(prev) controlsDiv.appendChild(prev);

      // Generate page numbers
      // Simple logic: 1 ... current-1 current current+1 ... last
      // Or just simple all pages if count is low
      
      const addPageBtn = (pageNum) => {
          const btn = document.createElement('button');
          btn.className = `page-number ${pageNum === currentPage ? 'active' : ''}`;
          btn.textContent = pageNum;
          btn.addEventListener('click', () => {
              currentPage = pageNum;
              renderTablePage();
          });
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
          
          let start = Math.max(2, currentPage - 1);
          let end = Math.min(totalPages - 1, currentPage + 1);
          
          for (let i = start; i <= end; i++) addPageBtn(i);
          
          if (currentPage < totalPages - 2) addDots();
          addPageBtn(totalPages);
      }

      if(next) controlsDiv.appendChild(next);
  }

  // Setup Pagination Event Listeners (Once)
  const paginationSelect = document.querySelector('.pagination-select');
  if(paginationSelect) {
      paginationSelect.addEventListener('change', (e) => {
          const val = parseInt(e.target.value); // "6 per page" -> 6
          if(!isNaN(val)) {
              rowsPerPage = val;
              currentPage = 1;
              renderTablePage();
          }
      });
  }

  const prevBtn = document.querySelector('.prev-btn');
  if(prevBtn) {
      prevBtn.addEventListener('click', () => {
          if(currentPage > 1) {
              currentPage--;
              renderTablePage();
          }
      });
  }

  const nextBtn = document.querySelector('.next-btn');
  if(nextBtn) {
      nextBtn.addEventListener('click', () => {
          const totalPages = Math.ceil(storedResponseData.length / rowsPerPage);
          if(currentPage < totalPages) {
              currentPage++;
              renderTablePage();
          }
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
        const response = await fetch("https://api-stop-reg.onrender.com/api/v1/email-domains/bulk-verification-csv", {
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
            if (response.status === 401) {
                localStorage.removeItem("authToken");
                localStorage.removeItem("role");
                window.location.href = "/sign-in.html";
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
        if (typeof iziToast !== 'undefined') {
            iziToast.error({ title: 'Network Error', message: "Failed to download CSV.", position: "topRight" });
        }
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalText;
    }
  }

  if (downloadBtn) downloadBtn.addEventListener("click", downloadTableData);

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!token) return (window.location.href = "/sign-in.html");
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
        const response = await fetch("https://api-stop-reg.onrender.com/api/v1/email-domains/bulk-verification", {
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
          if (response.status === 401) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("role");
            window.location.href = "/sign-in.html";
            return;
          }
          const errorMessage = data.description || data.message || "Verification failed!";
          if (typeof iziToast !== 'undefined') {
            iziToast.error({ title: 'Error', message: errorMessage, position: "topRight" });
          }
        }
      } catch (err) {
        console.error(err);
        if (typeof iziToast !== 'undefined') {
          iziToast.error({ title: 'Network Error', message: "Network error — please try again later.", position: "topRight" });
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
});

