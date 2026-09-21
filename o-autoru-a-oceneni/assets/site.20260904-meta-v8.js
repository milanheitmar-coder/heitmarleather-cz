
(function(){
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.mobile-toggle');
  if (toggle && header) {
    toggle.addEventListener('click', function(){
      header.classList.toggle('open');
      const expanded = header.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  const toTop = document.getElementById('to-top');
  const ensureBackButton = function(){
    let backBtn = document.getElementById('go-back');
    if (backBtn) return backBtn;
    backBtn = document.createElement('button');
    backBtn.id = 'go-back';
    backBtn.className = 'go-back';
    backBtn.type = 'button';
    backBtn.setAttribute('aria-label', 'Zpět');
    backBtn.setAttribute('title', 'Zpět');
    backBtn.innerHTML = '<span class="go-back__icon" aria-hidden="true">←</span><span class="visually-hidden">Zpět</span>';
    document.body.appendChild(backBtn);
    return backBtn;
  };
  if (toTop) {
    const backBtn = ensureBackButton();
    const fallbackHref = '/';
    const hasInternalReferrer = function(){
      if (!document.referrer) return false;
      try {
        const ref = new URL(document.referrer, window.location.origin);
        return ref.origin === window.location.origin && ref.pathname !== window.location.pathname;
      } catch (err) {
        return false;
      }
    };
    const updateFloatingButtonsState = function(){
      const visible = window.scrollY > 220;
      [toTop, backBtn].forEach(function(btn){
        if (!btn) return;
        btn.classList.toggle('is-visible', visible);
        // Do not use aria-hidden on focusable buttons. Keep hidden buttons out of tab order instead.
        btn.removeAttribute('aria-hidden');
        btn.tabIndex = visible ? 0 : -1;
      });
    };

    toTop.setAttribute('aria-label', 'Nahoru');
    toTop.setAttribute('title', 'Nahoru');

    updateFloatingButtonsState();
    window.addEventListener('scroll', updateFloatingButtonsState, {passive:true});
    toTop.addEventListener('click', function(){
      window.scrollTo({top: 0, behavior:'smooth'});
    });
    backBtn.addEventListener('click', function(){
      if (hasInternalReferrer() || window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = fallbackHref;
      }
    });
  }

  const page = document.body.dataset.page || '';
  document.querySelectorAll('[data-page-link]').forEach(function(link){
    if (link.dataset.pageLink === page) link.setAttribute('aria-current','page');
  });
})();

window.HL_GA4_ID = 'G-H13KGWHSCM';
window.HL_META_PIXEL_ID = '2737383736617007';
window.HL_COOKIE_KEY = 'heitmar_cookie_choice_v1';
window.HL_PENDING_LEAD_KEY = 'heitmar_pending_lead_v1';
window.HL_GTAG_LOADED = false;
window.HL_META_LOADED = false;

function hlHasConsent() {
  return localStorage.getItem(window.HL_COOKIE_KEY) === 'accepted';
}

function hlLoadGoogleTag() {
  if (window.HL_GTAG_LOADED || !hlHasConsent()) return;
  window.HL_GTAG_LOADED = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + window.HL_GA4_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', window.HL_GA4_ID);
}

function hlTrack(name, params) {
  if (hlHasConsent() && typeof window.gtag === 'function') {
    window.gtag('event', name, params || {});
  }
}

function hlLoadMetaPixel() {
  if (window.HL_META_LOADED || !hlHasConsent()) return;
  window.HL_META_LOADED = true;
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', window.HL_META_PIXEL_ID);
  fbq('track', 'PageView');
  hlTrackMetaPageSpecificEvents();
}

function hlTrackMetaPageSpecificEvents() {
  if (!hlHasConsent() || typeof window.fbq !== 'function') return;
  const path = window.location.pathname;

  // Product detail view for the DIY landing page.
  if (path === '/diy-box-kozena-kabelka/' || path === '/diy-box-kozena-kabelka/index.html') {
    try {
      if (sessionStorage.getItem('heitmar_diy_viewcontent_sent_v1') !== '1') {
        window.fbq('track', 'ViewContent', {
          content_name: 'DIY sada kožené crossbody kabelky bez šití',
          content_category: 'DIY leather bag kit',
          content_ids: ['diy-crossbody-cz'],
          content_type: 'product',
          value: 2490,
          currency: 'CZK'
        });
        sessionStorage.setItem('heitmar_diy_viewcontent_sent_v1', '1');
      }
    } catch (err) {
      window.fbq('track', 'ViewContent', {
        content_name: 'DIY sada kožené crossbody kabelky bez šití',
        content_type: 'product',
        value: 2490,
        currency: 'CZK'
      });
    }
  }

  // Lead is recorded only after a real form submission via hlTrackConfirmedLeadOnce().

}

function hlMetaTrack(name, params) {
  if (hlHasConsent() && typeof window.fbq === 'function') {
    window.fbq('track', name, params || {});
  }
}

window.hlPrepareConfirmedLead = function(details) {
  try {
    sessionStorage.setItem(window.HL_PENDING_LEAD_KEY, JSON.stringify(Object.assign({
      method: 'netlify_form'
    }, details || {})));
  } catch (err) {}
};

window.hlTrackContactHandoff = function(details) {
  const payload = Object.assign({
    method: 'contact_form_handoff',
    page_location: window.location.href
  }, details || {});
  hlTrack('contact_form_handoff', payload);
  hlMetaTrack('Contact', payload);
};

function hlTrackConfirmedLeadOnce() {
  const normalizedPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  if (normalizedPath !== '/odeslano' && normalizedPath !== '/odeslano-diy') return;
  if (!hlHasConsent()) return;
  let raw = '';
  try { raw = sessionStorage.getItem(window.HL_PENDING_LEAD_KEY) || ''; } catch (err) {}
  if (!raw) return;
  let details = {};
  try { details = JSON.parse(raw) || {}; } catch (err) {}
  try { sessionStorage.removeItem(window.HL_PENDING_LEAD_KEY); } catch (err) {}
  const payload = Object.assign({
    method: 'confirmed_form_submission',
    page_location: window.location.href
  }, details);
  hlTrack('generate_lead', payload);
  hlMetaTrack('Lead', Object.assign({
    content_name: details.lead_type === 'diy_box_order' ? 'Objednávka DIY sady kožené kabelky' : 'Poptávka Heitmar Leather',
    value: details.lead_type === 'diy_box_order' ? 2490 : undefined,
    currency: details.lead_type === 'diy_box_order' ? 'CZK' : undefined
  }, payload));
};

function buildLeadMessage(form) {
  const get = (name) => (form.querySelector('[name="' + name + '"]') || {}).value || '';
  const lines = [
    'Dobrý den, mám zájem o Heitmar Leather.',
    '',
    'Chci poptat: ' + get('inquiry_type'),
    'Co chci vyrobit / domluvit: ' + get('product'),
    'Typ zakázky / úroveň: ' + get('style'),
    'Účel / rozměr / model: ' + get('purpose'),
    'Motiv nebo styl: ' + get('motif'),
    'Barva kůže: ' + get('color'),
    'Požadovaný termín: ' + get('deadline'),
    'U kurzu: ' + get('course_duration'),
    'Počet osob: ' + get('people_count'),
    'Dárkový poukaz: ' + get('gift_voucher'),
    'Zkušenosti s kůží: ' + get('experience'),
    '',
    'Jméno: ' + get('name'),
    'E-mail: ' + get('email'),
    'Telefon: ' + get('phone'),
    '',
    'Doplňující poznámka:',
    get('message'),
    '',
    'Pokud chci poslat fotografii, přiložím ji následně do zprávy.'
  ];
  return lines.join('\n');
}

function hlInitMobileFloatingCta(){
  if (document.querySelector('.mobile-floating-cta')) return;
  const sourceBtn = document.querySelector('.header-actions .btn');
  if (!sourceBtn) return;
  const cta = document.createElement('a');
  cta.className = 'mobile-floating-cta';
  cta.href = sourceBtn.getAttribute('href') || '/kontakt/';
  cta.textContent = sourceBtn.textContent.trim() || 'Poptat zakázku';
  cta.setAttribute('data-cta', 'mobile_floating_inquiry');
  document.body.appendChild(cta);
}

function bindLeadForms(){
  document.querySelectorAll('form[data-contact-form]').forEach(function(form){
    const alert = form.parentElement.querySelector('.alert');
    const emailBtn = form.querySelector('[data-submit-email]');
    const waBtn = form.querySelector('[data-submit-whatsapp]');
    function validate(){
      const email = (form.querySelector('[name="email"]') || {}).value || '';
      const product = (form.querySelector('[name="product"]') || {}).value || '';
      return email.trim() && product.trim();
    }
    function show(msg){
      if (!alert) return;
      alert.textContent = msg;
      alert.classList.add('show');
    }
    if (emailBtn) {
      emailBtn.addEventListener('click', function(e){
        e.preventDefault();
        if (!validate()) {
          show(form.dataset.msgRequired || 'Vyplňte prosím alespoň e-mail a co chcete vyrobit.');
          return;
        }
        const subject = encodeURIComponent(form.dataset.subject || 'Poptávka zakázky – Heitmar Leather');
        const body = encodeURIComponent(buildLeadMessage(form));
        window.hlTrackContactHandoff({source:'mailto_form', form_id: form.id || ''});
        show(form.dataset.msgEmail || 'Otevírám e-mail s předvyplněnou poptávkou.');
        window.location.href = 'mailto:' + (form.dataset.email || 'milan.heitmar@seznam.cz') + '?subject=' + subject + '&body=' + body;
      });
    }
    if (waBtn) {
      waBtn.addEventListener('click', function(e){
        e.preventDefault();
        if (!validate()) {
          show(form.dataset.msgRequired || 'Vyplňte prosím alespoň e-mail a co chcete vyrobit.');
          return;
        }
        const body = encodeURIComponent(buildLeadMessage(form));
        window.hlTrackContactHandoff({source:'whatsapp_form', form_id: form.id || ''});
        show(form.dataset.msgWhatsapp || 'Otevírám WhatsApp s předvyplněnou poptávkou.');
        window.open('https://wa.me/420730947119?text=' + body, '_blank', 'noopener');
      });
    }
    form.addEventListener('submit', function(){
      const leadType = form.getAttribute('name') === 'objednavka-diy-sada' ? 'diy_box_order' : 'commission_enquiry';
      window.hlPrepareConfirmedLead({source:'netlify_form', form_id: form.id || '', lead_type: leadType});
    });
  });
}

document.addEventListener('click', function (e) {
  const a = e.target.closest('a');
  if (!a || !hlHasConsent()) return;

  const href = a.href || '';
  if (href.startsWith('tel:')) {
    hlTrack('click_phone', {contact_type: 'phone', page_location: window.location.href});
    hlMetaTrack('Contact', {content_name: 'phone_click', page_location: window.location.href});
  }
  if (href.startsWith('mailto:')) {
    hlTrack('click_email', {contact_type: 'email', page_location: window.location.href});
    hlMetaTrack('Contact', {content_name: 'email_click', page_location: window.location.href});
  }
  if (href.includes('wa.me') || href.includes('whatsapp')) {
    hlTrack('click_whatsapp', {contact_type: 'whatsapp', page_location: window.location.href});
    hlMetaTrack('Contact', {content_name: 'whatsapp_click', page_location: window.location.href});
  }
  if (href.includes('m.me') || href.includes('messenger')) {
    hlTrack('click_messenger', {contact_type: 'messenger', page_location: window.location.href});
    hlMetaTrack('Contact', {content_name: 'messenger_click', page_location: window.location.href});
  }
  if (href.includes('etsy.com')) {
    hlTrack('click_etsy', {contact_type: 'etsy', page_location: window.location.href});
    hlMetaTrack('ViewContent', {content_name: 'etsy_click', page_location: window.location.href});
  }
  if (a.classList.contains('btn') || a.classList.contains('btn-secondary') || a.classList.contains('cta-link')) {
    const ctaName = a.dataset.cta || 'cta';
    hlTrack('cta_click', {cta_name: ctaName, page_location: window.location.href});
  }
});

document.addEventListener('DOMContentLoaded', function(){
  const banner = document.getElementById('cookie-banner');
  const accept = document.getElementById('cookie-accept');
  const reject = document.getElementById('cookie-reject');
  const settingsLinks = document.querySelectorAll('.cookie-settings-link');
  const state = localStorage.getItem(window.HL_COOKIE_KEY);

  function hideBanner(){ if (banner) banner.classList.remove('open'); }
  function showBanner(){ if (banner) banner.classList.add('open'); }
  function setChoice(value){
    localStorage.setItem(window.HL_COOKIE_KEY, value);
    if (value === 'accepted') {
      hlLoadGoogleTag();
      hlLoadMetaPixel();
      hlTrackMetaPageSpecificEvents();
      hlTrackConfirmedLeadOnce();
    }
    hideBanner();
  }

  if (state === 'accepted') {
    hlLoadGoogleTag();
    hlLoadMetaPixel();
    hlTrackMetaPageSpecificEvents();
  } else if (state !== 'rejected') {
    showBanner();
  }

  if (accept) accept.addEventListener('click', function(){ setChoice('accepted'); });
  if (reject) reject.addEventListener('click', function(){ setChoice('rejected'); });
  settingsLinks.forEach(function(link){
    link.addEventListener('click', function(e){
      e.preventDefault();
      showBanner();
      const legal = link.dataset.legal || 'pravni-minimum.html';
      window.location.href = legal;
    });
  });

  bindLeadForms();
  hlTrackConfirmedLeadOnce();
  hlInitMobileFloatingCta();
  hlInitLightbox();
  hlInitInlineVideos();
});


function hlInitInlineVideos(){
  document.querySelectorAll('.video-frame').forEach(function(frame){
    const video = frame.querySelector('video');
    const btn = frame.querySelector('.video-play');
    if (!video || !btn) return;
    video.controls = false;
    btn.addEventListener('click', function(){
      try { video.controls = true; } catch(e) {}
      btn.classList.add('is-hidden');
      video.play();
    });
    video.addEventListener('play', function(){ btn.classList.add('is-hidden'); });
    video.addEventListener('pause', function(){ if (video.currentTime < 0.2 || video.ended) btn.classList.remove('is-hidden'); });
    video.addEventListener('ended', function(){ btn.classList.remove('is-hidden'); video.controls = false; });
  });
}

function hlInitLightbox(){
  const imageHref = /\.(?:avif|gif|jpe?g|png|webp)(?:\?.*)?$/i;
  const linkedImages = Array.from(document.querySelectorAll('main a[href]')).filter(function(link){
    const href = link.getAttribute('href') || '';
    if (!imageHref.test(href)) return false;
    const img = link.querySelector('img');
    return !!img && !img.closest('.brand-logo') && !img.closest('.footer-brand');
  });
  const groupedOnly = Array.from(document.querySelectorAll('main a[data-lightbox-group][href]')).filter(function(link){
    const href = link.getAttribute('href') || '';
    return imageHref.test(href) && !linkedImages.includes(link);
  });
  const standaloneImages = Array.from(document.querySelectorAll('main .hero-card img, main .page-hero-card img, main .card > img, main .gallery-card > img, main .process-step > img')).filter(function(img){
    return img.src && !img.closest('a') && !img.closest('.brand-logo') && !img.closest('.footer-brand');
  });
  if (!linkedImages.length && !standaloneImages.length && !groupedOnly.length) return;

  linkedImages.forEach(function(link){
    const img = link.querySelector('img');
    if (!img) return;
    img.classList.add('lightbox-trigger');
    img.setAttribute('tabindex','0');
    img.setAttribute('role','button');
    img.setAttribute('aria-label', (img.getAttribute('alt') || 'Zvětšit fotografii'));
  });
  standaloneImages.forEach(function(img){
    img.classList.add('lightbox-trigger');
    img.setAttribute('tabindex','0');
    img.setAttribute('role','button');
    img.setAttribute('aria-label', (img.getAttribute('alt') || 'Zvětšit fotografii'));
  });

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('inert','');
  overlay.innerHTML = '<div class="lightbox-inner"><button class="lightbox-back" aria-label="Zpět">← Zpět</button><button class="lightbox-close" aria-label="Zavřít">×</button><button class="lightbox-prev" aria-label="Předchozí fotografie">‹</button><img class="lightbox-image" alt="" src=""/><div class="lightbox-caption"></div><button class="lightbox-next" aria-label="Další fotografie">›</button></div>';
  document.body.appendChild(overlay);
  const overlayImg = overlay.querySelector('.lightbox-image');
  const overlayCaption = overlay.querySelector('.lightbox-caption');
  const closeBtn = overlay.querySelector('.lightbox-close');
  const backBtn = overlay.querySelector('.lightbox-back');
  const prevBtn = overlay.querySelector('.lightbox-prev');
  const nextBtn = overlay.querySelector('.lightbox-next');
  let currentGroup = [];
  let currentIndex = 0;

  function normaliseSrc(link){
    return link.href || link.getAttribute('href') || '';
  }
  function imageAlt(link){
    const img = link.querySelector('img');
    return (img && img.alt) || link.dataset.alt || '';
  }
  function buildGroup(link){
    const groupName = link.dataset.lightboxGroup;
    if (!groupName) return [{src: normaliseSrc(link), alt: imageAlt(link), caption: link.dataset.caption || link.dataset.alt || imageAlt(link)}];
    return Array.from(document.querySelectorAll('main a[data-lightbox-group="' + CSS.escape(groupName) + '"][href]')).map(function(item){
      return {src: normaliseSrc(item), alt: imageAlt(item), caption: item.dataset.caption || item.dataset.alt || imageAlt(item)};
    });
  }
  function render(){
    const item = currentGroup[currentIndex];
    if (!item) return;
    overlayImg.src = item.src;
    overlayImg.alt = item.alt || '';
    if (overlayCaption) overlayCaption.textContent = item.caption || item.alt || '';
    overlay.classList.toggle('has-group', currentGroup.length > 1);
  }
  function openGroup(group, index){
    currentGroup = group || [];
    currentIndex = Math.max(0, Math.min(index || 0, currentGroup.length - 1));
    render();
    overlay.classList.add('open');
    overlay.removeAttribute('inert');
    document.body.style.overflow = 'hidden';
  }
  function open(src, alt){
    openGroup([{src:src, alt:alt || '', caption: alt || ''}], 0);
  }
  function close(){
    overlay.classList.remove('open');
    overlay.classList.remove('has-group');
    overlay.setAttribute('inert','');
    overlayImg.removeAttribute('src');
    document.body.style.overflow = '';
    currentGroup = [];
    currentIndex = 0;
  }
  function next(delta){
    if (currentGroup.length <= 1) return;
    currentIndex = (currentIndex + delta + currentGroup.length) % currentGroup.length;
    render();
  }
  linkedImages.forEach(function(link){
    const img = link.querySelector('img');
    if (!img) return;
    const handler = function(e){
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const group = buildGroup(link);
      const index = Math.max(0, group.findIndex(function(item){ return item.src === normaliseSrc(link); }));
      openGroup(group, index);
    };
    link.addEventListener('click', handler);
    img.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(e); }
    });
  });
  standaloneImages.forEach(function(img){
    const handler = function(){ open(img.currentSrc || img.src, img.alt || ''); };
    img.addEventListener('click', handler);
    img.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });
  closeBtn.addEventListener('click', close);
  backBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', function(e){ e.stopPropagation(); next(-1); });
  nextBtn.addEventListener('click', function(e){ e.stopPropagation(); next(1); });
  overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
  document.addEventListener('keydown', function(e){
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') next(-1);
    if (e.key === 'ArrowRight') next(1);
  });
}
