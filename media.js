/* Official players load only after the visitor chooses a video. */
(() => {
  'use strict';
  const videos = {
    luxury: { title: 'Элитная недвижимость — Москва 24', url: 'https://www.m24.ru/videos/10022026/872281' },
    small: { title: 'Апартаменты 8 м² в «Москва-Сити» — Москва 24', url: 'https://www.m24.ru/videos/16012026/864375' }
  };
  const dialog = document.querySelector('#video-dialog');
  const host = document.querySelector('#video-player-host');
  let opener;
  if (dialog && host && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-video]').forEach(link => {
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const video = videos[link.dataset.video];
        if (!video) return;
        event.preventDefault();
        opener = link;
        const iframe = document.createElement('iframe');
        iframe.title = video.title;
        iframe.src = `${video.url}/external`;
        iframe.allow = 'fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        host.replaceChildren(iframe);
        document.querySelector('#video-dialog-title').textContent = video.title;
        document.querySelector('#video-source').href = video.url;
        dialog.showModal();
        document.body.classList.add('video-open');
      });
    });
    dialog.addEventListener('close', () => {
      // Removing the frame stops both audio and video, including on Escape.
      host.replaceChildren();
      document.body.classList.remove('video-open');
      opener?.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
  }

})();
