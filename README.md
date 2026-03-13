# Too Many Cafes? Or a Different Kind of Economic Story?

**Author:** Laura Hu

## Project overview

This project remixes the New York Times story **“South Korea Has a Coffee Shop Problem”** by **Pablo Robles and John Yoon**. The original article emphasizes oversaturation: too many coffee shops, too much competition, and too little room for small operators to survive.

My remix keeps that argument visible, but adds a counter-reading. Instead of treating the coffee boom as only a market problem, I frame it as the overlap of three forces:

1. rapid growth in the number of coffee shops,
2. persistent labor-market pressure, especially for young people,
3. rising demand for coffee and growth in coffee-related revenue.

So the remix asks a slightly different question:

> Is South Korea’s coffee boom only a sign of saturation, or is it also a sign of adaptation?

---

## Story structure and design decisions

### 1. Start with the boom

The first visualization is a **D3 line chart** showing coffee-shop counts across sourced benchmark years. It is a interactive D3 line chart. Hover a point to compare it with the labor-market view below. I placed this first because the original NYT story starts from visible growth. This gives readers a familiar entry point and establishes a baseline before the remix complicates the story.

**Why this chart?**
- It is a conventional form, so readers can understand it immediately.
- It creates a strong first claim: the boom is real.
- Hover interaction reveals exact values without cluttering the chart.

### 2. Introduce labor pressure

The second visualization is a **D3 connected scatterplot** mapping **youth unemployment rate** against **coffee-shop count**. This is more interpretive than the first chart. Rather than just tracking change over time, it asks readers to think about a possible relationship between labor conditions and entrepreneurship.

**Why this chart?**
- It is visually different from a normal line chart.
- It supports the new section I added to the story.
- It helps turn the remix into an explanation, not just a summary.

### 3. Turn the story toward a counterargument

The third visualization is a **small-multiple dumbbell chart** comparing changes in three indicators:
- coffee shops,
- coffee consumption,
- cafe-market revenue.

This section is the clearest response to the original article. If shop counts rose, but consumption and revenue rose too, then “too many cafes” is not the whole story.

**Why this chart?**
- It is visually distinct from the first two charts.
- It compresses three comparisons into one readable layout.
- It supports the assignment’s “multiple views” extra credit by explicitly presenting a counterargument.

---

## Interaction and view coordination

The first two charts are coordinated by **shared year highlighting**.

- Hovering a year in the coffee-shop line chart highlights the same year in the unemployment scatterplot.
- Hovering a point in the scatterplot highlights the same year in the line chart.

This was a deliberate design choice to make the narrative feel connected rather than like three isolated figures.

---

## New technique

Instead of using a purely figure-by-figure layout, I structured the page as a **single narrative scroll story** with sectional transitions:

- growth,
- explanation,
- counterargument.

This is not as elaborate as full scrollytelling with pinned graphics, but it still changes the reading experience. Readers move through the argument in sequence rather than encountering all figures at once. That sequencing helps the counterargument land more clearly because the later charts revise the meaning of the earlier ones.

---

## Data sources used

- **Original article:** Pablo Robles and John Yoon, *The New York Times*, “South Korea Has a Coffee Shop Problem”
- **Total unemployment:** World Bank, indicator `SL.UEM.TOTL.ZS`
- **Youth unemployment:** World Bank, indicator `SL.UEM.1524.ZS`
- **Coffee shop counts:** Statistics Korea figures reported by *Korea JoongAng Daily* and *Maeil Business Newspaper*, plus Yonhap reporting for 2018
- **Coffee consumption:** figures reported in *Coffee in South Korea* / Hyundai Research Lab and *Korea JoongAng Daily*
- **Cafe market revenue:** *UNESCO Courier*

---

## AI use statement

I used **OpenAI ChatGPT** for:
- brainstorming the storyboard,
- identifying candidate public datasets,
- debugging chart logic,
- and polishing original text.

The final argument, selection of evidence, visual structure, and interpretation were my own decisions.

---

## Files in this repo

- `index.html` – standalone narrative webpage
- `data/kor_unemployment_total_tidy.csv`
- `data/kor_youth_unemployment_tidy.csv`
- `data/coffee_shop_counts.csv`
- `data/coffee_consumption.csv`
- `data/coffee_market_revenue.csv`
- `data/seoul_municipalities_geo.json`

---

## Running locally

Because the page loads local CSV files, run it from a local web server rather than opening the HTML file directly.

Example with Python:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```
