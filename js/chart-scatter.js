(() => {
  const EVENT_NAME = "kcr:year";

  const fmtComma = d3.format(",");
  const fmtPct = d3.format(".1f");
  const accent2 = getComputedStyle(document.documentElement).getPropertyValue("--accent-2").trim() || "#b8704b";
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#6a3e2f";
  const muted = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#6f635d";

  function publishYear(year) {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { year } }));
  }

  function renderScatter(data) {
    const svg = d3.select("#chart-scatter");
    const tooltip = d3.select("#tooltip2");

    const width = 900;
    const height = 420;
    const margin = { top: 20, right: 25, bottom: 55, left: 75 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => d.youth_unemployment_rate) - 1,
        d3.max(data, (d) => d.youth_unemployment_rate) + 1,
      ])
      .range([0, innerW]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.coffee_shop_count) * 1.08])
      .nice()
      .range([innerH, 0]);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `${fmtPct(d)}%`));

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6).tickFormat((d) => fmtComma(d)));

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 42)
      .attr("text-anchor", "middle")
      .attr("fill", muted)
      .text("Youth unemployment rate");

    g.append("text")
      .attr("x", -innerH / 2)
      .attr("y", -55)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", muted)
      .text("Coffee-shop count");

    const line = d3
      .line()
      .x((d) => x(d.youth_unemployment_rate))
      .y((d) => y(d.coffee_shop_count));

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", accent2)
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "6 4")
      .attr("d", line);

    const points = g
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("class", "scatter-year-point")
      .attr("cx", (d) => x(d.youth_unemployment_rate))
      .attr("cy", (d) => y(d.coffee_shop_count))
      .attr("r", 5)
      .attr("fill", "#fffdf9")
      .attr("stroke", accent2)
      .attr("stroke-width", 2)
      .on("mousemove", function (event, d) {
        publishYear(d.year);
        tooltip
          .style("opacity", 1)
          .style("left", `${event.offsetX + 18}px`)
          .style("top", `${event.offsetY}px`)
          .html(
            `<strong>${d.year}</strong><br>Youth unemployment: ${fmtPct(d.youth_unemployment_rate)}%<br>Total unemployment: ${fmtPct(d.total_unemployment_rate)}%<br>Cafes: ${fmtComma(d.coffee_shop_count)}`
          );
      })
      .on("mouseleave", function () {
        publishYear(null);
        tooltip.style("opacity", 0);
      });

    const labels = g
      .selectAll("text.scatter-year-label")
      .data(data)
      .join("text")
      .attr("class", "scatter-year-label")
      .attr("x", (d) => x(d.youth_unemployment_rate) + 8)
      .attr("y", (d) => y(d.coffee_shop_count) - 8)
      .attr("font-size", 11)
      .attr("fill", muted)
      .text((d) => d.year);

    function applyHighlight(year) {
      points
        .attr("r", (d) => (d.year === year ? 7 : 5))
        .attr("stroke-width", (d) => (d.year === year ? 3 : 2));

      labels
        .attr("font-weight", (d) => (d.year === year ? 700 : 400))
        .attr("fill", (d) => (d.year === year ? accent : muted));
    }

    window.addEventListener(EVENT_NAME, (e) => {
      applyHighlight(e.detail?.year ?? null);
    });
  }

  Promise.all([
    d3.csv("data/coffee_shop_counts.csv", d3.autoType),
    d3.csv("data/kor_unemployment_total_tidy.csv", d3.autoType),
    d3.csv("data/kor_youth_unemployment_tidy.csv", d3.autoType),
  ]).then(([shops, totalU, youthU]) => {
    const totalLookup = new Map(totalU.map((d) => [d.year, d.unemployment_rate]));
    const youthLookup = new Map(youthU.map((d) => [d.year, d.youth_unemployment_rate]));

    const merged = shops
      .map((d) => ({
        year: d.year,
        coffee_shop_count: +d.coffee_shop_count,
        total_unemployment_rate: +totalLookup.get(d.year),
        youth_unemployment_rate: +youthLookup.get(d.year),
      }))
      .filter((d) => d.total_unemployment_rate && d.youth_unemployment_rate);

    renderScatter(merged);
  });
})();
