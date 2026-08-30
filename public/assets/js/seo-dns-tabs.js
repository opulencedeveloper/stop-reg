document.addEventListener('DOMContentLoaded', function() {
  const dnsMailRecords = document.querySelector('.dns-mail-records');
  if (!dnsMailRecords) return;

  const tabs = dnsMailRecords.querySelectorAll('.dns-tab');
  const tableWrapper = dnsMailRecords.querySelector('.dns-table-wrapper');
  const recordsGrid = dnsMailRecords.querySelector('.dns-records-grid');
  const recordCards = recordsGrid.querySelectorAll('.dns-record-card');
  const dnsNote = dnsMailRecords.querySelector('.dns-note');

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

  tabs.forEach((tab) => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();

      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('dns-tab-active'));

      // Add active class to clicked tab
      this.classList.add('dns-tab-active');

      const tabName = this.textContent.trim();
      const recordType = tabMap[tabName];

      // Show/hide content based on tab
      if (recordType === 'mx') {
        tableWrapper.style.display = 'block';
        recordsGrid.style.display = 'none';
        if (dnsNote) dnsNote.style.display = 'flex';
      } else {
        tableWrapper.style.display = 'none';
        recordsGrid.style.display = 'grid';
        if (dnsNote) dnsNote.style.display = 'none';

        // Hide all cards and show only the matching one
        recordCards.forEach(card => {
          card.style.display = card.getAttribute('data-record-type') === recordType ? 'block' : 'none';
        });
      }
    });
  });
});
