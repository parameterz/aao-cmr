// script.js

// Constants
const FEMALE_SLOPE = 0.0327;
const FEMALE_INTERCEPT = 3.68;
const MALE_SLOPE = 0.04;
const MALE_INTERCEPT = 3.74;

const HEIGHT_MIN_CM = 140;
const HEIGHT_MAX_CM = 210;
const AGE_MIN = 40;
const AGE_MAX = 70;

// Conversion utilities
const Conversions = {
    cmToInches: (cm) => cm / 2.54,
    inchesToCm: (inches) => inches * 2.54,
    
    diameterToArea: (diameter) => Math.PI * Math.pow(diameter / 2, 2),
    areaToDiameter: (area) => 2 * Math.sqrt(area / Math.PI),
    
    getHeightInCm: () => {
        const height = parseFloat(document.getElementById('height').value);
        const unit = document.querySelector('input[name="heightUnit"]:checked').value;
        return unit === 'cm' ? height : Conversions.inchesToCm(height);
    },
    
    getHeightInMeters: () => Conversions.getHeightInCm() / 100
};

// Calculator functions
const Calculator = {
    calculateAreaHeightIndex: (age, isFemale) => {
        const slope = isFemale ? FEMALE_SLOPE : MALE_SLOPE;
        const intercept = isFemale ? FEMALE_INTERCEPT : MALE_INTERCEPT;
        return age * slope + intercept;
    },
    
    calculateAbsoluteArea: (areaHeightIndex, heightMeters) => {
        return areaHeightIndex * heightMeters;
    },
    
    calculateNormativeValues: (age, heightMeters) => {
        const female = {
            index: Calculator.calculateAreaHeightIndex(age, true),
            area: null,
            diameter: null
        };
        
        const male = {
            index: Calculator.calculateAreaHeightIndex(age, false),
            area: null,
            diameter: null
        };
        
        female.area = Calculator.calculateAbsoluteArea(female.index, heightMeters);
        female.diameter = Conversions.areaToDiameter(female.area);
        
        male.area = Calculator.calculateAbsoluteArea(male.index, heightMeters);
        male.diameter = Conversions.areaToDiameter(male.area);
        
        return { female, male };
    },
    
    getUserMeasurement: () => {
        const measuredValue = parseFloat(document.getElementById('measuredValue').value);
        if (!measuredValue || measuredValue <= 0) return null;
        
        const measuredType = document.querySelector('input[name="measuredType"]:checked')?.value;
        if (!measuredType) return null;
        
        let area, diameter;
        if (measuredType === 'diameter') {
            diameter = measuredValue;
            area = Conversions.diameterToArea(diameter);
        } else {
            area = measuredValue;
            diameter = Conversions.areaToDiameter(area);
        }
        
        const heightMeters = Conversions.getHeightInMeters();
        const index = area / heightMeters;
        
        return { area, diameter, index, type: measuredType };
    }
};

// UI Update functions
const UI = {
    updateHeightConversion: () => {
        const height = parseFloat(document.getElementById('height').value);
        const unit = document.querySelector('input[name="heightUnit"]:checked').value;
        const conversionElement = document.getElementById('heightConversion');
        
        if (!height || height <= 0) {
            conversionElement.textContent = '';
            return;
        }
        
        if (unit === 'cm') {
            const inches = Conversions.cmToInches(height).toFixed(1);
            conversionElement.textContent = `= ${inches} inches`;
        } else {
            const cm = Conversions.inchesToCm(height).toFixed(2);
            conversionElement.textContent = `= ${cm} cm`;
        }
        
        // Show warning if outside valid range
        const heightCm = unit === 'cm' ? height : Conversions.inchesToCm(height);
        const heightWarning = document.getElementById('heightWarning');
        if (heightCm < HEIGHT_MIN_CM || heightCm > HEIGHT_MAX_CM) {
            heightWarning.style.display = 'block';
        } else {
            heightWarning.style.display = 'none';
        }
    },
    
    updateAgeWarning: () => {
        const age = parseFloat(document.getElementById('age').value);
        const ageWarning = document.getElementById('ageWarning');
        
        if (!age) {
            ageWarning.style.display = 'none';
            return;
        }
        
        if (age < AGE_MIN || age > AGE_MAX) {
            ageWarning.style.display = 'block';
        } else {
            ageWarning.style.display = 'none';
        }
    },
    
    updateMeasuredConversion: () => {
        const measuredValue = parseFloat(document.getElementById('measuredValue').value);
        const measuredType = document.querySelector('input[name="measuredType"]:checked')?.value;
        const conversionElement = document.getElementById('measuredConversion');
        
        if (!measuredValue || measuredValue <= 0 || !measuredType) {
            conversionElement.textContent = '';
            return;
        }
        
        if (measuredType === 'diameter') {
            const area = Conversions.diameterToArea(measuredValue).toFixed(2);
            conversionElement.textContent = `= ${area} cm² area`;
        } else {
            const diameter = Conversions.areaToDiameter(measuredValue).toFixed(2);
            conversionElement.textContent = `= ${diameter} cm diameter`;
        }
    },
    
    displayResults: (normative, userMeasurement, age, heightCm) => {
        // Display normative values (2 decimal places for all cm measurements)
        document.getElementById('femaleIndex').textContent = normative.female.index.toFixed(2);
        document.getElementById('femaleArea').textContent = normative.female.area.toFixed(2);
        document.getElementById('femaleDiameter').textContent = normative.female.diameter.toFixed(2);
        
        document.getElementById('maleIndex').textContent = normative.male.index.toFixed(2);
        document.getElementById('maleArea').textContent = normative.male.area.toFixed(2);
        document.getElementById('maleDiameter').textContent = normative.male.diameter.toFixed(2);
        
        document.getElementById('results').style.display = 'block';
        
        // Display user's measurement comparison if provided
        if (userMeasurement) {
            document.getElementById('userDiameter').textContent = userMeasurement.diameter.toFixed(2);
            document.getElementById('userArea').textContent = userMeasurement.area.toFixed(2);
            document.getElementById('userIndex').textContent = userMeasurement.index.toFixed(2);
            
            // Female comparison
            const femalePercentDiff = ((userMeasurement.index - normative.female.index) / normative.female.index * 100);
            
            let femaleText = '';
            if (femalePercentDiff > 0) {
                femaleText = `${femalePercentDiff.toFixed(1)}% above female upper limit`;
            } else if (femalePercentDiff < 0) {
                femaleText = `${Math.abs(femalePercentDiff).toFixed(1)}% below female upper limit`;
            } else {
                femaleText = `At female upper limit`;
            }
            document.getElementById('femaleComparison').textContent = femaleText;
            
            // Male comparison
            const malePercentDiff = ((userMeasurement.index - normative.male.index) / normative.male.index * 100);
            
            let maleText = '';
            if (malePercentDiff > 0) {
                maleText = `${malePercentDiff.toFixed(1)}% above male upper limit`;
            } else if (malePercentDiff < 0) {
                maleText = `${Math.abs(malePercentDiff).toFixed(1)}% below male upper limit`;
            } else {
                maleText = `At male upper limit`;
            }
            document.getElementById('maleComparison').textContent = maleText;
            
            document.getElementById('userComparison').style.display = 'block';
        } else {
            document.getElementById('userComparison').style.display = 'none';
        }
        
        // Auto-select chart type based on user input, or default to area
        const chartType = userMeasurement ? userMeasurement.type : 'area';
        if (chartType === 'diameter') {
            document.getElementById('chartTypeDiameter').checked = true;
        } else {
            document.getElementById('chartTypeArea').checked = true;
        }
        
        // Create chart
        ChartManager.createChart(age, heightCm, normative, userMeasurement);
    }
};

// Chart Manager
const ChartManager = {
    chart: null,
    
    generateHeightRange: () => {
        const heights = [];
        for (let h = HEIGHT_MIN_CM; h <= HEIGHT_MAX_CM; h += 5) {
            heights.push(h);
        }
        return heights;
    },
    
    calculateDataPoints: (age, isFemale, chartType) => {
        const heights = ChartManager.generateHeightRange();
        const areaHeightIndex = Calculator.calculateAreaHeightIndex(age, isFemale);
        
        return heights.map(heightCm => {
            const heightM = heightCm / 100;
            const area = Calculator.calculateAbsoluteArea(areaHeightIndex, heightM);
            
            if (chartType === 'area') {
                return { x: heightCm, y: area };
            } else {
                const diameter = Conversions.areaToDiameter(area);
                return { x: heightCm, y: diameter };
            }
        });
    },
    
    calculateValueAtHeight: (age, isFemale, heightCm, chartType) => {
        const heightM = heightCm / 100;
        const areaHeightIndex = Calculator.calculateAreaHeightIndex(age, isFemale);
        const area = Calculator.calculateAbsoluteArea(areaHeightIndex, heightM);
        
        if (chartType === 'area') {
            return area;
        } else {
            return Conversions.areaToDiameter(area);
        }
    },
    
    createChart: (age, userHeightCm, normative, userMeasurement) => {
        const ctx = document.getElementById('normativeChart').getContext('2d');
        const chartType = document.querySelector('input[name="chartType"]:checked').value;
        
        // Destroy existing chart if it exists
        if (ChartManager.chart) {
            ChartManager.chart.destroy();
        }
        
        const femaleData = ChartManager.calculateDataPoints(age, true, chartType);
        const maleData = ChartManager.calculateDataPoints(age, false, chartType);
        
        const datasets = [
            {
                label: 'Female (97.5th percentile)',
                data: femaleData,
                borderColor: 'rgb(219, 39, 119)',
                backgroundColor: 'rgba(219, 39, 119, 0.1)',
                borderWidth: 2,
                tension: 0.4
            },
            {
                label: 'Male (97.5th percentile)',
                data: maleData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4
            }
        ];
        
        // Add intersection points at user's height
        if (userHeightCm) {
            const femaleValueAtHeight = ChartManager.calculateValueAtHeight(age, true, userHeightCm, chartType);
            const maleValueAtHeight = ChartManager.calculateValueAtHeight(age, false, userHeightCm, chartType);
            
            datasets.push({
                label: 'Female limit at your height',
                data: [{ x: userHeightCm, y: femaleValueAtHeight }],
                borderColor: 'rgb(219, 39, 119)',
                backgroundColor: 'rgb(219, 39, 119)',
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: false,
                pointStyle: 'circle'
            });
            
            datasets.push({
                label: 'Male limit at your height',
                data: [{ x: userHeightCm, y: maleValueAtHeight }],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgb(59, 130, 246)',
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: false,
                pointStyle: 'circle'
            });
        }
        
        // Add user's measurement point if provided
        if (userMeasurement && userHeightCm) {
            const userY = chartType === 'area' ? userMeasurement.area : userMeasurement.diameter;
            datasets.push({
                label: 'Your Measurement',
                data: [{ x: userHeightCm, y: userY }],
                borderColor: 'rgb(234, 179, 8)',
                backgroundColor: 'rgb(234, 179, 8)',
                pointRadius: 8,
                pointHoverRadius: 10,
                showLine: false,
                pointStyle: 'star'
            });
        }
        
        // Add vertical line at user's height
        const plugins = [];
        if (userHeightCm) {
            plugins.push({
                id: 'verticalLine',
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
                    ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
                    ctx.setLineDash([5, 5]);
                    ctx.stroke();
                    ctx.restore();
                }
            });
        }
        
        const yAxisLabel = chartType === 'area' ? 'Area (cm²)' : 'Diameter (cm)';
        
        ChartManager.chart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: `Age ${age} years - Upper Limits Across Height Range`
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(2);
                                    label += chartType === 'area' ? ' cm²' : ' cm';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Height (cm)'
                        },
                        min: HEIGHT_MIN_CM,
                        max: HEIGHT_MAX_CM
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisLabel
                        },
                        beginAtZero: false
                    }
                }
            },
            plugins: plugins
        });
    },
    
    updateChart: (age, heightCm, normative, userMeasurement) => {
        ChartManager.createChart(age, heightCm, normative, userMeasurement);
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calculatorForm');
    const heightInput = document.getElementById('height');
    const ageInput = document.getElementById('age');
    const heightUnitRadios = document.querySelectorAll('input[name="heightUnit"]');
    const measuredValueInput = document.getElementById('measuredValue');
    const measuredTypeRadios = document.querySelectorAll('input[name="measuredType"]');
    const chartTypeRadios = document.querySelectorAll('input[name="chartType"]');
    
    // Height conversion updates
    heightInput.addEventListener('input', UI.updateHeightConversion);
    heightUnitRadios.forEach(radio => {
        radio.addEventListener('change', UI.updateHeightConversion);
    });
    
    // Age warning
    ageInput.addEventListener('input', UI.updateAgeWarning);
    
    // Measured value conversion
    measuredValueInput.addEventListener('input', UI.updateMeasuredConversion);
    measuredTypeRadios.forEach(radio => {
        radio.addEventListener('change', UI.updateMeasuredConversion);
    });
    
    // Chart type toggle
    chartTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (ChartManager.chart) {
                const age = parseFloat(ageInput.value);
                const heightCm = Conversions.getHeightInCm();
                const heightMeters = Conversions.getHeightInMeters();
                const normative = Calculator.calculateNormativeValues(age, heightMeters);
                const userMeasurement = Calculator.getUserMeasurement();
                ChartManager.updateChart(age, heightCm, normative, userMeasurement);
            }
        });
    });
    
    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const age = parseFloat(ageInput.value);
        const heightMeters = Conversions.getHeightInMeters();
        const heightCm = Conversions.getHeightInCm();
        
        if (!age || !heightMeters) {
            alert('Please enter age and height');
            return;
        }
        
        const normative = Calculator.calculateNormativeValues(age, heightMeters);
        const userMeasurement = Calculator.getUserMeasurement();
        
        UI.displayResults(normative, userMeasurement, age, heightCm);
        
        // Scroll to results (now chart comes first)
        document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});