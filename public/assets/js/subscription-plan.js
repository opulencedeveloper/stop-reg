document.addEventListener("DOMContentLoaded", () => {
  const plan1 = document.getElementById("pricing-plans1");
  const plan2 = document.getElementById("pricing-plans2");
  const plan3 = document.getElementById("pricing-plans3");
  const plan4 = document.getElementById("pricing-plans4");

  console.log("✅ DOM loaded, rendering plans...");

  // Check if we're on the payments page
  const isPaymentsPage = window.location.pathname.includes("payments.html");
  const buttonText = isPaymentsPage ? "Choose this plan" : "Get Started";
  const isForm = isPaymentsPage; // Forms need hidden input

  try {
    // Hardcoded plans array
    const plans = [
      {
        "_id": "6919d59af89bb2679ddadbb2",
        "name": "Starter",
        "monthlyPrice": 5,
        "apiLimit": 10000,
        "durationInDays": 30,
        "isRecommended": false,
        "createdAt": "2025-11-16T13:46:02.466Z",
        "updatedAt": "2025-11-16T13:46:02.466Z",
        "__v": 0
      },
      {
        "_id": "6919d5b9f89bb2679ddadbb4",
        "name": "Developer",
        "monthlyPrice": 10,
        "apiLimit": 30000,
        "durationInDays": 30,
        "isRecommended": false,
        "createdAt": "2025-11-16T13:46:33.953Z",
        "updatedAt": "2025-11-16T13:46:33.953Z",
        "__v": 0
      },
      {
        "_id": "6919d5d8f89bb2679ddadbb6",
        "name": "Business",
        "monthlyPrice": 40,
        "apiLimit": 200000,
        "durationInDays": 30,
        "isRecommended": true,
        "createdAt": "2025-11-16T13:47:04.399Z",
        "updatedAt": "2025-11-16T13:47:04.399Z",
        "__v": 0
      },
      {
        "_id": "6919d5f5f89bb2679ddadbb8",
        "name": "Enterprise",
        "monthlyPrice": null,
        "apiLimit": null,
        "durationInDays": null,
        "isRecommended": false,
        "createdAt": "2025-11-16T13:47:33.901Z",
        "updatedAt": "2025-11-16T13:47:33.901Z",
        "__v": 0
      }
    ];

    console.log("Plans array:", plans);

    if (!plans.length) {
      throw new Error("No plans found");
    }

    // Filter out plans with null values (like Enterprise) and get paid plans
    const paidPlans = plans.filter(plan => plan.monthlyPrice !== null && plan.apiLimit !== null);
    
    // Find the recommended plan
    const recommendedPlan = paidPlans.find(plan => plan.isRecommended === true);
    
    // Get non-recommended plans
    const regularPlans = paidPlans.filter(plan => plan.isRecommended !== true);
    
    // Sort plans by price
    regularPlans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    
    // Get the 4 plans we need: 2 regular + 1 recommended + 1 regular
    const plan1Data = regularPlans[0] || null; // Starter
    const plan2Data = regularPlans[1] || null; // Developer
    const plan3Data = recommendedPlan || null; // Business (Recommended)
    const plan4Data = regularPlans[2] || null; // If there's a 4th plan

    console.log("Plan 1 (Starter):", plan1Data);
    console.log("Plan 2 (Developer):", plan2Data);
    console.log("Plan 3 (Recommended):", plan3Data);
    console.log("Plan 4:", plan4Data);

    // Format API limit with commas
    const formatNumber = (num) => num ? num.toLocaleString() : 'N/A';

    // Render plan 1 (Starter) - matches exact HTML structure
    if (plan1Data) {
      plan1.innerHTML = `
                <p class="land-pricing-container-item-hd">${plan1Data.name}</p>
                <p class="land-pricing-container-item-tle">
                  ${formatNumber(plan1Data.apiLimit)} API requests in ${plan1Data.durationInDays} days
                </p>
                <p class="land-pricing-container-item-sub-tle">
                  <span class="pr-do-si">$</span
                  ><span class="pr-do-am">${plan1Data.monthlyPrice}</span> / month
                </p>
                ${isForm ? '<input type="hidden" name="planId" value="' + plan1Data._id + '" />' : ''}
                <button class="land-pricing-container-item-btn" data-id="${plan1Data._id}">
                  ${buttonText}
                </button>
      `;
    }

    // Render plan 2 (Developer) - matches exact HTML structure
    if (plan2Data) {
      plan2.innerHTML = `
                <p class="land-pricing-container-item-hd">${plan2Data.name}</p>
                <p class="land-pricing-container-item-tle">
                  ${formatNumber(plan2Data.apiLimit)} API requests in ${plan2Data.durationInDays} days
                </p>
                <p class="land-pricing-container-item-sub-tle">
                  <span class="pr-do-si">$</span
                  ><span class="pr-do-am">${plan2Data.monthlyPrice}</span> / month
                </p>
                ${isForm ? '<input type="hidden" name="planId" value="' + plan2Data._id + '" />' : ''}
                <button class="land-pricing-container-item-btn" data-id="${plan2Data._id}">
                  ${buttonText}
                </button>
      `;
    }
    
    // Render plan 3 (Recommended - Business) - matches exact HTML structure
    if (plan3Data) {
      plan3.innerHTML = `
                <p class="lpcsr-remm">Recommended</p>
                <div class="land-pricing-container-item-recomm">
                  <p class="land-pricing-container-item-hd">${plan3Data.name}</p>
                  <p class="land-pricing-container-item-tle">
                    ${formatNumber(plan3Data.apiLimit)} API requests in ${plan3Data.durationInDays} days
                  </p>
                  <p class="land-pricing-container-item-sub-tle">
                    <span class="pr-do-si">$</span
                    ><span class="pr-do-am">${plan3Data.monthlyPrice}</span> / month
                  </p>
                  ${isForm ? '<input type="hidden" name="planId" value="' + plan3Data._id + '" />' : ''}
                  <button class="land-pricing-container-item-btn-recomm" data-id="${plan3Data._id}">
                    ${buttonText}
                  </button>
                </div>
      `;
    }

    // Render plan 4 (Enterprise or 4th plan) - matches exact HTML structure
    const enterprisePlan = plans.find(plan => plan.name === "Enterprise");
    if (plan4Data) {
      plan4.innerHTML = `
                <p class="land-pricing-container-item-hd">${plan4Data.name}</p>
                <p class="land-pricing-container-item-tle">
                  ${formatNumber(plan4Data.apiLimit)} API requests in ${plan4Data.durationInDays} days
                </p>
                <p class="land-pricing-container-item-sub-tle">
                  <span class="pr-do-si">$</span
                  ><span class="pr-do-am">${plan4Data.monthlyPrice}</span> / month
                </p>
                ${isForm ? '<input type="hidden" name="planId" value="' + plan4Data._id + '" />' : ''}
                <button class="land-pricing-container-item-btn" data-id="${plan4Data._id}">
                  ${buttonText}
                </button>
      `;
    } else if (enterprisePlan) {
      // Show Enterprise with custom pricing - matches structure
      plan4.innerHTML = `
                <p class="land-pricing-container-item-hd">${enterprisePlan.name}</p>
                <p class="land-pricing-container-item-tle">
                  Unlimited API requests with custom limits
                </p>
                <p class="land-pricing-container-item-sub-tle">
                  <span class="pr-do-si">Custom</span>
                </p>
                ${isForm ? '<input type="hidden" name="planId" value="' + enterprisePlan._id + '" />' : ''}
                <button class="land-pricing-container-item-btn" data-id="${enterprisePlan._id}">
                  Contact Sales
                </button>
      `;
    }

    console.log("✅ Plans rendered successfully");
  } catch (err) {
    console.error("❌ Error fetching plans:", err);
    plan1.innerHTML = "<p style='color:red'>Failed to load plans.</p>";
    
    // Show error toast
    if (typeof iziToast !== 'undefined') {
      iziToast.error({
        title: 'Error',
        message: "Failed to load subscription plans. Please try again later.",
        position: "topRight",
        timeout: 5000,
        drag: false,
        displayMode: 1,
        zindex: 9999,
      });
    }
  }
});
