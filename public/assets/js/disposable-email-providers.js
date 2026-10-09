function showPage(){
  const hash = location.hash;
  if (hash) {
    const id = hash.substring(1);
    const target = document.getElementById(id);
    if (target) {
      document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
      target.classList.add('active');
      window.scrollTo(0, 0);
    }
  }
}
window.addEventListener('hashchange', showPage);

function setView(section,view,button){
 const table=document.getElementById(section+'-table');
 const grid=document.getElementById(section+'-grid');
 if (table) table.classList.toggle('hidden',view!=='table');
 if (grid) grid.classList.toggle('hidden',view!=='grid');
 if (button && button.parentElement) {
  button.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
  button.classList.add('active');
 }
}

function filterItems(section,value){
 value=value.toLowerCase().trim();
 ['table','grid'].forEach(view=>{
  const root=document.getElementById(section+'-'+view);
  if(!root)return;
  root.querySelectorAll('[data-search]').forEach(item=>{
   item.style.display=item.dataset.search.toLowerCase().includes(value)?'':'none';
  });
 });
}

async function copyDomainJson(button){
 const code=document.querySelector('#domain-json code');
 if(!code)return;
 try{
   await navigator.clipboard.writeText(code.innerText);
   const original=button.innerHTML;
   button.innerHTML='✓ Copied';
   button.classList.add('copied');
   setTimeout(()=>{
     button.innerHTML=original;
     button.classList.remove('copied');
   },1600);
 }catch(e){
   const range=document.createRange();
   range.selectNodeContents(code);
   const selection=window.getSelection();
   selection.removeAllRanges();
   selection.addRange(range);
   document.execCommand('copy');
   selection.removeAllRanges();
   button.innerHTML='✓ Copied';
   button.classList.add('copied');
   setTimeout(()=>{
     button.innerHTML='⧉ Copy JSON';
     button.classList.remove('copied');
   },1600);
 }
}

function setPageSize(section,value){
 console.log(section,value);
}

function toggleTier3Faq(button){
  const item = button.closest('.tier3-faq-item');
  if (item) item.classList.toggle('open');
}

function setDnsTab(tabType, element){
  const container = document.querySelector('.dns-records-card');
  if (!container) return;

  container.querySelectorAll('.dns-tabs span, .dns-tabs button').forEach(el => el.classList.remove('active'));
  if (element) element.classList.add('active');

  const mxTable = container.querySelector('.dns-scroll');
  const dnsNote = container.querySelector('.dns-note');
  const recordsGrid = container.querySelector('.dns-records-grid');
  const cards = container.querySelectorAll('.dns-record-card');

  if (tabType === 'mx') {
    if (mxTable) mxTable.style.display = 'block';
    if (dnsNote) dnsNote.style.display = 'flex';
    if (recordsGrid) recordsGrid.style.display = 'none';
  } else {
    if (mxTable) mxTable.style.display = 'none';
    if (dnsNote) dnsNote.style.display = 'none';
    if (recordsGrid) recordsGrid.style.display = 'grid';

    cards.forEach(card => {
      const type = card.getAttribute('data-record-type');
      card.style.display = (type === tabType) ? 'block' : 'none';
    });
  }
}

function navigateSubdomainPage(page) {
  const url = new URL(window.location);
  url.searchParams.set('subdomainPage', page);
  window.location = url.toString();
}

