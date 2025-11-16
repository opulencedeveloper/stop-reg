document.addEventListener("DOMContentLoaded", async () => {
  const totalReq = document.querySelector(".dash-total-1");
  const successfulReq = document.querySelector(".dash-total-2");
  const blockReq = document.querySelector(".dash-total-3");
  const token = localStorage.getItem("authToken");

  if (!token) {
    window.location.href = "/";
    return;
  }

  const spinner = document.getElementById("loading-spinner");
  const chartWrapper = document.getElementById("chart-wrapper");

  // spinner.style.display = "block"; // show loader
  // chartWrapper.style.opacity = "0"; // hide chart

  let requestData = [];

  try {
    const response = await fetch(
      "https://api-stop-reg.onrender.com/api/v1/user/info",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("User Info Response:", data);

    if (response.ok) {
      const user = data?.data || data;
      console.log("User Data:", user);

      const tokenElement = document.querySelector(".main-token");
      tokenElement.textContent = user.userDetails.apiToken;

      // Extract request array
      requestData = Array.isArray(user.request) ? user.request : [];
    } else {
      console.error("Error fetching user:", data);

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        window.location.href = "/";
      }
    }
  } catch (error) {
    console.error("Network error:", error);
  }

  // spinner.style.display = "none"; // hide loader
  // chartWrapper.style.opacity = "1"; // show chart

  // -----------------------------
  //   PREPARE CHART DATA FROM API
  // -----------------------------

  let totalRequest = 0;
  let totalBlockRequest = 0;
  let totalSuccessfulRequest = 0;

  requestData.forEach((item) => {
    totalRequest += item.total || 0;
    totalBlockRequest += item.blocked || 0;
    totalSuccessfulRequest += item.success || 0;
  });

  console.log("TOTAL REQUEST:", totalRequest);
  console.log("BLOCKED REQUEST:", totalBlockRequest);
  console.log("SUCCESSFUL REQUEST:", totalSuccessfulRequest);
  totalReq.textContent = `${totalRequest}`;
  blockReq.textContent = `${totalBlockRequest}`;
  successfulReq.textContent = `${totalSuccessfulRequest}`;

  const monthlyTotals = Array(12).fill(0); // Default empty months
  const totalData = Array(12).fill(0);
  const blockedData = Array(12).fill(0);
  const successData = Array(12).fill(0);

  requestData.forEach((item) => {
    if (item.month) {
      const index = item.month - 1; // Convert 1-12 to 0-11

      totalData[index] = item.total || 0;
      blockedData[index] = item.blocked || 0;
      successData[index] = item.success || 0;
    }
  });

  // --------------------------
  //   INIT CHART JS
  // --------------------------
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
          data: totalData, // ✅ REAL TOTAL DATA
          borderColor: "#0099cc",
          tension: 0.45,
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
        {
          data: blockedData, // ✅ REAL BLOCKED DATA
          borderColor: "#cc0000",
          tension: 0.45,
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
        {
          data: successData, // ✅ REAL SUCCESSFUL REQUEST DATA
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

              // Hide tooltip
              if (tooltip.opacity === 0) {
                tooltipEl.style.opacity = 0;
                tooltipEl.style.display = "none";
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

              tooltipEl.style.opacity = 1;
              tooltipEl.style.display = "block";

              tooltipEl.style.left =
                x - tooltipWidth / 2 + chartArea.left - 25 + "px";

              tooltipEl.style.top =
                  y - tooltipHeight -20 + chartArea.top + "px"; + chartArea.top + "px";
            },
          },
        },
        interaction: { intersect: false, mode: "index" },
        scales: {
          x: {
            grid: { color: "#eee", drawTicks: false },
            ticks: { color: "#000", padding: 13 },
            border: { display: true, color: "#ccc" },
          },
          y: {
            grid: { display: false },
            ticks: { display: false },
          },
        },
        layout: {
          padding: {
            left: 0,
            right: 0,
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
            if (!chart.tooltip?._active?.length || !selectorImg.complete)
              return;

            const ctx = chart.ctx;
            const activePoint = chart.tooltip._active[0];
            const x = activePoint.element.x;
            const y = activePoint.element.y;

            const bottomY = chart.scales.y.bottom;

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
});
