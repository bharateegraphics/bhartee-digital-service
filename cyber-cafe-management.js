/* BHARATEE DIGITAL SERVICE — Cyber Café / Counter Management
   Load after admin.html and the accounting, finance and customer modules.
   Requires the existing global lexical bindings: db, selected, lang. */
(() => {
  'use strict';

  const L = {
    en: {
      title:'Cyber Café & Digital Service', sub:'Track government applications, counter jobs, printing orders and customer delivery.',
      dashboard:'Today at the counter', ordersToday:'Orders today', orderValue:'Order value today',
      collections:'Collected today', openJobs:'Open jobs', readyJobs:'Ready for pickup',
      applications:'Applications in progress', pending:'Pending customer balance',
      newJob:'New counter job', refresh:'Refresh', close:'Close', save:'Save job', saving:'Saving…',
      search:'Search customer, phone, order, service or application reference', serviceFilter:'All service types',
      deliveryFilter:'All delivery statuses', jobRegister:'Counter job register', noJobs:'No counter jobs found.',
      customer:'Customer name', phone:'Mobile number', email:'Email (optional)', language:'Customer language',
      service:'Service type', serviceName:'Service / application name', portal:'Government portal (optional)',
      reference:'Application reference number', appStatus:'Application status', expected:'Expected delivery',
      quantity:'Quantity / copies', unitPrice:'Unit price (₹)', discount:'Discount (₹)',
      initialPayment:'Payment received now (₹)', paymentMethod:'Payment method', paymentRef:'UPI / bank reference (optional)',
      documents:'Required documents (one per line)', notes:'Notes / instructions',
      government_application:'Government application', printing:'Printing', photocopy:'Photocopy',
      scan:'Scanning', lamination:'Lamination', passport_photo:'Passport photo',
      photo_frame:'Photo frame', photo_editing:'Photo editing / reprint', other:'Other counter service',
      not_applicable:'Not applicable', not_started:'Not started', submitted:'Submitted',
      under_review:'Under review', approved:'Approved', rejected:'Rejected', completed:'Completed',
      pendingStatus:'Pending', ready:'Ready', delivered:'Delivered', picked_up:'Picked up', cancelled:'Cancelled',
      received:'Received', in_progress:'In progress', on_hold:'On hold',
      orderStatus:'Job status', deliveryStatus:'Delivery status', update:'Update job',
      addPayment:'Record payment', amount:'Amount (₹)', recordPayment:'Record payment',
      total:'Total', receivedAmount:'Received', balance:'Balance due', orderNo:'Order number',
      created:'Created', customerDetails:'Customer', applicationDetails:'Application details',
      whatsapp:'WhatsApp contact', noConsent:'WhatsApp consent not recorded',
      saved:'Counter job saved.', updated:'Job status updated.', paymentSaved:'Payment recorded.',
      roleError:'Your role can view counter jobs but cannot create or update them.',
      error:'Could not complete the request: ', loading:'Loading counter jobs…',
      digitalOnly:'This module is available in the BHARATEE DIGITAL SERVICE workspace. Switch business to open counter management.',
      chooseBusiness:'Select BHARATEE DIGITAL SERVICE to continue.',
      docs:'Document checklist', noDocs:'No document checklist added.',
      all:'All', today:'Today', cash:'Cash', upi:'UPI', bank_transfer:'Bank transfer', card:'Card', otherMethod:'Other',
      serviceMap:'Service / portal'
    },
    hi: {
      title:'साइबर कैफे और डिजिटल सेवा', sub:'सरकारी आवेदन, काउंटर जॉब, प्रिंटिंग ऑर्डर और डिलीवरी ट्रैक करें।',
      dashboard:'आज का काउंटर सारांश', ordersToday:'आज के ऑर्डर', orderValue:'आज के ऑर्डर का मूल्य',
      collections:'आज प्राप्त राशि', openJobs:'खुले काम', readyJobs:'पिकअप के लिए तैयार',
      applications:'चल रहे आवेदन', pending:'ग्राहकों से बाकी राशि',
      newJob:'नया काउंटर जॉब', refresh:'रीफ्रेश', close:'बंद करें', save:'जॉब सेव करें', saving:'सेव हो रहा है…',
      search:'ग्राहक, फोन, ऑर्डर, सेवा या आवेदन नंबर खोजें', serviceFilter:'सभी सेवाएँ',
      deliveryFilter:'सभी डिलीवरी स्टेटस', jobRegister:'काउंटर जॉब रजिस्टर', noJobs:'कोई काउंटर जॉब नहीं मिला।',
      customer:'ग्राहक का नाम', phone:'मोबाइल नंबर', email:'ईमेल (वैकल्पिक)', language:'ग्राहक की भाषा',
      service:'सेवा का प्रकार', serviceName:'सेवा / आवेदन का नाम', portal:'सरकारी पोर्टल (वैकल्पिक)',
      reference:'आवेदन रेफरेंस नंबर', appStatus:'आवेदन का स्टेटस', expected:'डिलीवरी की अपेक्षित तारीख',
      quantity:'मात्रा / कॉपी', unitPrice:'प्रति यूनिट कीमत (₹)', discount:'छूट (₹)',
      initialPayment:'अभी प्राप्त भुगतान (₹)', paymentMethod:'भुगतान का माध्यम', paymentRef:'UPI / बैंक रेफरेंस (वैकल्पिक)',
      documents:'जरूरी दस्तावेज (हर लाइन में एक)', notes:'नोट्स / निर्देश',
      government_application:'सरकारी आवेदन', printing:'प्रिंटिंग', photocopy:'फोटोकॉपी',
      scan:'स्कैनिंग', lamination:'लैमिनेशन', passport_photo:'पासपोर्ट फोटो',
      photo_frame:'फोटो फ्रेम', photo_editing:'फोटो एडिटिंग / रीप्रिंट', other:'अन्य काउंटर सेवा',
      not_applicable:'लागू नहीं', not_started:'शुरू नहीं', submitted:'जमा किया गया',
      under_review:'जाँच जारी', approved:'स्वीकृत', rejected:'अस्वीकृत', completed:'पूरा',
      pendingStatus:'बाकी', ready:'तैयार', delivered:'डिलीवर', picked_up:'ले लिया', cancelled:'रद्द',
      received:'प्राप्त', in_progress:'काम जारी', on_hold:'रुका हुआ',
      orderStatus:'काम का स्टेटस', deliveryStatus:'डिलीवरी स्टेटस', update:'जॉब अपडेट करें',
      addPayment:'भुगतान दर्ज करें', amount:'राशि (₹)', recordPayment:'भुगतान सेव करें',
      total:'कुल', receivedAmount:'प्राप्त', balance:'बाकी राशि', orderNo:'ऑर्डर नंबर',
      created:'बनाया गया', customerDetails:'ग्राहक', applicationDetails:'आवेदन विवरण',
      whatsapp:'WhatsApp संपर्क', noConsent:'WhatsApp की सहमति दर्ज नहीं है',
      saved:'काउंटर जॉब सेव हो गया।', updated:'जॉब स्टेटस अपडेट हुआ।', paymentSaved:'भुगतान दर्ज हो गया।',
      roleError:'आपकी भूमिका जॉब देख सकती है, लेकिन नया जॉब बनाने या अपडेट करने की अनुमति नहीं है।',
      error:'अनुरोध पूरा नहीं हुआ: ', loading:'काउंटर जॉब लोड हो रहे हैं…',
      digitalOnly:'यह मॉड्यूल BHARATEE DIGITAL SERVICE में उपलब्ध है। काउंटर मैनेजमेंट के लिए बिज़नेस बदलें।',
      chooseBusiness:'आगे बढ़ने के लिए BHARATEE DIGITAL SERVICE चुनें।',
      docs:'दस्तावेज सूची', noDocs:'कोई दस्तावेज सूची नहीं जोड़ी गई।',
      all:'सभी', today:'आज', cash:'नकद', upi:'UPI', bank_transfer:'बैंक ट्रांसफर', card:'कार्ड', otherMethod:'अन्य',
      serviceMap:'सेवा / पोर्टल'
    },
    or: {
      title:'ସାଇବର୍ କାଫେ ଏବଂ ଡିଜିଟାଲ୍ ସେବା', sub:'ସରକାରୀ ଆବେଦନ, କାଉଣ୍ଟର୍ କାମ, ପ୍ରିଣ୍ଟିଂ ଅର୍ଡର୍ ଏବଂ ଡେଲିଭରି ଟ୍ରାକ୍ କରନ୍ତୁ।',
      dashboard:'ଆଜିର କାଉଣ୍ଟର୍ ସାରାଂଶ', ordersToday:'ଆଜିର ଅର୍ଡର୍', orderValue:'ଆଜିର ଅର୍ଡର୍ ମୂଲ୍ୟ',
      collections:'ଆଜିର ଆଦାୟ', openJobs:'ଚାଲୁଥିବା କାମ', readyJobs:'ନେବା ପାଇଁ ପ୍ରସ୍ତୁତ',
      applications:'ଚାଲୁଥିବା ଆବେଦନ', pending:'ଗ୍ରାହକଙ୍କଠାରୁ ବାକି',
      newJob:'ନୂଆ କାଉଣ୍ଟର୍ କାମ', refresh:'ରିଫ୍ରେସ୍', close:'ବନ୍ଦ', save:'କାମ ସେଭ୍ କରନ୍ତୁ', saving:'ସେଭ୍ ହେଉଛି…',
      search:'ଗ୍ରାହକ, ଫୋନ୍, ଅର୍ଡର୍, ସେବା କିମ୍ବା ଆବେଦନ ନମ୍ବର ଖୋଜନ୍ତୁ', serviceFilter:'ସମସ୍ତ ସେବା',
      deliveryFilter:'ସମସ୍ତ ଡେଲିଭରି ସ୍ଥିତି', jobRegister:'କାଉଣ୍ଟର୍ କାମ ରେଜିଷ୍ଟର୍', noJobs:'କୌଣସି କାଉଣ୍ଟର୍ କାମ ମିଳିଲା ନାହିଁ।',
      customer:'ଗ୍ରାହକଙ୍କ ନାମ', phone:'ମୋବାଇଲ୍ ନମ୍ବର', email:'ଇମେଲ୍ (ଇଚ୍ଛାଧୀନ)', language:'ଗ୍ରାହକଙ୍କ ଭାଷା',
      service:'ସେବା ପ୍ରକାର', serviceName:'ସେବା / ଆବେଦନ ନାମ', portal:'ସରକାରୀ ପୋର୍ଟାଲ୍ (ଇଚ୍ଛାଧୀନ)',
      reference:'ଆବେଦନ ରେଫରେନ୍ସ ନମ୍ବର', appStatus:'ଆବେଦନ ସ୍ଥିତି', expected:'ଆଶାକରା ଡେଲିଭରି ତାରିଖ',
      quantity:'ପରିମାଣ / କପି', unitPrice:'ପ୍ରତି ୟୁନିଟ୍ ମୂଲ୍ୟ (₹)', discount:'ରିହାତି (₹)',
      initialPayment:'ବର୍ତ୍ତମାନ ପ୍ରାପ୍ତ ପେମେଣ୍ଟ (₹)', paymentMethod:'ପେମେଣ୍ଟ ମାଧ୍ୟମ', paymentRef:'UPI / ବ୍ୟାଙ୍କ ରେଫରେନ୍ସ (ଇଚ୍ଛାଧୀନ)',
      documents:'ଆବଶ୍ୟକ ଡକ୍ୟୁମେଣ୍ଟ୍ (ପ୍ରତି ଧାଡ଼ିରେ ଗୋଟିଏ)', notes:'ଟିପ୍ପଣୀ / ନିର୍ଦ୍ଦେଶ',
      government_application:'ସରକାରୀ ଆବେଦନ', printing:'ପ୍ରିଣ୍ଟିଂ', photocopy:'ଫଟୋକପି',
      scan:'ସ୍କାନିଂ', lamination:'ଲାମିନେସନ୍', passport_photo:'ପାସପୋର୍ଟ ଫଟୋ',
      photo_frame:'ଫଟୋ ଫ୍ରେମ୍', photo_editing:'ଫଟୋ ଏଡିଟିଂ / ରିପ୍ରିଣ୍ଟ', other:'ଅନ୍ୟାନ୍ୟ କାଉଣ୍ଟର୍ ସେବା',
      not_applicable:'ପ୍ରଯୁଜ୍ୟ ନୁହେଁ', not_started:'ଆରମ୍ଭ ହୋଇନାହିଁ', submitted:'ଦାଖଲ ହୋଇଛି',
      under_review:'ଯାଞ୍ଚ ଚାଲିଛି', approved:'ଅନୁମୋଦିତ', rejected:'ପ୍ରତ୍ୟାଖ୍ୟାନ', completed:'ସମାପ୍ତ',
      pendingStatus:'ବାକି', ready:'ପ୍ରସ୍ତୁତ', delivered:'ଡେଲିଭର୍ ହୋଇଛି', picked_up:'ନିଆଯାଇଛି', cancelled:'ବାତିଲ୍',
      received:'ଗ୍ରହଣ', in_progress:'ଚାଲୁଛି', on_hold:'ଅଟକିଛି',
      orderStatus:'କାମର ସ୍ଥିତି', deliveryStatus:'ଡେଲିଭରି ସ୍ଥିତି', update:'କାମ ଅପଡେଟ୍ କରନ୍ତୁ',
      addPayment:'ପେମେଣ୍ଟ ଲେଖନ୍ତୁ', amount:'ରାଶି (₹)', recordPayment:'ପେମେଣ୍ଟ ସେଭ୍ କରନ୍ତୁ',
      total:'ମୋଟ', receivedAmount:'ପ୍ରାପ୍ତ', balance:'ବାକି', orderNo:'ଅର୍ଡର୍ ନମ୍ବର',
      created:'ତିଆରି ହୋଇଛି', customerDetails:'ଗ୍ରାହକ', applicationDetails:'ଆବେଦନ ବିବରଣୀ',
      whatsapp:'WhatsApp ଯୋଗାଯୋଗ', noConsent:'WhatsApp ସମ୍ମତି ରେକର୍ଡ ହୋଇନାହିଁ',
      saved:'କାଉଣ୍ଟର୍ କାମ ସେଭ୍ ହୋଇଛି।', updated:'କାମର ସ୍ଥିତି ଅପଡେଟ୍ ହୋଇଛି।', paymentSaved:'ପେମେଣ୍ଟ ରେକର୍ଡ ହୋଇଛି।',
      roleError:'ଆପଣଙ୍କ ଭୂମିକା କାମ ଦେଖିପାରିବ, କିନ୍ତୁ ନୂଆ କାମ ତିଆରି କିମ୍ବା ଅପଡେଟ୍ କରିପାରିବ ନାହିଁ।',
      error:'ଅନୁରୋଧ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇନାହିଁ: ', loading:'କାଉଣ୍ଟର୍ କାମ ଲୋଡ୍ ହେଉଛି…',
      digitalOnly:'ଏହି ମଡ୍ୟୁଲ୍ BHARATEE DIGITAL SERVICE ୱର୍କସ୍ପେସ୍‌ରେ ଉପଲବ୍ଧ। କାଉଣ୍ଟର୍ ପରିଚାଳନା ପାଇଁ ବ୍ୟବସାୟ ବଦଳାନ୍ତୁ।',
      chooseBusiness:'ଆଗକୁ ବଢ଼ିବା ପାଇଁ BHARATEE DIGITAL SERVICE ବାଛନ୍ତୁ।',
      docs:'ଡକ୍ୟୁମେଣ୍ଟ୍ ତାଲିକା', noDocs:'କୌଣସି ଡକ୍ୟୁମେଣ୍ଟ୍ ତାଲିକା ଯୋଡ଼ାଯାଇନାହିଁ।',
      all:'ସମସ୍ତ', today:'ଆଜି', cash:'ନଗଦ', upi:'UPI', bank_transfer:'ବ୍ୟାଙ୍କ ଟ୍ରାନ୍ସଫର୍', card:'କାର୍ଡ', otherMethod:'ଅନ୍ୟାନ୍ୟ',
      serviceMap:'ସେବା / ପୋର୍ଟାଲ୍'
    }
  };

  const SERVICES = ['government_application','printing','photocopy','scan','lamination','passport_photo','photo_frame','photo_editing','other'];
  const ORDER_STATUSES = ['received','in_progress','ready','delivered','cancelled','on_hold'];
  const APP_STATUSES = ['not_applicable','not_started','submitted','under_review','approved','rejected','completed'];
  const DELIVERY_STATUSES = ['pending','ready','delivered','picked_up','cancelled'];
  const WRITE_ROLES = ['owner','admin','manager','cyber_staff'];
  let panel = null, currentBusinessId = null, observerStarted = false, jobs = [];

  const $ = (id) => document.getElementById(id);
  const tr = (key) => (L[lang] || L.en)[key] || L.en[key] || key;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
  const businessId = () => selected?.business_id || null;
  const role = () => selected?.role || '';
  const isDigital = () => selected?.business_units?.code === 'digital-service';
  const canWrite = () => WRITE_ROLES.includes(role());
  const money = (v) => new Intl.NumberFormat(lang==='or'?'or-IN':lang==='hi'?'hi-IN':'en-IN',{
    style:'currency',currency:'INR',maximumFractionDigits:2
  }).format(Number(v)||0);
  const dateTime = (v) => v ? new Intl.DateTimeFormat(lang==='or'?'or-IN':lang==='hi'?'hi-IN':'en-IN',{
    dateStyle:'medium',timeStyle:'short'
  }).format(new Date(v)) : '—';
  const localISO = (value) => value ? new Date(value).toISOString() : null;
  function notice(text,type='info') {
    const box=$('ccNotice'); if(!box) return;
    box.textContent=text; box.className='cc-notice '+type; box.hidden=false;
  }
  function clearNotice() { const box=$('ccNotice'); if(box){box.hidden=true;box.textContent='';} }

  function addStyles() {
    if($('bharateeCyberStyles')) return;
    const style=document.createElement('style');
    style.id='bharateeCyberStyles';
    style.textContent=`
      .cc-panel{margin:22px 0 24px;padding:20px;background:#fff;border:1px solid rgba(13,44,107,.16);border-radius:12px}
      .cc-panel *{box-sizing:border-box}.cc-panel [hidden]{display:none!important}
      .cc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
      .cc-head h3{margin:0 0 5px;color:#081E4D;font:700 23px 'Baloo 2'}
      .cc-head p{margin:0;color:#6C7895;font-size:11px;line-height:1.5}
      .cc-toolbar{display:flex;gap:9px;flex-wrap:wrap;margin:16px 0}
      .cc-panel button,.cc-panel select,.cc-panel input,.cc-panel textarea{font:12px 'IBM Plex Sans'}
      .cc-btn{border:0;border-radius:7px;padding:10px 14px;background:#0D2C6B;color:#fff;font:600 10px 'IBM Plex Mono'!important;cursor:pointer}
      .cc-btn:hover{background:#F26522}
      .cc-btn.secondary{background:#fff;color:#0D2C6B;border:1px solid rgba(13,44,107,.22)}
      .cc-btn:disabled{opacity:.55;cursor:wait}
      .cc-search,.cc-filter{min-height:38px;border:1px solid rgba(13,44,107,.2);border-radius:7px;padding:8px 10px;background:#fff;color:#14203D}
      .cc-search{flex:1;min-width:220px}
      .cc-filter{min-width:150px}
      .cc-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:17px 0}
      .cc-metric{padding:13px;border:1px solid rgba(13,44,107,.13);border-radius:8px;background:#FFFBF3;min-width:0}
      .cc-metric span{display:block;color:#6C7895;font:600 9px 'IBM Plex Mono';line-height:1.45}
      .cc-metric strong{display:block;margin-top:8px;color:#081E4D;font:700 clamp(16px,2vw,23px) 'Baloo 2';overflow-wrap:anywhere}
      .cc-form{margin:15px 0;padding:17px;border:1px solid rgba(13,44,107,.16);border-radius:10px;background:#fffdfa}
      .cc-form h4{margin:0 0 12px;color:#081E4D;font:700 17px 'Baloo 2'}
      .cc-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}
      .cc-field{display:block;color:#3A5590;font:600 9px 'IBM Plex Mono';text-transform:uppercase;letter-spacing:.04em}
      .cc-field input,.cc-field select,.cc-field textarea{display:block;width:100%;margin-top:6px;min-height:37px;border:1px solid rgba(13,44,107,.2);border-radius:6px;padding:8px;background:#fff;color:#14203D;font:12px 'IBM Plex Sans';text-transform:none;letter-spacing:normal}
      .cc-field textarea{min-height:75px;resize:vertical}
      .cc-span{grid-column:1/-1}
      .cc-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:13px}
      .cc-notice{margin:12px 0;padding:10px 12px;border-radius:7px;font-size:11px;line-height:1.5}
      .cc-notice[hidden]{display:none}
      .cc-notice.success{background:#eff8ef;border:1px solid #c2e3c0;color:#176b11}
      .cc-notice.error{background:#fff1ed;border:1px solid #f0c2b5;color:#8b321a}
      .cc-notice.info{background:#f2f5fb;border:1px solid rgba(13,44,107,.15);color:#3A5590}
      .cc-list{display:grid;gap:11px}
      .cc-job{padding:15px;border:1px solid rgba(13,44,107,.15);border-radius:10px;background:#fff}
      .cc-jobtop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .cc-job h5{margin:0 0 5px;color:#081E4D;font:700 15px 'Baloo 2'}
      .cc-meta{font-size:10px;color:#6C7895;line-height:1.6}
      .cc-pill{display:inline-block;border-radius:20px;padding:5px 9px;background:#fff4ec;color:#95431b;font:600 9px 'IBM Plex Mono';white-space:nowrap}
      .cc-jobstats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}
      .cc-jobstat{padding:8px;background:#FFFBF3;border-radius:6px}
      .cc-jobstat span{display:block;color:#6C7895;font-size:9px}
      .cc-jobstat b{display:block;margin-top:4px;color:#081E4D;font:600 12px 'IBM Plex Mono'}
      .cc-details{margin-top:10px;border-top:1px solid rgba(13,44,107,.1);padding-top:10px}
      .cc-details summary{cursor:pointer;color:#0D2C6B;font:600 10px 'IBM Plex Mono'}
      .cc-updategrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
      .cc-updategrid label{display:block;color:#3A5590;font:600 9px 'IBM Plex Mono';text-transform:uppercase}
      .cc-updategrid select,.cc-updategrid input{display:block;width:100%;margin-top:5px;padding:7px;border:1px solid rgba(13,44,107,.2);border-radius:6px;background:#fff;font:11px 'IBM Plex Sans'}
      .cc-payrow{display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-top:10px}
      .cc-payrow label{display:block;color:#3A5590;font:600 9px 'IBM Plex Mono';text-transform:uppercase}
      .cc-payrow input,.cc-payrow select{display:block;margin-top:5px;height:34px;padding:6px;border:1px solid rgba(13,44,107,.2);border-radius:6px}
      .cc-payrow input{width:120px}
      .cc-wa{display:inline-block;margin-top:8px;padding:7px 10px;border-radius:6px;background:#eaf7ed;color:#176b11;text-decoration:none;font:600 9px 'IBM Plex Mono'}
      .cc-empty{padding:26px;text-align:center;color:#6C7895;background:#FFFBF3;border:1px dashed rgba(13,44,107,.2);border-radius:8px;font-size:12px}
      @media(max-width:780px){.cc-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.cc-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:520px){.cc-panel{padding:13px}.cc-fields,.cc-updategrid{grid-template-columns:1fr}.cc-jobtop{flex-direction:column}.cc-filter{flex:1}.cc-jobstats{grid-template-columns:1fr 1fr}}
    `;
    document.head.append(style);
  }

  function optionList(values, selectedValue, prefix='') {
    return values.map(v=>`<option value="${esc(v)}" ${v===selectedValue?'selected':''}>${esc(tr(prefix+v))}</option>`).join('');
  }

  function buildPanel() {
    if(panel) return;
    const root=$('selectedPanel');
    if(!root) return;
    addStyles();
    panel=document.createElement('section');
    panel.id='bharateeCyberPanel';
    panel.className='cc-panel';
    panel.hidden=true;
    panel.innerHTML=`
      <div class="cc-head"><div><h3>${esc(tr('title'))}</h3><p>${esc(tr('sub'))}</p></div>
        <div class="cc-toolbar"><button type="button" class="cc-btn" id="ccAdd">${esc(tr('newJob'))}</button><button type="button" class="cc-btn secondary" id="ccRefresh">${esc(tr('refresh'))}</button></div>
      </div>
      <div id="ccNotice" class="cc-notice info" hidden></div>
      <h4 style="margin:14px 0 0;color:#081E4D;font:700 16px 'Baloo 2'">${esc(tr('dashboard'))}</h4>
      <div id="ccMetrics" class="cc-metrics"><div class="cc-empty">${esc(tr('loading'))}</div></div>
      <form id="ccNewJobForm" class="cc-form" hidden>
        <h4>${esc(tr('newJob'))}</h4>
        <div class="cc-fields">
          <label class="cc-field">${esc(tr('customer'))}<input name="customer_name" maxlength="120" required></label>
          <label class="cc-field">${esc(tr('phone'))}<input name="phone" type="tel" maxlength="32" required></label>
          <label class="cc-field">${esc(tr('email'))}<input name="email" type="email" maxlength="254"></label>
          <label class="cc-field">${esc(tr('language'))}<select name="locale"><option value="en">English</option><option value="hi">हिन्दी</option><option value="or">ଓଡ଼ିଆ</option></select></label>
          <label class="cc-field">${esc(tr('service'))}<select name="service_kind" id="ccServiceKind">${optionList(SERVICES,'government_application')}</select></label>
          <label class="cc-field">${esc(tr('serviceName'))}<input name="service_name" maxlength="180" placeholder="e.g. Income Certificate / A4 Colour Print" required></label>
          <label class="cc-field cc-app-only">${esc(tr('portal'))}<input name="portal_name" maxlength="180" placeholder="eDistrict Odisha"></label>
          <label class="cc-field cc-app-only">${esc(tr('reference'))}<input name="application_reference" maxlength="120"></label>
          <label class="cc-field cc-app-only">${esc(tr('appStatus'))}<select name="application_status">${optionList(APP_STATUSES,'not_started')}</select></label>
          <label class="cc-field">${esc(tr('expected'))}<input name="expected_delivery_at" type="datetime-local"></label>
          <label class="cc-field">${esc(tr('quantity'))}<input name="quantity" type="number" min="0.001" step="0.001" value="1" required></label>
          <label class="cc-field">${esc(tr('unitPrice'))}<input name="unit_price" type="number" min="0" step="0.01" required></label>
          <label class="cc-field">${esc(tr('discount'))}<input name="discount" type="number" min="0" step="0.01" value="0"></label>
          <label class="cc-field">${esc(tr('initialPayment'))}<input name="initial_payment" type="number" min="0" step="0.01" value="0"></label>
          <label class="cc-field">${esc(tr('paymentMethod'))}<select name="payment_method"><option value="cash">${esc(tr('cash'))}</option><option value="upi">UPI</option><option value="bank_transfer">${esc(tr('bank_transfer'))}</option><option value="card">${esc(tr('card'))}</option><option value="other">${esc(tr('otherMethod'))}</option></select></label>
          <label class="cc-field">${esc(tr('paymentRef'))}<input name="payment_reference" maxlength="120"></label>
          <label class="cc-field cc-span cc-app-only">${esc(tr('documents'))}<textarea name="documents" maxlength="3000" placeholder="Aadhaar Card&#10;Photo&#10;Address Proof"></textarea></label>
          <label class="cc-field cc-span">${esc(tr('notes'))}<textarea name="notes" maxlength="2000"></textarea></label>
        </div>
        <div class="cc-actions"><button type="button" id="ccCancel" class="cc-btn secondary">${esc(tr('close'))}</button><button type="submit" id="ccSave" class="cc-btn">${esc(tr('save'))}</button></div>
      </form>
      <div class="cc-toolbar">
        <input id="ccSearch" class="cc-search" type="search" placeholder="${esc(tr('search'))}">
        <select id="ccServiceFilter" class="cc-filter"><option value="">${esc(tr('serviceFilter'))}</option>${optionList(SERVICES,'')}</select>
        <select id="ccDeliveryFilter" class="cc-filter"><option value="">${esc(tr('deliveryFilter'))}</option>${optionList(DELIVERY_STATUSES,'')}</select>
      </div>
      <h4 style="margin:17px 0 10px;color:#081E4D;font:700 17px 'Baloo 2'">${esc(tr('jobRegister'))}</h4>
      <div id="ccJobs" class="cc-list"><div class="cc-empty">${esc(tr('loading'))}</div></div>`;
    const modules=root.querySelector('.modules');
    root.insertBefore(panel,modules||null);

    $('ccAdd').addEventListener('click',()=>{$('ccNewJobForm').hidden=!$('ccNewJobForm').hidden;});
    $('ccCancel').addEventListener('click',()=>{$('ccNewJobForm').hidden=true;});
    $('ccRefresh').addEventListener('click',loadAll);
    $('ccNewJobForm').addEventListener('submit',saveJob);
    $('ccServiceKind').addEventListener('change',toggleApplicationFields);
    $('ccSearch').addEventListener('input',renderJobs);
    $('ccServiceFilter').addEventListener('change',loadJobs);
    $('ccDeliveryFilter').addEventListener('change',loadJobs);
    $('ccJobs').addEventListener('submit',handleInlineSubmit);
    $('ccJobs').addEventListener('click',handleInlineClick);
  }

  function toggleApplicationFields() {
    const isApp=$('ccServiceKind')?.value==='government_application';
    document.querySelectorAll('#ccNewJobForm .cc-app-only').forEach(el=>el.hidden=!isApp);
    if(!isApp && $('ccNewJobForm')) $('ccNewJobForm').elements.application_status.value='not_applicable';
    if(isApp && $('ccNewJobForm')) $('ccNewJobForm').elements.application_status.value='not_started';
  }

  function applyWorkspace() {
    buildPanel();
    if(!panel) return;
    const digital=isDigital();
    panel.hidden=!digital;
    if(!digital) return;
    if(currentBusinessId!==businessId()) {
      currentBusinessId=businessId();
      loadAll();
    }
    $('ccAdd').hidden=!canWrite();
    if(!canWrite()) notice(tr('roleError'),'info');
    toggleApplicationFields();
  }

  async function loadDashboard() {
    const {data,error}=await db.rpc('get_cyber_cafe_dashboard',{p_business_id:businessId()});
    if(error) throw error;
    const metrics=[
      ['ordersToday',data.orders_today],
      ['orderValue',money(data.order_value_today)],
      ['collections',money(data.net_collected_today)],
      ['openJobs',data.open_jobs],
      ['readyJobs',data.ready_jobs],
      ['applications',data.pending_applications],
      ['pending',money(data.pending_balance)]
    ];
    $('ccMetrics').innerHTML=metrics.map(([key,value])=>`<article class="cc-metric"><span>${esc(tr(key))}</span><strong>${esc(value)}</strong></article>`).join('');
  }

  async function loadJobs() {
    const {data,error}=await db.rpc('list_cyber_cafe_jobs',{
      p_business_id:businessId(),
      p_search:null,
      p_service_kind:$('ccServiceFilter').value||null,
      p_order_status:null,
      p_delivery_status:$('ccDeliveryFilter').value||null,
      p_limit:200
    });
    if(error) throw error;
    jobs=Array.isArray(data?.jobs)?data.jobs:[];
    renderJobs();
  }

  async function loadAll() {
    if(!isDigital() || !businessId()) return;
    clearNotice();
    $('ccMetrics').innerHTML=`<div class="cc-empty">${esc(tr('loading'))}</div>`;
    $('ccJobs').innerHTML=`<div class="cc-empty">${esc(tr('loading'))}</div>`;
    try {
      await Promise.all([loadDashboard(),loadJobs()]);
      notice('Cyber Café workspace ready.','success');
    } catch(error) {
      console.error('Cyber Café module:',error);
      notice(tr('error')+(error.message||''),'error');
      $('ccJobs').innerHTML=`<div class="cc-empty">${esc(tr('error')+(error.message||''))}</div>`;
    }
  }

  function renderJobs() {
    const root=$('ccJobs'); if(!root) return;
    const query=($('ccSearch').value||'').trim().toLowerCase();
    const rows=jobs.filter(j=>{
      const customer=j.customer||{};
      const haystack=[j.order_no,j.service_name,j.portal_name,j.application_reference,customer.full_name,customer.phone].join(' ').toLowerCase();
      return !query||haystack.includes(query);
    });
    if(!rows.length) { root.innerHTML=`<div class="cc-empty">${esc(tr('noJobs'))}</div>`; return; }

    root.innerHTML=rows.map(j=>{
      const customer=j.customer||{};
      const phone=String(customer.phone||'').replace(/[^0-9]/g,'');
      const whatsapp=customer.whatsapp_opt_in && phone
        ? `<a class="cc-wa" href="https://wa.me/${esc(phone)}" target="_blank" rel="noopener">${esc(tr('whatsapp'))}</a>`
        : `<small class="cc-meta">${esc(tr('noConsent'))}</small>`;
      const docs=Array.isArray(j.document_checklist)?j.document_checklist:[];
      const appInfo=j.service_kind==='government_application'
        ? `<p class="cc-meta">${esc(tr('applicationDetails'))}: ${esc(j.portal_name||'—')} · ${esc(j.application_reference||'—')} · ${esc(tr(j.application_status))}</p>`
        : '';
      return `<article class="cc-job" data-job="${esc(j.job_id)}">
        <div class="cc-jobtop"><div><h5>${esc(customer.full_name||'—')} · ${esc(j.service_name)}</h5>
          <div class="cc-meta">${esc(tr('orderNo'))}: ${esc(j.order_no)} · ${esc(tr('created'))}: ${esc(dateTime(j.created_at))}<br>${esc(customer.phone||'')}${j.expected_delivery_at?' · '+esc(tr('expected'))+': '+esc(dateTime(j.expected_delivery_at)):''}</div>
          ${appInfo}</div><span class="cc-pill">${esc(tr(j.delivery_status))}</span></div>
        <div class="cc-jobstats">
          <div class="cc-jobstat"><span>${esc(tr('total'))}</span><b>${esc(money(j.total))}</b></div>
          <div class="cc-jobstat"><span>${esc(tr('receivedAmount'))}</span><b>${esc(money(j.received))}</b></div>
          <div class="cc-jobstat"><span>${esc(tr('balance'))}</span><b>${esc(money(j.balance))}</b></div>
        </div>
        ${whatsapp}
        <details class="cc-details"><summary>${esc(tr('update'))} · ${esc(tr('orderStatus'))}: ${esc(tr(j.order_status))}</summary>
          <div class="cc-updategrid">
            <label>${esc(tr('orderStatus'))}<select data-field="order_status">${optionList(ORDER_STATUSES,j.order_status)}</select></label>
            ${j.service_kind==='government_application'?`<label>${esc(tr('appStatus'))}<select data-field="application_status">${optionList(APP_STATUSES,j.application_status)}</select></label>`:''}
            <label>${esc(tr('deliveryStatus'))}<select data-field="delivery_status">${optionList(DELIVERY_STATUSES,j.delivery_status)}</select></label>
            <label>${esc(tr('reference'))}<input data-field="application_reference" maxlength="120" value="${esc(j.application_reference||'')}"></label>
            <label>${esc(tr('expected'))}<input data-field="expected_delivery_at" type="datetime-local" value="${esc(j.expected_delivery_at?new Date(j.expected_delivery_at).toISOString().slice(0,16):'')}"></label>
            <label>${esc(tr('notes'))}<input data-field="notes" maxlength="2000" placeholder="Update notes"></label>
          </div>
          ${docs.length?`<p class="cc-meta">${esc(tr('docs'))}: ${docs.map(d=>esc(typeof d==='string'?d:(d.label||''))).join(' · ')}</p>`:`<p class="cc-meta">${esc(tr('noDocs'))}</p>`}
          <div class="cc-actions"><button type="button" class="cc-btn" data-action="update">${esc(tr('update'))}</button></div>
        </details>
        ${Number(j.balance)>0&&canWrite()?`<form class="cc-payrow" data-payment="${esc(j.order_id)}">
          <label>${esc(tr('amount'))}<input type="number" name="amount" min="0.01" max="${esc(j.balance)}" step="0.01" required></label>
          <label>${esc(tr('paymentMethod'))}<select name="method"><option value="cash">${esc(tr('cash'))}</option><option value="upi">UPI</option><option value="bank_transfer">${esc(tr('bank_transfer'))}</option><option value="card">${esc(tr('card'))}</option><option value="other">${esc(tr('otherMethod'))}</option></select></label>
          <button class="cc-btn" type="submit">${esc(tr('addPayment'))}</button>
        </form>`:''}
      </article>`;
    }).join('');
  }

  async function saveJob(event) {
    event.preventDefault();
    if(!canWrite()) return notice(tr('roleError'),'error');
    const form=event.currentTarget, f=new FormData(form);
    const total=Number(f.get('quantity'))*Number(f.get('unit_price'))-Number(f.get('discount')||0);
    const initial=Number(f.get('initial_payment')||0);
    if(!String(f.get('customer_name')||'').trim()||!String(f.get('phone')||'').trim()||
      !String(f.get('service_name')||'').trim()||!Number.isFinite(total)||total<=0||initial<0||initial>total) {
      notice('Check customer, service, quantity, price, discount and payment values.','error'); return;
    }
    const expected=f.get('expected_delivery_at')?localISO(f.get('expected_delivery_at')):null;
    const documents=String(f.get('documents')||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,40).map(label=>({label,done:false}));
    const button=$('ccSave');button.disabled=true;button.textContent=tr('saving');
    const {data,error}=await db.rpc('create_cyber_cafe_job',{
      p_business_id:businessId(),p_customer_id:null,
      p_customer_name:String(f.get('customer_name')).trim(),
      p_phone:String(f.get('phone')).trim(),
      p_email:String(f.get('email')||'').trim()||null,
      p_preferred_locale:String(f.get('locale')||'en'),
      p_service_kind:String(f.get('service_kind')),
      p_service_name:String(f.get('service_name')).trim(),
      p_portal_name:String(f.get('portal_name')||'').trim()||null,
      p_application_reference:String(f.get('application_reference')||'').trim()||null,
      p_application_status:String(f.get('application_status')||'not_applicable'),
      p_expected_delivery_at:expected,
      p_quantity:Number(f.get('quantity')),
      p_unit_price:Number(f.get('unit_price')),
      p_discount:Number(f.get('discount')||0),
      p_initial_payment:initial,
      p_payment_method:String(f.get('payment_method')||'cash'),
      p_payment_reference:String(f.get('payment_reference')||'').trim()||null,
      p_notes:String(f.get('notes')||'').trim()||null,
      p_document_checklist:documents,
      p_details:{}
    });
    button.disabled=false;button.textContent=tr('save');
    if(error) { console.error('Create counter job:',error);notice(tr('error')+error.message,'error');return; }
    form.reset();$('ccNewJobForm').hidden=true;toggleApplicationFields();
    await loadAll();
    notice(tr('saved')+' '+(data?.order_no||''),'success');
  }

  async function handleInlineSubmit(event) {
    const form=event.target.closest('form[data-payment]'); if(!form) return;
    event.preventDefault();
    if(!canWrite()) return notice(tr('roleError'),'error');
    const f=new FormData(form), amount=Number(f.get('amount'));
    const btn=form.querySelector('button');btn.disabled=true;
    const {data,error}=await db.rpc('record_cyber_cafe_job_payment',{
      p_business_id:businessId(),p_order_id:form.dataset.payment,p_amount:amount,
      p_payment_method:String(f.get('method')),p_reference_no:null,p_note:'Counter job balance payment'
    });
    btn.disabled=false;
    if(error){console.error('Record counter payment:',error);notice(tr('error')+error.message,'error');return;}
    await loadAll();notice(tr('paymentSaved')+' '+money(data?.balance),'success');
  }

  async function handleInlineClick(event) {
    const btn=event.target.closest('button[data-action="update"]'); if(!btn) return;
    if(!canWrite()) return notice(tr('roleError'),'error');
    const card=btn.closest('.cc-job'), jobId=card?.dataset.job;
    if(!jobId) return;
    const val=name=>card.querySelector(`[data-field="${name}"]`)?.value ?? null;
    const expected=val('expected_delivery_at');
    btn.disabled=true;
    const {error}=await db.rpc('update_cyber_cafe_job',{
      p_business_id:businessId(),p_job_id:jobId,
      p_order_status:val('order_status'),
      p_application_status:val('application_status'),
      p_delivery_status:val('delivery_status'),
      p_application_reference:val('application_reference'),
      p_expected_delivery_at:expected?localISO(expected):null,
      p_notes:val('notes')
    });
    btn.disabled=false;
    if(error){console.error('Update counter job:',error);notice(tr('error')+error.message,'error');return;}
    await loadAll();notice(tr('updated'),'success');
  }

  async function applyWorkspace() {
    buildPanel();
    if(!panel) return;
    const digital=isDigital();panel.hidden=!digital;
    if(!digital) return;
    if(currentBusinessId!==businessId()) {currentBusinessId=businessId();await loadAll();}
    $('ccAdd').hidden=!canWrite();
    if(!canWrite()) notice(tr('roleError'),'info');
  }

  function installObserver() {
    const root=$('selectedPanel'), name=$('selectedName');
    if(!root||!name||observerStarted) return;
    observerStarted=true;
    const observer=new MutationObserver(()=>applyWorkspace());
    observer.observe(root,{attributes:true,attributeFilter:['class']});
    observer.observe(name,{childList:true,characterData:true,subtree:true});
    const language=$('lang');
    if(language) language.addEventListener('change',()=>{
      if(panel){panel.remove();panel=null;currentBusinessId=null;}
      buildPanel();applyWorkspace();
    });
    buildPanel();applyWorkspace();
  }

  document.addEventListener('DOMContentLoaded',installObserver);
  window.addEventListener('load',installObserver);
  setTimeout(installObserver,0);
})();