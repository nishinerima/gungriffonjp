(() => {
  "use strict";

  const data = window.MU3_ATLAS_DATA;
  const svg = d3.select("#war-map");
  const frame = document.querySelector("[data-map-frame]");
  const resizeHandle = document.querySelector("[data-map-resize-handle]");
  const status = document.querySelector("[data-map-status]");
  const slider = document.querySelector("[data-timeline]");
  const dateOutput = document.querySelector("[data-current-date]");
  const previousButton = document.querySelector('[data-step="prev"]');
  const nextButton = document.querySelector('[data-step="next"]');
  const timelineModeButton = document.querySelector('[data-map-mode="timeline"]');
  const allModeButton = document.querySelector('[data-map-mode="all"]');
  const zoomInButton = document.querySelector('[data-zoom="in"]');
  const zoomOutButton = document.querySelector('[data-zoom="out"]');
  const zoomResetButton = document.querySelector('[data-zoom="reset"]');
  const typeIconHost = document.querySelector("[data-event-type-icon]");
  const eventTitle = document.querySelector("[data-event-title]");
  const factionHost = document.querySelector("[data-event-factions]");

  if (!data || data.schema !== 1 || !Array.isArray(data.events) || !data.events.length) {
    status.textContent = "アトラス用データを読み込めませんでした。";
    status.classList.add("is-error");
    return;
  }

  const colors = {
    apc: "#efaaa4",
    peu: "#a8caa5",
    afta: "#a8c5e8",
    oau: "#e5cd8f",
    default: "#d9e2f2",
    "apc-strong": "#df716b",
    "peu-strong": "#6fa878",
    "afta-strong": "#6f9fd6",
    "oau-strong": "#c2a448",
    "default-strong": "#89939d"
  };
  const typeIcons = {
    battle: '<svg class="chronol-type-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M7.514 3.836c.151 -.909 1.346 -1.147 1.834 -.366c2.294 3.67 4.275 4.048 5.758 1.083c.471 -.944 1.894 -.608 1.894 .447c0 2.448 1.552 4 4 4c.89 0 1.337 1.077 .707 1.707c-1.61 1.61 -1.61 2.975 0 4.581c.63 .63 .185 1.707 -.706 1.708c-2.448 .003 -3.001 .556 -3.001 3.004c0 .961 -1.223 1.369 -1.8 .6c-2.325 -3.1 -5.494 -2.856 -7.368 -.045c-.503 .754 -1.67 .504 -1.818 -.39c-.365 -2.188 -1.04 -2.656 -4.178 -3.179a1 1 0 0 1 -.543 -1.693c1.618 -1.618 1.618 -3.027 -.053 -4.981l-.009 -.013l-.013 -.014l-.044 -.062l-.01 -.011l-.006 -.013l-.038 -.066l-.017 -.028l-.001 -.004l-.027 -.066l-.019 -.041a1 1 0 0 1 -.051 -.233l-.002 -.045l-.003 -.068a1 1 0 0 1 .06 -.328l.009 -.023l.023 -.049l.011 -.029l.009 -.015l.007 -.016l.019 -.029l.02 -.035l.012 -.017l.013 -.022l.027 -.034l.011 -.016l.018 -.02l.02 -.025l.021 -.02l.015 -.017l.035 -.032l.02 -.019l.009 -.007l.018 -.015l.055 -.039l.018 -.015l.008 -.004l.01 -.007l.061 -.034l.028 -.016l.004 -.002l.063 -.026l.044 -.019a1 1 0 0 1 .115 -.032l.004 -.002l.267 -.063c2.39 -.613 3.934 -2.19 4.411 -4.523z"/></svg>',
    weapon: '<svg class="chronol-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 15a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3"/><path d="M6 12l1 -5h5l3 5"/><path d="M21 9l-7.8 0"/></svg>',
    military: '<svg class="chronol-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 7v12a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-12l6 -4l6 4"/><path d="M10 13l2 -1l2 1"/><path d="M10 17l2 -1l2 1"/><path d="M10 9l2 -1l2 1"/></svg>',
    other: '<svg class="chronol-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/></svg>'
  };
  const typeLabels = {
    battle: "戦闘",
    weapon: "兵器",
    military: "軍事全般",
    other: "その他"
  };
  const factionLabels = {
    apc: "APC",
    peu: "PEU",
    afta: "AFTA",
    other: "その他"
  };
  const sequenceDateKey = event =>
    event.date.iso && /^\d{4}\.\d{1,2}\.\d{1,2}$/u.test(event.date.display)
      ? event.date.iso
      : "";
  const dateTotals = new Map();
  data.events.forEach(event => {
    const dateKey = sequenceDateKey(event);
    if (!dateKey) return;
    dateTotals.set(dateKey, (dateTotals.get(dateKey) || 0) + 1);
  });
  const datePositions = new Map();
  const events = data.events.map((event, index) => {
    let dateSequence = null;
    const dateKey = sequenceDateKey(event);
    if (dateKey && dateTotals.get(dateKey) > 1) {
      dateSequence = (datePositions.get(dateKey) || 0) + 1;
      datePositions.set(dateKey, dateSequence);
    }
    return { ...event, index, dateSequence };
  });
  const seamlessCountryIds = new Set([
    ...Object.values(data.regions)
      .map(region => region.territoryCountry)
      .filter(Boolean),
    ...(data.hiddenCountryBorders || []).flat()
  ]);
  let currentIndex = 0;
  let currentCameraName = "";
  let projection;
  let path;
  let mapLayer;
  let regionLayer;
  let countryTransitionLayer;
  let regionTransitionLayer;
  let eventLayer;
  let zoom;
  let countries = [];
  let countriesById = new Map();
  let borders;
  let routeArrow;
  let allEventsMode = false;
  let territoryTransitionsReady = false;
  let resizePointerId = null;
  let resizeStartY = 0;
  let resizeStartHeight = 0;

  function mapHeightBounds() {
    const styles = getComputedStyle(frame);
    return {
      min: parseFloat(styles.minHeight) || 0,
      max: parseFloat(styles.maxHeight) || Number.POSITIVE_INFINITY
    };
  }

  function updateResizeHandleValue() {
    const bounds = mapHeightBounds();
    const height = Math.round(frame.getBoundingClientRect().height);
    resizeHandle.setAttribute("aria-valuemin", String(Math.round(bounds.min)));
    resizeHandle.setAttribute("aria-valuemax", String(Math.round(bounds.max)));
    resizeHandle.setAttribute("aria-valuenow", String(height));
  }

  function setMapHeight(height) {
    const bounds = mapHeightBounds();
    const clamped = Math.max(bounds.min, Math.min(bounds.max, height));
    frame.style.setProperty("--atlas-map-height", Math.round(clamped) + "px");
    updateResizeHandleValue();
  }

  function moveMapResize(event) {
    if (event.pointerId !== resizePointerId) return;
    event.preventDefault();
    setMapHeight(resizeStartHeight + event.clientY - resizeStartY);
  }

  function finishMapResize(event) {
    if (event.pointerId !== resizePointerId) return;
    resizePointerId = null;
    resizeHandle.classList.remove("is-resizing");
    document.body.classList.remove("is-resizing-map");
    window.removeEventListener("pointermove", moveMapResize);
    window.removeEventListener("pointerup", finishMapResize);
    window.removeEventListener("pointercancel", finishMapResize);
  }

  resizeHandle.addEventListener("pointerdown", event => {
    if (event.button !== 0 || resizePointerId !== null) return;
    event.preventDefault();
    resizePointerId = event.pointerId;
    resizeStartY = event.clientY;
    resizeStartHeight = frame.getBoundingClientRect().height;
    resizeHandle.classList.add("is-resizing");
    document.body.classList.add("is-resizing-map");
    window.addEventListener("pointermove", moveMapResize);
    window.addEventListener("pointerup", finishMapResize);
    window.addEventListener("pointercancel", finishMapResize);
  });

  resizeHandle.addEventListener("keydown", event => {
    const bounds = mapHeightBounds();
    const currentHeight = frame.getBoundingClientRect().height;
    const movement = event.key === "ArrowUp" ? -16
      : event.key === "ArrowDown" ? 16
        : event.key === "PageUp" ? -64
          : event.key === "PageDown" ? 64
            : null;
    if (movement === null && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    if (event.key === "Home") {
      setMapHeight(bounds.min);
    } else if (event.key === "End") {
      setMapHeight(bounds.max);
    } else {
      setMapHeight(currentHeight + movement);
    }
  });

  updateResizeHandleValue();

  slider.min = "0";
  slider.max = String(events.length - 1);
  slider.value = "0";
  slider.step = "1";

  const normalizeCountryId = value => String(value).padStart(3, "0");
  function countryGeometry(world, countryId) {
    return world.objects.countries.geometries.find(
      geometry => normalizeCountryId(geometry.id) === countryId
    );
  }

  function reassignTerritoryRegions(world) {
    Object.values(data.regions).forEach(region => {
      if (!region.clipCountry || !region.territoryCountry) return;

      const source = countryGeometry(world, region.clipCountry);
      const target = countryGeometry(world, region.territoryCountry);
      if (!source || !target) {
        throw new Error("地域の再分類先となる国データが見つかりません。");
      }

      const sourcePolygons = source.type === "Polygon" ? [source.arcs] : source.arcs;
      const regionCenter = d3.geoCentroid(region.geometry);
      const polygonIndex = sourcePolygons.findIndex(polygonArcs => {
        const polygon = topojson.feature(world, { type: "Polygon", arcs: polygonArcs });
        return d3.geoContains(polygon, regionCenter);
      });
      if (polygonIndex < 0) {
        throw new Error("再分類する地域のポリゴンが元の国データに見つかりません。");
      }

      const [polygonArcs] = sourcePolygons.splice(polygonIndex, 1);
      if (!sourcePolygons.length) {
        throw new Error("元の国から唯一のポリゴンを移動することはできません。");
      }
      source.type = "MultiPolygon";
      source.arcs = sourcePolygons;

      if (target.type === "Polygon") {
        target.type = "MultiPolygon";
        target.arcs = [target.arcs, polygonArcs];
      } else {
        target.arcs.push(polygonArcs);
      }
    });
  }

  const stripeId = (fill, variant) =>
    "atlas-stripe-" + variant + "-" + fill.join("-");
  const paintFor = (fill, stripeVariant) => {
    if (!fill || !fill.length) return colors.default;
    if (fill.length === 1) return colors[fill[0]] || colors.default;
    return "url(#" + stripeId(fill, stripeVariant) + ")";
  };

  function eventFeature(event) {
    return { type: "Feature", properties: event, geometry: event.geometry };
  }

  function pointRecords(event) {
    if (!event.geometry) return [];
    let points;
    if (event.geometry.type === "Point") {
      points = [event.geometry.coordinates];
    } else if (event.geometry.type === "MultiPoint") {
      points = event.geometry.coordinates;
    } else {
      points = [
        event.pointCoordinates ||
        event.geometry.coordinates[event.geometry.coordinates.length - 1]
      ];
    }
    return points.map((point, pointIndex) => ({
      ...event,
      point,
      pointId: event.id + "-point-" + pointIndex
    }));
  }

  function labelRecords(event) {
    if (!event.showPlaceLabel) return [];
    return event.labelCoordinates.map((point, labelIndex) => ({
      ...event,
      point,
      placeLabel: event.placeLabels[labelIndex] || event.place,
      labelId: event.id + "-label-" + labelIndex
    }));
  }

  function updatePanel(event) {
    typeIconHost.innerHTML =
      (typeIcons[event.type] || typeIcons.other) +
      '<span class="visually-hidden">種別：' +
      (typeLabels[event.type] || event.type) +
      "</span>";
    eventTitle.textContent = event.title;
    factionHost.replaceChildren();
    event.factionIds.forEach(faction => {
      const badge = document.createElement("span");
      badge.className = "chronol-faction chronol-faction--" + faction;
      badge.textContent = factionLabels[faction] || faction.toUpperCase();
      factionHost.appendChild(badge);
    });
    const summary = document.querySelector("[data-event-summary]");
    summary.textContent = event.summary;
    previousButton.disabled = event.index === 0;
    nextButton.disabled = event.index === events.length - 1;
  }

  function updateDateOutput(event) {
    dateOutput.replaceChildren();
    const displayDate = event.date.display;
    const parts = displayDate.match(/\d+|[.～〜]+|[^\d.～〜]+/gu) || [displayDate];
    parts.forEach(part => {
      if (/^[^\d.～〜]+$/u.test(part)) {
        const qualifier = document.createElement("span");
        qualifier.className = "current-time__qualifier";
        qualifier.textContent = part;
        dateOutput.appendChild(qualifier);
      } else {
        dateOutput.append(part);
      }
    });
    if (event.dateSequence !== null) {
      const sequence = document.createElement("small");
      sequence.className = "current-time__sequence";
      sequence.textContent = "（" + event.dateSequence + "）";
      dateOutput.appendChild(sequence);
    }
  }

  function expandTargets(targets) {
    return targets.flatMap(target => {
      const separator = target.indexOf(":");
      const prefix = target.slice(0, separator);
      const name = target.slice(separator + 1);
      if (prefix !== "group") return [target];
      return (data.countryGroups[name] || []).map(countryId => "country:" + countryId);
    });
  }

  function territoryStateAt(selectedIndex) {
    const state = new Map();
    for (let index = 0; index <= selectedIndex; index += 1) {
      events[index].territory.forEach(change => {
        expandTargets(change.targets).forEach(target => {
          state.set(target, change.fill);
        });
      });
    }
    return state;
  }

  function territoryTargetForRegion(region) {
    return region.territoryCountry
      ? "country:" + region.territoryCountry
      : "region:" + region.id;
  }

  function fillsMatch(left, right) {
    return Boolean(left && right) &&
      left.length === right.length &&
      left.every((fill, index) => fill === right[index]);
  }

  function regionHasDistinctTerritory(region, state) {
    if (!region.clipCountry) return false;
    const regionFill = state.get(territoryTargetForRegion(region));
    const parentFill = state.get("country:" + region.clipCountry);
    return Boolean(regionFill) && !fillsMatch(regionFill, parentFill);
  }

  function clearTerritoryTransitions() {
    [countryTransitionLayer, regionTransitionLayer].forEach(layer => {
      if (layer) layer.selectAll("*").interrupt("territory-paint").remove();
    });
    if (mapLayer) {
      mapLayer.selectAll("path.country:not(.territory-transition-old)")
        .interrupt("territory-paint")
        .style("opacity", 1);
    }
    if (regionLayer) {
      regionLayer.selectAll(".region-overlay")
        .interrupt("territory-paint")
        .style("opacity", 1);
    }
  }

  function prepareTerritoryTransition(selection, paintForDatum, transitionLayer, animate) {
    const changedNodes = [];
    const outgoingNodes = [];
    selection.each(function (datum) {
      const paint = paintForDatum(datum);
      if (this.getAttribute("data-paint-signature") === paint.signature) return;
      changedNodes.push(this);
      if (!animate || !this.hasAttribute("data-paint-signature")) return;
      const outgoing = this.cloneNode(false);
      outgoing.classList.add("territory-transition-old");
      outgoing.removeAttribute("data-paint-signature");
      outgoing.style.fill = this.style.fill || getComputedStyle(this).fill;
      outgoing.style.stroke = this.style.stroke || getComputedStyle(this).stroke;
      outgoing.style.opacity = getComputedStyle(this).opacity;
      transitionLayer.node().appendChild(outgoing);
      outgoingNodes.push(outgoing);
    });
    return { changedNodes, outgoingNodes };
  }

  function runTerritoryTransition(prepared, animate) {
    const incoming = d3.selectAll(prepared.changedNodes)
      .interrupt("territory-paint")
      .style("opacity", animate ? 0 : 1);
    if (!animate || !prepared.changedNodes.length) return;
    const transition = d3.transition("territory-paint")
      .duration(180)
      .ease(d3.easeCubicInOut);
    incoming.transition(transition).style("opacity", 1);
    d3.selectAll(prepared.outgoingNodes)
      .transition(transition)
      .style("opacity", 0)
      .remove();
  }

  function updateTerritories(selectedIndex) {
    if (!mapLayer || !regionLayer) return;
    clearTerritoryTransitions();
    const state = territoryStateAt(selectedIndex);
    const patternVariant = allEventsMode ? "world" : events[selectedIndex].camera;
    const emphasis = new Map();
    events[selectedIndex].emphasis.forEach(change => {
      expandTargets(change.targets).forEach(target => {
        emphasis.set(target, change.fill);
      });
    });
    const animate = territoryTransitionsReady &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const countryPaint = country => {
      const countryId = normalizeCountryId(country.id);
      const target = "country:" + countryId;
      const fill = paintFor(emphasis.get(target) || state.get(target), patternVariant);
      const stroke = seamlessCountryIds.has(countryId) ? fill : null;
      return {
        fill,
        stroke,
        signature: [fill, stroke || ""].join("|")
      };
    };
    const countries = mapLayer.selectAll("path.country:not(.territory-transition-old)");
    const preparedCountries = prepareTerritoryTransition(
      countries,
      countryPaint,
      countryTransitionLayer,
      animate
    );
    countries
      .attr("data-territory", country => {
        const fill = state.get("country:" + normalizeCountryId(country.id));
        return fill ? fill.join("-") : null;
      })
      .attr("data-emphasis", country => {
        const fill = emphasis.get("country:" + normalizeCountryId(country.id));
        return fill ? fill.join("-") : null;
      })
      .attr("data-paint-signature", country => countryPaint(country).signature)
      .style("fill", country => countryPaint(country).fill)
      .style("stroke", country => countryPaint(country).stroke);
    const regionPaint = region => {
      const distinct = regionHasDistinctTerritory(region, state);
      const target = territoryTargetForRegion(region);
      const activeFill = emphasis.get(target) || state.get(target);
      const fill = region.clipCountry && !distinct
        ? "transparent"
        : activeFill ? paintFor(activeFill, patternVariant) : "transparent";
      const stroke = region.clipCountry && !distinct ? "transparent" : null;
      const boundary = distinct ? "true" : null;
      return {
        fill,
        stroke,
        boundary,
        signature: [fill, stroke || "", boundary || ""].join("|")
      };
    };
    const regions = regionLayer.selectAll(".region-overlay");
    const preparedRegions = prepareTerritoryTransition(
      regions,
      regionPaint,
      regionTransitionLayer,
      animate
    );
    regions
      .attr("data-territory", region => {
        const fill = state.get(territoryTargetForRegion(region));
        return fill ? fill.join("-") : null;
      })
      .attr("data-emphasis", region => {
        const fill = emphasis.get(territoryTargetForRegion(region));
        return fill ? fill.join("-") : null;
      })
      .attr("data-boundary-visible", region => regionPaint(region).boundary)
      .attr("data-paint-signature", region => regionPaint(region).signature)
      .style("fill", region => regionPaint(region).fill)
      .style("stroke", region => regionPaint(region).stroke);
    runTerritoryTransition(preparedCountries, animate);
    runTerritoryTransition(preparedRegions, animate);
    territoryTransitionsReady = true;
  }

  function updateMap(selectedIndex) {
    if (!eventLayer) return;
    eventLayer.selectAll(".event-route")
      .classed("is-visible", event => allEventsMode || event.index === selectedIndex)
      .classed("is-active", event => event.index === selectedIndex);
    const points = eventLayer.selectAll(".event-point")
      .classed("is-visible", event => allEventsMode || event.index === selectedIndex)
      .classed("is-active", event => event.index === selectedIndex)
      .classed("is-interactive", allEventsMode)
      .attr("tabindex", allEventsMode ? 0 : -1)
      .attr("role", allEventsMode ? "button" : null)
      .attr("aria-label", event => allEventsMode
        ? event.date.display + " " + event.title
        : null);
    const pulses = eventLayer.selectAll(".event-pulse")
      .classed("is-active", event => event.index === selectedIndex);
    const labels = eventLayer.selectAll(".event-place-label")
      .classed("is-visible", event => event.index === selectedIndex);
    if (allEventsMode) {
      pulses.filter(event => event.index === selectedIndex).raise();
      points.filter(event => event.index === selectedIndex).raise();
      labels.filter(event => event.index === selectedIndex).raise();
    }
    updateTerritories(selectedIndex);
  }

  function cameraTransform(event) {
    const camera = data.cameras[event.camera];
    const projected = projection(camera.center);
    const width = frame.clientWidth;
    const height = frame.clientHeight;
    return d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(camera.zoom)
      .translate(-projected[0], -projected[1]);
  }

  function focusEvent(event, animate = true, force = false) {
    if (!zoom || !projection || allEventsMode) return;
    if (!force && currentCameraName === event.camera) return;
    currentCameraName = event.camera;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = animate && !reducedMotion
      ? svg.transition().duration(420).ease(d3.easeCubicInOut)
      : svg;
    target.call(zoom.transform, cameraTransform(event));
  }

  function setEvent(index, focus = true, updateUrl = true, forceFocus = false) {
    currentIndex = Math.max(0, Math.min(events.length - 1, Number(index)));
    const event = events[currentIndex];
    slider.value = String(currentIndex);
    updateDateOutput(event);
    frame.dataset.camera = event.camera;
    updatePanel(event);
    updateMap(currentIndex);
    if (focus) focusEvent(event, true, forceFocus);
    if (updateUrl) history.replaceState(null, "", "#" + event.id);
  }

  function drawEvents() {
    eventLayer.selectAll("path.event-route")
      .data(
        events.filter(event =>
          event.showRoute &&
          event.geometry &&
          event.geometry.type === "LineString"
        ),
        event => event.id
      )
      .join("path")
      .attr("class", "event-route")
      .attr("d", event => path(eventFeature(event)));

    const pointEvents = events.flatMap(pointRecords);
    eventLayer.selectAll("circle.event-pulse")
      .data(pointEvents, event => event.pointId)
      .join("circle")
      .attr("class", "event-pulse")
      .attr("cx", event => projection(event.point)[0])
      .attr("cy", event => projection(event.point)[1])
      .attr("r", 9);

    eventLayer.selectAll("circle.event-point")
      .data(pointEvents, event => event.pointId)
      .join("circle")
      .attr("class", "event-point")
      .attr("cx", event => projection(event.point)[0])
      .attr("cy", event => projection(event.point)[1])
      .attr("r", 6)
      .attr("tabindex", -1)
      .on("click", (_, event) => {
        if (allEventsMode) setEvent(event.index);
      })
      .on("keydown", (keyboardEvent, event) => {
        if (allEventsMode && (keyboardEvent.key === "Enter" || keyboardEvent.key === " ")) {
          keyboardEvent.preventDefault();
          setEvent(event.index);
        }
      });

    const placeLabels = events.flatMap(labelRecords);
    eventLayer.selectAll("text.event-place-label")
      .data(placeLabels, event => event.labelId)
      .join("text")
      .attr("class", "event-place-label")
      .attr("x", event => projection(event.point)[0])
      .attr("y", event => projection(event.point)[1])
      .attr("dy", event => labelScreenOffset(event))
      .attr("text-anchor", "middle")
      .text(event => event.placeLabel);
  }

  const labelScreenOffset = event => event.camera === "world" ? 15 : -10;

  function createStripeGradients(defs) {
    const pairs = new Map();
    events.forEach(event => {
      [event.territory, event.emphasis].forEach(changes => {
        changes.forEach(change => {
          if (change.fill.length === 2) pairs.set(change.fill.join("-"), change.fill);
        });
      });
    });
    const stripeVariants = Array.from(pairs.values()).flatMap(fill =>
      Object.keys(data.cameras).map(cameraName => ({
        cameraName,
        fill,
        scale: data.cameras[cameraName].zoom
      }))
    );
    const stripeGradients = defs.selectAll("linearGradient.atlas-stripe")
      .data(stripeVariants, stripe => stripeId(stripe.fill, stripe.cameraName))
      .join("linearGradient")
      .attr("class", "atlas-stripe")
      .attr("id", stripe => stripeId(stripe.fill, stripe.cameraName))
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", stripe => 8 / stripe.scale)
      .attr("y2", 0)
      .attr("spreadMethod", "repeat");
    stripeGradients.each(function (stripe) {
      const first = colors[stripe.fill[0]] || colors.default;
      const second = colors[stripe.fill[1]] || colors.default;
      d3.select(this).selectAll("stop")
        .data([
          { offset: 0, color: first },
          { offset: 0.5, color: first },
          { offset: 0.5, color: second },
          { offset: 1, color: second }
        ])
        .join("stop")
        .attr("offset", stop => stop.offset)
        .attr("stop-color", stop => stop.color);
    });
  }

  function updateEventSymbolScale(scale) {
    const safeScale = Math.max(scale, 0.001);
    eventLayer.selectAll(".event-point").attr("r", 6 / safeScale);
    eventLayer.selectAll(".event-pulse").attr("r", 12 / safeScale);
    eventLayer.selectAll(".event-place-label")
      .attr("dy", event => labelScreenOffset(event) / safeScale)
      .style("font-size", (12 / safeScale) + "px")
      .style("stroke-width", (3 / safeScale) + "px");
  }

  function updateRouteArrowSize(scale) {
    if (!routeArrow) return;
    const markerScreenSize = frame.clientWidth <= 624 ? 7 : 12;
    const markerUserSize = markerScreenSize / Math.max(scale, 0.001);
    routeArrow.attr("markerWidth", markerUserSize).attr("markerHeight", markerUserSize);
  }

  function updateZoomButtons(scale) {
    if (!zoom) return;
    const [minimumScale, maximumScale] = zoom.scaleExtent();
    const epsilon = 0.000001;
    zoomOutButton.disabled = scale <= minimumScale + epsilon;
    zoomInButton.disabled = scale >= maximumScale - epsilon;
  }

  function drawRegions(defs) {
    const regions = Object.entries(data.regions)
      .map(([id, region]) => ({ id, ...region }))
      .filter(region => !(region.clipCountry && region.territoryCountry));
    const clippedRegions = regions.filter(region => region.clipCountry);
    const clipPaths = defs.selectAll("clipPath.atlas-region-clip")
      .data(clippedRegions, region => region.id)
      .join("clipPath")
      .attr("class", "atlas-region-clip")
      .attr("id", region => "atlas-clip-" + region.id)
      .attr("clipPathUnits", "userSpaceOnUse");
    clipPaths.selectAll("path")
      .data(region => [countriesById.get(region.clipCountry)])
      .join("path")
      .attr("d", country => country ? path(country) : null);

    regionLayer.selectAll("path.region-overlay")
      .data(regions, region => region.id)
      .join("path")
      .attr("class", "region-overlay")
      .attr("data-region-id", region => region.id)
      .attr("aria-label", region => region.name)
      .attr(
        "clip-path",
        region => region.clipCountry ? "url(#atlas-clip-" + region.id + ")" : null
      )
      .attr("d", region => path(region.geometry));
  }

  function resize() {
    if (!projection || !mapLayer) return;
    clearTerritoryTransitions();
    const width = frame.clientWidth;
    const height = frame.clientHeight;
    updateRouteArrowSize(d3.zoomTransform(svg.node()).k);
    svg.attr("viewBox", "0 0 " + width + " " + height);
    projection.fitExtent([[24, 24], [width - 24, height - 24]], { type: "Sphere" });
    mapLayer.select(".sphere").attr("d", path({ type: "Sphere" }));
    mapLayer.select(".graticule").attr("d", path(d3.geoGraticule10()));
    mapLayer.selectAll("path.country:not(.territory-transition-old)").attr("d", path);
    mapLayer.select(".country-boundary").attr("d", path);
    drawRegions(svg.select("defs"));
    drawEvents();
    updateMap(currentIndex);
    if (!allEventsMode) focusEvent(events[currentIndex], false, true);
  }

  async function init() {
    try {
      const world = await d3.json("/mu3/assets/vendor/world-atlas/countries-110m.json");
      reassignTerritoryRegions(world);
      countries = topojson.feature(world, world.objects.countries).features;
      countriesById = new Map(
        countries.map(country => [normalizeCountryId(country.id), country])
      );
      const hiddenCountryBorders = new Set(
        (data.hiddenCountryBorders || []).map(pair => pair.join("-"))
      );
      borders = topojson.mesh(world, world.objects.countries, (a, b) => {
        if (a === b) return false;
        if (!a || !b) return true;
        const pair = [
          normalizeCountryId(a.id),
          normalizeCountryId(b.id)
        ].sort().join("-");
        return !hiddenCountryBorders.has(pair);
      });
      projection = d3.geoEqualEarth().rotate([-150, 0]);
      path = d3.geoPath(projection);

      const defs = svg.append("defs");
      routeArrow = defs.append("marker")
        .attr("id", "route-arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerUnits", "userSpaceOnUse")
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto");
      routeArrow.append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "context-stroke");
      createStripeGradients(defs);

      mapLayer = svg.append("g").attr("class", "map-layer");
      mapLayer.append("path").attr("class", "sphere");
      mapLayer.append("path").attr("class", "graticule");
      mapLayer.selectAll("path.country")
        .data(countries)
        .join("path")
        .attr("class", "country")
        .attr("data-country-id", country => normalizeCountryId(country.id));
      countryTransitionLayer = mapLayer.append("g")
        .attr("class", "territory-transition-layer territory-transition-layer--country");
      regionLayer = mapLayer.append("g").attr("class", "region-layer");
      regionTransitionLayer = mapLayer.append("g")
        .attr("class", "territory-transition-layer territory-transition-layer--region");
      mapLayer.append("path").datum(borders).attr("class", "country-boundary");
      eventLayer = svg.append("g").attr("class", "event-layer");

      zoom = d3.zoom().scaleExtent([0.65, 8]).on("zoom", zoomEvent => {
        mapLayer.attr("transform", zoomEvent.transform);
        eventLayer.attr("transform", zoomEvent.transform);
        updateEventSymbolScale(zoomEvent.transform.k);
        updateRouteArrowSize(zoomEvent.transform.k);
        updateZoomButtons(zoomEvent.transform.k);
      });
      svg.call(zoom);
      updateZoomButtons(d3.zoomTransform(svg.node()).k);

      zoomInButton.addEventListener("click", () => {
        svg.transition().duration(250).call(zoom.scaleBy, 1.5);
      });
      zoomOutButton.addEventListener("click", () => {
        svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.5);
      });
      zoomResetButton.addEventListener("click", () => {
        showWholeWorld(300);
      });

      resize();
      status.hidden = true;
      const hashIndex = events.findIndex(event => "#" + event.id === location.hash);
      setEvent(Math.max(0, hashIndex), true, hashIndex >= 0, true);
    } catch (error) {
      status.textContent = "地図資料を読み込めませんでした。";
      status.classList.add("is-error");
      console.error(error);
    }
  }

  slider.addEventListener("input", event => setEvent(Number(event.currentTarget.value)));
  slider.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setEvent(currentIndex - 1);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setEvent(currentIndex + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setEvent(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setEvent(events.length - 1);
    }
  });
  previousButton.addEventListener("click", () => setEvent(currentIndex - 1));
  nextButton.addEventListener("click", () => setEvent(currentIndex + 1));

  function showWholeWorld(duration) {
    currentCameraName = "";
    frame.dataset.camera = "world";
    svg.transition().duration(duration).call(zoom.transform, d3.zoomIdentity);
  }

  function setMapMode(mode) {
    allEventsMode = mode === "all";
    timelineModeButton.setAttribute("aria-pressed", String(!allEventsMode));
    allModeButton.setAttribute("aria-pressed", String(allEventsMode));
    updateMap(currentIndex);
    if (allEventsMode) {
      showWholeWorld(350);
    } else {
      frame.dataset.camera = events[currentIndex].camera;
      focusEvent(events[currentIndex], true, true);
    }
  }

  timelineModeButton.addEventListener("click", () => setMapMode("timeline"));
  allModeButton.addEventListener("click", () => setMapMode("all"));
  document.addEventListener("keydown", event => {
    if (event.target.matches("input, button, a")) return;
    if (event.key === "ArrowLeft") previousButton.click();
    if (event.key === "ArrowRight") nextButton.click();
  });

  const ticks = document.querySelector("[data-timeline-events]");
  const eventIndexById = new Map(events.map(event => [event.id, event.index]));
  const timelineLeft = index =>
    (index / Math.max(1, events.length - 1) * 100) + "%";
  events.forEach((event, index) => {
    const tick = document.createElement("i");
    tick.className = "timeline-event-tick";
    tick.style.left = timelineLeft(index);
    ticks.appendChild(tick);
  });
  (data.timelineMarks || []).forEach(mark => {
    const index = eventIndexById.get(mark.eventId);
    if (index === undefined) return;
    const majorMark = document.createElement("span");
    majorMark.className = "timeline-major-mark";
    majorMark.dataset.eventId = mark.eventId;
    majorMark.style.left = timelineLeft(index);
    const label = document.createElement("b");
    label.textContent = mark.label;
    majorMark.appendChild(label);
    ticks.appendChild(majorMark);
  });

  updatePanel(events[0]);
  new ResizeObserver(() => {
    updateResizeHandleValue();
    resize();
  }).observe(frame);
  init();
})();
