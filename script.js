/* Без зависимостей. Весь контент и ссылки доступны в HTML.
   FORM INTEGRATION: для реальной отправки задайте mode: 'webhook' и HTTPS endpoint.
   Endpoint — ваш сервер-посредник, НЕ секретный URL CRM и НЕ Tilda Webhook receiver.
   На Tilda используйте нативную форму: см. TILDA_IMPLEMENTATION.md. */
(() => {
  'use strict';

  const FORM_CONFIG = Object.freeze({
    mode: 'demo', // 'demo' | 'webhook'
    endpoint: '', // Например, собственный https://ваш-домен/api/leads
    timeoutMs: 12000
  });

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-menu');
  const desktop = window.matchMedia('(min-width: 1100px)');

  if (toggle && menu) {
    document.body.classList.add('js-ready');
    toggle.hidden = false;
    const closeMenu = (restoreFocus = false) => {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Открыть меню');
      if (restoreFocus) toggle.focus();
    };
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      menu.hidden = isOpen;
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
    });
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) closeMenu(true);
    });
    document.addEventListener('click', event => {
      if (!menu.hidden && !header.contains(event.target)) closeMenu();
    });
    header.addEventListener('focusout', event => {
      if (event.relatedTarget && !header.contains(event.relatedTarget)) closeMenu();
    });
    desktop.addEventListener('change', () => closeMenu());
  }

  // Ссылка из описания услуги переносит тему, не перезаписывая введённый текст.
  const task = document.querySelector('#client-task');
  document.querySelectorAll('[data-task]').forEach(link => {
    link.addEventListener('click', () => {
      if (task && !task.value.trim()) task.value = `Хочу обсудить: ${link.dataset.task.toLowerCase()}.`;
    });
  });

  // Нативные details: split-layout на desktop, обычный accordion на mobile.
  // Все тексты в HTML; без JS можно раскрыть любой пункт.
  const serviceItems = [...document.querySelectorAll('.service-item')];
  const wideServices = window.matchMedia('(min-width: 900px)');
  const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const openService = item => {
    serviceItems.forEach(other => { other.open = other === item; });
  };
  serviceItems.forEach(item => {
    const summary = item.querySelector('summary');
    summary.addEventListener('click', event => {
      if (!wideServices.matches) return;
      event.preventDefault();
      openService(item);
    });
    summary.addEventListener('mouseenter', () => {
      if (wideServices.matches && hoverPointer.matches) openService(item);
    });
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      serviceItems.forEach(other => { if (other !== item && other.open) other.open = false; });
    });
  });
  wideServices.addEventListener('change', () => {
    if (wideServices.matches && !serviceItems.some(item => item.open) && serviceItems[0]) openService(serviceItems[0]);
  });

  // Placeholder документов: нативный dialog поддерживает Escape и возврат фокуса.
  const legalDialog = document.querySelector('#legal-dialog');
  document.querySelectorAll('[data-legal]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      if (!legalDialog) return;
      legalDialog.querySelector('#legal-title').textContent = button.dataset.legal === 'privacy'
        ? 'Политика конфиденциальности'
        : 'Согласие на обработку персональных данных';
      legalDialog.showModal();
    });
  });
  legalDialog?.addEventListener('click', event => {
    if (event.target !== legalDialog) return;
    const bounds = legalDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) legalDialog.close();
  });

  const year = document.querySelector('#current-year');
  if (year) year.textContent = String(new Date().getFullYear());

  const form = document.querySelector('#contact-form');
  if (!form) return;
  const fields = form.querySelector('#form-fields');
  const name = form.elements.namedItem('name');
  const phone = form.elements.namedItem('phone');
  const consent = form.elements.namedItem('consent');
  const submit = form.querySelector('[type="submit"]');
  const submitText = submit.querySelector('span');
  const status = form.querySelector('#form-status');
  const errors = {
    name: form.querySelector('#name-error'),
    phone: form.querySelector('#phone-error'),
    consent: form.querySelector('#consent-error')
  };
  let pending = false;

  // Поддерживаем российские и международные номера; форматирование не навязываем.
  const validPhone = value => {
    const trimmed = value.trim();
    if (!/^(?:\+)?[\d\s().-]+$/.test(trimmed)) return false;
    const digits = trimmed.replace(/\D/g, '');
    if (!trimmed.startsWith('+') && digits.length === 10) return true;
    if (/^[78]/.test(digits) && (!trimmed.startsWith('+') || digits.startsWith('7'))) return digits.length === 11;
    return trimmed.startsWith('+') ? digits.length >= 8 && digits.length <= 15 : digits.length === 10;
  };

  function validate(field) {
    let message = '';
    if (field === name && (name.value.trim().length < 2 || name.value.trim().length > 80)) message = 'Пожалуйста, укажите имя — от 2 до 80 символов.';
    if (field === phone && !validPhone(phone.value)) message = 'Укажите полный номер: например, +7 (967) 076-07-08.';
    if (field === consent && !consent.checked) message = 'Для отправки необходимо ваше согласие.';
    errors[field.name].textContent = message;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    return !message;
  }

  [name, phone, consent].forEach(field => {
    field.addEventListener('blur', () => validate(field));
    field.addEventListener(field === consent ? 'change' : 'input', () => {
      if (field.hasAttribute('aria-invalid')) validate(field);
      if (!pending) status.hidden = true;
    });
  });
  task?.addEventListener('input', () => { if (!pending) status.hidden = true; });

  function announce(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
    status.hidden = false;
    status.focus({ preventScroll: true });
    status.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }

  // Регистрация обработчика ДО активации полей исключает отправку GET при ошибке инициализации.
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    status.hidden = true;
    const invalid = [name, phone, consent].filter(field => !validate(field));
    if (invalid.length) { invalid[0].focus(); return; }

    if (FORM_CONFIG.mode === 'demo') {
      announce('Форма заполнена верно. Это демонстрация: заявка не отправлена, данные не сохранены. Свяжитесь с Павлом по телефону +7 967 076-07-08 или в Telegram @pavelrubtsov1.');
      return;
    }

    if (FORM_CONFIG.mode !== 'webhook' || !/^https:\/\//.test(FORM_CONFIG.endpoint)) {
      announce('Отправка ещё не подключена. Позвоните Павлу: +7 967 076-07-08.', true);
      return;
    }

    const payload = {
      name: name.value.trim(),
      phone: phone.value.trim(),
      task: task?.value.trim() || '',
      consent: consent.checked,
      source: 'pavel-rubtsov-website'
    };
    pending = true;
    fields.disabled = true;
    submitText.textContent = 'Отправляем…';
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), FORM_CONFIG.timeoutMs);

    try {
      // Сервер должен провалидировать данные, обеспечить защиту от спама и
      // вернуть { "ok": true } только после надёжного принятия заявки.
      const response = await fetch(FORM_CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer'
      });
      if (!response.ok) throw new Error('HTTP error');
      const result = await response.json();
      if (result.ok !== true) throw new Error('Unconfirmed submission');
      form.reset();
      announce('Спасибо! Заявка принята. Павел свяжется с вами по указанному телефону.');
    } catch {
      // Не утверждаем, что сервер не получил данные: ответ мог потеряться.
      announce('Не удалось подтвердить отправку. Ваши поля сохранены на странице. Позвоните Павлу по номеру +7 967 076-07-08.', true);
    } finally {
      window.clearTimeout(timeout);
      pending = false;
      fields.disabled = false;
      submitText.textContent = 'Отправить заявку';
      form.removeAttribute('aria-busy');
    }
  });
  form.noValidate = true;
  fields.disabled = false;
  if (FORM_CONFIG.mode === 'webhook' && /^https:\/\//.test(FORM_CONFIG.endpoint)) {
    form.querySelector('#form-note').textContent = 'Оставьте контакты и несколько слов о вашей задаче.';
  }
})();
