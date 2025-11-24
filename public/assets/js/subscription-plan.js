document.addEventListener("DOMContentLoaded", async () => {
  const plan1 = document.getElementById("pricing-plans1");
  const plan2 = document.getElementById("pricing-plans2");
  const plan3 = document.getElementById("pricing-plans3");
  const plan4 = document.getElementById("pricing-plans4");

  console.log("✅ DOM loaded, fetching plans...");

  try {
    const res = await fetch(
      "https://api.stopreg.com/api/v1/subscription/plan"
    );
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("API data:", data);

    const plans = data?.data?.plans || [];
    console.log("Extracted plans:", plans);

    if (!plans.length) {
      throw new Error("No plans found");
    }

    // Remove the first plan (Free)
    const sliced = plans.slice(1);
    console.log("After removing first:", sliced);

    // 🧩 Get each plan as a single object (not array)
    const secondPlan = sliced[0] || null;
    const thirdPlan = sliced[1] || null;
    const fourthPlan = sliced[2] || null;
    const fifthPlan = sliced[3] || null;

    console.log("Second Plan:", secondPlan);
    console.log("Third Plan:", thirdPlan);
    console.log("Fourth Plan:", fourthPlan);
    console.log("Fifth Plan:", fifthPlan);

    // Render group 1

    plan1.innerHTML = `
              <p class="land-pricing-container-item-hd">${secondPlan.name}</p>
                <p class="land-pricing-container-item-tle">
                  ${secondPlan.apiLimit} API requests in ${secondPlan.durationInDays} days
                </p>
                <p class="land-pricing-container-item-sub-tle">
                  <span class="pr-do-si">$</span
                  ><span class="pr-do-am">${secondPlan.monthlyPrice}</span> / month
                </p>
                <button class="land-pricing-container-item-btn" data-id="${secondPlan._id}">
                  Get Started
                </button>
`;

    // Render group 2
    plan2.innerHTML = `
    <p class="land-pricing-container-item-hd">${thirdPlan.name}</p>
                <p class="land-pricing-container-item-tle">
                  ${thirdPlan.apiLimit} API requests in ${thirdPlan.durationInDays} days
                </p>
                <p class="land-pricing-container-item-sub-tle">
                  <span class="pr-do-si">$</span
                  ><span class="pr-do-am">${thirdPlan.monthlyPrice}</span> / month
                </p>
        <button class="land-pricing-container-item-btn" data-id="${thirdPlan._id}">
                  Get Started
 </button>
`;
    
    plan3.innerHTML = `
    <p class="lpcsr-remm">Recommended</p>
                <div class="land-pricing-container-item-recomm">
                  <p class="land-pricing-container-item-hd">${fourthPlan.name}</p>
                  <p class="land-pricing-container-item-tle">
                     ${fourthPlan.apiLimit}  API requests in ${fourthPlan.durationInDays} days
                  </p>
                  <p class="land-pricing-container-item-sub-tle">
                    <span class="pr-do-si">$</span
                    ><span class="pr-do-am">${fourthPlan.monthlyPrice}</span> / month
                  </p>
                  <button class="land-pricing-container-item-btn-recomm" data-id="${fourthPlan._id}">
                    Get Started
                  </button>
                </div>
`;
        plan4.innerHTML = `
    <p class="land-pricing-container-item-hd">${fifthPlan.name}</p>
                <p class="land-pricing-container-item-tle">
                  ${fifthPlan.apiLimit} API requests in ${fifthPlan.durationInDays} days
                </p>
                <p class="land-pricing-container-item-sub-tle">
                  <span class="pr-do-si">$</span
                  ><span class="pr-do-am">${fifthPlan.monthlyPrice}</span> / month
                </p>
        <button class="land-pricing-container-item-btn" data-id="${fifthPlan._id}">
                  Get Started
 </button>
`;

    console.log("✅ Plans rendered successfully");
  } catch (err) {
    console.error("❌ Error fetching plans:", err);
    plan1.innerHTML = "<p style='color:red'>Failed to load plans.</p>";
  }
});
