class ProviderPageLoader {
  constructor() {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.apiBaseUrl = isDev
      ? "http://localhost:8080/api/v1/seo"
      : "https://api.stopreg.com/api/v1/seo";
    this.init();
  }

  init() {
    this.loadProviderData();
  }

  async loadProviderData() {
    try {
      const path = window.location.pathname;
      const providerMatch = path.match(/^\/provider\/([^/]+)$/);

      if (!providerMatch) {
        return;
      }

      const provider = decodeURIComponent(providerMatch[1]);
      await this.fetchProviderDnsData(provider);
    } catch (error) {
      console.error('Error loading provider data:', error);
    }
  }

  async fetchProviderDnsData(provider) {
    try {
      const url = `${this.apiBaseUrl}/dns/provider/${encodeURIComponent(provider)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const dnsData = result.data;

      if (dnsData) {
        this.populateMxRecords(dnsData);
        this.populateSpfRecord(dnsData);
        this.populateDmarcRecord(dnsData);
        this.populateDkimRecords(dnsData);
        this.populateNsRecords(dnsData);
        this.populateIpAddresses(dnsData);
        this.populatePtrRecords(dnsData);
        this.populateFullDnsRecords(dnsData);
        this.populateMailInfrastructureSummary(dnsData);
        this.populateMailServerInfo(dnsData);
        this.populateModalSections(dnsData);
      }

      this.markAllDnsCardsAsLoaded();
    } catch (error) {
      console.error('Error fetching provider DNS data:', error);
      this.markAllDnsCardsAsLoaded();
    }
  }

  populateMxRecords(dnsData) {
    const tbody = document.getElementById('dns-mx-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const mxRecords = dnsData.mxRecords || [];

    if (mxRecords.length > 0) {
      mxRecords.forEach((record) => {
        const tr = document.createElement('tr');
        const priority = record.priority || 'N/A';
        const host = record.exchange || 'N/A';
        tr.innerHTML = `<td>${this.escapeHtml(String(priority))}</td><td>${this.escapeHtml(host)}</td><td class="dns-mail-ttl">300</td>`;
        tbody.appendChild(tr);
      });
    }
  }

  populateSpfRecord(dnsData) {
    const container = document.getElementById('dns-spf-content');
    const titleEl = document.getElementById('dns-spf-title');
    const badgeEl = document.getElementById('dns-spf-badge');

    if (!container || !titleEl || !badgeEl) return;

    if (dnsData.spfRecords && dnsData.spfRecords.length > 0) {
      titleEl.textContent = `SPF RECORD${dnsData.spfRecords.length > 1 ? 'S' : ''}`;
      badgeEl.textContent = 'Found';
      badgeEl.style.display = 'inline-block';

      let html = '';
      dnsData.spfRecords.forEach((record) => {
        html += `<p class="dns-mail-record-text">${this.escapeHtml(record)}</p>`;
      });
      html += `<button type="button" class="dns-mail-link" data-modal-section="spf">View full SPF record<img src="/assets/icons/angle-right-blue.svg" alt="Arrow" class="dns-mail-link-icon" /></button>`;
      container.innerHTML = html;
    } else {
      titleEl.textContent = 'SPF RECORD';
      badgeEl.style.display = 'none';
      container.innerHTML = `<p class="dns-mail-record-text">No SPF RECORD found</p>`;
    }
  }

  populateDmarcRecord(dnsData) {
    const container = document.getElementById('dns-dmarc-content');
    if (!container) return;

    if (dnsData.dmarcRecords && dnsData.dmarcRecords.length > 0) {
      let html = `<div class="dns-mail-card-header"><span class="dns-mail-badge dns-mail-badge-found">Found</span></div>`;
      dnsData.dmarcRecords.forEach((record) => {
        html += `<p class="dns-mail-record-text">${this.escapeHtml(record)}</p>`;
      });
      html += `<button type="button" class="dns-mail-link" data-modal-section="dmarc">View full DMARC record<img src="/assets/icons/angle-right-blue.svg" alt="Arrow" class="dns-mail-link-icon" /></button>`;
      container.innerHTML = html;
    } else {
      container.innerHTML = `<p class="dns-mail-record-text">No DMARC RECORD found</p>`;
    }
  }

  populateDkimRecords(dnsData) {
    const container = document.getElementById('dns-dkim-content');
    if (!container) return;

    if (dnsData.dkimRecords && dnsData.dkimRecords.length > 0) {
      let html = `<div class="dns-mail-card-header"><span class="dns-mail-badge dns-mail-badge-verified">Verified</span></div>`;
      dnsData.dkimRecords.forEach((record) => {
        const displayRecord = record.length > 80 ? record.substring(0, 80) + '...' : record;
        html += `<p class="dns-mail-record-text">${this.escapeHtml(displayRecord)}</p>`;
      });
      html += `<button type="button" class="dns-mail-link" data-modal-section="dkim">View DKIM details<img src="/assets/icons/angle-right-blue.svg" alt="Arrow" class="dns-mail-link-icon" /></button>`;
      container.innerHTML = html;
    } else {
      container.innerHTML = `<p class="dns-mail-record-text">No DKIM RECORDS found</p>`;
    }
  }

  populateNsRecords(dnsData) {
    const tbody = document.getElementById('dns-ns-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const nsRecords = dnsData.dnsRecordsForDisplay?.filter((r) => r.type === 'NS') || [];
    nsRecords.forEach((record) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${this.escapeHtml(record.name)}</td><td>${this.escapeHtml(record.value)}</td><td>${this.escapeHtml(record.ttl)}</td>`;
      tbody.appendChild(tr);
    });
  }

  populateIpAddresses(dnsData) {
    const tbody = document.getElementById('dns-ip-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (dnsData.ipv4 && dnsData.ipv4.length > 0) {
      dnsData.ipv4.forEach((ip) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>IPv4</td><td>${this.escapeHtml(ip)}</td>`;
        tbody.appendChild(tr);
      });
    }
    if (dnsData.ipv6 && dnsData.ipv6.length > 0) {
      dnsData.ipv6.forEach((ip) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>IPv6</td><td>${this.escapeHtml(ip)}</td>`;
        tbody.appendChild(tr);
      });
    }
  }

  populatePtrRecords(dnsData) {
    const tbody = document.getElementById('dns-ptr-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const allIps = [];
    if (dnsData.ipv4) allIps.push(...dnsData.ipv4);
    if (dnsData.ipv6) allIps.push(...dnsData.ipv6);
    allIps.forEach((ip) => {
      const tr = document.createElement('tr');
      const ptrRecord = dnsData.ptrRecords?.[ip] || 'N/A';
      tr.innerHTML = `<td>${this.escapeHtml(ip)}</td><td>${this.escapeHtml(ptrRecord)}</td>`;
      tbody.appendChild(tr);
    });
  }

  populateFullDnsRecords(dnsData) {
    const desktopTbody = document.getElementById('dns-records-full-tbody');
    const mobileTbody = document.getElementById('dns-records-mobile-tbody');
    if (!desktopTbody || !mobileTbody) return;
    desktopTbody.innerHTML = '';
    mobileTbody.innerHTML = '';
    if (dnsData.dnsRecordsForDisplay && dnsData.dnsRecordsForDisplay.length > 0) {
      dnsData.dnsRecordsForDisplay.forEach((record) => {
        const desktopTr = document.createElement('tr');
        desktopTr.innerHTML = `<td>${this.escapeHtml(record.type)}</td><td>${this.escapeHtml(record.name)}</td><td>${this.escapeHtml(record.value)}</td><td class="dns-mail-ttl">${this.escapeHtml(record.ttl)}</td><td class="dns-mail-status"><span class="dns-mail-status-badge dns-mail-status-${record.status.toLowerCase()}">${this.escapeHtml(record.status)}</span></td>`;
        desktopTbody.appendChild(desktopTr);
        const mobileTr = document.createElement('tr');
        mobileTr.innerHTML = `<td>${this.escapeHtml(record.type)}</td><td><div class="dns-mail-name-value"><p>${this.escapeHtml(record.name)}</p><p>${this.escapeHtml(record.value)}</p></div></td><td class="dns-mail-ttl">${this.escapeHtml(record.ttl)}</td><td class="dns-mail-status"><span class="dns-mail-status-badge dns-mail-status-${record.status.toLowerCase()}">${this.escapeHtml(record.status)}</span></td>`;
        mobileTbody.appendChild(mobileTr);
      });
    }
  }

  populateMailInfrastructureSummary(dnsData) {
    const summaryList = document.getElementById('dns-summary-list');
    if (!summaryList) return;
    summaryList.innerHTML = '';
    if (dnsData.mailInfrastructureSummary) {
      Object.entries(dnsData.mailInfrastructureSummary).forEach(([label, value]) => {
        const row = document.createElement('div');
        row.className = 'dns-mail-summary-row';
        row.innerHTML = `<span class="dns-mail-summary-label">${this.escapeHtml(label)}</span><span class="dns-mail-summary-value">${this.escapeHtml(String(value))}</span>`;
        summaryList.appendChild(row);
      });
    }
  }

  populateMailServerInfo(dnsData) {
    const content = document.getElementById('dns-mail-server-content');
    if (!content) return;
    content.innerHTML = '';

    if (!dnsData.mailServerInfo) {
      return;
    }

    const info = dnsData.mailServerInfo;
    const html = `
      <div class="dns-mail-info-list">
        <div class="dns-mail-info-row">
          <span class="dns-mail-info-label">Hostname</span>
          <span class="dns-mail-info-value">${this.escapeHtml(info.hostname || 'N/A')}</span>
        </div>
        <div class="dns-mail-info-row">
          <span class="dns-mail-info-label">IP Address</span>
          <span class="dns-mail-info-value">${this.escapeHtml(info.ipAddress || 'N/A')}</span>
        </div>
        <div class="dns-mail-info-row">
          <span class="dns-mail-info-label">IP Location</span>
          <span class="dns-mail-info-value">${this.escapeHtml(info.ipLocation || 'N/A')}</span>
        </div>
        <div class="dns-mail-info-row">
          <span class="dns-mail-info-label">AS Number</span>
          <span class="dns-mail-info-value">${this.escapeHtml(info.asNumber || 'N/A')}</span>
        </div>
        <div class="dns-mail-info-row">
          <span class="dns-mail-info-label">ASN Name</span>
          <span class="dns-mail-info-value">${this.escapeHtml(info.asnName || 'N/A')}</span>
        </div>
      </div>
    `;
    content.innerHTML = html;
  }

  populateModalSections(dnsData) {
    const modalContent = document.querySelector('.dns-modal-content');
    if (!modalContent) return;

    let html = '';

    // MX Records Section
    if (dnsData.mxRecords && dnsData.mxRecords.length > 0) {
      html += `<div class="dns-modal-section" data-section-type="mx"><h3 class="dns-modal-section-title">MX Records</h3>`;
      dnsData.mxRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${this.escapeHtml(record.priority)} ${this.escapeHtml(record.exchange)}</code></div>`;
      });
      html += `</div>`;
    }

    // SPF Records Section
    if (dnsData.spfRecords && dnsData.spfRecords.length > 0) {
      html += `<div class="dns-modal-section" data-section-type="spf"><h3 class="dns-modal-section-title">SPF Record</h3>`;
      dnsData.spfRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${this.escapeHtml(record)}</code></div>`;
      });
      html += `</div>`;
    }

    // DMARC Records Section
    if (dnsData.dmarcRecords && dnsData.dmarcRecords.length > 0) {
      html += `<div class="dns-modal-section" data-section-type="dmarc"><h3 class="dns-modal-section-title">DMARC Record</h3>`;
      dnsData.dmarcRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${this.escapeHtml(record)}</code></div>`;
      });
      html += `</div>`;
    }

    // DKIM Records Section
    if (dnsData.dkimRecords && dnsData.dkimRecords.length > 0) {
      html += `<div class="dns-modal-section" data-section-type="dkim"><h3 class="dns-modal-section-title">DKIM Records</h3>`;
      dnsData.dkimRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${this.escapeHtml(record)}</code></div>`;
      });
      html += `</div>`;
    }

    // NS Records Section
    if (dnsData.dnsRecordsForDisplay) {
      const nsRecords = dnsData.dnsRecordsForDisplay.filter(r => r.type === 'NS');
      if (nsRecords.length > 0) {
        html += `<div class="dns-modal-section" data-section-type="ns"><h3 class="dns-modal-section-title">NS Records</h3>`;
        nsRecords.forEach(record => {
          html += `<div class="dns-record-full"><code>${this.escapeHtml(record.value)}</code></div>`;
        });
        html += `</div>`;
      }
    }

    // IP Addresses Section
    const allIps = (dnsData.ipv4 || []).concat(dnsData.ipv6 || []);
    if (allIps.length > 0) {
      html += `<div class="dns-modal-section" data-section-type="ips"><h3 class="dns-modal-section-title">IP Addresses</h3>`;
      allIps.forEach(ip => {
        html += `<div class="dns-record-full"><code>${this.escapeHtml(ip)}</code></div>`;
      });
      html += `</div>`;
    }

    // PTR Records Section
    if (dnsData.ptrRecords && allIps.length > 0) {
      html += `<div class="dns-modal-section" data-section-type="ptr"><h3 class="dns-modal-section-title">Reverse DNS (PTR)</h3>`;
      allIps.forEach(ip => {
        const ptr = dnsData.ptrRecords[ip] || 'N/A';
        html += `<div class="dns-record-full"><code>${this.escapeHtml(ip)} -> ${this.escapeHtml(ptr)}</code></div>`;
      });
      html += `</div>`;
    }

    modalContent.innerHTML = html;
  }

  markAllDnsCardsAsLoaded() {
    const containers = ['dns-mx-container', 'dns-spf-container', 'dns-dmarc-container', 'dns-dkim-container', 'dns-ns-container', 'dns-ip-container', 'dns-ptr-container', 'dns-records-full-container', 'dns-summary-container', 'dns-mail-server-container'];
    containers.forEach((containerId) => {
      const container = document.getElementById(containerId);
      if (container) {
        container.classList.remove('dns-mail-card-loading');
        const placeholder = container.querySelector('.rdap-placeholder-wrapper');
        const content = container.querySelector('.rdap-content');
        if (placeholder) placeholder.style.display = 'none';
        if (content) content.style.display = 'block';
      }
    });
  }

  escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new ProviderPageLoader();
  });
} else {
  new ProviderPageLoader();
}
