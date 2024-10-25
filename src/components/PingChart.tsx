import { createChart } from "lightweight-charts";
import { createEffect, onMount } from "solid-js";

export default function PingChart(props: { heartbeats: any[] }) {
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
          return `${price.toFixed(2)}ms`;
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

    series.setData(
      props.heartbeats.toReversed().map((heartbeat) => ({
        time: (new Date(heartbeat.time).getTime() / 1000) as any,
        value: heartbeat.ping,
      })),
    );

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
