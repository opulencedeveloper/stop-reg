const ctx = document.getElementById("lineChart").getContext("2d");
const tooltipEl = document.getElementById("chart-tooltip");

const selectorImg = new Image();
selectorImg.src = "/assets/icons/Selector.svg";
const selectorScale = 1.0;

selectorImg.onload = () => {
  const naturalW = selectorImg.naturalWidth;
  const naturalH = selectorImg.naturalHeight;
  const imgW = naturalW * selectorScale;
  const imgH = naturalH * selectorScale;

  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        data: [2.8, 3.0, 2.5, 3.1, 3.6, 3.3, 3.4, 3.2, 3.2, 3.0, 2.9, 3.1],
        borderColor: "#0099cc",
        tension: 0.45,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
      {
        data: [3.4, 3.5, 3.0, 3.3, 3.7, 3.2, 3.1, 3.4, 3.0, 3.6, 3.5, 3.2],
        borderColor: "#cc0000",
        tension: 0.45,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
      {
        data: [2.9, 2.7, 3.2, 2.8, 3.0, 3.1, 2.9, 3.3, 3.2, 3.5, 3.4, 3.0],
        borderColor: "#0044cc",
        tension: 0.45,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const config = {
    type: "line",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: function (context) {
            const { chart, tooltip } = context;
            if (tooltip.opacity === 0) {
              tooltipEl.style.opacity = 0;
              return;
            }

            const body = tooltip.body?.[0]?.lines?.[0] || "";
            const shortLabel = tooltip.title?.[0] || "";

            const fullMonthMap = {
              Jan: "January",
              Feb: "February",
              Mar: "March",
              Apr: "April",
              May: "May",
              Jun: "June",
              Jul: "July",
              Aug: "August",
              Sep: "September",
              Oct: "October",
              Nov: "November",
              Dec: "December",
            };

            tooltipEl.querySelector("strong").innerHTML = body;
            tooltipEl.querySelector("span").innerHTML =
              fullMonthMap[shortLabel] || shortLabel;

            const activePoint = chart.tooltip._active?.[0];
            if (!activePoint) return;

            const { x, y } = activePoint.element;
            const chartArea = chart.chartArea;

            const tooltipWidth = tooltipEl.offsetWidth;
            const tooltipHeight = tooltipEl.offsetHeight;

            
            const tooltipOffsetX = -25; 
            const tooltipOffsetY = -56; 

            tooltipEl.style.opacity = 1;
            tooltipEl.style.display = "block";

            tooltipEl.style.left =
              x - tooltipWidth / 2 + chartArea.left + tooltipOffsetX + "px";
            tooltipEl.style.top =
              y - tooltipHeight - imgH - tooltipOffsetY + chartArea.top + "px";
          },
        },
      },
      interaction: { intersect: false, mode: "index" },
      scales: {
        x: {
          grid: {
            color: "#eee",
            drawTicks: false,
            offset: false, 
          },
          ticks: {
            color: "#000",
            padding: 13,
          },
          border: {
            display: true,
            color: "#ccc",
          },
        },
        y: {
          grid: { display: false },
          ticks: { display: false },
        },
      },
      layout: {
        padding: {
          left: 0,
          right: 0, // ✅ full edge reach for Jan/Dec lines
        },
      },
    },
    plugins: [
      {
        id: "hideGridBottomBand",
        afterDraw: (chart) => {
          const { ctx, chartArea } = chart;
          if (!chartArea) return;
          const bandHeight = 12;
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(
            chartArea.left,
            chartArea.bottom - bandHeight - 1,
            chartArea.width,
            bandHeight
          );
          ctx.restore();
        },
      },
      {
        id: "customSelector",
        afterDraw: (chart) => {
          if (!chart.tooltip?._active?.length || !selectorImg.complete) return;

          const ctx = chart.ctx;
          const activePoint = chart.tooltip._active[0];
          const x = activePoint.element.x;
          const y = activePoint.element.y;

          const bottomY = chart.scales.y.bottom ;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, bottomY);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#049286";
          ctx.globalAlpha = 0.9;
          ctx.stroke();

          const drawX = x - imgW / 2;
          const drawY = y;
          ctx.drawImage(selectorImg, drawX, drawY, imgW, imgH);
          ctx.restore();
        },
      },
    ],
  };

  new Chart(ctx, config);
};
