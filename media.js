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

  const photo = document.querySelector('#property-photo');
  const galleryControls = document.querySelector('.gallery-controls');
  if (photo && galleryControls) {
    const photos = [
      { src: 'images/properties/sadovaya-samotechnaya.jpg', alt: 'Гостиная квартиры на Садовой-Самотёчной, 2/12 — фотография из объявления Павла' },
      { src: 'images/properties/sadovaya-samotechnaya-2.jpg', alt: 'Другой ракурс квартиры на Садовой-Самотёчной, 2/12 — фотография из объявления Павла' }
    ];
    let index = 0;
    const show = step => {
      index = (index + step + photos.length) % photos.length;
      photo.src = photos[index].src;
      photo.alt = photos[index].alt;
      document.querySelector('#gallery-count').textContent = `${index + 1} / ${photos.length}`;
    };
    galleryControls.hidden = false;
    galleryControls.querySelector('[data-gallery-prev]').addEventListener('click', () => show(-1));
    galleryControls.querySelector('[data-gallery-next]').addEventListener('click', () => show(1));
  }
})();
