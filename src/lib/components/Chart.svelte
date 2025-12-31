<script lang="ts">
    import { AreaSeries, createChart } from "lightweight-charts";

    const { data } = $props();

    // 5min, 30min, 1h, 6h, 12h, 24h, 7d, all
    let timeframe = $state("all");

    $effect(() => {
        let fixedData = data.reduce((acc, current) => {
            const x = acc.find(item => item.time === current.time);
            
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, [] as { time: string; value: number }[]);


        if (timeframe === "5min") {
            fixedData = fixedData.filter(item => {
                console.log(item.time, (Date.now() / 1000) - 300, item.time >= (Date.now() / 1000) - 300);
                return item.time >= (Date.now() / 1000) - 300

            });
        } else if (timeframe === "30min") {
            fixedData = fixedData.filter(item => item.time >= (Date.now() / 1000) - 1800);
        } else if (timeframe === "1h") {
            fixedData = fixedData.filter(item => item.time >= (Date.now() / 1000) - 3600);
        } else if (timeframe === "6h") {
            fixedData = fixedData.filter(item => item.time >= (Date.now() / 1000) - 21600);
        } else if (timeframe === "12h") {
            fixedData = fixedData.filter(item => item.time >= (Date.now() / 1000) - 43200);
        } else if (timeframe === "24h") {   
            fixedData = fixedData.filter(item => item.time >= (Date.now() / 1000) - 86400);
        } else if (timeframe === "7d") {
            fixedData = fixedData.filter(item => item.time >= (Date.now() / 1000) - 604800);
        }

        const element = document.getElementById("chart")!;
        element.innerHTML = "";

        const chart = createChart(element, {
            layout: {
                background: { color: "transparent" },
                textColor: "#fafafa",
                attributionLogo: false,
            },
            localization: {
                priceFormatter: (ping: number) => `${ping.toFixed(2)}ms`,
            },
            grid: {
                horzLines: { color: "#262626" },
                vertLines: { color: "#262626" },
            },
            timeScale: {
                borderColor: "#262626",
                timeVisible: true,
            },
            rightPriceScale: {
                borderColor: "#262626",
            },
        });

        const areaSeries = chart.addSeries(AreaSeries);
        areaSeries.setData(fixedData.sort((a, b) => a.time - b.time));

        chart.timeScale().fitContent();
    })
</script>

<div class="h-full w-full relative">
    <div class="h-full w-full" id="chart">
    </div>

    <select class="absolute top-0 left-0 z-100 bg-neutral-900 rounded-md px-2 py-1 border border-neutral-800" bind:value={timeframe}>
        <option value="5min">Last 5min</option>
        <option value="30min">Last 30min</option>
        <option value="1h">Last 1h</option>
        <option value="6h">Last 6h</option>
        <option value="12h">Last 12h</option>
        <option value="24h">Last 24h</option>
        <option value="7d">Last 7d</option>
        <option value="all">All Time</option>
    </select>
</div>