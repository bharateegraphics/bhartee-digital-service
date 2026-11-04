/* BHARATEE public website CMS renderer.
   Reads only published/public data through Supabase's browser publishable key.
   The existing static HTML remains the fallback if Supabase cannot be reached. */
(() => {
  'use strict';
  const SUPABASE_URL = 'https://twdrvlmlpglkbrntttsk.supabase.co';
  // Publishable key only. Never replace this with sb_secret or service_role.
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_sCEq5gZ6qqu3K982Gqo8ug_3tJqYUKE';
  const LANG_KEY = 'bharatee_site_locale';
  let client = null;
  let businessId = null;
  let currentLocale = 'en';

  const tr = {
    en: { govt:'Open Portal ↗', service:'Service', price:'Price', language:'Language' },
    hi: { govt:'पोर्टल खोलें ↗', service:'सेवा', price:'कीमत', language:'भाषा' },
    or: { govt:'ପୋର୍ଟାଲ୍ ଖୋଲନ୍ତୁ ↗', service:'ସେବା', price:'ମୂଲ୍ୟ', language:'ଭାଷା' }
  };
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const localeValue = (obj) => obj && (obj[currentLocale] || obj.en || obj.hi || obj.or) || '';

  function setText(element, value) {
    if (!element || value == null || value === '') return;
    element.textContent = value;
  }
  function setMultiline(element, value) {
    if (!element || value == null || value === '') return;
    element.replaceChildren();
    String(value).split(/\r?\n/).forEach((line,index)=>{
      if(index)element.append(document.createElement('br'));
      element.append(document.createTextNode(line));
    });
  }
  function ensureLanguageSelector() {
    const nav = document.querySelector('.nav-inner');
    if (!nav || document.getElementById('bharateeSiteLanguage')) return;
    const select = document.createElement('select');
    select.id = 'bharateeSiteLanguage';
    select.setAttribute('aria-label', 'Website language');
    select.innerHTML = '<option value="en">English</option><option value="hi">हिन्दी</option><option value="or">ଓଡ଼ିଆ</option>';
    select.value = currentLocale;
    select.style.cssText = 'height:36px;max-width:105px;margin:0 10px;padding:6px 8px;border:1px solid rgba(13,44,107,.2);border-radius:7px;background:#fff;color:#0D2C6B;font:600 11px "IBM Plex Sans",sans-serif;';
    const cta = nav.querySelector('.nav-cta');
    if (cta) nav.insertBefore(select,cta); else nav.append(select);
    select.addEventListener('change',()=>{
      currentLocale = ['en','hi','or'].includes(select.value) ? select.value : 'en';
      localStorage.setItem(LANG_KEY,currentLocale);
      renderPublicData();
    });
  }

  async function loadClient() {
    if (window.supabase && window.supabase.createClient) return window.supabase;
    await new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload=resolve; script.onerror=reject; document.head.append(script);
    });
    return window.supabase;
  }

  async function init() {
    try { const stored=localStorage.getItem(LANG_KEY); currentLocale=['en','hi','or'].includes(stored)?stored:'en'; } catch (_) { currentLocale='en'; }
    ensureLanguageSelector();
    try {
      const sdk = await loadClient();
      client = sdk.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      const {data,error}=await client.from('business_units').select('id,code').eq('code','digital-service').eq('is_active',true).single();
      if(error)throw error;
      businessId=data.id;
      await renderPublicData();
    } catch(error) {
      console.warn('BHARATEE public CMS not available; showing the saved static website content.',error);
      // Existing static page is intentionally retained as a fallback.
    }
  }

  async function getContent(section) {
    const {data,error}=await client.from('site_content').select('content')
      .eq('business_id',businessId).eq('page_key','home').eq('section_key',section)
      .eq('locale',currentLocale).eq('is_published',true).maybeSingle();
    if(error)throw error;
    if(data&&data.content)return data.content;
    if(currentLocale!=='en'){
      const fallback=await client.from('site_content').select('content').eq('business_id',businessId)
        .eq('page_key','home').eq('section_key',section).eq('locale','en').eq('is_published',true).maybeSingle();
      if(fallback.error)throw fallback.error;
      return fallback.data&&fallback.data.content||null;
    }
    return null;
  }

  async function renderPublicData() {
    ensureLanguageSelector();
    const select=document.getElementById('bharateeSiteLanguage');if(select)select.value=currentLocale;
    const [hero,govt,services,gallery,rates,visit]=await Promise.all([
      getContent('hero'),getContent('govt'),getContent('services'),getContent('gallery'),getContent('rates'),getContent('visit')
    ]);
    applyPageContent('hero',hero);
    applyPageContent('govt',govt);
    applyPageContent('services',services);
    applyPageContent('gallery',gallery);
    applyPageContent('rates',rates);
    applyPageContent('visit',visit);

    const [govtResult,serviceResult,settingResult] = await Promise.all([
      client.from('government_services').select('id,category_key,name_i18n,description_i18n,official_url,sort_order').eq('business_id',businessId).eq('is_active',true).eq('is_published',true).order('sort_order'),
      client.from('service_catalog').select('id,service_code,name_i18n,description_i18n,unit_label_i18n,base_price,sort_order').eq('business_id',businessId).eq('is_active',true).eq('is_public',true).order('sort_order'),
      client.from('site_settings').select('setting_key,setting_value').eq('business_id',businessId).eq('is_public',true).in('setting_key',['contact_details','brand_assets'])
    ]);
    if(govtResult.error)console.warn('Government directory CMS read failed:',govtResult.error);
    else if(govtResult.data&&govtResult.data.length)renderGovernmentTiles(govtResult.data);
    if(serviceResult.error)console.warn('Public rate card CMS read failed:',serviceResult.error);
    else if(serviceResult.data&&serviceResult.data.length)renderRateRows(serviceResult.data);
    if(settingResult.error)console.warn('Public site settings CMS read failed:',settingResult.error);
    else {
      const settings=Object.fromEntries((settingResult.data||[]).map(row=>[row.setting_key,row.setting_value]));
      applyContact(settings.contact_details);
      applyBrand(settings.brand_assets);
    }
    try { const galleryResult=await loadPublishedGallery(); if(galleryResult&&galleryResult.length)appendGallery(galleryResult); }
    catch(galleryError) { console.warn('Public gallery CMS read failed:',galleryError); }
  }

  function applyPageContent(section,data) {
    if(!data)return;
    const map={
      hero:{eyebrow:'.hero .eyebrow',headline:'.hero h1',description:'.hero .lede'},
      govt:{eyebrow:'#govt .govt-head .eyebrow',title:'#govt .govt-head h2',description:'#govt .govt-head p',disclaimer:'#govt .govt-note'},
      services:{eyebrow:'#services .section-head .eyebrow',title:'#services .section-head h2',description:'#services .section-head p'},
      gallery:{eyebrow:'#gallery .section-head .eyebrow',title:'#gallery .section-head h2',description:'#gallery .section-head p'},
      rates:{eyebrow:'#rates .section-head .eyebrow',title:'#rates .section-head h2',description:'#rates .section-head p',note:'#rates .rate-note'},
      visit:{eyebrow:'#visit .section-head .eyebrow',title:'#visit .section-head h2',description:'#visit .section-head p'}
    }[section];
    if(!map)return;
    Object.entries(map).forEach(([key,selector])=>{
      const element=document.querySelector(selector); if(!element||!data[key])return;
      if(section==='hero'&&key==='headline')setMultiline(element,data[key]);else setText(element,data[key]);
    });
    if(section==='services'){
      const setPanelTitle=(selector,value)=>{const head=document.querySelector(selector);if(!head||!value)return;const dot=head.querySelector('.dot');head.replaceChildren();if(dot)head.append(dot);head.append(document.createTextNode(' '+value));};
      if(data.cyber_title)setPanelTitle('#services .panel-cyber .panel-head',data.cyber_title);
      if(data.studio_title)setPanelTitle('#services .panel-studio .panel-head',data.studio_title);
    }
  }

  function renderGovernmentTiles(rows) {
    const grid=document.querySelector('#govt .govt-grid');if(!grid)return;
    const fragment=document.createDocumentFragment();
    rows.forEach(row=>{
      let parsed;try{parsed=new URL(row.official_url);}catch(_){return;}
      if(parsed.protocol!=='https:')return;
      const tile=document.createElement('a');tile.className='govt-tile';tile.href=parsed.href;tile.target='_blank';tile.rel='noopener noreferrer';
      const icon=document.createElement('span');icon.className='icon';icon.textContent='↗';
      const name=document.createElement('span');name.className='t-name';name.textContent=localeValue(row.name_i18n);
      const description=document.createElement('span');description.className='t-desc';description.textContent=localeValue(row.description_i18n);
      const open=document.createElement('span');open.className='t-open';open.textContent=(tr[currentLocale]||tr.en).govt;
      tile.append(icon,name,description,open);fragment.append(tile);
    });
    grid.replaceChildren(fragment);
  }

  function renderRateRows(rows) {
    const card=document.querySelector('#rates .rate-card');if(!card)return;
    const header=card.querySelector('.rate-row.head');
    const fragment=document.createDocumentFragment();
    rows.forEach(row=>{
        const selectedDescription=(row.description_i18n&&(row.description_i18n[currentLocale]||row.description_i18n.en))||{};
      const unit=localeValue(row.unit_label_i18n)||selectedDescription.detail||'';
      const display=selectedDescription.price_display||`₹ ${Number(row.base_price||0).toLocaleString('en-IN')}`;
      const wrap=document.createElement('div');wrap.className='rate-row';
      const desc=document.createElement('span');desc.className='desc';
      const strong=document.createElement('strong');strong.textContent=localeValue(row.name_i18n);
      const small=document.createElement('span');small.textContent=unit;
      desc.append(strong,small);
      const price=document.createElement('span');price.className='price';price.textContent=display;
      wrap.append(desc,price);fragment.append(wrap);
    });
    card.replaceChildren();if(header)card.append(header);card.append(fragment);
  }

  async function loadPublishedGallery() {
    // The existing static gallery remains in place. Newly published CMS images
    // are appended, so the original design/assets are never discarded.
    const businesses=await client.from('business_units').select('id,code').in('code',['digital-service','graphix']).eq('is_active',true);
    if(businesses.error)throw businesses.error;
    const ids=(businesses.data||[]).map(x=>x.id);
    if(!ids.length)return [];
    const {data,error}=await client.from('gallery_items').select('id,business_id,media_asset_id,title_i18n,caption_i18n,category_key,sort_order,media_assets(storage_bucket,object_path)')
      .in('business_id',ids).eq('is_published',true).order('sort_order');
    if(error)throw error;
    return data||[];
  }

  function appendGallery(rows) {
    const grid=document.querySelector('#gallery .gallery-grid');if(!grid)return;
    grid.querySelectorAll('[data-cms-gallery="true"]').forEach(el=>el.remove());
    rows.forEach(row=>{
      const asset=row.media_assets;if(!asset||!asset.object_path)return;
      const url=client.storage.from(asset.storage_bucket||'public-site-media').getPublicUrl(asset.object_path).data.publicUrl;
      const item=document.createElement('div');item.className='frame';item.dataset.cmsGallery='true';
      const img=document.createElement('img');img.className='frame-photo';img.loading='lazy';img.src=url;img.alt=localeValue(row.title_i18n)||'BHARATEE GRAPHIX portfolio';
      const caption=document.createElement('span');caption.textContent=localeValue(row.title_i18n)||localeValue(row.caption_i18n)||'';
      item.append(img,caption);grid.append(item);
    });
  }

  function applyContact(settings) {
    if(!settings)return;
    const values={address:settings.address,phone:settings.phone,email:settings.email};
    document.querySelectorAll('#visit .contact-list li').forEach(li=>{
      const label=(li.querySelector('.lbl')?.textContent||'').trim().toLowerCase();
      const value=li.querySelector('.val');
      if(!value)return;
      if(label==='address'&&values.address)setText(value,values.address);
      if(label==='phone'&&values.phone)setText(value,values.phone);
      if(label==='email'&&values.email)setText(value,values.email);
    });
    const rows=document.querySelectorAll('#visit .hours-table tbody tr');
    rows.forEach(row=>{
      const label=(row.cells[0]?.textContent||'').toLowerCase();
      if(label.includes('monday')&&settings.hours_weekdays)setText(row.cells[1],settings.hours_weekdays.replace(/^Monday\s*[–-]\s*Saturday:?\s*/i,''));
      if(label.includes('sunday')&&settings.hours_sunday)setText(row.cells[1],settings.hours_sunday.replace(/^Sunday:?\s*/i,''));
      if(label.includes('studio')&&settings.studio_hours)setText(row.cells[1],settings.studio_hours.replace(/^Studio bookings:?\s*/i,''));
    });
  }

  function applyBrand(settings) {
    if(!settings||!settings.logo_url)return;
    document.querySelectorAll('.brand img,.hero-logo-wrap img').forEach(img=>{
      img.src=settings.logo_url;
      img.removeAttribute('srcset');
    });
  }

  document.addEventListener('DOMContentLoaded',init);
})();
