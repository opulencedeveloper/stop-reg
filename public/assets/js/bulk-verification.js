
// document.addEventListener("DOMContentLoaded", () => {
//   const form = document.querySelector(".bulk-verification-form");
//   const submitBtn = form.querySelector(".bulk-verify-domain-btn");

//   const token = localStorage.getItem("authToken");

//   const bulkLinks = document.getElementById("bulk-links");
//   const disposableResult = document.getElementById("disposableResult");
 

//   function renderEmptyState() {
//   disposableResult.innerHTML = "";

//   const tr = document.createElement("tr");
//   tr.className = "empty-state";

//   const td = document.createElement("td");
//   td.className = "table-inner-inner";
//   td.colSpan = 1;

//   // Make the td a flex container to center content
//   td.style.display = "flex";
//   td.style.flexDirection = "column";
//   td.style.justifyContent = "center"; // vertical alignment
//   td.style.alignItems = "center";     // horizontal alignment
//   td.style.height = "200px"; // adjust height as needed to center vertically

//   const img = document.createElement("img");
//   img.src = "/assets/icons/empty.svg";
//   img.alt = "Empty state";
//   img.style.display = "block";

//   img.style.marginBottom = "10px"; // spacing between image and text

//   const text = document.createElement("p");
//   text.textContent = "Your verification status will show here.";

//   text.className = "empty-state-text"

//   td.appendChild(img);
//   td.appendChild(text);
//   tr.appendChild(td);
//   disposableResult.appendChild(tr);

//   downloadBtn.style.display = "none"; // hide download button when empty
// }

//   renderEmptyState();

//   const typingLine = document.createElement("div");
//   typingLine.className = "typing-line";
//   typingLine.contentEditable = "true";
//   bulkLinks.appendChild(typingLine);
//   typingLine.focus();

//   function placeCursor(el) {
//     const range = document.createRange();
//     const sel = window.getSelection();
//     range.selectNodeContents(el);
//     range.collapse(true);
//     sel.removeAllRanges();
//     sel.addRange(range);
//   }

//   function formatLinks() {
//     const text = typingLine.innerText.trim();
//     if (!text) return;

//     const links = text.split(/[\s,]+/).filter((v) => v.trim() !== "");

//     links.forEach((link) => {
//       const span = document.createElement("span");
//       span.textContent = link;
//       bulkLinks.insertBefore(span, typingLine);
//       bulkLinks.insertBefore(document.createElement("br"), typingLine);
//     });

//     typingLine.innerText = "";
//     placeCursor(typingLine);
//   }

//   typingLine.addEventListener("keydown", (e) => {
//     if ([" ", ",", "Enter"].includes(e.key)) {
//       e.preventDefault();
//       formatLinks();
//     }
//   });

//   bulkLinks.addEventListener("keyup", (e) => {
//     if ([" ", "Enter", ","].includes(e.key)) formatLinks();
//   });

//   bulkLinks.addEventListener("blur", formatLinks);

//   function getLinksArray() {
//     const links = Array.from(bulkLinks.querySelectorAll("span"))
//       .map((el) => el.textContent.trim())
//       .filter((v) => v !== "" && v !== "," && v.includes("."));

//     const lastInput = typingLine.innerText.trim();
//     if (lastInput && lastInput !== "," && lastInput.includes(".")) links.push(lastInput);

//     return [...new Set(links)];
//   }

//   // ----------------- Table Population & Download -----------------
//   function populateTable(disposal) {
//     disposableResult.innerHTML = "";

//     if (!disposal || disposal.length === 0 || !token) {
//       renderEmptyState();
//       return;
//     }

//     disposal.forEach((item) => {
//       const tr = document.createElement("tr");
//       tr.className = "bulks-table-inner";

//       const td = document.createElement("td");
//       td.className = "table-inner-inner";
//       td.innerHTML = `
//         ${item.domain}
//         <div class="row-status-cont">
//           <p class="status-cont"><span>Disposable:</span> ${item.isDisposable ? "Yes" : "No"}</p>
//           <p class="status-cont"><span>UNRESOLVABLE:</span> ${item.isUnresolvable ? "Yes" : "No"}</p>
//           <p class="status-cont"><span>ERROR:</span> ${item.isError ? "Yes" : "No"}</p>
//         </div>
//       `;

//       tr.appendChild(td);
//       disposableResult.appendChild(tr);
//     });

//     downloadBtn.style.display = "inline-block"; // show button only if data exists
//   }

//   function downloadTableData() {
//     const rows = Array.from(disposableResult.querySelectorAll("tr"));
//     if (rows.length === 0) return;

//     let csvContent = "Domain,Disposable,UNRESOLVABLE,ERROR\n";

//     rows.forEach((tr) => {
//       const td = tr.querySelector(".table-inner-inner");
//       if (!td) return;

//       const domain = td.childNodes[0]?.textContent?.trim() || "";
//       const statuses = Array.from(td.querySelectorAll("p.status-cont")).map(p =>
//         p.textContent.split(':')[1].trim()
//       );
//       const [disposable, unresolvable, error] = statuses;

//       csvContent += `${domain},${disposable || ""},${unresolvable || ""},${error || ""}\n`;
//     });

//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "bulk-verification-results.csv";
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//   }

//   downloadBtn.addEventListener("click", downloadTableData);
//   // ---------------------------------------------------------------

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();
//     if (!token) return (window.location.href = "/");

//     const links = getLinksArray();
//     if (links.length === 0) return alert("Please enter at least one domain or email address.");

//     const originalText = submitBtn.textContent;
//     submitBtn.disabled = true;
//     submitBtn.innerHTML = `<span class="btn-spinner"></span> Verifying...`;

//     try {
//       const response = await fetch(
//         "https://api-stop-reg.onrender.com/api/v1/email-domains/bulk-verification",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ domains: links }),
//         }
//       );

//       const data = await response.json();
//       if (response.ok) {
//         populateTable(data?.data || []);
//         bulkLinks.innerHTML = "";
//         bulkLinks.appendChild(typingLine);
//         typingLine.innerText = "";
//         typingLine.focus();
//       } else {
//         alert(data.description || data.message || "Verification failed!");
//       }
//     } catch (err) {
//       console.error(err);
//     } finally {
//       submitBtn.disabled = false;
//       submitBtn.textContent = originalText;
//     }
//   });
// });

// document.addEventListener("DOMContentLoaded", () => {
//   const form = document.querySelector(".bulk-verification-form");
//   const submitBtn = form.querySelector(".bulk-verify-domain-btn");

//   const token = localStorage.getItem("authToken");

//   const bulkLinks = document.getElementById("bulk-links");
//   const disposableResult = document.getElementById("disposableResult");
//   const downloadBtn = document.getElementById("bulk-domain-download");

//   downloadBtn.classList.add("hidden"); // hide by default

//   // Store the API response data for CSV download
//   let storedResponseData = [];

//   // Hide spinner since this page doesn't fetch initial data
//   if (typeof window.hideSpinner === 'function') {
//     window.hideSpinner();
//   }

//   function renderEmptyState() {
//   disposableResult.innerHTML = "";

//   const tr = document.createElement("tr");
//   tr.className = "empty-state";

//   const td = document.createElement("td");
//   td.className = "table-inner-inner";
//   td.colSpan = 1;

//   // Make the td a flex container to center content
//   td.style.display = "flex";
//   td.style.flexDirection = "column";
//   td.style.justifyContent = "center"; // vertical alignment
//   td.style.alignItems = "center";     // horizontal alignment
//   td.style.height = "200px"; // adjust height as needed to center vertically

//   const img = document.createElement("img");
//   img.src = "/assets/icons/empty.svg";
//   img.alt = "Empty state";
//   img.style.display = "block";

//   img.style.marginBottom = "10px"; // spacing between image and text

//   const text = document.createElement("p");
//   text.textContent = "Your verification status will show here.";

//   text.className = "empty-state-text"

//   td.appendChild(img);
//   td.appendChild(text);
//   tr.appendChild(td);
//   disposableResult.appendChild(tr);

//   downloadBtn.classList.add("hidden"); // hide download button when empty
// }

//   renderEmptyState();

//   // Function to extract domain from URL
//   function extractDomain(input) {
//     let cleaned = input.trim();
    
//     // Remove protocol (http://, https://, ftp://, etc.)
//     cleaned = cleaned.replace(/^https?:\/\//i, '');
//     cleaned = cleaned.replace(/^ftp:\/\//i, '');
    
//     // Remove www. prefix
//     cleaned = cleaned.replace(/^www\./i, '');
    
//     // Remove trailing slash and path
//     cleaned = cleaned.split('/')[0];
    
//     // Remove port if present
//     cleaned = cleaned.split(':')[0];
    
//     // Remove query parameters and fragments
//     cleaned = cleaned.split('?')[0];
//     cleaned = cleaned.split('#')[0];
    
//     return cleaned.trim();
//   }

//   // Validation function for email and domain
//   function isValidEmailOrDomain(input) {
//     const trimmed = input.trim();
//     if (!trimmed) return false;

//     // Email regex pattern
//     const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
//     // Domain regex pattern
//     const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

//     // Check if it's a valid email
//     if (emailPattern.test(trimmed)) {
//       return true;
//     }

//     // Extract domain from URL if it contains protocol
//     const extractedDomain = extractDomain(trimmed);
    
//     // Check if extracted domain is valid
//     if (extractedDomain && extractedDomain.length > 0) {
//       if (domainPattern.test(extractedDomain)) {
//         return true;
//       }
//     }
    
//     // Also check the original input as a domain (in case it's already a clean domain)
//     if (domainPattern.test(trimmed)) {
//       return true;
//     }

//     return false;
//   }

//   // Format textarea content - put each item on a new line
//   function formatTextarea() {
//     const text = bulkLinks.value;
//     if (!text) return;

//     // Split by space, comma, or newline
//     const items = text.split(/[\s,\n]+/).filter((v) => v.trim() !== "");
//     const formattedItems = [];
//     const invalidItems = [];

//     items.forEach((item) => {
//       const trimmed = item.trim();
//       if (trimmed && isValidEmailOrDomain(trimmed)) {
//         // Extract domain from URL if needed, keep email as is
//         const cleaned = trimmed.includes('@') ? trimmed : extractDomain(trimmed);
//         formattedItems.push(cleaned);
//       } else if (trimmed) {
//         invalidItems.push(trimmed);
//       }
//     });

//     // Show error for invalid items
//     if (invalidItems.length > 0) {
//       const errorMessage = `Invalid email/domain: ${invalidItems.join(", ")}`;
//       if (typeof iziToast !== 'undefined') {
//         iziToast.warning({
//           title: 'Invalid Input',
//           message: errorMessage,
//           position: "topRight",
//           timeout: 5000,
//           drag: false,
//           displayMode: 1,
//           zindex: 9999,
//         });
//       } else {
//         alert(errorMessage);
//       }
//     }

//     // Update textarea with formatted items (one per line)
//     if (formattedItems.length > 0) {
//       bulkLinks.value = formattedItems.join('\n');
//     }
//   }

//   // Handle input events - format when space or comma is typed
//   let lastValue = '';
//   bulkLinks.addEventListener("input", (e) => {
//     const value = bulkLinks.value;
//     const cursorPos = bulkLinks.selectionStart;
    
//     // Check if space or comma was just added
//     if (value.length > lastValue.length) {
//       const addedChar = value[cursorPos - 1];
//       if (addedChar === ' ' || addedChar === ',') {
//         // Format the textarea after a short delay to allow the character to be added
//         setTimeout(() => {
//           formatTextarea();
//           // Set cursor to end
//           bulkLinks.setSelectionRange(bulkLinks.value.length, bulkLinks.value.length);
//         }, 10);
//       }
//     }
    
//     lastValue = value;
//   });

//   // Handle paste events
//   bulkLinks.addEventListener("paste", (e) => {
//     setTimeout(() => {
//       formatTextarea();
//       bulkLinks.setSelectionRange(bulkLinks.value.length, bulkLinks.value.length);
//     }, 10);
//   });

//   function getLinksArray() {
//     // Get text from textarea and split by newlines
//     const text = bulkLinks.value.trim();
//     if (!text) return [];

//     // Split by newline, space, or comma, then filter and validate
//     const items = text.split(/[\n\s,]+/).filter((v) => v.trim() !== "");
//     const links = [];

//     items.forEach((item) => {
//       const trimmed = item.trim();
//       if (trimmed && isValidEmailOrDomain(trimmed)) {
//         // Extract domain from URL if needed, keep email as is
//         const cleaned = trimmed.includes('@') ? trimmed : extractDomain(trimmed);
//         if (cleaned && cleaned.length > 0) {
//           links.push(cleaned);
//         }
//       }
//     });

//     // Remove duplicates and return as array
//     const uniqueLinks = [...new Set(links)];
//     console.log("Links array for submission:", uniqueLinks);
//     return uniqueLinks;
//   }

//   // ----------------- Table Population & Download -----------------
//   function populateTable(disposal) {
//     disposableResult.innerHTML = "";

//     if (!disposal || disposal.length === 0) {
//       renderEmptyState();
//       storedResponseData = []; // Clear stored data
//       return;
//     }

//     // Store the response data for CSV download
//     storedResponseData = disposal;

//     disposal.forEach((item) => {
//       const tr = document.createElement("tr");
//       tr.className = "bulks-table-inner";

//       const td = document.createElement("td");
//       td.className = "table-inner-inner";
//       td.innerHTML = `
//         ${item.domain}
//         <div class="row-status-cont">
//           <p class="status-cont"><span>Disposable:</span> ${item.isDisposable ? "Yes" : "No"}</p>

//         </div>
//       `;

//       tr.appendChild(td);
//       disposableResult.appendChild(tr);
//     });

//     downloadBtn.classList.remove("hidden"); // show button only if data exists
//   }

//   function downloadTableData() {
//     if (storedResponseData.length === 0) return;

//     // Use the actual data array from the API response
//     let csvContent = "Domain,Disposable\n";

//     storedResponseData.forEach((item) => {
//       const domain = item.domain || "";
//       const disposable = item.isDisposable ? "Yes" : "No";
//       csvContent += `${domain},${disposable}\n`;
//     });

//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "bulk-verification-results.csv";
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//   }

//   downloadBtn.addEventListener("click", downloadTableData);
//   // ---------------------------------------------------------------

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();
//     if (!token) return (window.location.href = "/");

//     const links = getLinksArray();
//     if (links.length === 0) {
//       if (typeof iziToast !== 'undefined') {
//         iziToast.warning({
//           title: 'Warning',
//           message: "Please enter at least one domain or email address.",
//           position: "topRight",
//           timeout: 5000,
//           drag: false,
//           displayMode: 1,
//           zindex: 9999,
//         });
//       } else {
//         alert("Please enter at least one domain or email address.");
//       }
//       return;
//     }

//     const originalText = submitBtn.textContent;
//     submitBtn.disabled = true;
//     submitBtn.innerHTML = `<span class="btn-spinner"></span> Verifying...`;
//  console.log("called")
//     try {
//       const response = await fetch(
//         "https://api-stop-reg.onrender.com/api/v1/email-domains/bulk-verification",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ domains: links }),
//         }
//       );

//       const data = await response.json();

//        console.log("dara", data)
//       if (response.ok) {
//         populateTable(data?.data || []);
//         bulkLinks.value = ""; 
//       } else {
//         const errorMessage = data.description || data.message || "Verification failed!";
//         if (typeof iziToast !== 'undefined') {
//           iziToast.error({
//             title: 'Error',
//             message: errorMessage,
//             position: "topRight",
//             timeout: 5000,
//             drag: false,
//             displayMode: 1,
//             zindex: 9999,
//           });
//         } else {
//           alert(errorMessage);
//         }
//       }
//     } catch (err) {
//       console.error(err);
//     } finally {
//       submitBtn.disabled = false;
//       submitBtn.textContent = originalText;
//     }
//   });
// });
