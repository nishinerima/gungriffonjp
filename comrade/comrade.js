(() => {
  const siteHeader = document.querySelector('.site-header');

  if (siteHeader) {
    const syncHeaderHeight = () => {
      document.body.style.setProperty('--comrade-site-header-height', `${siteHeader.getBoundingClientRect().height}px`);
    };

    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight, { passive: true });

    if ('ResizeObserver' in window) {
      const headerObserver = new ResizeObserver(syncHeaderHeight);
      headerObserver.observe(siteHeader);
    }
  }

  const mobileNavMedia = window.matchMedia('(max-width: 760px)');
  const comradeNav = document.querySelector('.comrade-nav');
  const currentPageLink = comradeNav?.querySelector('a[aria-current="page"]');
  const pageNav = document.querySelector('.comrade-page-nav');

  if (comradeNav && currentPageLink && pageNav?.querySelector('a')) {
    const popup = document.createElement('nav');
    const popupId = 'comrade-local-popup';

    popup.className = 'comrade-local-popup';
    popup.id = popupId;
    popup.setAttribute('aria-label', 'このページの目次');
    popup.hidden = true;
    popup.innerHTML = pageNav.innerHTML;
    comradeNav.append(popup);

    const closePopup = () => {
      popup.hidden = true;
      currentPageLink.setAttribute('aria-expanded', 'false');
    };

    const syncTriggerMode = () => {
      closePopup();

      if (mobileNavMedia.matches) {
        currentPageLink.setAttribute('aria-controls', popupId);
        currentPageLink.setAttribute('aria-expanded', 'false');
        currentPageLink.setAttribute('aria-haspopup', 'true');
      } else {
        currentPageLink.removeAttribute('aria-controls');
        currentPageLink.removeAttribute('aria-expanded');
        currentPageLink.removeAttribute('aria-haspopup');
      }
    };

    syncTriggerMode();

    currentPageLink.addEventListener('click', (event) => {
      if (!mobileNavMedia.matches) return;
      event.preventDefault();
      const willOpen = popup.hidden;
      popup.hidden = !willOpen;
      currentPageLink.setAttribute('aria-expanded', String(willOpen));
    });

    popup.addEventListener('click', (event) => {
      if (event.target.closest('a')) closePopup();
    });

    document.addEventListener('click', (event) => {
      if (!popup.hidden && !comradeNav.contains(event.target)) closePopup();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || popup.hidden) return;
      closePopup();
      currentPageLink.focus();
    });

    mobileNavMedia.addEventListener('change', syncTriggerMode);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.video-facade__play');
    if (!button) return;

    const card = button.closest('.video-facade');
    const media = card?.querySelector('.video-facade__media');
    const videoId = card?.dataset.youtubeId;
    if (!card || !media || !/^[A-Za-z0-9_-]{6,}$/.test(videoId ?? '')) return;

    const title = card.dataset.videoTitle || 'YouTube動画';
    const wrapper = document.createElement('div');
    const iframe = document.createElement('iframe');

    wrapper.className = 'video-embed';
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;
    iframe.title = title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;

    wrapper.append(iframe);
    media.replaceWith(wrapper);
  });
})();
