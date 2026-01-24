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

  // Store the API response data for CSV download
  let storedResponseData = [];

  function renderEmptyState() {
    if (!disposableResult) return;
    disposableResult.innerHTML = "";

    const tr = document.createElement("tr");
    tr.className = "empty-state";

    const td = document.createElement("td");
    td.className = "table-inner-inner";
    td.colSpan = 1;

    td.style.display = "flex";
    td.style.flexDirection = "column";
    td.style.justifyContent = "center";
    td.style.alignItems = "center";
    td.style.height = "200px";

    const img = document.createElement("img");
    img.src = "/assets/icons/empty.svg";
    img.alt = "Empty state";
    img.style.display = "block";
    img.style.marginBottom = "10px";

    const text = document.createElement("p");
    text.textContent = "Your verification status will show here.";
    text.className = "empty-state-text";

    td.appendChild(img);
    td.appendChild(text);
    tr.appendChild(td);
    disposableResult.appendChild(tr);

    if (downloadBtn) downloadBtn.classList.add("hidden");
  }

  // renderEmptyState(); // Commented out to show static placeholders by default

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
    bulkLinks.addEventListener("input", (e) => {
      const value = bulkLinks.value;
      const cursorPos = bulkLinks.selectionStart;
      if (value.length > lastValue.length) {
        const addedChar = value[cursorPos - 1];
        if (addedChar === ' ' || addedChar === ',') {
          setTimeout(() => {
            formatTextarea();
            bulkLinks.setSelectionRange(bulkLinks.value.length, bulkLinks.value.length);
          }, 10);
        }
      }
      lastValue = value;
    });

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

  function populateTable(disposal) {
    if (!disposableResult) return;
    disposableResult.innerHTML = "";
    if (!disposal || disposal.length === 0) {
      renderEmptyState();
      storedResponseData = [];
      return;
    }
    storedResponseData = disposal;
    disposal.forEach((item) => {
      const tr = document.createElement("tr");
      tr.className = "bulks-table-inner";
      const td = document.createElement("td");
      td.className = "table-inner-inner";
      td.innerHTML = `
        ${item.domain}
        <div class="row-status-cont">
          <p class="status-cont"><span>Disposable:</span> ${item.isDisposable ? "Yes" : "No"}</p>
        </div>
      `;
      tr.appendChild(td);
      disposableResult.appendChild(tr);
    });
    if (downloadBtn) downloadBtn.classList.remove("hidden");
  }

  function downloadTableData() {
    if (storedResponseData.length === 0) return;
    let csvContent = "Domain,Disposable\n";
    storedResponseData.forEach((item) => {
      const domain = item.domain || "";
      const disposable = item.isDisposable ? "Yes" : "No";
      csvContent += `${domain},${disposable}\n`;
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-verification-results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (downloadBtn) downloadBtn.addEventListener("click", downloadTableData);

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!token) return (window.location.href = "/");
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
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="btn-spinner"></span> Verifying...`;
      try {
        const response = await fetch("https://api-stop-reg.onrender.com/api/v1/email-domains/bulk-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ domains: links }),
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
        submitBtn.textContent = originalText;
      }
    });
  }
});
