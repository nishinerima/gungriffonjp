(() => {
  "use strict";

  const demo = document.querySelector("[data-gloss-index-demo]");
  const rail = document.querySelector("[data-gloss-index-rail]");
  const indexList = document.querySelector("[data-gloss-index-list]");
  const entryList = document.querySelector("[data-gloss-entry-list]");
  if (!demo || !rail || !indexList || !entryList) return;

  const links = [...indexList.querySelectorAll("[data-gloss-index-link]")];
  const entries = [...entryList.querySelectorAll("[data-gloss-entry]")];
  if (!links.length || links.length !== entries.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = -1;
  let entryTops = [];
  let rafId = 0;
  let scrollingTimer = 0;
  let dragStartY = 0;
  let dialPosition = 0;
  let dragLastY = 0;
  let dragLastTime = 0;
  let dragVelocity = 0;
  let dragged = false;
  let dragPointerId = null;
  let settleRafId = 0;
  let lastDialPageIndex = -1;
  let engageTimer = 0;
  let holdTimer = 0;
  let pressedLinkIndex = -1;
  let suppressClickUntil = 0;
  let linkFeedbackIndex = -1;
  let linkFeedbackTimer = 0;
  const holdToDragDelay = 220;

  function clampPosition(position) {
    return Math.max(0, Math.min(entries.length - 1, position));
  }

  function getRowHeight() {
    return links[0].getBoundingClientRect().height || 32;
  }

  function interpolate(values, distance) {
    if (distance >= values.length - 1) return values[values.length - 1];
    const lower = Math.floor(distance);
    const amount = distance - lower;
    return values[lower] + (values[lower + 1] - values[lower]) * amount;
  }

  function updateFisheye(centerPosition) {
    const scales = [1.72, 1.42, 1.22, 1.08, 1];
    const shiftFactor = 1.15 + 0.5 / (scales[0] - 1);
    const readableCenter = Math.round(centerPosition);
    links.forEach((link, index) => {
      const distanceFromCenter = Math.abs(index - centerPosition);
      const distance = Math.min(distanceFromCenter, scales.length - 1);
      const scale = interpolate(scales, distance);
      const shift = -(scale - 1) * shiftFactor;
      link.classList.toggle(
        "is-fisheye-readable",
        Math.abs(index - readableCenter) <= 5
      );
      link.style.setProperty("--gloss-index-fisheye-scale", scale.toFixed(3));
      link.style.setProperty("--gloss-index-fisheye-shift", `${shift.toFixed(3)}em`);
      link.style.setProperty(
        "--gloss-index-fisheye-depth",
        String(Math.max(0, Math.round((scales.length - distance) * 10)))
      );
    });
  }

  function renderDial(position) {
    dialPosition = clampPosition(position);
    const rowHeight = getRowHeight();
    indexList.style.transform =
      `translate3d(0, ${-((dialPosition + 0.5) * rowHeight)}px, 0)`;
    updateFisheye(dialPosition);
  }

  function measure() {
    entryTops = entries.map(entry =>
      entry.getBoundingClientRect().top + window.scrollY
    );
    updateFromScroll();
  }

  function setActive(index, options = {}) {
    const nextIndex = Math.max(0, Math.min(entries.length - 1, index));
    const changed = nextIndex !== activeIndex || options.force;
    if (changed && activeIndex >= 0) {
      links[activeIndex].removeAttribute("aria-current");
      links[activeIndex].tabIndex = -1;
    }
    activeIndex = nextIndex;
    const activeLink = links[activeIndex];
    if (changed) {
      activeLink.setAttribute("aria-current", "location");
      activeLink.tabIndex = 0;
    }
    renderDial(options.position ?? activeIndex);
  }

  function findCurrentIndex() {
    const railBox = rail.getBoundingClientRect();
    const marker = window.scrollY + railBox.top + railBox.height / 2;
    let low = 0;
    let high = entryTops.length - 1;
    let result = 0;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (entryTops[middle] <= marker) {
        result = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return result;
  }

  function clearLinkFeedback() {
    window.clearTimeout(linkFeedbackTimer);
    linkFeedbackTimer = 0;
    rail.classList.remove("is-link-jumping");
    rail.style.removeProperty("--gloss-index-link-duration");
    if (linkFeedbackIndex >= 0) {
      links[linkFeedbackIndex].classList.remove("is-link-feedback");
    }
    linkFeedbackIndex = -1;
  }

  function finishLinkFeedbackIfArrived() {
    if (linkFeedbackIndex < 0 || !entryTops.length) return;
    if (findCurrentIndex() === linkFeedbackIndex) clearLinkFeedback();
  }

  function startLinkFeedback(index) {
    clearLinkFeedback();
    window.clearTimeout(scrollingTimer);
    rail.classList.remove("is-page-scrolling");
    linkFeedbackIndex = index;
    links[index].classList.add("is-link-feedback");
    if (!reducedMotion.matches) {
      const distance = Math.abs(index - activeIndex);
      const duration = Math.min(1440, 520 + distance * 24);
      rail.style.setProperty("--gloss-index-link-duration", `${duration}ms`);
      rail.classList.add("is-link-jumping");
    }
    linkFeedbackTimer = window.setTimeout(
      clearLinkFeedback,
      reducedMotion.matches ? 600 : 2600
    );
  }

  function updateFromScroll() {
    rafId = 0;
    if (
      dragPointerId !== null ||
      settleRafId ||
      linkFeedbackIndex >= 0 ||
      !entryTops.length
    ) return;
    setActive(findCurrentIndex());
    rail.classList.add("is-page-scrolling");
    window.clearTimeout(scrollingTimer);
    scrollingTimer = window.setTimeout(() => {
      rail.classList.remove("is-page-scrolling");
      finishLinkFeedbackIfArrived();
    }, 130);
  }

  function requestScrollUpdate() {
    if (!rafId) rafId = window.requestAnimationFrame(updateFromScroll);
  }

  function getEntryTargetOffset(entry) {
    const scrollMarginTop = parseFloat(window.getComputedStyle(entry).scrollMarginTop) || 0;
    const railBox = rail.getBoundingClientRect();
    const markerOffset = railBox.top + railBox.height / 2;
    const rowHeight = getRowHeight();
    return Math.max(
      scrollMarginTop,
      Math.min(scrollMarginTop + rowHeight * 3, markerOffset - rowHeight * 2)
    );
  }

  function goTo(index, focusLink = false, showLinkFeedback = false) {
    const nextIndex = Math.max(0, Math.min(entries.length - 1, index));
    if (showLinkFeedback) {
      startLinkFeedback(nextIndex);
    } else {
      clearLinkFeedback();
    }
    const entry = entries[nextIndex];
    const entryTop = entry.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, entryTop - getEntryTargetOffset(entry)),
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
    window.history.replaceState(null, "", links[nextIndex].getAttribute("href"));
    setActive(nextIndex);
    if (focusLink) links[nextIndex].focus({ preventScroll: true });
  }

  function syncPageToDial(index) {
    if (index === lastDialPageIndex || !entryTops.length) return;
    lastDialPageIndex = index;
    window.scrollTo({
      top: Math.max(0, entryTops[index] - getEntryTargetOffset(entries[index])),
      behavior: "instant"
    });
  }

  function updateDialPosition(position, syncPage = false) {
    const nextPosition = clampPosition(position);
    const nextIndex = Math.round(nextPosition);
    setActive(nextIndex, { position: nextPosition });
    if (syncPage) syncPageToDial(nextIndex);
  }

  function stopSettling() {
    if (!settleRafId) return;
    window.cancelAnimationFrame(settleRafId);
    settleRafId = 0;
    rail.classList.remove("is-settling");
  }

  function stopEngaging() {
    window.clearTimeout(engageTimer);
    engageTimer = 0;
    rail.classList.remove("is-engaging");
  }

  function beginDragging() {
    if (dragged) return;
    dragged = true;
    stopHoldTimer();
    rail.classList.add("is-dragging", "is-engaging");
    engageTimer = window.setTimeout(() => {
      engageTimer = 0;
      rail.classList.remove("is-engaging");
    }, 125);
    updateFisheye(dialPosition);
  }

  function stopHoldTimer() {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
  }

  function settleDial(useMomentum) {
    const projectedMovement = useMomentum && !reducedMotion.matches
      ? Math.max(-8, Math.min(8, dragVelocity * 180))
      : 0;
    const target = Math.round(clampPosition(dialPosition + projectedMovement));
    const start = dialPosition;
    const distance = target - start;
    if (reducedMotion.matches || Math.abs(distance) < 0.01) {
      updateDialPosition(target, true);
      return;
    }
    const duration = Math.min(620, 240 + Math.abs(distance) * 52);
    const startedAt = window.performance.now();
    rail.classList.add("is-settling");
    const tick = now => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      updateDialPosition(start + distance * eased, true);
      if (progress < 1) {
        settleRafId = window.requestAnimationFrame(tick);
        return;
      }
      settleRafId = 0;
      rail.classList.remove("is-settling");
      updateDialPosition(target, true);
    };
    settleRafId = window.requestAnimationFrame(tick);
  }

  indexList.addEventListener("click", event => {
    const link = event.target.closest("[data-gloss-index-link]");
    if (!link) return;
    if (event.detail > 0 && performance.now() < suppressClickUntil) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    goTo(Number(link.dataset.glossIndexLink), false, true);
  });

  rail.addEventListener("keydown", event => {
    if (!["ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const movement = event.key === "ArrowUp" ? -1
      : event.key === "ArrowDown" ? 1
        : event.key === "PageUp" ? -8
          : event.key === "PageDown" ? 8
            : event.key === "Home" ? -activeIndex
              : entries.length - 1 - activeIndex;
    goTo(activeIndex + movement, true);
  });

  indexList.addEventListener("dragstart", event => event.preventDefault());
  rail.addEventListener("selectstart", event => event.preventDefault());
  rail.addEventListener("contextmenu", event => event.preventDefault());

  rail.addEventListener("pointerdown", event => {
    if (event.button !== 0 || dragPointerId !== null) return;
    stopSettling();
    stopEngaging();
    stopHoldTimer();
    clearLinkFeedback();
    dragPointerId = event.pointerId;
    const pressedLink = event.target.closest("[data-gloss-index-link]");
    pressedLinkIndex = pressedLink ? Number(pressedLink.dataset.glossIndexLink) : -1;
    dragStartY = event.clientY;
    dragLastY = event.clientY;
    dragLastTime = event.timeStamp;
    dragVelocity = 0;
    dragged = false;
    lastDialPageIndex = activeIndex;
    holdTimer = window.setTimeout(() => {
      holdTimer = 0;
      if (dragPointerId === event.pointerId) beginDragging();
    }, holdToDragDelay);
    rail.setPointerCapture(event.pointerId);
  });

  rail.addEventListener("pointermove", event => {
    if (event.pointerId !== dragPointerId) return;
    const rowHeight = getRowHeight();
    const eventY = Number.isFinite(event.clientY) ? event.clientY : dragLastY;
    const pointerY = Math.max(
      -rowHeight * 2,
      Math.min(window.innerHeight + rowHeight * 2, eventY)
    );
    const outsideHorizontalViewport =
      !Number.isFinite(event.clientX) ||
      event.clientX < 0 ||
      event.clientX > window.innerWidth;

    if (outsideHorizontalViewport) {
      if (!dragged) {
        dragStartY = pointerY;
        pressedLinkIndex = -1;
        stopHoldTimer();
      }
      dragLastY = pointerY;
      dragLastTime = event.timeStamp;
      dragVelocity = 0;
      event.preventDefault();
      return;
    }

    const distance = pointerY - dragStartY;
    const dragThreshold = event.pointerType === "touch" ? 8 : 5;
    if (!dragged && Math.abs(distance) <= dragThreshold) {
      event.preventDefault();
      return;
    }
    if (!dragged) {
      beginDragging();
    }
    const pixelsPerRow = rowHeight * 0.82;
    const movementY = pointerY - dragLastY;
    const maximumEventMovement = Math.max(
      pixelsPerRow * 5,
      window.innerHeight * 0.22
    );
    if (!Number.isFinite(movementY) || Math.abs(movementY) > maximumEventMovement) {
      dragLastY = pointerY;
      dragLastTime = event.timeStamp;
      dragVelocity = 0;
      event.preventDefault();
      return;
    }
    const elapsed = Math.max(1, event.timeStamp - dragLastTime);
    const instantVelocity = -(movementY / pixelsPerRow) / elapsed;
    dragVelocity = dragVelocity * 0.58 + instantVelocity * 0.42;
    dragLastY = pointerY;
    dragLastTime = event.timeStamp;
    updateDialPosition(dialPosition - movementY / pixelsPerRow, true);
    event.preventDefault();
  });

  rail.addEventListener("pointerup", event => {
    if (event.pointerId !== dragPointerId) return;
    const wasDragged = dragged;
    const tappedLinkIndex = pressedLinkIndex;
    if (rail.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId);
    }
    dragPointerId = null;
    pressedLinkIndex = -1;
    dragged = false;
    stopHoldTimer();
    stopEngaging();
    rail.classList.remove("is-dragging");
    suppressClickUntil = performance.now() + 400;
    if (wasDragged) {
      event.preventDefault();
      settleDial(true);
    } else if (tappedLinkIndex >= 0) {
      event.preventDefault();
      goTo(tappedLinkIndex, false, true);
    } else {
      updateDialPosition(activeIndex);
    }
  });

  rail.addEventListener("pointercancel", event => {
    if (event.pointerId !== dragPointerId) return;
    dragPointerId = null;
    pressedLinkIndex = -1;
    dragged = false;
    stopHoldTimer();
    stopEngaging();
    rail.classList.remove("is-dragging");
    settleDial(false);
  });

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("scrollend", finishLinkFeedbackIfArrived, { passive: true });
  window.addEventListener(
    "resize",
    () => window.requestAnimationFrame(measure),
    { passive: true }
  );
  window.addEventListener("load", measure, { once: true });
  window.addEventListener("hashchange", () => window.requestAnimationFrame(measure));

  links.forEach(link => { link.tabIndex = -1; });
  setActive(0, { force: true });
  measure();
})();

(() => {
  "use strict";
  const maps = [...document.querySelectorAll("[data-gloss-map]")];
  if (!maps.length) return;

  const width = 640;
  const height = 400;

  function showError(svg) {
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = `
      <rect class="sphere" x="0" y="0" width="${width}" height="${height}"></rect>
      <text class="map-error" x="${width / 2}" y="${height / 2}">
        地図を読み込めません
      </text>
    `;
  }

  function boundsFeature(bounds) {
    const [west, south, east, north] = bounds;
    return {
      type: "Polygon",
      coordinates: [[
        [west, south],
        [west, north],
        [east, north],
        [east, south],
        [west, south],
      ]],
    };
  }

  async function drawMaps() {
    if (!window.d3 || !window.topojson) {
      maps.forEach(showError);
      return;
    }

    let world;
    try {
      world = await d3.json(
        "/mu3/assets/vendor/world-atlas/countries-110m.json"
      );
    } catch (error) {
      maps.forEach(showError);
      console.error(error);
      return;
    }

    const countries = topojson.feature(
      world,
      world.objects.countries
    ).features;
    const borders = topojson.mesh(
      world,
      world.objects.countries,
      (a, b) => a !== b
    );

    maps.forEach(svg => {
      const bounds = svg.dataset.bounds.split(",").map(Number);
      const longitude = Number(svg.dataset.lon);
      const latitude = Number(svg.dataset.lat);
      const label = svg.dataset.label;
      const projection = d3.geoMercator().fitExtent(
        [[18, 18], [width - 18, height - 18]],
        boundsFeature(bounds)
      ).clipExtent([[18, 18], [width - 18, height - 18]]);
      const path = d3.geoPath(projection);
      const point = projection([longitude, latitude]);
      const targetWidth = Math.min(
        width - 40,
        Math.max(72, label.length * 12)
      );
      const centeredTarget = targetWidth > 220;
      const labelOnLeft = (
        !centeredTarget
        && point[0] + 14 + targetWidth > width - 18
      );
      const targetTextX = centeredTarget
        ? Math.max(
          20 + targetWidth / 2,
          Math.min(width - 20 - targetWidth / 2, point[0])
        )
        : point[0] + (labelOnLeft ? -14 : 14);
      const targetAnchor = centeredTarget
        ? "middle"
        : (labelOnLeft ? "end" : "start");

      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      const root = d3.select(svg);
      root.selectAll("*").remove();
      root.append("rect")
        .attr("class", "sphere")
        .attr("width", width)
        .attr("height", height);
      root.append("path")
        .datum(d3.geoGraticule10())
        .attr("class", "graticule")
        .attr("d", path);
      root.append("path")
        .datum({ type: "FeatureCollection", features: countries })
        .attr("class", "country")
        .attr("d", path);
      root.append("path")
        .datum(borders)
        .attr("class", "country-boundary")
        .attr("d", path);

      const targetLeft = centeredTarget
        ? targetTextX - targetWidth / 2
        : labelOnLeft
        ? point[0] - 14 - targetWidth
        : point[0] + 14;
      const placedLabels = [{
        left: targetLeft,
        right: targetLeft + targetWidth,
        top: point[1] - 34,
        bottom: point[1] + 3,
      }];
      const overlapsPlaced = box => placedLabels.some(placed => !(
        box.right + 7 < placed.left
        || box.left - 7 > placed.right
        || box.bottom + 4 < placed.top
        || box.top - 4 > placed.bottom
      ));
      const countryLabels = countries
        .map(feature => ({
          name: feature.properties?.name,
          area: path.area(feature),
          point: path.centroid(feature),
        }))
        .filter(candidate => (
          candidate.name
          && candidate.area >= 260
          && Number.isFinite(candidate.point[0])
          && Number.isFinite(candidate.point[1])
          && candidate.point[0] >= 28
          && candidate.point[0] <= width - 28
          && candidate.point[1] >= 28
          && candidate.point[1] <= height - 28
        ))
        .sort((a, b) => b.area - a.area);

      let visibleCountryLabels = 0;
      countryLabels.some(candidate => {
        const labelWidth = Math.min(
          150,
          Math.max(48, candidate.name.length * 7.4)
        );
        const positions = [
          candidate.point,
          [candidate.point[0], candidate.point[1] + 28],
          [candidate.point[0], candidate.point[1] - 28],
        ];
        const position = positions.find(([x, y]) => {
          const box = {
            left: x - labelWidth / 2,
            right: x + labelWidth / 2,
            top: y - 11,
            bottom: y + 5,
          };
          return (
            box.left >= 22
            && box.right <= width - 22
            && box.top >= 20
            && box.bottom <= height - 20
            && !overlapsPlaced(box)
          );
        });
        if (!position) return false;

        const box = {
          left: position[0] - labelWidth / 2,
          right: position[0] + labelWidth / 2,
          top: position[1] - 11,
          bottom: position[1] + 5,
        };
        placedLabels.push(box);
        root.append("text")
          .attr("class", "country-label")
          .attr("x", position[0])
          .attr("y", position[1])
          .attr("text-anchor", "middle")
          .text(candidate.name);
        visibleCountryLabels += 1;
        return visibleCountryLabels >= 8;
      });

      root.append("circle")
        .attr("class", "location-halo")
        .attr("cx", point[0])
        .attr("cy", point[1])
        .attr("r", 16);
      root.append("circle")
        .attr("class", "location-point")
        .attr("cx", point[0])
        .attr("cy", point[1])
        .attr("r", 7);
      root.append("text")
        .attr("class", "location-label")
        .attr("x", targetTextX)
        .attr("y", point[1] - 12)
        .attr("text-anchor", targetAnchor)
        .text(label);
    });
  }

  drawMaps();
})();
