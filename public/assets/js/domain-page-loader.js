document.addEventListener('DOMContentLoaded', function() {

  const domainName = window.location.pathname.split('/').pop();
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const apiBaseUrl = isDev
    ? "http://localhost:8080/api/v1/seo"
    : "https://api.stopreg.com/api/v1/seo";
  const apiUrl = `${apiBaseUrl}/dns/domain/${domainName}`;


  async function loadDomainData() {
    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const response_data = await response.json();

      // Extract nested data object
      const data = response_data.data || response_data;


      // Populate domain overview section
      if (data.domainOverview) {
        populateDomainOverview(data.domainOverview);
      } else {
      }

      // Populate IP addresses section
      if (data.ipAddresses) {
        populateIpAddresses(data.ipAddresses);
      } else {
      }

      // Populate DNS & Mail Records section
      populateDnsRecordsSection(data);

      // Populate DNS Modal with full records
      populateDnsModal(data);

      // Populate WHOIS data if available
      if (data.whois) {
        console.log('[Domain Loader] WHOIS data received:', data.whois);
        populateWhoisData(data.whois);

        // Calculate and populate domain age
        if (data.whois.registrationDate) {
          populateDomainAge(data.whois.registrationDate);
        }
      } else {
        console.log('[Domain Loader] No WHOIS data in response. Full data:', data);
      }

    } catch (error) {
      console.error('[Domain Loader] Error:', error);
    }
  }

  function populateDomainOverview(overview) {

    const fields = [
      { id: 'domainAge', value: overview.domainAge || 'N/A' },
      { id: 'registrationDate', value: overview.registrationDate || 'N/A' },
      { id: 'registrar', value: overview.registrar || 'N/A' },
      { id: 'expirationDate', value: overview.expirationDate || 'N/A' }
    ];

    fields.forEach(({ id, value }) => {
      const valueSpan = document.getElementById(`${id}-value`);
      if (valueSpan) {
        valueSpan.textContent = value;
        valueSpan.style.display = 'block';
      }
      const placeholder = document.getElementById(`${id}-placeholder`);
      if (placeholder) {
        placeholder.style.display = 'none';
      }
    });
  }

  function populateIpAddresses(ipData) {

    const tbody = document.getElementById('ip-addresses-tbody');
    const cardsContainer = document.getElementById('ip-addresses-cards');
    if (!tbody || !cardsContainer) return;

    tbody.innerHTML = '';
    cardsContainer.innerHTML = '';

    if (!ipData || ipData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">No IP addresses found</td></tr>';
      cardsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;"><p>No IP addresses found</p></div>';
      return;
    }

    // Populate table
    ipData.forEach(ip => {
      const row = document.createElement('tr');
      row.className = 'ip-addresses-row';
      row.innerHTML = `
        <td class="ip-addresses-col-ip">${ip.ip || 'N/A'}</td>
        <td class="ip-addresses-col-type">${ip.type || 'N/A'}</td>
        <td class="ip-addresses-col-provider">${ip.provider || 'N/A'}</td>
        <td class="ip-addresses-col-country">${ip.country || 'N/A'}</td>
      `;
      tbody.appendChild(row);
    });

    // Populate mobile cards
    ipData.forEach(ip => {
      const card = document.createElement('div');
      card.className = 'ip-addresses-card';
      card.innerHTML = `
        <div class="ip-addresses-card-left">
          <span class="ip-addresses-card-ip">${ip.ip || 'N/A'}</span>
          <span class="ip-addresses-card-provider">${ip.provider || 'N/A'}</span>
        </div>
        <div class="ip-addresses-card-right">
          <span class="ip-addresses-card-type">${ip.type || 'N/A'}</span>
          <span class="ip-addresses-card-country">${ip.country || 'N/A'}</span>
        </div>
      `;
      cardsContainer.appendChild(card);
    });
  }

  function populateDnsRecordsSection(data) {

    const container = document.getElementById('dns-records-container');
    const contentDiv = document.getElementById('dns-records-content');


    if (!container || !contentDiv) {
      return;
    }


    // Build the entire DNS section HTML
    const dnsHtml = buildDnsHtml(data);

    contentDiv.innerHTML = dnsHtml;

    const allCards = contentDiv.querySelectorAll('.dns-record-card');
    allCards.forEach(card => {
      const type = card.getAttribute('data-record-type');
      const contentDiv = card.querySelector('.dns-record-content');
      const hasContent = contentDiv?.textContent?.trim?.()?.length > 0;
      const display = window.getComputedStyle(card).display;
      const visibility = window.getComputedStyle(card).visibility;
    });

    // Hide shimmer and show content
    const placeholder = container.querySelector('.rdap-placeholder-wrapper');
    if (placeholder) {
      placeholder.style.display = 'none';
    } else {
    }

    contentDiv.style.display = 'block';

    // Remove loading class
    container.classList.remove('dns-mail-card-loading');

    // Re-initialize DNS tabs since we've replaced the cards
    const tabs = container.querySelectorAll('.dns-tab');
    const tableWrapper = container.querySelector('.dns-table-wrapper');
    const recordsGrid = container.querySelector('.dns-records-grid');
    const recordCards = recordsGrid.querySelectorAll('.dns-record-card');
    const dnsNote = container.querySelector('.dns-note');


    // Re-attach tab click handlers
    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();

        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('dns-tab-active'));
        this.classList.add('dns-tab-active');

        const tabName = this.textContent.trim();
        const tabMap = {
          'MX Records': 'mx',
          'SPF': 'spf',
          'DMARC': 'dmarc',
          'DKIM': 'dkim',
          'A/AAAA': 'a',
          'NS': 'ns',
          'SOA': 'soa',
          'TXT': 'txt',
          'DNSSEC': 'dnssec'
        };
        const recordType = tabMap[tabName];

        if (recordType === 'mx') {
          tableWrapper.style.display = 'block';
          recordsGrid.style.display = 'none';
          if (dnsNote) dnsNote.style.display = 'flex';
        } else {
          tableWrapper.style.display = 'none';
          recordsGrid.style.display = 'grid';
          if (dnsNote) dnsNote.style.display = 'none';
          recordCards.forEach(card => {
            const cardType = card.getAttribute('data-record-type');
            const shouldShow = cardType === recordType;
            card.style.display = shouldShow ? 'block' : 'none';
          });
        }
      });
    });

    // Log final state
  }

  function buildDnsHtml(data) {
    return `
      <div class="dns-table-wrapper">
        <table class="dns-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Host</th>
              <th>Mail Server</th>
              <th>TTL</th>
            </tr>
          </thead>
          <tbody id="dns-mx-tbody-rendered">
            ${buildMxTableRows(data.mxRecords)}
          </tbody>
        </table>
      </div>

      <div class="dns-note">
        <img src="/assets/icons/caution.svg" alt="Info" class="dns-note-icon" />
        <p class="dns-note-text">MX records indicate that this domain can receive emails</p>
      </div>

      <div class="dns-records-grid">
        ${buildDnsCards(data)}
      </div>
    `;
  }

  function buildMxTableRows(mxRecords) {
    if (!mxRecords || mxRecords.length === 0) {
      return '<tr><td colspan="4" style="text-align: center; color: #999;">No MX records found</td></tr>';
    }

    return mxRecords.map(mx => `
      <tr>
        <td>${mx.priority || 'N/A'}</td>
        <td>${mx.exchange || mx.host || 'N/A'}</td>
        <td>${mx.host || mx.exchange || 'N/A'}</td>
        <td>${mx.ttl || 'N/A'}</td>
      </tr>
    `).join('');
  }

  function buildDnsCards(data) {

    const cards = [
      { type: 'spf', title: 'SPF RECORD', records: data.spfRecords, labelText: 'Status', defaultStatus: 'dns-status-valid', defaultLabel: 'Valid', sectionType: 'spf' },
      { type: 'dmarc', title: 'DMARC RECORD', records: data.dmarcRecords, labelText: 'Policy', defaultStatus: 'dns-status-neutral', defaultLabel: 'Found', sectionType: 'dmarc' },
      { type: 'dkim', title: 'DKIM STATUS', records: data.dkimRecords, labelText: 'Selector', defaultStatus: 'dns-status-valid', defaultLabel: 'Found', sectionType: 'dkim' },
      { type: 'a', title: 'A/AAAA RECORDS', records: buildARecords(data.aRecords, data.aaaaRecords), labelText: 'Count', defaultStatus: 'dns-status-valid', defaultLabel: `${(data.aRecords?.length || 0) + (data.aaaaRecords?.length || 0)} records`, sectionType: 'a' },
      { type: 'txt', title: 'TXT RECORDS', records: data.txtRecords, labelText: 'Count', defaultStatus: 'dns-status-valid', defaultLabel: `${data.txtRecords?.length || 0} records`, sectionType: 'txt' },
      { type: 'dnssec', title: 'DNSSEC', records: data.dnssecValid ? ['DNSSEC is implemented.'] : [], labelText: 'Status', defaultStatus: data.dnssecValid ? 'dns-status-valid' : 'dns-status-not-found', defaultLabel: data.dnssecValid ? 'Enabled' : 'Not Found', sectionType: 'dnssec' },
      { type: 'ns', title: 'NS RECORDS', records: data.nsRecords, labelText: 'Count', defaultStatus: 'dns-status-valid', defaultLabel: `${data.nsRecords?.length || 0} records`, sectionType: 'ns' },
      { type: 'soa', title: 'SOA RECORD', records: buildSoaRecords(data.soaRecords), labelText: 'Status', defaultStatus: 'dns-status-valid', defaultLabel: 'Found', sectionType: 'soa' }
    ];

    return cards.map(card => {
      const recordValue = buildRecordValue(card);
      const hasRecords = card.records && card.records.length > 0;

      const html = `
      <div class="dns-record-card" data-record-type="${card.type}" style="display: none;">
        <h4 class="dns-record-title">${card.title}</h4>
        <div class="dns-record-content">
          <p class="dns-record-value" style="${!card.records || card.records.length === 0 ? 'color: #999;' : ''}">${recordValue}</p>
          <div class="dns-record-status">
            <span class="dns-label">${card.labelText}</span>
            <span class="${card.defaultStatus}">${card.defaultLabel}</span>
          </div>
          ${hasRecords ? `
            <button type="button" class="dns-mail-link" data-modal-section="${card.sectionType}">
              View full ${card.title.toLowerCase()}
              <img src="/assets/icons/angle-right-blue.svg" alt="Arrow" class="dns-link-icon" />
              <img src="/assets/icons/chevron-right.svg" alt="Arrow" class="dns-link-icon-mobile" />
            </button>
          ` : ''}
        </div>
      </div>
    `;
      return html;
    }).join('');
  }

  function buildRecordValue(card) {

    if (!card.records || card.records.length === 0) {
      return 'Not Found';
    }

    if (Array.isArray(card.records[0])) {
      const value = card.records.map(r => Array.isArray(r) ? r.join(', ') : r).join('<br>');
      return value;
    }

    return card.records[0];
  }

  function buildARecords(aRecords, aaaaRecords) {
    const records = [];
    if (aRecords && aRecords.length > 0) {
      records.push(aRecords.join(', '));
    }
    if (aaaaRecords && aaaaRecords.length > 0) {
      records.push(aaaaRecords.join(', '));
    }
    return records;
  }

  function buildSoaRecords(soaRecords) {
    if (!soaRecords || !soaRecords[0]) return [];
    const soa = soaRecords[0];
    return [`NS: ${soa.nsname || 'N/A'}<br>Serial: ${soa.serial || 'N/A'}`];
  }

  function populateDnsModal(data) {
    const modalContent = document.querySelector('.dns-modal-content');
    if (!modalContent) return;

    let html = '';

    if (data.mxRecords && data.mxRecords.length > 0) {
      html += '<div class="dns-modal-section" data-section-type="mx"><h3 class="dns-modal-section-title">MX Records</h3>';
      data.mxRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${record.priority} ${record.exchange || record.host}</code></div>`;
      });
      html += '</div>';
    }

    if (data.spfRecords && data.spfRecords.length > 0) {
      html += '<div class="dns-modal-section" data-section-type="spf"><h3 class="dns-modal-section-title">SPF Record</h3>';
      data.spfRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${record}</code></div>`;
      });
      html += '</div>';
    }

    if (data.dmarcRecords && data.dmarcRecords.length > 0) {
      html += '<div class="dns-modal-section" data-section-type="dmarc"><h3 class="dns-modal-section-title">DMARC Record</h3>';
      data.dmarcRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${record}</code></div>`;
      });
      html += '</div>';
    }

    if (data.dkimRecords && data.dkimRecords.length > 0) {
      html += '<div class="dns-modal-section" data-section-type="dkim"><h3 class="dns-modal-section-title">DKIM Records</h3>';
      data.dkimRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${record}</code></div>`;
      });
      html += '</div>';
    }

    if (data.nsRecords && data.nsRecords.length > 0) {
      html += '<div class="dns-modal-section" data-section-type="ns"><h3 class="dns-modal-section-title">NS Records</h3>';
      data.nsRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${record}</code></div>`;
      });
      html += '</div>';
    }

    if (data.soaRecords && data.soaRecords.length > 0 && data.soaRecords[0]) {
      const soa = data.soaRecords[0];
      html += '<div class="dns-modal-section" data-section-type="soa"><h3 class="dns-modal-section-title">SOA Record</h3>';
      html += `<div class="dns-record-full"><code>NS: ${soa.nsname || 'N/A'}<br/>Serial: ${soa.serial || 'N/A'}<br/>Hostmaster: ${soa.hostmaster || 'N/A'}</code></div>`;
      html += '</div>';
    }

    if (data.aRecords && data.aRecords.length > 0) {
      html += '<div class="dns-modal-section" data-section-type="a"><h3 class="dns-modal-section-title">A Records</h3>';
      data.aRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${record}</code></div>`;
      });
      html += '</div>';
    }

    if (data.aaaaRecords && data.aaaaRecords.length > 0) {
      html += '<div class="dns-modal-section" data-section-type="aaaa"><h3 class="dns-modal-section-title">AAAA Records</h3>';
      data.aaaaRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${record}</code></div>`;
      });
      html += '</div>';
    }

    if (data.txtRecords && data.txtRecords.length > 0) {
      html += '<div class="dns-modal-section" data-section-type="txt"><h3 class="dns-modal-section-title">TXT Records</h3>';
      data.txtRecords.forEach(record => {
        html += `<div class="dns-record-full"><code>${record}</code></div>`;
      });
      html += '</div>';
    }

    if (data.dnssecValid) {
      html += '<div class="dns-modal-section" data-section-type="dnssec"><h3 class="dns-modal-section-title">DNSSEC</h3>';
      html += '<div class="dns-record-full"><code>DNSSEC is enabled for this domain</code></div>';
      html += '</div>';
    }

    modalContent.innerHTML = html;
  }

  function populateDomainAge(registrationDate) {
    try {
      const regDate = new Date(registrationDate);
      const now = new Date();
      const diffMs = now.getTime() - regDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);

      let ageText = 'N/A';
      if (years > 0) {
        ageText = `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
      } else if (months > 0) {
        ageText = `${months} month${months > 1 ? 's' : ''}`;
      } else {
        ageText = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
      }

      const ageElements = document.querySelectorAll('[data-whois-field="domainAge"]');
      ageElements.forEach(el => {
        el.textContent = ageText;
        el.classList.remove('shimmer', 'rdap-placeholder-inline');
        el.style.backgroundColor = 'transparent';
        el.style.animation = 'none';
      });
      console.log('[populateDomainAge] Domain age calculated:', ageText);
    } catch (err) {
      console.error('[populateDomainAge] Error calculating domain age:', err);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return null;
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  }

  function populateWhoisData(whois) {
    console.log('[populateWhoisData] Starting with whois:', whois);
    const fields = document.querySelectorAll('[data-whois-field]');
    console.log('[populateWhoisData] Found', fields.length, 'fields with data-whois-field attribute');

    fields.forEach(field => {
      const fieldName = field.getAttribute('data-whois-field');
      let value = whois[fieldName];
      console.log(`[populateWhoisData] Field: ${fieldName}, Value: ${value}`);

      if (Array.isArray(value)) {
        value = value.join(', ');
      } else if (fieldName === 'registrationDate' || fieldName === 'expirationDate') {
        value = formatDate(value);
      }

      if (value) {
        field.textContent = value;
        field.classList.remove('shimmer', 'rdap-placeholder-inline');
        field.style.backgroundColor = 'transparent';
        field.style.animation = 'none';
        field.style.minHeight = 'auto';
        field.style.height = 'auto';
        console.log(`[populateWhoisData] Populated ${fieldName}, element:`, field);
      } else {
        console.log(`[populateWhoisData] No value for ${fieldName}`);
      }
    });
  }

  loadDomainData();
});
