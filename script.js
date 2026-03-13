/*
  Korea Coffee Remix — Scrollytelling data story

  Data placement:
  - Put all CSV files in the local /data folder (already present in this repo).
  - Run via a local server (e.g., `python3 -m http.server 8000`) so the browser can load CSVs.

  Required datasets:
  - data/coffee_consumption.csv
  - data/coffee_shop_counts.csv
  - data/kor_youth_unemployment_tidy.csv
  - data/coffee_market_revenue.csv
*/

const fmtComma = d3.format(",");
const fmt1 = d3.format(".1f");
const fmtDollar0 = d3.format("$,.0f");

const COLORS = {
  accent: getCssVar("--accent", "#6a3e2f"),
  accent2: getCssVar("--accent-2", "#b8704b"),
  accent3: getCssVar("--accent-3", "#9b8b7d"),
  muted: getCssVar("--muted", "#6f635d"),
};

const tooltip = createTooltip();

init();

async function init() {
  try {
    const [consumption, shops, totalU, revenue] = await Promise.all([
      d3.csv("data/coffee_consumption.csv", d3.autoType),
      d3.csv("data/coffee_shop_counts.csv", d3.autoType),
      // Robust load: this file may have a leading blank line; trim before parsing.
      d3
        .text("data/kor_unemployment_total_tidy.csv")
        .then((t) => d3.csvParse(String(t || "").trim(), d3.autoType)),
      // Robust load: allow an accidental leading blank line.
      d3
        .text("data/coffee_market_revenue.csv")
        .then((t) => d3.csvParse(String(t || "").trim(), d3.autoType)),
    ]);

    renderCoffeeConsumptionChart();
    renderCafeMilestoneChart(shops);
    renderPressureChart(shops, totalU);
    renderCounterBarCharts(consumption, revenue);

    setupCafeMilestoneEnterAnimation();
  } catch (error) {
    // Fail loudly but clearly for class/assignment debugging.
    // eslint-disable-next-line no-console
    console.error("Failed to initialize charts:", error);
    showFatalMessage(
      "Data loading failed. Make sure you are running this page from a local web server (not opening the HTML file directly)."
    );
  }
}

// -----------------------------
// SECTION 1 — DEMAND (Sparse benchmarks: stat card + lollipop)
// -----------------------------

async function renderCoffeeConsumptionChart() {
  const root = document.querySelector(".consumption-section");
  if (!root) return;

  const statEl = root.querySelector(".stat-card");
  const chartEl = root.querySelector(".lollipop-chart");
  if (!statEl || !chartEl) return;

  // Load inside this function (as required), so the visualization is modular.
  const rows = await d3.csv("data/coffee_consumption.csv", d3.autoType);

  const kgRows = rows
    .filter((d) => d?.consumption_kg_per_capita != null && d?.year != null)
    .map((d) => ({
      year: +d.year,
      value: +d.consumption_kg_per_capita,
      source_note: d.source_note,
    }))
    .sort((a, b) => a.year - b.year);

  const cupsRows = rows
    .filter((d) => d?.consumption_cups_per_year != null && d?.year != null)
    .map((d) => ({
      year: +d.year,
      value: +d.consumption_cups_per_year,
      source_note: d.source_note,
    }))
    .sort((a, b) => a.year - b.year);

  const stat = kgRows.find((d) => d.year === 2013) || kgRows[0];
  const lollipopData = [
    cupsRows.find((d) => d.year === 2018),
    cupsRows.find((d) => d.year === 2023),
  ].filter(Boolean);

  // Graceful fallback if expected years are missing.
  const points = lollipopData.length === 2 ? lollipopData : cupsRows.slice(0, 2);

  if (!stat || points.length === 0) {
    statEl.innerHTML =
      "<div class=\"stat-subtitle\">Coffee consumption benchmark</div><div class=\"stat-number\">–</div><p class=\"stat-label\">Data unavailable</p>";
    chartEl.innerHTML = "<p class=\"caption\">No cups-per-year benchmark values found in the CSV.</p>";
    return;
  }

  // --- LEFT PANEL: stat card ---
  statEl.innerHTML = `
    <div class="stat-subtitle">Coffee consumption </div>
    <div class="stat-number">${fmt1(stat.value)}</div>
    <p class="stat-label">kg of coffee per person</p>
    <div class="stat-year">${stat.year}</div>
    
  `;

  // --- RIGHT PANEL: lollipop chart ---
  chartEl.innerHTML = "";
  const title = document.createElement("div");
  title.className = "chart-title";
  title.textContent = "Cups per person per year";
  chartEl.appendChild(title);

  const svg = d3.select(chartEl).append("svg");

  function draw() {
    const bounds = chartEl.getBoundingClientRect();
    const width = Math.max(360, Math.floor(bounds.width));
    const rowH = 44;
    const height = Math.max(190, 34 + rowH * points.length);
    const margin = { top: 28, right: 24, bottom: 44, left: 70 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xMax = d3.max(points, (d) => d.value) ?? 1;
    const x = d3
      .scaleLinear()
      .domain([0, xMax * 1.12])
      .range([0, innerW])
      .nice();

    const y = d3
      .scaleBand()
      .domain(points.map((d) => String(d.year)))
      .range([0, innerH])
      .padding(0.5);

    // Minimal axes: clean typography, minimal gridlines.
    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(4));

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0));

    // Lollipop stems
    const stems = g
      .append("g")
      .selectAll("line")
      .data(points, (d) => d.year)
      .join("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", (d) => y(String(d.year)) + y.bandwidth() / 2)
      .attr("y2", (d) => y(String(d.year)) + y.bandwidth() / 2)
      .attr("stroke", colorMix(COLORS.accent, COLORS.accent3, 0.55))
      .attr("stroke-width", 6)
      .attr("stroke-linecap", "round");

    // Dots
    const dots = g
      .append("g")
      .selectAll("circle")
      .data(points, (d) => d.year)
      .join("circle")
      .attr("cx", x(0))
      .attr("cy", (d) => y(String(d.year)) + y.bandwidth() / 2)
      .attr("r", 8)
      .attr("fill", COLORS.accent2)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .on("mousemove", (event, d) => {
        tooltip.show(
          event,
          `<strong>${d.year}</strong><br>${fmtComma(d.value)} cups per year<br><span style="opacity:.85">${escapeHtml(d.source_note || "")}</span>`
        );
      })
      .on("mouseleave", () => tooltip.hide());

    // Value labels
    const labels = g
      .append("g")
      .selectAll("text")
      .data(points, (d) => d.year)
      .join("text")
      .attr("x", x(0) + 10)
      .attr("y", (d) => y(String(d.year)) + y.bandwidth() / 2 + 4)
      .attr("fill", COLORS.muted)
      .style("font", "600 12px ui-sans-serif, system-ui")
      .text((d) => `${fmtComma(d.value)} cups`)
      .attr("opacity", 0);

    // Load animation
    stems
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr("x2", (d) => x(d.value));

    dots
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr("cx", (d) => x(d.value));

    labels
      .transition()
      .delay(500)
      .duration(650)
      .attr("x", (d) => x(d.value) + 10)
      .attr("opacity", 1);
  }

  draw();

  // Responsive redraw
  const key = "__kcr_consumption_ro";
  if (chartEl[key]) chartEl[key].disconnect();
  chartEl[key] = new ResizeObserver(() => draw());
  chartEl[key].observe(chartEl);
}

// -----------------------------
// SECTION 1 — DEMAND (Toggle line)
// -----------------------------

function renderDemandToggleLine(raw) {
  const svg = d3.select("#chart-demand");
  const titleEl = document.querySelector("#demand-metric-label");

  const METRICS = {
    kg: {
      key: "kg",
      label: "Kilograms per capita",
      field: "consumption_kg_per_capita",
      valueLabel: (v) => `${fmt1(v)} kg/person`,
      annotationYear: 2013,
      annotationText: "2013 · ~2.3 kg/person",
    },
    cups: {
      key: "cups",
      label: "Cups per year",
      field: "consumption_cups_per_year",
      valueLabel: (v) => `${fmtComma(v)} cups/person/yr`,
      annotationYear: 2018,
      annotationText: "2018 · ~353 cups/person",
    },
  };

  const state = { metric: "cups" };

  const width = 900;
  const height = 380;
  const margin = { top: 18, right: 22, bottom: 52, left: 72 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(raw, (d) => d.year))
    .range([0, innerW]);

  const y = d3.scaleLinear().range([innerH, 0]);

  const xAxis = g
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  const yAxis = g.append("g").attr("class", "axis");

  const yLabel = g
    .append("text")
    .attr("x", -innerH / 2)
    .attr("y", -54)
    .attr("transform", "rotate(-90)")
    .attr("fill", COLORS.muted)
    .attr("text-anchor", "middle")
    .style("font", "12px ui-sans-serif, system-ui")
    .text("");

  const line = d3
    .line()
    .defined((d) => d.value != null)
    .x((d) => x(d.year))
    .y((d) => y(d.value));

  const path = g
    .append("path")
    .attr("fill", "none")
    .attr("stroke", COLORS.accent)
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round");

  const pointsG = g.append("g");
  const annG = g.append("g");

  function getSeries(metricKey) {
    const m = METRICS[metricKey];
    const series = raw
      .map((d) => ({ year: d.year, value: d[m.field] }))
      .filter((d) => d.value != null)
      .sort((a, b) => a.year - b.year);
    return { metric: m, series };
  }

  function setMetric(metricKey) {
    state.metric = metricKey;

    const { metric, series } = getSeries(metricKey);

    titleEl.textContent = metric.label;

    // If very sparse (e.g., 1 point), still render cleanly.
    const maxY = d3.max(series, (d) => d.value) ?? 1;
    const minY = d3.min(series, (d) => d.value) ?? 0;
    const pad = (maxY - minY) * 0.18 || maxY * 0.25 || 1;

    y.domain([Math.max(0, minY - pad), maxY + pad]).nice();

    yAxis
      .transition()
      .duration(650)
      .call(d3.axisLeft(y).ticks(5));

    yLabel.text(metricKey === "kg" ? "Kilograms per person" : "Cups per person per year");

    path
      .datum(series)
      .transition()
      .duration(650)
      .attr("d", line);

    const circles = pointsG.selectAll("circle").data(series, (d) => d.year);

    circles
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("r", 5)
            .attr("fill", "#fffdf9")
            .attr("stroke", COLORS.accent)
            .attr("stroke-width", 2)
            .attr("cx", (d) => x(d.year))
            .attr("cy", (d) => y(d.value))
            .on("mousemove", (event, d) => {
              tooltip.show(event, `<strong>${d.year}</strong><br>${metric.valueLabel(d.value)}`);
            })
            .on("mouseleave", () => tooltip.hide()),
        (update) => update,
        (exit) => exit.remove()
      )
      .transition()
      .duration(650)
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y(d.value));

    renderAnnotation(metric, series);

    // Toggle button UI
    document.querySelectorAll("[data-demand-toggle]").forEach((btn) => {
      const active = btn.getAttribute("data-demand-toggle") === metricKey;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function renderAnnotation(metric, series) {
    annG.selectAll("*").remove();

    const point = series.find((d) => d.year === metric.annotationYear);
    if (!point) return;

    const x0 = x(point.year);
    const y0 = y(point.value);

    annG
      .append("circle")
      .attr("cx", x0)
      .attr("cy", y0)
      .attr("r", 7)
      .attr("fill", COLORS.accent2)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    annG
      .append("line")
      .attr("x1", x0)
      .attr("y1", y0)
      .attr("x2", x0 + 70)
      .attr("y2", y0 - 42)
      .attr("stroke", COLORS.accent2)
      .attr("stroke-width", 2);

    annG
      .append("text")
      .attr("x", x0 + 76)
      .attr("y", y0 - 46)
      .attr("fill", COLORS.muted)
      .style("font", "12px ui-sans-serif, system-ui")
      .text(metric.annotationText);
  }

  document.querySelectorAll("[data-demand-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => setMetric(btn.getAttribute("data-demand-toggle")));
  });

  // Initial render
  setMetric(state.metric);
}

// -----------------------------
// SECTION 2 — EXPANSION (Area + line, animate on enter)
// -----------------------------

function renderCafeMilestoneChart(raw) {
  const svg = d3.select("#chart-expansion");
  if (svg.empty()) return;

  svg.selectAll("*").remove();

  const data = raw
    .filter((d) => d?.year != null && d?.coffee_shop_count != null)
    .map((d) => ({
      year: +d.year,
      value: +d.coffee_shop_count,
      source_note: d.source_note,
    }))
    .sort((a, b) => a.year - b.year);

  const width = 1040;
  const height = 440;
  const margin = { top: 20, right: 22, bottom: 58, left: 84 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  if (data.length === 0) {
    g.append("text")
      .attr("fill", COLORS.muted)
      .style("font", "12px ui-sans-serif, system-ui")
      .text("No benchmark data available");
    return;
  }

  // Use a discrete year axis so the graphic reads as milestone observations.
  const years = data.map((d) => d.year);
  const x = d3.scalePoint().domain(years).range([0, innerW]).padding(0.35);

  const y = d3
    .scaleLinear()
    .domain([0, (d3.max(data, (d) => d.value) ?? 1) * 1.12])
    .nice()
    .range([innerH, 0]);

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(fmtComma));

  g.append("text")
    .attr("x", -innerH / 2)
    .attr("y", -62)
    .attr("transform", "rotate(-90)")
    .attr("fill", COLORS.muted)
    .attr("text-anchor", "middle")
    .style("font", "12px ui-sans-serif, system-ui")
    .text("Number of coffee shops");

  // A subtle in-chart note to avoid implying a dense annual series.
  g.append("text")
    .attr("class", "milestone-note")
    .attr("x", innerW)
    .attr("y", innerH + 44)
    .attr("text-anchor", "end")
    .attr("fill", COLORS.muted)
    .text("Benchmark years only");

  const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.value));

  const path = g
    .append("path")
    .datum(data)
    .attr("class", "milestone-line")
    .attr("fill", "none")
    .attr("stroke", COLORS.accent)
    .attr("stroke-width", 2.5)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("d", line);

  // Points
  const dotsG = g.append("g");
  const dots = dotsG
    .selectAll("circle")
    .data(data, (d) => d.year)
    .join("circle")
    .attr("class", "milestone-dot")
    .attr("cx", (d) => x(d.year))
    .attr("cy", (d) => y(d.value))
    .attr("r", (d) => (d.year === 2016 || d.year === 2022 ? 10 : 9))
    .attr("fill", COLORS.accent)
    .attr("stroke", getCssVar("--bg", "#f7f3ee"))
    .attr("stroke-width", 2)
    .attr("opacity", 0)
    .on("mousemove", (event, d) => {
      dots.attr("r", (p) => (p.year === 2016 || p.year === 2022 ? 10 : 9));
      dots.filter((p) => p.year === d.year).attr("r", 12);
      labels
        .classed("is-active", (p) => p.year === d.year)
        .attr("fill", (p) => (p.year === d.year ? COLORS.accent : COLORS.muted))
        .attr("font-weight", (p) => (p.year === d.year ? 700 : 600));

      tooltip.show(
        event,
        `<strong>${d.year}</strong><br>${fmtComma(d.value)} coffee shops` +
          (d.source_note ? `<br><span style="opacity:.85">${escapeHtml(d.source_note)}</span>` : "")
      );
    })
    .on("mouseleave", () => {
      dots.attr("r", (d) => (d.year === 2016 || d.year === 2022 ? 10 : 9));
      labels.classed("is-active", false).attr("fill", COLORS.muted).attr("font-weight", 600);
      tooltip.hide();
    });

  // Value labels near each milestone
  const labels = g
    .append("g")
    .selectAll("text")
    .data(data, (d) => d.year)
    .join("text")
    .attr("class", "milestone-label")
    .attr("x", (d) => x(d.year))
    .attr("y", (d) => y(d.value) - 14)
    .attr("text-anchor", "middle")
    .attr("fill", COLORS.muted)
    .attr("font-weight", (d) => (d.year === 2016 || d.year === 2022 ? 700 : 600))
    .text((d) => fmtComma(d.value))
    .attr("opacity", 0);

  // Story annotation: nearly doubled
  const start = data.find((d) => d.year === 2016) || data[0];
  const end = data.find((d) => d.year === 2022) || data[data.length - 1];

  if (start && end) {
    const growth = ((end.value - start.value) / start.value) * 100;
    const ax1 = x(start.year);
    const ax2 = x(end.year);
    const ay = 18;

    const ann = g.append("g").attr("class", "milestone-annotation");

    ann
      .append("line")
      .attr("x1", ax1)
      .attr("x2", ax2)
      .attr("y1", ay)
      .attr("y2", ay)
      .attr("stroke", colorMix(COLORS.accent2, COLORS.accent3, 0.55))
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("opacity", 0.9);

    ann
      .append("text")
      .attr("x", (ax1 + ax2) / 2)
      .attr("y", ay - 8)
      .attr("text-anchor", "middle")
      .attr("fill", COLORS.accent2)
      .attr("font-weight", 700)
      .text(`Nearly doubled in six years (+${fmt1(growth)}%)`);
  }

  // Prepare line-draw animation (triggered on enter)
  const totalLength = path.node().getTotalLength();
  path
    .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
    .attr("stroke-dashoffset", totalLength);

  svg.node().__animate = () => {
    path
      .transition()
      .duration(1100)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0)
      .on("end", () => {
        dots
          .transition()
          .duration(600)
          .ease(d3.easeCubicOut)
          .attr("opacity", 1);

        labels
          .transition()
          .delay(120)
          .duration(650)
          .ease(d3.easeCubicOut)
          .attr("opacity", 1);
      });
  };
}

function setupCafeMilestoneEnterAnimation() {
  const svg = document.querySelector("#chart-expansion");
  if (!svg) return;

  let hasAnimated = false;
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting || hasAnimated) return;

      hasAnimated = true;
      if (typeof svg.__animate === "function") svg.__animate();
      observer.disconnect();
    },
    { threshold: 0.35 }
  );

  observer.observe(svg);
}

// -----------------------------
// SECTION 3 — PRESSURE (Scroll-driven milestone chart: benchmark years only)
// -----------------------------

function renderPressureChart(shopsRaw, unemploymentRaw) {
  // New visualization technique requirement:
  // This section uses SCROLLYTELLING (step-driven reveal + emphasis) rather than
  // a single inline figure. The scroll pacing changes the reading experience by
  // advancing the argument year-by-year and foregrounding unemployment as context.
  // The design encourages readers to interpret unemployment as a contextual backdrop
  // rather than a single causal explanation.

  const svg = d3.select("#chart-pressure");
  const chartEl = document.querySelector("#pressure-chart");
  const annotationEl = document.querySelector("#pressure-annotation");
  const triggerEls = Array.from(document.querySelectorAll("#pressure .pressure-trigger"));

  if (svg.empty()) return;
  svg.selectAll("*").remove();

  function showPressureFallback(message) {
    const g0 = svg.append("g").attr("transform", "translate(24,36)");
    g0
      .append("text")
      .attr("fill", COLORS.muted)
      .style("font", "14px ui-sans-serif, system-ui")
      .text(message);

    if (annotationEl) annotationEl.textContent = message;
    if (chartEl) chartEl.setAttribute("data-has-error", "true");
  }

  const shops = (shopsRaw || [])
    .filter((d) => d?.year != null && d?.coffee_shop_count != null)
    .map((d) => ({
      year: +d.year,
      coffee_shop_count: +d.coffee_shop_count,
      source_note: d.source_note,
    }))
    .filter((d) => Number.isFinite(d.year) && Number.isFinite(d.coffee_shop_count))
    .sort((a, b) => a.year - b.year);

  const unemployment = (unemploymentRaw || [])
    .filter((d) => d?.year != null && d?.unemployment_rate != null)
    .map((d) => ({
      year: +d.year,
      unemployment_rate: +d.unemployment_rate,
    }))
    .filter((d) => Number.isFinite(d.year) && Number.isFinite(d.unemployment_rate));

  const unemploymentByYear = new Map(unemployment.map((d) => [d.year, d]));

  // Merge datasets by year using benchmark years from coffee_shop_counts.csv.
  const merged = shops
    .map((s) => {
      const u = unemploymentByYear.get(s.year);
      return u
        ? {
            year: s.year,
            coffee_shop_count: s.coffee_shop_count,
            unemployment_rate: u.unemployment_rate,
            source_note: s.source_note,
          }
        : null;
    })
    .filter(Boolean);

  const missingYears = shops.map((d) => d.year).filter((yr) => !unemploymentByYear.has(yr));

  // eslint-disable-next-line no-console
  console.log("[Section 3] merged benchmark data (shops + unemployment):", merged);

  if (shops.length === 0) {
    showPressureFallback("No benchmark rows found in data/coffee_shop_counts.csv.");
    return;
  }

  // For this scrollytelling, steps are written for four benchmark years.
  // If the merge is incomplete, we show a clear in-chart fallback.
  if (merged.length !== shops.length) {
    showPressureFallback(
      `Merge failed for benchmark years: missing unemployment rate for ${missingYears.join(", ")}.`
    );
    return;
  }

  if (merged.length < 2) {
    showPressureFallback("Not enough merged benchmark rows to render the timeline.");
    return;
  }

  renderPressureFullscreenTimelineScrolly(svg, annotationEl, triggerEls, merged);
}

function renderPressureFullscreenTimelineScrolly(svg, annotationEl, triggerEls, data) {
  const timelineEl = document.querySelector("#pressure .pressure-timeline");

  const years = data.map((d) => d.year);

  const yearAnnotations = new Map([
    [
      2016,
      "Unemployment was already part of the backdrop as South Korea counted over 50,000 coffee shops.",
    ],
    [
      2018,
      "Cafe counts rose further while unemployment remained an important part of the economic context.",
    ],
    [
      2021,
      "By 2021, the market had expanded dramatically, yet labor-market pressure had not disappeared.",
    ],
    [
      2022,
      "Even after coffee shop counts exceeded 100,000, unemployment still helps frame why small-business entry may have remained appealing.",
    ],
  ]);

  function setAnnotationForYear(year) {
    if (!annotationEl) return;
    const text = yearAnnotations.get(year) || "Scroll to advance the timeline.";
    annotationEl.textContent = text;
  }

  function draw() {
    const bounds = timelineEl?.getBoundingClientRect();
    const width = Math.max(320, Math.floor(bounds?.width ?? 520));
    const height = Math.max(560, Math.floor(window.innerHeight * 0.72));

    const margin = { top: 26, right: 26, bottom: 26, left: 26 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const lineX = innerW * 0.44;
    const y = d3
      .scalePoint()
      .domain(years)
      .range([0, innerH])
      .padding(0.35);

    const yTop = y(years[0]);
    const yBot = y(years[years.length - 1]);

    // Base timeline: thin and faint.
    g.append("line")
      .attr("class", "pressure-timeline-base")
      .attr("x1", lineX)
      .attr("x2", lineX)
      .attr("y1", yTop)
      .attr("y2", yBot)
      .attr("stroke", colorMix(COLORS.accent3, "#ffffff", 0.25))
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("opacity", 0.55);

    // Active segment overlay (updates per year).
    const activeSeg = g
      .append("line")
      .attr("class", "pressure-timeline-active")
      .attr("x1", lineX)
      .attr("x2", lineX)
      .attr("y1", yTop)
      .attr("y2", yTop)
      .attr("stroke", COLORS.accent)
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .attr("opacity", 0.9);

    const nodes = g
      .append("g")
      .selectAll("g.pressure-node")
      .data(data, (d) => d.year)
      .join("g")
      .attr("class", "pressure-node")
      .attr("transform", (d) => `translate(${lineX},${y(d.year)})`)
      .attr("opacity", 0.28);

    nodes
      .append("circle")
      .attr("r", 7)
      .attr("fill", colorMix(COLORS.accent2, COLORS.accent3, 0.4))
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    nodes
      .append("text")
      .attr("class", "pressure-year-label")
      .attr("x", -22)
      .attr("y", 4)
      .attr("text-anchor", "end")
      .attr("fill", COLORS.muted)
      .text((d) => d.year);

    nodes
      .append("text")
      .attr("class", "pressure-rate-label")
      .attr("x", 22)
      .attr("y", 2)
      .attr("text-anchor", "start")
      .attr("fill", COLORS.muted)
      .style("font-weight", 750)
      .text((d) => `${fmt1(d.unemployment_rate)}% unemployment`);

    nodes
      .append("text")
      .attr("class", "pressure-cafe-label")
      .attr("x", 22)
      .attr("y", 20)
      .attr("text-anchor", "start")
      .attr("fill", COLORS.muted)
      .attr("opacity", 0.9)
      .text((d) => `${fmtComma(d.coffee_shop_count)} coffee shops`);

    nodes
      .append("rect")
      .attr("class", "pressure-hit")
      .attr("x", -lineX)
      .attr("y", -28)
      .attr("width", width)
      .attr("height", 56)
      .attr("fill", "transparent")
      .on("mousemove", (event, d) => {
        tooltip.show(
          event,
          `<strong>${d.year}</strong>` +
            `<br>Unemployment: ${fmt1(d.unemployment_rate)}%` +
            `<br>Coffee shops: ${fmtComma(d.coffee_shop_count)}` +
            (d.source_note ? `<br><span style="opacity:.85">${escapeHtml(d.source_note)}</span>` : "")
        );
      })
      .on("mouseleave", () => tooltip.hide());

    function renderActiveIndex(idx, animate = true) {
      const clamped = Math.max(0, Math.min(idx, data.length - 1));
      const current = data[clamped];
      const currentY = y(current.year);

      const prev = data[Math.max(0, clamped - 1)];
      const next = data[Math.min(data.length - 1, clamped + 1)];
      const y1 = y(prev.year);
      const y2 = y(next.year);

      setAnnotationForYear(current.year);

      nodes
        .transition()
        .duration(260)
        .attr("opacity", (d) => {
          if (d.year === current.year) return 1;
          return d.year < current.year ? 0.12 : 0.28;
        });

      nodes
        .select("circle")
        .transition()
        .duration(260)
        .attr("r", (d) => (d.year === current.year ? 10 : 7))
        .attr("fill", (d) => (d.year === current.year ? COLORS.accent2 : colorMix(COLORS.accent2, COLORS.accent3, 0.45)));

      nodes
        .select("text.pressure-year-label")
        .transition()
        .duration(260)
        .attr("fill", (d) => (d.year === current.year ? COLORS.accent : COLORS.muted))
        .style("font-weight", (d) => (d.year === current.year ? 850 : 700));

      nodes
        .select("text.pressure-rate-label")
        .transition()
        .duration(260)
        .attr("opacity", (d) => (d.year === current.year ? 1 : 0.35));

      nodes
        .select("text.pressure-cafe-label")
        .transition()
        .duration(260)
        .attr("opacity", (d) => (d.year === current.year ? 0.92 : 0.22));

      if (animate) {
        activeSeg
          .interrupt()
          .attr("y1", currentY)
          .attr("y2", currentY)
          .transition()
          .duration(520)
          .ease(d3.easeCubicOut)
          .attr("y1", y1)
          .attr("y2", y2);
      } else {
        activeSeg.attr("y1", y1).attr("y2", y2);
      }
    }

    // Initialize based on scroll position.
    renderActiveIndex(0, false);

    if (triggerEls.length) {
      const seen = new Set();
      const triggerObserver = new IntersectionObserver(
        (entries) => {
          const entering = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
          const top = entering[0];
          if (!top) return;

          const idx = Number(top.target.getAttribute("data-step"));
          if (!Number.isFinite(idx)) return;

          const shouldAnimate = !seen.has(idx);
          seen.add(idx);
          renderActiveIndex(idx, shouldAnimate);
        },
        {
          rootMargin: "-45% 0px -45% 0px",
          threshold: 0.01,
        }
      );

      triggerEls.forEach((el) => triggerObserver.observe(el));
    }
  }

  draw();

  // Responsive redraw
  const key = "__kcr_pressure_ro";
  const root = timelineEl || svg.node();
  if (root && root[key]) root[key].disconnect();
  if (root) {
    root[key] = new ResizeObserver(() => draw());
    root[key].observe(root);
  }
}

// -----------------------------
// SECTION 4 — COUNTERARGUMENT (Two side-by-side bar charts)
// -----------------------------

function renderCounterBarCharts(consumptionRaw, revenueRaw) {
  const consumptionSvg = document.querySelector("#chart-consumption-small");
  const revenueSvg = document.querySelector("#chart-revenue-small");
  if (!consumptionSvg || !revenueSvg) return;

  const consumptionAll = (consumptionRaw || [])
    .filter((d) => d?.year != null && d?.consumption_cups_per_year != null)
    .map((d) => ({
      year: +d.year,
      value: +d.consumption_cups_per_year,
      source_note: d.source_note,
    }))
    .filter((d) => Number.isFinite(d.year) && Number.isFinite(d.value));

  const consumption = [2018, 2023]
    .map((yr) => consumptionAll.find((d) => d.year === yr))
    .filter(Boolean);

  const revenueAll = (revenueRaw || [])
    .filter((d) => d?.year != null && d?.market_revenue_usd_millions != null)
    .map((d) => ({
      year: +d.year,
      value_millions: +d.market_revenue_usd_millions,
      source_note: d.source_note,
    }))
    .filter((d) => Number.isFinite(d.year) && Number.isFinite(d.value_millions));

  const revenueYears = [2007, 2018, 2023];
  const revenue = revenueYears
    .map((yr) => revenueAll.find((d) => d.year === yr))
    .filter(Boolean)
    .map((d) => ({
      year: d.year,
      value: d.value_millions / 1000, // billions
      value_millions: d.value_millions,
      source_note: d.source_note,
    }));

  function formatRevenueLabel(d) {
    // Display as $300M and $4.3B, preserving meaning.
    if (d.value_millions < 1000) return `$${fmtComma(d.value_millions)}M`;
    return `$${fmt1(d.value)}B`;
  }

  renderBarChartInto(
    {
      svgEl: consumptionSvg,
      yAxisLabel: "Cups per person per year",
      barFill: COLORS.accent,
      valueLabel: (d) => `${fmtComma(d.value)}`,
      yTickFormat: (v) => fmtComma(v),
      tooltipHtml: (d) =>
        `<strong>${d.year}</strong>` +
        `<br>${fmtComma(d.value)} cups/person/year` +
        (d.source_note ? `<br><span style="opacity:.85">${escapeHtml(d.source_note)}</span>` : ""),
      fallback: consumption.length === 2 ? null : "Missing benchmark rows for 2018 and/or 2023 in data/coffee_consumption.csv.",
    },
    consumption
  );

  renderBarChartInto(
    {
      svgEl: revenueSvg,
      yAxisLabel: "USD (billions)",
      barFill: COLORS.accent2,
      valueLabel: (d) => formatRevenueLabel(d),
      yTickFormat: (v) => `$${d3.format(".1f")(v)}B`,
      tooltipHtml: (d) =>
        `<strong>${d.year}</strong>` +
        `<br>Market revenue: ${formatRevenueLabel(d)}` +
        (d.source_note ? `<br><span style="opacity:.85">${escapeHtml(d.source_note)}</span>` : ""),
      fallback:
        revenue.length >= 2
          ? null
          : "Missing benchmark rows for 2007/2018/2023 in data/coffee_market_revenue.csv.",
    },
    revenue
  );
}

function renderBarChartInto(config, data) {
  const svg = d3.select(config.svgEl);
  const panel = config.svgEl.closest(".bar-panel") || config.svgEl.parentElement;

  function draw() {
    const bounds = panel?.getBoundingClientRect();
    const width = Math.max(320, Math.floor(bounds?.width ?? 420));
    const height = 320;
    const margin = { top: 18, right: 18, bottom: 44, left: 62 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    if (config.fallback || !data || data.length === 0) {
      g.append("text")
        .attr("fill", COLORS.muted)
        .style("font", "13px ui-sans-serif, system-ui")
        .text(config.fallback || "No data available");
      return;
    }

    const years = data.map((d) => String(d.year));

    const x = d3.scaleBand().domain(years).range([0, innerW]).padding(0.38);
    const yMax = d3.max(data, (d) => d.value) ?? 1;
    const y = d3
      .scaleLinear()
      .domain([0, yMax * 1.18])
      .nice()
      .range([innerH, 0]);

    g.append("text")
      .attr("x", 0)
      .attr("y", -6)
      .attr("fill", COLORS.muted)
      .style("font", "600 12px ui-sans-serif, system-ui")
      .text(config.yAxisLabel);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(4).tickFormat(config.yTickFormat));

    const bars = g
      .append("g")
      .selectAll("rect")
      .data(data, (d) => d.year)
      .join("rect")
      .attr("x", (d) => x(String(d.year)))
      .attr("y", innerH)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("rx", 10)
      .attr("fill", config.barFill)
      .on("mousemove", (event, d) => tooltip.show(event, config.tooltipHtml(d)))
      .on("mouseleave", () => tooltip.hide());

    bars
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => innerH - y(d.value));

    g.append("g")
      .selectAll("text")
      .data(data, (d) => d.year)
      .join("text")
      .attr("x", (d) => x(String(d.year)) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 8)
      .attr("text-anchor", "middle")
      .attr("fill", COLORS.muted)
      .style("font", "700 12px ui-sans-serif, system-ui")
      .text((d) => config.valueLabel(d));
  }

  draw();

  const key = "__kcr_bar_ro";
  if (panel && panel[key]) panel[key].disconnect();
  if (panel) {
    panel[key] = new ResizeObserver(() => draw());
    panel[key].observe(panel);
  }
}

// -----------------------------
// Utilities
// -----------------------------

function createTooltip() {
  const el = document.querySelector("#tooltip");
  return {
    show(event, html) {
      el.innerHTML = html;
      el.classList.add("is-visible");
      el.style.left = `${event.clientX}px`;
      el.style.top = `${event.clientY}px`;
      el.setAttribute("aria-hidden", "false");
    },
    hide() {
      el.classList.remove("is-visible");
      el.setAttribute("aria-hidden", "true");
    },
  };
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showFatalMessage(message) {
  const el = document.querySelector("#fatal");
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
}

function getCssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function colorMix(a, b, t) {
  // Tiny helper to keep palette warm without introducing new hard-coded colors in multiple places.
  // `t` is the contribution of `a`.
  const ca = d3.color(a);
  const cb = d3.color(b);
  if (!ca || !cb) return a;
  const r = Math.round(cb.r + (ca.r - cb.r) * t);
  const g = Math.round(cb.g + (ca.g - cb.g) * t);
  const bl = Math.round(cb.b + (ca.b - cb.b) * t);
  return `rgb(${r},${g},${bl})`;
}
