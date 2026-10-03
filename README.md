Household Financial Resilience Index (HFRI)

A quantitative framework for measuring a household’s ability to absorb financial shocks while continuing to meet essential financial obligations.

Overview

The Household Financial Resilience Index (HFRI) is a transparent mathematical index that combines four dimensions of household financial health:

1. Savings Strength
2. Debt Sustainability
3. Emergency Coverage
4. Expense Stability

Each dimension is converted into a 0–100 score using calibrated mathematical functions. The four scores are then combined to produce a final HFRI score from 0 to 100.

The research question underlying the project is:

Can a transparent mathematical index combining savings, debt, emergency liquidity, and expenditure stability provide a meaningful measure of household financial resilience?

HFRI Structure

The index uses equal weighting across the four dimensions:

HFRI = 0.25S + 0.25D + 0.25E + 0.25X

where:

* S = Savings Strength
* D = Debt Sustainability
* E = Emergency Coverage
* X = Expense Stability

Debt sustainability itself combines two indicators:

D = 0.40D_{DTI} + 0.60D_{DSTI}

Indicators

Dimension	Indicator
Savings Strength	Savings Rate
Debt Sustainability	Debt-to-Income Ratio (DTI)
Debt Sustainability	Debt-Service-to-Income Ratio (DSTI)
Emergency Coverage	Months of Essential Expenses Covered
Expense Stability	Coefficient of Variation (CV)

Core formulas

Savings Rate

SR = \frac{Y-C}{Y}

Debt-to-Income Ratio

DTI = \frac{D_b}{Y}

Debt-Service-to-Income Ratio

DSTI = \frac{D_s}{Y}

Emergency Coverage

EC = \frac{L}{E_m}

Expense Coefficient of Variation

CV = \frac{\sigma_C}{\bar C}

where Y is income, C is expenditure, D_b is debt balance, D_s is annual debt service, L is liquid savings, and E_m is essential monthly expenditure.

Mathematical Model

Each indicator is transformed using a calibrated scoring function.

Savings

S(SR)=100(1-e^{-5.89681(SR+0.10)})

for SR>-0.10, with scores below this threshold set to 0.

Debt-to-Income

D_{DTI}=100e^{-0.0573534(DTI)^{2.13509}}

Debt-Service-to-Income

D_{DSTI}=-521.45598(DSTI)^2+9.08245(DSTI)+100.00523

with scores constrained to the 0–100 range.

Emergency Coverage

E(EC)=100(1-e^{-0.37028EC^{0.901391}})

Expense Stability

X(CV)=100e^{-3.13957CV^{1.30837}}

The functions were calibrated against predefined anchor points and fitted to produce smooth, interpretable scoring curves.

Calibration

The model was tested against calibration points representing different levels of financial strength.

Examples include:

* Savings rate: −10% → 0, 0% → 50, 30% → 95
* DTI: 0 → 100, 3 → 55, 6 → 5
* DSTI: 0 → 100, 0.30 → 55, 0.40 → 20
* Emergency coverage: 0 months → 0, 3 months → 65, 12 months → 96
* Expense CV: 0 → 100, 0.33 → 50, 1.00 → 3

The resulting curve fits produced high R^2 values across all five scoring functions.

Simulation

The model was tested using a synthetic dataset of:

* 1,000 households
* 12 months
* 12,000 household-month observations
* Randomized income, expenditure, savings, debt, liquidity and spending volatility
* A fixed random seed of 42 for reproducibility

The simulation incorporated both positive and negative monthly cash-flow outcomes, borrowing, debt servicing, savings accumulation and borrowing constraints.

Results

Under the baseline equal-weight specification:

Statistic	HFRI
Mean	75.84
Standard deviation	16.24
Minimum	16.27
10th percentile	48.40
Median	82.04
90th percentile	91.35
Maximum	97.24

The model’s components showed different relationships with the final index, reflecting the fact that financial resilience is multidimensional rather than determined by a single indicator.

Sensitivity Analysis

The research tested alternative weights between 10% and 40% for each dimension.

The resulting HFRI rankings remained highly correlated with the baseline equal-weight model. Across the tested specifications, rank correlations remained above 0.97, indicating that moderate changes to the weighting structure did not substantially alter household ordering in the simulation.

This supports the robustness of the index to reasonable changes in the weighting scheme, but does not establish that equal weighting is uniquely correct.

External Benchmarking

The model was compared with an ONS-style financial-resilience benchmark based on the ability to withstand an income shock.

The simulation produced:

* HFRI–benchmark Pearson correlation: 0.873
* HFRI–benchmark Spearman correlation: 0.734
* Benchmark resilience rate: 75.9%

The comparison is treated as benchmarking and consistency analysis rather than definitive external validation.

The research also subjected households to simulated income and expenditure shocks to examine how HFRI behaved under financial stress.

Interpretation

The model suggests a broad transition in simulated shock-absorption capacity around the 65–70 HFRI range, with households above approximately 70 generally displaying stronger simulated resilience.

These ranges are model-based interpretations, not universal real-world thresholds.



Reproducibility

The simulation uses a fixed random seed of 42. The repository is intended to make the mathematical framework, calibration process and simulation methodology transparent and reproducible.

The project is based on synthetic household data rather than personally identifiable household financial records.

Limitations

The research has several important limitations:

* The household dataset is simulated rather than observed.
* The calibration points involve researcher-defined assumptions.
* Equal weighting is a modelling choice rather than an empirically established optimum.
* The index does not capture every dimension of household financial health.
* Household income and expenditure dynamics are simplified.
* The ONS comparison is a benchmark, not independent predictive validation.
* The expense-shock test is researcher-defined.
* HFRI scores should not be interpreted as individual financial advice or a definitive measure of financial wellbeing.

Research Paper

The complete methodology, mathematical derivations, calibration, simulation results, sensitivity analysis and benchmarking are available in the research paper:

Household Financial Resilience Index — Vivaan Agarwal⁠￼

Author

Vivaan Agarwal

Independent Researcher
Economics · Finance · Quantitative Analysis

* Website: https://agarwalvivaan09-ai.github.io/vivaan-dev/
* GitHub: https://github.com/agarwalvivaan09-ai

License

The code in this repository is released under the MIT License.

See LICENSE for details.
