import { createChart } from "lightweight-charts";
import { createEffect, onMount } from "solid-js";
import h from "solid-js/h";

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

    var heartBeats = [];
    var lastTimes = new Set();

    props.heartbeats.toReversed().map((heartbeat) => {
      const time = new Date(heartbeat.time).getTime() / 1000;

      if (lastTimes.has(time)) {
        return;
      }

      heartBeats.push({
        time: time,
        value: heartbeat.ping,
      });

      lastTimes.add(time);
    });

    series.setData(heartBeats);

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
