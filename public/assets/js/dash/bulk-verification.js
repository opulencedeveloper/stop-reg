document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".bulk-verification-form");
  const submitBtn = form.querySelector(".bulk-verify-domain-btn");

  const token = localStorage.getItem("authToken");

  const bulkLinks = document.getElementById("bulk-links");
  const disposableResult = document.getElementById("disposableResult");
  const downloadBtn = document.getElementById("bulk-domain-download");

  downloadBtn.style.display = "none"; // hide by default

  function renderEmptyState() {
  disposableResult.innerHTML = "";

  const tr = document.createElement("tr");
  tr.className = "empty-state";

  const td = document.createElement("td");
  td.className = "table-inner-inner";
  td.colSpan = 1;

  // Make the td a flex container to center content
  td.style.display = "flex";
  td.style.flexDirection = "column";
  td.style.justifyContent = "center"; // vertical alignment
  td.style.alignItems = "center";     // horizontal alignment
  td.style.height = "200px"; // adjust height as needed to center vertically

  const img = document.createElement("img");
  img.src = "/assets/icons/empty.svg";
  img.alt = "Empty state";
  img.style.display = "block";

  img.style.marginBottom = "10px"; // spacing between image and text

  const text = document.createElement("p");
  text.textContent = "Your verification status will show here.";

  text.className = "empty-state-text"

  td.appendChild(img);
  td.appendChild(text);
  tr.appendChild(td);
  disposableResult.appendChild(tr);

  downloadBtn.style.display = "none"; // hide download button when empty
}

  renderEmptyState();

  const typingLine = document.createElement("div");
  typingLine.className = "typing-line";
  typingLine.contentEditable = "true";
  bulkLinks.appendChild(typingLine);
  typingLine.focus();

  function placeCursor(el) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function formatLinks() {
    const text = typingLine.innerText.trim();
    if (!text) return;

    const links = text.split(/[\s,]+/).filter((v) => v.trim() !== "");

    links.forEach((link) => {
      const span = document.createElement("span");
      span.textContent = link;
      bulkLinks.insertBefore(span, typingLine);
      bulkLinks.insertBefore(document.createElement("br"), typingLine);
    });

    typingLine.innerText = "";
    placeCursor(typingLine);
  }

  typingLine.addEventListener("keydown", (e) => {
    if ([" ", ",", "Enter"].includes(e.key)) {
      e.preventDefault();
      formatLinks();
    }
  });

  bulkLinks.addEventListener("keyup", (e) => {
    if ([" ", "Enter", ","].includes(e.key)) formatLinks();
  });

  bulkLinks.addEventListener("blur", formatLinks);

  function getLinksArray() {
    const links = Array.from(bulkLinks.querySelectorAll("span"))
      .map((el) => el.textContent.trim())
      .filter((v) => v !== "" && v !== "," && v.includes("."));

    const lastInput = typingLine.innerText.trim();
    if (lastInput && lastInput !== "," && lastInput.includes(".")) links.push(lastInput);

    return [...new Set(links)];
  }

  // ----------------- Table Population & Download -----------------
  function populateTable(disposal) {
    disposableResult.innerHTML = "";

    if (!disposal || disposal.length === 0) {
      renderEmptyState();
      return;
    }

    disposal.forEach((item) => {
      const tr = document.createElement("tr");
      tr.className = "bulks-table-inner";

      const td = document.createElement("td");
      td.className = "table-inner-inner";
      td.innerHTML = `
        ${item.domain}
        <div class="row-status-cont">
          <p class="status-cont"><span>Disposable:</span> ${item.isDisposable ? "Yes" : "No"}</p>
          <p class="status-cont"><span>UNRESOLVABLE:</span> ${item.isUnresolvable ? "Yes" : "No"}</p>
          <p class="status-cont"><span>ERROR:</span> ${item.isError ? "Yes" : "No"}</p>
        </div>
      `;

      tr.appendChild(td);
      disposableResult.appendChild(tr);
    });

    downloadBtn.style.display = "inline-block"; // show button only if data exists
  }

  function downloadTableData() {
    const rows = Array.from(disposableResult.querySelectorAll("tr"));
    if (rows.length === 0) return;

    let csvContent = "Domain,Disposable,UNRESOLVABLE,ERROR\n";

    rows.forEach((tr) => {
      const td = tr.querySelector(".table-inner-inner");
      if (!td) return;

      const domain = td.childNodes[0]?.textContent?.trim() || "";
      const statuses = Array.from(td.querySelectorAll("p.status-cont")).map(p =>
        p.textContent.split(':')[1].trim()
      );
      const [disposable, unresolvable, error] = statuses;

      csvContent += `${domain},${disposable || ""},${unresolvable || ""},${error || ""}\n`;
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

  downloadBtn.addEventListener("click", downloadTableData);
  // ---------------------------------------------------------------

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!token) return (window.location.href = "/login.html");

    const links = getLinksArray();
    if (links.length === 0) return alert("Please enter at least one domain or email address.");

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span> Verifying...`;

    try {
      const response = await fetch(
        "https://api-stop-reg.onrender.com/api/v1/email-domains/bulk-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ domains: links }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        populateTable(data?.data || []);
        bulkLinks.innerHTML = "";
        bulkLinks.appendChild(typingLine);
        typingLine.innerText = "";
        typingLine.focus();
      } else {
        alert(data.description || data.message || "Verification failed!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
