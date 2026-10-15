(function(){
  'use strict';

  const form = document.getElementById('diy-order-form');
  if (!form) return;

  const PRICE = 2490;
  const SHIPPING = 120;
  const color = document.getElementById('diy-color');
  const qty = document.getElementById('diy-count');
  const delivery = document.getElementById('diy-delivery');
  const pickupWrap = document.getElementById('diy-pickup-wrap');
  const pickup = document.getElementById('diy-pickup');
  const summaryProduct = document.getElementById('diy-summary-product');
  const summaryShipping = document.getElementById('diy-summary-shipping');
  const summaryTotal = document.getElementById('diy-summary-total');
  const submit = document.getElementById('diy-submit');
  const alertBox = document.getElementById('diy-form-alert');
  const payment = document.getElementById('diy-payment');

  function money(value){
    return new Intl.NumberFormat('cs-CZ', {style:'currency', currency:'CZK', maximumFractionDigits:0}).format(value);
  }

  function total(){
    const count = Math.max(1, Math.min(3, parseInt(qty.value || '1', 10)));
    return PRICE * count + SHIPPING;
  }

  function updateSummary(){
    const count = Math.max(1, Math.min(3, parseInt(qty.value || '1', 10)));
    summaryProduct.textContent = count === 1 ? money(PRICE) : count + ' × ' + money(PRICE) + ' = ' + money(PRICE * count);
    summaryShipping.textContent = money(SHIPPING);
    summaryTotal.textContent = money(total());
  }

  function updateDelivery(){
    const zasilkovna = delivery.value === 'zasilkovna';
    pickupWrap.classList.toggle('is-visible', zasilkovna);
    pickup.required = zasilkovna;
    if (!zasilkovna) pickup.value = '';
  }

  function showError(message){
    alertBox.textContent = message;
    alertBox.classList.add('show');
  }

  function clearError(){
    alertBox.textContent = '';
    alertBox.classList.remove('show');
  }

  async function storeNetlifySubmission(formData, order){
    try {
      formData.set('order_number', order.orderNumber || '');
      formData.set('variable_symbol', order.variableSymbol || '');
      formData.set('order_total', String(order.amount || ''));
      formData.set('order_status', 'Čeká na platbu');
      const params = new URLSearchParams();
      formData.forEach(function(value, key){ params.append(key, String(value)); });
      await fetch('/', {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: params.toString(),
        keepalive: true
      });
    } catch (err) {
      console.warn('Netlify form backup failed', err);
    }
  }

  function trackOrder(order){
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'diy_order_submitted', {
          currency: 'CZK',
          value: Number(order.amount || 0),
          transaction_id: order.orderNumber || '',
          item_name: 'DIY Box Crossbody'
        });
      }
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', {
          content_name: 'DIY Box Crossbody order submitted',
          content_category: 'DIY Box',
          value: Number(order.amount || 0),
          currency: 'CZK'
        });
      }
    } catch (err) {
      console.warn('Tracking failed', err);
    }
  }

  function renderPayment(order, customerEmail){
    document.getElementById('diy-payment-order').textContent = order.orderNumber || '';
    document.getElementById('diy-payment-vs').textContent = order.variableSymbol || '';
    document.getElementById('diy-payment-amount').textContent = money(Number(order.amount || 0));
    const qr = document.getElementById('diy-payment-qr');
    qr.src = order.qrDataUrl || '';
    const intro = document.getElementById('diy-payment-intro');
    intro.textContent = 'Objednávka ' + (order.orderNumber || '') + ' byla přijata. Naskenujte QR kód v bankovní aplikaci nebo použijte údaje níže.';

    const emailStatus = document.getElementById('diy-payment-email-status');
    if (order.customerEmailSent) {
      emailStatus.className = 'diy-payment-email-status success';
      emailStatus.textContent = 'Platební údaje a QR kód jsme poslali také na ' + customerEmail + '.';
    } else if (order.emailConfigured === false) {
      emailStatus.className = 'diy-payment-email-status warning';
      emailStatus.textContent = 'QR platba je připravená. Automatický e-mail zatím není na serveru aktivovaný, proto si platební údaje prosím uložte.';
    } else {
      emailStatus.className = 'diy-payment-email-status warning';
      emailStatus.textContent = 'QR platba je připravená, ale potvrzovací e-mail se nepodařilo odeslat. Platební údaje si prosím uložte z této stránky.';
    }

    payment.classList.add('is-visible');
    payment.focus({preventScroll:true});
    payment.scrollIntoView({behavior:'smooth', block:'start'});
    try {
      sessionStorage.setItem('hlDiyLastOrder', JSON.stringify({order:order,email:customerEmail,time:Date.now()}));
    } catch (e) {}
  }

  form.addEventListener('submit', async function(event){
    event.preventDefault();
    clearError();
    updateDelivery();
    updateSummary();

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    if (String(formData.get('bot-field') || '').trim()) return;

    submit.disabled = true;
    const originalText = submit.textContent;
    submit.textContent = 'Vytvářím objednávku…';

    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      street: String(formData.get('street') || '').trim(),
      city: String(formData.get('city') || '').trim(),
      postalCode: String(formData.get('postal_code') || '').trim(),
      leatherColor: String(formData.get('leather_color') || '').trim(),
      quantity: Number(formData.get('quantity') || 1),
      delivery: String(formData.get('delivery') || '').trim(),
      pickupPoint: String(formData.get('pickup_point') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      privacyAcknowledged: formData.get('privacy_acknowledged') === 'yes',
      honeypot: String(formData.get('bot-field') || '')
    };

    try {
      const response = await fetch('/.netlify/functions/create-diy-order', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(function(){ return {}; });
      if (!response.ok || !data.ok) throw new Error(data.error || 'Objednávku se nepodařilo vytvořit.');

      document.getElementById('diy-order-number').value = data.orderNumber || '';
      document.getElementById('diy-variable-symbol').value = data.variableSymbol || '';
      document.getElementById('diy-order-total-hidden').value = String(data.amount || '');

      await storeNetlifySubmission(new FormData(form), data);
      renderPayment(data, payload.email);
      trackOrder(data);

      form.querySelectorAll('input, select, textarea, button').forEach(function(el){
        if (el.type !== 'hidden') el.disabled = true;
      });
      submit.textContent = 'Objednávka přijata';
    } catch (err) {
      showError((err && err.message) ? err.message : 'Objednávku se nepodařilo odeslat. Zkuste to prosím znovu nebo nám napište e-mail.');
      submit.disabled = false;
      submit.textContent = originalText;
    }
  });

  [qty, delivery].forEach(function(el){ el.addEventListener('change', function(){ updateDelivery(); updateSummary(); }); });

  document.querySelectorAll('[data-copy-target]').forEach(function(button){
    button.addEventListener('click', async function(){
      const target = document.getElementById(button.getAttribute('data-copy-target'));
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent.trim());
        const old = button.textContent;
        button.textContent = 'Zkopírováno';
        setTimeout(function(){ button.textContent = old; }, 1400);
      } catch (e) {}
    });
  });

  // Lightbox for product photos.
  (function(){
    const box=document.getElementById('diy-lightbox');
    const img=document.getElementById('diy-lightbox-img');
    const cap=document.getElementById('diy-lightbox-caption');
    const close=document.getElementById('diy-lightbox-close');
    if(!box||!img||!close)return;
    let lastTrigger=null;
    function show(src,alt,caption,trigger){
      if(!src)return;
      lastTrigger=trigger||null; img.src=src; img.alt=alt||''; cap.textContent=caption||alt||'';
      box.classList.add('is-open'); box.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; close.focus();
    }
    function hide(){
      box.classList.remove('is-open'); box.setAttribute('aria-hidden','true'); document.body.style.overflow=''; img.removeAttribute('src');
      if(lastTrigger&&typeof lastTrigger.focus==='function')lastTrigger.focus();
    }
    document.querySelectorAll('.diy-color-image-button').forEach(function(btn){
      btn.addEventListener('click',function(){ show(btn.dataset.lightboxSrc,btn.dataset.lightboxAlt||'',btn.dataset.lightboxCaption||'',btn); });
    });
    document.querySelectorAll('main img').forEach(function(photo){
      if(photo.closest('.diy-color-image-button') || photo.id === 'diy-payment-qr') return;
      photo.classList.add('diy-zoomable'); photo.setAttribute('tabindex','0'); photo.setAttribute('role','button'); photo.setAttribute('aria-label','Zvětšit fotografii: '+(photo.alt||'produktová fotografie'));
      function openPhoto(){ show(photo.currentSrc||photo.getAttribute('src'),photo.alt||'',photo.alt||'',photo); }
      photo.addEventListener('click',openPhoto);
      photo.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();openPhoto();} });
    });
    close.addEventListener('click',hide); box.addEventListener('click',function(e){if(e.target===box)hide();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&box.classList.contains('is-open'))hide();});
  })();

  updateDelivery();
  updateSummary();
})();
