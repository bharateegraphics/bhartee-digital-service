/* BHARATEE BUSINESS PLATFORM — Advanced Accounting Overview
   Requires the authenticated Supabase client and current dashboard globals
   already declared by admin.html: db, selected, lang.
   This module is read-only. Payment/expense entry and cash session controls
   will be implemented in the next milestone. */
(() => {
  "use strict";

  const translations = {
    en: {
      title: "Advanced accounting overview",
      subtitle: "Live financial summary for the selected business",
      from: "From", to: "To", load: "Load report", loading: "Loading report…",
      gross: "Gross receipts", refunds: "Refunds", net: "Net collections",
      expenses: "Total expenses", movement: "Operating movement",
      pending: "Pending customer balance", pendingOrders: "Orders with balance due",
      ordersToday: "Orders created today", openOrders: "Open orders",
      collections: "Collections by payment method", expenseSplit: "Expenses by payment method",
      cashbook: "Current cashbook session", noSession: "No open cash session.",
      opening: "Opening cash", cashReceipts: "Cash receipts", cashRefunds: "Cash refunds",
      cashExpenses: "Cash expenses", expected: "Expected cash now",
      cash: "Cash", upi: "UPI", bank_transfer: "Bank transfer", card: "Card", other: "Other",
      noData: "No transactions in this period.",
      error: "Could not load the report. Check the SQL migration, authentication and RLS permissions.",
      customers: "Customers", enquiries: "New enquiries", bookings: "Upcoming bookings (30 days)",
      todayTotal: "Orders created today — order value"
    },
    hi: {
      title: "उन्नत लेखा सारांश",
      subtitle: "चुने गए व्यवसाय का लाइव वित्तीय सारांश",
      from: "से", to: "तक", load: "रिपोर्ट देखें", loading: "रिपोर्ट लोड हो रही है…",
      gross: "कुल प्राप्ति", refunds: "रिफंड", net: "शुद्ध प्राप्ति",
      expenses: "कुल खर्च", movement: "प्राप्ति घटा खर्च",
      pending: "ग्राहकों से बाकी राशि", pendingOrders: "बकाया वाले ऑर्डर",
      ordersToday: "आज बनाए गए ऑर्डर", openOrders: "खुले ऑर्डर",
      collections: "भुगतान माध्यम के अनुसार प्राप्ति", expenseSplit: "भुगतान माध्यम के अनुसार खर्च",
      cashbook: "वर्तमान कैशबुक सत्र", noSession: "कोई खुला कैश सत्र नहीं है।",
      opening: "शुरुआती नकद", cashReceipts: "नकद प्राप्ति", cashRefunds: "नकद रिफंड",
      cashExpenses: "नकद खर्च", expected: "अभी अपेक्षित नकद",
      cash: "नकद", upi: "UPI", bank_transfer: "बैंक ट्रांसफर", card: "कार्ड", other: "अन्य",
      noData: "इस अवधि में कोई लेन-देन नहीं है।",
      error: "रिपोर्ट लोड नहीं हुई। SQL migration, login और RLS permissions जाँचें।",
      customers: "ग्राहक", enquiries: "नई पूछताछ", bookings: "अगले 30 दिनों की बुकिंग",
      todayTotal: "आज के ऑर्डर — कुल मूल्य"
    },
    or: {
      title: "ଉନ୍ନତ ହିସାବ ସାରାଂଶ",
      subtitle: "ଚୟନିତ ବ୍ୟବସାୟର ଲାଇଭ୍ ଆର୍ଥିକ ସାରାଂଶ",
      from: "ଠାରୁ", to: "ପର୍ଯ୍ୟନ୍ତ", load: "ରିପୋର୍ଟ ଦେଖନ୍ତୁ", loading: "ରିପୋର୍ଟ ଲୋଡ୍ ହେଉଛି…",
      gross: "ମୋଟ ଆଦାୟ", refunds: "ଫେରସ୍ତ", net: "ନିଟ୍ ଆଦାୟ",
      expenses: "ମୋଟ ଖର୍ଚ୍ଚ", movement: "ଆଦାୟ ବିୟୋଗ ଖର୍ଚ୍ଚ",
      pending: "ଗ୍ରାହକଙ୍କଠାରୁ ବାକି", pendingOrders: "ବାକି ଥିବା ଅର୍ଡର୍",
      ordersToday: "ଆଜି ସୃଷ୍ଟି ହୋଇଥିବା ଅର୍ଡର୍", openOrders: "ଖୋଲା ଅର୍ଡର୍",
      collections: "ପେମେଣ୍ଟ ମାଧ୍ୟମ ଅନୁସାରେ ଆଦାୟ", expenseSplit: "ପେମେଣ୍ଟ ମାଧ୍ୟମ ଅନୁସାରେ ଖର୍ଚ୍ଚ",
      cashbook: "ବର୍ତ୍ତମାନର କ୍ୟାଶବୁକ୍ ସେସନ୍", noSession: "କୌଣସି ଖୋଲା କ୍ୟାଶ୍ ସେସନ୍ ନାହିଁ।",
      opening: "ଆରମ୍ଭର ନଗଦ", cashReceipts: "ନଗଦ ଆଦାୟ", cashRefunds: "ନଗଦ ଫେରସ୍ତ",
      cashExpenses: "ନଗଦ ଖର୍ଚ୍ଚ", expected: "ବର୍ତ୍ତମାନ ଆଶାକରା ନଗଦ",
      cash: "ନଗଦ", upi: "UPI", bank_transfer: "ବ୍ୟାଙ୍କ ଟ୍ରାନ୍ସଫର୍", card: "କାର୍ଡ", other: "ଅନ୍ୟାନ୍ୟ",
      noData: "ଏହି ଅବଧିରେ କୌଣସି ଲେଣଦେଣ ନାହିଁ।",
      error: "ରିପୋର୍ଟ ଲୋଡ୍ ହୋଇପାରିଲା ନାହିଁ। SQL migration, login ଏବଂ RLS ଅନୁମତି ଯାଞ୍ଚ କରନ୍ତୁ।",
      customers: "ଗ୍ରାହକ", enquiries: "ନୂଆ ପଚରାଉଚରା", bookings: "ଆସନ୍ତା ୩୦ ଦିନର ବୁକିଂ",
      todayTotal: "ଆଜିର ଅର୍ଡର୍ — ମୋଟ ମୂଲ୍ୟ"
    }
  };

  const METHODS = ["cash", "upi", "bank_transfer", "card", "other"];
  let panel, loadingSequence = 0;

  const tr = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;
  const money = (value) => new Intl.NumberFormat(
    lang === "or" ? "or-IN" : lang === "hi" ? "hi-IN" : "en-IN",
    { style: "currency", currency: "INR", maximumFractionDigits: 2 }
  ).format(Number(value || 0));
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  function dateInputValue(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
  function monthRange() {
    const now = new Date();
    return {
      from: dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: dateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    };
  }
  function addStyles() {
    if (document.getElementById("bharatee-accounting-styles")) return;
    const style = document.createElement("style");
    style.id = "bharatee-accounting-styles";
    style.textContent = `
      .ba-panel{margin:22px 0 24px;padding:20px;background:#fff;border:1px solid rgba(13,44,107,.16);border-radius:12px}
      .ba-panel *{box-sizing:border-box}
      .ba-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}
      .ba-head h3{font:700 22px 'Baloo 2';color:#081E4D;margin:0 0 4px}
      .ba-head p{margin:0;color:#6C7895;font-size:11px}
      .ba-filters{display:flex;gap:9px;align-items:end;flex-wrap:wrap;margin-top:15px}
      .ba-filters label{display:grid;gap:5px;margin:0;color:#3A5590;font:600 9px 'IBM Plex Mono';text-transform:uppercase}
      .ba-filters input{height:36px;width:145px;border:1px solid rgba(13,44,107,.2);border-radius:6px;padding:6px 8px;font:12px 'IBM Plex Sans'}
      .ba-filters button{height:36px;padding:0 14px;background:#0D2C6B;color:white;border:0;border-radius:6px;font:600 10px 'IBM Plex Mono'}
      .ba-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:17px}
      .ba-stat{padding:13px;border:1px solid rgba(13,44,107,.13);border-radius:8px;background:#FFFBF3;min-width:0}
      .ba-stat span{display:block;color:#6C7895;font:600 9px 'IBM Plex Mono';line-height:1.5}
      .ba-stat strong{display:block;margin-top:8px;color:#081E4D;font:700 clamp(16px,2vw,22px) 'Baloo 2';overflow-wrap:anywhere}
      .ba-stat small{display:block;margin-top:4px;color:#6C7895;font-size:10px}
      .ba-columns{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
      .ba-box{border:1px solid rgba(13,44,107,.13);border-radius:9px;padding:14px;min-width:0}
      .ba-box h4{margin:0 0 12px;color:#081E4D;font:700 14px 'Baloo 2'}
      .ba-row{display:grid;grid-template-columns:100px 1fr auto;gap:8px;align-items:center;margin:9px 0;font-size:10px}
      .ba-row span:first-child{color:#3A5590}
      .ba-track{height:7px;background:#edf0f6;border-radius:8px;overflow:hidden}
      .ba-fill{height:100%;background:#F26522;border-radius:8px}
      .ba-row b{font:600 10px 'IBM Plex Mono';color:#081E4D}
      .ba-cash-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
      .ba-cash{padding:11px;background:#FFFBF3;border-radius:7px}
      .ba-cash span{display:block;color:#6C7895;font-size:10px}
      .ba-cash b{display:block;margin-top:5px;color:#081E4D;font:600 13px 'IBM Plex Mono';overflow-wrap:anywhere}
      .ba-note{margin-top:12px;padding:10px 12px;border-radius:7px;background:#fff4ec;color:#8b421d;font-size:11px;line-height:1.5}
      @media(max-width:760px){.ba-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ba-columns{grid-template-columns:1fr}}
      @media(max-width:480px){.ba-panel{padding:14px}.ba-row{grid-template-columns:82px 1fr auto;gap:5px}.ba-filters label{flex:1}.ba-filters input{width:100%}}
    `;
    document.head.append(style);
  }

  function ensurePanel() {
    const selectedPanel = document.getElementById("selectedPanel");
    if (!selectedPanel || document.getElementById("bharateeAccountingPanel")) return;
    addStyles();
    panel = document.createElement("section");
    panel.id = "bharateeAccountingPanel";
    panel.className = "ba-panel";
    panel.innerHTML = `
      <div class="ba-head"><div><h3>${tr("title")}</h3><p>${tr("subtitle")}</p></div></div>
      <div class="ba-filters">
        <label>${tr("from")}<input id="baFrom" type="date"></label>
        <label>${tr("to")}<input id="baTo" type="date"></label>
        <button id="baLoad" type="button">${tr("load")}</button>
      </div>
      <div id="baReport" aria-live="polite"><div class="ba-note">${tr("loading")}</div></div>`;
    const modules = selectedPanel.querySelector(".modules");
    selectedPanel.insertBefore(panel, modules || null);
    const range = monthRange();
    panel.querySelector("#baFrom").value = range.from;
    panel.querySelector("#baTo").value = range.to;
    panel.querySelector("#baLoad").addEventListener("click", loadReport);
  }
  function stat(label, value, detail = "") {
    return `<article class="ba-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;
  }
  function methodRows(map, field) {
    const values = METHODS.map((method) => Number(
      field === "expense"
        ? (map && map[method]) || 0
        : (map && map[method] && map[method][field]) || 0
    ));
    const max = Math.max(1, ...values);
    if (values.every((value) => value === 0)) return `<p style="color:#6C7895;font-size:11px">${esc(tr("noData"))}</p>`;
    return METHODS.map((method, index) => `
      <div class="ba-row"><span>${esc(tr(method))}</span>
        <div class="ba-track"><div class="ba-fill" style="width:${Math.max(0, Math.min(100, values[index] / max * 100))}%"></div></div>
        <b>${esc(money(values[index]))}</b>
      </div>`).join("");
  }
  function showError(message) {
    const report = document.getElementById("baReport");
    if (report) report.innerHTML = `<div class="ba-note">${esc(message)}</div>`;
  }

  async function loadReport() {
    if (typeof window.db === "undefined" || !window.selected) {
      // Top-level let declarations from the existing classic script are not
      // guaranteed to be properties of window. The fallback below reads them
      // by identifier in the enclosing global environment.
    }
    let client, membership, locale;
    try {
      client = db;
      membership = selected;
      locale = lang || "en";
    } catch (error) {
      return showError("Admin session context is not available. Refresh the admin page and sign in again.");
    }
    if (!client || !membership || !membership.business_id) return;
    const fromValue = document.getElementById("baFrom").value;
    const toValue = document.getElementById("baTo").value;
    if (!fromValue || !toValue || toValue < fromValue) return showError("Choose a valid date range.");
    const from = new Date(`${fromValue}T00:00:00`);
    const until = new Date(`${toValue}T00:00:00`);
    until.setDate(until.getDate() + 1);

    const requestId = ++loadingSequence;
    const report = document.getElementById("baReport");
    report.innerHTML = `<div class="ba-note">${esc(tr("loading"))}</div>`;
    const { data, error } = await client.rpc("get_accounting_dashboard", {
      p_business_id: membership.business_id,
      p_period_start: from.toISOString(),
      p_period_end: until.toISOString()
    });
    if (requestId !== loadingSequence) return;
    if (error) {
      console.error("BHARATEE accounting report failed:", error);
      return showError(`${tr("error")} ${error.message || ""}`);
    }
    if (!data) return showError(tr("error"));

    const cash = data.cash_session;
    const cashHtml = cash ? `
      <div class="ba-cash-grid">
        <div class="ba-cash"><span>${esc(tr("opening"))}</span><b>${esc(money(cash.opening_cash))}</b></div>
        <div class="ba-cash"><span>${esc(tr("cashReceipts"))}</span><b>${esc(money(cash.cash_receipts))}</b></div>
        <div class="ba-cash"><span>${esc(tr("cashRefunds"))}</span><b>${esc(money(cash.cash_refunds))}</b></div>
        <div class="ba-cash"><span>${esc(tr("cashExpenses"))}</span><b>${esc(money(cash.cash_expenses))}</b></div>
        <div class="ba-cash" style="grid-column:1/-1"><span>${esc(tr("expected"))}</span><b>${esc(money(cash.expected_cash))}</b></div>
      </div>` : `<p style="margin:0;color:#6C7895;font-size:11px">${esc(tr("noSession"))}</p>`;

    report.innerHTML = `
      <div class="ba-grid">
        ${stat(tr("gross"), money(data.gross_receipts))}
        ${stat(tr("refunds"), money(data.refunds))}
        ${stat(tr("net"), money(data.net_collections))}
        ${stat(tr("expenses"), money(data.expenses_total))}
        ${stat(tr("movement"), money(data.operating_cash_movement))}
        ${stat(tr("pending"), money(data.pending_customer_balance), `${data.orders_with_pending_balance} · ${tr("pendingOrders")}`)}
        ${stat(tr("openOrders"), data.open_orders)}
        ${stat(tr("ordersToday"), money(data.orders_created_today_total), tr("todayTotal"))}
      </div>
      <div class="ba-columns">
        <section class="ba-box"><h4>${esc(tr("collections"))}</h4>${methodRows(data.collections_by_method, "net")}</section>
        <section class="ba-box"><h4>${esc(tr("expenseSplit"))}</h4>${methodRows(data.expenses_by_method, "expense")}</section>
        <section class="ba-box"><h4>${esc(tr("cashbook"))}</h4>${cashHtml}</section>
        <section class="ba-box"><h4>${esc(tr("customers"))} · ${esc(tr("enquiries"))} · ${esc(tr("bookings"))}</h4>
          <div class="ba-cash-grid">
            <div class="ba-cash"><span>${esc(tr("customers"))}</span><b>${esc(data.customers)}</b></div>
            <div class="ba-cash"><span>${esc(tr("enquiries"))}</span><b>${esc(data.new_enquiries)}</b></div>
            <div class="ba-cash"><span>${esc(tr("bookings"))}</span><b>${esc(data.upcoming_bookings_30d)}</b></div>
          </div>
        </section>
      </div>`;
  }

  function refreshLabels() {
    if (!panel) return;
    const old = panel;
    const holder = old.parentElement;
    old.remove();
    panel = null;
    ensurePanel();
    if (selected) loadReport();
  }

  function observeDashboard() {
    const selectedPanel = document.getElementById("selectedPanel");
    const selectedName = document.getElementById("selectedName");
    if (!selectedPanel || !selectedName) return;
    const observer = new MutationObserver(() => {
      ensurePanel();
      if (!selectedPanel.classList.contains("hidden") && selected) loadReport();
    });
    observer.observe(selectedPanel, { attributes: true, attributeFilter: ["class"] });
    observer.observe(selectedName, { childList: true, characterData: true, subtree: true });
    const language = document.getElementById("lang");
    if (language) language.addEventListener("change", refreshLabels);
    ensurePanel();
  }

  document.addEventListener("DOMContentLoaded", observeDashboard);
  window.addEventListener("load", observeDashboard);
})();