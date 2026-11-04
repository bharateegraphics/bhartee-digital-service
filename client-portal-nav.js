/* Adds a customer login entry to the existing homepage navigation without changing its branding. */
document.addEventListener('DOMContentLoaded',()=>{
  const nav=document.querySelector('.nav-inner');if(!nav||nav.querySelector('[data-client-portal-link]'))return;
  const list=nav.querySelector('nav ul');
  if(list){const li=document.createElement('li');li.innerHTML='<a href="./client.html" data-client-portal-link>Client Login</a>';list.append(li);}
  const cta=nav.querySelector('.nav-cta');
  if(cta){const directions=document.createElement('li');directions.innerHTML='<a href="#visit">Get Directions</a>';if(list)list.append(directions);cta.href='./client.html';cta.textContent='Client Login';cta.setAttribute('data-client-portal-link','');}
});
