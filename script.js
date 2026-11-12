(() => {
  'use strict';
  const menu = document.querySelector('#mobile-menu');
  const toggle = document.querySelector('.menu-toggle');
  const closeMenu = () => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.querySelector('span').textContent = '+'; };
  if (menu && toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; menu.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); toggle.querySelector('span').textContent = open ? '−' : '+'; });
    menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); toggle.focus(); } });
    matchMedia('(min-width:950px)').addEventListener('change', e => { if(e.matches) closeMenu(); });
  }
  // Preserve links from the previous preview when the catalogue became cases.
  if (location.hash === '#properties') { location.replace('#cases'); }
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const config = JSON.parse(document.querySelector('#form-config').textContent);
  const fields = document.querySelector('#form-fields');
  const task = document.querySelector('#client-task');
  const comment = document.querySelector('#client-comment');
  const telegram = document.querySelector('#personal-telegram');
  const telegramBase = telegram.href;
  const name = document.querySelector('#client-name');
  const contact = document.querySelector('#client-contact');
  const consent = document.querySelector('#client-consent');
  const submit = document.querySelector('#submit-lead');
  const status = document.querySelector('#form-status');
  fields.disabled = false;
  form.noValidate = true;
  let pending = false, challenge = null, requestId = null, serviceComment = '';
  form.addEventListener('input', () => { if (!pending) requestId = null; });
  document.querySelectorAll('[data-task]').forEach(a => a.addEventListener('click', () => {
    task.value = a.dataset.task;
    const title = a.dataset.service || a.dataset.task;
    if (!comment.value.trim() || comment.value === serviceComment) {
      serviceComment = title === 'Коммерческая недвижимость' ? 'Коммерческая недвижимость: ' : '';
      comment.value = serviceComment;
    }
    const url = new URL(telegramBase);
    url.searchParams.set('text', 'Павел, здравствуйте! Хочу обсудить: ' + title.toLowerCase() + '.');
    telegram.href = url.href;
  }));
  function announce(text, error = false) { status.hidden = false; status.textContent = text; status.classList.toggle('error', error); status.focus({preventScroll:true}); }
  function setError(input, id, text) { document.querySelector(id).textContent = text; if(text) input.setAttribute('aria-invalid','true'); else input.removeAttribute('aria-invalid'); }
  for (const [input,id] of [[name,'#name-error'],[contact,'#contact-error'],[task,'#task-error'],[consent,'#consent-error']]) input.addEventListener('input',()=>setError(input,id,''));
  async function getChallenge() {
    const response = await fetch(config.endpoint, {headers:{Accept:'application/json'},credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw new Error('unavailable');
    const data = await response.json();
    if (!data.token || !Number.isFinite(data.issuedAt)) throw new Error('invalid challenge');
    return data;
  }
  // No API request, cookies or telemetry in the approval preview.
  if (config.enabled) {
    consent.disabled = false;
    submit.disabled = false;
    const prepare = () => { if(!challenge) challenge = getChallenge().catch(()=>{challenge=null;return null;}); };
    form.addEventListener('focusin',prepare,{once:true});
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    if (!config.enabled) { announce('Приём заявок через форму пока не подключён. Позвоните Павлу: +7 967 076-07-08.',true); return; }
    const errors = [
      [name,'#name-error', name.value.trim().length < 2 ? 'Укажите ваше имя.' : ''],
      [contact,'#contact-error', contact.value.trim().length < 5 ? 'Укажите телефон или контакт в мессенджере.' : ''],
      [task,'#task-error', !task.value ? 'Выберите тип задачи.' : ''],
      [consent,'#consent-error', !consent.checked ? 'Для отправки заявки необходимо согласие.' : '']
    ];
    errors.forEach(args=>setError(...args));
    const invalid=errors.find(x=>x[2]);
    if(invalid){invalid[0].focus();return;}
    pending=true; fields.disabled=true; form.setAttribute('aria-busy','true'); submit.textContent='Отправляем…';
    const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),20000);
    try {
      challenge ||= getChallenge();
      const token = await challenge;
      if(!token) throw new Error('unavailable');
      if(Date.now()/1000 - token.issuedAt < 3) { announce('Подождите несколько секунд и повторите отправку.',true); return; }
      requestId ||= crypto.randomUUID();
      const response=await fetch(config.endpoint, {method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},credentials:'same-origin',cache:'no-store',signal:controller.signal,body:JSON.stringify({name:name.value.trim(),contact:contact.value.trim(),task:task.value,comment:comment.value.trim(),consent:consent.checked,legalVersion:config.legalVersion,company_url:form.elements.company_url.value,token:token.token,issuedAt:token.issuedAt,requestId})});
      const result=await response.json();
      if(!response.ok || result.ok !== true) { if(result.code === 'expired') challenge=null; throw new Error('not confirmed'); }
      form.reset(); requestId=null; challenge=null;
      announce('Спасибо! Ваша заявка отправлена');
    } catch { challenge=null; announce('Не удалось подтвердить отправку. Данные остались в форме. Попробуйте позже или позвоните Павлу: +7 967 076-07-08.',true); }
    finally { clearTimeout(timeout); pending=false; fields.disabled=false; form.removeAttribute('aria-busy'); submit.textContent='Отправить заявку'; }
  });
})();
