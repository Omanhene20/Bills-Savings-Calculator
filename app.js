const BILL_OPTIONS = [
  "Rent / Mortgage",
  "Utilities (Electric/Gas/Water)",
  "Internet",
  "Phone bill",
  "Car payment",
  "Car insurance",
  "Health insurance",
  "Groceries",
  "Gas / Transportation",
  "Student loans",
  "Credit card minimums",
  "Subscriptions (Netflix, etc.)",
  "Childcare",
  "Home / Renter's insurance",
  "Medical / Prescriptions",
  "Gym / Fitness"
];

const el = (id) => document.getElementById(id);

const payFrequencyEl = el("payFrequency");
const netPayEl = el("netPay");
const billChipsEl = el("billChips");
const selectedBillsAreaEl = el("selectedBillsArea");
const otherExpensesEl = el("otherExpenses");
const addOtherExpenseBtn = el("addOtherExpense");
const clearAllBtn = el("clearAll");

const baselineMonthlyNetEl = el("baselineMonthlyNet");
const perPayLabelEl = el("perPayLabel");
const perPayNetEl = el("perPayNet");

const totalBillsEl = el("totalBills");
const monthlyNetEl = el("monthlyNet");
const moneyLeftMonthlyEl = el("moneyLeftMonthly");
const moneyLeftPerPayLabelEl = el("moneyLeftPerPayLabel");
const moneyLeftPerPayEl = el("moneyLeftPerPay");

const calloutPositiveEl = el("calloutPositive");
const positiveMessageEl = el("positiveMessage");
const calloutNegativeEl = el("calloutNegative");
const shortfallEl = el("shortfall");
const toggleRecommendationBtn = el("toggleRecommendation");
const recommendationPanelEl = el("recommendationPanel");

let selectedBills = new Set();
let otherExpenseCount = 0;

function fmt(num) {
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseNum(str) {
  const cleaned = String(str).replace(/[^0-9.]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

function getMonthlyNet() {
  const freq = payFrequencyEl.value;
  const pay = parseNum(netPayEl.value);
  if (freq === "weekly") return pay * 4;
  if (freq === "biweekly") return pay * 2;
  return pay;
}

function getPerPayDivisor() {
  const freq = payFrequencyEl.value;
  if (freq === "weekly") return 4;
  if (freq === "biweekly") return 2;
  return 1;
}

function getPerPayLabel() {
  const freq = payFrequencyEl.value;
  if (freq === "weekly") return "per week";
  if (freq === "biweekly") return "per paycheck";
  return "per month";
}

function updatePayLabels() {
  const label = getPerPayLabel();
  const monthlyNet = getMonthlyNet();
  const divisor = getPerPayDivisor();
  const perPay = monthlyNet / divisor;

  baselineMonthlyNetEl.textContent = fmt(monthlyNet);
  perPayLabelEl.textContent = `Net ${label}`;
  perPayNetEl.textContent = fmt(perPay);

  moneyLeftPerPayLabelEl.textContent = `Money left (${label})`;
}

function renderBillChips() {
  billChipsEl.innerHTML = "";
  BILL_OPTIONS.forEach((bill) => {
    const chip = document.createElement("label");
    chip.className = "chip";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedBills.has(bill);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedBills.add(bill);
      } else {
        selectedBills.delete(bill);
      }
      renderSelectedBills();
      calculate();
    });

    const text = document.createTextNode(bill);
    chip.appendChild(checkbox);
    chip.appendChild(text);
    billChipsEl.appendChild(chip);
  });
}

function renderSelectedBills() {
  if (selectedBills.size === 0) {
    selectedBillsAreaEl.innerHTML = '<div class="muted">Select a few bills above to start.</div>';
    return;
  }

  selectedBillsAreaEl.innerHTML = "";
  selectedBills.forEach((bill) => {
    const line = document.createElement("div");
    line.className = "bill-line";

    const nameDiv = document.createElement("div");
    nameDiv.className = "bill-name";
    nameDiv.textContent = bill;

    const input = document.createElement("input");
    input.className = "control";
    input.placeholder = "Amount ($)";
    input.inputMode = "decimal";
    input.dataset.bill = bill;
    input.addEventListener("input", calculate);

    const removeBtn = document.createElement("button");
    removeBtn.className = "icon-btn";
    removeBtn.textContent = "✕";
    removeBtn.type = "button";
    removeBtn.addEventListener("click", () => {
      selectedBills.delete(bill);
      renderSelectedBills();
      calculate();
    });

    line.appendChild(nameDiv);
    line.appendChild(input);
    line.appendChild(removeBtn);
    selectedBillsAreaEl.appendChild(line);
  });
}

function addOtherExpense() {
  otherExpenseCount++;
  const line = document.createElement("div");
  line.className = "other-line";
  line.dataset.otherId = otherExpenseCount;

  const nameInput = document.createElement("input");
  nameInput.className = "control";
  nameInput.placeholder = "Expense name (optional)";

  const amountInput = document.createElement("input");
  amountInput.className = "control other-amount";
  amountInput.placeholder = "Amount ($)";
  amountInput.inputMode = "decimal";
  amountInput.addEventListener("input", calculate);

  const removeBtn = document.createElement("button");
  removeBtn.className = "icon-btn";
  removeBtn.textContent = "✕";
  removeBtn.type = "button";
  removeBtn.addEventListener("click", () => {
    line.remove();
    calculate();
  });

  line.appendChild(nameInput);
  line.appendChild(amountInput);
  line.appendChild(removeBtn);
  otherExpensesEl.appendChild(line);
  calculate();
}

function clearAllAmounts() {
  document.querySelectorAll(".bill-line input").forEach((inp) => (inp.value = ""));
  document.querySelectorAll(".other-amount").forEach((inp) => (inp.value = ""));
  calculate();
}

function calculate() {
  updatePayLabels();

  let totalBills = 0;

  document.querySelectorAll(".bill-line input").forEach((inp) => {
    totalBills += parseNum(inp.value);
  });

  document.querySelectorAll(".other-amount").forEach((inp) => {
    totalBills += parseNum(inp.value);
  });

  const monthlyNet = getMonthlyNet();
  const leftoverMonthly = monthlyNet - totalBills;
  const divisor = getPerPayDivisor();
  const leftoverPerPay = leftoverMonthly / divisor;

  totalBillsEl.textContent = fmt(totalBills);
  monthlyNetEl.textContent = fmt(monthlyNet);
  moneyLeftMonthlyEl.textContent = fmt(leftoverMonthly);
  moneyLeftPerPayEl.textContent = fmt(leftoverPerPay);

  calloutPositiveEl.hidden = true;
  calloutNegativeEl.hidden = true;
  recommendationPanelEl.hidden = true;

  if (leftoverMonthly >= 0) {
    calloutPositiveEl.hidden = false;
    const label = getPerPayLabel();
    positiveMessageEl.textContent = `You have ${fmt(leftoverPerPay)} ${label} to spend/enjoy until your next paycheck (or save/invest it).`;
  } else {
    calloutNegativeEl.hidden = false;
    const shortfall = Math.abs(leftoverMonthly);
    shortfallEl.textContent = fmt(shortfall);
  }
}

function showRecommendation() {
  const monthlyNet = getMonthlyNet();
  const totalBills = parseNum(totalBillsEl.textContent);
  const shortfall = totalBills - monthlyNet;

  const freq = payFrequencyEl.value;
  const divisor = getPerPayDivisor();
  const extraPerPay = shortfall / divisor;
  const currentPay = parseNum(netPayEl.value);
  const requiredPay = currentPay + extraPerPay;

  let label = "";
  if (freq === "weekly") label = "per week";
  else if (freq === "biweekly") label = "per paycheck (bi-weekly)";
  else label = "per month";

  recommendationPanelEl.innerHTML = `
    <strong>To afford these bills, you need to make at least ${fmt(requiredPay)} ${label} (net).</strong><br>
    That's <strong>${fmt(extraPerPay)}</strong> more than your current net pay ${label}.
  `;
  recommendationPanelEl.hidden = false;
}

function initWelcome() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  if (name) {
    el("welcomeLine").textContent = `Welcome, ${name}!`;
  }
}

payFrequencyEl.addEventListener("change", () => {
  updatePayLabels();
  calculate();
});
netPayEl.addEventListener("input", calculate);
addOtherExpenseBtn.addEventListener("click", addOtherExpense);
clearAllBtn.addEventListener("click", clearAllAmounts);
toggleRecommendationBtn.addEventListener("click", showRecommendation);

initWelcome();
renderBillChips();
renderSelectedBills();
calculate();