(() => {
  const page = document.querySelector(".wnpx-page");

  if (!page) {
    return;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    return;
  }

  canvas.className = "wnpx-steps-canvas";
  canvas.setAttribute("aria-hidden", "true");
  page.prepend(canvas);

  const readNumber = (styles, name, fallback) => {
    const value = Number.parseFloat(styles.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };

  const readNumberList = (styles, name, fallback) => {
    const values = styles.getPropertyValue(name)
      .split(/[\s,]+/)
      .map((value) => Number.parseFloat(value))
      .filter((value) => Number.isFinite(value) && value > 0);

    return values.length === fallback.length ? values : fallback;
  };

  const randomUnit = (seed, column, group) => {
    let value = (
      seed ^
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

  const positiveModulo = (value, divisor) => (
    (value % divisor + divisor) % divisor
  );

  const draw = () => {
    const styles = getComputedStyle(page);
    const palette = {
      brown: styles.getPropertyValue("--wnpx-steps-brown").trim() || "#4a3828",
      mustard: styles.getPropertyValue("--wnpx-steps-mustard").trim() || "#b89b41",
      od: styles.getPropertyValue("--wnpx-steps-od").trim() || "#555f35"
    };
    const bandColors = [
      palette.mustard,
      palette.brown,
      palette.od,
      palette.brown,
      palette.mustard,
      palette.brown,
      palette.od
    ];
    const bandWidths = readNumberList(
      styles,
      "--wnpx-steps-band-widths",
      [190, 64, 210, 64, 185, 64, 220]
    );
    const rowHeight = Math.max(
      24,
      readNumber(styles, "--wnpx-steps-row-height", 72)
    );
    const stepDepth = Math.max(
      0,
      readNumber(styles, "--wnpx-steps-depth", 76)
    );
    const roughness = Math.max(
      0,
      readNumber(styles, "--wnpx-steps-roughness", 0.85)
    );
    const seed = Math.round(readNumber(styles, "--wnpx-steps-seed", 73457));
    const cycleWidth = bandWidths.reduce((total, width) => total + width, 0);
    const viewportWidth = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const mainColumn = page.querySelector(".main-column");
    const patternStart = Math.max(
      0,
      Math.min(viewportWidth - 1, mainColumn?.getBoundingClientRect().left || 0)
    );
    const width = Math.max(1, viewportWidth - patternStart);

    canvas.width = Math.round(viewportWidth * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.imageSmoothingEnabled = false;
    context.fillStyle = palette.od;
    context.fillRect(0, 0, viewportWidth, height);
    context.save();
    context.translate(patternStart, 0);

    for (let row = 0, y = 0; y < height; row += 1, y += rowHeight) {
      let x = -cycleWidth;
      let column = -bandColors.length;

      while (x < width) {
        const bandIndex = positiveModulo(column, bandColors.length);
        const baseWidth = bandWidths[bandIndex];
        const holdRows = 1 + positiveModulo(column, 3);
        const phase = positiveModulo(column, holdRows);
        const group = Math.floor((row + phase) / holdRows);
        const variationLimit = (
          Math.min(stepDepth, baseWidth * 0.55) * roughness
        );
        const variation = (
          randomUnit(seed, column, group) * 2 - 1
        ) * variationLimit;
        const bandWidth = Math.max(24, baseWidth + variation);

        if (x + bandWidth > 0) {
          context.fillStyle = bandColors[bandIndex];
          context.fillRect(
            Math.floor(x),
            Math.floor(y),
            Math.ceil(bandWidth) + 1,
            Math.ceil(rowHeight) + 1
          );
        }

        x += bandWidth;
        column += 1;
      }
    }

    context.restore();
  };

  let resizeFrame = 0;

  const scheduleDraw = () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(draw);
  };

  window.addEventListener("resize", scheduleDraw, { passive: true });
  draw();
})();

(() => {
  const faces = [...document.querySelectorAll(".wnpx-nav-label__face")];
  const desktop = window.matchMedia("(min-width: 761px)");

  if (!faces.length) {
    return;
  }

  const fitFaces = () => {
    for (const face of faces) {
      face.style.removeProperty("--wnpx-nav-label-scale");
    }

    if (!desktop.matches) {
      return;
    }

    for (const face of faces) {
      const availableWidth = Math.max(1, face.clientWidth - 2);
      const naturalWidth = Math.max(1, face.scrollWidth);
      const scale = Math.min(1, availableWidth / naturalWidth);

      face.style.setProperty("--wnpx-nav-label-scale", scale.toFixed(4));
    }
  };

  let fitFrame = 0;
  const scheduleFit = () => {
    window.cancelAnimationFrame(fitFrame);
    fitFrame = window.requestAnimationFrame(fitFaces);
  };

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(scheduleFit);
    observer.observe(document.querySelector(".global-nav"));
  } else {
    window.addEventListener("resize", scheduleFit, { passive: true });
  }

  if (desktop.addEventListener) {
    desktop.addEventListener("change", scheduleFit);
  } else {
    desktop.addListener(scheduleFit);
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleFit);
  }

  fitFaces();
})();
