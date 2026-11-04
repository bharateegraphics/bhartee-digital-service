/* BHARATEE BUSINESS PLATFORM — Income, Expense and Cashbook forms.
   Requires the Supabase client and selected business from admin.html.
   Load this after accounting-dashboard.js. */
(() => {
  'use strict';

  const translations = {
    en: {
      title: 'Finance operations', subtitle: 'Record sales, order payments, refunds, expenses and cashbook sessions.',
      quickIncome: 'Quick income / completed sale', quickIncomeHelp: 'Creates a completed order and records the receipt in one secure transaction.',
      description: 'Sale / service description', amount: 'Amount (₹)', method: 'Payment method',
      orderType: 'Sale category', customer: 'Customer name (optional)', phone: 'Customer phone (optional)',
      reference: 'UPI / bank reference (optional)', transactionDate: 'Transaction date', note: 'Notes (optional)',
      saveIncome: 'Save income', orderPayment: 'Existing order payment / refund', order: 'Order',
      transactionType: 'Transaction type', receipt: 'Receive payment', refund: 'Record refund',
      saveTransaction: 'Save transaction', expense: 'Record business expense', category: 'Expense category',
      vendor: 'Vendor / paid to (optional)', expenseDate: 'Expense date', receiptPath: 'Receipt file',
      saveExpense: 'Save expense', cashbook: 'Daily cashbook', openingCash: 'Opening cash (₹)',
      openCashbook: 'Open cashbook', countedCash: 'Actual counted cash (₹)', closeNote: 'Closing note (optional)',
      closeCashbook: 'Close cashbook', noOpenSession: 'No cashbook session is open for this business.',
      sessionOpen: 'Cashbook is open', expectedCash: 'Expected cash', openedAt: 'Opened at',
      loading: 'Loading finance data…', saved: 'Saved successfully.',
      orderCreated: 'Sale saved. Order number: ', balance: 'Outstanding: ',
      noOrders: 'No eligible orders found for payment / refund.', noCategories: 'No expense categories are set up.',
      loadError: 'Could not load finance data. Check permissions and migration 004.',
      required: 'Please fill all required fields with valid values.',
      amountPositive: 'Amount must be greater than zero.',
      chooseOrder: 'Select an order.', confirmClose: 'Close this cashbook session now?',
      receiptHint: 'Receipts and refunds are append-only for an auditable payment history.',
      recent: 'Recent finance entries', recentPayments: 'Recent payments / refunds', recentExpenses: 'Recent expenses',
      date: 'Date', details: 'Details', type: 'Type', status: 'Status', noRecent: 'No entries yet.',
      saleOther: 'Other sale', counter: 'Counter service', printing: 'Printing', photocopy: 'Photocopy', scan: 'Scanning',
      lamination: 'Lamination', passport_photo: 'Passport photo', photo_frame: 'Photo frame', photo_editing: 'Photo editing',
      photography: 'Photography', videography: 'Videography', wedding: 'Wedding',
      cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank transfer', card: 'Card', other: 'Other',
      categoryShopRent: 'Shop Rent', categoryElectricity: 'Electricity', categoryInternet: 'Internet & Phone',
      categoryPrinting: 'Printing Materials', categoryPhotoSupplies: 'Photo Paper & Ink', categoryEquipment: 'Equipment & Repairs',
      categoryTravel: 'Travel & Transport', categorySalary: 'Staff Salary', categoryMarketing: 'Marketing', categoryOther: 'Other',
      receiptLabel: 'Receipt', refundLabel: 'Refund', expenseLabel: 'Expense',
      roleDenied: 'Your role does not have finance-entry permission.',
      uploadLater: 'Receipt attachment will be enabled with private file upload in the next security step.'
    },
    hi: {
      title: 'वित्तीय लेन-देन', subtitle: 'बिक्री, ऑर्डर भुगतान, रिफंड, खर्च और कैशबुक दर्ज करें।',
      quickIncome: 'त्वरित आय / पूरी हुई बिक्री', quickIncomeHelp: 'एक पूरा ऑर्डर बनाकर उसी सुरक्षित प्रक्रिया में भुगतान दर्ज करेगा।',
      description: 'बिक्री / सेवा का विवरण', amount: 'राशि (₹)', method: 'भुगतान का तरीका',
      orderType: 'बिक्री की श्रेणी', customer: 'ग्राहक का नाम (वैकल्पिक)', phone: 'ग्राहक फोन (वैकल्पिक)',
      reference: 'UPI / बैंक संदर्भ (वैकल्पिक)', transactionDate: 'लेन-देन की तारीख', note: 'नोट (वैकल्पिक)',
      saveIncome: 'आय सेव करें', orderPayment: 'मौजूदा ऑर्डर भुगतान / रिफंड', order: 'ऑर्डर',
      transactionType: 'लेन-देन का प्रकार', receipt: 'भुगतान प्राप्त करें', refund: 'रिफंड दर्ज करें',
      saveTransaction: 'लेन-देन सेव करें', expense: 'व्यवसाय का खर्च दर्ज करें', category: 'खर्च की श्रेणी',
      vendor: 'वेंडर / किसे भुगतान किया (वैकल्पिक)', expenseDate: 'खर्च की तारीख', receiptPath: 'रसीद फाइल',
      saveExpense: 'खर्च सेव करें', cashbook: 'दैनिक कैशबुक', openingCash: 'शुरुआती नकद (₹)',
      openCashbook: 'कैशबुक खोलें', countedCash: 'गिना हुआ वास्तविक नकद (₹)', closeNote: 'समापन नोट (वैकल्पिक)',
      closeCashbook: 'कैशबुक बंद करें', noOpenSession: 'इस व्यवसाय की कोई कैशबुक खुली नहीं है।',
      sessionOpen: 'कैशबुक खुली है', expectedCash: 'अपेक्षित नकद', openedAt: 'खुलने का समय',
      loading: 'वित्तीय जानकारी लोड हो रही है…', saved: 'सफलतापूर्वक सेव हुआ।',
      orderCreated: 'बिक्री सेव हुई। ऑर्डर नंबर: ', balance: 'बाकी राशि: ',
      noOrders: 'भुगतान / रिफंड के लिए कोई उपयुक्त ऑर्डर नहीं मिला।', noCategories: 'खर्च की श्रेणियां उपलब्ध नहीं हैं।',
      loadError: 'वित्तीय जानकारी लोड नहीं हुई। अनुमति और migration 004 जाँचें।',
      required: 'सभी जरूरी फील्ड सही तरीके से भरें।', amountPositive: 'राशि शून्य से अधिक होनी चाहिए।',
      chooseOrder: 'एक ऑर्डर चुनें।', confirmClose: 'क्या आप कैशबुक अभी बंद करना चाहते हैं?',
      receiptHint: 'ऑडिट रिकॉर्ड के लिए भुगतान और रिफंड का इतिहास बदला नहीं जा सकता।',
      recent: 'हाल के वित्तीय रिकॉर्ड', recentPayments: 'हाल के भुगतान / रिफंड', recentExpenses: 'हाल के खर्च',
      date: 'तारीख', details: 'विवरण', type: 'प्रकार', status: 'स्थिति', noRecent: 'अभी कोई रिकॉर्ड नहीं है।',
      saleOther: 'अन्य बिक्री', counter: 'काउंटर सेवा', printing: 'प्रिंटिंग', photocopy: 'फोटोकॉपी', scan: 'स्कैनिंग',
      lamination: 'लेमिनेशन', passport_photo: 'पासपोर्ट फोटो', photo_frame: 'फोटो फ्रेम', photo_editing: 'फोटो एडिटिंग',
      photography: 'फोटोग्राफी', videography: 'वीडियोग्राफी', wedding: 'विवाह',
      cash: 'नकद', upi: 'UPI', bank_transfer: 'बैंक ट्रांसफर', card: 'कार्ड', other: 'अन्य',
      categoryShopRent: 'दुकान का किराया', categoryElectricity: 'बिजली', categoryInternet: 'इंटरनेट और फोन',
      categoryPrinting: 'प्रिंटिंग सामग्री', categoryPhotoSupplies: 'फोटो पेपर और इंक', categoryEquipment: 'उपकरण और मरम्मत',
      categoryTravel: 'यात्रा और परिवहन', categorySalary: 'स्टाफ वेतन', categoryMarketing: 'मार्केटिंग', categoryOther: 'अन्य',
      receiptLabel: 'प्राप्ति', refundLabel: 'रिफंड', expenseLabel: 'खर्च',
      roleDenied: 'आपकी भूमिका को वित्तीय रिकॉर्ड दर्ज करने की अनुमति नहीं है।',
      uploadLater: 'रसीद अटैचमेंट निजी फाइल अपलोड सुरक्षा चरण में जोड़ा जाएगा।'
    },
    or: {
      title: 'ଆର୍ଥିକ କାରବାର', subtitle: 'ବିକ୍ରୟ, ଅର୍ଡର୍ ପେମେଣ୍ଟ, ଫେରସ୍ତ, ଖର୍ଚ୍ଚ ଏବଂ କ୍ୟାଶବୁକ୍ ରେକର୍ଡ କରନ୍ତୁ।',
      quickIncome: 'ତୁରନ୍ତ ଆୟ / ସମ୍ପୂର୍ଣ୍ଣ ବିକ୍ରୟ', quickIncomeHelp: 'ଗୋଟିଏ ସମ୍ପୂର୍ଣ୍ଣ ଅର୍ଡର୍ ତିଆରି କରି ଏକାସାଙ୍ଗରେ ପେମେଣ୍ଟ ରେକର୍ଡ କରିବ।',
      description: 'ବିକ୍ରୟ / ସେବା ବିବରଣୀ', amount: 'ରାଶି (₹)', method: 'ପେମେଣ୍ଟ ପଦ୍ଧତି',
      orderType: 'ବିକ୍ରୟ ବର୍ଗ', customer: 'ଗ୍ରାହକଙ୍କ ନାମ (ଇଚ୍ଛାଧୀନ)', phone: 'ଗ୍ରାହକ ଫୋନ୍ (ଇଚ୍ଛାଧୀନ)',
      reference: 'UPI / ବ୍ୟାଙ୍କ ରେଫରେନ୍ସ (ଇଚ୍ଛାଧୀନ)', transactionDate: 'କାରବାର ତାରିଖ', note: 'ଟିପ୍ପଣୀ (ଇଚ୍ଛାଧୀନ)',
      saveIncome: 'ଆୟ ସେଭ୍ କରନ୍ତୁ', orderPayment: 'ବର୍ତ୍ତମାନର ଅର୍ଡର୍ ପେମେଣ୍ଟ / ଫେରସ୍ତ', order: 'ଅର୍ଡର୍',
      transactionType: 'କାରବାର ପ୍ରକାର', receipt: 'ପେମେଣ୍ଟ ଗ୍ରହଣ', refund: 'ଫେରସ୍ତ ରେକର୍ଡ',
      saveTransaction: 'କାରବାର ସେଭ୍ କରନ୍ତୁ', expense: 'ବ୍ୟବସାୟ ଖର୍ଚ୍ଚ ରେକର୍ଡ', category: 'ଖର୍ଚ୍ଚ ବର୍ଗ',
      vendor: 'ବିକ୍ରେତା / ଯାହାଙ୍କୁ ପେମେଣ୍ଟ (ଇଚ୍ଛାଧୀନ)', expenseDate: 'ଖର୍ଚ୍ଚ ତାରିଖ', receiptPath: 'ରସିଦ ଫାଇଲ୍',
      saveExpense: 'ଖର୍ଚ୍ଚ ସେଭ୍ କରନ୍ତୁ', cashbook: 'ଦୈନିକ କ୍ୟାଶବୁକ୍', openingCash: 'ଆରମ୍ଭର ନଗଦ (₹)',
      openCashbook: 'କ୍ୟାଶବୁକ୍ ଖୋଲନ୍ତୁ', countedCash: 'ଗଣାଯାଇଥିବା ପ୍ରକୃତ ନଗଦ (₹)', closeNote: 'ବନ୍ଦ ଟିପ୍ପଣୀ (ଇଚ୍ଛାଧୀନ)',
      closeCashbook: 'କ୍ୟାଶବୁକ୍ ବନ୍ଦ କରନ୍ତୁ', noOpenSession: 'ଏହି ବ୍ୟବସାୟର କୌଣସି ଖୋଲା କ୍ୟାଶବୁକ୍ ନାହିଁ।',
      sessionOpen: 'କ୍ୟାଶବୁକ୍ ଖୋଲା ଅଛି', expectedCash: 'ଆଶାକରା ନଗଦ', openedAt: 'ଖୋଲିବା ସମୟ',
      loading: 'ଆର୍ଥିକ ତଥ୍ୟ ଲୋଡ୍ ହେଉଛି…', saved: 'ସଫଳତାର ସହିତ ସେଭ୍ ହେଲା।',
      orderCreated: 'ବିକ୍ରୟ ସେଭ୍ ହେଲା। ଅର୍ଡର୍ ନମ୍ବର: ', balance: 'ବାକି: ',
      noOrders: 'ପେମେଣ୍ଟ / ଫେରସ୍ତ ପାଇଁ ଉପଯୁକ୍ତ ଅର୍ଡର୍ ମିଳିଲା ନାହିଁ।', noCategories: 'ଖର୍ଚ୍ଚ ବର୍ଗ ସେଟ୍ ହୋଇନାହିଁ।',
      loadError: 'ଆର୍ଥିକ ତଥ୍ୟ ଲୋଡ୍ ହୋଇପାରିଲା ନାହିଁ। ଅନୁମତି ଏବଂ migration 004 ଯାଞ୍ଚ କରନ୍ତୁ।',
      required: 'ସମସ୍ତ ଆବଶ୍ୟକ ତଥ୍ୟ ସଠିକ୍ ଭାବରେ ଭରନ୍ତୁ।', amountPositive: 'ରାଶି ଶୂନ୍ୟଠାରୁ ଅଧିକ ହେବା ଆବଶ୍ୟକ।',
      chooseOrder: 'ଗୋଟିଏ ଅର୍ଡର୍ ବାଛନ୍ତୁ।', confirmClose: 'ଏହି କ୍ୟାଶବୁକ୍ ବର୍ତ୍ତମାନ ବନ୍ଦ କରିବେ କି?',
      receiptHint: 'ଅଡିଟ୍ ପାଇଁ ପେମେଣ୍ଟ ଏବଂ ଫେରସ୍ତ ଇତିହାସ ପରିବର୍ତ୍ତନ ହୋଇପାରିବ ନାହିଁ।',
      recent: 'ସାମ୍ପ୍ରତିକ ଆର୍ଥିକ ରେକର୍ଡ', recentPayments: 'ସାମ୍ପ୍ରତିକ ପେମେଣ୍ଟ / ଫେରସ୍ତ', recentExpenses: 'ସାମ୍ପ୍ରତିକ ଖର୍ଚ୍ଚ',
      date: 'ତାରିଖ', details: 'ବିବରଣୀ', type: 'ପ୍ରକାର', status: 'ସ୍ଥିତି', noRecent: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ରେକର୍ଡ ନାହିଁ।',
      saleOther: 'ଅନ୍ୟ ବିକ୍ରୟ', counter: 'କାଉଣ୍ଟର ସେବା', printing: 'ପ୍ରିଣ୍ଟିଂ', photocopy: 'ଫଟୋକପି', scan: 'ସ୍କାନିଂ',
      lamination: 'ଲାମିନେସନ୍', passport_photo: 'ପାସପୋର୍ଟ ଫଟୋ', photo_frame: 'ଫଟୋ ଫ୍ରେମ୍', photo_editing: 'ଫଟୋ ଏଡିଟିଂ',
      photography: 'ଫଟୋଗ୍ରାଫି', videography: 'ଭିଡିଓଗ୍ରାଫି', wedding: 'ବିବାହ',
      cash: 'ନଗଦ', upi: 'UPI', bank_transfer: 'ବ୍ୟାଙ୍କ ଟ୍ରାନ୍ସଫର୍', card: 'କାର୍ଡ', other: 'ଅନ୍ୟାନ୍ୟ',
      categoryShopRent: 'ଦୋକାନ ଭଡ଼ା', categoryElectricity: 'ବିଦ୍ୟୁତ୍', categoryInternet: 'ଇଣ୍ଟରନେଟ୍ ଓ ଫୋନ୍',
      categoryPrinting: 'ପ୍ରିଣ୍ଟିଂ ସାମଗ୍ରୀ', categoryPhotoSupplies: 'ଫଟୋ ପେପର୍ ଓ ଇଙ୍କ୍', categoryEquipment: 'ଉପକରଣ ଓ ମରାମତି',
      categoryTravel: 'ଯାତ୍ରା ଓ ପରିବହନ', categorySalary: 'କର୍ମଚାରୀ ଦରମା', categoryMarketing: 'ମାର୍କେଟିଂ', categoryOther: 'ଅନ୍ୟାନ୍ୟ',
      receiptLabel: 'ପ୍ରାପ୍ତି', refundLabel: 'ଫେରସ୍ତ', expenseLabel: 'ଖର୍ଚ୍ଚ',
      roleDenied: 'ଆପଣଙ୍କ ଭୂମିକାରେ ଆର୍ଥିକ ରେକର୍ଡ କରିବାର ଅନୁମତି ନାହିଁ।',
      uploadLater: 'ବ୍ୟକ୍ତିଗତ ଫାଇଲ୍ ଅପଲୋଡ୍ ସୁରକ୍ଷା ପର୍ଯ୍ୟାୟରେ ରସିଦ ଯୋଡ଼ିବା ସୁବିଧା ଆସିବ।'
    }
  };

  const $ = (id) => document.getElementById(id);
  const tr = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money = (value) => new Intl.NumberFormat(lang === 'or' ? 'or-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', {style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(value || 0));
  const methods = ['cash','upi','bank_transfer','card','other'];
  let financePanel = null;
  let cachedOrders = [];
  let activeBusinessId = null;
  let observerStarted = false;

  function localDateTimeInputValue(date = new Date()) {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0,16);
  }
  function optionList(values, selectedValue) {
    return values.map((v) => `<option value="${esc(v.value)}" ${v.value === selectedValue ? 'selected' : ''}>${esc(v.label)}</option>`).join('');
  }
  function methodsOptions() { return optionList(methods.map(m => ({value:m,label:tr(m)})), 'cash'); }
  function businessOrderTypes() {
    const types = selected && selected.business_units && selected.business_units.code === 'graphix'
      ? ['photography','videography','photo_editing','other']
      : ['counter','printing','photocopy','scan','lamination','passport_photo','photo_frame','photo_editing','other'];
    return optionList(types.map(x => ({value:x,label:tr(x)})), types[0]);
  }
  function showMessage(id, text, kind = 'success') {
    const el = $(id); if (!el) return;
    el.hidden = false; el.className = `fm-message ${kind}`; el.textContent = text;
  }
  function clearMessage(id) { const el = $(id); if (el) {el.hidden = true; el.textContent = '';} }
  function stylePanel() {
    if ($('bharatee-finance-style')) return;
    const style = document.createElement('style'); style.id = 'bharatee-finance-style';
    style.textContent = `
      .fm-panel{margin:22px 0;padding:20px;background:#fff;border:1px solid rgba(13,44,107,.16);border-radius:12px;color:#14203D}
      .fm-panel *{box-sizing:border-box}.fm-head h3{margin:0;color:#081E4D;font:700 23px 'Baloo 2'}.fm-head p{margin:4px 0 17px;color:#6C7895;font-size:11px;line-height:1.6}
      .fm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.fm-card{border:1px solid rgba(13,44,107,.14);background:#fffdfa;padding:17px;border-radius:10px;min-width:0}
      .fm-card h4{margin:0 0 5px;color:#081E4D;font:700 17px 'Baloo 2'}.fm-help{margin:0 0 14px;color:#6C7895;font-size:10px;line-height:1.5}
      .fm-field{display:block;margin:11px 0 0;color:#3A5590;font:600 9px 'IBM Plex Mono';letter-spacing:.04em;text-transform:uppercase}.fm-field input,.fm-field select,.fm-field textarea{display:block;width:100%;margin-top:5px;min-height:37px;padding:8px 9px;border:1px solid rgba(13,44,107,.2);border-radius:6px;background:white;color:#14203D;font:12px 'IBM Plex Sans';text-transform:none;letter-spacing:normal}
      .fm-field textarea{min-height:58px;resize:vertical}.fm-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}.fm-btn{margin-top:14px;min-height:38px;padding:9px 14px;background:#0D2C6B;color:white;border:0;border-radius:6px;font:600 10px 'IBM Plex Mono';cursor:pointer}.fm-btn:hover{background:#F26522}.fm-btn:disabled{opacity:.55;cursor:wait}
      .fm-message{margin:10px 0 0;padding:9px 11px;border-radius:6px;font-size:11px;line-height:1.5}.fm-message[hidden]{display:none}.fm-message.success{background:#eff8ef;border:1px solid #c2e3c0;color:#176b11}.fm-message.error{background:#fff1ed;border:1px solid #f0c2b5;color:#8b321a}
      .fm-status{margin:10px 0 0;padding:11px;background:#f5f7fb;border:1px solid rgba(13,44,107,.12);border-radius:7px;color:#3A5590;font-size:11px;line-height:1.6}
      .fm-table-wrap{overflow:auto}.fm-table{width:100%;border-collapse:collapse;font-size:10px}.fm-table th,.fm-table td{padding:8px;border-bottom:1px solid rgba(13,44,107,.1);text-align:left;white-space:nowrap}.fm-table th{font:600 9px 'IBM Plex Mono';color:#3A5590}.fm-table td{color:#14203D}
      @media(max-width:760px){.fm-grid{grid-template-columns:1fr}}@media(max-width:480px){.fm-panel{padding:12px}.fm-card{padding:13px}.fm-row{grid-template-columns:1fr}}
    `;
    document.head.append(style);
  }
  function buildPanel() {
    const selectedPanel = $('selectedPanel');
    if (!selectedPanel || $('bharateeFinancePanel')) return;
    stylePanel();
    financePanel = document.createElement('section'); financePanel.id = 'bharateeFinancePanel'; financePanel.className = 'fm-panel';
    financePanel.innerHTML = `
      <div class="fm-head"><h3>${esc(tr('title'))}</h3><p>${esc(tr('subtitle'))}</p></div>
      <div class="fm-grid">
        <section class="fm-card">
          <h4>${esc(tr('quickIncome'))}</h4><p class="fm-help">${esc(tr('quickIncomeHelp'))}</p>
          <form id="fmQuickIncome">
            <label class="fm-field">${esc(tr('description'))}<input name="description" maxlength="180" required></label>
            <div class="fm-row"><label class="fm-field">${esc(tr('amount'))}<input name="amount" type="number" min="0.01" max="99999999" step="0.01" required></label><label class="fm-field">${esc(tr('method'))}<select name="payment_method">${methodsOptions()}</select></label></div>
            <div class="fm-row"><label class="fm-field">${esc(tr('orderType'))}<select name="order_type">${businessOrderTypes()}</select></label><label class="fm-field">${esc(tr('transactionDate'))}<input name="transaction_at" type="datetime-local" value="${localDateTimeInputValue()}" required></label></div>
            <div class="fm-row"><label class="fm-field">${esc(tr('customer'))}<input name="customer_name" maxlength="120"></label><label class="fm-field">${esc(tr('phone'))}<input name="customer_phone" type="tel" maxlength="20"></label></div>
            <label class="fm-field">${esc(tr('reference'))}<input name="reference_no" maxlength="100"></label>
            <label class="fm-field">${esc(tr('note'))}<textarea name="note" maxlength="500"></textarea></label>
            <button class="fm-btn" type="submit">${esc(tr('saveIncome'))}</button><div id="fmIncomeMessage" class="fm-message" hidden></div>
          </form>
        </section>
        <section class="fm-card">
          <h4>${esc(tr('orderPayment'))}</h4><p class="fm-help">${esc(tr('receiptHint'))}</p>
          <form id="fmOrderPayment">
            <label class="fm-field">${esc(tr('order'))}<select name="order_id" id="fmOrderSelect" required><option value="">${esc(tr('loading'))}</option></select></label>
            <div class="fm-row"><label class="fm-field">${esc(tr('transactionType'))}<select name="entry_type"><option value="receipt">${esc(tr('receipt'))}</option><option value="refund">${esc(tr('refund'))}</option></select></label><label class="fm-field">${esc(tr('amount'))}<input name="amount" type="number" min="0.01" step="0.01" required></label></div>
            <div class="fm-row"><label class="fm-field">${esc(tr('method'))}<select name="payment_method">${methodsOptions()}</select></label><label class="fm-field">${esc(tr('transactionDate'))}<input name="transaction_at" type="datetime-local" value="${localDateTimeInputValue()}" required></label></div>
            <label class="fm-field">${esc(tr('reference'))}<input name="reference_no" maxlength="100"></label>
            <label class="fm-field">${esc(tr('note'))}<textarea name="note" maxlength="500"></textarea></label>
            <button class="fm-btn" type="submit">${esc(tr('saveTransaction'))}</button><div id="fmOrderMessage" class="fm-message" hidden></div>
          </form>
        </section>
        <section class="fm-card">
          <h4>${esc(tr('expense'))}</h4>
          <form id="fmExpense">
            <label class="fm-field">${esc(tr('category'))}<select name="category_id" id="fmCategorySelect"><option value="">${esc(tr('loading'))}</option></select></label>
            <label class="fm-field">${esc(tr('description'))}<input name="description" maxlength="180" required></label>
            <div class="fm-row"><label class="fm-field">${esc(tr('amount'))}<input name="amount" type="number" min="0.01" max="99999999" step="0.01" required></label><label class="fm-field">${esc(tr('method'))}<select name="payment_method">${methodsOptions()}</select></label></div>
            <div class="fm-row"><label class="fm-field">${esc(tr('vendor'))}<input name="vendor_name" maxlength="120"></label><label class="fm-field">${esc(tr('expenseDate'))}<input name="expense_date" type="datetime-local" value="${localDateTimeInputValue()}" required></label></div>
            <label class="fm-field">${esc(tr('note'))}<textarea name="note" maxlength="500"></textarea></label>
            <button class="fm-btn" type="submit">${esc(tr('saveExpense'))}</button><div id="fmExpenseMessage" class="fm-message" hidden></div>
          </form>
        </section>
        <section class="fm-card">
          <h4>${esc(tr('cashbook'))}</h4>
          <div id="fmCashStatus" class="fm-status">${esc(tr('loading'))}</div>
          <form id="fmOpenCash" class="hidden">
            <label class="fm-field">${esc(tr('openingCash'))}<input name="opening_cash" type="number" min="0" step="0.01" value="0" required></label>
            <button class="fm-btn" type="submit">${esc(tr('openCashbook'))}</button><div id="fmCashOpenMessage" class="fm-message" hidden></div>
          </form>
          <form id="fmCloseCash" class="hidden">
            <label class="fm-field">${esc(tr('countedCash'))}<input name="counted_cash" type="number" min="0" step="0.01" required></label>
            <label class="fm-field">${esc(tr('closeNote'))}<textarea name="closing_note" maxlength="500"></textarea></label>
            <button class="fm-btn" type="submit">${esc(tr('closeCashbook'))}</button><div id="fmCashCloseMessage" class="fm-message" hidden></div>
          </form>
        </section>
      </div>
      <div class="fm-card" style="margin-top:13px"><h4>${esc(tr('recent'))}</h4><div id="fmRecent" class="fm-help">${esc(tr('loading'))}</div></div>`;
    const modules = selectedPanel.querySelector('.modules'); selectedPanel.insertBefore(financePanel, modules || null);
    $('fmQuickIncome').addEventListener('submit', saveQuickIncome);
    $('fmOrderPayment').addEventListener('submit', saveOrderTransaction);
    $('fmExpense').addEventListener('submit', saveExpense);
    $('fmOpenCash').addEventListener('submit', openCashSession);
    $('fmCloseCash').addEventListener('submit', closeCashSession);
    $('fmOrderPayment').elements.entry_type.addEventListener('change', renderOrderOptions);
  }
  function currentBusiness() {
    if (typeof selected === 'undefined' || !selected || !selected.business_id) throw new Error('Select a business first.');
    return selected;
  }
  function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
  function validAmount(value) { const amount = Number(value); if (!Number.isFinite(amount) || amount <= 0) throw new Error(tr('amountPositive')); return amount; }
  function toIso(value) { const d = new Date(value); if (Number.isNaN(d.getTime())) throw new Error(tr('required')); return d.toISOString(); }
  async function saveQuickIncome(event) {
    event.preventDefault(); const form = event.currentTarget, button = form.querySelector('button[type=submit]');
    clearMessage('fmIncomeMessage');
    try {
      const business = currentBusiness(), f = formData(form);
      const amount = validAmount(f.amount);
      if (!f.description.trim()) throw new Error(tr('required'));
      button.disabled = true;
      const {data,error} = await db.rpc('create_quick_income', {
        p_business_id: business.business_id, p_description:f.description.trim(), p_amount:amount,
        p_payment_method:f.payment_method, p_order_type:f.order_type,
        p_customer_name:f.customer_name.trim() || null, p_customer_phone:f.customer_phone.trim() || null,
        p_reference_no:f.reference_no.trim() || null, p_transaction_at:toIso(f.transaction_at), p_note:f.note.trim() || null
      });
      if(error) throw error;
      form.reset(); form.elements.transaction_at.value = localDateTimeInputValue();
      showMessage('fmIncomeMessage',tr('orderCreated')+(data.order_no || '—')+' · '+money(amount));
      await refreshFinanceViews();
    } catch(error) { showMessage('fmIncomeMessage',error.message || tr('loadError'),'error'); }
    finally { button.disabled = false; }
  }
  async function loadOrders() {
    const business = currentBusiness();
    const [ordersResult,paymentsResult] = await Promise.all([
      db.from('orders').select('id,order_no,total,status,created_at').eq('business_id',business.business_id).neq('status','cancelled').order('created_at',{ascending:false}).limit(500),
      db.from('payment_transactions').select('order_id,amount,entry_type').eq('business_id',business.business_id).limit(10000)
    ]);
    if(ordersResult.error) throw ordersResult.error; if(paymentsResult.error) throw paymentsResult.error;
    const paid = new Map();
    for(const p of paymentsResult.data || []) paid.set(p.order_id,(paid.get(p.order_id)||0)+(p.entry_type==='receipt'?Number(p.amount):-Number(p.amount)));
    cachedOrders = (ordersResult.data || []).map(o=>({...o,paid:paid.get(o.id)||0,due:Math.max(Number(o.total)-(paid.get(o.id)||0),0)}));
    renderOrderOptions();
  }
  function renderOrderOptions() {
    const select = $('fmOrderSelect'); if(!select) return;
    const type = $('fmOrderPayment').elements.entry_type.value;
    const eligible = cachedOrders.filter(o=>type==='receipt'?o.due>0:o.paid>0);
    select.innerHTML = '<option value="">'+esc(tr('chooseOrder'))+'</option>' + eligible.map(o=>{
      const info = type==='receipt' ? `${tr('balance')} ${money(o.due)}` : `${tr('receiptLabel')}: ${money(o.paid)}`;
      return `<option value="${esc(o.id)}">${esc(o.order_no)} · ${esc(o.status)} · ${esc(info)}</option>`;
    }).join('');
    if(!eligible.length) select.innerHTML = '<option value="">'+esc(tr('noOrders'))+'</option>';
  }
  async function saveOrderTransaction(event) {
    event.preventDefault(); const form=event.currentTarget,button=form.querySelector('button[type=submit]'); clearMessage('fmOrderMessage');
    try {
      const business=currentBusiness(),f=formData(form),amount=validAmount(f.amount);
      if(!f.order_id) throw new Error(tr('chooseOrder'));
      button.disabled=true;
      const rpc=f.entry_type==='refund'?'record_order_refund':'record_order_receipt';
      const {data,error}=await db.rpc(rpc,{
        p_business_id:business.business_id,p_order_id:f.order_id,p_amount:amount,p_payment_method:f.payment_method,
        p_reference_no:f.reference_no.trim()||null,p_transaction_at:toIso(f.transaction_at),p_note:f.note.trim()||null
      });
      if(error) throw error;
      form.reset(); form.elements.transaction_at.value=localDateTimeInputValue();
      showMessage('fmOrderMessage',tr('saved')+' '+(data.remaining_balance!==undefined?tr('balance')+money(data.remaining_balance):''));
      await refreshFinanceViews();
    } catch(error) { showMessage('fmOrderMessage',error.message||tr('loadError'),'error'); }
    finally {button.disabled=false;}
  }
  async function loadCategories() {
    const business=currentBusiness(),select=$('fmCategorySelect');
    const {data,error}=await db.from('expense_categories').select('id,name_i18n').eq('business_id',business.business_id).eq('is_active',true).order('created_at',{ascending:true});
    if(error) throw error;
    select.innerHTML='<option value="">'+esc(tr('categoryOther'))+'</option>'+(data||[]).map(c=>{
      const name=(c.name_i18n&&(c.name_i18n[lang]||c.name_i18n.en||c.name_i18n.hi||c.name_i18n.or))||tr('categoryOther');
      return `<option value="${esc(c.id)}">${esc(name)}</option>`;
    }).join('');
  }
  async function saveExpense(event) {
    event.preventDefault(); const form=event.currentTarget,button=form.querySelector('button[type=submit]'); clearMessage('fmExpenseMessage');
    try {
      const business=currentBusiness(),f=formData(form),amount=validAmount(f.amount);
      if(!f.description.trim()) throw new Error(tr('required'));
      button.disabled=true;
      const {data,error}=await db.rpc('record_business_expense',{
        p_business_id:business.business_id,p_description:f.description.trim(),p_amount:amount,p_payment_method:f.payment_method,
        p_category_id:f.category_id||null,p_vendor_name:f.vendor_name.trim()||null,
        p_expense_date:toIso(f.expense_date),p_receipt_object_path:null,p_note:f.note.trim()||null
      });
      if(error) throw error;
      form.reset(); form.elements.expense_date.value=localDateTimeInputValue();
      showMessage('fmExpenseMessage',tr('saved')+' '+money(data.amount));
      await refreshFinanceViews();
    } catch(error) {showMessage('fmExpenseMessage',error.message||tr('loadError'),'error');}
    finally {button.disabled=false;}
  }
  async function loadCashSession() {
    const business=currentBusiness(),status=$('fmCashStatus'),openForm=$('fmOpenCash'),closeForm=$('fmCloseCash');
    const {data,error}=await db.from('cash_sessions').select('id,opening_cash,opened_at').eq('business_id',business.business_id).is('closed_at',null).order('opened_at',{ascending:false}).limit(1).maybeSingle();
    if(error) throw error;
    if(!data){status.textContent=tr('noOpenSession');openForm.classList.remove('hidden');closeForm.classList.add('hidden');}
    else{status.innerHTML=`<strong>${esc(tr('sessionOpen'))}</strong><br>${esc(tr('openedAt'))}: ${esc(new Date(data.opened_at).toLocaleString())}<br>${esc(tr('openingCash'))}: ${esc(money(data.opening_cash))}`;openForm.classList.add('hidden');closeForm.classList.remove('hidden');}
  }
  async function openCashSession(event) {
    event.preventDefault(); const form=event.currentTarget,button=form.querySelector('button[type=submit]'); clearMessage('fmCashOpenMessage');
    try{const business=currentBusiness(),f=formData(form),amount=Number(f.opening_cash);if(!Number.isFinite(amount)||amount<0)throw new Error(tr('required'));button.disabled=true;
      const {error}=await db.rpc('open_cash_session',{p_business_id:business.business_id,p_opening_cash:amount});if(error)throw error;
      showMessage('fmCashOpenMessage',tr('saved'));await refreshFinanceViews();
    }catch(error){showMessage('fmCashOpenMessage',error.message||tr('loadError'),'error');}finally{button.disabled=false;}
  }
  async function closeCashSession(event) {
    event.preventDefault();if(!confirm(tr('confirmClose')))return;const form=event.currentTarget,button=form.querySelector('button[type=submit]');clearMessage('fmCashCloseMessage');
    try{const business=currentBusiness(),f=formData(form),amount=Number(f.counted_cash);if(!Number.isFinite(amount)||amount<0)throw new Error(tr('required'));button.disabled=true;
      const {data,error}=await db.rpc('close_cash_session',{p_business_id:business.business_id,p_counted_cash:amount,p_closing_note:f.closing_note.trim()||null});if(error)throw error;
      showMessage('fmCashCloseMessage',tr('saved')+' · '+tr('expectedCash')+': '+money(data.expected_cash)+' · Variance: '+money(data.variance));form.reset();await refreshFinanceViews();
    }catch(error){showMessage('fmCashCloseMessage',error.message||tr('loadError'),'error');}finally{button.disabled=false;}
  }
  async function loadRecent() {
    const business=currentBusiness(),target=$('fmRecent');
    const [payments,expenses]=await Promise.all([
      db.from('payment_transactions').select('entry_type,amount,payment_method,transaction_at,reference_no').eq('business_id',business.business_id).order('transaction_at',{ascending:false}).limit(6),
      db.from('expenses').select('description,amount,payment_method,expense_date,vendor_name').eq('business_id',business.business_id).order('expense_date',{ascending:false}).limit(6)
    ]);
    if(payments.error)throw payments.error;if(expenses.error)throw expenses.error;
    const paymentRows=(payments.data||[]).map(p=>`<tr><td>${esc(new Date(p.transaction_at).toLocaleDateString())}</td><td>${esc(p.entry_type==='receipt'?tr('receiptLabel'):tr('refundLabel'))}</td><td>${esc(p.payment_method)}</td><td>${esc(money(p.amount))}</td></tr>`).join('');
    const expenseRows=(expenses.data||[]).map(e=>`<tr><td>${esc(new Date(e.expense_date).toLocaleDateString())}</td><td>${esc(e.description)}</td><td>${esc(e.payment_method)}</td><td>${esc(money(e.amount))}</td></tr>`).join('');
    target.innerHTML=`<div class="fm-grid"><div><p class="fm-help">${esc(tr('recentPayments'))}</p><div class="fm-table-wrap"><table class="fm-table"><thead><tr><th>${esc(tr('date'))}</th><th>${esc(tr('type'))}</th><th>${esc(tr('method'))}</th><th>${esc(tr('amount'))}</th></tr></thead><tbody>${paymentRows||`<tr><td colspan="4">${esc(tr('noRecent'))}</td></tr>`}</tbody></table></div></div><div><p class="fm-help">${esc(tr('recentExpenses'))}</p><div class="fm-table-wrap"><table class="fm-table"><thead><tr><th>${esc(tr('date'))}</th><th>${esc(tr('details'))}</th><th>${esc(tr('method'))}</th><th>${esc(tr('amount'))}</th></tr></thead><tbody>${expenseRows||`<tr><td colspan="4">${esc(tr('noRecent'))}</td></tr>`}</tbody></table></div></div></div>`;
  }
  async function refreshFinanceViews() {
    const tasks=[loadOrders(),loadCategories(),loadCashSession(),loadRecent()];
    const results=await Promise.allSettled(tasks);
    const failed=results.find(r=>r.status==='rejected');
    if(failed) console.error('Finance panel refresh:',failed.reason);
    const reportButton=$('baLoad');if(reportButton)reportButton.click();
  }
  function installPanel() {
    const root=$('selectedPanel');if(!root)return;
    const visible=!root.classList.contains('hidden');
    if(!visible)return;
    buildPanel();
    if(!selected || !selected.business_id)return;
    const allowedRoles=['owner','admin','manager','accountant'];
    if(!allowedRoles.includes(selected.role)){
      if(financePanel.querySelector('#fmQuickIncome')){
        financePanel.innerHTML='<div class=\"fm-head\"><h3>'+esc(tr('title'))+'</h3><p>'+esc(tr('roleDenied'))+'</p></div>';
      }
      activeBusinessId=selected.business_id;
      return;
    }
    if(!financePanel.querySelector('#fmQuickIncome')){
      financePanel.remove();financePanel=null;buildPanel();
    }
    if(activeBusinessId===selected.business_id)return;
    activeBusinessId=selected.business_id;
    refreshFinanceViews().catch(error=>console.error('Finance panel load:',error));
  }
  function observe() {
    if(observerStarted)return;observerStarted=true;
    const root=$('selectedPanel');if(!root)return;
    const observer=new MutationObserver(()=>{
      if(selected && selected.business_id!==activeBusinessId){activeBusinessId=null;}
      installPanel();
    });
    observer.observe(root,{attributes:true,attributeFilter:['class'],childList:true,subtree:true,characterData:true});
    const language=$('lang');if(language)language.addEventListener('change',()=>{
      if(!root.classList.contains('hidden')){if(financePanel){financePanel.remove();financePanel=null;}activeBusinessId=null;buildPanel();refreshFinanceViews().catch(console.error);}
    });
    installPanel();
  }
  document.addEventListener('DOMContentLoaded',observe);
  window.addEventListener('load',observe);
  setTimeout(observe,250);
})();
