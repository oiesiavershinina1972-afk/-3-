const STORAGE_KEY = "ultra_budget";
const PASSWORD_KEY = "ultra_budget_password";

const db = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
let chart;

const loginView = document.getElementById("login");
const appView = document.getElementById("app");
const passwordInput = document.getElementById("password");
const monthInput = document.getElementById("month");
const incomeInput = document.getElementById("income");
const savingsInput = document.getElementById("savings");
const debtsInput = document.getElementById("debts");
const expensesContainer = document.getElementById("expenses");
const resultEl = document.getElementById("result");
const adviceEl = document.getElementById("advice");
const loginBtn = document.getElementById("login-btn");
const addExpenseBtn = document.getElementById("add-expense-btn");

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function getData() {
  const month = monthInput.value;
  if (!db[month]) {
    db[month] = {
      income: 0,
      savings: 0,
      debts: 0,
      expenses: []
    };
  }
  return db[month];
}

function login() {
  const pass = passwordInput.value.trim();
  if (!pass) {
    alert("Введите пароль.");
    return;
  }

  const stored = localStorage.getItem(PASSWORD_KEY);
  if (!stored) {
    localStorage.setItem(PASSWORD_KEY, pass);
  }

  if (pass === localStorage.getItem(PASSWORD_KEY)) {
    loginView.classList.add("hidden");
    appView.classList.remove("hidden");
    initTracker();
    return;
  }

  alert("Неверный пароль.");
}

function addExpense() {
  getData().expenses.push({ name: "Категория", value: 0 });
  save();
  render();
}

function deleteExpense(index) {
  getData().expenses.splice(index, 1);
  save();
  render();
}

function updateExpenseName(index, value) {
  getData().expenses[index].name = value.trim() || "Категория";
  save();
  calc();
}

function updateExpenseValue(index, value) {
  getData().expenses[index].value = Number(value) || 0;
  save();
  calc();
}

function render() {
  const data = getData();
  incomeInput.value = data.income;
  savingsInput.value = data.savings;
  debtsInput.value = data.debts;

  expensesContainer.innerHTML = "";
  data.expenses.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "expense";
    row.innerHTML = `
      <input data-type="name" data-index="${index}" value="${item.name}">
      <input data-type="value" data-index="${index}" type="number" value="${item.value}">
      <button type="button" data-type="delete" data-index="${index}">x</button>
    `;
    expensesContainer.appendChild(row);
  });

  calc();
}

function drawChart(expenses) {
  const chartCanvas = document.getElementById("chart");
  if (chart) {
    chart.destroy();
  }

  const labels = expenses.length ? expenses.map((item) => item.name) : ["Нет расходов"];
  const values = expenses.length ? expenses.map((item) => item.value) : [1];

  chart = new Chart(chartCanvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: values }]
    }
  });
}

function getAdviceText(income, expensesTotal, savings) {
  if (income === 0 && expensesTotal === 0) {
    return { text: "Добавьте данные за месяц, чтобы получить рекомендации.", isWarning: false };
  }

  if (expensesTotal > income) {
    return { text: "Вы тратите больше, чем зарабатываете. Сократите 1-2 самые крупные категории.", isWarning: true };
  }

  if (savings < income * 0.1) {
    return { text: "Рекомендуется откладывать минимум 10% от дохода.", isWarning: true };
  }

  return { text: "Отличный баланс бюджета. Продолжайте в том же темпе.", isWarning: false };
}

function calc() {
  const data = getData();
  const expensesTotal = data.expenses.reduce((sum, item) => sum + item.value, 0);
  const balance = data.income - expensesTotal - data.debts + data.savings;

  resultEl.textContent = `Баланс: ${balance.toLocaleString("ru-RU")} ₽`;
  const advice = getAdviceText(data.income, expensesTotal, data.savings);
  adviceEl.textContent = advice.text;
  adviceEl.className = advice.isWarning ? "advice status-warn" : "advice status-ok";

  drawChart(data.expenses);
}

function initTracker() {
  monthInput.value = new Date().toISOString().slice(0, 7);
  render();
}

loginBtn.addEventListener("click", login);
addExpenseBtn.addEventListener("click", addExpense);

expensesContainer.addEventListener("input", (event) => {
  const target = event.target;
  const index = Number(target.dataset.index);
  if (target.dataset.type === "name") {
    updateExpenseName(index, target.value);
  }
  if (target.dataset.type === "value") {
    updateExpenseValue(index, target.value);
  }
});

expensesContainer.addEventListener("click", (event) => {
  const target = event.target;
  if (target.dataset.type !== "delete") {
    return;
  }
  deleteExpense(Number(target.dataset.index));
});

monthInput.addEventListener("change", render);
incomeInput.addEventListener("input", (event) => {
  getData().income = Number(event.target.value) || 0;
  save();
  calc();
});
savingsInput.addEventListener("input", (event) => {
  getData().savings = Number(event.target.value) || 0;
  save();
  calc();
});
debtsInput.addEventListener("input", (event) => {
  getData().debts = Number(event.target.value) || 0;
  save();
  calc();
});
