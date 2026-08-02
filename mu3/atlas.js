(() => {
  "use strict";

  const data = window.MU3_ATLAS_DATA;
  const svg = d3.select("#war-map");
  const frame = document.querySelector("[data-map-frame]");
  const status = document.querySelector("[data-map-status]");
  const slider = document.querySelector("[data-timeline]");
  const dateOutput = document.querySelector("[data-current-date]");
  const previousButton = document.querySelector('[data-step="prev"]');
  const nextButton = document.querySelector('[data-step="next"]');
  const timelineModeButton = document.querySelector('[data-map-mode="timeline"]');
  const allModeButton = document.querySelector('[data-map-mode="all"]');
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
    battle: '<svg class="chronol-type-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M10 2c0 -.88 1.056 -1.331 1.692 -.722c1.958 1.876 3.096 5.995 1.75 9.12l-.08 .174l.012 .003c.625 .133 1.203 -.43 2.303 -2.173l.14 -.224a1 1 0 0 1 1.582 -.153c1.334 1.435 2.601 4.377 2.601 6.27c0 4.265 -3.591 7.705 -8 7.705s-8 -3.44 -8 -7.706c0 -2.252 1.022 -4.716 2.632 -6.301l.605 -.589c.241 -.236 .434 -.43 .618 -.624c1.43 -1.512 2.145 -2.924 2.145 -4.78"/></svg>',
    weapon: '<svg class="chronol-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 15a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3"/><path d="M6 12l1 -5h5l3 5"/><path d="M21 9l-7.8 0"/></svg>',
    military: '<svg class="chronol-type-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12.555 2.168l6 4a1 1 0 0 1 .445 .832v12a3 3 0 0 1 -3 3h-8a3 3 0 0 1 -3 -3v-12a1 1 0 0 1 .445 -.832l6 -4a1 1 0 0 1 1.11 0m-.108 12.938a1 1 0 0 0 -.894 0l-2 1a1 1 0 0 0 -.447 1.341l.058 .102a1 1 0 0 0 1.283 .345l1.553 -.776l1.553 .776a1 1 0 0 0 .894 -1.788zm0 -4a1 1 0 0 0 -.894 0l-2 1a1 1 0 0 0 -.447 1.341l.058 .102a1 1 0 0 0 1.283 .345l1.553 -.776l1.553 .776a1 1 0 0 0 .894 -1.788zm0 -4a1 1 0 0 0 -.894 0l-2 1a1 1 0 0 0 -.447 1.341l.058 .102a1 1 0 0 0 1.283 .345l1.553 -.776l1.553 .776a1 1 0 0 0 .894 -1.788z"/></svg>',
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
  const events = data.events.map((event, index) => ({ ...event, index }));
  let currentIndex = 0;
  let currentCameraName = "";
  let projection;
  let path;
  let mapLayer;
  let regionLayer;
  let eventLayer;
  let zoom;
  let countries = [];
  let countriesById = new Map();
  let borders;
  let stripePatterns;
  let allEventsMode = false;

  slider.min = "0";
  slider.max = String(events.length - 1);
  slider.value = "0";
  slider.step = "1";

  const normalizeCountryId = value => String(value).padStart(3, "0");
  const patternId = fill => "atlas-stripe-" + fill.join("-");
  const paintFor = fill => {
    if (!fill || !fill.length) return colors.default;
    if (fill.length === 1) return colors[fill[0]] || colors.default;
    return "url(#" + patternId(fill) + ")";
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

  function updateDateOutput(displayDate) {
    dateOutput.replaceChildren();
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

  function updateTerritories(selectedIndex) {
    if (!mapLayer || !regionLayer) return;
    const state = territoryStateAt(selectedIndex);
    const emphasis = new Map();
    events[selectedIndex].emphasis.forEach(change => {
      expandTargets(change.targets).forEach(target => {
        emphasis.set(target, change.fill);
      });
    });
    mapLayer.selectAll(".country")
      .attr("data-territory", country => {
        const fill = state.get("country:" + normalizeCountryId(country.id));
        return fill ? fill.join("-") : null;
      })
      .attr("data-emphasis", country => {
        const fill = emphasis.get("country:" + normalizeCountryId(country.id));
        return fill ? fill.join("-") : null;
      })
      .style("fill", country => {
        const target = "country:" + normalizeCountryId(country.id);
        return paintFor(emphasis.get(target) || state.get(target));
      });
    regionLayer.selectAll(".region-overlay")
      .attr("data-territory", region => {
        const fill = state.get("region:" + region.id);
        return fill ? fill.join("-") : null;
      })
      .attr("data-emphasis", region => {
        const fill = emphasis.get("region:" + region.id);
        return fill ? fill.join("-") : null;
      })
      .style("fill", region => {
        const target = "region:" + region.id;
        const fill = emphasis.get(target) || state.get(target);
        return fill ? paintFor(fill) : "transparent";
      });
  }

  function clampVisibleLabels(transform) {
    if (!eventLayer || !transform) return;
    const frameBounds = frame.getBoundingClientRect();
    const inset = 6;
    eventLayer.selectAll(".event-place-label.is-visible")
      .attr("dx", 0)
      .each(function () {
        const labelBounds = this.getBoundingClientRect();
        let shift = 0;
        if (labelBounds.left < frameBounds.left + inset) {
          shift = frameBounds.left + inset - labelBounds.left;
        } else if (labelBounds.right > frameBounds.right - inset) {
          shift = frameBounds.right - inset - labelBounds.right;
        }
        d3.select(this).attr("dx", shift / transform.k);
      });
  }

  function updateMap(selectedIndex) {
    if (!eventLayer) return;
    eventLayer.selectAll(".event-route")
      .classed("is-visible", event => allEventsMode || event.index === selectedIndex)
      .classed("is-active", event => event.index === selectedIndex);
    eventLayer.selectAll(".event-point")
      .classed("is-visible", event => allEventsMode || event.index === selectedIndex)
      .classed("is-active", event => event.index === selectedIndex)
      .attr("tabindex", event => allEventsMode || event.index === selectedIndex ? 0 : -1);
    eventLayer.selectAll(".event-pulse")
      .classed("is-active", event => event.index === selectedIndex);
    eventLayer.selectAll(".event-place-label")
      .classed("is-visible", event => event.index === selectedIndex);
    updateTerritories(selectedIndex);
    clampVisibleLabels(d3.zoomTransform(svg.node()));
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
    updateDateOutput(event.date.display);
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
      .attr("role", "button")
      .attr("aria-label", event => event.date.display + " " + event.title)
      .on("click", (_, event) => setEvent(event.index))
      .on("keydown", (keyboardEvent, event) => {
        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
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
      .attr("dy", event => event.camera === "world" ? "1.25em" : "-0.85em")
      .attr("text-anchor", "middle")
      .text(event => event.placeLabel);
  }

  function createPatterns(defs) {
    const pairs = new Map();
    events.forEach(event => {
      [event.territory, event.emphasis].forEach(changes => {
        changes.forEach(change => {
          if (change.fill.length === 2) pairs.set(change.fill.join("-"), change.fill);
        });
      });
    });
    stripePatterns = defs.selectAll("pattern.atlas-stripe")
      .data(Array.from(pairs.values()), fill => fill.join("-"))
      .join("pattern")
      .attr("class", "atlas-stripe")
      .attr("id", fill => patternId(fill))
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 8)
      .attr("height", 8);
    stripePatterns.append("rect")
      .attr("class", "pattern-base")
      .attr("width", 8)
      .attr("height", 8)
      .attr("fill", fill => colors[fill[0]] || colors.default);
    stripePatterns.append("rect")
      .attr("class", "pattern-band")
      .attr("width", 4)
      .attr("height", 8)
      .attr("fill", fill => colors[fill[1]] || colors.default);
  }

  function updatePatternScale(scale) {
    if (!stripePatterns) return;
    const size = 8 / scale;
    stripePatterns.attr("width", size).attr("height", size);
    stripePatterns.select(".pattern-base").attr("width", size).attr("height", size);
    stripePatterns.select(".pattern-band").attr("width", size / 2).attr("height", size);
  }

  function drawRegions(defs) {
    const regions = Object.entries(data.regions).map(([id, region]) => ({ id, ...region }));
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
    const width = frame.clientWidth;
    const height = frame.clientHeight;
    svg.attr("viewBox", "0 0 " + width + " " + height);
    projection.fitExtent([[24, 24], [width - 24, height - 24]], { type: "Sphere" });
    mapLayer.select(".sphere").attr("d", path({ type: "Sphere" }));
    mapLayer.select(".graticule").attr("d", path(d3.geoGraticule10()));
    mapLayer.selectAll(".country").attr("d", path);
    mapLayer.select(".country-boundary").attr("d", path);
    drawRegions(svg.select("defs"));
    drawEvents();
    updateMap(currentIndex);
    if (!allEventsMode) focusEvent(events[currentIndex], false, true);
  }

  async function init() {
    try {
      const world = await d3.json("/mu3/assets/vendor/world-atlas/countries-110m.json");
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
      defs.append("marker")
        .attr("id", "route-arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "context-stroke");
      createPatterns(defs);

      mapLayer = svg.append("g").attr("class", "map-layer");
      mapLayer.append("path").attr("class", "sphere");
      mapLayer.append("path").attr("class", "graticule");
      mapLayer.selectAll("path.country")
        .data(countries)
        .join("path")
        .attr("class", "country")
        .attr("data-country-id", country => normalizeCountryId(country.id));
      regionLayer = mapLayer.append("g").attr("class", "region-layer");
      mapLayer.append("path").datum(borders).attr("class", "country-boundary");
      eventLayer = svg.append("g").attr("class", "event-layer");

      zoom = d3.zoom().scaleExtent([0.65, 8]).on("zoom", zoomEvent => {
        mapLayer.attr("transform", zoomEvent.transform);
        eventLayer.attr("transform", zoomEvent.transform);
        eventLayer.selectAll(".event-point").attr("r", 6 / zoomEvent.transform.k);
        eventLayer.selectAll(".event-pulse").attr("r", 12 / zoomEvent.transform.k);
        eventLayer.selectAll(".event-place-label")
          .style("font-size", (12 / zoomEvent.transform.k) + "px")
          .style("stroke-width", (3 / zoomEvent.transform.k) + "px");
        updatePatternScale(zoomEvent.transform.k);
        clampVisibleLabels(zoomEvent.transform);
      });
      svg.call(zoom);

      document.querySelector('[data-zoom="in"]').addEventListener("click", () => {
        svg.transition().duration(250).call(zoom.scaleBy, 1.5);
      });
      document.querySelector('[data-zoom="out"]').addEventListener("click", () => {
        svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.5);
      });
      document.querySelector('[data-zoom="reset"]').addEventListener("click", () => {
        showWholeWorld(300);
      });

      resize();
      status.hidden = true;
      const hashIndex = events.findIndex(event => "#" + event.id === location.hash);
      setEvent(Math.max(0, hashIndex), true, hashIndex >= 0, true);
      new ResizeObserver(resize).observe(frame);
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
  init();
})();
