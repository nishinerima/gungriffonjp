(() => {
  const form = document.querySelector("[data-search-form]");
  const input = document.querySelector("[data-search-input]");
  const clearButton = document.querySelector("[data-search-clear]");
  const variants = document.querySelector("[data-search-variants]");
  const status = document.querySelector("[data-search-status]");
  const correction = document.querySelector("[data-search-correction]");
  const usedTerms = document.querySelector("[data-search-terms]");
  const output = document.querySelector("[data-search-results]");
  const summary = document.querySelector(".site-search-summary");
  const siteShell = document.querySelector(".site-shell");
  const resultNav = document.querySelector("[data-search-result-nav]");
  const resultNavSummary = document.querySelector("[data-search-result-nav-summary]");
  const resultNavList = document.querySelector("[data-search-result-nav-list]");
  if (
    !form || !input || !clearButton || !variants || !status || !correction || !usedTerms || !output
    || !summary || !siteShell
    || !resultNav || !resultNavSummary || !resultNavList
  ) return;

  const INDEX_URL = "/search-index.json?v=20261004-2";
  const MAX_QUERY_LENGTH = 256;
  const MAX_QUERY_TERMS = 20;
  const MAX_ONE_CHARACTER_HITS = 100;
  const KWIC_LENGTH = 72;
  const KWIC_LEADING_CONTEXT = 28;
  const DASHES = /[‐‑‒–—―−ー]/g;
  const KATAKANA = /[ァ-ヶヽヾ]/g;
  const GRAPHEME_SEGMENTER = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("ja", { granularity: "grapheme" })
    : null;
  const SUBSITE_PATHS = [
    { path: "/wnpx.html", name: "wnpx", shortLabel: "WNPX" },
    { path: "/mu3/", name: "mu3", shortLabel: "mu3" },
    { path: "/comrade/", name: "comrade", shortLabel: "戦研" },
  ];
  let indexPromise;
  let activeSnippetFits = [];
  let snippetResizeFrame = 0;
  let searchRevision = 0;
  let submitRevision = 0;
  const syncClearButton = () => {
    clearButton.hidden = !input.value;
  };
  const subsiteForPage = (pageUrl) => SUBSITE_PATHS.find(({ path }) => (
    pageUrl === path || pageUrl.startsWith(path)
  ));

  const applySubsiteClasses = (element, baseClass, pageUrl) => {
    const subsite = subsiteForPage(pageUrl);
    if (!subsite) return;
    element.classList.add(`${baseClass}--subsite`, `${baseClass}--${subsite.name}`);
    return subsite;
  };

  const resultKeyColor = (value) => (/^#[0-9a-f]{6}$/i.test(value)
    ? value
    : "#71777a");

  const foldKana = (value) => value.replace(KATAKANA, (character) => (
    String.fromCharCode(character.charCodeAt(0) - 0x60)
  ));

  const normalizeUnit = (value, includeVariants = false) => {
    const normalized = value
      .normalize("NFKC")
      .toLocaleLowerCase("ja")
      .replace(DASHES, "-");
    return includeVariants ? foldKana(normalized) : normalized;
  };

  const normalize = (value, includeVariants = false) => normalizeUnit(value, includeVariants)
    .replace(/\s+/g, " ")
    .trim();

  const withSearchContext = (value, rawQuery, highlightTerms = []) => {
    const url = new URL(value, window.location.origin);
    url.searchParams.set("site-search", rawQuery.trim());
    url.searchParams.delete("site-search-term");
    highlightTerms.forEach((term) => url.searchParams.append("site-search-term", term));
    return `${url.pathname}${url.search}${url.hash}`;
  };

  const loadIndex = () => {
    if (!indexPromise) {
      indexPromise = fetch(INDEX_URL, { credentials: "same-origin" })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then((data) => ({
          corrections: (data.corrections || []).map(({ input, replacement }) => ({
            input,
            replacement,
            normalizedInput: normalize(input),
            normalizedReplacement: normalize(replacement),
            variantInput: normalize(input, true),
            variantReplacement: normalize(replacement, true),
          })),
          records: data.records.map((record) => ({
            ...record,
            normalizedPageTitle: normalize(record.pageTitle),
            normalizedTitle: normalize(record.title),
            normalizedText: normalize(record.text),
            normalizedDetailText: normalize(record.detailText || ""),
            normalizedAliases: (record.aliases || []).map(normalize),
            normalizedAliasGroups: (record.aliasGroups || []).map((group) => group.map(normalize)),
            variantPageTitle: normalize(record.pageTitle, true),
            variantTitle: normalize(record.title, true),
            variantText: normalize(record.text, true),
            variantDetailText: normalize(record.detailText || "", true),
            variantAliasGroups: (record.aliasGroups || []).map((group) => (
              group.map((value) => normalize(value, true))
            )),
          })),
        }));
    }
    return indexPromise;
  };

  const termCandidates = (record, term, includeVariants) => {
    if (!includeVariants) return [term];
    return record.variantAliasGroups.find((group) => group.includes(term)) || [term];
  };

  const correctedQuery = (value, corrections, includeVariants) => {
    let corrected = value;
    const applied = [];
    corrections.forEach((entry) => {
      const source = includeVariants ? entry.variantInput : entry.normalizedInput;
      const replacement = includeVariants
        ? entry.variantReplacement
        : entry.normalizedReplacement;
      if (!source || !corrected.includes(source)) return;
      corrected = corrected.split(source).join(replacement);
      applied.push({ input: entry.input, replacement: entry.replacement });
    });
    return { corrected, applied };
  };

  const recordSearchValues = (record, includeVariants, includeDetail) => {
    const hasAnchor = record.url.includes("#");
    const values = [includeVariants ? record.variantText : record.normalizedText];
    if (includeDetail) {
      values.push(includeVariants ? record.variantDetailText : record.normalizedDetailText);
    }
    if (!hasAnchor) {
      values.push(includeVariants ? record.variantPageTitle : record.normalizedPageTitle);
    }
    if (!hasAnchor || record.title !== record.pageTitle) {
      values.push(includeVariants ? record.variantTitle : record.normalizedTitle);
    }
    return values;
  };

  const recordContainsTerms = (record, terms, includeVariants, includeDetail) => {
    const haystack = recordSearchValues(record, includeVariants, includeDetail).join(" ");
    return terms.every((term) => (
      termCandidates(record, term, includeVariants).some((candidate) => haystack.includes(candidate))
    ));
  };

  const matchRecord = (record, terms, includeVariants) => {
    if (!recordContainsTerms(record, terms, includeVariants, true)) return null;
    return {
      detailOnly: !recordContainsTerms(record, terms, includeVariants, false),
    };
  };

  const highlightTermsForRecord = (record, terms, includeVariants, detailOnly = false) => {
    if (!includeVariants) return terms;
    const hasAnchor = record.url.includes("#");
    const sourceValues = [detailOnly ? record.detailText || "" : record.text];
    if (!hasAnchor || record.title !== record.pageTitle) sourceValues.push(record.title);
    if (!hasAnchor) sourceValues.push(record.pageTitle);
    const candidates = terms.flatMap((term) => (
      record.variantAliasGroups.find((group) => group.includes(term)) || [term]
    ));
    const resolved = [];
    const seen = new Set();
    sourceValues.forEach((value) => {
      originalMatches(value, candidates, true).forEach((label) => {
        const key = normalize(label);
        if (!key || seen.has(key)) return;
        seen.add(key);
        resolved.push(label);
      });
    });
    return resolved.length ? resolved : terms;
  };

  const normalizedCharacterMap = (value, includeVariants = false) => {
    const characters = Array.from(value);
    const startMap = [];
    const endMap = [];
    let normalizedText = "";
    let characterIndex = 0;
    const segments = GRAPHEME_SEGMENTER
      ? [...GRAPHEME_SEGMENTER.segment(value)].map(({ segment }) => segment)
      : characters;
    segments.forEach((segment) => {
      const segmentLength = Array.from(segment).length;
      const segmentEnd = characterIndex + segmentLength;
      const normalizedSegment = normalizeUnit(segment, includeVariants);
      for (let index = 0; index < normalizedSegment.length; index += 1) {
        const character = normalizedSegment[index];
        if (/\s/.test(character)) {
          if (!normalizedText || normalizedText.endsWith(" ")) continue;
          normalizedText += " ";
        } else {
          normalizedText += character;
        }
        startMap.push(characterIndex);
        endMap.push(segmentEnd);
      }
      characterIndex = segmentEnd;
    });
    if (normalizedText.endsWith(" ")) {
      normalizedText = normalizedText.slice(0, -1);
      startMap.pop();
      endMap.pop();
    }
    return { characters, startMap, endMap, normalizedText };
  };

  const makeSnippet = (text, terms, leadingContext = KWIC_LEADING_CONTEXT) => {
    const { characters, startMap, endMap, normalizedText } = normalizedCharacterMap(text);
    const positions = terms
      .map((term) => normalize(term))
      .filter(Boolean)
      .map((term) => ({ term, position: normalizedText.indexOf(term) }))
      .filter(({ position }) => position >= 0)
      .sort((left, right) => left.position - right.position);
    const first = positions[0];
    const focusStart = first ? startMap[first.position] : 0;
    const focusEnd = first
      ? endMap[first.position + first.term.length - 1]
      : 0;
    let start = Math.max(0, focusStart - leadingContext);
    let end = Math.min(characters.length, start + KWIC_LENGTH);
    if (end < focusEnd) {
      end = Math.min(characters.length, focusEnd + 12);
      start = Math.max(0, end - KWIC_LENGTH);
    }
    return `${start ? "…" : ""}${characters.slice(start, end).join("")}${end < characters.length ? "…" : ""}`;
  };

  const withoutLeadingTitle = (text, title) => {
    const source = text.trim();
    const heading = title.trim();
    if (!heading || !source.startsWith(heading)) return source;
    const remainder = source.slice(heading.length);
    if (remainder && !/^\s/.test(remainder)) return source;
    return remainder.trimStart();
  };

  const kwicSourceText = (record, detailOnly) => (
    detailOnly
      ? record.detailText || ""
      : withoutLeadingTitle(record.text, record.title)
  );

  const originalMatches = (value, terms, includeVariants = false) => {
    const { characters, startMap, endMap, normalizedText } = normalizedCharacterMap(
      value,
      includeVariants,
    );
    return terms.flatMap((term) => {
      const normalizedTerm = normalize(term, includeVariants);
      if (!normalizedTerm) return [];
      const position = normalizedText.indexOf(normalizedTerm);
      if (position < 0) return [];
      const start = startMap[position];
      const end = endMap[position + normalizedTerm.length - 1];
      return [characters.slice(start, end).join("")];
    });
  };

  const matchedLabelsForRecord = (record, terms, includeVariants) => {
    const highlightTerms = highlightTermsForRecord(record, terms, includeVariants);
    const labels = [];
    const seen = new Set();
    const sourceValues = [record.text, record.detailText || ""];
    if (!record.url.includes("#") || record.title !== record.pageTitle) {
      sourceValues.push(record.title);
    }
    if (!record.url.includes("#")) sourceValues.push(record.pageTitle);
    sourceValues.forEach((value) => {
      originalMatches(value, highlightTerms, includeVariants).forEach((label) => {
        const key = normalize(label);
        if (!key || seen.has(key)) return;
        seen.add(key);
        labels.push(label);
      });
    });
    return labels;
  };

  const highlightedRanges = (value, terms) => {
    const { characters, startMap, endMap, normalizedText } = normalizedCharacterMap(value);
    const ranges = [];
    terms.forEach((value) => {
      const term = normalize(value);
      if (!term) return;
      let from = 0;
      while (from < normalizedText.length) {
        const found = normalizedText.indexOf(term, from);
        if (found < 0) break;
        const start = startMap[found];
        const end = endMap[found + term.length - 1];
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

  const appendHighlightedText = (container, value, terms) => {
    const { characters, ranges } = highlightedRanges(value, terms);
    let cursor = 0;
    ranges.forEach(([start, end]) => {
      if (start > cursor) container.append(document.createTextNode(characters.slice(cursor, start).join("")));
      const mark = document.createElement("mark");
      mark.textContent = characters.slice(start, end).join("");
      container.append(mark);
      cursor = end;
    });
    if (cursor < characters.length) {
      container.append(document.createTextNode(characters.slice(cursor).join("")));
    }
  };

  const renderSnippet = ({ element, sourceText, highlightTerms }, leadingContext) => {
    element.replaceChildren();
    appendHighlightedText(
      element,
      makeSnippet(sourceText, highlightTerms, leadingContext),
      highlightTerms,
    );
  };

  const snippetFocusIsVisible = (element) => {
    const mark = element.querySelector("mark");
    if (!mark || !element.getClientRects().length) return true;
    const snippetRect = element.getBoundingClientRect();
    const markRect = mark.getBoundingClientRect();
    return markRect.left >= snippetRect.left && markRect.right <= snippetRect.right;
  };

  const fitSnippetToWidth = (snippetFit) => {
    renderSnippet(snippetFit, KWIC_LEADING_CONTEXT);
    if (snippetFocusIsVisible(snippetFit.element)) return;

    let minimum = 0;
    let maximum = KWIC_LEADING_CONTEXT - 1;
    let best = 0;
    while (minimum <= maximum) {
      const candidate = Math.floor((minimum + maximum) / 2);
      renderSnippet(snippetFit, candidate);
      if (snippetFocusIsVisible(snippetFit.element)) {
        best = candidate;
        minimum = candidate + 1;
      } else {
        maximum = candidate - 1;
      }
    }
    renderSnippet(snippetFit, best);
  };

  const fitRenderedSnippets = () => {
    activeSnippetFits.forEach(fitSnippetToWidth);
  };

  const matchSourceOccurrenceCount = (match, terms, includeVariants) => {
    const { record, detailOnly } = match;
    const highlightTerms = highlightTermsForRecord(record, terms, includeVariants, detailOnly);
    const sourceText = detailOnly ? record.detailText || "" : record.text;
    return highlightedRanges(sourceText, highlightTerms).ranges.length;
  };

  const matchOccurrenceCount = (match, terms, includeVariants) => {
    const { record } = match;
    const highlightTerms = highlightTermsForRecord(
      record,
      terms,
      includeVariants,
      match.detailOnly,
    );
    const sourceCount = matchSourceOccurrenceCount(match, terms, includeVariants);
    if (sourceCount) return sourceCount;
    const titleCount = highlightedRanges(record.title, highlightTerms).ranges.length;
    if (titleCount) return titleCount;
    return record.url.includes("#")
      ? 0
      : highlightedRanges(record.pageTitle, highlightTerms).ranges.length;
  };

  const highlightTermsForGroup = (hits, terms, includeVariants) => {
    const resolved = [];
    const seen = new Set();
    hits.forEach((hit) => {
      highlightTermsForRecord(hit.record, terms, includeVariants, hit.detailOnly)
        .forEach((term) => {
          const key = normalize(term);
          if (!key || seen.has(key)) return;
          seen.add(key);
          resolved.push(term);
        });
    });
    return resolved;
  };

  const pageOccurrenceCount = (
    hits,
    pageRecords,
    terms,
    includeVariants,
    detailOnly,
  ) => {
    if (!hits.length) return 0;
    const pageUrl = hits[0].record.url.split("#", 1)[0];
    const pageRecord = pageRecords.get(pageUrl);
    const highlightTerms = highlightTermsForGroup(hits, terms, includeVariants);
    if (pageRecord) {
      const sourceText = detailOnly ? pageRecord.detailText || "" : pageRecord.text;
      return highlightedRanges(sourceText, highlightTerms).ranges.length;
    }
    return hits.reduce((total, hit) => (
      total + matchOccurrenceCount(hit, terms, includeVariants)
    ), 0);
  };

  const totalOccurrenceCount = (
    matches,
    pageRecords,
    terms,
    includeVariants,
    detailOnly,
  ) => {
    const groups = new Map();
    matches.forEach((match) => {
      const pageUrl = match.record.url.split("#", 1)[0];
      if (!groups.has(pageUrl)) groups.set(pageUrl, []);
      groups.get(pageUrl).push(match);
    });
    return [...groups.values()].reduce((total, hits) => (
      total + pageOccurrenceCount(
        hits,
        pageRecords,
        terms,
        includeVariants,
        detailOnly,
      )
    ), 0);
  };

  const filterZeroOccurrenceGroups = (
    matches,
    pageRecords,
    terms,
    includeVariants,
    detailOnly,
  ) => {
    const groups = new Map();
    matches.forEach((match) => {
      const pageUrl = match.record.url.split("#", 1)[0];
      if (!groups.has(pageUrl)) groups.set(pageUrl, []);
      groups.get(pageUrl).push(match);
    });
    const visiblePages = new Set(
      [...groups.entries()]
        .filter(([, hits]) => pageOccurrenceCount(
          hits,
          pageRecords,
          terms,
          includeVariants,
          detailOnly,
        ) > 0)
        .map(([pageUrl]) => pageUrl),
    );
    return matches.filter((match) => (
      visiblePages.has(match.record.url.split("#", 1)[0])
    ));
  };

  const renderHit = (match, terms, rawQuery, includeVariants, snippetFits) => {
    const { record, detailOnly } = match;
    const highlightTerms = highlightTermsForRecord(record, terms, includeVariants, detailOnly);
    const sourceText = kwicSourceText(record, detailOnly);
    const item = document.createElement("li");
    item.className = "search-hit";
    const link = document.createElement("a");
    link.className = "search-hit__link";
    link.href = withSearchContext(record.url, rawQuery, highlightTerms);
    appendHighlightedText(link, record.title, highlightTerms);
    link.title = record.title;
    const snippet = document.createElement("span");
    snippet.className = "search-hit__snippet";
    const snippetFit = { element: snippet, sourceText, highlightTerms };
    renderSnippet(snippetFit, KWIC_LEADING_CONTEXT);
    snippetFits.push(snippetFit);
    item.append(link, snippet);
    return item;
  };

  const suppressBroaderDuplicates = (
    matches,
    terms,
    includeVariants,
  ) => matches.filter((match, index, allMatches) => {
    const pageUrl = match.record.url.split("#", 1)[0];
    const text = match.record.normalizedText;
    if (!match.record.url.includes("#") || text.length < 32) return true;
    return !allMatches.some((candidate, candidateIndex) => (
      candidateIndex !== index
      && candidate.record.url.includes("#")
      && candidate.record.url.split("#", 1)[0] === pageUrl
      && candidate.record.normalizedText.length > 0
      && candidate.record.normalizedText.length < text.length
      && matchSourceOccurrenceCount(candidate, terms, includeVariants) > 0
      && text.includes(candidate.record.normalizedText)
    ));
  });

  const clearFeedback = (element) => {
    element.hidden = true;
    element.replaceChildren();
  };

  const renderFeedback = (element, label, values, marker = "") => {
    clearFeedback(element);
    if (!values.length) return;
    const labelElement = document.createElement("span");
    labelElement.className = "site-search-feedback__label";
    labelElement.textContent = label;
    const markerElement = document.createElement("span");
    markerElement.className = "site-search-feedback__marker";
    markerElement.setAttribute("aria-hidden", "true");
    markerElement.textContent = marker;
    const valueList = document.createElement("span");
    valueList.className = "site-search-feedback__values";
    values.forEach((value) => {
      const valueElement = document.createElement("span");
      valueElement.className = "site-search-feedback__value";
      valueElement.textContent = value;
      valueList.append(valueElement);
    });
    element.append(labelElement);
    if (marker) element.append(markerElement);
    element.append(valueList);
    element.hidden = false;
  };

  const clearSearchFeedback = () => {
    clearFeedback(correction);
    clearFeedback(usedTerms);
  };

  const renderCorrection = (applied) => {
    renderFeedback(correction, "入力補正", applied.map(({ input, replacement }) => (
      `${input} → ${replacement}`
    )), "▲");
  };

  const renderUsedTerms = (matches, terms, baseQuery, includeVariants) => {
    clearFeedback(usedTerms);
    if (!includeVariants) return;

    const labels = [];
    const seen = new Set();
    const addLabel = (label) => {
      const key = normalize(label);
      if (!key || seen.has(key)) return;
      seen.add(key);
      labels.push(label);
    };
    addLabel(baseQuery.trim());
    matches.forEach((match) => {
      matchedLabelsForRecord(match.record, terms, true).forEach(addLabel);
    });
    if (labels.length < 2) return;

    renderFeedback(usedTerms, "検索した表記", labels);
  };

  const clearResultNavigation = () => {
    resultNav.hidden = true;
    resultNavSummary.textContent = "検索結果";
    resultNavList.replaceChildren();
  };

  const renderResultNavigation = (groups) => {
    resultNavList.replaceChildren();
    if (!groups.length) {
      clearResultNavigation();
      return;
    }

    resultNavSummary.textContent = `検索結果 ${groups.length}ページ`;
    groups.forEach((group) => {
      const item = document.createElement("li");
      item.style.setProperty("--search-result-key-color", resultKeyColor(group.keyColor));
      const link = document.createElement("a");
      link.href = `#${group.resultId}`;
      const label = document.createElement("span");
      label.className = "search-result-nav__label";
      const site = document.createElement("span");
      site.className = "search-result-nav__site";
      const subsite = applySubsiteClasses(site, "search-result-nav__site", group.pageUrl);
      if (subsite) label.classList.add("search-result-nav__label--subsite");
      site.textContent = subsite ? subsite.shortLabel : group.site;
      const title = document.createElement("span");
      title.className = "search-result-nav__title";
      title.textContent = group.pageTitle;
      const count = document.createElement("span");
      count.className = "search-result-nav__count";
      count.textContent = group.normalCount
        ? `${group.normalCount}件`
        : `その他${group.detailCount}件`;
      label.append(site, title);
      link.append(label, count);
      item.append(link);
      resultNavList.append(item);
    });
    resultNav.hidden = false;
  };

  const renderResultGroups = (
    container,
    matches,
    pageRecords,
    terms,
    rawQuery,
    includeVariants,
  ) => {
    const snippetFits = [];
    const groups = new Map();
    matches.forEach((match) => {
      const pageUrl = match.record.url.split("#", 1)[0];
      if (!groups.has(pageUrl)) {
        groups.set(pageUrl, {
          pageUrl,
          pageTitle: match.record.pageTitle,
          site: match.record.site,
          pageOrder: match.record.pageOrder,
          keyColor: match.record.keyColor,
          hits: [],
        });
      }
      groups.get(pageUrl).hits.push(match);
    });

    const orderedGroups = [...groups.values()].sort((left, right) => (
      left.pageOrder - right.pageOrder
      || left.pageTitle.localeCompare(right.pageTitle, "ja")
    ));
    orderedGroups.forEach((group) => {
      group.hits.sort((left, right) => (
        left.record.sectionOrder - right.record.sectionOrder
      ));
      group.normalHits = group.hits.filter((hit) => !hit.detailOnly);
      group.detailHits = group.hits.filter((hit) => hit.detailOnly);
      group.normalCount = pageOccurrenceCount(
        group.normalHits,
        pageRecords,
        terms,
        includeVariants,
        false,
      );
      group.detailCount = pageOccurrenceCount(
        group.detailHits,
        pageRecords,
        terms,
        includeVariants,
        true,
      );
      group.resultId = `search-result-page-${group.pageOrder}`;
    });
    renderResultNavigation(orderedGroups);
    orderedGroups.forEach((group) => {
      const { normalHits, detailHits } = group;
      const groupHighlightTerms = highlightTermsForGroup(
        normalHits.length ? normalHits : detailHits,
        terms,
        includeVariants,
      );
      const section = document.createElement("section");
      section.className = "search-result-group";
      section.id = group.resultId;
      const keyColor = resultKeyColor(group.keyColor);
      section.style.setProperty("--search-result-key-color", keyColor);
      const heading = document.createElement("h2");
      heading.className = "search-result-group__heading";
      const pageLink = document.createElement("a");
      pageLink.href = withSearchContext(
        group.pageUrl,
        rawQuery,
        groupHighlightTerms,
      );
      appendHighlightedText(pageLink, group.pageTitle, groupHighlightTerms);
      const title = document.createElement("span");
      title.className = "search-result-group__title";
      const site = document.createElement("span");
      site.className = "search-result-group__site";
      applySubsiteClasses(site, "search-result-group__site", group.pageUrl);
      site.textContent = group.site;
      title.append(site, pageLink);
      const count = document.createElement("span");
      count.className = "search-result-group__count";
      count.textContent = group.normalCount
        ? `${group.normalCount}件`
        : `その他${group.detailCount}件`;
      heading.append(title, count);
      const url = document.createElement("p");
      url.className = "search-result-group__url";
      url.textContent = group.pageUrl;
      section.append(heading, url);
      if (normalHits.length) {
        const list = document.createElement("ol");
        list.className = "search-hit-list";
        list.setAttribute("aria-label", "ページ内の該当箇所");
        normalHits.forEach((hit) => {
          list.append(renderHit(hit, terms, rawQuery, includeVariants, snippetFits));
        });
        section.append(list);
      }
      if (detailHits.length) {
        const details = document.createElement("details");
        details.className = "search-detail-results";
        const summary = document.createElement("summary");
        summary.textContent = `その他の結果 ${group.detailCount}件`;
        const body = document.createElement("div");
        body.className = "search-detail-results__body";
        const list = document.createElement("ol");
        list.className = "search-hit-list";
        list.setAttribute("aria-label", "ページ内のその他の該当箇所");
        detailHits.forEach((hit) => {
          list.append(renderHit(hit, terms, rawQuery, includeVariants, snippetFits));
        });
        body.append(list);
        details.append(summary, body);
        section.append(details);
      }
      container.append(section);
    });
    return snippetFits;
  };

  const renderResults = (
    matches,
    detailMatches,
    pageRecords,
    terms,
    rawQuery,
    includeVariants,
  ) => {
    output.replaceChildren();
    activeSnippetFits = renderResultGroups(
      output,
      [...matches, ...detailMatches],
      pageRecords,
      terms,
      rawQuery,
      includeVariants,
    );
    fitRenderedSnippets();
    document.dispatchEvent(new CustomEvent("search-results-rendered"));
  };

  const setSearchUpdating = (updating) => {
    document.body.classList.toggle("is-search-updating", updating);
    status.classList.toggle("is-updating", updating);
    if (updating) output.setAttribute("aria-busy", "true");
    else output.removeAttribute("aria-busy");
  };

  const clearRenderedResults = () => {
    activeSnippetFits = [];
    output.replaceChildren();
    clearSearchFeedback();
    clearResultNavigation();
  };

  const waitForControlPaint = () => new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });

  const scrollToResultsStart = () => {
    const formRect = form.getBoundingClientRect();
    const summaryRect = summary.getBoundingClientRect();
    const shadowHeight = Number.parseFloat(
      window.getComputedStyle(form, "::after").height
    ) || 0;
    const delta = summaryRect.top - formRect.bottom - shadowHeight;
    if (Math.abs(delta) <= 0.5) return;
    siteShell.scrollTo({
      top: Math.max(0, siteShell.scrollTop + delta),
      behavior: "auto",
    });
  };

  const runSearch = async (rawQuery, includeVariants, { preserveResults = false } = {}) => {
    const revision = ++searchRevision;
    const trimmedQuery = rawQuery.trim();
    const query = normalize(rawQuery);
    const canPreserveResults = preserveResults
      && output.childElementCount > 0
      && trimmedQuery.length <= MAX_QUERY_LENGTH
      && Boolean(query);
    if (!canPreserveResults) clearRenderedResults();
    if (trimmedQuery.length > MAX_QUERY_LENGTH) {
      setSearchUpdating(false);
      status.textContent = "検索語が長すぎます。短くして検索してください。";
      return;
    }
    if (!query) {
      setSearchUpdating(false);
      status.textContent = "";
      return;
    }
    setSearchUpdating(true);
    status.textContent = canPreserveResults
      ? "検索結果を更新しています…"
      : "検索しています…";
    try {
      if (canPreserveResults) {
        await waitForControlPaint();
        if (revision !== searchRevision) return;
      }
      const data = await loadIndex();
      if (revision !== searchRevision) return;
      const corrected = includeVariants
        ? correctedQuery(normalize(rawQuery, true), data.corrections, true)
        : { corrected: query, applied: [] };
      const correctedDisplay = includeVariants
        ? correctedQuery(query, data.corrections, false)
        : { corrected: query, applied: [] };
      const displayQuery = corrected.applied.length
        ? correctedDisplay.corrected
        : rawQuery.trim();
      const terms = [...new Set(corrected.corrected.split(" ").filter(Boolean))];
      if (terms.length > MAX_QUERY_TERMS) {
        clearRenderedResults();
        status.textContent = "検索語が多すぎます。語を減らして検索してください。";
        return;
      }
      const queryLength = Array.from(terms.join("").replace(/\s/g, "")).length;
      const records = data.records;
      const pageRecords = new Map(
        records
          .filter((record) => !record.url.includes("#"))
          .map((record) => [record.url, record]),
      );
      const matches = records
        .map((record) => {
          const result = matchRecord(record, terms, includeVariants);
          return result ? { record, ...result } : null;
        })
        .filter(Boolean);
      if (!matches.length) {
        clearRenderedResults();
        status.textContent = `「${displayQuery}」に一致する項目はありません。`;
        return;
      }
      const anchoredPages = new Set(
        matches
          .filter((match) => match.record.url.includes("#"))
          .map((match) => match.record.url.split("#", 1)[0])
      );
      const specificMatches = matches.filter((match) => (
        match.record.url.includes("#")
        || !anchoredPages.has(match.record.url.split("#", 1)[0])
      ));
      const visibleMatches = suppressBroaderDuplicates(
        specificMatches,
        terms,
        includeVariants,
      );
      const normalMatches = filterZeroOccurrenceGroups(
        visibleMatches.filter((match) => !match.detailOnly),
        pageRecords,
        terms,
        includeVariants,
        false,
      );
      const detailMatches = filterZeroOccurrenceGroups(
        visibleMatches.filter((match) => match.detailOnly),
        pageRecords,
        terms,
        includeVariants,
        true,
      );
      if (!normalMatches.length && !detailMatches.length) {
        clearRenderedResults();
        status.textContent = `「${displayQuery}」に一致する項目はありません。`;
        renderCorrection(corrected.applied);
        return;
      }
      const pageCount = new Set(normalMatches.map((match) => match.record.url.split("#", 1)[0])).size;
      const normalCount = totalOccurrenceCount(
        normalMatches,
        pageRecords,
        terms,
        includeVariants,
        false,
      );
      if (queryLength === 1 && normalCount > MAX_ONE_CHARACTER_HITS) {
        clearRenderedResults();
        status.textContent = `「${displayQuery}」は検索結果が多すぎます。もう少し詳しい言葉で検索してください。`;
        return;
      }
      clearSearchFeedback();
      status.textContent = normalMatches.length
        ? `「${displayQuery}」の検索結果：${pageCount}ページ / ${normalCount}件`
        : `「${displayQuery}」に一致する通常結果はありません。`;
      renderCorrection(corrected.applied);
      renderUsedTerms(
        [...normalMatches, ...detailMatches],
        terms,
        correctedDisplay.corrected,
        includeVariants,
      );
      renderResults(
        normalMatches,
        detailMatches,
        pageRecords,
        terms,
        rawQuery,
        includeVariants,
      );
    } catch (error) {
      if (revision !== searchRevision) return;
      clearRenderedResults();
      status.textContent = "検索データを読み込めませんでした。時間をおいて再度お試しください。";
      console.error("Site search failed", error);
    } finally {
      if (revision === searchRevision) setSearchUpdating(false);
    }
  };

  const searchFromLocation = () => {
    const url = new URL(window.location.href);
    const query = url.searchParams.get("q") || "";
    const includeVariants = url.searchParams.get("variants") !== "0";
    if (query.trim().length > MAX_QUERY_LENGTH) {
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url);
    }
    input.value = query;
    syncClearButton();
    variants.checked = includeVariants;
    runSearch(query, includeVariants);
  };

  const updateLocationAndSearch = (preserveResults = false) => {
    const query = input.value.trim();
    const includeVariants = variants.checked;
    const url = new URL(window.location.href);
    if (query.length > MAX_QUERY_LENGTH) {
      url.searchParams.delete("q");
      if (includeVariants) url.searchParams.delete("variants");
      else url.searchParams.set("variants", "0");
      window.history.pushState({}, "", url);
      return runSearch(query, includeVariants, { preserveResults });
    }
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (includeVariants) url.searchParams.delete("variants");
    else url.searchParams.set("variants", "0");
    window.history.pushState({}, "", url);
    return runSearch(query, includeVariants, { preserveResults });
  };

  const updateVariantsAndSearch = () => {
    const includeVariants = variants.checked;
    const url = new URL(window.location.href);
    const query = url.searchParams.get("q") || "";
    if (includeVariants) url.searchParams.delete("variants");
    else url.searchParams.set("variants", "0");
    window.history.pushState({}, "", url);
    runSearch(query, includeVariants, { preserveResults: true });
  };

  input.addEventListener("input", syncClearButton);
  clearButton.addEventListener("click", () => {
    input.value = "";
    syncClearButton();
    input.focus({ preventScroll: true });
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const revision = ++submitRevision;
    const shouldReturnToResultsStart = form.classList.contains("is-stuck")
      && summary.getBoundingClientRect().top < form.getBoundingClientRect().bottom;
    await updateLocationAndSearch(output.childElementCount > 0);
    if (!shouldReturnToResultsStart || revision !== submitRevision) return;
    await waitForControlPaint();
    if (revision === submitRevision) scrollToResultsStart();
  });
  variants.addEventListener("change", updateVariantsAndSearch);
  output.addEventListener("toggle", (event) => {
    if (!event.target.matches(".search-detail-results") || !event.target.open) return;
    window.requestAnimationFrame(fitRenderedSnippets);
  }, true);
  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(snippetResizeFrame);
    snippetResizeFrame = window.requestAnimationFrame(fitRenderedSnippets);
  });
  const restoreSearchFromLocationIfNeeded = () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    const includeVariants = params.get("variants") !== "0";
    if (input.value === query && variants.checked === includeVariants) return;
    searchFromLocation();
  };
  window.addEventListener("popstate", restoreSearchFromLocationIfNeeded);
  window.addEventListener("pageshow", restoreSearchFromLocationIfNeeded);
  searchFromLocation();
})();

(() => {
  const form = document.querySelector("[data-search-form]");
  if (!form) return;

  const siteShell = document.querySelector(".site-shell");
  const mainColumn = document.querySelector(".main-column");
  const header = document.querySelector(".site-header");
  const pageNav = document.querySelector(".page-nav");
  const desktop = window.matchMedia("(min-width: 761px)");
  let frame;

  const update = () => {
    frame = undefined;
    if (desktop.matches && header) {
      form.style.setProperty(
        "--search-controls-sticky-top",
        `${header.getBoundingClientRect().bottom}px`
      );
    } else if (pageNav?.classList.contains("is-mobile-stuck")) {
      form.style.setProperty(
        "--search-controls-sticky-top",
        `${pageNav.getBoundingClientRect().bottom}px`
      );
    } else {
      form.style.removeProperty("--search-controls-sticky-top");
    }

    const scrollTop = siteShell?.scrollTop || 0;
    const formRect = form.getBoundingClientRect();
    const shadowBounds = desktop.matches ? mainColumn : siteShell;
    const shadowBoundsRect = shadowBounds?.getBoundingClientRect();
    if (shadowBoundsRect) {
      form.style.setProperty(
        "--search-shadow-inline-start",
        `${Math.max(0, formRect.left - shadowBoundsRect.left)}px`
      );
      form.style.setProperty(
        "--search-shadow-inline-end",
        `${Math.max(0, shadowBoundsRect.right - formRect.right)}px`
      );
    }

    const stickyTop = Number.parseFloat(window.getComputedStyle(form).top) || 0;
    const isStuck =
      scrollTop > 0 && formRect.top <= stickyTop + 0.5;
    form.classList.toggle("is-stuck", isStuck);
  };

  const scheduleUpdate = () => {
    if (frame !== undefined) return;
    frame = window.requestAnimationFrame(update);
  };

  siteShell?.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  desktop.addEventListener("change", scheduleUpdate);
  update();
})();
