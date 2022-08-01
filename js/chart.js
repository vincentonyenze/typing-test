// A line chart of your speed during the test, drawn in SVG by hand.
//
// It's split in two:
// - chartGeometry(): pure maths. Samples + a size in, coordinates out.
//   No DOM, so it's tested in tests/chart.test.js.
// - drawChart(): turns those coordinates into SVG elements on the page.

// Room around the plot for the labels on the left and bottom
const PADDING = { top: 10, right: 10, bottom: 24, left: 36 };

// A "nice" top for the WPM axis: the next multiple of 20, so the labels
// are round numbers (0, 20, 40...) instead of 0, 23.5, 47...
export function niceMax(value) {
  return Math.max(20, Math.ceil(value / 20) * 20);
}

// A "nice" gap between second labels, so there are at most ~10 of them
export function niceStep(seconds) {
  return [1, 2, 5, 10, 15, 30, 60].find((step) => seconds / step <= 10) ?? 60;
}

// Points -> an SVG path: "M 0,10 L 5,8 L 10,12" (Move to the first,
// then draw Lines to the rest)
export function toPath(points) {
  return points
    .map(({ x, y }, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

export function chartGeometry(samples, { width, height }) {
  const plot = {
    left: PADDING.left,
    top: PADDING.top,
    width: width - PADDING.left - PADDING.right,
    height: height - PADDING.top - PADDING.bottom,
  };

  const lastSecond = Math.max(1, samples.at(-1)?.elapsedMs / 1000 || 1);
  const maxWpm = niceMax(Math.max(0, ...samples.map((s) => Math.max(s.wpm, s.raw))));

  // "Scales": turn a value into a position. In SVG, y = 0 is the TOP, so
  // a bigger WPM needs a smaller y: that's why it's `top + height - ...`
  const x = (seconds) => plot.left + (seconds / lastSecond) * plot.width;
  const y = (wpm) => plot.top + plot.height - (wpm / maxWpm) * plot.height;

  const pointsFor = (key) =>
    samples.map((s) => ({ x: x(s.elapsedMs / 1000), y: y(s[key]) }));

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
    const value = maxWpm * fraction;
    return { value, y: y(value) };
  });

  const step = niceStep(lastSecond);
  const xTicks = [];
  for (let second = step; second <= lastSecond; second += step) {
    xTicks.push({ value: second, x: x(second) });
  }

  // A red dot where mistakes happened; more mistakes, bigger dot
  const errors = samples
    .filter((s) => s.errors > 0)
    .map((s) => ({
      x: x(s.elapsedMs / 1000),
      y: y(s.raw),
      r: Math.min(3 + s.errors, 8),
      count: s.errors,
    }));

  return {
    plot,
    wpmPath: toPath(pointsFor("wpm")),
    rawPath: toPath(pointsFor("raw")),
    yTicks,
    xTicks,
    errors,
  };
}

// ===== Drawing =====
// SVG elements must be created with createElementNS and the SVG
// "namespace". With plain createElement they exist but never appear.
const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes, text) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  if (text !== undefined) element.textContent = text;
  return element;
}

export function drawChart(svg, samples) {
  // Draw at the chart's real size on screen, so text isn't stretched
  const width = svg.clientWidth || 600;
  const height = svg.clientHeight || 200;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const g = chartGeometry(samples, { width, height });
  const parts = [];

  // Horizontal grid lines with WPM labels on the left
  for (const tick of g.yTicks) {
    parts.push(
      svgElement("line", {
        class: "chart__grid",
        x1: g.plot.left,
        x2: g.plot.left + g.plot.width,
        y1: tick.y,
        y2: tick.y,
      }),
      svgElement(
        "text",
        { class: "chart__label", x: g.plot.left - 8, y: tick.y + 4, "text-anchor": "end" },
        Math.round(tick.value)
      )
    );
  }

  // Seconds along the bottom
  for (const tick of g.xTicks) {
    parts.push(
      svgElement(
        "text",
        { class: "chart__label", x: tick.x, y: g.plot.top + g.plot.height + 18, "text-anchor": "middle" },
        `${tick.value}s`
      )
    );
  }

  // Raw first, so the WPM line is drawn on top of it
  parts.push(
    svgElement("path", { class: "chart__raw", d: g.rawPath }),
    svgElement("path", { class: "chart__wpm", d: g.wpmPath })
  );

  for (const error of g.errors) {
    const dot = svgElement("circle", { class: "chart__error", cx: error.x, cy: error.y, r: error.r });
    // <title> inside an SVG shape is its tooltip
    dot.append(svgElement("title", {}, `${error.count} mistake${error.count === 1 ? "" : "s"}`));
    parts.push(dot);
  }

  svg.replaceChildren(...parts);
}
