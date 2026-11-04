/* BHARATEE GRAPHIX — Wedding & Studio Booking Management
   Requires the existing Supabase client and dashboard global bindings in admin.html:
   db, selected, lang. Load after accounting, finance and customer modules. */
(() => {
  'use strict';

  const L = {
    en: {
      title:'Wedding & Studio Bookings', sub:'Manage events, quotations, advances and production delivery.', add:'New Booking', packages:'Packages', addPackage:'Add Package', hide:'Close', refresh:'Refresh', search:'Search name, phone, venue or order number', statusAll:'All statuses',
      customer:'Customer name', phone:'Mobile number', email:'Email (optional)', locale:'Customer language', event:'Event type', wedding:'Wedding', pre_wedding:'Pre-wedding', engagement:'Engagement', birthday:'Birthday', anniversary:'Anniversary', eventOther:'Event', photography:'Photography', videography:'Videography', other:'Other',
      starts:'Event start', ends:'Event end', venue:'Venue name', address:'Venue address', city:'City', package:'Package', custom:'Custom package / description', total:'Quotation total (₹)', advance:'Advance received (₹)', method:'Advance payment method', cash:'Cash', upi:'UPI', bank_transfer:'Bank transfer', card:'Card', otherMethod:'Other', initialStatus:'Initial booking status', enquiry:'Enquiry', quoted:'Quoted', tentative:'Tentative', confirmed:'Confirmed', referral:'Referral source', notes:'Shoot / event notes', overlap:'I checked the calendar and allow this overlapping booking', save:'Save booking', saving:'Saving…', cancel:'Cancel',
      code:'Package code', nameEn:'Package name (English)', nameHi:'Package name (Hindi)', nameOr:'Package name (Odia)', price:'Base price (₹)', savePackage:'Save package', noPackages:'No saved packages yet. Use Custom package or create one.',
      bookings:'Bookings', noBookings:'No bookings found for this filter.', order:'Order', client:'Customer', date:'Event date', venueCol:'Venue', quote:'Quote', paid:'Received', balance:'Balance', action:'Status / workflow',
      status_enquiry:'Enquiry', status_quoted:'Quoted', status_tentative:'Tentative', status_confirmed:'Confirmed', status_in_progress:'In progress', status_editing:'Editing', status_review:'Client review', status_delivered:'Delivered', status_completed:'Completed', status_cancelled:'Cancelled',
      task_shoot:'Shoot / Event Coverage', task_photo_editing:'Photo Selection & Editing', task_video_editing:'Video Editing', task_album_design:'Album Design & Printing', task_client_review:'Client Review & Approval', task_delivery:'Final Delivery',
      pending:'Pending', in_progress:'In progress', review:'Review', completed:'Completed', blocked:'Blocked',
      digitalOnly:'This module is available in the BHARATEE GRAPHIX workspace. Switch business to open studio bookings.',
      loading:'Loading bookings…', loadingPackages:'Loading packages…', loaded:'Booking workspace ready.', saveOk:'Booking saved successfully.', packageOk:'Package saved.',
      required:'Complete all required fields. Event end must be after event start.', noAccess:'Your role cannot manage studio bookings.',
      error:'Could not complete the request: ', duplicate:'A matching customer phone was linked to the booking.',
      consent:'WhatsApp link is shown only when the customer has recorded WhatsApp consent.',
      scheduleWarning:'Schedule conflict found. Review it before enabling the overlap override.',
      packageRole:'Only Owner, Admin or Manager can add packages.',
      eventStatus:'Booking status', taskStatus:'Task status', contact:'WhatsApp contact', noPhone:'No phone number',
      detail:'Production checklist', customHint:'Choose a saved package or enter a custom package description.',
      zeroAdvance:'No advance collected', totalBalance:'Remaining balance',
      packageSaved:'Package is saved. It can now be selected on a booking.'
    },
    hi: {
      title:'वेडिंग और स्टूडियो बुकिंग', sub:'इवेंट, कोटेशन, एडवांस और प्रोजेक्ट डिलीवरी मैनेज करें।', add:'नई बुकिंग', packages:'पैकेज', addPackage:'पैकेज जोड़ें', hide:'बंद करें', refresh:'रीफ्रेश', search:'नाम, फोन, वेन्यू या ऑर्डर नंबर खोजें', statusAll:'सभी स्टेटस',
      customer:'ग्राहक का नाम', phone:'मोबाइल नंबर', email:'ईमेल (वैकल्पिक)', locale:'ग्राहक की भाषा', event:'इवेंट का प्रकार', wedding:'शादी', pre_wedding:'प्री-वेडिंग', engagement:'सगाई', birthday:'जन्मदिन', anniversary:'सालगिरह', eventOther:'इवेंट', photography:'फोटोग्राफी', videography:'वीडियोग्राफी', other:'अन्य',
      starts:'इवेंट शुरू', ends:'इवेंट समाप्त', venue:'वेन्यू का नाम', address:'वेन्यू का पता', city:'शहर', package:'पैकेज', custom:'कस्टम पैकेज / विवरण', total:'कुल कोटेशन (₹)', advance:'प्राप्त एडवांस (₹)', method:'एडवांस भुगतान माध्यम', cash:'नकद', upi:'UPI', bank_transfer:'बैंक ट्रांसफर', card:'कार्ड', otherMethod:'अन्य', initialStatus:'शुरुआती बुकिंग स्टेटस', enquiry:'पूछताछ', quoted:'कोटेशन दिया', tentative:'अस्थायी', confirmed:'पुष्ट', referral:'रेफरल स्रोत', notes:'शूट / इवेंट नोट्स', overlap:'कैलेंडर जाँच लिया है और ओवरलैपिंग बुकिंग की अनुमति देता/देती हूँ', save:'बुकिंग सेव करें', saving:'सेव हो रहा है…', cancel:'रद्द करें',
      code:'पैकेज कोड', nameEn:'पैकेज नाम (English)', nameHi:'पैकेज नाम (Hindi)', nameOr:'पैकेज नाम (Odia)', price:'बेस कीमत (₹)', savePackage:'पैकेज सेव करें', noPackages:'अभी कोई सेव किया हुआ पैकेज नहीं है। कस्टम पैकेज चुनें या नया बनाएं।',
      bookings:'बुकिंग', noBookings:'इस फ़िल्टर में कोई बुकिंग नहीं मिली।', order:'ऑर्डर', client:'ग्राहक', date:'इवेंट तारीख', venueCol:'वेन्यू', quote:'कोटेशन', paid:'प्राप्त', balance:'बाकी', action:'स्टेटस / वर्कफ़्लो',
      status_enquiry:'पूछताछ', status_quoted:'कोटेशन दिया', status_tentative:'अस्थायी', status_confirmed:'पुष्ट', status_in_progress:'काम जारी', status_editing:'एडिटिंग', status_review:'ग्राहक समीक्षा', status_delivered:'डिलीवर', status_completed:'पूरा', status_cancelled:'रद्द',
      task_shoot:'शूट / इवेंट कवरेज', task_photo_editing:'फोटो चयन और एडिटिंग', task_video_editing:'वीडियो एडिटिंग', task_album_design:'एल्बम डिजाइन और प्रिंटिंग', task_client_review:'ग्राहक समीक्षा और मंजूरी', task_delivery:'अंतिम डिलीवरी',
      pending:'बाकी', in_progress:'काम जारी', review:'समीक्षा', completed:'पूरा', blocked:'रुका हुआ',
      digitalOnly:'यह मॉड्यूल BHARATEE GRAPHIX में उपलब्ध है। स्टूडियो बुकिंग के लिए बिज़नेस बदलें।',
      loading:'बुकिंग लोड हो रही हैं…', loadingPackages:'पैकेज लोड हो रहे हैं…', loaded:'बुकिंग वर्कस्पेस तैयार है।', saveOk:'बुकिंग सफलतापूर्वक सेव हुई।', packageOk:'पैकेज सेव हो गया।',
      required:'सभी जरूरी जानकारी भरें। इवेंट समाप्ति का समय शुरू होने के बाद होना चाहिए।', noAccess:'आपकी भूमिका स्टूडियो बुकिंग मैनेज नहीं कर सकती।',
      error:'अनुरोध पूरा नहीं हुआ: ', duplicate:'मिलते-जुलते मोबाइल नंबर वाले ग्राहक को बुकिंग से लिंक किया गया।',
      consent:'WhatsApp लिंक केवल ग्राहक की दर्ज सहमति होने पर दिखेगा।',
      scheduleWarning:'समय में दूसरी बुकिंग का टकराव है। ओवरलैप अनुमति देने से पहले जाँचें।',
      packageRole:'पैकेज केवल Owner, Admin या Manager जोड़ सकते हैं।',
      eventStatus:'बुकिंग स्टेटस', taskStatus:'टास्क स्टेटस', contact:'WhatsApp संपर्क', noPhone:'फोन नंबर नहीं',
      detail:'प्रोडक्शन चेकलिस्ट', customHint:'सेव किया हुआ पैकेज चुनें या कस्टम विवरण लिखें।',
      zeroAdvance:'कोई एडवांस नहीं लिया', totalBalance:'बाकी राशि',
      packageSaved:'पैकेज सेव हो गया। अब इसे बुकिंग में चुन सकते हैं।'
    },
    or: {
      title:'ୱେଡିଂ ଏବଂ ଷ୍ଟୁଡିଓ ବୁକିଂ', sub:'ଇଭେଣ୍ଟ, କୋଟେସନ୍, ଆଡଭାନ୍ସ ଏବଂ ପ୍ରୋଜେକ୍ଟ ଡେଲିଭରି ପରିଚାଳନା କରନ୍ତୁ।', add:'ନୂଆ ବୁକିଂ', packages:'ପ୍ୟାକେଜ୍', addPackage:'ପ୍ୟାକେଜ୍ ଯୋଡନ୍ତୁ', hide:'ବନ୍ଦ', refresh:'ରିଫ୍ରେସ୍', search:'ନାମ, ଫୋନ୍, ଭେନ୍ୟୁ କିମ୍ବା ଅର୍ଡର୍ ଖୋଜନ୍ତୁ', statusAll:'ସମସ୍ତ ସ୍ଥିତି',
      customer:'ଗ୍ରାହକଙ୍କ ନାମ', phone:'ମୋବାଇଲ୍ ନମ୍ବର', email:'ଇମେଲ୍ (ଇଚ୍ଛାଧୀନ)', locale:'ଗ୍ରାହକଙ୍କ ଭାଷା', event:'ଇଭେଣ୍ଟ ପ୍ରକାର', wedding:'ବିବାହ', pre_wedding:'ପ୍ରି-ୱେଡିଂ', engagement:'ନିର୍ବନ୍ଧ', birthday:'ଜନ୍ମଦିନ', anniversary:'ବାର୍ଷିକୀ', eventOther:'ଇଭେଣ୍ଟ', photography:'ଫଟୋଗ୍ରାଫି', videography:'ଭିଡିଓଗ୍ରାଫି', other:'ଅନ୍ୟାନ୍ୟ',
      starts:'ଇଭେଣ୍ଟ ଆରମ୍ଭ', ends:'ଇଭେଣ୍ଟ ଶେଷ', venue:'ଭେନ୍ୟୁ ନାମ', address:'ଭେନ୍ୟୁ ଠିକଣା', city:'ସହର', package:'ପ୍ୟାକେଜ୍', custom:'କଷ୍ଟମ୍ ପ୍ୟାକେଜ୍ / ବିବରଣୀ', total:'ମୋଟ କୋଟେସନ୍ (₹)', advance:'ପ୍ରାପ୍ତ ଆଡଭାନ୍ସ (₹)', method:'ଆଡଭାନ୍ସ ପେମେଣ୍ଟ ମାଧ୍ୟମ', cash:'ନଗଦ', upi:'UPI', bank_transfer:'ବ୍ୟାଙ୍କ ଟ୍ରାନ୍ସଫର୍', card:'କାର୍ଡ', otherMethod:'ଅନ୍ୟାନ୍ୟ', initialStatus:'ପ୍ରାରମ୍ଭିକ ବୁକିଂ ସ୍ଥିତି', enquiry:'ପଚରାଉଚରା', quoted:'କୋଟେସନ୍ ଦିଆଗଲା', tentative:'ଅସ୍ଥାୟୀ', confirmed:'ନିଶ୍ଚିତ', referral:'ରେଫରାଲ୍ ଉତ୍ସ', notes:'ସୁଟ୍ / ଇଭେଣ୍ଟ ଟିପ୍ପଣୀ', overlap:'କ୍ୟାଲେଣ୍ଡର୍ ଯାଞ୍ଚ କରିଛି ଏବଂ ଏହି ଓଭରଲାପ୍ ବୁକିଂକୁ ଅନୁମତି ଦେଉଛି', save:'ବୁକିଂ ସେଭ୍ କରନ୍ତୁ', saving:'ସେଭ୍ ହେଉଛି…', cancel:'ବାତିଲ୍',
      code:'ପ୍ୟାକେଜ୍ କୋଡ୍', nameEn:'ପ୍ୟାକେଜ୍ ନାମ (English)', nameHi:'ପ୍ୟାକେଜ୍ ନାମ (Hindi)', nameOr:'ପ୍ୟାକେଜ୍ ନାମ (Odia)', price:'ମୂଳ ମୂଲ୍ୟ (₹)', savePackage:'ପ୍ୟାକେଜ୍ ସେଭ୍ କରନ୍ତୁ', noPackages:'କୌଣସି ସେଭ୍ ପ୍ୟାକେଜ୍ ନାହିଁ। କଷ୍ଟମ୍ ପ୍ୟାକେଜ୍ ବାଛନ୍ତୁ କିମ୍ବା ନୂଆ ତିଆରି କରନ୍ତୁ।',
      bookings:'ବୁକିଂ', noBookings:'ଏହି ଫିଲ୍ଟର୍ ପାଇଁ ବୁକିଂ ମିଳିଲା ନାହିଁ।', order:'ଅର୍ଡର୍', client:'ଗ୍ରାହକ', date:'ଇଭେଣ୍ଟ ତାରିଖ', venueCol:'ଭେନ୍ୟୁ', quote:'କୋଟେସନ୍', paid:'ପ୍ରାପ୍ତ', balance:'ବାକି', action:'ସ୍ଥିତି / କାର୍ଯ୍ୟପ୍ରବାହ',
      status_enquiry:'ପଚରାଉଚରା', status_quoted:'କୋଟେସନ୍ ଦିଆଗଲା', status_tentative:'ଅସ୍ଥାୟୀ', status_confirmed:'ନିଶ୍ଚିତ', status_in_progress:'ଚାଲୁଛି', status_editing:'ଏଡିଟିଂ', status_review:'ଗ୍ରାହକ ସମୀକ୍ଷା', status_delivered:'ଡେଲିଭର୍ ହେଲା', status_completed:'ସମ୍ପୂର୍ଣ୍ଣ', status_cancelled:'ବାତିଲ୍',
      task_shoot:'ସୁଟ୍ / ଇଭେଣ୍ଟ କଭରେଜ୍', task_photo_editing:'ଫଟୋ ଚୟନ ଓ ଏଡିଟିଂ', task_video_editing:'ଭିଡିଓ ଏଡିଟିଂ', task_album_design:'ଆଲବମ୍ ଡିଜାଇନ୍ ଓ ପ୍ରିଣ୍ଟିଂ', task_client_review:'ଗ୍ରାହକ ସମୀକ୍ଷା ଓ ଅନୁମୋଦନ', task_delivery:'ଅନ୍ତିମ ଡେଲିଭରି',
      pending:'ବାକି', in_progress:'ଚାଲୁଛି', review:'ସମୀକ୍ଷା', completed:'ସମ୍ପୂର୍ଣ୍ଣ', blocked:'ଅଟକିଛି',
      digitalOnly:'ଏହି ମଡ୍ୟୁଲ୍ BHARATEE GRAPHIX ୱର୍କସ୍ପେସ୍‌ରେ ଉପଲବ୍ଧ। ଷ୍ଟୁଡିଓ ବୁକିଂ ପାଇଁ ବ୍ୟବସାୟ ବଦଳାନ୍ତୁ।',
      loading:'ବୁକିଂ ଲୋଡ୍ ହେଉଛି…', loadingPackages:'ପ୍ୟାକେଜ୍ ଲୋଡ୍ ହେଉଛି…', loaded:'ବୁକିଂ ୱର୍କସ୍ପେସ୍ ପ୍ରସ୍ତୁତ।', saveOk:'ବୁକିଂ ସଫଳତାର ସହ ସେଭ୍ ହେଲା।', packageOk:'ପ୍ୟାକେଜ୍ ସେଭ୍ ହେଲା।',
      required:'ସମସ୍ତ ଆବଶ୍ୟକ ତଥ୍ୟ ଭରନ୍ତୁ। ଇଭେଣ୍ଟ ଶେଷ ସମୟ ଆରମ୍ଭ ପରେ ହେବା ଆବଶ୍ୟକ।', noAccess:'ଆପଣଙ୍କ ଭୂମିକା ଷ୍ଟୁଡିଓ ବୁକିଂ ପରିଚାଳନା କରିପାରିବ ନାହିଁ।',
      error:'ଅନୁରୋଧ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇପାରିଲା ନାହିଁ: ', duplicate:'ସମାନ ଫୋନ୍ ନମ୍ବର ଥିବା ଗ୍ରାହକଙ୍କୁ ବୁକିଂ ସହିତ ଯୋଡାଗଲା।',
      consent:'ଗ୍ରାହକଙ୍କ WhatsApp ସମ୍ମତି ରେକର୍ଡ ଥିଲେ ମାତ୍ର WhatsApp ଲିଙ୍କ୍ ଦେଖାଯିବ।',
      scheduleWarning:'ସମୟରେ ଅନ୍ୟ ବୁକିଂ ସହିତ ମେଳ ଅଛି। ଓଭରଲାପ୍ ଅନୁମତି ପୂର୍ବରୁ ଯାଞ୍ଚ କରନ୍ତୁ।',
      packageRole:'କେବଳ Owner, Admin କିମ୍ବା Manager ପ୍ୟାକେଜ୍ ଯୋଡିପାରିବେ।',
      eventStatus:'ବୁକିଂ ସ୍ଥିତି', taskStatus:'କାର୍ଯ୍ୟ ସ୍ଥିତି', contact:'WhatsApp ଯୋଗାଯୋଗ', noPhone:'ଫୋନ୍ ନମ୍ବର ନାହିଁ',
      detail:'ପ୍ରୋଡକ୍ସନ୍ ଚେକଲିଷ୍ଟ', customHint:'ସେଭ୍ ପ୍ୟାକେଜ୍ ବାଛନ୍ତୁ କିମ୍ବା କଷ୍ଟମ୍ ବିବରଣୀ ଲେଖନ୍ତୁ।',
      zeroAdvance:'କୌଣସି ଆଡଭାନ୍ସ ନିଆଯାଇନାହିଁ', totalBalance:'ବାକି ରାଶି',
      packageSaved:'ପ୍ୟାକେଜ୍ ସେଭ୍ ହେଲା। ଏବେ ବୁକିଂରେ ବାଛିପାରିବେ।'
    }
  };

  const STATUS_VALUES = ['enquiry','quoted','tentative','confirmed','in_progress','editing','review','delivered','completed','cancelled'];
  const TASK_VALUES = ['pending','in_progress','review','completed','blocked'];
  let panel = null, packages = [], bookings = [], currentBusinessId = null, observerStarted = false;
  const $ = (id) => document.getElementById(id);
  const tr = (key) => ((L[lang] || L.en)[key] || L.en[key] || key);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money = (value) => new Intl.NumberFormat(lang==='or'?'or-IN':lang==='hi'?'hi-IN':'en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(value||0));
  const role = () => { try { return selected?.role || ''; } catch (_) { return ''; } };
  const businessId = () => { try { return selected?.business_id || null; } catch (_) { return null; } };
  const isGraphix = () => { try { return selected?.business_units?.code === 'graphix'; } catch (_) { return false; } };
  const canManagePackages = () => ['owner','admin','manager'].includes(role());
  const toLocalDate = (value) => value ? new Intl.DateTimeFormat(lang==='or'?'or-IN':lang==='hi'?'hi-IN':'en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) : '—';
  const jsonName = (obj) => obj && (obj[lang] || obj.en || obj.hi || obj.or) || '';
  const showNotice = (text, kind='info') => { const n=$('wbNotice'); if(!n) return; n.textContent=text; n.className='wb-notice '+kind; n.hidden=false; };
  const clearNotice = () => { const n=$('wbNotice'); if(n){n.hidden=true;n.textContent='';} };

  function styles() {
    if ($('bharateeWeddingStyles')) return;
    const s=document.createElement('style'); s.id='bharateeWeddingStyles';
    s.textContent=`
      .wb-panel{margin:20px 0;padding:20px;background:#fff;border:1px solid rgba(13,44,107,.16);border-radius:12px;color:#14203D}
      .wb-panel *{box-sizing:border-box}.wb-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}.wb-head h3{font:700 22px 'Baloo 2';color:#081E4D;margin:0 0 4px}.wb-head p{margin:0;color:#6C7895;font-size:11px;line-height:1.5}
      .wb-actions{display:flex;gap:8px;flex-wrap:wrap}.wb-btn{border:0;border-radius:7px;padding:10px 14px;background:#0D2C6B;color:#fff;font:600 10px 'IBM Plex Mono';cursor:pointer}.wb-btn:hover{background:#F26522}.wb-btn.secondary{background:#fff;color:#0D2C6B;border:1px solid rgba(13,44,107,.2)}.wb-btn:disabled{opacity:.55;cursor:wait}
      .wb-notice{margin:12px 0;padding:10px 12px;border-radius:7px;font-size:11px;line-height:1.5}.wb-notice[hidden]{display:none}.wb-notice.error{background:#fff1ed;border:1px solid #f0c2b5;color:#8b321a}.wb-notice.success{background:#eff8ef;border:1px solid #c2e3c0;color:#176b11}.wb-notice.info{background:#f3f6fc;border:1px solid rgba(13,44,107,.15);color:#3A5590}
      .wb-toolbar{display:flex;gap:9px;margin:16px 0;align-items:center;flex-wrap:wrap}.wb-search{height:38px;min-width:180px;flex:1;border:1px solid rgba(13,44,107,.2);border-radius:7px;padding:8px 11px;font:12px 'IBM Plex Sans'}.wb-select{height:38px;border:1px solid rgba(13,44,107,.2);border-radius:7px;padding:7px;font:11px 'IBM Plex Sans';color:#14203D;background:white}
      .wb-form{margin:14px 0;padding:16px;border:1px solid rgba(13,44,107,.14);border-radius:10px;background:#FFFBF3}.wb-form h4{margin:0 0 13px;color:#081E4D;font:700 16px 'Baloo 2'}.wb-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.wb-field{display:grid;gap:5px;color:#3A5590;font:600 9px 'IBM Plex Mono';text-transform:uppercase;min-width:0}.wb-field input,.wb-field select,.wb-field textarea{width:100%;min-width:0;height:37px;border:1px solid rgba(13,44,107,.2);border-radius:6px;padding:8px;font:12px 'IBM Plex Sans';color:#14203D;background:#fff}.wb-field textarea{height:70px;resize:vertical}.wb-span{grid-column:1/-1}.wb-check{display:flex;gap:8px;align-items:flex-start;color:#3A5590;font-size:11px;line-height:1.5}.wb-check input{margin-top:2px}.wb-tip{font-size:10px;color:#6C7895;margin:6px 0 0}.wb-form-actions{display:flex;gap:8px;margin-top:13px;flex-wrap:wrap}
      .wb-list{display:grid;gap:11px}.wb-card{border:1px solid rgba(13,44,107,.14);border-radius:10px;padding:14px;background:#fff}.wb-card-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.wb-card h4{margin:0 0 4px;font:700 16px 'Baloo 2';color:#081E4D}.wb-meta{color:#6C7895;font-size:10px;line-height:1.7}.wb-pill{display:inline-block;padding:5px 8px;border-radius:99px;background:#f3f6fc;color:#0D2C6B;font:600 9px 'IBM Plex Mono'}.wb-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:11px}.wb-stat{background:#FFFBF3;padding:9px;border-radius:7px;min-width:0}.wb-stat span{display:block;font:600 8px 'IBM Plex Mono';color:#6C7895;text-transform:uppercase}.wb-stat b{display:block;margin-top:5px;font:600 12px 'IBM Plex Mono';color:#081E4D;overflow-wrap:anywhere}.wb-card-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:11px}.wb-tasks{margin-top:11px;border-top:1px solid rgba(13,44,107,.1);padding-top:10px}.wb-tasks summary{cursor:pointer;color:#0D2C6B;font:600 10px 'IBM Plex Mono'}.wb-task{display:grid;grid-template-columns:minmax(0,1fr) 135px;gap:8px;align-items:center;margin-top:8px;font-size:10px;color:#3A5590}.wb-task select{width:100%;height:32px;border:1px solid rgba(13,44,107,.2);border-radius:6px;background:white;padding:5px;font-size:10px}
      .wb-empty{padding:16px;color:#6C7895;font-size:11px;line-height:1.5;border:1px dashed rgba(13,44,107,.18);border-radius:8px}.wb-wa{display:inline-block;text-decoration:none;border-radius:7px;padding:8px 10px;background:#eff8ef;color:#176b11;font:600 9px 'IBM Plex Mono'}
      @media(max-width:760px){.wb-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wb-span{grid-column:1/-1}}
      @media(max-width:520px){.wb-panel{padding:12px}.wb-grid{grid-template-columns:1fr}.wb-span{grid-column:auto}.wb-stats{grid-template-columns:1fr}.wb-task{grid-template-columns:1fr}.wb-toolbar>*{width:100%}}
    `; document.head.append(s);
  }

  function buildPanel() {
    const root=$('selectedPanel'); if(!root || $('bharateeWeddingPanel')) return;
    styles();
    panel=document.createElement('section'); panel.id='bharateeWeddingPanel'; panel.className='wb-panel';
    panel.innerHTML=`
      <div class="wb-head"><div><h3>${esc(tr('title'))}</h3><p>${esc(tr('sub'))}</p></div><div class="wb-actions"><button id="wbRefresh" class="wb-btn secondary" type="button">${esc(tr('refresh'))}</button><button id="wbPackagesToggle" class="wb-btn secondary" type="button">${esc(tr('packages'))}</button><button id="wbAddToggle" class="wb-btn" type="button">${esc(tr('add'))}</button></div></div>
      <div id="wbNotice" class="wb-notice info" role="status" aria-live="polite" hidden></div>
      <section id="wbPackageForm" class="wb-form" hidden><h4>${esc(tr('addPackage'))}</h4><form id="wbPackageSave"><div class="wb-grid">
        <label class="wb-field">${esc(tr('code'))}<input name="code" maxlength="30"></label>
        <label class="wb-field">${esc(tr('nameEn'))}<input name="name_en" required maxlength="100"></label>
        <label class="wb-field">${esc(tr('nameHi'))}<input name="name_hi" maxlength="100"></label>
        <label class="wb-field">${esc(tr('nameOr'))}<input name="name_or" maxlength="100"></label>
        <label class="wb-field">${esc(tr('price'))}<input name="price" type="number" min="0" step="0.01" required></label>
      </div><div class="wb-form-actions"><button class="wb-btn" type="submit">${esc(tr('savePackage'))}</button><button class="wb-btn secondary" type="button" id="wbPackageCancel">${esc(tr('cancel'))}</button></div></form></section>
      <section id="wbBookingForm" class="wb-form" hidden><h4>${esc(tr('add'))}</h4><form id="wbBookingSave"><div class="wb-grid">
        <label class="wb-field">${esc(tr('customer'))}<input name="customer_name" required maxlength="120"></label>
        <label class="wb-field">${esc(tr('phone'))}<input name="phone" type="tel" required maxlength="32"></label>
        <label class="wb-field">${esc(tr('email'))}<input name="email" type="email" maxlength="254"></label>
        <label class="wb-field">${esc(tr('locale'))}<select name="locale"><option value="en">English</option><option value="hi">हिन्दी</option><option value="or">ଓଡ଼ିଆ</option></select></label>
        <label class="wb-field">${esc(tr('event'))}<select name="event_type">${['wedding','pre_wedding','engagement','birthday','anniversary','event','photography','videography','other'].map(x=>`<option value="${x}">${esc(tr(x))}</option>`).join('')}</select></label>
        <label class="wb-field">${esc(tr('package'))}<select name="package_id" id="wbPackageSelect"><option value="">${esc(tr('custom'))}</option></select></label>
        <label class="wb-field">${esc(tr('custom'))}<input name="package_name" maxlength="150" placeholder="e.g. Wedding Photo + Video + Album"></label>
        <label class="wb-field">${esc(tr('starts'))}<input name="starts_at" type="datetime-local" required></label>
        <label class="wb-field">${esc(tr('ends'))}<input name="ends_at" type="datetime-local" required></label>
        <label class="wb-field">${esc(tr('venue'))}<input name="venue_name" maxlength="160"></label>
        <label class="wb-field">${esc(tr('address'))}<input name="venue_address" maxlength="300"></label>
        <label class="wb-field">${esc(tr('city'))}<input name="city" maxlength="100"></label>
        <label class="wb-field">${esc(tr('total'))}<input name="total" type="number" min="1" step="0.01" required></label>
        <label class="wb-field">${esc(tr('advance'))}<input name="advance" type="number" min="0" step="0.01" value="0"></label>
        <label class="wb-field">${esc(tr('method'))}<select name="payment_method"><option value="cash">${esc(tr('cash'))}</option><option value="upi">UPI</option><option value="bank_transfer">${esc(tr('bank_transfer'))}</option><option value="card">${esc(tr('card'))}</option><option value="other">${esc(tr('otherMethod'))}</option></select></label>
        <label class="wb-field">${esc(tr('initialStatus'))}<select name="status"><option value="tentative">${esc(tr('tentative'))}</option><option value="enquiry">${esc(tr('enquiry'))}</option><option value="quoted">${esc(tr('quoted'))}</option><option value="confirmed">${esc(tr('confirmed'))}</option></select></label>
        <label class="wb-field">${esc(tr('referral'))}<input name="referral_source" maxlength="100"></label>
        <label class="wb-field wb-span">${esc(tr('notes'))}<textarea name="shoot_notes" maxlength="2000"></textarea></label>
        <label class="wb-check wb-span"><input name="allow_overlap" type="checkbox"><span>${esc(tr('overlap'))}<small class="wb-tip">${esc(tr('scheduleWarning'))}</small></span></label>
      </div><div class="wb-form-actions"><button id="wbBookingSubmit" class="wb-btn" type="submit">${esc(tr('save'))}</button><button id="wbBookingCancel" class="wb-btn secondary" type="button">${esc(tr('cancel'))}</button></div></form></section>
      <div class="wb-toolbar"><input id="wbSearch" class="wb-search" type="search" placeholder="${esc(tr('search'))}"><select id="wbStatusFilter" class="wb-select"><option value="">${esc(tr('statusAll'))}</option>${STATUS_VALUES.map(s=>`<option value="${s}">${esc(tr('status_'+s))}</option>`).join('')}</select></div>
      <div id="wbBookings" class="wb-list"><div class="wb-empty">${esc(tr('loading'))}</div></div>`;
    const modules=root.querySelector('.modules'); root.insertBefore(panel,modules||null);
    $('wbRefresh').addEventListener('click',()=>loadAll());
    $('wbAddToggle').addEventListener('click',()=>{ $('wbBookingForm').hidden=!$('wbBookingForm').hidden; $('wbPackageForm').hidden=true; });
    $('wbPackagesToggle').addEventListener('click',()=>{ $('wbPackageForm').hidden=!$('wbPackageForm').hidden; $('wbBookingForm').hidden=true; });
    $('wbPackageCancel').addEventListener('click',()=>{$('wbPackageForm').hidden=true;});
    $('wbBookingCancel').addEventListener('click',()=>{$('wbBookingForm').hidden=true;});
    $('wbPackageSave').addEventListener('submit',savePackage);
    $('wbBookingSave').addEventListener('submit',saveBooking);
    $('wbStatusFilter').addEventListener('change',loadBookings);
    $('wbSearch').addEventListener('input',renderBookings);
    $('wbBookings').addEventListener('change',handleBookingChange);
  }

  function applyWorkspaceVisibility() {
    buildPanel(); if(!panel) return;
    const graphix=isGraphix();
    panel.hidden=!graphix;
    if(!graphix) { showNotice(tr('digitalOnly'),'info'); return; }
    if(currentBusinessId!==businessId()) { currentBusinessId=businessId(); loadAll(); }
    $('wbPackagesToggle').hidden=!canManagePackages();
    if(!['owner','admin','manager','studio_staff'].includes(role())) {
      $('wbAddToggle').hidden=true; showNotice(tr('noAccess'),'error');
    } else { $('wbAddToggle').hidden=false; }
  }

  async function loadPackages() {
    const id=businessId(); if(!id) return;
    const {data,error}=await db.rpc('list_studio_packages',{p_business_id:id});
    if(error) throw error;
    packages=Array.isArray(data)?data:[];
    const select=$('wbPackageSelect'); if(select) {
      const value=select.value;
      select.innerHTML=`<option value="">${esc(tr('custom'))}</option>`+packages.map(p=>`<option value="${esc(p.id)}" data-price="${Number(p.base_price)||0}" data-name="${esc(jsonName(p.name_i18n))}">${esc(jsonName(p.name_i18n))} — ${esc(money(p.base_price))}</option>`).join('');
      if(value) select.value=value;
      select.onchange=()=>{const opt=select.selectedOptions[0]; if(opt&&opt.dataset.price){const form=$('wbBookingSave');form.elements.total.value=opt.dataset.price;form.elements.package_name.value=opt.dataset.name;}};
    }
    if(select) select.insertAdjacentHTML('afterend',`<small class="wb-tip">${esc(tr('customHint'))} ${packages.length? '':esc(tr('noPackages'))}</small>`);
  }

  async function loadBookings() {
    const id=businessId(); if(!id) return;
    $('wbBookings').innerHTML=`<div class="wb-empty">${esc(tr('loading'))}</div>`;
    const status=$('wbStatusFilter').value||null;
    const from=new Date(); from.setMonth(from.getMonth()-3);
    const to=new Date(); to.setFullYear(to.getFullYear()+2);
    const {data,error}=await db.rpc('list_studio_bookings',{
      p_business_id:id,p_from:from.toISOString(),p_to:to.toISOString(),p_status:status,p_limit:200
    });
    if(error) throw error;
    bookings=Array.isArray(data)?data:[];
    renderBookings();
  }

  async function loadAll() {
    if(!isGraphix()) return;
    clearNotice();
    try { await loadPackages(); await loadBookings(); showNotice(tr('loaded'),'success'); }
    catch(error) { console.error('Studio booking load failed:',error); showNotice(tr('error')+(error.message||''),'error'); }
  }

  function renderBookings() {
    const root=$('wbBookings'); if(!root) return;
    const query=($('wbSearch')?.value||'').trim().toLowerCase();
    const rows=bookings.filter(b=>!query||[b.order_no,b.event_type,b.venue_name,b.city,b.customer?.full_name,b.customer?.phone].some(v=>String(v||'').toLowerCase().includes(query)));
    if(!rows.length){root.innerHTML=`<div class="wb-empty">${esc(tr('noBookings'))}</div>`;return;}
    root.innerHTML=rows.map(b=>{
      const customer=b.customer||{};
      const phoneDigits=String(customer.phone||'').replace(/[^0-9]/g,'');
      const wa=customer.whatsapp_opt_in&&phoneDigits?`<a class="wb-wa" target="_blank" rel="noopener" href="https://wa.me/${esc(phoneDigits)}">${esc(tr('contact'))}</a>`:'';
      const tasks=Array.isArray(b.tasks)?b.tasks:[];
      return `<article class="wb-card" data-booking="${esc(b.booking_id)}">
        <div class="wb-card-top"><div><h4>${esc(customer.full_name||'—')} · ${esc(tr(b.event_type)||b.event_type)}</h4><div class="wb-meta">${esc(b.order_no)} · ${esc(toLocalDate(b.starts_at))}<br>${esc(b.venue_name||'')}${b.city?' · '+esc(b.city):''}<br>${esc(customer.phone||'')}</div></div><span class="wb-pill">${esc(tr('status_'+b.status))}</span></div>
        <div class="wb-stats"><div class="wb-stat"><span>${esc(tr('quote'))}</span><b>${esc(money(b.total))}</b></div><div class="wb-stat"><span>${esc(tr('paid'))}</span><b>${esc(money(b.received))}</b></div><div class="wb-stat"><span>${esc(tr('balance'))}</span><b>${esc(money(b.balance))}</b></div></div>
        <div class="wb-card-tools"><label class="wb-field" style="min-width:190px">${esc(tr('eventStatus'))}<select class="wb-select" data-action="status" data-id="${esc(b.booking_id)}">${STATUS_VALUES.map(s=>`<option value="${s}" ${s===b.status?'selected':''}>${esc(tr('status_'+s))}</option>`).join('')}</select></label>${wa}</div>
        ${tasks.length?`<details class="wb-tasks"><summary>${esc(tr('detail'))} (${tasks.filter(t=>t.status==='completed').length}/${tasks.length})</summary>${tasks.map(task=>`<label class="wb-task"><span>${esc(tr('task_'+task.task_code))}</span><select data-action="task" data-id="${esc(task.id)}" data-booking="${esc(b.booking_id)}">${TASK_VALUES.map(s=>`<option value="${s}" ${s===task.status?'selected':''}>${esc(tr(s))}</option>`).join('')}</select></label>`).join('')}</details>`:''}
      </article>`;
    }).join('');
  }

  async function savePackage(event) {
    event.preventDefault(); if(!canManagePackages()) return showNotice(tr('packageRole'),'error');
    const form=event.currentTarget, data=new FormData(form);
    const nameEn=String(data.get('name_en')||'').trim();
    if(!nameEn || Number(data.get('price'))<0) return showNotice(tr('required'),'error');
    const {error}=await db.rpc('save_studio_package',{
      p_business_id:businessId(),p_package_id:null,p_package_code:String(data.get('code')||'').trim()||null,
      p_name_i18n:{en:nameEn,hi:String(data.get('name_hi')||'').trim()||nameEn,or:String(data.get('name_or')||'').trim()||nameEn},
      p_description_i18n:{},p_inclusions_i18n:[],p_base_price:Number(data.get('price')),p_is_active:true
    });
    if(error){console.error(error);showNotice(tr('error')+error.message,'error');return;}
    form.reset();$('wbPackageForm').hidden=true;await loadPackages();showNotice(tr('packageSaved'),'success');
  }

  async function saveBooking(event) {
    event.preventDefault(); clearNotice();
    if(!['owner','admin','manager','studio_staff'].includes(role())) return showNotice(tr('noAccess'),'error');
    const form=event.currentTarget, data=new FormData(form);
    const startValue=data.get('starts_at'),endValue=data.get('ends_at');
    const start=new Date(startValue),end=new Date(endValue);
    const total=Number(data.get('total')),advance=Number(data.get('advance')||0);
    if(!data.get('customer_name')||!data.get('phone')||!startValue||!endValue||Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||end<=start||!Number.isFinite(total)||total<=0||advance<0||advance>total) return showNotice(tr('required'),'error');
    const packageId=String(data.get('package_id')||'')||null;
    const submit=$('wbBookingSubmit');submit.disabled=true;submit.textContent=tr('saving');
    const {data:result,error}=await db.rpc('create_studio_booking',{
      p_business_id:businessId(),p_customer_id:null,p_customer_name:String(data.get('customer_name')).trim(),
      p_phone:String(data.get('phone')).trim(),p_email:String(data.get('email')).trim()||null,
      p_preferred_locale:String(data.get('locale')||'en'),p_event_type:String(data.get('event_type')),
      p_starts_at:start.toISOString(),p_ends_at:end.toISOString(),
      p_venue_name:String(data.get('venue_name')||'').trim()||null,p_venue_address:String(data.get('venue_address')||'').trim()||null,
      p_city:String(data.get('city')||'').trim()||null,p_package_id:packageId,
      p_package_name:String(data.get('package_name')||'').trim()||null,p_total:total,p_advance:advance,
      p_payment_method:String(data.get('payment_method')||'cash'),p_status:String(data.get('status')||'tentative'),
      p_allow_overlap:Boolean(data.get('allow_overlap')),p_referral_source:String(data.get('referral_source')||'').trim()||null,
      p_shoot_notes:String(data.get('shoot_notes')||'').trim()||null,p_assigned_to:null
    });
    submit.disabled=false;submit.textContent=tr('save');
    if(error){console.error('Create booking:',error);showNotice(tr('error')+error.message,'error');return;}
    form.reset();$('wbBookingForm').hidden=true;await loadBookings();
    showNotice(tr('saveOk')+' '+(result?.order_no||''),'success');
  }

  async function handleBookingChange(event) {
    const select=event.target.closest('select[data-action]'); if(!select) return;
    const action=select.dataset.action, id=select.dataset.id, newStatus=select.value;
    select.disabled=true;
    let result;
    if(action==='status') result=await db.rpc('update_studio_booking_status',{p_business_id:businessId(),p_booking_id:id,p_status:newStatus});
    else result=await db.rpc('update_studio_booking_task',{p_business_id:businessId(),p_task_id:id,p_status:newStatus,p_due_at:null,p_notes:null,p_assigned_to:null});
    select.disabled=false;
    if(result.error){console.error('Update booking workflow:',result.error);showNotice(tr('error')+result.error.message,'error');await loadBookings();return;}
    await loadBookings();showNotice(tr('loaded'),'success');
  }

  function installObserver() {
    const root=$('selectedPanel'), name=$('selectedName'); if(!root||!name||observerStarted) return;
    observerStarted=true;
    const observer=new MutationObserver(()=>applyWorkspaceVisibility());
    observer.observe(root,{attributes:true,attributeFilter:['class']});
    observer.observe(name,{childList:true,characterData:true,subtree:true});
    const language=$('lang'); if(language) language.addEventListener('change',()=>{
      const old=$('bharateeWeddingPanel'); if(old){old.remove();panel=null;}
      buildPanel();applyWorkspaceVisibility();if(isGraphix())loadAll();
    });
    buildPanel();applyWorkspaceVisibility();
  }

  document.addEventListener('DOMContentLoaded',installObserver);
  window.addEventListener('load',installObserver);
  setTimeout(installObserver,0);
})();
