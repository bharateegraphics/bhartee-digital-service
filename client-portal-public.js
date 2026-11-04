/* BHARATEE GRAPHIX Client Portal. Public key only; all project data is returned by scoped PIN/session RPCs. */
(() => {
  'use strict';
  const SUPABASE_URL = 'https://twdrvlmlpglkbrntttsk.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_sCEq5gZ6qqu3K982Gqo8ug_3tJqYUKE';
  const TOKEN_KEY = 'bharatee_client_portal_session_v1';
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const moneyDate = value => value ? new Date(value).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
  const db = window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  let token = sessionStorage.getItem(TOKEN_KEY) || '';
  let project = null;
  function message(text,error=false){['portalMessage','projectNotice'].forEach(id=>{const n=$(id);if(n){n.textContent=text||'';n.hidden=!text;n.className='notice'+(error?' error':'');}});}
  function showLogin(){ $('loginPanel').hidden=false; $('projectPanel').hidden=true; }
  function showProject(){ $('loginPanel').hidden=true; $('projectPanel').hidden=false; }
  function validDrive(url){try{const u=new URL(url);return u.protocol==='https:'&&['drive.google.com','docs.google.com'].includes(u.hostname.toLowerCase());}catch(_){return false;}}
  async function call(name,args){const {data,error}=await db.rpc(name,args);if(error)throw error;return data;}
  async function loadProject(){
    const data=await call('client_portal_get_project',{p_access_token:token});
    project=data;
    $('projectCustomer').textContent=data.customer_name||'Customer';
    $('projectId').textContent=data.project_id||'—';
    $('projectType').textContent=String(data.event_type||'Studio Project').replaceAll('_',' ');
    $('projectDate').textContent=moneyDate(data.project_date);
    $('projectStatus').textContent=String(data.booking_status||'in progress').replaceAll('_',' ');
    const delivery=$('deliveryArea');
    if(data.delivery_ready && data.delivery_link && validDrive(data.delivery_link)){
      delivery.innerHTML=`<p>Your full-resolution album / video is ready.</p><a class="download" href="${esc(data.delivery_link)}" target="_blank" rel="noopener noreferrer">Download Your Album / Video ↗</a><p class="muted">Google Drive will open in a new tab. Follow Google Drive’s Download option to save the original files.</p>`;
    }else{
      delivery.innerHTML='<p class="pending">Your final download link is not available yet. The studio will add it here when delivery is ready.</p>';
    }
    showProject();
    await loadQueries();
  }
  async function loadQueries(){
    const rows=await call('client_portal_list_queries',{p_access_token:token});
    const host=$('queryList');
    if(!rows||!rows.length){host.innerHTML='<p class="muted">No support queries yet.</p>';return;}
    host.innerHTML=rows.map(q=>`<article class="query"><div class="querytop"><b>${esc(q.status)}</b><small>${esc(new Date(q.created_at).toLocaleString('en-IN'))}</small></div><p>${esc(q.message)}</p>${q.response?`<div class="reply"><b>BHARATEE GRAPHIX reply</b><p>${esc(q.response)}</p></div>`:'<small class="muted">Awaiting studio response.</small>'}</article>`).join('');
  }
  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();const button=$('loginButton');button.disabled=true;message('Verifying your project details…');
    try{
      const data=await call('client_portal_login',{
        p_phone:$('phone').value.trim(),p_project_id:$('projectCode').value.trim().toUpperCase(),p_pin:$('pin').value.trim()
      });
      if(!data||!data.ok)throw new Error(data?.message||'Details could not be verified.');
      token=data.access_token;sessionStorage.setItem(TOKEN_KEY,token);$('pin').value='';await loadProject();message('');
    }catch(err){message(err.message||'Unable to sign in. Check your details and try again.',true);}
    finally{button.disabled=false;}
  });
  $('queryForm').addEventListener('submit',async e=>{
    e.preventDefault();const button=$('querySubmit');button.disabled=true;
    try{await call('client_portal_submit_query',{p_access_token:token,p_message:$('queryText').value.trim()});$('queryText').value='';message('Your query has been sent to BHARATEE GRAPHIX.');await loadQueries();}
    catch(err){message(err.message||'Could not send your query.',true);}
    finally{button.disabled=false;}
  });
  $('refreshQueries').addEventListener('click',async()=>{try{await loadProject();message('Project information refreshed.');}catch(err){message(err.message,true);logout(false);}});
  async function logout(callServer=true){if(callServer&&token){try{await call('client_portal_logout',{p_access_token:token});}catch(_){}}
    token='';project=null;sessionStorage.removeItem(TOKEN_KEY);showLogin();message('You have signed out.');}
  $('logoutButton').addEventListener('click',()=>logout(true));
  if(token){loadProject().catch(err=>{console.warn(err);logout(false);message('Your session expired. Please sign in again.');});}else{showLogin();}
})();
