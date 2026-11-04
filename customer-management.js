/* BHARATEE BUSINESS PLATFORM — Customer Management
   Requires the existing classic-script globals from admin.html: db, selected, lang.
   Load after accounting-dashboard.js and finance-management.js. */
(() => {
  'use strict';

  const TEXT = {
    en: {
      title:'Customer management', subtitle:'Business-scoped customer directory, profiles and activity history.',
      add:'Add customer', search:'Search name, phone or email…', refresh:'Refresh', name:'Full name',
      phone:'Mobile number', altPhone:'Alternate phone', email:'Email', address:'Address',
      language:'Preferred language', notes:'Notes', whatsappConsent:'Customer has explicitly agreed to WhatsApp messages',
      consentHelp:'Only tick this after the customer has given permission. This does not send a message.',
      save:'Save customer', cancel:'Cancel', edit:'Edit profile', customers:'Customers',
      loading:'Loading customers…', noCustomers:'No customers found for this business.',
      loadError:'Could not load customer information. Check migration 005 and customer-table permissions.',
      saving:'Saving…', created:'Customer created successfully.', updated:'Customer profile updated.',
      duplicate:'This phone number already exists in this business. Open the existing customer instead.',
      profile:'Customer profile', activity:'Customer activity', orderHistory:'Order history',
      enquiryHistory:'Enquiry history', paymentHistory:'Payment history', bookings:'Studio bookings',
      orderNo:'Order no.', orderType:'Order type', status:'Status', total:'Total', date:'Date',
      amount:'Amount', method:'Method', type:'Type', source:'Source', event:'Event',
      noOrders:'No orders found.', noEnquiries:'No enquiries found.', noPayments:'No payment records available for this role or customer.',
      noBookings:'No studio bookings found.', orderCount:'orders', lastOrder:'Last order',
      whatsapp:'Open WhatsApp', whatsappNoConsent:'WhatsApp contact disabled: consent not recorded.',
      roleDenied:'Your role can view customer records but cannot create or edit them.',
      viewOnly:'View only', customerSince:'Customer since', preferred:'Preferred language', consent:'WhatsApp consent',
      yes:'Yes', no:'No', notProvided:'Not provided', noSelection:'Select a customer to see profile and history.',
      en:'English', hi:'Hindi', or:'Odia', phoneInvalid:'Enter a valid phone number (7–15 digits).',
      nameRequired:'Enter a customer name with at least 2 characters.',
      saveError:'Could not save customer. Check the supplied details and permissions.',
      orderHistoryHint:'Recent orders belonging to this business and customer.',
      enquiryHistoryHint:'Enquiries linked to this customer in this business.',
      paymentHistoryHint:'Receipts and refunds for this customer’s orders.',
      bookingsHint:'Studio bookings linked to this customer’s orders.',
      optInRecorded:'Consent recorded', optInNotRecorded:'No consent recorded', clearSearch:'Clear'
    },
    hi: {
      title:'ग्राहक प्रबंधन', subtitle:'व्यवसाय के अनुसार ग्राहक सूची, प्रोफाइल और गतिविधि का इतिहास।',
      add:'ग्राहक जोड़ें', search:'नाम, फोन या ईमेल खोजें…', refresh:'रीफ्रेश', name:'पूरा नाम',
      phone:'मोबाइल नंबर', altPhone:'वैकल्पिक फोन', email:'ईमेल', address:'पता', language:'पसंदीदा भाषा',
      notes:'नोट्स', whatsappConsent:'ग्राहक ने WhatsApp संदेशों के लिए स्पष्ट सहमति दी है',
      consentHelp:'इसे तभी चुनें जब ग्राहक ने अनुमति दी हो। इससे कोई संदेश अपने-आप नहीं भेजा जाएगा।',
      save:'ग्राहक सेव करें', cancel:'रद्द करें', edit:'प्रोफाइल संपादित करें', customers:'ग्राहक',
      loading:'ग्राहक लोड हो रहे हैं…', noCustomers:'इस व्यवसाय के लिए कोई ग्राहक नहीं मिला।',
      loadError:'ग्राहक जानकारी लोड नहीं हुई। Migration 005 और permissions जाँचें।',
      saving:'सेव हो रहा है…', created:'ग्राहक सफलतापूर्वक बनाया गया।', updated:'ग्राहक प्रोफाइल अपडेट हुई।',
      duplicate:'यह फोन नंबर इस व्यवसाय में पहले से मौजूद है। मौजूदा ग्राहक खोलें।',
      profile:'ग्राहक प्रोफाइल', activity:'ग्राहक गतिविधि', orderHistory:'ऑर्डर इतिहास',
      enquiryHistory:'पूछताछ इतिहास', paymentHistory:'भुगतान इतिहास', bookings:'स्टूडियो बुकिंग',
      orderNo:'ऑर्डर नंबर', orderType:'ऑर्डर प्रकार', status:'स्थिति', total:'कुल', date:'तारीख',
      amount:'राशि', method:'तरीका', type:'प्रकार', source:'स्रोत', event:'कार्यक्रम',
      noOrders:'कोई ऑर्डर नहीं मिला।', noEnquiries:'कोई पूछताछ नहीं मिली।', noPayments:'इस भूमिका या ग्राहक के लिए भुगतान रिकॉर्ड उपलब्ध नहीं है।',
      noBookings:'कोई स्टूडियो बुकिंग नहीं मिली।', orderCount:'ऑर्डर', lastOrder:'अंतिम ऑर्डर',
      whatsapp:'WhatsApp खोलें', whatsappNoConsent:'WhatsApp संपर्क बंद है: सहमति दर्ज नहीं है।',
      roleDenied:'आपकी भूमिका ग्राहक रिकॉर्ड देख सकती है, लेकिन बना या संपादित नहीं कर सकती।',
      viewOnly:'केवल देखें', customerSince:'ग्राहक बने', preferred:'पसंदीदा भाषा', consent:'WhatsApp सहमति',
      yes:'हाँ', no:'नहीं', notProvided:'उपलब्ध नहीं', noSelection:'प्रोफाइल और इतिहास देखने के लिए ग्राहक चुनें।',
      en:'अंग्रेज़ी', hi:'हिंदी', or:'ओड़िया', phoneInvalid:'सही फोन नंबर दर्ज करें (7–15 अंक)।',
      nameRequired:'कम से कम 2 अक्षर का ग्राहक नाम दर्ज करें।',
      saveError:'ग्राहक सेव नहीं हुआ। विवरण और permissions जाँचें।',
      orderHistoryHint:'इस व्यवसाय और ग्राहक के हाल के ऑर्डर।',
      enquiryHistoryHint:'इस व्यवसाय में ग्राहक से जुड़ी पूछताछ।',
      paymentHistoryHint:'ग्राहक के ऑर्डर की प्राप्तियां और रिफंड।',
      bookingsHint:'ग्राहक के ऑर्डर से जुड़ी स्टूडियो बुकिंग।',
      optInRecorded:'सहमति दर्ज है', optInNotRecorded:'सहमति दर्ज नहीं है', clearSearch:'हटाएँ'
    },
    or: {
      title:'ଗ୍ରାହକ ପରିଚାଳନା', subtitle:'ବ୍ୟବସାୟ ଅନୁସାରେ ଗ୍ରାହକ ତାଲିକା, ପ୍ରୋଫାଇଲ୍ ଏବଂ କାର୍ଯ୍ୟ ଇତିହାସ।',
      add:'ଗ୍ରାହକ ଯୋଡ଼ନ୍ତୁ', search:'ନାମ, ଫୋନ୍ କିମ୍ବା ଇମେଲ୍ ଖୋଜନ୍ତୁ…', refresh:'ରିଫ୍ରେସ୍', name:'ପୂର୍ଣ୍ଣ ନାମ',
      phone:'ମୋବାଇଲ୍ ନମ୍ବର', altPhone:'ବିକଳ୍ପ ଫୋନ୍', email:'ଇମେଲ୍', address:'ଠିକଣା', language:'ପସନ୍ଦର ଭାଷା',
      notes:'ଟିପ୍ପଣୀ', whatsappConsent:'ଗ୍ରାହକ WhatsApp ବାର୍ତ୍ତା ପାଇଁ ସ୍ପଷ୍ଟ ସମ୍ମତି ଦେଇଛନ୍ତି',
      consentHelp:'ଗ୍ରାହକଙ୍କ ଅନୁମତି ପାଇବା ପରେ ମାତ୍ର ଏହା ଚୟନ କରନ୍ତୁ। ଏହା କୌଣସି ବାର୍ତ୍ତା ପଠାଏ ନାହିଁ।',
      save:'ଗ୍ରାହକ ସେଭ୍ କରନ୍ତୁ', cancel:'ବାତିଲ୍', edit:'ପ୍ରୋଫାଇଲ୍ ସମ୍ପାଦନ', customers:'ଗ୍ରାହକ',
      loading:'ଗ୍ରାହକ ତଥ୍ୟ ଲୋଡ୍ ହେଉଛି…', noCustomers:'ଏହି ବ୍ୟବସାୟ ପାଇଁ କୌଣସି ଗ୍ରାହକ ମିଳିଲେ ନାହିଁ।',
      loadError:'ଗ୍ରାହକ ତଥ୍ୟ ଲୋଡ୍ ହୋଇପାରିଲା ନାହିଁ। Migration 005 ଏବଂ ଅନୁମତି ଯାଞ୍ଚ କରନ୍ତୁ।',
      saving:'ସେଭ୍ ହେଉଛି…', created:'ଗ୍ରାହକ ସଫଳତାର ସହିତ ତିଆରି ହେଲେ।', updated:'ଗ୍ରାହକ ପ୍ରୋଫାଇଲ୍ ଅପଡେଟ୍ ହେଲା।',
      duplicate:'ଏହି ଫୋନ୍ ନମ୍ବର ଏହି ବ୍ୟବସାୟରେ ପୂର୍ବରୁ ଅଛି। ଥିବା ଗ୍ରାହକଙ୍କୁ ଖୋଲନ୍ତୁ।',
      profile:'ଗ୍ରାହକ ପ୍ରୋଫାଇଲ୍', activity:'ଗ୍ରାହକ କାର୍ଯ୍ୟକଳାପ', orderHistory:'ଅର୍ଡର୍ ଇତିହାସ',
      enquiryHistory:'ପଚରାଉଚରା ଇତିହାସ', paymentHistory:'ପେମେଣ୍ଟ ଇତିହାସ', bookings:'ଷ୍ଟୁଡିଓ ବୁକିଂ',
      orderNo:'ଅର୍ଡର୍ ନମ୍ବର', orderType:'ଅର୍ଡର୍ ପ୍ରକାର', status:'ସ୍ଥିତି', total:'ମୋଟ', date:'ତାରିଖ',
      amount:'ରାଶି', method:'ପଦ୍ଧତି', type:'ପ୍ରକାର', source:'ସ୍ରୋତ', event:'ଇଭେଣ୍ଟ',
      noOrders:'କୌଣସି ଅର୍ଡର୍ ମିଳିଲା ନାହିଁ।', noEnquiries:'କୌଣସି ପଚରାଉଚରା ମିଳିଲା ନାହିଁ।', noPayments:'ଏହି ଭୂମିକା କିମ୍ବା ଗ୍ରାହକ ପାଇଁ ପେମେଣ୍ଟ ରେକର୍ଡ ଉପଲବ୍ଧ ନାହିଁ।',
      noBookings:'କୌଣସି ଷ୍ଟୁଡିଓ ବୁକିଂ ମିଳିଲା ନାହିଁ।', orderCount:'ଅର୍ଡର୍', lastOrder:'ଶେଷ ଅର୍ଡର୍',
      whatsapp:'WhatsApp ଖୋଲନ୍ତୁ', whatsappNoConsent:'WhatsApp ସମ୍ପର୍କ ବନ୍ଦ: ସମ୍ମତି ରେକର୍ଡ ହୋଇନାହିଁ।',
      roleDenied:'ଆପଣଙ୍କ ଭୂମିକା ଗ୍ରାହକ ରେକର୍ଡ ଦେଖିପାରିବ, କିନ୍ତୁ ତିଆରି କିମ୍ବା ସମ୍ପାଦନ କରିପାରିବ ନାହିଁ।',
      viewOnly:'କେବଳ ଦେଖନ୍ତୁ', customerSince:'ଗ୍ରାହକ ହୋଇଥିବା ତାରିଖ', preferred:'ପସନ୍ଦର ଭାଷା', consent:'WhatsApp ସମ୍ମତି',
      yes:'ହଁ', no:'ନା', notProvided:'ଦିଆଯାଇନାହିଁ', noSelection:'ପ୍ରୋଫାଇଲ୍ ଏବଂ ଇତିହାସ ଦେଖିବା ପାଇଁ ଗ୍ରାହକ ବାଛନ୍ତୁ।',
      en:'ଇଂରାଜୀ', hi:'ହିନ୍ଦୀ', or:'ଓଡ଼ିଆ', phoneInvalid:'ଠିକ୍ ଫୋନ୍ ନମ୍ବର ଦିଅନ୍ତୁ (7–15 ଅଙ୍କ)।',
      nameRequired:'ଅତି କମରେ 2 ଅକ୍ଷରର ଗ୍ରାହକ ନାମ ଦିଅନ୍ତୁ।',
      saveError:'ଗ୍ରାହକ ସେଭ୍ ହୋଇପାରିଲା ନାହିଁ। ବିବରଣୀ ଏବଂ ଅନୁମତି ଯାଞ୍ଚ କରନ୍ତୁ।',
      orderHistoryHint:'ଏହି ବ୍ୟବସାୟ ଏବଂ ଗ୍ରାହକଙ୍କ ସାମ୍ପ୍ରତିକ ଅର୍ଡର୍।',
      enquiryHistoryHint:'ଏହି ବ୍ୟବସାୟରେ ଗ୍ରାହକଙ୍କ ସହିତ ଜଡ଼ିତ ପଚରାଉଚରା।',
      paymentHistoryHint:'ଗ୍ରାହକଙ୍କ ଅର୍ଡର୍‌ର ଆଦାୟ ଏବଂ ଫେରସ୍ତ।',
      bookingsHint:'ଗ୍ରାହକଙ୍କ ଅର୍ଡର୍ ସହିତ ଜଡ଼ିତ ଷ୍ଟୁଡିଓ ବୁକିଂ।',
      optInRecorded:'ସମ୍ମତି ରେକର୍ଡ ହୋଇଛି', optInNotRecorded:'ସମ୍ମତି ରେକର୍ଡ ହୋଇନାହିଁ', clearSearch:'ସଫା କରନ୍ତୁ'
    }
  };

  const $ = (id) => document.getElementById(id);
  const tr = (key) => (TEXT[lang] || TEXT.en)[key] || TEXT.en[key] || key;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const allowedViewRoles = ['owner','admin','manager','cyber_staff','studio_staff','accountant'];
  const allowedEditRoles = ['owner','admin','manager','cyber_staff','studio_staff'];
  const financeRoles = ['owner','admin','manager','accountant'];
  let panel = null, activeBusinessId = null, activeCustomer = null, customerRows = [], debounceTimer = null, observerStarted = false;

  function money(value) {
    return new Intl.NumberFormat(lang === 'or' ? 'or-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN',
      {style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(value || 0));
  }
  function niceDate(value) {
    if (!value) return tr('notProvided');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return tr('notProvided');
    return new Intl.DateTimeFormat(lang === 'or' ? 'or-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN',
      {dateStyle:'medium'}).format(date);
  }
  function showNotice(text, kind='error') {
    const node = $('cmNotice');
    node.textContent = text;
    node.className = 'cm-notice ' + kind;
    node.hidden = false;
  }
  function clearNotice() { const n=$('cmNotice'); if(n){n.hidden=true;n.textContent='';} }

  function addStyles() {
    if ($('bharateeCustomerStyles')) return;
    const style = document.createElement('style');
    style.id = 'bharateeCustomerStyles';
    style.textContent = `
      .cm-panel{margin:20px 0;padding:20px;background:#fff;border:1px solid rgba(13,44,107,.16);border-radius:12px;color:#14203D}
      .cm-panel *{box-sizing:border-box}.cm-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
      .cm-head h3{font:700 22px 'Baloo 2';color:#081E4D;margin:0 0 4px}.cm-head p{margin:0;color:#6C7895;font-size:11px;line-height:1.5}
      .cm-actions{display:flex;gap:8px;flex-wrap:wrap}.cm-btn{border:0;border-radius:7px;padding:10px 14px;background:#0D2C6B;color:#fff;font:600 10px 'IBM Plex Mono';cursor:pointer}
      .cm-btn:hover{background:#F26522}.cm-btn.secondary{background:#fff;color:#0D2C6B;border:1px solid rgba(13,44,107,.2)}.cm-btn:disabled{opacity:.55;cursor:wait}
      .cm-toolbar{display:flex;gap:9px;margin:16px 0;align-items:center}.cm-search{height:39px;min-width:0;flex:1;border:1px solid rgba(13,44,107,.2);border-radius:7px;padding:8px 11px;font:12px 'IBM Plex Sans'}
      .cm-notice{margin:10px 0;padding:10px 12px;border-radius:7px;font-size:11px;line-height:1.5}.cm-notice[hidden]{display:none}.cm-notice.error{background:#fff1ed;border:1px solid #f0c2b5;color:#8b321a}.cm-notice.success{background:#eff8ef;border:1px solid #c2e3c0;color:#176b11}.cm-notice.info{background:#f3f6fc;border:1px solid rgba(13,44,107,.15);color:#3A5590}
      .cm-layout{display:grid;grid-template-columns:minmax(250px,.85fr) minmax(0,1.35fr);gap:13px;align-items:start}.cm-list,.cm-detail,.cm-form-wrap{border:1px solid rgba(13,44,107,.14);border-radius:9px;padding:13px;min-width:0}
      .cm-list h4,.cm-detail h4,.cm-form-wrap h4{margin:0 0 10px;color:#081E4D;font:700 15px 'Baloo 2'}.cm-customer{display:block;width:100%;text-align:left;padding:11px;margin:0 0 7px;border:1px solid rgba(13,44,107,.12);border-radius:7px;background:#FFFBF3;cursor:pointer;color:#14203D}
      .cm-customer:hover,.cm-customer[aria-current=true]{border-color:#F26522;background:#fff8f2}.cm-customer strong{display:block;font:600 11px 'IBM Plex Sans';color:#081E4D}.cm-customer small{display:block;margin-top:4px;color:#6C7895;font-size:10px;line-height:1.4}
      .cm-empty{padding:15px;color:#6C7895;font-size:11px;line-height:1.5}.cm-form-wrap{margin-top:13px}.cm-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.cm-field{display:grid;gap:5px;color:#3A5590;font:600 9px 'IBM Plex Mono';text-transform:uppercase}.cm-field input,.cm-field select,.cm-field textarea{width:100%;min-width:0;border:1px solid rgba(13,44,107,.2);border-radius:6px;padding:9px;font:12px 'IBM Plex Sans';color:#14203D}.cm-field input,.cm-field select{height:37px}.cm-field textarea{min-height:70px;resize:vertical}.cm-span{grid-column:1/-1}.cm-check{display:flex;gap:8px;align-items:flex-start;color:#3A5590;font-size:11px;line-height:1.5}.cm-check input{margin-top:2px}.cm-check small{display:block;color:#6C7895}.cm-form-buttons{display:flex;gap:8px;margin-top:12px}.cm-profile-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.cm-profile-name{font:700 20px 'Baloo 2';color:#081E4D}.cm-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}.cm-meta div{padding:9px;border-radius:7px;background:#FFFBF3;min-width:0}.cm-meta span{display:block;color:#6C7895;font:600 8px 'IBM Plex Mono';text-transform:uppercase}.cm-meta b{display:block;margin-top:4px;color:#14203D;font:500 11px 'IBM Plex Sans';overflow-wrap:anywhere}.cm-history{margin-top:15px}.cm-history h5{margin:0 0 4px;color:#081E4D;font:700 13px 'Baloo 2'}.cm-history p{margin:0 0 8px;color:#6C7895;font-size:10px}.cm-table-wrap{overflow:auto}.cm-table{width:100%;border-collapse:collapse;font-size:10px}.cm-table th,.cm-table td{padding:8px;border-bottom:1px solid rgba(13,44,107,.1);text-align:left;white-space:nowrap}.cm-table th{color:#3A5590;font:600 9px 'IBM Plex Mono'}.cm-table td{color:#14203D}.cm-whatsapp{display:inline-block;text-decoration:none;border-radius:7px;padding:9px 11px;background:#eff8ef;color:#176b11;font:600 10px 'IBM Plex Mono'}
      @media(max-width:760px){.cm-layout{grid-template-columns:1fr}.cm-form-grid{grid-template-columns:1fr}.cm-span{grid-column:auto}}
      @media(max-width:480px){.cm-panel{padding:12px}.cm-toolbar{flex-wrap:wrap}.cm-toolbar .cm-btn{flex:1}.cm-meta{grid-template-columns:1fr}}
    `;
    document.head.append(style);
  }

  function buildPanel() {
    const root = $('selectedPanel');
    if (!root || $('bharateeCustomerPanel')) return;
    addStyles();
    panel = document.createElement('section');
    panel.id = 'bharateeCustomerPanel';
    panel.className = 'cm-panel';
    panel.innerHTML = `
      <div class="cm-head"><div><h3>${esc(tr('title'))}</h3><p>${esc(tr('subtitle'))}</p></div><div class="cm-actions"><button class="cm-btn secondary" type="button" id="cmRefresh">${esc(tr('refresh'))}</button><button class="cm-btn" type="button" id="cmAdd">${esc(tr('add'))}</button></div></div>
      <div id="cmNotice" class="cm-notice info" role="status" aria-live="polite" hidden></div>
      <div class="cm-toolbar"><input id="cmSearch" class="cm-search" type="search" maxlength="120" placeholder="${esc(tr('search'))}" aria-label="${esc(tr('search'))}"></div>
      <div class="cm-layout">
        <section class="cm-list"><h4>${esc(tr('customers'))}</h4><div id="cmCustomerList" class="cm-empty">${esc(tr('loading'))}</div></section>
        <section class="cm-detail" id="cmCustomerDetail"><div class="cm-empty">${esc(tr('noSelection'))}</div></section>
      </div>
      <section class="cm-form-wrap" id="cmFormWrap" hidden><h4 id="cmFormTitle">${esc(tr('add'))}</h4>
        <form id="cmCustomerForm">
          <input type="hidden" name="customer_id">
          <div class="cm-form-grid">
            <label class="cm-field">${esc(tr('name'))}<input name="full_name" maxlength="120" required></label>
            <label class="cm-field">${esc(tr('phone'))}<input name="phone" type="tel" maxlength="32" autocomplete="tel"></label>
            <label class="cm-field">${esc(tr('altPhone'))}<input name="alternate_phone" type="tel" maxlength="32"></label>
            <label class="cm-field">${esc(tr('email'))}<input name="email" type="email" maxlength="254" autocomplete="email"></label>
            <label class="cm-field cm-span">${esc(tr('address'))}<textarea name="address" maxlength="500"></textarea></label>
            <label class="cm-field">${esc(tr('language'))}<select name="preferred_locale"><option value="en">${esc(tr('en'))}</option><option value="hi">${esc(tr('hi'))}</option><option value="or">${esc(tr('or'))}</option></select></label>
            <label class="cm-field cm-span">${esc(tr('notes'))}<textarea name="notes" maxlength="2000"></textarea></label>
            <label class="cm-check cm-span"><input type="checkbox" name="whatsapp_opt_in"><span>${esc(tr('whatsappConsent'))}<small>${esc(tr('consentHelp'))}</small></span></label>
          </div>
          <div class="cm-form-buttons"><button class="cm-btn" id="cmSave" type="submit">${esc(tr('save'))}</button><button class="cm-btn secondary" id="cmCancel" type="button">${esc(tr('cancel'))}</button></div>
          <div id="cmFormNotice" class="cm-notice" hidden></div>
        </form>
      </section>`;
    const modules = root.querySelector('.modules');
    root.insertBefore(panel, modules || null);
    $('cmAdd').addEventListener('click', () => openForm(null));
    $('cmRefresh').addEventListener('click', () => loadCustomers());
    $('cmCancel').addEventListener('click', closeForm);
    $('cmCustomerForm').addEventListener('submit', saveCustomer);
    $('cmSearch').addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadCustomers(), 300);
    });
  }

  function currentBusiness() {
    if (typeof selected === 'undefined' || !selected || !selected.business_id) throw new Error('Select a business first.');
    return selected;
  }
  function canEdit() { try { return allowedEditRoles.includes(currentBusiness().role); } catch (_) { return false; } }

  async function loadCustomers(selectId = null) {
    const business = currentBusiness();
    if (!allowedViewRoles.includes(business.role)) {
      $('cmCustomerList').textContent = tr('roleDenied');
      $('cmAdd').hidden = true;
      return;
    }
    $('cmCustomerList').textContent = tr('loading');
    $('cmAdd').hidden = !canEdit();
    const query = $('cmSearch').value.trim();
    const {data,error} = await db.rpc('search_business_customers', {
      p_business_id:business.business_id,
      p_search:query || null,
      p_limit:150
    });
    if (error) {
      console.error('Customer list load:', error);
      $('cmCustomerList').textContent = tr('loadError') + ' ' + (error.message || '');
      return;
    }
    customerRows = data || [];
    renderCustomerList();
    if (selectId) {
      const row = customerRows.find(x => x.customer_id === selectId);
      if (row) await selectCustomer(row);
      else {
        activeCustomer = null;
        $('cmCustomerDetail').innerHTML = `<div class="cm-empty">${esc(tr('noSelection'))}</div>`;
      }
    } else if (activeCustomer) {
      const latest = customerRows.find(x => x.customer_id === activeCustomer.customer_id);
      if (latest) await selectCustomer(latest);
      else {
        activeCustomer = null;
        $('cmCustomerDetail').innerHTML = `<div class="cm-empty">${esc(tr('noSelection'))}</div>`;
      }
    }
    if (!customerRows.length) {
      $('cmCustomerDetail').innerHTML = `<div class="cm-empty">${esc(tr('noSelection'))}</div>`;
      activeCustomer = null;
    }
  }

  function renderCustomerList() {
    const list = $('cmCustomerList');
    list.replaceChildren();
    if (!customerRows.length) {
      const empty = document.createElement('div'); empty.className='cm-empty'; empty.textContent=tr('noCustomers'); list.append(empty); return;
    }
    customerRows.forEach(row => {
      const button = document.createElement('button');
      button.type='button'; button.className='cm-customer';
      button.setAttribute('aria-current',String(activeCustomer && activeCustomer.customer_id===row.customer_id));
      const name=document.createElement('strong'); name.textContent=row.full_name;
      const detail=document.createElement('small');
      const contact=row.phone || row.email || tr('notProvided');
      detail.textContent=contact+' · '+(row.order_count||0)+' '+tr('orderCount');
      button.append(name,detail);
      button.addEventListener('click',()=>selectCustomer(row));
      list.append(button);
    });
  }

  function openForm(row) {
    if (!canEdit()) return showNotice(tr('roleDenied'));
    const form=$('cmCustomerForm'); form.reset();
    form.elements.customer_id.value=row ? row.customer_id : '';
    form.elements.full_name.value=row?.full_name || '';
    form.elements.phone.value=row?.phone || '';
    form.elements.alternate_phone.value=row?.alternate_phone || '';
    form.elements.email.value=row?.email || '';
    form.elements.address.value=row?.address || '';
    form.elements.preferred_locale.value=row?.preferred_locale || lang || 'en';
    form.elements.notes.value=row?.notes || '';
    form.elements.whatsapp_opt_in.checked=!!row?.whatsapp_opt_in;
    $('cmFormTitle').textContent=row ? tr('edit') : tr('add');
    $('cmFormWrap').hidden=false;
    $('cmFormNotice').hidden=true;
    $('cmFormWrap').scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function closeForm() { $('cmFormWrap').hidden=true; $('cmCustomerForm').reset(); }

  async function saveCustomer(event) {
    event.preventDefault();
    const form=event.currentTarget, button=$('cmSave');
    const value=Object.fromEntries(new FormData(form).entries());
    if ((value.full_name || '').trim().length<2) return formMessage(tr('nameRequired'),'error');
    const digits=(value.phone || '').replace(/\D/g,'');
    if (value.phone && (digits.length<7 || digits.length>15)) return formMessage(tr('phoneInvalid'),'error');
    if (form.elements.whatsapp_opt_in.checked && !value.phone) return formMessage(tr('phoneInvalid'),'error');
    const business=currentBusiness();
    button.disabled=true; button.textContent=tr('saving');
    try {
      const {data,error}=await db.rpc('save_business_customer',{
        p_business_id:business.business_id,
        p_customer_id:value.customer_id || null,
        p_full_name:value.full_name.trim(),
        p_phone:value.phone.trim() || null,
        p_alternate_phone:value.alternate_phone.trim() || null,
        p_email:value.email.trim() || null,
        p_address:value.address.trim() || null,
        p_preferred_locale:value.preferred_locale,
        p_whatsapp_opt_in:form.elements.whatsapp_opt_in.checked,
        p_notes:value.notes.trim() || null
      });
      if (error) throw error;
      if (data?.duplicate) {
        closeForm();
        showNotice(tr('duplicate'),'info');
        await loadCustomers(data.customer_id);
        return;
      }
      closeForm();
      showNotice(data?.created ? tr('created') : tr('updated'),'success');
      await loadCustomers(data.customer_id);
    } catch(error) {
      console.error('Save customer:',error);
      formMessage((error && error.message) || tr('saveError'),'error');
    } finally {
      button.disabled=false; button.textContent=tr('save');
    }
  }
  function formMessage(message,kind) {
    const node=$('cmFormNotice'); node.textContent=message; node.className='cm-notice '+kind; node.hidden=false;
  }

  function whatsappLink(customer) {
    if (!customer.whatsapp_opt_in || !customer.phone) return '';
    let digits=customer.phone.replace(/\D/g,'');
    if (digits.length===10) digits='91'+digits;
    else if (digits.length===11 && digits.startsWith('0')) digits='91'+digits.slice(1);
    if (digits.length<11 || digits.length>15) return '';
    return 'https://wa.me/'+digits;
  }

  async function selectCustomer(row) {
    activeCustomer=row;
    renderCustomerList();
    const detail=$('cmCustomerDetail');
    const wa=whatsappLink(row);
    detail.innerHTML=`
      <div class="cm-profile-top"><div><div class="eyebrow">${esc(tr('profile'))}</div><div class="cm-profile-name">${esc(row.full_name)}</div><small class="cm-customer-sub">${esc(row.phone || tr('notProvided'))}</small></div>
        <div class="cm-actions">${canEdit()?`<button id="cmEdit" class="cm-btn secondary" type="button">${esc(tr('edit'))}</button>`:''}${wa?`<a class="cm-whatsapp" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${esc(tr('whatsapp'))}</a>`:''}</div>
      </div>
      ${!wa && row.phone && !row.whatsapp_opt_in?`<div class="cm-notice info">${esc(tr('whatsappNoConsent'))}</div>`:''}
      <div class="cm-meta">
        <div><span>${esc(tr('email'))}</span><b>${esc(row.email || tr('notProvided'))}</b></div>
        <div><span>${esc(tr('altPhone'))}</span><b>${esc(row.alternate_phone || tr('notProvided'))}</b></div>
        <div><span>${esc(tr('address'))}</span><b>${esc(row.address || tr('notProvided'))}</b></div>
        <div><span>${esc(tr('preferred'))}</span><b>${esc(tr(row.preferred_locale || 'en'))}</b></div>
        <div><span>${esc(tr('consent'))}</span><b>${esc(row.whatsapp_opt_in ? tr('optInRecorded') : tr('optInNotRecorded'))}</b></div>
        <div><span>${esc(tr('customerSince'))}</span><b>${esc(niceDate(row.created_at))}</b></div>
      </div>
      ${row.notes?`<div class="cm-notice info">${esc(row.notes)}</div>`:''}
      <div id="cmHistory" class="cm-history"><div class="cm-empty">${esc(tr('loading'))}</div></div>`;
    const edit=$('cmEdit'); if(edit) edit.addEventListener('click',()=>openForm(row));
    await loadCustomerHistory(row);
  }

  function table(title,hint,headers,rows,empty) {
    const header=`<thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>`;
    return `<section class="cm-history"><h5>${esc(title)}</h5><p>${esc(hint)}</p>${rows.length?`<div class="cm-table-wrap"><table class="cm-table">${header}<tbody>${rows.join('')}</tbody></table></div>`:`<div class="cm-empty">${esc(empty)}</div>`}</section>`;
  }

  async function loadCustomerHistory(customer) {
    const business=currentBusiness(),target=$('cmHistory');
    const {data:orders,error:ordersError}=await db.from('orders')
      .select('id,order_no,order_type,status,total,created_at')
      .eq('business_id',business.business_id).eq('customer_id',customer.customer_id)
      .order('created_at',{ascending:false}).limit(30);
    if (ordersError) { console.error(ordersError); target.textContent=tr('loadError'); return; }
    const orderIds=(orders||[]).map(o=>o.id);
    const role=business.role;
    const jobs=[];
    const canEnquiries=['owner','admin','manager','cyber_staff','studio_staff'].includes(role);
    const canBookings=['owner','admin','manager','studio_staff'].includes(role);
    const canPayments=financeRoles.includes(role);
    if (canEnquiries) jobs.push(db.from('enquiries').select('id,enquiry_type,status,source,created_at,preferred_event_at').eq('business_id',business.business_id).eq('customer_id',customer.customer_id).order('created_at',{ascending:false}).limit(20));
    else jobs.push(Promise.resolve({data:[],error:null}));
    if (canPayments && orderIds.length) jobs.push(db.from('payment_transactions').select('order_id,entry_type,amount,payment_method,transaction_at,reference_no').eq('business_id',business.business_id).in('order_id',orderIds).order('transaction_at',{ascending:false}).limit(50));
    else jobs.push(Promise.resolve({data:[],error:null}));
    if (canBookings && orderIds.length) jobs.push(db.from('studio_bookings').select('order_id,event_type,starts_at,status,city').eq('business_id',business.business_id).in('order_id',orderIds).order('starts_at',{ascending:false}).limit(20));
    else jobs.push(Promise.resolve({data:[],error:null}));
    const [enquiriesResult,paymentsResult,bookingsResult]=await Promise.all(jobs);
    if(enquiriesResult.error) console.error('Enquiry history:',enquiriesResult.error);
    if(paymentsResult.error) console.error('Payment history:',paymentsResult.error);
    if(bookingsResult.error) console.error('Booking history:',bookingsResult.error);
    const orderMap=new Map((orders||[]).map(o=>[o.id,o.order_no]));
    const orderRows=(orders||[]).map(o=>`<tr><td>${esc(o.order_no)}</td><td>${esc(o.order_type)}</td><td>${esc(o.status)}</td><td>${esc(money(o.total))}</td><td>${esc(niceDate(o.created_at))}</td></tr>`);
    const enquiryRows=(enquiriesResult.data||[]).map(e=>`<tr><td>${esc(e.enquiry_type)}</td><td>${esc(e.status)}</td><td>${esc(e.source)}</td><td>${esc(niceDate(e.created_at))}</td></tr>`);
    const paymentRows=(paymentsResult.data||[]).map(p=>`<tr><td>${esc(orderMap.get(p.order_id)||'—')}</td><td>${esc(p.entry_type)}</td><td>${esc(p.payment_method)}</td><td>${esc(money(p.amount))}</td><td>${esc(niceDate(p.transaction_at))}</td></tr>`);
    const bookingRows=(bookingsResult.data||[]).map(b=>`<tr><td>${esc(b.event_type)}</td><td>${esc(b.status)}</td><td>${esc(b.city||'—')}</td><td>${esc(niceDate(b.starts_at))}</td></tr>`);
    if (!activeCustomer || activeCustomer.customer_id!==customer.customer_id) return;
    target.innerHTML =
      table(tr('orderHistory'),tr('orderHistoryHint'),[tr('orderNo'),tr('orderType'),tr('status'),tr('total'),tr('date')],orderRows,tr('noOrders')) +
      (canEnquiries?table(tr('enquiryHistory'),tr('enquiryHistoryHint'),[tr('type'),tr('status'),tr('source'),tr('date')],enquiryRows,tr('noEnquiries')):'') +
      (canPayments?table(tr('paymentHistory'),tr('paymentHistoryHint'),[tr('orderNo'),tr('type'),tr('method'),tr('amount'),tr('date')],paymentRows,tr('noPayments')):'') +
      (canBookings?table(tr('bookings'),tr('bookingsHint'),[tr('event'),tr('status'),tr('address'),tr('date')],bookingRows,tr('noBookings')):'');
  }

  function install() {
    const root=$('selectedPanel');
    if(!root || root.classList.contains('hidden') || !selected || !selected.business_id) return;
    buildPanel();
    const business=selected.business_id;
    if(activeBusinessId===business) return;
    activeBusinessId=business; activeCustomer=null; customerRows=[]; closeForm();
    if(!allowedViewRoles.includes(selected.role)) {
      $('cmCustomerList').textContent=tr('roleDenied');
      $('cmAdd').hidden=true;
      return;
    }
    loadCustomers().catch(error=>{console.error('Customer manager:',error);showNotice(error.message||tr('loadError'));});
  }

  function startObserver() {
    if(observerStarted) return;
    const root=$('selectedPanel'); if(!root) return;
    observerStarted=true;
    const observer=new MutationObserver(()=>{
      if(selected && activeBusinessId && selected.business_id!==activeBusinessId) activeBusinessId=null;
      install();
    });
    observer.observe(root,{attributes:true,attributeFilter:['class'],childList:true,subtree:true,characterData:true});
    const langSelect=$('lang');
    if(langSelect) langSelect.addEventListener('change',()=>{
      if(panel){panel.remove();panel=null;activeBusinessId=null;}
      install();
    });
    install();
  }

  document.addEventListener('DOMContentLoaded',startObserver);
  window.addEventListener('load',startObserver);
  setTimeout(startObserver,300);
})();
