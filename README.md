# HFRI Calculator: Household Financial Resilience Index

**How big a financial shock can your household absorb?**

The Household Financial Resilience Index (HFRI) gives a household one score from 0 to 100. The score shows how well the household could cope with a job loss, a pay cut, a medical bill or any other sudden hit to its finances. A higher score means a household that is better able to absorb a shock.

This calculator uses **Version 2** of the index. Its weights and score bands come from tests on more than 12,000 real families in the U.S. Federal Reserve's Survey of Consumer Finances.

---

## How to use it

1. Open the calculator page (`index.html`) in any web browser.
2. Enter your household's **monthly** figures in rupees:
   - **Take-home income** after tax.
   - **Average monthly spending**, not counting loan repayments.
   - **How much your spending changes from month to month.** You can pick a description, or switch to *Last six months* and enter each month's spending.
   - **Essential monthly spending**: the part you could not skip, such as rent, food, utilities, school fees, transport and insurance.
   - **Liquid savings**: money you could reach within a few days, such as bank balances, cash and liquid funds. Do not count property, gold or long-term investments.
   - **Total outstanding debt** and **monthly loan repayments** (EMIs and minimum card payments). Leave these blank if you have no debt.
3. Your score updates as you type. You can also click one of the example households to see how the calculator works.

**Your privacy:** everything is calculated inside your browser. Nothing you type is sent anywhere or saved.

---

## What you get

- **Your HFRI score** (0 to 100) and the **risk band** it falls in.
- **What the band means in real life**: how many families score in that band, and how often those families fell behind on loan payments.
- **Your Version 1 score**: the score with the original equal weights, shown for comparison.
- **Four part scores**, with the part that costs you the most points highlighted.
- **What would move your score most**: what-if examples, such as adding a month of savings or paying down a quarter of your debt.
- **A stress test**: what happens if your income falls, or your spending rises, by a chosen amount for a chosen number of months.
- **Scoring curves**: where each of your numbers lands on its curve.
- **Copy a summary** or **Print / save as PDF** to keep your result.

---

## What the score means

| Score | Band | Share of U.S. families | Badly behind on a loan (2025) | Newly badly behind by 2009 |
|---|---|---|---|---|
| 0–35 | **High risk** | 13.4% | 20.8% | 15.1% |
| 35–55 | **Elevated risk** | 30.0% | 12.6% | 8.4% |
| 55–70 | **Moderate risk** | 15.8% | 7.2% | 4.9% |
| 70–100 | **Low risk** | 40.8% | 1.3% | 1.0% |

"Badly behind" means two months or more late on a loan payment. On average, 8.2% of U.S. families were badly behind. The band cut-offs are where that risk falls to twice the average (35), the average (55) and half the average (70).

In the 2007–09 test, a family in the High-risk band was about 15 times more likely to fall into serious trouble than a family in the Low-risk band.

---

## How the score is built

The score combines four parts. Each part is first scored from 0 to 100:

| Part | What it asks | Measured by | Weight |
|---|---|---|---|
| **Savings Strength** | Do you spend less than you earn? | (Income − Spending) ÷ Income | 5% |
| **Debt Sustainability** | Are your loans manageable? | Debt ÷ yearly income (40%) and yearly repayments ÷ yearly income (60%) | 30% |
| **Emergency Coverage** | How long could your cash last? | Liquid savings ÷ essential monthly spending | 55% |
| **Expense Stability** | Is your spending predictable? | How much monthly spending swings around its average | 10% |

```
HFRI = 0.05 × Savings + 0.30 × Debt + 0.55 × Emergency + 0.10 × Stability
```

**Why these weights?** Version 1 gave each part 25% because there was no real-world data yet. Version 2 tested all 1,770 weight combinations against real financial trouble. The tests showed two things:

- **Cash savings explain who is in trouble now.** A family with money in the bank is rarely behind on its payments.
- **Debt explains who will get into trouble later.** Families with heavy repayments in 2007 were much more likely to fall behind during the 2008 crisis.

The new weights balance these two findings. They beat the original equal weights in all ten tests on families they had never seen before.

<details>
<summary>The exact scoring formulas</summary>

| Part | Formula |
|---|---|
| Savings | `100 × (1 − e^(−5.89681 × (savings rate + 0.10)))`, or 0 if the savings rate is −10% or lower |
| Debt-to-income | `100 × e^(−0.0573534 × DTI^2.13509)` |
| Debt service-to-income | `−521.456 × DSTI² + 9.082 × DSTI + 100.005`, kept between 0 and 100 |
| Emergency | `100 × (1 − e^(−0.37028 × months^0.901391))` |
| Stability | `100 × e^(−3.13957 × CV^1.30837)` |

These curves are the same as in Version 1. Interactive versions are on Desmos: [Savings](https://www.desmos.com/calculator/viw3r7j9pn) · [Debt-to-income](https://www.desmos.com/calculator/sm6ui1oaan) · [Debt service](https://www.desmos.com/calculator/tnir0duni6) · [Emergency](https://www.desmos.com/calculator/5xr0tuvzbk) · [Stability](https://www.desmos.com/calculator/xvnar7ksid)

</details>

---

## Things to keep in mind

- **The evidence is American.** The weights and bands were tested on U.S. families. The index uses ratios, so it works with rupee figures, but it has not yet been tested on Indian household data.
- **A score predicts. It does not cause.** A low score is a warning sign. It does not prove that raising your score would prevent trouble.
- **The 2009 test covers one crisis.** A different kind of shock, such as prices rising quickly, could change how much savings and debt matter.
- **This is not financial advice.** Use the score to understand where your household is strong or weak, not as a final verdict.

---

## Research papers

- **Version 2 (current):** [Household Financial Resilience Index: Version 2, From Simulated Households to Real Ones](Household_Financial_Resilience_Index_Version_2.pdf)
- **Version 2 analysis code:** [github.com/agarwalvivaan09-ai/HFRIV2](https://github.com/agarwalvivaan09-ai/HFRIV2)
- **Version 1 (original):** [Household Financial Resilience Index](Household_Financial_Resiliance_Index_Vivaan_Agarwal%20(1).pdf)

---

## Author

**Vivaan Agarwal**, La Martiniere for Boys, Kolkata

- Website: https://agarwalvivaan09-ai.github.io/vivaan-agarwal-website-3.0/
- GitHub: https://github.com/agarwalvivaan09-ai

Feedback, corrections and questions are welcome.

## License

MIT. See [LICENSE](LICENSE).
