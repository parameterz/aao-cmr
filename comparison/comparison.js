// comparison.js

// Constants for JACC (CMR) - from main calculator
const JACC = {
  FEMALE_SLOPE: 0.0327,
  FEMALE_INTERCEPT: 3.68,
  MALE_SLOPE: 0.04,
  MALE_INTERCEPT: 3.74,
};

// Constants for NORRE (Echo) - height-indexed ULN values
// AAO diastole, leading edge: mean + 2SD
const NORRE = {
  FEMALE_INDEXED_ULN: 21.1, // mm/m (16.7 + 2×2.2)
  MALE_INDEXED_ULN: 21.4,   // mm/m (17.0 + 2×2.2)
};

// Constants for ASE (Echo) - BSA-indexed ULN values
// Proximal ascending aorta: mean + 2SD
const ASE = {
  FEMALE_INDEXED_ULN: 2.2,  // cm/m² (1.6 + 2×0.3)
  MALE_INDEXED_ULN: 1.9,    // cm/m² (1.5 + 2×0.2)
};

const HEIGHT_MIN_CM = 140;
const HEIGHT_MAX_CM = 210;

// Conversion utilities
const Conversions = {
  cmToInches: (cm) => cm / 2.54,
  inchesToCm: (inches) => inches * 2.54,
  kgToLbs: (kg) => kg * 2.20462,
  lbsToKg: (lbs) => lbs / 2.20462,

  getHeightInCm: () => {
    const height = parseFloat(document.getElementById("height").value);
    const unit = document.querySelector('input[name="heightUnit"]:checked').value;
    return unit === "cm" ? height : Conversions.inchesToCm(height);
  },

  getWeightInKg: () => {
    const weight = parseFloat(document.getElementById("weight").value);
    const unit = document.querySelector('input[name="weightUnit"]:checked').value;
    return unit === "kg" ? weight : Conversions.lbsToKg(weight);
  },

  areaToDiameter: (area) => 2 * Math.sqrt(area / Math.PI),
};

// Calculator functions
const Calculator = {
  // JACC: Area/Height indexed, age-dependent
  calculateJaccULN: (age, isFemale, heightCm) => {
    const slope = isFemale ? JACC.FEMALE_SLOPE : JACC.MALE_SLOPE;
    const intercept = isFemale ? JACC.FEMALE_INTERCEPT : JACC.MALE_INTERCEPT;
    const areaHeightIndex = age * slope + intercept;
    const area = areaHeightIndex * (heightCm / 100);
    const diameter = Conversions.areaToDiameter(area);
    return diameter; // in cm
  },

  // NORRE: Height-indexed (linear relationship)
  calculateNorreULN: (isFemale, heightCm) => {
    const indexedULN = isFemale ? NORRE.FEMALE_INDEXED_ULN : NORRE.MALE_INDEXED_ULN;
    const diameterMm = indexedULN * (heightCm / 100);
    return diameterMm / 10; // convert mm to cm
  },

  // ASE: BSA-indexed using DuBois formula
  calculateAseULN: (isFemale, heightCm, weightKg) => {
    const bsa = Calculator.calculateBSA(heightCm, weightKg);
    const indexedULN = isFemale ? ASE.FEMALE_INDEXED_ULN : ASE.MALE_INDEXED_ULN;
    return indexedULN * bsa; // in cm
  },

  calculateBSA: (heightCm, weightKg) => {
    // DuBois formula
    return 0.007184 * Math.pow(heightCm, 0.725) * Math.pow(weightKg, 0.425);
  },

  // Generate height range for chart
  generateHeightRange: () => {
    const heights = [];
    for (let h = HEIGHT_MIN_CM; h <= HEIGHT_MAX_CM; h += 5) {
      heights.push(h);
    }
    return heights;
  },

  // Calculate data points for chart
  calculateChartData: (age, isFemale, userBMI) => {
    const heights = Calculator.generateHeightRange();
    const jaccData = [];
    const norreData = [];
    const aseData = [];

    heights.forEach((heightCm) => {
      // JACC
      const jaccDiameter = Calculator.calculateJaccULN(age, isFemale, heightCm);
      jaccData.push({ x: heightCm, y: jaccDiameter });

      // NORRE
      const norreDiameter = Calculator.calculateNorreULN(isFemale, heightCm);
      norreData.push({ x: heightCm, y: norreDiameter });

      // ASE - calculate weight for this height using user's BMI
      const weightKg = userBMI * Math.pow(heightCm / 100, 2);
      const aseDiameter = Calculator.calculateAseULN(isFemale, heightCm, weightKg);
      aseData.push({ x: heightCm, y: aseDiameter });
    });

    return { jaccData, norreData, aseData };
  },
};

// UI Update functions
const UI = {
  updateAgeDisplay: () => {
    const age = document.getElementById("age").value;
    document.getElementById("ageValue").textContent = age;
  },

  updateHeightConversion: () => {
    const height = parseFloat(document.getElementById("height").value);
    const unit = document.querySelector('input[name="heightUnit"]:checked').value;
    const conversionElement = document.getElementById("heightConversion");

    if (!height || height <= 0) {
      conversionElement.textContent = "";
      return;
    }

    if (unit === "cm") {
      const inches = Conversions.cmToInches(height).toFixed(1);
      conversionElement.textContent = `= ${inches} inches`;
    } else {
      const cm = Conversions.inchesToCm(height).toFixed(1);
      conversionElement.textContent = `= ${cm} cm`;
    }
  },

  updateWeightConversion: () => {
    const weight = parseFloat(document.getElementById("weight").value);
    const unit = document.querySelector('input[name="weightUnit"]:checked').value;
    const conversionElement = document.getElementById("weightConversion");

    if (!weight || weight <= 0) {
      conversionElement.textContent = "";
      return;
    }

    if (unit === "kg") {
      const lbs = Conversions.kgToLbs(weight).toFixed(1);
      conversionElement.textContent = `= ${lbs} lbs`;
    } else {
      const kg = Conversions.lbsToKg(weight).toFixed(1);
      conversionElement.textContent = `= ${kg} kg`;
    }
  },

  displayResults: (age, isFemale, heightCm, weightKg, bmi) => {
    // Calculate ULN values at user's specific measurements
    const jaccULN = Calculator.calculateJaccULN(age, isFemale, heightCm);
    const norreULN = Calculator.calculateNorreULN(isFemale, heightCm);
    const aseULN = Calculator.calculateAseULN(isFemale, heightCm, weightKg);
    const bsa = Calculator.calculateBSA(heightCm, weightKg);

    // Display in table
    document.getElementById("jaccValue").textContent = jaccULN.toFixed(2);
    document.getElementById("norreValue").textContent = norreULN.toFixed(2);
    document.getElementById("aseValue").textContent = aseULN.toFixed(2);
    document.getElementById("bsaValue").textContent = bsa.toFixed(2);

    // Create chart
    ChartManager.createChart(age, isFemale, heightCm, bmi, {
      jacc: jaccULN,
      norre: norreULN,
      ase: aseULN,
    });
  },
};

// Chart Manager
const ChartManager = {
  chart: null,

  createChart: (age, isFemale, userHeightCm, userBMI, userValues) => {
    const ctx = document.getElementById("comparisonChart").getContext("2d");

    // Destroy existing chart if it exists
    if (ChartManager.chart) {
      ChartManager.chart.destroy();
    }

    // Calculate data points
    const { jaccData, norreData, aseData } = Calculator.calculateChartData(
      age,
      isFemale,
      userBMI
    );

    const datasets = [
      {
        label: "JACC (CMR) - Area/Height",
        data: jaccData,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: "NORRE (Echo) - Height-indexed",
        data: norreData,
        borderColor: "rgb(219, 39, 119)",
        backgroundColor: "rgba(219, 39, 119, 0.1)",
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0,
        pointRadius: 0,
      },
      {
        label: "ASE (Echo) - BSA-indexed",
        data: aseData,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        borderDash: [2, 3],
        tension: 0.4,
        pointRadius: 0,
      },
    ];

    // Add user's measurement points
    if (userHeightCm && userValues) {
      datasets.push({
        label: "Your JACC ULN",
        data: [{ x: userHeightCm, y: userValues.jacc }],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgb(34, 197, 94)",
        pointRadius: 7,
        pointHoverRadius: 9,
        showLine: false,
        pointStyle: "circle",
      });

      datasets.push({
        label: "Your NORRE ULN",
        data: [{ x: userHeightCm, y: userValues.norre }],
        borderColor: "rgb(219, 39, 119)",
        backgroundColor: "rgb(219, 39, 119)",
        pointRadius: 7,
        pointHoverRadius: 9,
        showLine: false,
        pointStyle: "triangle",
      });

      datasets.push({
        label: "Your ASE ULN",
        data: [{ x: userHeightCm, y: userValues.ase }],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgb(59, 130, 246)",
        pointRadius: 7,
        pointHoverRadius: 9,
        showLine: false,
        pointStyle: "rect",
      });
    }

    // Add vertical line at user's height
    const plugins = [];
    if (userHeightCm) {
      plugins.push({
        id: "verticalLine",
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          const xAxis = chart.scales.x;
          const yAxis = chart.scales.y;
          const x = xAxis.getPixelForValue(userHeightCm);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, yAxis.top);
          ctx.lineTo(x, yAxis.bottom);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.restore();
        },
      });
    }

    const sexLabel = isFemale ? "Female" : "Male";

    ChartManager.chart = new Chart(ctx, {
      type: "line",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Disable animations for instant slider updates
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              boxWidth: 12,
              padding: 10,
              font: { size: 11 },
              filter: function(item) {
                // Only show the three main reference lines in legend
                return item.text.includes("JACC") || 
                       item.text.includes("NORRE") || 
                       item.text.includes("ASE");
              }
            },
          },
          title: {
            display: true,
            text: `${sexLabel}, Age ${age} years - Upper Limits Across Height Range`,
            font: { size: 14 },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(2) + " cm";
                }
                return label;
              },
            },
          },
        },
        scales: {
          x: {
            type: "linear",
            title: {
              display: true,
              text: "Height (cm)",
              font: { size: 12 },
            },
            ticks: {
              font: { size: 10 },
            },
            min: HEIGHT_MIN_CM,
            max: HEIGHT_MAX_CM,
          },
          y: {
            title: {
              display: true,
              text: "Diameter (cm)",
              font: { size: 12 },
            },
            ticks: {
              font: { size: 10 },
            },
            beginAtZero: false,
          },
        },
      },
      plugins: plugins,
    });
  },
};

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("comparisonForm");
  const ageSlider = document.getElementById("age");
  const heightInput = document.getElementById("height");
  const weightInput = document.getElementById("weight");
  const heightUnitRadios = document.querySelectorAll('input[name="heightUnit"]');
  const weightUnitRadios = document.querySelectorAll('input[name="weightUnit"]');
  const sexRadios = document.querySelectorAll('input[name="sex"]');

  // Age slider
  ageSlider.addEventListener("input", UI.updateAgeDisplay);

  // Height conversion
  heightInput.addEventListener("input", UI.updateHeightConversion);
  heightUnitRadios.forEach((radio) => {
    radio.addEventListener("change", UI.updateHeightConversion);
  });

  // Weight conversion
  weightInput.addEventListener("input", UI.updateWeightConversion);
  weightUnitRadios.forEach((radio) => {
    radio.addEventListener("change", UI.updateWeightConversion);
  });

  // Update chart when age or sex changes (if results are showing)
  ageSlider.addEventListener("input", () => {
    if (ChartManager.chart) {
      handleFormSubmit();
    }
  });

  sexRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (ChartManager.chart) {
        handleFormSubmit();
      }
    });
  });

  // Initialize conversions
  UI.updateHeightConversion();
  UI.updateWeightConversion();

  // Form submission
  function handleFormSubmit() {
    const age = parseInt(ageSlider.value);
    const isFemale = document.querySelector('input[name="sex"]:checked').value === "female";
    const heightCm = Conversions.getHeightInCm();
    const weightKg = Conversions.getWeightInKg();

    if (!heightCm || !weightKg) {
      alert("Please enter height and weight");
      return;
    }

    const bmi = weightKg / Math.pow(heightCm / 100, 2);

    UI.displayResults(age, isFemale, heightCm, weightKg, bmi);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleFormSubmit();
  });

  // Auto-calculate on page load to show example
  handleFormSubmit();
});