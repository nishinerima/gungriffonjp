(() => {
  const pageOrigin = window.location.origin;

  document.querySelectorAll('a[href]').forEach((link) => {
    let destination;

    try {
      destination = new URL(link.href, document.baseURI);
    } catch {
      return;
    }

    if (!['http:', 'https:'].includes(destination.protocol) || destination.origin === pageOrigin) {
      return;
    }

    link.target = '_blank';
    link.relList.add('external');
    link.relList.add('noopener');

    const isCatalogCardHeading = Boolean(link.closest('.catalog-page .reference-card h4'));
    if (isCatalogCardHeading) {
      link.classList.add('external-link--no-icon');
    }
  });
})();

(() => {
  document.querySelectorAll('.global-nav__home .nav-home > span').forEach((label) => {
    label.textContent = 'gungriffon.jp';
  });

  const mobileGlobalNavLabels = new Map([
    ['.nav-info', ['SITE INFO', 'サイト情報']],
    ['.nav-catalog', ['OVERVIEW', 'シリーズ概要・作品解説']],
    ['.nav-tips', ['TIPS', 'お役立ち情報']],
    ['.nav-wnpx', ['FANWORK', '西練馬駐屯地PX']],
    ['.nav-mu3', ['WW3 BACKGROUND', '第三次世界大戦資料館']],
    ['.nav-comrade', ['VIDEO', '戦研D班']],
    ['.nav-notes', ['NOTES', '記事']]
  ]);

  mobileGlobalNavLabels.forEach(([english, local], selector) => {
    document.querySelectorAll(`.global-nav ${selector}`).forEach((link) => {
      const mobileEnglishLabel = link.querySelector(
        '.parent-nav-label__mobile, .wnpx-nav-label__mobile, .mu3-header-nav-label__mobile, .comrade-header-nav-label__mobile'
      );
      if (mobileEnglishLabel) {
        mobileEnglishLabel.textContent = english;
      }

      if (!link.querySelector('.global-nav__mobile-local')) {
        const localLabel = document.createElement('span');
        localLabel.className = 'global-nav__mobile-local';
        localLabel.textContent = local;
        link.append(localLabel);
      }

      link.setAttribute('aria-label', `${english} ${local}`);
    });
  });
})();

(() => {
  const menu = document.querySelector('.nav-menu');
  if (!menu) return;

  const mobile = window.matchMedia('(max-width: 760px)');
  const syncMenu = () => {
    menu.open = !mobile.matches;
  };

  syncMenu();
  if (mobile.addEventListener) {
    mobile.addEventListener('change', syncMenu);
  } else {
    mobile.addListener(syncMenu);
  }

  document.addEventListener('click', (event) => {
    if (mobile.matches && menu.open && !menu.contains(event.target)) {
      menu.open = false;
    }
  });
})();

(() => {
  const imageExtension = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
  const root = document.documentElement;
  const modal = document.createElement('div');
  const modalImage = document.createElement('img');
  const closeButton = document.createElement('button');
  let trigger;

  modal.className = 'image-modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', '画像の拡大表示');

  modalImage.className = 'image-modal__image';
  modalImage.alt = '';

  closeButton.className = 'image-modal__close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', '拡大画像を閉じる');
  closeButton.textContent = '×';

  modal.append(modalImage, closeButton);
  document.body.append(modal);

  const closeModal = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    modalImage.removeAttribute('src');
    modalImage.alt = '';
    root.classList.remove('is-image-modal-open');
    trigger?.focus({ preventScroll: true });
    trigger = undefined;
  };

  const openModal = (source, description, opener) => {
    trigger = opener;
    modalImage.src = source;
    modalImage.alt = description;
    modal.hidden = false;
    root.classList.add('is-image-modal-open');
    closeButton.focus({ preventScroll: true });
  };

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const thumbnail = event.target.closest('img');
    const link = thumbnail?.closest('a[href]');
    if (!link || link.hasAttribute('data-no-image-modal')) return;

    const destination = new URL(link.href, document.baseURI);
    if (!imageExtension.test(destination.pathname)) return;

    event.preventDefault();
    openModal(destination.href, thumbnail.alt || '', link);
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  closeButton.addEventListener('click', closeModal);

  document.addEventListener('keydown', (event) => {
    if (modal.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeModal();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      closeButton.focus({ preventScroll: true });
    }
  }, true);
})();
(() => {
  const landing = document.querySelector('[data-home-lp]');
  if (!landing) return;

  const desktop = window.matchMedia('(min-width: 761px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = landing.querySelector('[data-home-header]');
  const headerNav = landing.querySelector('.home-lp-header__nav');
  const mobileMenuToggle = landing.querySelector('[data-home-mobile-menu]');
  const lastHeaderTab = headerNav?.querySelector('li:last-child');
  const griffon = landing.querySelector('[data-home-griffon]');
  const footer = landing.querySelector('[data-home-footer]');
  const dockTarget = landing.querySelector('[data-home-dock-target]');
  const hero = landing.querySelector('.home-lp-hero-spacer');
  const notesBand = landing.querySelector('.home-link-band--notes');
  const firstSubsite = landing.querySelector('.home-link-band--subsite');
  const subsiteSections = [...landing.querySelectorAll('.home-link-band--subsite')];
  const wnpxCamo = landing.querySelector('[data-home-wnpx-camo]');
  const griffonSurfaces = [...landing.querySelectorAll('[data-home-griffon-surface]')];
  const parallaxSections = [...landing.querySelectorAll('[data-home-parallax]')];
  const carousel = landing.querySelector('[data-home-carousel]');
  const carouselViewport = landing.querySelector('.home-carousel__viewport');
  const carouselTrack = landing.querySelector('[data-home-carousel-track]');
  const carouselSlides = [...landing.querySelectorAll('[data-home-carousel-slide]')];
  const carouselDots = [...landing.querySelectorAll('[data-home-carousel-dot]')];
  const previousButton = landing.querySelector('[data-home-carousel-prev]');
  const nextButton = landing.querySelector('[data-home-carousel-next]');
  const landingMeasuredSections = [
    ...new Set([...griffonSurfaces, ...parallaxSections, ...subsiteSections]),
  ];
  const rootStyle = document.body.style;
  let carouselIndex = 0;
  let carouselTimer;
  let carouselSwipeStart;
  let suppressCarouselClick = false;
  let suppressCarouselClickTimer;
  let scrollFrame;
  let headerRevealTimer;
  let headerWasCompact = document.body.classList.contains('is-home-header-compact');
  let dockProgress = 0;
  let dockHoldStarted = 0;
  let dockMotionStarted = 0;
  let undockMotionStarted = 0;
  let undockStartProgress = 0;
  let mobileBottomLatched = false;
  let mobileScrollIntent = 0;
  let mobileTouchY = null;
  let lastScrollTop = window.scrollY;
  let camoWidth = 0;
  let camoHeight = 0;
  let camoPixelRatio = 0;
  let mobileMenuOpen = false;

  const griffonLayers = griffonSurfaces.map((surface) => {
    const layer = document.createElement('span');
    layer.className = 'home-griffon-layer';
    if (surface.classList.contains('home-lp-hero-spacer')) {
      layer.classList.add('home-griffon-layer--header');
    } else if (surface.classList.contains('home-link-band--parent')) {
      layer.classList.add('home-griffon-layer--parent');
    }
    layer.style.setProperty(
      '--home-griffon-layer-color',
      surface.dataset.homeGriffonSurface || '#111'
    );
    griffon.append(layer);
    return { surface, layer };
  });
  const dockLayer = document.createElement('span');
  dockLayer.className = 'home-griffon-layer home-griffon-layer--dock';
  dockLayer.style.setProperty('--home-griffon-layer-color', '#333');
  griffon.append(dockLayer);
  if (!reducedMotion.matches) {
    griffon.classList.add('is-entering');
  }
  griffon.addEventListener('animationend', (event) => {
    if (
      event.animationName === 'home-fixed-griffon-enter' ||
      event.animationName === 'home-fixed-griffon-enter-mobile'
    ) {
      griffon.classList.remove('is-entering');
    }
  });

  const clamp = (value, minimum, maximum) =>
    Math.min(maximum, Math.max(minimum, value));
  const mix = (start, end, progress) => start + (end - start) * progress;
  const smoothstep = (progress) => progress * progress * (3 - 2 * progress);
  const easeOutCubic = (progress) => 1 - Math.pow(1 - progress, 3);
  const inverseEaseOutCubic = (progress) => 1 - Math.cbrt(1 - progress);
  const setLandingStyleProperty = (style, property, value) => {
    if (style.getPropertyValue(property) === value) return;
    style.setProperty(property, value);
  };
  const removeLandingStyleProperty = (style, property) => {
    if (!style.getPropertyValue(property)) return;
    style.removeProperty(property);
  };
  const isLandingSectionNearby = (rect, viewportHeight) =>
    rect.bottom >= -viewportHeight && rect.top <= viewportHeight * 2;
  const readLandingSectionRects = () =>
    new Map(
      landingMeasuredSections.map((section) => [
        section,
        section.getBoundingClientRect(),
      ])
    );

  const setMobileMenuOpen = (open) => {
    mobileMenuOpen = !desktop.matches && open;
    document.body.classList.toggle('is-home-mobile-menu-open', mobileMenuOpen);
    mobileMenuToggle?.setAttribute('aria-expanded', String(mobileMenuOpen));
    mobileMenuToggle?.setAttribute(
      'aria-label',
      mobileMenuOpen ? 'メインメニューを閉じる' : 'メインメニューを開く'
    );

    if (!desktop.matches && headerNav) {
      headerNav.toggleAttribute('inert', !mobileMenuOpen);
      headerNav.setAttribute('aria-hidden', String(!mobileMenuOpen));
    }
  };

  mobileMenuToggle?.addEventListener('click', () => {
    setMobileMenuOpen(!mobileMenuOpen);
  });

  headerNav?.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener('click', () => setMobileMenuOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenuOpen) {
      setMobileMenuOpen(false);
      mobileMenuToggle?.focus({ preventScroll: true });
    }
  });

  const drawWnpxCamo = (rect = wnpxCamo?.parentElement?.getBoundingClientRect()) => {
    if (!wnpxCamo) return;
    const context = wnpxCamo.getContext('2d');
    if (!context || !rect) return;

    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    if (
      width === camoWidth &&
      height === camoHeight &&
      pixelRatio === camoPixelRatio
    ) return;
    camoWidth = width;
    camoHeight = height;
    camoPixelRatio = pixelRatio;
    wnpxCamo.width = Math.round(width * pixelRatio);
    wnpxCamo.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#555f35';
    context.fillRect(0, 0, width, height);

    const colors = ['#b89b41', '#4a3828', '#555f35', '#4a3828', '#b89b41', '#4a3828', '#555f35'];
    const widths = [190, 64, 210, 64, 185, 64, 220];
    const cycleWidth = widths.reduce((total, value) => total + value, 0);
    const randomUnit = (column, group) => {
      let value = (
        73457 ^
        Math.imul(column + 1, 0x9e3779b1) ^
        Math.imul(group + 1, 0x85ebca77)
      ) >>> 0;
      value ^= value >>> 16;
      value = Math.imul(value, 0x7feb352d);
      value ^= value >>> 15;
      value = Math.imul(value, 0x846ca68b);
      value ^= value >>> 16;
      return value / 4294967295;
    };
    const modulo = (value, divisor) => (value % divisor + divisor) % divisor;

    for (let row = 0, y = 0; y < height; row += 1, y += 72) {
      let x = -cycleWidth;
      let column = -colors.length;
      while (x < width) {
        const index = modulo(column, colors.length);
        const baseWidth = widths[index];
        const holdRows = 1 + modulo(column, 3);
        const group = Math.floor((row + modulo(column, holdRows)) / holdRows);
        const variation = (randomUnit(column, group) * 2 - 1) * Math.min(76, baseWidth * 0.55) * 0.65;
        const bandWidth = Math.max(24, baseWidth + variation);
        if (x + bandWidth > 0) {
          context.fillStyle = colors[index];
          context.fillRect(Math.floor(x), Math.floor(y), Math.ceil(bandWidth) + 1, 73);
        }
        x += bandWidth;
        column += 1;
      }
    }
  };

  const setCarousel = (nextIndex, { restart = true } = {}) => {
    carouselIndex = (nextIndex + carouselSlides.length) % carouselSlides.length;
    carouselTrack?.style.setProperty('--home-carousel-index', String(carouselIndex));
    carouselSlides.forEach((slide, index) => {
      const isHidden = index !== carouselIndex;
      const slideLink = slide.querySelector('a[href]');
      slide.setAttribute('aria-hidden', String(isHidden));
      slide.inert = isHidden;
      if (isHidden) {
        slideLink?.setAttribute('tabindex', '-1');
      } else {
        slideLink?.removeAttribute('tabindex');
      }
    });
    carouselDots.forEach((dot, index) => {
      if (index === carouselIndex) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });

    if (restart) startCarousel();
  };

  const stopCarousel = () => {
    window.clearInterval(carouselTimer);
  };

  const startCarousel = () => {
    stopCarousel();
    if (reducedMotion.matches) return;
    carouselTimer = window.setInterval(() => setCarousel(carouselIndex + 1, { restart: false }), 6800);
  };

  carouselViewport?.addEventListener('pointerdown', (event) => {
    if (desktop.matches || !event.isPrimary || event.button !== 0) return;
    carouselSwipeStart = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    carouselViewport.setPointerCapture(event.pointerId);
    stopCarousel();
  });

  carouselViewport?.addEventListener('pointerup', (event) => {
    if (!carouselSwipeStart || event.pointerId !== carouselSwipeStart.pointerId) return;

    const deltaX = event.clientX - carouselSwipeStart.x;
    const deltaY = event.clientY - carouselSwipeStart.y;
    carouselSwipeStart = undefined;
    carouselViewport.releasePointerCapture(event.pointerId);

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) {
      startCarousel();
      return;
    }

    event.preventDefault();
    suppressCarouselClick = true;
    window.clearTimeout(suppressCarouselClickTimer);
    suppressCarouselClickTimer = window.setTimeout(() => {
      suppressCarouselClick = false;
    }, 500);
    setCarousel(carouselIndex + (deltaX < 0 ? 1 : -1));
  });

  carouselViewport?.addEventListener('pointercancel', (event) => {
    if (!carouselSwipeStart || event.pointerId !== carouselSwipeStart.pointerId) return;
    carouselSwipeStart = undefined;
    startCarousel();
  });

  carouselViewport?.addEventListener(
    'click',
    (event) => {
      if (!suppressCarouselClick) return;
      suppressCarouselClick = false;
      window.clearTimeout(suppressCarouselClickTimer);
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  previousButton?.addEventListener('click', () => setCarousel(carouselIndex - 1));
  nextButton?.addEventListener('click', () => setCarousel(carouselIndex + 1));
  carouselDots.forEach((dot, index) => {
    dot.addEventListener('click', () => setCarousel(index));
  });
  carousel?.addEventListener('pointerenter', stopCarousel);
  carousel?.addEventListener('pointerleave', startCarousel);
  carousel?.addEventListener('focusin', stopCarousel);
  carousel?.addEventListener('focusout', startCarousel);
  lastHeaderTab?.addEventListener('transitionend', (event) => {
    if (
      event.target === lastHeaderTab &&
      event.propertyName === 'transform' &&
      document.body.classList.contains('is-home-header-compact')
    ) {
      window.clearTimeout(headerRevealTimer);
      document.body.classList.remove('is-home-header-tabs-revealing');
    }
  });

  const updateMobileLanding = (frameTime = performance.now()) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const heroHeight = hero?.getBoundingClientRect().height || viewportHeight * 0.68;
    const headerCompact = scrollTop > Math.min(heroHeight * 0.2, 96);

    document.body.classList.toggle('is-home-mobile-header-compact', headerCompact);

    const landingSectionRects = readLandingSectionRects();
    const mobileNotesRect = notesBand
      ? landingSectionRects.get(notesBand)
      : undefined;
    const mobileFooterRect = footer?.getBoundingClientRect();
    const mobileDockTargetRect = dockTarget?.getBoundingClientRect();
    const wnpxCamoRect = wnpxCamo?.parentElement?.getBoundingClientRect();

    const mobileGriffonAspect = 865.25 / 780.54;
    const mobileBaseWidth = clamp(viewportWidth * 1.16, 432, 592);
    const mobileBaseRight = clamp(viewportWidth * -0.34, -224, -112);
    const mobileBaseLeft =
      viewportWidth - mobileBaseWidth - mobileBaseRight;
    const mobileHeroTravel = reducedMotion.matches
      ? 0
      : mix(
          0,
          clamp(viewportHeight * 0.05, 30, 40),
          smoothstep(clamp(scrollTop / Math.max(1, heroHeight * 1.5), 0, 1))
        );
    const mobileBaseTop = -96 + mobileHeroTravel;
    const mobileNotesProgress = mobileNotesRect
      ? smoothstep(
          clamp(
            (viewportHeight - mobileNotesRect.top) /
              Math.max(1, viewportHeight * 0.58),
            0,
            1
          )
        )
      : 0;
    const mobileNotesFaceY = mobileNotesRect
      ? mobileNotesRect.top +
        clamp(mobileNotesRect.height * 0.36, 116, 156)
      : viewportHeight * 0.5;
    const mobileNotesTop =
      mobileNotesFaceY -
      mobileBaseWidth * mobileGriffonAspect * 0.54;
    const mobileNotesLeft = mobileBaseLeft;
    const mobileSourceTop = mix(
      mobileBaseTop,
      mobileNotesTop,
      mobileNotesProgress
    );
    const mobileSourceLeft = mix(
      mobileBaseLeft,
      mobileNotesLeft,
      mobileNotesProgress
    );
    const mobileMaxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - viewportHeight
    );
    const mobileBottomDistance = Math.max(0, mobileMaxScroll - scrollTop);
    const mobileFooterBottom = mobileFooterRect?.bottom ?? Infinity;
    const mobileBottomEnterDistance = 32;
    const mobileBottomExitDistance = 40;
    const mobileReachedBottom =
      mobileBottomDistance <= mobileBottomEnterDistance ||
      mobileFooterBottom <= viewportHeight + mobileBottomEnterDistance;
    if (mobileReachedBottom) {
      mobileBottomLatched = true;
    } else if (
      mobileBottomLatched &&
      mobileScrollIntent < 0 &&
      mobileBottomDistance > mobileBottomExitDistance
    ) {
      mobileBottomLatched = false;
    }
    const mobileAtBottom = mobileBottomLatched;
    let mobileNeedsDockFrame = false;

    if (reducedMotion.matches) {
      dockProgress = mobileAtBottom ? 1 : 0;
      dockHoldStarted = 0;
      dockMotionStarted = 0;
      undockMotionStarted = 0;
      undockStartProgress = 0;
    } else {
      if (
        !mobileAtBottom &&
        mobileScrollIntent < 0 &&
        dockProgress > 0 &&
        !undockMotionStarted
      ) {
        dockHoldStarted = 0;
        dockMotionStarted = 0;
        undockMotionStarted = frameTime;
        undockStartProgress = dockProgress;
      }

      if (undockMotionStarted) {
        const mobileUndockProgress = clamp(
          (frameTime - undockMotionStarted) / 520,
          0,
          1
        );
        dockProgress =
          undockStartProgress * (1 - smoothstep(mobileUndockProgress));
        mobileNeedsDockFrame = mobileUndockProgress < 1;

        if (mobileUndockProgress >= 1) {
          dockProgress = 0;
          undockMotionStarted = 0;
          undockStartProgress = 0;
          mobileNeedsDockFrame = mobileAtBottom;
        }
      } else if (!mobileAtBottom) {
        dockHoldStarted = 0;
        dockMotionStarted = 0;
        dockProgress = 0;
      } else {
        if (dockProgress > 0 && !dockMotionStarted) {
          const mobileResumedProgress = inverseEaseOutCubic(
            clamp(dockProgress, 0, 1)
          );
          dockMotionStarted =
            frameTime - mobileResumedProgress * 520;
        } else if (!dockHoldStarted && dockProgress <= 0) {
          dockHoldStarted = frameTime;
          dockMotionStarted = 0;
          dockProgress = 0;
        }

        const mobileHeldFor = dockHoldStarted
          ? frameTime - dockHoldStarted
          : 220;
        if (!dockMotionStarted && mobileHeldFor < 220) {
          dockProgress = 0;
          mobileNeedsDockFrame = true;
        } else {
          if (!dockMotionStarted) dockMotionStarted = frameTime;
          const mobileMotionProgress = clamp(
            (frameTime - dockMotionStarted) / 520,
            0,
            1
          );
          dockProgress = easeOutCubic(mobileMotionProgress);
          mobileNeedsDockFrame = mobileMotionProgress < 1;
        }
      }
    }

    const mobileDockProgress = dockProgress;
    let mobileGriffonWidth = mobileBaseWidth;
    let mobileGriffonLeft = mobileSourceLeft;
    let mobileGriffonTop = mobileSourceTop;

    if (mobileDockTargetRect && mobileDockProgress > 0) {
      mobileGriffonWidth = mix(
        mobileBaseWidth,
        mobileDockTargetRect.width,
        mobileDockProgress
      );
      mobileGriffonLeft = mix(
        mobileSourceLeft,
        mobileDockTargetRect.left,
        mobileDockProgress
      );
      mobileGriffonTop = mix(
        mobileSourceTop,
        mobileDockTargetRect.top,
        mobileDockProgress
      );
    }

    if (griffon) {
      setLandingStyleProperty(
        griffon.style,
        'width',
        `${mobileGriffonWidth.toFixed(2)}px`
      );
      setLandingStyleProperty(
        griffon.style,
        'left',
        `${mobileGriffonLeft.toFixed(2)}px`
      );
      setLandingStyleProperty(
        griffon.style,
        'top',
        `${mobileGriffonTop.toFixed(2)}px`
      );
      griffon.classList.toggle('is-docking', mobileDockProgress > 0);
      griffon.classList.toggle(
        'is-undocking',
        Boolean(undockMotionStarted)
      );
    }

    const griffonRect = griffon?.getBoundingClientRect();
    if (griffonRect) {
      griffonLayers.forEach(({ surface, layer }) => {
        const surfaceRect = landingSectionRects.get(surface);
        if (!surfaceRect) return;
        const visibleTop = Math.max(griffonRect.top, surfaceRect.top);
        const visibleBottom = Math.min(griffonRect.bottom, surfaceRect.bottom);

        if (visibleBottom <= visibleTop) {
          setLandingStyleProperty(layer.style, 'clip-path', 'inset(0 0 100% 0)');
          setLandingStyleProperty(layer.style, 'opacity', '0');
          return;
        }

        const clipTop = clamp(visibleTop - griffonRect.top, 0, griffonRect.height);
        const clipBottom = clamp(
          griffonRect.bottom - visibleBottom,
          0,
          griffonRect.height
        );
        setLandingStyleProperty(
          layer.style,
          'clip-path',
          `inset(${clipTop.toFixed(2)}px 0 ${clipBottom.toFixed(2)}px 0)`
        );
        const mobileSurfaceOpacity = surface.classList.contains(
          'home-link-band--parent'
        )
          ? 0.7
          : 1;
        setLandingStyleProperty(
          layer.style,
          'opacity',
          String(mobileSurfaceOpacity * (1 - mobileDockProgress))
        );
      });
      setLandingStyleProperty(
        dockLayer.style,
        'opacity',
        String(mobileDockProgress)
      );
    }

    parallaxSections.forEach((section) => {
      if (reducedMotion.matches) {
        removeLandingStyleProperty(section.style, '--home-parallax-near');
        removeLandingStyleProperty(section.style, '--home-parallax-mid');
        removeLandingStyleProperty(section.style, '--home-parallax-far');
        removeLandingStyleProperty(section.style, '--home-parallax-back');
        return;
      }

      const rect = landingSectionRects.get(section);
      if (!rect) return;
      if (!isLandingSectionNearby(rect, viewportHeight)) return;
      const distance = rect.top + rect.height * 0.5 - viewportHeight * 0.5;
      setLandingStyleProperty(
        section.style,
        '--home-parallax-near',
        `${clamp(distance * -0.18, -104, 104).toFixed(2)}px`
      );
      setLandingStyleProperty(
        section.style,
        '--home-parallax-mid',
        `${clamp(distance * -0.11, -68, 68).toFixed(2)}px`
      );
      setLandingStyleProperty(
        section.style,
        '--home-parallax-far',
        `${clamp(distance * -0.06, -40, 40).toFixed(2)}px`
      );
      setLandingStyleProperty(
        section.style,
        '--home-parallax-back',
        `${clamp(distance * 0.022, -20, 20).toFixed(2)}px`
      );
    });

    subsiteSections.forEach((section) => {
      const rect = landingSectionRects.get(section);
      if (!rect) return;
      if (!isLandingSectionNearby(rect, viewportHeight)) return;
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(viewportHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const availableHeight = Math.max(1, Math.min(rect.height, viewportHeight));
      const visibleRatio = clamp(visibleHeight / availableHeight, 0, 1);
      const focus = smoothstep(clamp((visibleRatio - 0.2) / 0.62, 0, 1));
      setLandingStyleProperty(section.style, '--home-subsite-focus', focus.toFixed(4));
      setLandingStyleProperty(
        section.style,
        '--home-subsite-dim',
        (0.5 * (1 - focus)).toFixed(4)
      );
      setLandingStyleProperty(
        section.style,
        '--home-subsite-brightness',
        mix(0.34, 1, focus).toFixed(4)
      );
    });

    drawWnpxCamo(wnpxCamoRect);
    lastScrollTop = scrollTop;
    if (mobileNeedsDockFrame) requestLandingUpdate();
  };

  const updateLanding = (frameTime = performance.now()) => {
    scrollFrame = undefined;
    if (!desktop.matches) {
      updateMobileLanding(frameTime);
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const collapseDistance = 392;
    const headerProgress = clamp(scrollTop / collapseDistance, 0, 1);
    const headerHeight = mix(480, 88, headerProgress);
    const brandStartTop = clamp(viewportHeight * 0.1, 48, 96);
    const brandStartLeft = clamp(viewportWidth * 0.05, 32, 72);

    setLandingStyleProperty(rootStyle, '--home-hero-height', `${headerHeight.toFixed(2)}px`);
    setLandingStyleProperty(
      rootStyle,
      '--home-brand-scale',
      mix(1, 0.37, headerProgress).toFixed(4)
    );
    setLandingStyleProperty(
      rootStyle,
      '--home-brand-top',
      `${mix(brandStartTop, 16, headerProgress).toFixed(2)}px`
    );
    setLandingStyleProperty(
      rootStyle,
      '--home-brand-left',
      `${brandStartLeft.toFixed(2)}px`
    );
    setLandingStyleProperty(
      rootStyle,
      '--home-fan-label-gap',
      `${mix(1.5, 0.35, headerProgress).toFixed(3)}rem`
    );
    setLandingStyleProperty(
      rootStyle,
      '--home-fan-label-scale',
      mix(1, 1.38, headerProgress).toFixed(4)
    );
    const headerCompact = headerProgress > 0.985;
    document.body.classList.toggle('is-home-header-compact', headerCompact);
    if (headerCompact && !headerWasCompact) {
      window.clearTimeout(headerRevealTimer);
      document.body.classList.add('is-home-header-tabs-revealing');
      headerRevealTimer = window.setTimeout(() => {
        document.body.classList.remove('is-home-header-tabs-revealing');
      }, 760);
    } else if (!headerCompact) {
      window.clearTimeout(headerRevealTimer);
      document.body.classList.remove('is-home-header-tabs-revealing');
    }
    headerWasCompact = headerCompact;
    if (headerNav) {
      headerNav.toggleAttribute('inert', !headerCompact);
      headerNav.setAttribute('aria-hidden', String(!headerCompact));
    }

    const landingSectionRects = readLandingSectionRects();
    const notesRect = notesBand
      ? landingSectionRects.get(notesBand)
      : undefined;
    const firstSubsiteRect = firstSubsite
      ? landingSectionRects.get(firstSubsite)
      : undefined;
    const footerRect = footer?.getBoundingClientRect();
    const targetRect = dockTarget?.getBoundingClientRect();
    const wnpxCamoRect = wnpxCamo?.parentElement?.getBoundingClientRect();

    const griffonAspect = 865.25 / 780.54;
    const griffonAnchorWidth = clamp(viewportWidth * 0.46, 460, 760);
    const baseWidth = griffonAnchorWidth * 2;
    const baseHeight = baseWidth * griffonAspect;
    const baseLeft =
      viewportWidth -
      griffonAnchorWidth +
      clamp(viewportWidth * 0.04, 20, 64);
    const baseTop = -baseHeight * 0.385;
    const idleDriftProgress = smoothstep(clamp(scrollTop / 2400, 0, 1));
    const idleDrift = reducedMotion.matches
      ? 0
      : mix(
          0,
          clamp(viewportHeight * 0.035, 24, 36),
          idleDriftProgress
        );
    const notesReady = Boolean(
      notesRect &&
      firstSubsiteRect &&
      firstSubsiteRect.top <= 88
    );
    const notesWidth = baseWidth;
    const notesLeft = baseLeft;
    const footerHeight = footerRect?.height || 250;
    const notesHeight = notesRect?.height || 480;
    const notesFaceCenter =
      viewportHeight - footerHeight - notesHeight * 0.5;
    const notesVisibleProgress = notesRect
      ? smoothstep(
          clamp(
            (viewportHeight - notesRect.top) /
              Math.max(1, notesHeight + footerHeight),
            0,
            1
          )
        )
      : 0;
    const notesLocalDrift = mix(-8, 0, notesVisibleProgress);
    const notesTop =
      notesFaceCenter - baseHeight * 0.515 + notesLocalDrift;
    const notesPreparationProgress = firstSubsiteRect
      ? smoothstep(
          clamp(
            (88 - firstSubsiteRect.top) /
              Math.max(1, firstSubsiteRect.height),
            0,
            1
          )
        )
      : 0;
    const notesSlideProgress = reducedMotion.matches
      ? Number(notesReady)
      : notesPreparationProgress;
    const sourceWidth = baseWidth;
    const sourceLeft = baseLeft;
    const sourceTop = notesReady
      ? mix(baseTop + idleDrift, notesTop, notesSlideProgress)
      : baseTop + idleDrift;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    const bottomDistance = Math.max(0, maxScroll - scrollTop);
    const atBottom = bottomDistance <= 1;
    const scrollingUp = scrollTop < lastScrollTop - 0.5;
    let needsDockFrame = false;

    if (reducedMotion.matches) {
      dockProgress = atBottom && !scrollingUp ? 1 : 0;
      dockHoldStarted = 0;
      dockMotionStarted = 0;
      undockMotionStarted = 0;
      undockStartProgress = 0;
    } else {
      if (
        scrollingUp &&
        dockProgress > 0 &&
        !undockMotionStarted
      ) {
        dockHoldStarted = 0;
        dockMotionStarted = 0;
        undockMotionStarted = frameTime;
        undockStartProgress = dockProgress;
      }

      if (undockMotionStarted) {
        const undockProgress = clamp(
          (frameTime - undockMotionStarted) / 520,
          0,
          1
        );
        dockProgress =
          undockStartProgress * (1 - smoothstep(undockProgress));
        needsDockFrame = undockProgress < 1;

        if (undockProgress >= 1) {
          dockProgress = 0;
          undockMotionStarted = 0;
          undockStartProgress = 0;
          needsDockFrame = atBottom;
        }
      } else if (!atBottom) {
        dockHoldStarted = 0;
        dockMotionStarted = 0;
        dockProgress = 0;
      } else {
        if (dockProgress > 0 && !dockMotionStarted) {
          const resumedProgress = inverseEaseOutCubic(
            clamp(dockProgress, 0, 1)
          );
          dockMotionStarted = frameTime - resumedProgress * 520;
        } else if (!dockHoldStarted && dockProgress <= 0) {
          dockHoldStarted = frameTime;
          dockMotionStarted = 0;
          dockProgress = 0;
        }

        const heldFor = dockHoldStarted
          ? frameTime - dockHoldStarted
          : 220;
        if (!dockMotionStarted && heldFor < 220) {
          dockProgress = 0;
          needsDockFrame = true;
        } else {
          if (!dockMotionStarted) dockMotionStarted = frameTime;
          const motionProgress = clamp(
            (frameTime - dockMotionStarted) / 520,
            0,
            1
          );
          dockProgress = easeOutCubic(motionProgress);
          needsDockFrame = motionProgress < 1;
        }
      }
    }

    let width = sourceWidth;
    let left = sourceLeft;
    let top = sourceTop;
    if (targetRect && dockProgress > 0) {
      width = mix(sourceWidth, targetRect.width, dockProgress);
      left = mix(sourceLeft, targetRect.left, dockProgress);
      top = mix(sourceTop, targetRect.top, dockProgress);
    }

    setLandingStyleProperty(griffon.style, 'width', `${width.toFixed(2)}px`);
    setLandingStyleProperty(griffon.style, 'left', `${left.toFixed(2)}px`);
    setLandingStyleProperty(griffon.style, 'top', `${top.toFixed(2)}px`);
    griffon.classList.toggle('is-docking', dockProgress > 0);

    const griffonHeight = width * griffonAspect;
    const griffonBottom = top + griffonHeight;
    const hideGriffonForSubsites = Boolean(
      notesReady &&
      notesRect &&
      notesRect.top >= viewportHeight
    );
    griffonLayers.forEach(({ surface, layer }) => {
      if (hideGriffonForSubsites) {
        setLandingStyleProperty(layer.style, 'clip-path', 'inset(0 0 100% 0)');
        setLandingStyleProperty(layer.style, 'opacity', '0');
        return;
      }

      const rect = landingSectionRects.get(surface);
      if (!rect) return;
      const visibleTop = Math.max(top, rect.top);
      const visibleBottom = Math.min(griffonBottom, rect.bottom);

      if (visibleBottom <= visibleTop || dockProgress >= 1) {
        setLandingStyleProperty(layer.style, 'clip-path', 'inset(0 0 100% 0)');
        setLandingStyleProperty(layer.style, 'opacity', '0');
        return;
      }

      const clipTop = clamp(visibleTop - top, 0, griffonHeight);
      const clipBottom = clamp(griffonBottom - visibleBottom, 0, griffonHeight);
      setLandingStyleProperty(
        layer.style,
        'clip-path',
        `inset(${clipTop.toFixed(2)}px 0 ${clipBottom.toFixed(2)}px 0)`
      );
      const surfaceOpacity = surface.classList.contains('home-link-band--parent')
        ? 0.7
        : 1;
      setLandingStyleProperty(
        layer.style,
        'opacity',
        String((1 - dockProgress) * surfaceOpacity)
      );
    });
    setLandingStyleProperty(dockLayer.style, 'opacity', String(dockProgress));

    parallaxSections.forEach((section) => {
      if (reducedMotion.matches) {
        removeLandingStyleProperty(section.style, '--home-parallax-near');
        removeLandingStyleProperty(section.style, '--home-parallax-mid');
        removeLandingStyleProperty(section.style, '--home-parallax-far');
        removeLandingStyleProperty(section.style, '--home-parallax-back');
        removeLandingStyleProperty(section.style, '--home-ww3-atlas-angle');
        removeLandingStyleProperty(section.style, '--home-ww3-timeline-angle');
        removeLandingStyleProperty(section.style, '--home-ww3-glossary-angle');
        return;
      }

      const rect = landingSectionRects.get(section);
      if (!rect) return;
      if (!isLandingSectionNearby(rect, viewportHeight)) return;
      const distance = rect.top + rect.height * 0.5 - viewportHeight * 0.5;
      setLandingStyleProperty(
        section.style,
        '--home-parallax-near',
        `${clamp(distance * -0.045, -44, 44).toFixed(2)}px`
      );
      setLandingStyleProperty(
        section.style,
        '--home-parallax-mid',
        `${clamp(distance * -0.095, -88, 88).toFixed(2)}px`
      );
      setLandingStyleProperty(
        section.style,
        '--home-parallax-far',
        `${clamp(distance * -0.17, -150, 150).toFixed(2)}px`
      );
      setLandingStyleProperty(
        section.style,
        '--home-parallax-back',
        `${clamp(distance * 0.032, -36, 36).toFixed(2)}px`
      );

      if (section.classList.contains('home-link-band--mu3')) {
        const openStart = viewportHeight * 0.92;
        const openEnd = viewportHeight * 0.08;
        const pageOpen = smoothstep(
          clamp((openStart - rect.top) / Math.max(1, openStart - openEnd), 0, 1)
        );
        setLandingStyleProperty(
          section.style,
          '--home-ww3-atlas-angle',
          `${(-46 + pageOpen * 11).toFixed(2)}deg`
        );
        setLandingStyleProperty(
          section.style,
          '--home-ww3-timeline-angle',
          `${(-42 + pageOpen * 12).toFixed(2)}deg`
        );
        setLandingStyleProperty(
          section.style,
          '--home-ww3-glossary-angle',
          `${(-38 + pageOpen * 13).toFixed(2)}deg`
        );
      }
    });

    subsiteSections.forEach((section) => {
      const rect = landingSectionRects.get(section);
      if (!rect) return;
      if (!isLandingSectionNearby(rect, viewportHeight)) return;
      const visibleTop = Math.max(88, rect.top);
      const visibleBottom = Math.min(viewportHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const availableHeight = Math.max(1, Math.min(rect.height, viewportHeight - 88));
      const visibleRatio = clamp(visibleHeight / availableHeight, 0, 1);
      const focus = smoothstep(clamp((visibleRatio - 0.38) / 0.52, 0, 1));
      setLandingStyleProperty(section.style, '--home-subsite-focus', focus.toFixed(4));
      setLandingStyleProperty(
        section.style,
        '--home-subsite-dim',
        (0.62 * (1 - focus)).toFixed(4)
      );
      setLandingStyleProperty(
        section.style,
        '--home-subsite-brightness',
        mix(0.58, 1, focus).toFixed(4)
      );
    });

    drawWnpxCamo(wnpxCamoRect);
    lastScrollTop = scrollTop;
    if (needsDockFrame) requestLandingUpdate();
  };

  const requestLandingUpdate = () => {
    if (scrollFrame !== undefined) return;
    scrollFrame = window.requestAnimationFrame(updateLanding);
  };

  const syncLandingMode = () => {
    stopCarousel();
    if (scrollFrame !== undefined) {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = undefined;
    }
    lastScrollTop = window.scrollY;

    if (desktop.matches) {
      setMobileMenuOpen(false);
      document.body.classList.remove('is-home-mobile-header-compact');
      setCarousel(carouselIndex, { restart: false });
      startCarousel();
      requestLandingUpdate();
    } else {
      document.body.classList.remove('is-home-header-compact');
      document.body.classList.remove('is-home-header-tabs-revealing');
      window.clearTimeout(headerRevealTimer);
      headerWasCompact = false;
      if (headerNav) {
        headerNav.toggleAttribute('inert', !mobileMenuOpen);
        headerNav.setAttribute('aria-hidden', String(!mobileMenuOpen));
      }
      rootStyle.removeProperty('--home-hero-height');
      rootStyle.removeProperty('--home-brand-scale');
      rootStyle.removeProperty('--home-brand-top');
      rootStyle.removeProperty('--home-brand-left');
      rootStyle.removeProperty('--home-fan-label-scale');
      griffon.removeAttribute('style');
      griffonLayers.forEach(({ layer }) => {
        layer.style.removeProperty('clip-path');
        layer.style.removeProperty('opacity');
      });
      dockLayer.style.removeProperty('opacity');
      parallaxSections.forEach((section) => {
        section.style.removeProperty('--home-parallax-near');
        section.style.removeProperty('--home-parallax-mid');
        section.style.removeProperty('--home-parallax-far');
        section.style.removeProperty('--home-parallax-back');
        section.style.removeProperty('--home-ww3-atlas-angle');
        section.style.removeProperty('--home-ww3-timeline-angle');
        section.style.removeProperty('--home-ww3-glossary-angle');
      });
      subsiteSections.forEach((section) => {
        section.style.removeProperty('--home-subsite-focus');
        section.style.removeProperty('--home-subsite-dim');
        section.style.removeProperty('--home-subsite-brightness');
      });
      dockProgress = 0;
      dockHoldStarted = 0;
      dockMotionStarted = 0;
      undockMotionStarted = 0;
      undockStartProgress = 0;
      mobileBottomLatched = false;
      mobileScrollIntent = 0;
      mobileTouchY = null;
      griffon.classList.remove('is-docking');
      griffon.classList.remove('is-undocking');
      camoWidth = 0;
      camoHeight = 0;
      camoPixelRatio = 0;
      setCarousel(carouselIndex, { restart: false });
      startCarousel();
      requestLandingUpdate();
    }
  };

  landing.addEventListener(
    'touchstart',
    (event) => {
      mobileTouchY = event.touches[0]?.clientY ?? null;
      mobileScrollIntent = 0;
    },
    { passive: true }
  );

  landing.addEventListener(
    'touchmove',
    (event) => {
      const touchY = event.touches[0]?.clientY;
      if (!Number.isFinite(touchY)) return;
      if (mobileTouchY === null) {
        mobileTouchY = touchY;
        return;
      }

      const touchDelta = touchY - mobileTouchY;
      if (Math.abs(touchDelta) < 2) return;
      mobileScrollIntent = touchDelta < 0 ? 1 : -1;
      mobileTouchY = touchY;
      requestLandingUpdate();
    },
    { passive: true }
  );

  const clearMobileTouch = () => {
    mobileTouchY = null;
  };
  landing.addEventListener('touchend', clearMobileTouch, { passive: true });
  landing.addEventListener('touchcancel', clearMobileTouch, { passive: true });

  window.addEventListener(
    'wheel',
    (event) => {
      if (desktop.matches || Math.abs(event.deltaY) < 1) return;
      mobileScrollIntent = event.deltaY > 0 ? 1 : -1;
    },
    { passive: true }
  );

  document.addEventListener('keydown', (event) => {
    if (desktop.matches) return;
    if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) {
      mobileScrollIntent = -1;
    } else if (['ArrowDown', 'PageDown', 'End'].includes(event.key)) {
      mobileScrollIntent = 1;
    }
  });

  window.addEventListener('scroll', requestLandingUpdate, { passive: true });
  window.addEventListener('resize', requestLandingUpdate);
  if (desktop.addEventListener) {
    desktop.addEventListener('change', syncLandingMode);
    reducedMotion.addEventListener('change', syncLandingMode);
  } else {
    desktop.addListener(syncLandingMode);
    reducedMotion.addListener(syncLandingMode);
  }

  header?.addEventListener('transitionend', requestLandingUpdate);
  window.addEventListener('pageshow', () => {
    mobileScrollIntent = 0;
    mobileTouchY = null;
    lastScrollTop = window.scrollY;
    requestLandingUpdate();
  });
  syncLandingMode();
})();

(() => {
  if (!document.body.classList.contains('catalog-detail-page')) return;

  const main = document.querySelector('main#main-content');
  if (!main) return;

  const sections = [...main.querySelectorAll(':scope > .content-panel')]
    .map((section) => ({
      section,
      heading: section.querySelector(':scope > h2'),
      body: section.querySelector(':scope > .content-panel__body'),
    }))
    .filter(({ heading, body }) => heading && body);
  if (!sections.length) return;

  const mobileDetailMedia = window.matchMedia('(max-width: 760px)');

  const getHashTarget = (hash = window.location.hash) => {
    if (!hash?.startsWith('#') || hash.length < 2) return null;

    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return null;
    }
  };

  const getTargetSection = (target) => {
    const section = target?.closest('.content-panel');
    return section?.parentElement === main ? section : null;
  };

  const notifySectionLayoutChange = () => {
    document.dispatchEvent(new Event('catalog-section-toggle'));
  };

  const setSectionExpanded = (entry, expanded, notify = true) => {
    const { section, heading, body } = entry;
    const toggle = heading.querySelector(':scope > .catalog-section-toggle');
    if (!toggle) return;

    toggle.setAttribute('aria-expanded', String(expanded));
    body.hidden = !expanded;
    section.classList.toggle('is-mobile-collapsed', !expanded);

    if (notify) notifySectionLayoutChange();
  };

  const enhanceSection = (entry) => {
    const { section, heading, body } = entry;
    if (heading.querySelector(':scope > .catalog-section-toggle')) return;

    if (!body.id) {
      body.id = `${section.id || 'catalog-section'}-content`;
    }

    const toggle = document.createElement('button');
    toggle.className = 'catalog-section-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', body.id);
    while (heading.firstChild) {
      toggle.append(heading.firstChild);
    }
    heading.append(toggle);
    section.classList.add('is-mobile-collapsible');
    setSectionExpanded(entry, false, false);

    toggle.addEventListener('click', () => {
      setSectionExpanded(entry, toggle.getAttribute('aria-expanded') !== 'true');
    });

    toggle.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle.click();
    });
  };

  const restoreSection = ({ section, heading, body }) => {
    const toggle = heading.querySelector(':scope > .catalog-section-toggle');
    if (toggle) {
      toggle.replaceWith(...toggle.childNodes);
    }

    body.hidden = false;
    section.classList.remove('is-mobile-collapsible', 'is-mobile-collapsed');
  };

  const expandHashTarget = (scrollToTarget = false) => {
    if (!mobileDetailMedia.matches) return false;

    const target = getHashTarget();
    const targetSection = getTargetSection(target);
    const entry = sections.find(({ section }) => section === targetSection);
    if (!entry) return false;

    setSectionExpanded(entry, true, false);
    if (scrollToTarget) {
      window.requestAnimationFrame(() => target.scrollIntoView());
    }
    notifySectionLayoutChange();
    return true;
  };

  const syncDetailSections = () => {
    if (mobileDetailMedia.matches) {
      sections.forEach(enhanceSection);
      expandHashTarget(Boolean(window.location.hash));
    } else {
      sections.forEach(restoreSection);
      notifySectionLayoutChange();
    }
  };

  document.addEventListener(
    'click',
    (event) => {
      if (!mobileDetailMedia.matches) return;

      const link = event.target.closest('a[href^="#"]');
      const target = link ? getHashTarget(link.getAttribute('href')) : null;
      const targetSection = getTargetSection(target);
      const entry = sections.find(({ section }) => section === targetSection);
      if (entry) setSectionExpanded(entry, true);
    },
    true,
  );

  document.addEventListener('site-search-reveal', (event) => {
    if (!mobileDetailMedia.matches) return;
    const targetSection = getTargetSection(event.detail?.target);
    const entry = sections.find(({ section }) => section === targetSection);
    if (entry) setSectionExpanded(entry, true);
  });

  window.addEventListener('hashchange', () => expandHashTarget(true));
  window.addEventListener('pageshow', () => {
    if (window.location.hash) expandHashTarget(true);
  });
  if (mobileDetailMedia.addEventListener) {
    mobileDetailMedia.addEventListener('change', syncDetailSections);
  } else {
    mobileDetailMedia.addListener(syncDetailSections);
  }

  syncDetailSections();
})();

(() => {
  const nav = document.querySelector('.page-nav');
  if (!nav) return;

  const catalogDetailSubtrees = [];
  let activeLink;

  const syncCatalogDetailActiveMarker = () => {
    catalogDetailSubtrees.forEach((item) => {
      const parentLink = item.querySelector(':scope > a[href^="#"]');
      const subtree = item.querySelector(':scope > ul');
      const hasActiveChild = Boolean(activeLink && subtree?.contains(activeLink));
      const showMarkerOnParent =
        hasActiveChild && !item.classList.contains('is-subtree-open');

      parentLink?.classList.toggle(
        'is-scroll-parent-active',
        showMarkerOnParent,
      );
    });
  };

  const setCatalogDetailSubtreeOpen = (item, open) => {
    const toggle = item.querySelector(':scope > .page-nav__subtree-toggle');
    if (!toggle) return;

    const parentLink = item.querySelector(':scope > a[href^="#"]');
    const label = parentLink?.textContent.replace(/\s+/g, ' ').trim() || 'この項目';
    item.classList.toggle('is-subtree-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute(
      'aria-label',
      `${label}の下位項目を${open ? '閉じる' : '開く'}`,
    );
    syncCatalogDetailActiveMarker();
  };

  if (document.body.classList.contains('catalog-detail-page')) {
    const topLevelItems = nav.querySelectorAll(':scope > ul > li');
    let subtreeIndex = 0;

    topLevelItems.forEach((item) => {
      const parentLink = item.querySelector(':scope > a[href^="#"]');
      const subtree = item.querySelector(':scope > ul');
      if (!parentLink || !subtree) return;

      subtreeIndex += 1;
      if (!subtree.id) {
        subtree.id = `page-nav-subtree-${subtreeIndex}`;
      }

      const toggle = document.createElement('button');
      toggle.className = 'page-nav__subtree-toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-controls', subtree.id);
      toggle.setAttribute('aria-expanded', 'false');

      item.classList.add('page-nav__item--collapsible');
      item.insertBefore(toggle, parentLink);
      catalogDetailSubtrees.push(item);
      setCatalogDetailSubtreeOpen(
        item,
        window.matchMedia('(min-width: 761px)').matches,
      );

      const toggleSubtree = () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        setCatalogDetailSubtreeOpen(item, open);
      };

      toggle.addEventListener('click', toggleSubtree);
      toggle.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggleSubtree();
      });
    });
  }

  const itemSelector = document.body.classList.contains('mu3-page--gloss')
    ? ':scope > ul > li > a[href^="#"]'
    : 'a[href^="#"]';
  const items = [...nav.querySelectorAll(itemSelector)]
    .map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      return target ? { link, target } : null;
    })
    .filter(Boolean);

  if (!items.length) return;

  const isHomeSectionNav = document.body.matches(
    '.home-page, .info-page, .news-page, .catalog-page, .tips-page, .notes-page',
  );
  const mobileNavMedia = window.matchMedia('(max-width: 760px)');
  const siteShell = nav.closest('.site-shell');
  const topLevelList = nav.querySelector(':scope > ul');
  let mobileToggle;
  let mobileLabel;
  let mobileIndicator;
  let mobileStateFrame;
  let mobileNavRowHeight = 0;

  const syncMobileNavRowHeight = () => {
    if (!siteShell) return;

    if (!mobileNavMedia.matches) {
      siteShell.style.removeProperty('--mobile-page-nav-row-height');
      mobileNavRowHeight = 0;
      return;
    }

    if (!mobileToggle || nav.classList.contains('is-mobile-stuck')) return;

    siteShell.style.removeProperty('--mobile-page-nav-row-height');
    const expandedHeight = nav.getBoundingClientRect().height;
    if (expandedHeight <= 0) return;

    siteShell.style.setProperty(
      '--mobile-page-nav-row-height',
      `${expandedHeight}px`,
    );
    mobileNavRowHeight = expandedHeight;
  };

  const getLinkLabel = (link) => link.textContent.replace(/\s+/g, ' ').trim();
  const getHierarchyLabel = (link) => {
    const labels = [];
    let item = link.closest('li');

    while (item) {
      const itemLink = item.querySelector(':scope > a[href^="#"]');
      if (itemLink) {
        labels.unshift(getLinkLabel(itemLink));
      }

      const parentList = item.parentElement;
      if (parentList === topLevelList) break;
      item = parentList?.closest('li');
    }

    return labels.join(' - ');
  };

  const updateMobileToggle = () => {
    if (!mobileToggle || !activeLink) return;

    const label = getHierarchyLabel(activeLink);
    const isOpen = nav.classList.contains('is-mobile-open');
    mobileLabel.textContent = label;
    mobileIndicator.textContent = isOpen ? '▲' : '▼';
    mobileToggle.setAttribute('aria-expanded', String(isOpen));
    mobileToggle.setAttribute(
      'aria-label',
      `ページ内ナビを${isOpen ? '閉じる' : '開く'}（現在地：${label}）`,
    );
  };

  const setMobileNavOpen = (open) => {
    if (!mobileToggle) return;

    const shouldOpen =
      open && mobileNavMedia.matches && nav.classList.contains('is-mobile-stuck');
    nav.classList.toggle('is-mobile-open', shouldOpen);
    updateMobileToggle();
  };

  const syncMobileNavState = () => {
    mobileStateFrame = undefined;
    if (!mobileToggle) return;

    if (!mobileNavMedia.matches) {
      nav.classList.remove('is-mobile-stuck', 'is-mobile-open');
      siteShell?.classList.remove('is-mobile-nav-stuck');
      syncMobileNavRowHeight();
      updateMobileToggle();
      return;
    }

    if (!mobileNavRowHeight && !nav.classList.contains('is-mobile-stuck')) {
      syncMobileNavRowHeight();
    }

    const isStuck = window.scrollY > 0 && nav.getBoundingClientRect().top <= 0.5;
    const wasStuck = nav.classList.contains('is-mobile-stuck');
    nav.classList.toggle('is-mobile-stuck', isStuck);
    siteShell?.classList.toggle('is-mobile-nav-stuck', isStuck);
    if (!isStuck) {
      nav.classList.remove('is-mobile-open');
      if (wasStuck || !mobileNavRowHeight) {
        syncMobileNavRowHeight();
      }
    }
    updateMobileToggle();
  };

  const scheduleMobileNavState = () => {
    if (!mobileToggle || mobileStateFrame !== undefined) return;
    mobileStateFrame = window.requestAnimationFrame(syncMobileNavState);
  };

  if (isHomeSectionNav && topLevelList) {
    if (!topLevelList.id) {
      topLevelList.id = 'page-nav-items';
    }

    const pageTitleEnglish = document
      .querySelector('.page-title__english')
      ?.textContent.trim();
    const pageTitleLocal = document
      .querySelector('.page-title__local')
      ?.textContent.trim();

    if (pageTitleEnglish && pageTitleLocal) {
      const mobilePageHeading = document.createElement('li');
      mobilePageHeading.className = 'page-nav__mobile-page';

      const mobilePageEnglish = document.createElement('span');
      mobilePageEnglish.className = 'page-nav__mobile-page-english';
      mobilePageEnglish.textContent = pageTitleEnglish;

      const mobilePageLocal = document.createElement('span');
      mobilePageLocal.className = 'page-nav__mobile-page-local';
      mobilePageLocal.textContent = pageTitleLocal;

      mobilePageHeading.append(mobilePageEnglish, mobilePageLocal);
      topLevelList.prepend(mobilePageHeading);
    }

    mobileToggle = document.createElement('button');
    mobileToggle.className = 'page-nav__mobile-toggle';
    mobileToggle.type = 'button';
    mobileToggle.setAttribute('aria-controls', topLevelList.id);
    mobileToggle.setAttribute('aria-haspopup', 'true');

    mobileLabel = document.createElement('span');
    mobileLabel.className = 'page-nav__mobile-current';

    mobileIndicator = document.createElement('span');
    mobileIndicator.className = 'page-nav__mobile-indicator';
    mobileIndicator.setAttribute('aria-hidden', 'true');

    mobileToggle.append(mobileLabel, mobileIndicator);
    nav.prepend(mobileToggle);
    nav.classList.add('is-mobile-enhanced');
    syncMobileNavRowHeight();

    mobileToggle.addEventListener('click', () => {
      setMobileNavOpen(!nav.classList.contains('is-mobile-open'));
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a[href^="#"]')) {
        setMobileNavOpen(false);
      }
    });

    document.addEventListener('pointerdown', (event) => {
      if (!nav.contains(event.target)) {
        setMobileNavOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !nav.classList.contains('is-mobile-open')) return;
      setMobileNavOpen(false);
      mobileToggle.focus();
    });

    const handleMobileNavMediaChange = () => {
      mobileNavRowHeight = 0;
      scheduleMobileNavState();
    };

    if (mobileNavMedia.addEventListener) {
      mobileNavMedia.addEventListener('change', handleMobileNavMediaChange);
    } else {
      mobileNavMedia.addListener(handleMobileNavMediaChange);
    }
  }

  const root = document.documentElement;
  root.classList.add('is-scroll-initializing');
  nav.classList.add('is-scroll-initializing');

  let frame;
  let initializationTimer;
  let initializationFrame;
  let initializationCanFinish = false;

  const setActive = (link) => {
    if (link === activeLink) return;

    if (activeLink) {
      activeLink.classList.remove('is-scroll-active');
      activeLink.removeAttribute('aria-current');
    }

    activeLink = link;
    activeLink.classList.add('is-scroll-active');
    activeLink.setAttribute('aria-current', 'location');
    syncCatalogDetailActiveMarker();
    updateMobileToggle();
  };

  const update = () => {
    frame = undefined;

    const header = document.querySelector('.site-header');
    const headerBottom = header
      ? Math.max(0, header.getBoundingClientRect().bottom)
      : 0;
    const marker = window.scrollY + Math.max(headerBottom + 8, window.innerHeight * 0.28);
    const atPageEnd =
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

    let current = items[0];
    if (window.scrollY > 0 && atPageEnd) {
      current = items.at(-1);
    } else if (window.scrollY > 0) {
      for (const item of items) {
        const top = item.target.getBoundingClientRect().top + window.scrollY;
        if (top > marker) break;
        current = item;
      }
    }

    setActive(current.link);
  };

  const scheduleUpdate = () => {
    scheduleMobileNavState();

    if (nav.classList.contains('is-scroll-initializing')) {
      scheduleInitializationFinish();
      return;
    }

    if (frame !== undefined) return;
    frame = window.requestAnimationFrame(update);
  };

  const scheduleInitializationFinish = () => {
    if (!initializationCanFinish) return;

    window.clearTimeout(initializationTimer);
    window.cancelAnimationFrame(initializationFrame);
    initializationTimer = window.setTimeout(() => {
      update();
      initializationFrame = window.requestAnimationFrame(() => {
        root.classList.remove('is-scroll-initializing');
        nav.classList.remove('is-scroll-initializing');
      });
    }, 120);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  document.addEventListener('catalog-section-toggle', scheduleUpdate);
  window.addEventListener('resize', () => {
    mobileNavRowHeight = 0;
    scheduleUpdate();
  });

  const finishInitialization = () => {
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    fontsReady.then(() => {
      mobileNavRowHeight = 0;
      syncMobileNavRowHeight();
      initializationCanFinish = true;
      scheduleInitializationFinish();
    });
  };

  if (document.readyState === 'complete') {
    finishInitialization();
  } else {
    window.addEventListener('pageshow', finishInitialization, { once: true });
  }

  update();
  syncMobileNavState();
})();

(() => {
  const noteLinks = [...document.querySelectorAll('a[role="doc-noteref"][href^="#"]')];
  if (!noteLinks.length) return;

  const canHover = window.matchMedia('(hover: hover)');
  const preview = document.createElement('aside');
  const label = document.createElement('div');
  const body = document.createElement('div');
  let activeLink;
  let hideTimer;

  preview.id = 'citation-preview';
  preview.className = 'citation-preview';
  preview.setAttribute('role', 'tooltip');
  preview.hidden = true;

  label.className = 'citation-preview__label';
  body.className = 'citation-preview__body';
  preview.append(label, body);
  document.body.append(preview);

  const positionPreview = () => {
    if (preview.hidden || !activeLink) return;

    const triggerRect = activeLink.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();
    const gap = 8;
    const edge = 12;
    const centeredLeft = triggerRect.left + triggerRect.width / 2 - previewRect.width / 2;
    const left = Math.min(
      Math.max(centeredLeft, edge),
      Math.max(edge, window.innerWidth - previewRect.width - edge)
    );
    const fitsBelow = triggerRect.bottom + gap + previewRect.height <= window.innerHeight - edge;
    const top = fitsBelow
      ? triggerRect.bottom + gap
      : Math.max(edge, triggerRect.top - previewRect.height - gap);

    preview.style.left = `${Math.round(left)}px`;
    preview.style.top = `${Math.round(top)}px`;
  };

  const showPreview = (link) => {
    window.clearTimeout(hideTimer);
    const targetId = decodeURIComponent(link.hash.slice(1));
    const note = document.getElementById(targetId);
    const noteBody = note
      ?.querySelector(':scope > span:not(.citation-backrefs)');
    if (!noteBody?.textContent.trim()) return;

    activeLink = link;
    label.textContent = link.getAttribute('aria-label') || link.textContent.trim();
    const noteBodyClone = noteBody.cloneNode(true);
    body.replaceChildren(...noteBodyClone.childNodes);
    link.setAttribute('aria-describedby', preview.id);
    preview.hidden = false;
    positionPreview();
  };

  const hidePreview = (link = activeLink) => {
    window.clearTimeout(hideTimer);
    link?.removeAttribute('aria-describedby');
    if (link !== activeLink) return;

    activeLink = undefined;
    preview.hidden = true;
    preview.style.removeProperty('left');
    preview.style.removeProperty('top');
  };

  const scheduleHide = (link = activeLink) => {
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => hidePreview(link), 120);
  };

  noteLinks.forEach((link) => {
    link.addEventListener('pointerenter', () => {
      if (canHover.matches) showPreview(link);
    });
    link.addEventListener('pointerleave', () => {
      if (canHover.matches && !link.matches(':focus-visible')) scheduleHide(link);
    });
    link.addEventListener('focus', () => showPreview(link));
    link.addEventListener('blur', () => hidePreview(link));
    link.addEventListener('click', () => hidePreview(link));
  });

  preview.addEventListener('pointerenter', () => window.clearTimeout(hideTimer));
  preview.addEventListener('pointerleave', () => scheduleHide());

  window.addEventListener('resize', positionPreview);
  window.addEventListener('scroll', () => hidePreview(), { passive: true });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hidePreview();
  });
})();

(() => {
  const nav = document.querySelector('.catalog-section-nav');
  if (!nav) return;

  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const desktop = window.matchMedia('(min-width: 761px)');
  const anchorGap = 8;
  let frame;
  let initialCitationTargetAligned = false;

  const update = () => {
    frame = undefined;
    if (desktop.matches && header) {
      const headerHeight = header.getBoundingClientRect().height;
      const anchorOffset = Math.ceil(
        headerHeight + nav.getBoundingClientRect().height + anchorGap
      );
      nav.style.setProperty(
        '--catalog-section-nav-sticky-top',
        `${headerHeight}px`
      );
      root.style.setProperty(
        '--catalog-anchor-scroll-offset',
        `${anchorOffset}px`
      );
      if (!initialCitationTargetAligned) {
        initialCitationTargetAligned = true;
        window.requestAnimationFrame(() => {
          const target = document.querySelector(
            '.citation a:target, .article-references li:target'
          );
          const targetRect = target?.getBoundingClientRect();
          if (targetRect && targetRect.bottom > 0 && targetRect.top < anchorOffset) {
            target.scrollIntoView({ block: 'start' });
          }
        });
      }
    } else {
      nav.style.removeProperty('--catalog-section-nav-sticky-top');
      root.style.removeProperty('--catalog-anchor-scroll-offset');
    }

    const stickyTop = Number.parseFloat(window.getComputedStyle(nav).top) || 0;
    const isStuck =
      desktop.matches &&
      window.scrollY > 0 &&
      nav.getBoundingClientRect().top <= stickyTop + 0.5;

    nav.classList.toggle('is-stuck', isStuck);
  };

  const scheduleUpdate = () => {
    if (frame !== undefined) return;
    frame = window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  desktop.addEventListener('change', scheduleUpdate);
  update();
})();

(() => {
  const SEARCH_PARAM = 'site-search';
  const SEARCH_TERM_PARAM = 'site-search-term';
  const DASHES = /[‐‑‒–—―−ー]/g;
  const searchParams = new URLSearchParams(window.location.search);
  const rawQuery = searchParams.get(SEARCH_PARAM)?.trim();
  const main = document.querySelector('main');
  if (!rawQuery || !main) return;

  const normalize = (value) => value
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .replace(DASHES, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const resolvedTerms = searchParams.getAll(SEARCH_TERM_PARAM).map(normalize).filter(Boolean);
  const terms = [...new Set(
    resolvedTerms.length
      ? resolvedTerms
      : normalize(rawQuery).split(' ').filter(Boolean),
  )];
  if (terms.join('').length < 2) return;

  const normalizedCharacterMap = (value) => {
    const characters = Array.from(value);
    const map = [];
    let normalizedText = '';
    characters.forEach((character, characterIndex) => {
      const normalizedCharacter = character
        .normalize('NFKC')
        .toLocaleLowerCase('ja')
        .replace(DASHES, '-');
      normalizedText += normalizedCharacter;
      for (let index = 0; index < normalizedCharacter.length; index += 1) {
        map.push(characterIndex);
      }
    });
    return { characters, map, normalizedText };
  };

  const rangesForText = (value) => {
    const { characters, map, normalizedText } = normalizedCharacterMap(value);
    const ranges = [];
    terms.forEach((term) => {
      let from = 0;
      while (from < normalizedText.length) {
        const found = normalizedText.indexOf(term, from);
        if (found < 0) break;
        const start = map[found];
        const end = map[found + term.length - 1] + 1;
        if (Number.isInteger(start) && Number.isInteger(end)) ranges.push([start, end]);
        from = found + Math.max(1, term.length);
      }
    });
    ranges.sort((left, right) => left[0] - right[0] || left[1] - right[1]);

    const merged = [];
    ranges.forEach(([start, end]) => {
      const previous = merged.at(-1);
      if (previous && start <= previous[1]) previous[1] = Math.max(previous[1], end);
      else merged.push([start, end]);
    });
    return { characters, ranges: merged };
  };

  const excludedSelector = [
    'script',
    'style',
    'svg',
    'canvas',
    'template',
    'noscript',
    'nav',
    'footer',
    'form',
    'button',
    '[aria-hidden="true"]',
    '.visually-hidden',
    '.mu3-anchor-alias',
  ].join(',');
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (
      node.nodeValue?.trim() && !node.parentElement?.closest(excludedSelector)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    ),
  });
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  const matches = [];
  textNodes.forEach((node) => {
    const { characters, ranges } = rangesForText(node.nodeValue || '');
    if (!ranges.length) return;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    ranges.forEach(([start, end]) => {
      if (start > cursor) {
        fragment.append(document.createTextNode(characters.slice(cursor, start).join('')));
      }
      const mark = document.createElement('mark');
      mark.className = 'site-search-match';
      mark.textContent = characters.slice(start, end).join('');
      fragment.append(mark);
      matches.push(mark);
      cursor = end;
    });
    if (cursor < characters.length) {
      fragment.append(document.createTextNode(characters.slice(cursor).join('')));
    }
    node.replaceWith(fragment);
  });

  const panel = document.createElement('aside');
  const summary = document.createElement('p');
  const query = document.createElement('strong');
  const position = document.createElement('span');
  const controls = document.createElement('div');
  const previous = document.createElement('button');
  const next = document.createElement('button');
  const clear = document.createElement('button');

  panel.className = 'site-search-guide';
  panel.setAttribute('aria-label', 'サイト内検索のページ内一致');
  summary.className = 'site-search-guide__summary';
  query.className = 'site-search-guide__query';
  query.textContent = `「${rawQuery}」`;
  query.title = rawQuery;
  position.className = 'site-search-guide__position';
  position.setAttribute('role', 'status');
  position.setAttribute('aria-live', 'polite');
  position.setAttribute('aria-atomic', 'true');
  summary.append(query, position);
  controls.className = 'site-search-guide__controls';
  previous.type = 'button';
  previous.textContent = '前へ';
  next.type = 'button';
  next.textContent = '次へ';
  clear.type = 'button';
  clear.textContent = '解除';
  previous.disabled = matches.length < 2;
  next.disabled = matches.length < 2;
  controls.append(previous, next, clear);
  panel.append(summary, controls);
  document.body.append(panel);

  const initialMatchIndex = () => {
    if (!window.location.hash || !matches.length) return 0;
    let target;
    try {
      target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    } catch (error) {
      console.warn('Search result anchor could not be decoded', error);
    }
    if (!target) return 0;
    const contained = matches.findIndex((mark) => target.contains(mark));
    if (contained >= 0) return contained;
    const following = matches.findIndex((mark) => (
      target.compareDocumentPosition(mark) & Node.DOCUMENT_POSITION_FOLLOWING
    ));
    return following >= 0 ? following : 0;
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = initialMatchIndex();

  const revealMatch = (mark) => {
    let details = mark.closest('details');
    while (details) {
      details.open = true;
      details = details.parentElement?.closest('details');
    }
    document.dispatchEvent(new CustomEvent('site-search-reveal', {
      detail: { target: mark, query: rawQuery },
    }));
  };

  const activate = (index, scroll = true) => {
    matches[currentIndex]?.classList.remove('site-search-match--active');
    if (!matches.length) {
      position.textContent = '0 / 0';
      return;
    }
    currentIndex = (index + matches.length) % matches.length;
    const mark = matches[currentIndex];
    mark.classList.add('site-search-match--active');
    revealMatch(mark);
    position.textContent = `${currentIndex + 1} / ${matches.length}`;
    if (scroll) {
      window.requestAnimationFrame(() => {
        if (!mark.classList.contains('site-search-match--active')) return;
        mark.scrollIntoView({
          behavior: reducedMotion.matches ? 'auto' : 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      });
    }
  };

  const removeSearchContext = () => {
    const parents = new Set();
    matches.forEach((mark) => {
      if (mark.parentNode) parents.add(mark.parentNode);
      mark.replaceWith(document.createTextNode(mark.textContent || ''));
    });
    parents.forEach((parent) => parent.normalize());
    panel.remove();
    const url = new URL(window.location.href);
    url.searchParams.delete(SEARCH_PARAM);
    url.searchParams.delete(SEARCH_TERM_PARAM);
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  };

  previous.addEventListener('click', () => activate(currentIndex - 1));
  next.addEventListener('click', () => activate(currentIndex + 1));
  clear.addEventListener('click', removeSearchContext);
  activate(currentIndex, false);
  window.addEventListener('pageshow', () => {
    window.requestAnimationFrame(() => activate(currentIndex));
  }, { once: true });
})();
