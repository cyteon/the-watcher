import { createChart } from "lightweight-charts";
import { createEffect, onMount } from "solid-js";

export default function Chart(props: { data: any[]; suffix: string }) {
  function updateChart() {
    const div = document.getElementById("chart")!;
    div.innerHTML = "";

    const chart = createChart(div, {
      layout: {
        background: { color: "transparent" },
        textColor: "#fafafa",
        attributionLogo: false,
      },
      localization: {
        priceFormatter: (price) => {
          return `${price.toFixed(2)}${props.suffix}`;
        },
      },
      grid: {
        horzLines: { color: "#242424" },
        vertLines: { color: "#242424" },
      },
      timeScale: {
        borderColor: "#242424",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "#242424",
      },
    });

    const series = chart.addAreaSeries();

    series.setData(props.data);

    chart.timeScale().fitContent();
    console.log("chart", chart);
  }

  createEffect(() => {
    updateChart();
  });

  onMount(() => {
    updateChart();
  });

  return <div id="chart" class="size-full"></div>;
}
