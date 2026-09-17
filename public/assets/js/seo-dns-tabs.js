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
      console.log('[DNS Tabs] Tab clicked:', this.textContent.trim());

      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('dns-tab-active'));

      // Add active class to clicked tab
      this.classList.add('dns-tab-active');

      const tabName = this.textContent.trim();
      const recordType = tabMap[tabName];
      console.log('[DNS Tabs] Tab name:', tabName, 'Record type:', recordType);

      // Show/hide content based on tab
      if (recordType === 'mx') {
        console.log('[DNS Tabs] Showing MX table');
        console.log('[DNS Tabs] tableWrapper:', tableWrapper, 'recordsGrid:', recordsGrid);
        tableWrapper.style.display = 'block';
        recordsGrid.style.display = 'none';
        if (dnsNote) dnsNote.style.display = 'flex';
      } else {
        console.log('[DNS Tabs] Showing grid, hiding table');
        console.log('[DNS Tabs] Setting recordsGrid.style.display = grid');
        console.log('[DNS Tabs] recordsGrid before:', window.getComputedStyle(recordsGrid).display);
        tableWrapper.style.display = 'none';
        recordsGrid.style.display = 'grid';
        console.log('[DNS Tabs] recordsGrid after:', window.getComputedStyle(recordsGrid).display);
        if (dnsNote) dnsNote.style.display = 'none';

        // Hide all cards and show only the matching one
        recordCards.forEach(card => {
          const cardType = card.getAttribute('data-record-type');
          const shouldShow = cardType === recordType;
          card.style.display = shouldShow ? 'block' : 'none';
          console.log(`[DNS Tabs] Card ${cardType}: ${shouldShow ? 'SHOW' : 'HIDE'}`);
        });
      }
    });
  });
});
