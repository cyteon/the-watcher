import { createChart, LineType } from "lightweight-charts";
import { createEffect, onMount, createSignal } from "solid-js";

export default function Chart(props: {
  data: any[];
  suffix: string;
  id: string;
}) {
  function updateChart() {
    const div = document.getElementById(props.id)!;

    if (div) {
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

      const series = chart.addAreaSeries({
        lineType: LineType.Curved,
      });

      if (props.data2) {
        const series2 = chart.addLineSeries();
        series2.setData(props.data2);
      }

      series.setData(props.data);

      chart.timeScale().fitContent();
      console.log("chart", chart);
    }
  }

  createEffect(() => {
    const div = document.getElementById(props.id)!;

    if (div) {
      updateChart();
    }
  });

  onMount(() => {
    updateChart();
  });

  return <div id={props.id} class="size-full"></div>;
}
