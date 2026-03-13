(() => {
  const fmtComma = d3.format(",");
  const fmtPct = d3.format(".1f");
  const fmtDollar = d3.format("$.1f");

  function renderDumbbells(shops, consumption, revenue) {
    const svg = d3.select("#chart-dumbbell");
    const tooltip = d3.select("#tooltip3");

    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#6a3e2f";
    const muted = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#6f635d";
    const accent2 = getComputedStyle(document.documentElement).getPropertyValue("--accent-2").trim() || "#b8704b";

    const panels = [
      {
        title: "Coffee shops",
        startYear: 2016,
        startValue: shops.find((d) => d.year === 2016)?.coffee_shop_count,
        endYear: 2022,
        endValue: shops.find((d) => d.year === 2022)?.coffee_shop_count,
        format: (d) => fmtComma(d),
      },
      {
        title: "Coffee consumption",
        startYear: 2019,
        startValue: consumption.find((d) => d.year === 2019)?.consumption_cups_per_year,
        endYear: 2023,
        endValue: consumption.find((d) => d.year === 2023)?.consumption_cups_per_year,
        format: (d) => `${fmtComma(d)} cups`,
      },
      {
        title: "Cafe market revenue",
        startYear: 2007,
        startValue: revenue.find((d) => d.year === 2007)?.market_revenue_usd_millions,
        endYear: 2018,
        endValue: revenue.find((d) => d.year === 2018)?.market_revenue_usd_millions,
        format: (d) => `${fmtDollar(d / 1000)}B`,
      },
    ];

    const panelW = 250;
    const panelH = 300;
    const startX = 40;
    const gap = 40;

    panels.forEach((p, i) => {
      const g = svg.append("g").attr("transform", `translate(${startX + i * (panelW + gap)}, 60)`);
      const maxVal = Math.max(p.startValue, p.endValue);
      const x = d3.scaleLinear().domain([0, maxVal * 1.1]).range([20, panelW - 20]);

      g.append("text")
        .attr("x", panelW / 2)
        .attr("y", -18)
        .attr("text-anchor", "middle")
        .attr("font-size", 18)
        .attr("font-weight", 700)
        .text(p.title);

      g.append("line")
        .attr("x1", x(p.startValue))
        .attr("x2", x(p.endValue))
        .attr("y1", panelH / 2)
        .attr("y2", panelH / 2)
        .attr("stroke", "#cfb49f")
        .attr("stroke-width", 5)
        .attr("stroke-linecap", "round");

      [
        { year: p.startYear, value: p.startValue, color: "#9b8b7d" },
        { year: p.endYear, value: p.endValue, color: accent },
      ].forEach((d) => {
        g.append("circle")
          .attr("cx", x(d.value))
          .attr("cy", panelH / 2)
          .attr("r", 9)
          .attr("fill", d.color)
          .attr("stroke", "white")
          .attr("stroke-width", 2)
          .on("mousemove", function (event) {
            const growth = ((p.endValue - p.startValue) / p.startValue) * 100;
            tooltip
              .style("opacity", 1)
              .style("left", `${event.offsetX + 18}px`)
              .style("top", `${event.offsetY}px`)
              .html(
                `<strong>${p.title}</strong><br>${d.year}: ${p.format(d.value)}<br>Growth across panel: ${fmtPct(growth)}%`
              );
          })
          .on("mouseleave", () => tooltip.style("opacity", 0));

        g.append("text")
          .attr("x", x(d.value))
          .attr("y", panelH / 2 - 18)
          .attr("text-anchor", "middle")
          .attr("font-size", 12)
          .attr("fill", muted)
          .text(d.year);

        g.append("text")
          .attr("x", x(d.value))
          .attr("y", panelH / 2 + 34)
          .attr("text-anchor", "middle")
          .attr("font-size", 13)
          .attr("font-weight", 600)
          .text(p.format(d.value));
      });

      const growth = ((p.endValue - p.startValue) / p.startValue) * 100;
      g.append("text")
        .attr("x", panelW / 2)
        .attr("y", panelH / 2 + 75)
        .attr("text-anchor", "middle")
        .attr("font-size", 24)
        .attr("font-weight", 700)
        .attr("fill", accent2)
        .text(`+${fmtPct(growth)}%`);

      g.append("text")
        .attr("x", panelW / 2)
        .attr("y", panelH / 2 + 98)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", muted)
        .text("change across the interval");
    });
  }

  Promise.all([
    d3.csv("data/coffee_shop_counts.csv", d3.autoType),
    d3.csv("data/coffee_consumption.csv", d3.autoType),
    d3.csv("data/coffee_market_revenue.csv", d3.autoType),
  ]).then(([shops, consumption, revenue]) => {
    renderDumbbells(shops, consumption, revenue);
  });
})();
