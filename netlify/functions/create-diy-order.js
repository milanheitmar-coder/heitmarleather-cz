const crypto = require('crypto');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

const UNIT_PRICE = 2490;
const SHIPPING_PRICE = 120;
const ACCOUNT = '2700974964/2010';
const IBAN = 'CZ2820100000002700974964';
const RECIPIENT_NAME = 'Milan Heitmar';
const DEFAULT_EMAIL = 'milan.heitmar@seznam.cz';
const ALLOWED_COLORS = new Set(['Přírodní', 'Dub tmavý', 'Černá']);
const DELIVERY = {
  'zasilkovna': 'Zásilkovna – výdejní místo',
  'ceska-posta': 'Česká pošta'
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

function clean(value, max = 500) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value, 5000)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCzk(value) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(value);
}

function pragueDateCode() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Prague', year: '2-digit', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}${map.month}${map.day}`;
}

function createOrderId() {
  const date = pragueDateCode();
  const suffix = String(crypto.randomInt(0, 10000)).padStart(4, '0');
  return {
    orderNumber: `HL-${date}-${suffix}`,
    variableSymbol: `${date}${suffix}`
  };
}

function spaydText(amount, variableSymbol, orderNumber) {
  const msg = `HEITMAR LEATHER ${orderNumber}`.replace(/\*/g, ' ').slice(0, 60);
  return `SPD*1.0*ACC:${IBAN}*AM:${amount.toFixed(2)}*CC:CZK*X-VS:${variableSymbol}*MSG:${msg}`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildCustomerHtml(order, data, qrCid) {
  const pickupLine = data.delivery === 'zasilkovna'
    ? `<tr><td style="padding:6px 0;color:#76685e">Výdejní místo</td><td style="padding:6px 0"><strong>${escapeHtml(data.pickupPoint)}</strong></td></tr>` : '';
  return `<!doctype html><html><body style="margin:0;background:#f5f0e9;font-family:Arial,sans-serif;color:#2a201a"><div style="max-width:640px;margin:0 auto;padding:28px 16px"><div style="background:#17100c;color:#f6eee6;border-radius:20px;padding:28px"><div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#d6a55f">Heitmar Leather Studio · tvoř si.</div><h1 style="font-size:28px;margin:10px 0 8px">Děkujeme za objednávku</h1><p style="color:#cbbdb1;line-height:1.6;margin:0">Objednávka <strong style="color:#fff">${escapeHtml(order.orderNumber)}</strong> byla přijata. DIY Box začneme připravovat po přijetí platby.</p></div><div style="background:#fff;border-radius:20px;padding:26px;margin-top:14px"><h2 style="margin:0 0 16px;font-size:21px">Vaše objednávka</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:6px 0;color:#76685e">Produkt</td><td style="padding:6px 0"><strong>Crossbody DIY Box</strong></td></tr><tr><td style="padding:6px 0;color:#76685e">Barva</td><td style="padding:6px 0"><strong>${escapeHtml(data.leatherColor)}</strong></td></tr><tr><td style="padding:6px 0;color:#76685e">Počet</td><td style="padding:6px 0"><strong>${data.quantity}</strong></td></tr><tr><td style="padding:6px 0;color:#76685e">Doprava</td><td style="padding:6px 0"><strong>${escapeHtml(DELIVERY[data.delivery])} – ${formatCzk(SHIPPING_PRICE)}</strong></td></tr>${pickupLine}<tr><td style="padding:12px 0 4px;color:#76685e">Celkem</td><td style="padding:12px 0 4px"><strong style="font-size:21px">${formatCzk(order.amount)}</strong></td></tr></table><div style="height:1px;background:#ece5de;margin:20px 0"></div><h2 style="margin:0 0 10px;font-size:21px">Platba bankovním převodem</h2><p style="line-height:1.6;color:#65574d">Naskenujte QR kód v bankovní aplikaci. Účet, částka i variabilní symbol jsou v něm už vyplněné.</p><div style="text-align:center;margin:18px 0"><img src="cid:${qrCid}" alt="QR kód pro platbu" width="300" style="max-width:100%;height:auto;border:12px solid #fff"/></div><table style="width:100%;border-collapse:collapse"><tr><td style="padding:7px 0;color:#76685e">Číslo účtu</td><td style="padding:7px 0"><strong>${ACCOUNT}</strong></td></tr><tr><td style="padding:7px 0;color:#76685e">Variabilní symbol</td><td style="padding:7px 0"><strong>${escapeHtml(order.variableSymbol)}</strong></td></tr><tr><td style="padding:7px 0;color:#76685e">Částka</td><td style="padding:7px 0"><strong>${formatCzk(order.amount)}</strong></td></tr><tr><td style="padding:7px 0;color:#76685e">Příjemce</td><td style="padding:7px 0"><strong>${RECIPIENT_NAME}</strong></td></tr></table><p style="margin:20px 0 0;line-height:1.6;color:#65574d">Po přijetí platby začneme box připravovat. Příprava obvykle trvá přibližně 14 dní.</p></div><div style="padding:20px 8px;color:#76685e;font-size:13px;line-height:1.6">Heitmar Leather Studio<br/>${DEFAULT_EMAIL}</div></div></body></html>`;
}

function buildCustomerText(order, data) {
  const pickup = data.delivery === 'zasilkovna' ? `\nVýdejní místo: ${data.pickupPoint}` : '';
  return `Heitmar Leather Studio – objednávka ${order.orderNumber}\n\nDěkujeme za objednávku.\n\nProdukt: Crossbody DIY Box\nBarva: ${data.leatherColor}\nPočet: ${data.quantity}\nDoprava: ${DELIVERY[data.delivery]} – ${formatCzk(SHIPPING_PRICE)}${pickup}\nCelkem: ${formatCzk(order.amount)}\n\nPLATBA\nČíslo účtu: ${ACCOUNT}\nVariabilní symbol: ${order.variableSymbol}\nČástka: ${formatCzk(order.amount)}\nPříjemce: ${RECIPIENT_NAME}\n\nQR kód je vložený v HTML verzi e-mailu a také přiložený jako obrázek.\n\nPo přijetí platby začneme DIY Box připravovat. Příprava obvykle trvá přibližně 14 dní.\n\nHeitmar Leather Studio\n${DEFAULT_EMAIL}`;
}

function buildOwnerHtml(order, data) {
  const pickup = data.delivery === 'zasilkovna' ? `<p><strong>Výdejní místo:</strong> ${escapeHtml(data.pickupPoint)}</p>` : '';
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#222"><h2>Nová objednávka – ${escapeHtml(order.orderNumber)}</h2><p><strong>Stav:</strong> čeká na platbu</p><p><strong>Částka:</strong> ${formatCzk(order.amount)}<br/><strong>VS:</strong> ${escapeHtml(order.variableSymbol)}<br/><strong>Účet:</strong> ${ACCOUNT}</p><hr/><p><strong>Produkt:</strong> Crossbody DIY Box<br/><strong>Barva:</strong> ${escapeHtml(data.leatherColor)}<br/><strong>Počet:</strong> ${data.quantity}<br/><strong>Doprava:</strong> ${escapeHtml(DELIVERY[data.delivery])}</p>${pickup}<hr/><p><strong>Jméno:</strong> ${escapeHtml(data.name)}<br/><strong>E-mail:</strong> ${escapeHtml(data.email)}<br/><strong>Telefon:</strong> ${escapeHtml(data.phone)}<br/><strong>Adresa:</strong> ${escapeHtml(data.street)}, ${escapeHtml(data.postalCode)} ${escapeHtml(data.city)}</p><p><strong>Poznámka:</strong><br/>${escapeHtml(data.message || '—')}</p></body></html>`;
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok:false, error:'Metoda není povolena.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (_) { return json(400, { ok:false, error:'Neplatná data objednávky.' }); }

  if (clean(body.honeypot, 100)) return json(200, { ok:true });

  const data = {
    name: clean(body.name, 120),
    email: clean(body.email, 180).toLowerCase(),
    phone: clean(body.phone, 80),
    street: clean(body.street, 180),
    city: clean(body.city, 120),
    postalCode: clean(body.postalCode, 30),
    leatherColor: clean(body.leatherColor, 60),
    quantity: Number(body.quantity),
    delivery: clean(body.delivery, 40),
    pickupPoint: clean(body.pickupPoint, 220),
    message: clean(body.message, 1000),
    privacyAcknowledged: body.privacyAcknowledged === true
  };

  if (!data.name || !validateEmail(data.email) || !data.phone || !data.street || !data.city || !data.postalCode) {
    return json(400, { ok:false, error:'Vyplňte prosím všechny povinné kontaktní a doručovací údaje.' });
  }
  if (!ALLOWED_COLORS.has(data.leatherColor)) return json(400, { ok:false, error:'Vyberte prosím barvu kabelky.' });
  if (!Number.isInteger(data.quantity) || data.quantity < 1 || data.quantity > 3) return json(400, { ok:false, error:'Neplatný počet sad.' });
  if (!DELIVERY[data.delivery]) return json(400, { ok:false, error:'Vyberte prosím způsob dopravy.' });
  if (data.delivery === 'zasilkovna' && !data.pickupPoint) return json(400, { ok:false, error:'Doplňte prosím výdejní místo Zásilkovny.' });
  if (!data.privacyAcknowledged) return json(400, { ok:false, error:'Pro odeslání objednávky je potřeba potvrdit informace ke zpracování údajů.' });

  const amount = UNIT_PRICE * data.quantity + SHIPPING_PRICE;
  const ids = createOrderId();
  const order = { ...ids, amount };
  const paymentText = spaydText(amount, ids.variableSymbol, ids.orderNumber);

  let qrBuffer;
  try {
    qrBuffer = await QRCode.toBuffer(paymentText, { type:'png', width:520, margin:2, errorCorrectionLevel:'M' });
  } catch (err) {
    console.error('QR generation failed', err);
    return json(500, { ok:false, error:'Nepodařilo se vytvořit QR platbu. Zkuste to prosím znovu.' });
  }

  const smtpPass = process.env.SMTP_PASS;
  const smtpUser = process.env.SMTP_USER || DEFAULT_EMAIL;
  const smtpHost = process.env.SMTP_HOST || 'smtp.seznam.cz';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const ownerEmail = process.env.OWNER_EMAIL || DEFAULT_EMAIL;
  const fromEmail = process.env.SMTP_FROM || smtpUser;
  const emailConfigured = Boolean(smtpPass && smtpUser && smtpHost);
  let customerEmailSent = false;
  let ownerEmailSent = false;

  if (emailConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 12000,
        greetingTimeout: 12000,
        socketTimeout: 20000
      });
      const cid = `diy-payment-${ids.variableSymbol}@heitmarleather.cz`;
      const attachment = { filename:`QR-platba-${ids.orderNumber}.png`, content:qrBuffer, cid };
      const results = await Promise.allSettled([
        transporter.sendMail({
          from: `Heitmar Leather Studio <${fromEmail}>`,
          to: data.email,
          replyTo: ownerEmail,
          subject: `Heitmar Leather Studio – objednávka ${ids.orderNumber}`,
          text: buildCustomerText(order, data),
          html: buildCustomerHtml(order, data, cid),
          attachments: [attachment]
        }),
        transporter.sendMail({
          from: `Heitmar Leather Studio <${fromEmail}>`,
          to: ownerEmail,
          replyTo: data.email,
          subject: `NOVÁ OBJEDNÁVKA – ${ids.orderNumber} – ${data.leatherColor}`,
          text: `Nová objednávka ${ids.orderNumber}\nStav: čeká na platbu\nČástka: ${formatCzk(amount)}\nVS: ${ids.variableSymbol}\n\n${data.name}\n${data.email}\n${data.phone}\n${data.street}, ${data.postalCode} ${data.city}\n\nBarva: ${data.leatherColor}\nPočet: ${data.quantity}\nDoprava: ${DELIVERY[data.delivery]}\nVýdejní místo: ${data.pickupPoint || '—'}\nPoznámka: ${data.message || '—'}`,
          html: buildOwnerHtml(order, data),
          attachments: [{ filename:`QR-platba-${ids.orderNumber}.png`, content:qrBuffer }]
        })
      ]);
      customerEmailSent = results[0].status === 'fulfilled';
      ownerEmailSent = results[1].status === 'fulfilled';
      results.forEach((r, i) => { if (r.status === 'rejected') console.error(i === 0 ? 'Customer email failed' : 'Owner email failed', r.reason); });
    } catch (err) {
      console.error('SMTP setup/send failed', err);
    }
  }

  return json(200, {
    ok: true,
    orderNumber: ids.orderNumber,
    variableSymbol: ids.variableSymbol,
    amount,
    currency: 'CZK',
    account: ACCOUNT,
    recipient: RECIPIENT_NAME,
    qrDataUrl: `data:image/png;base64,${qrBuffer.toString('base64')}`,
    customerEmailSent,
    ownerEmailSent,
    emailConfigured
  });
};
