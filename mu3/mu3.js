(() => {
  const page = document.querySelector('.mu3-page');
  const siteHeader = document.querySelector('.site-header');
  if (!page || !siteHeader) return;

  const syncHeaderHeight = () => {
    page.style.setProperty('--mu3-site-header-height', `${siteHeader.getBoundingClientRect().height}px`);
  };

  syncHeaderHeight();
  if ('ResizeObserver' in window) {
    new ResizeObserver(syncHeaderHeight).observe(siteHeader);
  } else {
    window.addEventListener('resize', syncHeaderHeight, { passive: true });
  }
})();

(() => {
  const nav = document.querySelector('.mu3-nav');
  const current = nav?.querySelector('[aria-current="page"]');
  const mobile = window.matchMedia('(max-width: 760px)');
  const pageNav = document.querySelector('.mu3-page-nav');
  if (!nav || !current || !pageNav?.querySelector('a')) return;

  const popup = document.createElement('nav');
  const popupId = 'mu3-local-popup';
  popup.className = 'mu3-local-popup';
  popup.id = popupId;
  popup.setAttribute('aria-label', 'このページの目次');
  popup.hidden = true;
  popup.innerHTML = pageNav.innerHTML;
  nav.append(popup);

  const positionPopup = () => {
    if (!mobile.matches || popup.hidden) return;
    const navRect = nav.getBoundingClientRect();
    const triggerRect = current.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const triggerLeft = triggerRect.left - navRect.left;
    const maxLeft = Math.max(0, navRect.width - popupRect.width);
    popup.style.left = `${Math.max(0, Math.min(triggerLeft, maxLeft))}px`;
  };

  const closePopup = () => {
    popup.hidden = true;
    current.setAttribute('aria-expanded', 'false');
  };

  const syncTriggerMode = () => {
    closePopup();
    if (mobile.matches) {
      current.setAttribute('aria-controls', popupId);
      current.setAttribute('aria-expanded', 'false');
      current.setAttribute('aria-haspopup', 'true');
    } else {
      current.removeAttribute('aria-controls');
      current.removeAttribute('aria-expanded');
      current.removeAttribute('aria-haspopup');
    }
  };

  syncTriggerMode();

  current.addEventListener('click', (event) => {
    if (!mobile.matches) return;
    event.preventDefault();
    const willOpen = popup.hidden;
    popup.hidden = !willOpen;
    current.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) positionPopup();
  });

  popup.addEventListener('click', (event) => {
    if (event.target.closest('a')) closePopup();
  });

  document.addEventListener('click', (event) => {
    if (!popup.hidden && !nav.contains(event.target)) closePopup();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || popup.hidden) return;
    closePopup();
    current.focus();
  });

  if (mobile.addEventListener) mobile.addEventListener('change', syncTriggerMode);
  window.addEventListener('resize', positionPopup, { passive: true });
})();

(() => {
  const page = document.querySelector('.chronol-page');
  if (!page) return;

  const events = [...page.querySelectorAll('.chronol-event')];
  const callouts = [...page.querySelectorAll('.chronol-callout')];
  const years = [...page.querySelectorAll('.chronol-year')];
  const months = [...page.querySelectorAll('.chronol-month')];
  const filters = [...page.querySelectorAll('.chronol-filter-options input')];
  const reset = page.querySelector('.chronol-filter-reset');
  const status = page.querySelector('.chronol-filter-status');
  const sources = [...page.querySelectorAll('.chronol-source')];
  let printState = null;
  let highlightTimer = 0;

  const applyFilters = () => {
    const types = new Set(
      filters
        .filter((input) => input.name === 'chronol-type' && input.checked)
        .map((input) => input.value)
    );
    const factions = new Set(
      filters
        .filter((input) => input.name === 'chronol-faction' && input.checked)
        .map((input) => input.value)
    );
    const visibleIds = new Set();

    events.forEach((event) => {
      const eventFactions = event.dataset.factions?.split(/\s+/).filter(Boolean) ?? [];
      const visible = types.has(event.dataset.type) && eventFactions.some((item) => factions.has(item));
      event.hidden = !visible;
      if (visible) visibleIds.add(event.id);
    });

    callouts.forEach((callout) => {
      const related = callout.dataset.relatedEvents?.split(/\s+/).filter(Boolean) ?? [];
      callout.hidden = !related.some((eventId) => visibleIds.has(eventId));
    });

    months.forEach((month) => {
      month.hidden = !month.querySelector('.chronol-event:not([hidden])');
    });

    years.forEach((year) => {
      year.hidden = !year.querySelector('.chronol-event:not([hidden])');
    });

    if (status) {
      status.textContent = `${events.length}件中${visibleIds.size}件を表示`;
    }
  };

  filters.forEach((input) => input.addEventListener('change', applyFilters));
  reset?.addEventListener('click', () => {
    filters.forEach((input) => {
      input.checked = true;
    });
    applyFilters();
  });

  const highlightTarget = () => {
    let id = '';
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    if (!id) return;
    const target = document.getElementById(id);
    if (!target?.classList.contains('chronol-event')) return;

    window.clearTimeout(highlightTimer);
    events.forEach((event) => event.classList.remove('is-anchor-highlighted'));
    target.classList.add('is-anchor-highlighted');
    target.scrollIntoView({ block: 'center' });
    target.focus({ preventScroll: true });
    highlightTimer = window.setTimeout(() => {
      target.classList.remove('is-anchor-highlighted');
    }, 2400);
  };

  window.addEventListener('hashchange', highlightTarget);
  if (window.location.hash) window.setTimeout(highlightTarget, 0);

  window.addEventListener('beforeprint', () => {
    printState = {
      hidden: [...events, ...callouts, ...years, ...months].map((item) => [item, item.hidden]),
      sources: sources.map((source) => source.open),
    };
    printState.hidden.forEach(([item]) => {
      item.hidden = false;
    });
    sources.forEach((source) => {
      source.open = true;
    });
  });

  window.addEventListener('afterprint', () => {
    if (!printState) return;
    printState.hidden.forEach(([item, hidden]) => {
      item.hidden = hidden;
    });
    sources.forEach((source, index) => {
      source.open = printState.sources[index];
    });
    printState = null;
  });

  applyFilters();
})();
