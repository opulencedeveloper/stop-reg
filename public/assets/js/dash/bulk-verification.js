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
    
    // Show pagination controls again
    const paginationContainer = document.querySelector('.table-pagination');
    if(paginationContainer) paginationContainer.style.display = 'flex'; // or 'block' depending on CSS, but usually flex for this design

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, storedResponseData.length);
    const displayedData = storedResponseData.slice(startIndex, endIndex);

    // Helper for formatting values
    const formatValue = (val) => {
        if (val === true) return "Yes";
        if (val === false) return "No";
        return val || '-';
    };

    displayedData.forEach((item, index) => {
        const tr = document.createElement("tr");

        const realIndex = startIndex + index + 1;
        const input = item.input || '-';
        const isDisposable = formatValue(item.disposable);
        const isRelay = formatValue(item.isRelay !== undefined ? item.isRelay : item.relay);
        const isPublic = formatValue(item.public);
        const isRole = formatValue(item.role);
        const isAlias = formatValue(item.alias);
        const provider = formatValue(item.provider);
        const isBlocklisted = formatValue(item.blocklisted);
        const hasMx = formatValue(item.mx);

        tr.innerHTML = `
          <td>${realIndex}</td>
          <td>${input}</td>
          <td>${isDisposable}</td>
          <td>${isRelay}</td>
          <td>${isPublic}</td>
          <td>${isRole}</td>
          <td>${isAlias}</td>
          <td>${provider}</td>
          <td>${isBlocklisted}</td>
          <td>${hasMx}</td>
        `;
        disposableResult.appendChild(tr);
    });
    
    renderPaginationControls();
  }

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
    
    // Extract just the input values (domains/emails) for the backend
    const emailDomains = storedResponseData.map(item => item.input);
    const originalText = downloadBtn.innerHTML; // Store innerHTML to preserve any structure if needed, or textContent
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Downloading...`;

    try {
        const response = await fetch("http://localhost:8080/api/v1/email-domains/bulk-verification-csv", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ emailDomains }),
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
        const response = await fetch("http://localhost:8080/api/v1/email-domains/bulk-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({  emailDomains: links }),
        });
        const data = await response.json();
        if (response.ok) {
          populateTable(data?.data || []);
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

