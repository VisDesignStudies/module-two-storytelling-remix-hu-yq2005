# Too Many Cafes? Understanding South Korea’s Coffee Boom (Remix)

**Author:** Yanqiu Hu

This project is a single-page D3 scrollytelling story that remixes the New York Times interactive:

- **Original piece:** “South Korea Has a Coffee Shop Problem” — Pablo Robles and John Yoon (The New York Times)
- Link: https://www.nytimes.com/interactive/2025/12/03/world/asia/south-korea-coffee-shops.html

The NYT framing emphasizes **oversaturation** (“too many cafes”). This remix keeps that risk visible, but expands the interpretation: the boom can also reflect **demand growth**, **cultural habits**, and **economic pressure** that makes small-business entry feel understandable.

## Live link

- Live demo: https://visdesignstudies.github.io/module-two-storytelling-remix-hu-yq2005/

## What’s in the story (and why)

The webpage is structured into four main visual moments, each using a noticeably different design.

### Section 1 — Demand (stat card + lollipop)

**Design:** a stat card (kg per person) plus a lollipop chart (cups per person per year) using benchmark years.


**Interactivity:** hover tooltips on the lollipop marks.

### Section 2 — Expansion (milestone dot/line chart)

**Design:** a milestone chart of coffee shop counts over a few benchmark years. The line suggests direction, but the axis and annotation explicitly frame it as **benchmark years only**.


**Interactivity:** hover tooltips and emphasis on points; an enter-view line-draw animation.

### Section 3 — Pressure (full-screen scroll-driven timeline)

**Design:** a full-screen sticky stage with a vertical timeline. Scroll position advances a year-by-year reveal using invisible triggers (scrollytelling).


**Interactivity:** scroll-driven highlighting/annotation updates (IntersectionObserver-driven), plus responsive redraw.

### Section 4 — Counterargument (side-by-side bar charts)

**Design:** two coordinated but separate bar charts: (1) coffee consumption benchmarks, (2) cafe market revenue benchmarks.


**Interactivity:** hover tooltips on bars; animated bar transitions on render.


## Data and sources

This repo includes the datasets used by the page under `data/`.

- Coffee shop counts: `data/coffee_shop_counts.csv` (compiled benchmark figures as cited in reporting)
- Coffee consumption benchmarks: `data/coffee_consumption.csv`
- Unemployment (context backdrop used in Section 3): `data/kor_unemployment_total_tidy.csv`
- Cafe market revenue benchmarks: `data/coffee_market_revenue.csv`

The webpage also contains a Sources section that credits the original authors and lists data sources in prose.

## Design and implementation notes 

Key redesign decisions made during the remix:

- **Editorial pacing:** Section 3 uses a full-screen scrollytelling stage to control pacing and to encourage careful interpretation (context vs. causality).
- **Counterargument structure:** Section 4 deliberately contrasts two demand-side signals to complicate the original “oversupply” narrative.
- **Robust data loading:** some CSVs may contain leading blank lines; the loader trims text before parsing to avoid header issues.
- **Responsive layout:** charts redraw based on container width, and sections are styled to feel open and integrated with the narrative.

## AI use statement

I used **GitHub Copilot (GPT-5.2)** to support:

- debugging data loading/parsing issues,
- refining layout/CSS for the scrollytelling presentation,
- polishing original draft.

Final framing, argumentation, data selection, and design decisions are my own.

## Repo structure

- `index.html` — the standalone story page (text + embedded SVGs)
- `style.css` — editorial styling and layout
- `script.js` — D3 rendering + interaction logic
- `data/` — CSV/JSON data files

## Run locally

Because the page loads local files from `data/`, run it from a local web server (not `file://`).

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```
