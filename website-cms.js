/* BHARATEE BUSINESS PLATFORM — Website CMS admin module.
   Requires the existing admin.html globals: db, selected, lang, profile.
   Uses only the public Supabase key already configured by admin.html.
   All reads/writes remain subject to the existing table RLS policies. */
(() => {
  'use strict';

  const BUCKET = 'public-site-media';
  const SECTION_FIELDS = {
    hero: [
      ['eyebrow', 'Eyebrow / small heading'],
      ['headline', 'Main headline (use a new line for line breaks)'],
      ['description', 'Description']
    ],
    govt: [
      ['eyebrow', 'Eyebrow / small heading'],
      ['title', 'Section title'],
      ['description', 'Section description'],
      ['disclaimer', 'Government portal disclaimer']
    ],
    services: [
      ['eyebrow', 'Eyebrow / small heading'],
      ['title', 'Section title'],
      ['description', 'Section description'],
      ['cyber_title', 'Cyber Café panel title'],
      ['studio_title', 'Photo Studio panel title']
    ],
    gallery: [
      ['eyebrow', 'Eyebrow / small heading'],
      ['title', 'Section title'],
      ['description', 'Section description']
    ],
    rates: [
      ['eyebrow', 'Eyebrow / small heading'],
      ['title', 'Section title'],
      ['description', 'Section description'],
      ['note', 'Small note below the rate card']
    ],
    visit: [
      ['eyebrow', 'Eyebrow / small heading'],
      ['title', 'Section title'],
      ['description', 'Section description']
    ]
  };

  const CMS_TEXT = {
    en: {
      title: 'Website Content Management',
      subtitle: 'Edit website copy, government links, prices, gallery and contact details. Existing layout and branding stay intact.',
      page: 'Page content', govt: 'Government services', prices: 'Services & prices', gallery: 'Gallery', contact: 'Contact & branding',
      locale: 'Language', section: 'Website section', load: 'Load section', saveDraft: 'Save draft', publish: 'Publish changes',
      fieldsHelp: 'Only the selected language is saved. Add Hindi and Odia translations separately.',
      servicesTitle: 'Government service directory', add: 'Add new', edit: 'Edit', deactivate: 'Unpublish',
      serviceName: 'Service name', description: 'Description', category: 'Category', officialUrl: 'Official HTTPS URL',
      published: 'Published on website', active: 'Active', order: 'Display order', save: 'Save', cancel: 'Cancel',
      rateTitle: 'Public rate card', code: 'Service code (unique)', basePrice: 'Base price (INR)', priceDisplay: 'Price shown on website',
      unit: 'Unit / detail', image: 'Upload image', upload: 'Upload to gallery', imageTitle: 'Image title', caption: 'Caption',
      logo: 'Replace website logo', logoHelp: 'Upload a transparent PNG or a web-ready JPG/PNG. This changes the public logo only after saving.',
      address: 'Address', phone: 'Phone', email: 'Email', weekdayHours: 'Monday–Saturday hours', sundayHours: 'Sunday hours', studioHours: 'Studio booking hours',
      saveContact: 'Save contact details', saveLogo: 'Upload and set logo',
      noRows: 'No CMS records yet.', loading: 'Loading…', saved: 'Saved successfully.',
      permission: 'Your account does not have permission to edit this CMS section.',
      onlyDigital: 'Government services and the public rate card belong to BHARATEE DIGITAL SERVICE. Choose that business to edit them.',
      galleryNote: 'New images are added to the existing gallery; the original static gallery items are preserved.',
      preview: 'Open public website',
      chooseFile: 'Choose image', uploadFirst: 'Select an image first.', invalidUrl: 'Enter a valid HTTPS URL.', required: 'Complete all required fields.',
      noLogo: 'No replacement logo has been uploaded. The current original logo remains in use.'
    },
    hi: {
      title: 'वेबसाइट कंटेंट मैनेजमेंट',
      subtitle: 'वेबसाइट टेक्स्ट, सरकारी लिंक, कीमतें, गैलरी और संपर्क विवरण बदलें। मौजूदा डिजाइन और ब्रांडिंग सुरक्षित रहेंगे।',
      page: 'पेज कंटेंट', govt: 'सरकारी सेवाएँ', prices: 'सेवाएँ और कीमतें', gallery: 'गैलरी', contact: 'संपर्क और ब्रांडिंग',
      locale: 'भाषा', section: 'वेबसाइट सेक्शन', load: 'सेक्शन लोड करें', saveDraft: 'ड्राफ्ट सेव करें', publish: 'बदलाव प्रकाशित करें',
      fieldsHelp: 'केवल चुनी गई भाषा सेव होगी। हिंदी और ओड़िया अनुवाद अलग से जोड़ें।',
      servicesTitle: 'सरकारी सेवा निर्देशिका', add: 'नया जोड़ें', edit: 'बदलें', deactivate: 'अप्रकाशित करें',
      serviceName: 'सेवा का नाम', description: 'विवरण', category: 'श्रेणी', officialUrl: 'आधिकारिक HTTPS लिंक',
      published: 'वेबसाइट पर प्रकाशित', active: 'सक्रिय', order: 'दिखाने का क्रम', save: 'सेव करें', cancel: 'रद्द करें',
      rateTitle: 'वेबसाइट रेट कार्ड', code: 'सर्विस कोड (यूनिक)', basePrice: 'मूल कीमत (INR)', priceDisplay: 'वेबसाइट पर दिखने वाली कीमत',
      unit: 'यूनिट / विवरण', image: 'इमेज अपलोड', upload: 'गैलरी में अपलोड करें', imageTitle: 'इमेज का शीर्षक', caption: 'कैप्शन',
      logo: 'वेबसाइट लोगो बदलें', logoHelp: 'पारदर्शी PNG या वेब-रेडी JPG/PNG अपलोड करें। सेव करने के बाद सार्वजनिक लोगो बदलेगा।',
      address: 'पता', phone: 'फोन', email: 'ईमेल', weekdayHours: 'सोमवार–शनिवार समय', sundayHours: 'रविवार समय', studioHours: 'स्टूडियो बुकिंग समय',
      saveContact: 'संपर्क विवरण सेव करें', saveLogo: 'लोगो अपलोड करके सेट करें',
      noRows: 'अभी कोई CMS रिकॉर्ड नहीं है।', loading: 'लोड हो रहा है…', saved: 'सफलतापूर्वक सेव हुआ।',
      permission: 'आपके अकाउंट को इस CMS सेक्शन को बदलने की अनुमति नहीं है।',
      onlyDigital: 'सरकारी सेवाएँ और सार्वजनिक रेट कार्ड BHARATEE DIGITAL SERVICE के हैं। इन्हें बदलने के लिए वही बिज़नेस चुनें।',
      galleryNote: 'नई तस्वीरें मौजूदा गैलरी में जुड़ेंगी; पुरानी तस्वीरें सुरक्षित रहेंगी।',
      preview: 'सार्वजनिक वेबसाइट खोलें', chooseFile: 'इमेज चुनें', uploadFirst: 'पहले इमेज चुनें।', invalidUrl: 'सही HTTPS लिंक दर्ज करें।', required: 'सभी जरूरी फ़ील्ड भरें।',
      noLogo: 'नया लोगो अपलोड नहीं हुआ है। मौजूदा लोगो इस्तेमाल होगा।'
    },
    or: {
      title: 'ୱେବସାଇଟ୍ ବିଷୟବସ୍ତୁ ପରିଚାଳନା',
      subtitle: 'ୱେବସାଇଟ୍ ଟେକ୍ସଟ୍, ସରକାରୀ ଲିଙ୍କ୍, ମୂଲ୍ୟ, ଗ୍ୟାଲେରୀ ଏବଂ ଯୋଗାଯୋଗ ବିବରଣୀ ବଦଳାନ୍ତୁ। ବର୍ତ୍ତମାନର ଡିଜାଇନ୍ ଅକ୍ଷୁଣ୍ଣ ରହିବ।',
      page: 'ପୃଷ୍ଠା ବିଷୟବସ୍ତୁ', govt: 'ସରକାରୀ ସେବା', prices: 'ସେବା ଓ ମୂଲ୍ୟ', gallery: 'ଗ୍ୟାଲେରୀ', contact: 'ଯୋଗାଯୋଗ ଓ ବ୍ରାଣ୍ଡିଂ',
      locale: 'ଭାଷା', section: 'ୱେବସାଇଟ୍ ବିଭାଗ', load: 'ବିଭାଗ ଲୋଡ୍ କରନ୍ତୁ', saveDraft: 'ଡ୍ରାଫ୍ଟ ସେଭ୍ କରନ୍ତୁ', publish: 'ପରିବର୍ତ୍ତନ ପ୍ରକାଶ କରନ୍ତୁ',
      fieldsHelp: 'କେବଳ ଚୟନିତ ଭାଷା ସେଭ୍ ହେବ। ହିନ୍ଦୀ ଏବଂ ଓଡ଼ିଆ ଅନୁବାଦ ଅଲଗା ଭାବେ ଯୋଡ଼ନ୍ତୁ।',
      servicesTitle: 'ସରକାରୀ ସେବା ତାଲିକା', add: 'ନୂଆ ଯୋଡ଼ନ୍ତୁ', edit: 'ସମ୍ପାଦନା', deactivate: 'ପ୍ରକାଶନ ବନ୍ଦ',
      serviceName: 'ସେବା ନାମ', description: 'ବିବରଣୀ', category: 'ବର୍ଗ', officialUrl: 'ସରକାରୀ HTTPS ଲିଙ୍କ୍',
      published: 'ୱେବସାଇଟ୍‌ରେ ପ୍ରକାଶିତ', active: 'ସକ୍ରିୟ', order: 'ଦେଖାଇବା କ୍ରମ', save: 'ସେଭ୍ କରନ୍ତୁ', cancel: 'ବାତିଲ୍',
      rateTitle: 'ୱେବସାଇଟ୍ ମୂଲ୍ୟ ତାଲିକା', code: 'ସେବା କୋଡ୍', basePrice: 'ମୂଳ ମୂଲ୍ୟ (INR)', priceDisplay: 'ୱେବସାଇଟ୍‌ରେ ଦେଖାଯିବା ମୂଲ୍ୟ',
      unit: 'ୟୁନିଟ୍ / ବିବରଣୀ', image: 'ଚିତ୍ର ଅପଲୋଡ୍', upload: 'ଗ୍ୟାଲେରୀକୁ ଅପଲୋଡ୍', imageTitle: 'ଚିତ୍ର ଶୀର୍ଷକ', caption: 'କ୍ୟାପସନ୍',
      logo: 'ୱେବସାଇଟ୍ ଲୋଗୋ ବଦଳାନ୍ତୁ', logoHelp: 'ସ୍ୱଚ୍ଛ PNG କିମ୍ବା ଭଲ JPG/PNG ଅପଲୋଡ୍ କରନ୍ତୁ। ସେଭ୍ କଲେ ସାର୍ବଜନୀନ ଲୋଗୋ ବଦଳିବ।',
      address: 'ଠିକଣା', phone: 'ଫୋନ୍', email: 'ଇମେଲ୍', weekdayHours: 'ସୋମବାର–ଶନିବାର ସମୟ', sundayHours: 'ରବିବାର ସମୟ', studioHours: 'ଷ୍ଟୁଡିଓ ବୁକିଂ ସମୟ',
      saveContact: 'ଯୋଗାଯୋଗ ବିବରଣୀ ସେଭ୍', saveLogo: 'ଲୋଗୋ ଅପଲୋଡ୍ କରି ସେଟ୍ କରନ୍ତୁ',
      noRows: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି CMS ରେକର୍ଡ ନାହିଁ।', loading: 'ଲୋଡ୍ ହେଉଛି…', saved: 'ସଫଳତାର ସହିତ ସେଭ୍ ହେଲା।',
      permission: 'ଏହି CMS ବିଭାଗ ସମ୍ପାଦନା ପାଇଁ ଆପଣଙ୍କ ଅନୁମତି ନାହିଁ।',
      onlyDigital: 'ସରକାରୀ ସେବା ଏବଂ ସାର୍ବଜନୀନ ମୂଲ୍ୟ ତାଲିକା BHARATEE DIGITAL SERVICE ପାଇଁ। ସେଗୁଡ଼ିକୁ ବଦଳାଇବା ପାଇଁ ସେହି ବ୍ୟବସାୟ ବାଛନ୍ତୁ।',
      galleryNote: 'ନୂଆ ଫଟୋ ପୁରୁଣା ଗ୍ୟାଲେରୀ ସହିତ ଯୋଡ଼ାଯିବ; ପୁରୁଣା ଫଟୋ ସୁରକ୍ଷିତ ରହିବ।',
      preview: 'ସାର୍ବଜନୀନ ୱେବସାଇଟ୍ ଖୋଲନ୍ତୁ', chooseFile: 'ଚିତ୍ର ବାଛନ୍ତୁ', uploadFirst: 'ପ୍ରଥମେ ଚିତ୍ର ବାଛନ୍ତୁ।', invalidUrl: 'ସଠିକ୍ HTTPS ଲିଙ୍କ୍ ଦିଅନ୍ତୁ।', required: 'ଆବଶ୍ୟକ ତଥ୍ୟ ପୂରଣ କରନ୍ତୁ।',
      noLogo: 'ନୂଆ ଲୋଗୋ ଅପଲୋଡ୍ ହୋଇନାହିଁ। ବର୍ତ୍ତମାନର ଲୋଗୋ ବ୍ୟବହୃତ ହେବ।'
    }
  };

  const tr = (key) => (CMS_TEXT[lang] || CMS_TEXT.en)[key] || CMS_TEXT.en[key] || key;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const localeKeys = ['en','hi','or'];
  let panel = null;
  let currentBusinessId = null;
  let currentBusinessCode = null;
  let currentTab = 'pages';
  let editingGovtId = null;
  let editingServiceId = null;
  let initialized = false;

  function context() {
    try {
      if (!db || !selected || !selected.business_id) return null;
      return { client: db, business: selected, locale: lang || 'en', user: profile || null };
    } catch (_) { return null; }
  }

  function status(message, isError = false) {
    const box = panel && panel.querySelector('#cmsStatus');
    if (!box) return;
    box.textContent = message;
    box.className = 'cms-status ' + (isError ? 'is-error' : 'is-ok');
  }

  function clearStatus() {
    const box = panel && panel.querySelector('#cmsStatus');
    if (box) { box.textContent = ''; box.className = 'cms-status'; }
  }

  function canManage(role = '') { return ['owner','admin','manager'].includes(role); }
  function canManageBrand(role = '') { return ['owner','admin'].includes(role); }
  function canManageGallery(role = '') { return ['owner','admin','manager','studio_staff'].includes(role); }

  function sectionLabel(key) {
    const labels = {hero:'Hero section',govt:'Government services heading',services:'Services heading',gallery:'Gallery heading',rates:'Rate card heading',visit:'Visit/contact heading'};
    return labels[key] || key;
  }

  function ensurePanel() {
    const ctx = context();
    const selectedPanel = document.getElementById('selectedPanel');
    if (!ctx || !selectedPanel) return;
    if (panel && currentBusinessId === ctx.business.business_id) return;
    if (panel) panel.remove();
    currentBusinessId = ctx.business.business_id;
    currentBusinessCode = ctx.business.business_units && ctx.business.business_units.code;
    currentTab = currentBusinessCode === 'digital-service' ? 'pages' : 'gallery';
    editingGovtId = null;
    editingServiceId = null;
    panel = document.createElement('section');
    panel.className = 'cms-panel';
    panel.id = 'bharateeWebsiteCms';
    panel.innerHTML = `
      <style>
        .cms-panel{margin:22px 0;padding:22px;background:#fff;border:1px solid rgba(13,44,107,.16);border-radius:13px}
        .cms-panel *{box-sizing:border-box}
        .cms-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
        .cms-head h3{margin:0;color:#081E4D;font:700 23px 'Baloo 2'}
        .cms-head p{margin:4px 0 0;color:#6C7895;font:12px/1.5 'IBM Plex Sans';max-width:720px}
        .cms-head a{display:inline-block;padding:9px 12px;border:1px solid rgba(13,44,107,.18);border-radius:7px;color:#0D2C6B;text-decoration:none;font:600 10px 'IBM Plex Mono'}
        .cms-tabs{display:flex;flex-wrap:wrap;gap:7px;margin:19px 0 16px;border-bottom:1px solid rgba(13,44,107,.13);padding-bottom:12px}
        .cms-tab{padding:9px 12px;background:#FFFBF3;border:1px solid rgba(13,44,107,.16);border-radius:7px;color:#3A5590;font:600 10px 'IBM Plex Mono';cursor:pointer}
        .cms-tab[aria-selected=true]{background:#0D2C6B;color:#fff;border-color:#0D2C6B}
        .cms-view{display:none}.cms-view.is-active{display:block}
        .cms-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .cms-field{display:grid;gap:6px;margin:0 0 12px;min-width:0}
        .cms-field label{margin:0;color:#3A5590;font:600 9px 'IBM Plex Mono';letter-spacing:.08em;text-transform:uppercase}
        .cms-field input,.cms-field select,.cms-field textarea{width:100%;border:1px solid rgba(13,44,107,.2);border-radius:7px;padding:10px 11px;background:#fff;color:#14203D;font:13px 'IBM Plex Sans';min-width:0}
        .cms-field textarea{min-height:74px;resize:vertical;line-height:1.5}
        .cms-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:12px 0}
        .cms-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}
        .cms-btn{padding:10px 14px;border:0;border-radius:7px;background:#0D2C6B;color:white;font:600 10px 'IBM Plex Mono';cursor:pointer}
        .cms-btn:hover{background:#F26522}.cms-btn.alt{background:white;color:#0D2C6B;border:1px solid rgba(13,44,107,.2)}.cms-btn.danger{background:#9b392b}
        .cms-help{margin:7px 0 14px;color:#6C7895;font:11px/1.5 'IBM Plex Sans'}
        .cms-status{min-height:0;margin:10px 0 0;font:11px/1.5 'IBM Plex Sans'}
        .cms-status.is-ok{color:#128807}.cms-status.is-error{color:#b13f2b}
        .cms-table-wrap{overflow:auto;border:1px solid rgba(13,44,107,.12);border-radius:8px;margin:12px 0}
        .cms-table{width:100%;border-collapse:collapse;min-width:540px}
        .cms-table th,.cms-table td{padding:10px 11px;text-align:left;border-bottom:1px solid rgba(13,44,107,.1);font-size:11px;vertical-align:middle}
        .cms-table th{color:#3A5590;background:#FFFBF3;font:600 9px 'IBM Plex Mono';text-transform:uppercase}
        .cms-table td strong{color:#081E4D}.cms-table tr:last-child td{border-bottom:0}
        .cms-check{display:flex;align-items:center;gap:7px;color:#3A5590;font:11px 'IBM Plex Sans'}
        .cms-check input{width:auto}
        .cms-formbox{padding:15px;background:#FFFBF3;border:1px solid rgba(13,44,107,.13);border-radius:9px;margin:14px 0}
        .cms-formbox h4{margin:0 0 13px;color:#081E4D;font:700 16px 'Baloo 2'}
        .cms-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .cms-thumb{width:65px;height:48px;object-fit:cover;border-radius:5px;background:#eee}
        @media(max-width:680px){.cms-panel{padding:15px}.cms-grid,.cms-two{grid-template-columns:1fr}.cms-tabs{gap:5px}.cms-tab{font-size:9px;padding:8px}}
      </style>
      <div class="cms-head"><div><h3>${esc(tr('title'))}</h3><p>${esc(tr('subtitle'))}</p></div><a href="https://bharateegraphics.github.io/bhartee-digital-service/" target="_blank" rel="noopener">${esc(tr('preview'))} ↗</a></div>
      <div class="cms-tabs" role="tablist" aria-label="Website CMS tabs"></div>
      <div id="cmsViews"></div>
      <div id="cmsStatus" class="cms-status" aria-live="polite"></div>`;
    const moduleGrid = selectedPanel.querySelector('.modules');
    selectedPanel.insertBefore(panel, moduleGrid || null);
    renderTabs();
    openTab(currentTab);
  }

  function renderTabs() {
    if (!panel) return;
    const tabs = currentBusinessCode === 'digital-service'
      ? [
          ['pages', tr('page')], ['govt', tr('govt')], ['prices', tr('prices')], ['gallery', tr('gallery')],
          ...(canManageBrand(selected.role) ? [['contact', tr('contact')]] : [])
        ]
      : [['gallery', tr('gallery')]];
    const nav = panel.querySelector('.cms-tabs');
    nav.replaceChildren();
    const viewHost = panel.querySelector('#cmsViews');
    viewHost.innerHTML = `
      ${currentBusinessCode === 'digital-service' ? '<div class="cms-view" data-view="pages" id="cmsPages"></div><div class="cms-view" data-view="govt" id="cmsGovt"></div><div class="cms-view" data-view="prices" id="cmsPrices"></div>' : ''}
      <div class="cms-view" data-view="gallery" id="cmsGallery"></div>
      ${currentBusinessCode === 'digital-service' && canManageBrand(selected.role) ? '<div class="cms-view" data-view="contact" id="cmsContact"></div>' : ''}`;
    tabs.forEach(([key,label]) => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'cms-tab'; btn.dataset.tab = key;
      btn.textContent = label; btn.setAttribute('role','tab');
      btn.addEventListener('click', () => openTab(key));
      nav.append(btn);
    });
    if (currentBusinessCode === 'digital-service') {
      renderPageEditor(); renderGovtView(); renderPricesView();
      if (canManageBrand(selected.role)) renderContactView();
    }
    renderGalleryView();
  }

  function openTab(key) {
    if (!panel) return;
    currentTab = key;
    panel.querySelectorAll('.cms-tab').forEach(btn => btn.setAttribute('aria-selected', String(btn.dataset.tab === key)));
    panel.querySelectorAll('.cms-view').forEach(view => view.classList.toggle('is-active', view.dataset.view === key));
    clearStatus();
    if (key === 'govt') loadGovernmentServices();
    if (key === 'prices') loadCatalog();
    if (key === 'gallery') loadGallery();
    if (key === 'contact') loadContactDetails();
    if (key === 'pages') loadPageContent();
  }

  function renderPageEditor() {
    const host = panel.querySelector('#cmsPages');
    const options = Object.keys(SECTION_FIELDS).map(key => `<option value="${key}">${esc(sectionLabel(key))}</option>`).join('');
    host.innerHTML = `
      <p class="cms-help">${esc(tr('fieldsHelp'))} Current business: <strong>${esc(selected.business_units && selected.business_units.name_i18n && (selected.business_units.name_i18n.en || selected.business_units.code) || currentBusinessCode)}</strong>.</p>
      <div class="cms-grid">
        <div class="cms-field"><label for="cmsPageLocale">${esc(tr('locale'))}</label><select id="cmsPageLocale"><option value="en">English</option><option value="hi">हिन्दी</option><option value="or">ଓଡ଼ିଆ</option></select></div>
        <div class="cms-field"><label for="cmsPageSection">${esc(tr('section'))}</label><select id="cmsPageSection">${options}</select></div>
      </div>
      <div id="cmsPageFields" class="cms-grid"></div>
      <div class="cms-row"><label class="cms-check"><input id="cmsPagePublished" type="checkbox"> ${esc(tr('published'))}</label></div>
      <div class="cms-actions"><button class="cms-btn alt" id="cmsPageLoad" type="button">${esc(tr('load'))}</button><button class="cms-btn alt" id="cmsPageDraft" type="button">${esc(tr('saveDraft'))}</button><button class="cms-btn" id="cmsPagePublish" type="button">${esc(tr('publish'))}</button></div>`;
    host.querySelector('#cmsPageLocale').value = localeKeys.includes(lang) ? lang : 'en';
    host.querySelector('#cmsPageSection').addEventListener('change', loadPageContent);
    host.querySelector('#cmsPageLocale').addEventListener('change', loadPageContent);
    host.querySelector('#cmsPageLoad').addEventListener('click', loadPageContent);
    host.querySelector('#cmsPageDraft').addEventListener('click', () => savePageContent(false));
    host.querySelector('#cmsPagePublish').addEventListener('click', () => savePageContent(true));
    buildPageFields('hero', {});
    loadPageContent();
  }

  function buildPageFields(sectionKey, values) {
    const host = panel.querySelector('#cmsPageFields');
    host.replaceChildren();
    (SECTION_FIELDS[sectionKey] || []).forEach(([key,label]) => {
      const wrap = document.createElement('div');
      wrap.className = 'cms-field';
      const lab = document.createElement('label'); lab.htmlFor = `cmsField_${key}`; lab.textContent = label;
      const input = document.createElement('textarea'); input.id = `cmsField_${key}`; input.value = values[key] || '';
      wrap.append(lab,input); host.append(wrap);
    });
  }

  async function loadPageContent() {
    const ctx = context(); if (!ctx || !panel || !panel.querySelector('#cmsPageSection')) return;
    const section = panel.querySelector('#cmsPageSection').value;
    const locale = panel.querySelector('#cmsPageLocale').value;
    panel.querySelector('#cmsPageFields').innerHTML = `<p class="cms-help">${esc(tr('loading'))}</p>`;
    const {data,error} = await ctx.client.from('site_content').select('content,is_published')
      .eq('business_id',ctx.business.business_id).eq('page_key','home').eq('section_key',section).eq('locale',locale).maybeSingle();
    if (error) { status(error.message,true); buildPageFields(section,{}); return; }
    buildPageFields(section,data && data.content || {});
    panel.querySelector('#cmsPagePublished').checked = !!(data && data.is_published);
  }

  async function savePageContent(publish) {
    const ctx = context(); if (!ctx || !canManage(ctx.business.role)) return status(tr('permission'),true);
    const section = panel.querySelector('#cmsPageSection').value;
    const locale = panel.querySelector('#cmsPageLocale').value;
    const content = {};
    (SECTION_FIELDS[section] || []).forEach(([key]) => { content[key] = panel.querySelector(`#cmsField_${key}`).value.trim(); });
    const row = {
      business_id:ctx.business.business_id, page_key:'home', section_key:section,
      locale, content, is_published:!!publish, published_at:publish ? new Date().toISOString() : null,
      updated_by:ctx.user && ctx.user.id || null, updated_at:new Date().toISOString()
    };
    const {error} = await ctx.client.from('site_content').upsert(row,{onConflict:'business_id,page_key,section_key,locale'});
    if (error) return status(error.message,true);
    panel.querySelector('#cmsPagePublished').checked = !!publish;
    status(tr('saved'));
  }

  function renderGovtView() {
    const host = panel.querySelector('#cmsGovt');
    host.innerHTML = `
      <div class="cms-row" style="justify-content:space-between"><strong>${esc(tr('servicesTitle'))}</strong><button type="button" class="cms-btn" id="cmsAddGovt">＋ ${esc(tr('add'))}</button></div>
      <div id="cmsGovtForm" class="cms-formbox" hidden></div>
      <div id="cmsGovtRows" class="cms-table-wrap"><p class="cms-help">${esc(tr('loading'))}</p></div>`;
    host.querySelector('#cmsAddGovt').addEventListener('click', () => showGovtForm(null));
    loadGovernmentServices();
  }

  async function loadGovernmentServices() {
    const ctx = context(), host = panel && panel.querySelector('#cmsGovtRows'); if (!ctx || !host) return;
    const {data,error} = await ctx.client.from('government_services')
      .select('id,category_key,name_i18n,description_i18n,official_url,is_active,is_published,sort_order,last_verified_at')
      .eq('business_id',ctx.business.business_id).order('sort_order').order('created_at');
    if (error) { host.textContent = error.message; status(error.message,true); return; }
    if (!data || !data.length) { host.innerHTML = `<p class="cms-help">${esc(tr('noRows'))}</p>`; return; }
    host.innerHTML = `<table class="cms-table"><thead><tr><th>${esc(tr('serviceName'))}</th><th>URL</th><th>${esc(tr('published'))}</th><th>Actions</th></tr></thead><tbody>${data.map(row => `
      <tr><td><strong>${esc((row.name_i18n||{}).en || '—')}</strong><br><small>${esc(row.category_key)}</small></td>
      <td><a href="${esc(row.official_url)}" target="_blank" rel="noopener">${esc(row.official_url)}</a></td>
      <td>${row.is_active && row.is_published ? 'Yes' : 'No'}</td>
      <td><button type="button" class="cms-btn alt" data-edit-govt="${row.id}">${esc(tr('edit'))}</button> <button type="button" class="cms-btn danger" data-toggle-govt="${row.id}" data-active="${row.is_active}">${esc(row.is_published ? tr('deactivate') : tr('publish'))}</button></td></tr>`).join('')}</tbody></table>`;
    host.querySelectorAll('[data-edit-govt]').forEach(btn => btn.addEventListener('click',() => showGovtForm(data.find(x=>x.id===btn.dataset.editGovt))));
    host.querySelectorAll('[data-toggle-govt]').forEach(btn => btn.addEventListener('click',() => toggleGovernment(data.find(x=>x.id===btn.dataset.toggleGovt))));
  }

  function showGovtForm(row) {
    const form = panel.querySelector('#cmsGovtForm'); editingGovtId = row && row.id || null;
    const n = row && row.name_i18n || {}, d = row && row.description_i18n || {};
    form.hidden = false;
    form.innerHTML = `<h4>${editingGovtId ? esc(tr('edit')) : esc(tr('add'))} — ${esc(tr('servicesTitle'))}</h4>
      <div class="cms-two">
        ${textField('govtNameEn','Name (English)',n.en||'',true)}${textField('govtNameHi','Name (Hindi)',n.hi||'')}
        ${textField('govtNameOr','Name (Odia)',n.or||'')}${textField('govtCategory',tr('category'),row&&row.category_key||'general',true)}
        ${textField('govtDescEn','Description (English)',d.en||'')}${textField('govtDescHi','Description (Hindi)',d.hi||'')}
        ${textField('govtDescOr','Description (Odia)',d.or||'')}${textField('govtUrl',tr('officialUrl'),row&&row.official_url||'https://',true)}
        ${numberField('govtOrder',tr('order'),row&&row.sort_order||0)}
      </div>
      <div class="cms-row"><label class="cms-check"><input id="govtActive" type="checkbox" ${!row||row.is_active?'checked':''}> ${esc(tr('active'))}</label><label class="cms-check"><input id="govtPublished" type="checkbox" ${!row||row.is_published?'checked':''}> ${esc(tr('published'))}</label></div>
      <div class="cms-actions"><button type="button" class="cms-btn" id="govtSave">${esc(tr('save'))}</button><button type="button" class="cms-btn alt" id="govtCancel">${esc(tr('cancel'))}</button></div>`;
    form.querySelector('#govtSave').addEventListener('click',saveGovernment);
    form.querySelector('#govtCancel').addEventListener('click',()=>{form.hidden=true;editingGovtId=null;});
  }

  function textField(id,label,value='',required=false) { return `<div class="cms-field"><label for="${id}">${esc(label)}${required?' *':''}</label><input id="${id}" type="text" value="${esc(value)}" ${required?'required':''}></div>`; }
  function numberField(id,label,value=0) { return `<div class="cms-field"><label for="${id}">${esc(label)}</label><input id="${id}" type="number" min="0" step="1" value="${Number(value)||0}"></div>`; }
  function valueOf(id) { return panel.querySelector('#'+id).value.trim(); }

  async function saveGovernment() {
    const ctx=context(); if (!ctx || !canManage(ctx.business.role)) return status(tr('permission'),true);
    const url=valueOf('govtUrl'); try { const parsed=new URL(url); if(parsed.protocol!=='https:') throw new Error(); } catch (_) { return status(tr('invalidUrl'),true); }
    const name_i18n={en:valueOf('govtNameEn'),hi:valueOf('govtNameHi'),or:valueOf('govtNameOr')};
    if(!name_i18n.en || !valueOf('govtCategory')) return status(tr('required'),true);
    const payload={business_id:ctx.business.business_id,category_key:valueOf('govtCategory'),name_i18n,
      description_i18n:{en:valueOf('govtDescEn'),hi:valueOf('govtDescHi'),or:valueOf('govtDescOr')},
      official_url:url,is_active:panel.querySelector('#govtActive').checked,
      is_published:panel.querySelector('#govtPublished').checked,sort_order:Number(valueOf('govtOrder'))||0,updated_at:new Date().toISOString()};
    let result;
    if(editingGovtId) result=await ctx.client.from('government_services').update(payload).eq('id',editingGovtId).eq('business_id',ctx.business.business_id);
    else result=await ctx.client.from('government_services').insert(payload);
    if(result.error) return status(result.error.message,true);
    panel.querySelector('#cmsGovtForm').hidden=true; editingGovtId=null; status(tr('saved')); loadGovernmentServices();
  }

  async function toggleGovernment(row) {
    const ctx=context(); if(!ctx||!row) return;
    const {error}=await ctx.client.from('government_services').update({is_published:!row.is_published,updated_at:new Date().toISOString()}).eq('id',row.id).eq('business_id',ctx.business.business_id);
    if(error) return status(error.message,true);
    status(tr('saved')); loadGovernmentServices();
  }

  function renderPricesView() {
    const host=panel.querySelector('#cmsPrices');
    host.innerHTML=`<div class="cms-row" style="justify-content:space-between"><strong>${esc(tr('rateTitle'))}</strong><button type="button" class="cms-btn" id="cmsAddPrice">＋ ${esc(tr('add'))}</button></div>
      <div id="cmsPriceForm" class="cms-formbox" hidden></div><div id="cmsPriceRows" class="cms-table-wrap"><p class="cms-help">${esc(tr('loading'))}</p></div>`;
    host.querySelector('#cmsAddPrice').addEventListener('click',()=>showPriceForm(null));
    loadCatalog();
  }

  async function loadCatalog() {
    const ctx=context(), host=panel&&panel.querySelector('#cmsPriceRows'); if(!ctx||!host) return;
    const {data,error}=await ctx.client.from('service_catalog').select('id,service_code,name_i18n,description_i18n,unit_label_i18n,base_price,is_active,is_public,sort_order')
      .eq('business_id',ctx.business.business_id).order('sort_order').order('created_at');
    if(error){host.textContent=error.message;status(error.message,true);return;}
    if(!data||!data.length){host.innerHTML=`<p class="cms-help">${esc(tr('noRows'))}</p>`;return;}
    host.innerHTML=`<table class="cms-table"><thead><tr><th>${esc(tr('serviceName'))}</th><th>${esc(tr('priceDisplay'))}</th><th>${esc(tr('active'))}</th><th>Actions</th></tr></thead><tbody>${data.map(row=>{
      const desc=row.description_i18n||{}; const price=(desc.en&&desc.en.price_display)||`₹ ${row.base_price}`;
      return `<tr><td><strong>${esc((row.name_i18n||{}).en||row.service_code)}</strong><br><small>${esc(row.service_code)}</small></td><td>${esc(price)}</td><td>${row.is_active&&row.is_public?'Yes':'No'}</td><td><button type="button" class="cms-btn alt" data-edit-price="${row.id}">${esc(tr('edit'))}</button></td></tr>`;
    }).join('')}</tbody></table>`;
    host.querySelectorAll('[data-edit-price]').forEach(btn=>btn.addEventListener('click',()=>showPriceForm(data.find(x=>x.id===btn.dataset.editPrice))));
  }

  function showPriceForm(row) {
    const form=panel.querySelector('#cmsPriceForm'); editingServiceId=row&&row.id||null;
    const n=row&&row.name_i18n||{},d=row&&row.description_i18n||{},u=row&&row.unit_label_i18n||{};
    form.hidden=false;
    form.innerHTML=`<h4>${editingServiceId?esc(tr('edit')):esc(tr('add'))} — ${esc(tr('rateTitle'))}</h4>
      <div class="cms-two">
        ${textField('priceCode',tr('code'),row&&row.service_code||'',true)}${numberField('priceBase',tr('basePrice'),row&&row.base_price||0)}
        ${textField('priceNameEn','Name (English)',n.en||'',true)}${textField('priceNameHi','Name (Hindi)',n.hi||'')}
        ${textField('priceNameOr','Name (Odia)',n.or||'')}${textField('priceLabelEn','Price display (English)',d.en&&d.en.price_display||'')}
        ${textField('priceLabelHi','Price display (Hindi)',d.hi&&d.hi.price_display||'')}${textField('priceLabelOr','Price display (Odia)',d.or&&d.or.price_display||'')}
        ${textField('priceUnitEn','Unit/detail (English)',u.en||d.en&&d.en.detail||'')}${textField('priceUnitHi','Unit/detail (Hindi)',u.hi||d.hi&&d.hi.detail||'')}
        ${textField('priceUnitOr','Unit/detail (Odia)',u.or||d.or&&d.or.detail||'')}${numberField('priceOrder',tr('order'),row&&row.sort_order||0)}
      </div>
      <div class="cms-row"><label class="cms-check"><input id="priceActive" type="checkbox" ${!row||row.is_active?'checked':''}> ${esc(tr('active'))}</label><label class="cms-check"><input id="pricePublic" type="checkbox" ${!row||row.is_public?'checked':''}> ${esc(tr('published'))}</label></div>
      <div class="cms-actions"><button type="button" class="cms-btn" id="priceSave">${esc(tr('save'))}</button><button type="button" class="cms-btn alt" id="priceCancel">${esc(tr('cancel'))}</button></div>`;
    form.querySelector('#priceSave').addEventListener('click',saveCatalogItem);
    form.querySelector('#priceCancel').addEventListener('click',()=>{form.hidden=true;editingServiceId=null;});
  }

  async function saveCatalogItem() {
    const ctx=context(); if(!ctx||!canManage(ctx.business.role)) return status(tr('permission'),true);
    const code=valueOf('priceCode').toLowerCase().replace(/[^a-z0-9_-]/g,'_');
    const name={en:valueOf('priceNameEn'),hi:valueOf('priceNameHi'),or:valueOf('priceNameOr')};
    if(!code||!name.en) return status(tr('required'),true);
    const description={
      en:{detail:valueOf('priceUnitEn'),price_display:valueOf('priceLabelEn')},
      hi:{detail:valueOf('priceUnitHi'),price_display:valueOf('priceLabelHi')},
      or:{detail:valueOf('priceUnitOr'),price_display:valueOf('priceLabelOr')}
    };
    const unit={en:valueOf('priceUnitEn'),hi:valueOf('priceUnitHi'),or:valueOf('priceUnitOr')};
    const payload={business_id:ctx.business.business_id,service_code:code,name_i18n:name,description_i18n:description,
      unit_label_i18n:unit,base_price:Number(valueOf('priceBase'))||0,is_active:panel.querySelector('#priceActive').checked,
      is_public:panel.querySelector('#pricePublic').checked,sort_order:Number(valueOf('priceOrder'))||0,updated_at:new Date().toISOString()};
    let result;
    if(editingServiceId) result=await ctx.client.from('service_catalog').update(payload).eq('id',editingServiceId).eq('business_id',ctx.business.business_id);
    else result=await ctx.client.from('service_catalog').upsert(payload,{onConflict:'business_id,service_code'});
    if(result.error) return status(result.error.message,true);
    panel.querySelector('#cmsPriceForm').hidden=true; editingServiceId=null; status(tr('saved')); loadCatalog();
  }

  function renderGalleryView() {
    const host=panel.querySelector('#cmsGallery');
    host.innerHTML=`<p class="cms-help">${esc(tr('galleryNote'))}</p>
      <div class="cms-formbox"><h4>${esc(tr('upload'))}</h4><div class="cms-two">
        <div class="cms-field"><label for="cmsGalleryFile">${esc(tr('image'))}</label><input id="cmsGalleryFile" type="file" accept="image/jpeg,image/png,image/webp"></div>
        ${textField('cmsGalleryTitle','Title (English)','')}
        ${textField('cmsGalleryTitleHi','Title (Hindi)','')}${textField('cmsGalleryTitleOr','Title (Odia)','')}
        ${textField('cmsGalleryCaption','Caption (English)','')}${textField('cmsGalleryCaptionHi','Caption (Hindi)','')}
        ${textField('cmsGalleryCaptionOr','Caption (Odia)','')}${textField('cmsGalleryCategory',tr('category'),'portfolio')}
      </div><div class="cms-actions"><button type="button" class="cms-btn" id="cmsUploadGallery">${esc(tr('upload'))}</button></div></div>
      <div id="cmsGalleryRows" class="cms-table-wrap"><p class="cms-help">${esc(tr('loading'))}</p></div>`;
    host.querySelector('#cmsUploadGallery').addEventListener('click',uploadGalleryImage);
    loadGallery();
  }

  function safeId() { return (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`; }
  function safeExt(file) { const byMime={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}; return byMime[file.type] || 'jpg'; }

  async function uploadGalleryImage() {
    const ctx=context(); if(!ctx||!canManageGallery(ctx.business.role)) return status(tr('permission'),true);
    const file=panel.querySelector('#cmsGalleryFile').files[0];
    if(!file) return status(tr('uploadFirst'),true);
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024) return status('Choose a JPG, PNG or WEBP image under 15 MB.',true);
    const code=currentBusinessCode; const objectPath=`${code}/gallery/${safeId()}.${safeExt(file)}`;
    status(tr('loading'));
    const uploaded=await ctx.client.storage.from(BUCKET).upload(objectPath,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
    if(uploaded.error) return status(uploaded.error.message,true);
    const asset=await ctx.client.from('media_assets').insert({
      business_id:ctx.business.business_id,storage_bucket:BUCKET,object_path:objectPath,media_type:'image',mime_type:file.type,
      file_size_bytes:file.size,is_public:true,uploaded_by:ctx.user&&ctx.user.id||null,
      alt_text_i18n:{en:valueOf('cmsGalleryTitle'),hi:valueOf('cmsGalleryTitleHi'),or:valueOf('cmsGalleryTitleOr')}
    }).select('id').single();
    if(asset.error){await ctx.client.storage.from(BUCKET).remove([objectPath]);return status(asset.error.message,true);}
    const item=await ctx.client.from('gallery_items').insert({
      business_id:ctx.business.business_id,media_asset_id:asset.data.id,category_key:valueOf('cmsGalleryCategory')||'portfolio',
      title_i18n:{en:valueOf('cmsGalleryTitle'),hi:valueOf('cmsGalleryTitleHi'),or:valueOf('cmsGalleryTitleOr')},
      caption_i18n:{en:valueOf('cmsGalleryCaption'),hi:valueOf('cmsGalleryCaptionHi'),or:valueOf('cmsGalleryCaptionOr')},
      sort_order:0,is_published:true,published_at:new Date().toISOString()
    });
    if(item.error){await ctx.client.from('media_assets').delete().eq('id',asset.data.id);await ctx.client.storage.from(BUCKET).remove([objectPath]);return status(item.error.message,true);}
    panel.querySelector('#cmsGalleryFile').value='';
    status(tr('saved')); loadGallery();
  }

  async function loadGallery() {
    const ctx=context(),host=panel&&panel.querySelector('#cmsGalleryRows'); if(!ctx||!host)return;
    const {data,error}=await ctx.client.from('gallery_items').select('id,media_asset_id,category_key,title_i18n,caption_i18n,sort_order,is_published,media_assets(storage_bucket,object_path)')
      .eq('business_id',ctx.business.business_id).order('sort_order').order('created_at',{ascending:false});
    if(error){host.textContent=error.message;status(error.message,true);return;}
    if(!data||!data.length){host.innerHTML=`<p class="cms-help">${esc(tr('noRows'))}</p>`;return;}
    host.innerHTML=`<table class="cms-table"><thead><tr><th>Image</th><th>${esc(tr('imageTitle'))}</th><th>${esc(tr('category'))}</th><th>${esc(tr('published'))}</th><th>Action</th></tr></thead><tbody>${data.map(row=>{
      const asset=row.media_assets||{};const url=asset.object_path?ctx.client.storage.from(asset.storage_bucket||BUCKET).getPublicUrl(asset.object_path).data.publicUrl:'';
      return `<tr><td>${url?`<img class="cms-thumb" src="${esc(url)}" alt="">`:''}</td><td><strong>${esc(row.title_i18n&&row.title_i18n.en||'—')}</strong></td><td>${esc(row.category_key)}</td><td>${row.is_published?'Yes':'No'}</td><td><button type="button" class="cms-btn alt" data-gallery-toggle="${row.id}" data-published="${row.is_published}">${row.is_published?'Unpublish':'Publish'}</button></td></tr>`;
    }).join('')}</tbody></table>`;
    host.querySelectorAll('[data-gallery-toggle]').forEach(btn=>btn.addEventListener('click',()=>toggleGalleryItem(btn.dataset.galleryToggle,btn.dataset.published==='true')));
  }

  async function toggleGalleryItem(id,isPublished) {
    const ctx=context();if(!ctx)return;
    const {error}=await ctx.client.from('gallery_items').update({is_published:!isPublished,published_at:!isPublished?new Date().toISOString():null,updated_at:new Date().toISOString()})
      .eq('id',id).eq('business_id',ctx.business.business_id);
    if(error)return status(error.message,true);status(tr('saved'));loadGallery();
  }

  function renderContactView() {
    const host=panel.querySelector('#cmsContact');
    host.innerHTML=`<div class="cms-formbox"><h4>${esc(tr('contact'))}</h4><p class="cms-help">Only Owner/Admin can change public contact details and branding.</p>
      <div class="cms-two">
        ${textField('cmsAddress',tr('address'),'')}${textField('cmsPhone',tr('phone'),'')}
        ${textField('cmsEmail',tr('email'),'')}${textField('cmsWeekday',tr('weekdayHours'),'')}
        ${textField('cmsSunday',tr('sundayHours'),'')}${textField('cmsStudioHours',tr('studioHours'),'')}
      </div><div class="cms-actions"><button type="button" class="cms-btn" id="cmsSaveContact">${esc(tr('saveContact'))}</button></div></div>
      <div class="cms-formbox"><h4>${esc(tr('logo'))}</h4><p class="cms-help">${esc(tr('logoHelp'))}</p><div class="cms-field"><label for="cmsLogoFile">${esc(tr('chooseFile'))}</label><input id="cmsLogoFile" type="file" accept="image/png,image/jpeg,image/webp"></div><div id="cmsLogoPreview" class="cms-help">${esc(tr('noLogo'))}</div><button type="button" class="cms-btn" id="cmsSaveLogo">${esc(tr('saveLogo'))}</button></div>`;
    host.querySelector('#cmsSaveContact').addEventListener('click',saveContactDetails);
    host.querySelector('#cmsSaveLogo').addEventListener('click',uploadLogo);
    loadContactDetails();
  }

  async function loadContactDetails() {
    const ctx=context(); if(!ctx||!canManageBrand(ctx.business.role))return;
    const {data,error}=await ctx.client.from('site_settings').select('setting_value')
      .eq('business_id',ctx.business.business_id).eq('setting_key','contact_details').maybeSingle();
    if(error){status(error.message,true);return;}
    const v=data&&data.setting_value||{};
    ['address','phone','email','hours_weekdays','hours_sunday','studio_hours'].forEach(key=>{
      const id={address:'cmsAddress',phone:'cmsPhone',email:'cmsEmail',hours_weekdays:'cmsWeekday',hours_sunday:'cmsSunday',studio_hours:'cmsStudioHours'}[key];
      const input=panel.querySelector('#'+id); if(input)input.value=v[key]||'';
    });
    const logo=await ctx.client.from('site_settings').select('setting_value').eq('business_id',ctx.business.business_id).eq('setting_key','brand_assets').maybeSingle();
    const preview=panel.querySelector('#cmsLogoPreview');
    if(preview&&logo.data&&logo.data.setting_value&&logo.data.setting_value.logo_url){preview.innerHTML=`<img class="cms-thumb" src="${esc(logo.data.setting_value.logo_url)}" alt="Current logo">`;} else if(preview)preview.textContent=tr('noLogo');
  }

  async function saveContactDetails() {
    const ctx=context(); if(!ctx||!canManageBrand(ctx.business.role))return status(tr('permission'),true);
    const setting_value={address:valueOf('cmsAddress'),phone:valueOf('cmsPhone'),email:valueOf('cmsEmail'),
      hours_weekdays:valueOf('cmsWeekday'),hours_sunday:valueOf('cmsSunday'),studio_hours:valueOf('cmsStudioHours')};
    const {error}=await ctx.client.from('site_settings').upsert({business_id:ctx.business.business_id,setting_key:'contact_details',setting_value,is_public:true,updated_by:ctx.user&&ctx.user.id||null,updated_at:new Date().toISOString()},{onConflict:'business_id,setting_key'});
    if(error)return status(error.message,true);status(tr('saved'));
  }

  async function uploadLogo() {
    const ctx=context();if(!ctx||!canManageBrand(ctx.business.role))return status(tr('permission'),true);
    const file=panel.querySelector('#cmsLogoFile').files[0];if(!file)return status(tr('uploadFirst'),true);
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>15*1024*1024)return status('Choose a PNG, JPG or WEBP logo under 15 MB.',true);
    const path=`${currentBusinessCode}/website/logo-${safeId()}.${safeExt(file)}`;
    const upload=await ctx.client.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
    if(upload.error)return status(upload.error.message,true);
    const url=ctx.client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const asset=await ctx.client.from('media_assets').insert({business_id:ctx.business.business_id,storage_bucket:BUCKET,object_path:path,media_type:'image',mime_type:file.type,file_size_bytes:file.size,is_public:true,uploaded_by:ctx.user&&ctx.user.id||null,alt_text_i18n:{en:'BHARATEE logo'}});
    if(asset.error){await ctx.client.storage.from(BUCKET).remove([path]);return status(asset.error.message,true);}
    const {error}=await ctx.client.from('site_settings').upsert({business_id:ctx.business.business_id,setting_key:'brand_assets',setting_value:{logo_url:url,logo_object_path:path},is_public:true,updated_by:ctx.user&&ctx.user.id||null,updated_at:new Date().toISOString()},{onConflict:'business_id,setting_key'});
    if(error)return status(error.message,true);
    status(tr('saved'));loadContactDetails();
  }

  function init() {
    if (initialized) return;
    initialized = true;
    ensurePanel();
    const selectedPanel=document.getElementById('selectedPanel');
    const selectedName=document.getElementById('selectedName');
    if(selectedPanel){
      const observer=new MutationObserver(()=>{const ctx=context();if(ctx&&ctx.business.business_id!==currentBusinessId){ensurePanel();}else if(ctx&&panel&&panel.parentElement) panel.querySelector('h3').textContent=tr('title');});
      observer.observe(selectedPanel,{attributes:true,attributeFilter:['class']});
    }
    if(selectedName){
      const observer=new MutationObserver(()=>{const ctx=context();if(ctx&&ctx.business.business_id!==currentBusinessId)ensurePanel();});
      observer.observe(selectedName,{childList:true,subtree:true,characterData:true});
    }
    const langSelect=document.getElementById('lang');
    if(langSelect && !langSelect.dataset.cmsListener){
      langSelect.dataset.cmsListener='1';
      langSelect.addEventListener('change',()=>{if(panel){const h=panel.querySelector('.cms-head h3');if(h)h.textContent=tr('title');renderTabs();openTab(currentTab);}});
    }
    setInterval(()=>{if(!panel||!panel.isConnected)ensurePanel();},1200);
  }

  document.addEventListener('DOMContentLoaded',init);
  window.addEventListener('load',init);
})();
