/* BHARATEE GRAPHIX — Owner/Admin client album portal manager. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let panel = null, loadedBusinessId = null, observerReady = false;
  function ctx() {
    try { return (typeof db !== 'undefined' && typeof selected !== 'undefined' && selected) ? {db,business:selected} : null; }
    catch (_) { return null; }
  }
  function isGraphix(c) { return !!(c && c.business.business_units && c.business.business_units.code === 'graphix'); }
  function canManage(c) { return !!(c && ['owner','admin','manager'].includes(c.business.role)); }
  function notice(text, error=false) {
    const n = $('cpAdminNotice'); if (!n) return;
    n.textContent = text || ''; n.hidden = !text;
    n.className = 'cp-admin-notice' + (error ? ' error' : '');
  }
  function addStyles() {
    if ($('cpAdminStyles')) return;
    const s = document.createElement('style'); s.id = 'cpAdminStyles';
    s.textContent = '#bharateeClientPortalAdmin{margin:20px 0;padding:19px;background:#fff;border:1px solid rgba(13,44,107,.16);border-radius:12px;color:#14203D}' +
      '#bharateeClientPortalAdmin *{box-sizing:border-box}.cp-admin-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}' +
      '.cp-admin-head h3{margin:0;color:#081E4D;font:700 21px "Baloo 2"}.cp-admin-head p,.cp-admin-meta{color:#6C7895;font-size:10px;line-height:1.65}' +
      '.cp-admin-actions,.cp-admin-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.cp-admin-btn{border:0;border-radius:7px;padding:9px 12px;background:#0D2C6B;color:#fff;font:600 10px "IBM Plex Mono";cursor:pointer}' +
      '.cp-admin-btn.alt{background:#fff;color:#0D2C6B;border:1px solid #ccd5e6}.cp-admin-btn.warn{background:#fff1ed;color:#8b321a;border:1px solid #efc5b8}.cp-admin-btn:disabled{opacity:.5;cursor:wait}' +
      '.cp-admin-note,.cp-admin-notice{margin:12px 0;padding:10px;border-radius:7px;background:#f3f6fc;color:#3A5590;font-size:10px;line-height:1.6}.cp-admin-notice{background:#eff8ef;color:#176b11}.cp-admin-notice.error{background:#fff1ed;color:#8b321a}.cp-admin-notice[hidden]{display:none}' +
      '.cp-admin-list{display:grid;gap:10px;margin-top:12px}.cp-admin-card,.cp-admin-query{border:1px solid #dce2ec;border-radius:9px;padding:13px;background:#fffcf7}.cp-admin-card h4{margin:0;color:#081E4D;font:700 14px "Baloo 2"}' +
      '.cp-admin-badge{font:600 9px "IBM Plex Mono";padding:5px 8px;border-radius:20px;background:#edf7ed;color:#176b11}.cp-admin-badge.off{background:#fff1ed;color:#8b321a}' +
      '.cp-admin-row{margin-top:10px}.cp-admin-row input[type=url]{min-width:200px;flex:1;padding:8px;border:1px solid #ccd5e6;border-radius:6px;font:12px "IBM Plex Sans"}.cp-admin-delivered{display:inline-flex;align-items:center;gap:7px;margin-top:10px;color:#3A5590;font-size:10px}' +
      '.cp-admin-query p{font-size:11px;white-space:pre-wrap;overflow-wrap:anywhere}.cp-admin-query textarea{display:block;width:100%;min-height:65px;margin-top:8px;padding:8px;border:1px solid #ccd5e6;border-radius:6px;font:12px "IBM Plex Sans"}.cp-admin-query select{height:34px;border:1px solid #ccd5e6;border-radius:6px;padding:6px}' +
      '@media(max-width:620px){#bharateeClientPortalAdmin{padding:13px}.cp-admin-row input[type=url]{width:100%}}';
    document.head.append(s);
  }
  function build() {
    const root = $('selectedPanel');
    if (!root || $('bharateeClientPortalAdmin')) return;
    addStyles();
    panel = document.createElement('section'); panel.id = 'bharateeClientPortalAdmin';
    panel.innerHTML = '<div class="cp-admin-head"><div><h3>Client Album Delivery &amp; Support</h3><p>Project login PINs, Google Drive delivery links and customer queries.</p></div><button class="cp-admin-btn alt" id="cpAdminRefresh" type="button">Refresh</button></div>' +
      '<div class="cp-admin-note">Generate an 8-digit PIN and share it privately with the customer on WhatsApp along with the Project ID. Only a one-way PIN hash is stored. Add a Google Drive link and mark the project Delivered when the album is ready. A Drive “Anyone with the link” URL can be forwarded by the recipient.</div>' +
      '<div id="cpAdminNotice" class="cp-admin-notice" hidden></div><h4 style="margin:18px 0 7px;color:#081E4D">Studio Projects</h4><div id="cpAdminProjects" class="cp-admin-list"><p class="cp-admin-meta">Loading projects…</p></div>' +
      '<h4 style="margin:22px 0 7px;color:#081E4D">Customer Queries</h4><div id="cpAdminQueries"><p class="cp-admin-meta">Loading queries…</p></div>';
    const modules = root.querySelector('.modules');
    if (modules) modules.insertAdjacentElement('afterend', panel); else root.append(panel);
    $('cpAdminRefresh').addEventListener('click', refreshAll);
    panel.addEventListener('click', handleAction);
  }
  function renderProjects(rows) {
    const host = $('cpAdminProjects');
    if (!rows || !rows.length) { host.innerHTML = '<p class="cp-admin-meta">No studio projects found yet. Add a studio booking first.</p>'; return; }
    host.innerHTML = rows.map(r => {
      const active = !!r.portal_active;
      return '<article class="cp-admin-card" data-booking="' + esc(r.booking_id) + '">' +
        '<div class="cp-admin-head"><div><h4>' + esc(r.project_id) + ' · ' + esc(r.customer_name) + '</h4><div class="cp-admin-meta">' +
        esc(r.event_type) + ' · ' + esc(r.phone || 'No mobile number') + '<br>Event: ' + esc(r.starts_at ? new Date(r.starts_at).toLocaleDateString('en-IN') : '—') +
        ' · Booking: ' + esc(r.booking_status) + ' · Open queries: ' + Number(r.query_count || 0) + '</div></div><span class="cp-admin-badge ' +
        (active ? '' : 'off') + '">' + (active ? 'Portal Active' : 'Portal Inactive') + ' · ' + (r.pin_set ? 'PIN set' : 'PIN not set') + '</span></div>' +
        '<div class="cp-admin-row"><input type="url" data-drive-link placeholder="https://drive.google.com/drive/folders/…" value="' + esc(r.delivery_link || '') + '">' +
        '<button type="button" class="cp-admin-btn" data-action="save-link">Save Drive Link</button></div>' +
        '<label class="cp-admin-delivered"><input type="checkbox" data-mark-delivered> Mark booking Delivered (makes the link visible to the customer)</label>' +
        '<div class="cp-admin-row"><button type="button" class="cp-admin-btn" data-action="generate-pin">' +
        (r.pin_set ? 'Generate / Reset PIN' : 'Generate Customer PIN') + '</button><button type="button" class="cp-admin-btn warn" data-action="revoke" ' +
        (active ? '' : 'disabled') + '>Revoke Access</button></div></article>';
    }).join('');
  }
  function renderQueries(rows) {
    const host = $('cpAdminQueries');
    if (!rows || !rows.length) { host.innerHTML = '<p class="cp-admin-meta">No customer queries yet.</p>'; return; }
    host.innerHTML = rows.map(r =>
      '<article class="cp-admin-query" data-query="' + esc(r.query_id) + '"><div class="cp-admin-meta"><b>' + esc(r.project_id) + ' · ' +
      esc(r.customer_name) + '</b> · ' + esc(r.phone) + ' · ' + esc(r.status) + ' · ' + esc(new Date(r.created_at).toLocaleString('en-IN')) +
      '</div><p>' + esc(r.message) + '</p>' + (r.response ? '<div class="cp-admin-note"><b>Previous reply</b><br>' + esc(r.response) + '</div>' : '') +
      '<textarea data-reply placeholder="Write a reply to the customer…"></textarea><div class="cp-admin-row"><select data-query-status>' +
      '<option value="replied">Replied</option><option value="in_progress">In Progress</option><option value="closed">Closed</option></select>' +
      '<button type="button" class="cp-admin-btn" data-action="reply">Send Reply</button></div></article>'
    ).join('');
  }
  async function refreshAll() {
    const c = ctx();
    if (!c || !isGraphix(c)) return;
    if (!canManage(c)) { notice('Only Owner, Admin or Manager can manage client portal access.',true); return; }
    notice('Refreshing projects and queries…');
    const id = c.business.business_id;
    const [p,q] = await Promise.all([
      c.db.rpc('admin_list_client_portal_projects',{p_business_id:id}),
      c.db.rpc('admin_list_client_portal_queries',{p_business_id:id})
    ]);
    if (p.error) { notice(p.error.message,true); return; }
    if (q.error) { notice(q.error.message,true); return; }
    renderProjects(p.data || []); renderQueries(q.data || []);
    notice('Projects and customer queries refreshed.');
  }
  async function handleAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const c = ctx();
    if (!c || !isGraphix(c) || !canManage(c)) { notice('You do not have permission to manage this portal.',true); return; }
    const action = button.dataset.action, card = button.closest('[data-booking]'), queryCard = button.closest('[data-query]');
    button.disabled = true;
    try {
      if (action === 'generate-pin') {
        const random = new Uint32Array(1); crypto.getRandomValues(random);
        const pin = String(random[0] % 100000000).padStart(8,'0');
        const {data,error} = await c.db.rpc('admin_set_client_portal_pin',{p_booking_id:card.dataset.booking,p_pin:pin});
        if (error) throw error;
        await refreshAll();
        notice('ONE-TIME PIN for ' + data.project_id + ': ' + pin + '. Share this PIN and the Project ID privately with the customer on WhatsApp now. It will not be shown again.');
      } else if (action === 'save-link') {
        const url = card.querySelector('[data-drive-link]').value.trim();
        const delivered = card.querySelector('[data-mark-delivered]').checked;
        const {error} = await c.db.rpc('admin_update_client_portal_delivery',{p_booking_id:card.dataset.booking,p_drive_link:url || null,p_mark_delivered:delivered});
        if (error) throw error;
        await refreshAll(); notice('Drive link saved. Customer can see it only after the booking is Delivered or Completed.');
      } else if (action === 'revoke') {
        const {error} = await c.db.rpc('admin_toggle_client_portal',{p_booking_id:card.dataset.booking,p_active:false});
        if (error) throw error;
        await refreshAll(); notice('Portal access revoked and active sessions invalidated.');
      } else if (action === 'reply') {
        const {error} = await c.db.rpc('admin_reply_client_portal_query',{
          p_query_id:queryCard.dataset.query,p_response:queryCard.querySelector('[data-reply]').value.trim(),
          p_status:queryCard.querySelector('[data-query-status]').value
        });
        if (error) throw error;
        await refreshAll(); notice('Reply saved for the customer.');
      }
    } catch (error) {
      console.error('Client portal action failed:',error); notice(error.message || 'Could not complete the action.',true);
    } finally { button.disabled = false; }
  }
  function updateVisibility() {
    build(); if (!panel) return;
    const c = ctx(), visible = isGraphix(c);
    panel.hidden = !visible;
    if (!visible) return;
    if (!canManage(c)) { notice('Client portal administration is available to Owner, Admin and Manager.',true); return; }
    if (loadedBusinessId !== c.business.business_id) {
      loadedBusinessId = c.business.business_id;
      refreshAll().catch(e => notice(e.message,true));
    }
  }
  function install() {
    const root = $('selectedPanel'), name = $('selectedName');
    if (!root || !name) return;
    if (!observerReady) {
      observerReady = true;
      const observer = new MutationObserver(updateVisibility);
      observer.observe(root,{attributes:true,attributeFilter:['class']});
      observer.observe(name,{childList:true,characterData:true,subtree:true});
    }
    updateVisibility();
  }
  document.addEventListener('DOMContentLoaded',install);
  window.addEventListener('load',install);
  setTimeout(install,250);
})();
