
/* =====================================
   PERSONAL BUDGET TRACKER
===================================== */

// Connect JavaScript to the HTML elements
const incomeDisplay = document.getElementById("income");
const expensesDisplay = document.getElementById("expenses");
const balanceDisplay = document.getElementById("balance");

const dateInput = document.getElementById("date");
const transactionForm = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");

const transactionList = document.getElementById("transaction-list");
const transactionSearch = document.getElementById("transaction-search");
const transactionTypeFilter = document.getElementById("transaction-type-filter");

const spendingBreakdownList = document.getElementById("spending-breakdown-list");
const spendingChartCanvas = document.getElementById("spending-chart");
const monthFilter = document.getElementById("month-filter");

const dashboardIncome = document.getElementById("dashboard-income");
const dashboardExpenses = document.getElementById("dashboard-expenses");
const dashboardSavingsRate = document.getElementById("dashboard-savings-rate");
const spendingAlert = document.getElementById("spending-alert");
const monthlyComparisonCanvas = document.getElementById("monthly-comparison-chart");

const savingsGoalForm = document.getElementById("savings-goal-form");
const savingsTargetInput = document.getElementById("savings-target");
const amountSavedInput = document.getElementById("amount-saved");
const savingsPercentage = document.getElementById("savings-percentage");
const savingsProgressBar = document.getElementById("savings-progress-bar");
const savingsProgressFill = document.getElementById("savings-progress-fill");
const savedTotalDisplay = document.getElementById("saved-total");
const savingsRemainingDisplay = document.getElementById("savings-remaining");
const savingsMessage = document.getElementById("savings-message");

const futureSavingsForm = document.getElementById("future-savings-form");
const futureTargetInput = document.getElementById("future-target");
const futureSavedInput = document.getElementById("future-saved");
const savingsDeadlineInput = document.getElementById("savings-deadline");
const futureSavingsResult = document.getElementById("future-savings-result");

const budgetLimitForm = document.getElementById("budget-limit-form");
const budgetLimitInput = document.getElementById("budget-limit");
const budgetSpentDisplay = document.getElementById("budget-spent");
const budgetProgressBar = document.getElementById("budget-progress-bar");
const budgetProgressFill = document.getElementById("budget-progress-fill");
const budgetPercentageDisplay = document.getElementById("budget-percentage");
const budgetRemainingDisplay = document.getElementById("budget-remaining");
const budgetMessage = document.getElementById("budget-message");

const exportCsvButton = document.getElementById("export-csv");

// Register the Chart.js labels plugin
Chart.register(ChartDataLabels);

// Transaction categories
const incomeCategories = ["Salary", "Freelance", "Other"];

const expenseCategories = [
    "Groceries",
    "Transport",
    "Rent",
    "Utilities",
    "Entertainment",
    "Savings",
    "Other"
];

// Transaction data
let totalIncome = 0;
let totalExpenses = 0;
let transactions = [];
let editingIndex = null;
let spendingChart = null;
let monthlyComparisonChart = null;

// Load saved settings
let savingsTarget = Number(localStorage.getItem("savingsTarget")) || 2000;
let amountSaved = Number(localStorage.getItem("amountSaved")) || 0;
let monthlyBudgetLimit =
    Number(localStorage.getItem("monthlyBudgetLimit")) || 0;

savingsTargetInput.value = savingsTarget;
amountSavedInput.value = amountSaved;
budgetLimitInput.value = monthlyBudgetLimit || "";

// Format amounts as South African Rand
function formatRand(amount) {
    return "R" + Number(amount).toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/* =====================================
   TRANSACTION CATEGORIES
===================================== */

function updateCategories() {
    const categories =
        typeInput.value === "income"
            ? incomeCategories
            : expenseCategories;

    categoryInput.innerHTML = "";

    categories.forEach(function(category) {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryInput.appendChild(option);
    });
}

typeInput.addEventListener("change", updateCategories);
updateCategories();

/* =====================================
   FILTER TRANSACTIONS BY MONTH
===================================== */

function getFilteredTransactions() {
    const selectedMonth = monthFilter.value;

    if (!selectedMonth) {
        return transactions;
    }

    return transactions.filter(function(transaction) {
        return transaction.date &&
            transaction.date.startsWith(selectedMonth);
    });
}

/* =====================================
   BALANCE AND STORAGE
===================================== */

function updateBalance() {
    const balance = totalIncome - totalExpenses;

    incomeDisplay.textContent = formatRand(totalIncome);
    expensesDisplay.textContent = formatRand(totalExpenses);
    balanceDisplay.textContent = formatRand(balance);
}

function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

/* =====================================
   ADD AND EDIT TRANSACTIONS
===================================== */

transactionForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than zero.");
        return;
    }

    if (!date) {
        alert("Please select a transaction date.");
        return;
    }

    const transaction = {
        description: description,
        amount: amount,
        type: type,
        category: category,
        date: date
    };

    if (editingIndex === null) {
        transactions.push(transaction);
    } else {
        transactions[editingIndex] = transaction;
        editingIndex = null;

        transactionForm.querySelector("button[type='submit']").textContent =
            "Add Transaction";
    }

    saveTransactions();
    transactionForm.reset();
    updateCategories();
    loadTransactions();
});

/* =====================================
   DISPLAY TRANSACTIONS
===================================== */

function renderTransactions() {
    const filteredTransactions = getFilteredTransactions();
    const searchTerm = transactionSearch.value.trim().toLowerCase();
    const selectedType = transactionTypeFilter.value;

    const visibleTransactions = filteredTransactions.filter(
        function(transaction) {
            const description = transaction.description || "";
            const category = transaction.category || "Other";

            const matchesSearch =
                description.toLowerCase().includes(searchTerm) ||
                category.toLowerCase().includes(searchTerm);

            const matchesType =
                selectedType === "all" ||
                transaction.type === selectedType;

            return matchesSearch && matchesType;
        }
    );

    transactionList.innerHTML = "";

    if (visibleTransactions.length === 0) {
        const emptyMessage = document.createElement("li");

        emptyMessage.textContent =
            searchTerm || selectedType !== "all"
                ? "No transactions match your search or filter."
                : "No transactions yet.";

        transactionList.appendChild(emptyMessage);
        return;
    }

    visibleTransactions.forEach(function(transaction) {
        const index = transactions.indexOf(transaction);
        const listItem = document.createElement("li");
        listItem.className = "transaction-item";

        const details = document.createElement("span");

        details.textContent =
            (transaction.category || "Other") +
            (transaction.description
                ? " (" + transaction.description + ")"
                : "") +
            " - " +
            (transaction.type === "income" ? "Income: " : "Expense: ") +
            formatRand(transaction.amount);

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editingIndex = index;

            descriptionInput.value = transaction.description || "";
            amountInput.value = transaction.amount;
            typeInput.value = transaction.type;
            dateInput.value = transaction.date || "";

            updateCategories();
            categoryInput.value = transaction.category || "Other";

            transactionForm.querySelector("button[type='submit']").textContent =
                "Save Changes";

            descriptionInput.focus();
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            transactions.splice(index, 1);

            if (editingIndex === index) {
                editingIndex = null;
                transactionForm.reset();
                updateCategories();

                transactionForm.querySelector("button[type='submit']")
                    .textContent = "Add Transaction";
            } else if (editingIndex !== null && index < editingIndex) {
                editingIndex--;
            }

            saveTransactions();
            loadTransactions();
        });

        listItem.appendChild(details);
        listItem.appendChild(editButton);
        listItem.appendChild(deleteButton);
        transactionList.appendChild(listItem);
    });
}

/* =====================================
   SPENDING BREAKDOWN AND DOUGHNUT CHART
===================================== */

function renderSpendingBreakdown() {
    const spendingByCategory = {};

    getFilteredTransactions().forEach(function(transaction) {
        if (
            transaction.type === "expense" &&
            Number.isFinite(transaction.amount) &&
            transaction.amount > 0
        ) {
            const category = transaction.category || "Other";

            spendingByCategory[category] =
                (spendingByCategory[category] || 0) + transaction.amount;
        }
    });

    spendingBreakdownList.innerHTML = "";

    const categories = Object.keys(spendingByCategory);

    if (categories.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = "No expenses yet.";
        spendingBreakdownList.appendChild(emptyMessage);

        if (spendingChart !== null) {
            spendingChart.destroy();
            spendingChart = null;
        }

        return;
    }

    categories.forEach(function(category) {
        const listItem = document.createElement("li");
        listItem.textContent =
            category + ": " + formatRand(spendingByCategory[category]);

        spendingBreakdownList.appendChild(listItem);
    });

    if (spendingChart !== null) {
        spendingChart.destroy();
    }

    spendingChart = new Chart(spendingChartCanvas, {
        type: "doughnut",
        data: {
            labels: categories,
            datasets: [{
                data: categories.map(function(category) {
                    return spendingByCategory[category];
                })
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom"
                },
                datalabels: {
                    color: "#FFFFFF",
                    font: {
                        weight: "bold",
                        size: 13
                    },
                    formatter: function(value, context) {
                        const amounts = context.chart.data.datasets[0].data;
                        const total = amounts.reduce(function(sum, amount) {
                            return sum + amount;
                        }, 0);

                        return total > 0
                            ? ((value / total) * 100).toFixed(1) + "%"
                            : "";
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ": " +
                                formatRand(context.parsed);
                        }
                    }
                }
            }
        }
    });
}

/* =====================================
   MONTHLY FINANCIAL DASHBOARD
===================================== */

function updateFinancialDashboard() {
    dashboardIncome.textContent = formatRand(totalIncome);
    dashboardExpenses.textContent = formatRand(totalExpenses);

    const savingsRate = totalIncome > 0
        ? ((totalIncome - totalExpenses) / totalIncome) * 100
        : 0;

    dashboardSavingsRate.textContent = savingsRate.toFixed(1) + "%";

    const filteredTransactions = getFilteredTransactions();

    if (filteredTransactions.length === 0) {
        spendingAlert.textContent =
            "Add transactions to see your financial summary.";
    } else if (totalExpenses > totalIncome) {
        spendingAlert.textContent =
            "⚠️ Spending Alert: Your expenses exceed your income by " +
            formatRand(totalExpenses - totalIncome) + ".";
    } else if (totalExpenses === totalIncome) {
        spendingAlert.textContent =
            "Your income and expenses are equal. You have no remaining balance.";
    } else {
        spendingAlert.textContent =
            "Great! You have " +
            formatRand(totalIncome - totalExpenses) +
            " remaining after expenses.";
    }

    if (monthlyComparisonChart !== null) {
        monthlyComparisonChart.destroy();
    }

    monthlyComparisonChart = new Chart(monthlyComparisonCanvas, {
        type: "bar",
        data: {
            labels: ["Income", "Expenses"],
            datasets: [{
                label: "Amount (R)",
                data: [totalIncome, totalExpenses],
                backgroundColor: ["#34D399", "#F87171"],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    color: "#FFFFFF",
                    anchor: "end",
                    align: "end",
                    formatter: function(value) {
                        return formatRand(value);
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grace: "15%",
                    ticks: {
                        color: "#CBD5E1"
                    },
                    grid: {
                        color: "rgba(203, 213, 225, 0.1)"
                    }
                },
                x: {
                    ticks: {
                        color: "#CBD5E1"
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/* =====================================
   MONTHLY SPENDING BUDGET
===================================== */

function updateMonthlyBudget() {
    const expenses = totalExpenses;

    budgetSpentDisplay.textContent = formatRand(expenses);

    if (monthlyBudgetLimit <= 0) {
        budgetProgressFill.style.width = "0%";
        budgetProgressFill.style.backgroundColor = "#34D399";
        budgetProgressBar.setAttribute("aria-valuenow", "0");
        budgetPercentageDisplay.textContent = "0% used";
        budgetRemainingDisplay.textContent = "Set a budget limit";
        budgetMessage.textContent =
            "Set a budget to start tracking your monthly spending.";
        return;
    }

    const percentage = (expenses / monthlyBudgetLimit) * 100;
    const displayedPercentage = Math.min(percentage, 100);
    const remaining = monthlyBudgetLimit - expenses;

    budgetProgressFill.style.width = displayedPercentage + "%";
    budgetProgressBar.setAttribute(
        "aria-valuenow",
        displayedPercentage.toFixed(1)
    );

    budgetPercentageDisplay.textContent =
        percentage.toFixed(1) + "% used";

    budgetRemainingDisplay.textContent =
        remaining >= 0
            ? "Remaining: " + formatRand(remaining)
            : "Over budget by " + formatRand(Math.abs(remaining));

    if (percentage >= 100) {
        budgetProgressFill.style.backgroundColor = "#F87171";
        budgetMessage.textContent =
            "⚠️ Budget exceeded! You are over your monthly limit by " +
            formatRand(expenses - monthlyBudgetLimit) + ".";
    } else if (percentage >= 80) {
        budgetProgressFill.style.backgroundColor = "#F59E0B";
        budgetMessage.textContent =
            "⚠️ Careful! You've used " + percentage.toFixed(1) +
            "% of your monthly budget.";
    } else {
        budgetProgressFill.style.backgroundColor = "#34D399";
        budgetMessage.textContent =
            "You're within budget! You have " +
            formatRand(remaining) + " available to spend.";
    }
}

budgetLimitForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const newLimit = Number(budgetLimitInput.value);

    if (!Number.isFinite(newLimit) || newLimit <= 0) {
        alert("Please enter a budget limit greater than zero.");
        return;
    }

    monthlyBudgetLimit = newLimit;
    localStorage.setItem("monthlyBudgetLimit", monthlyBudgetLimit);

    updateMonthlyBudget();
});

/* =====================================
   MONTHLY SAVINGS GOAL
===================================== */

function updateSavingsProgress() {
    const percentage = (amountSaved / savingsTarget) * 100;
    const displayedPercentage = Math.min(percentage, 100);
    const remaining = Math.max(savingsTarget - amountSaved, 0);

    savingsPercentage.textContent = percentage.toFixed(1) + "%";
    savingsProgressFill.style.width = displayedPercentage + "%";

    savingsProgressBar.setAttribute(
        "aria-valuenow",
        displayedPercentage.toFixed(1)
    );

    savedTotalDisplay.textContent = formatRand(amountSaved);
    savingsRemainingDisplay.textContent = formatRand(remaining);

    if (amountSaved >= savingsTarget) {
        savingsMessage.textContent =
            "Amazing! You've reached your savings goal!";
    } else if (amountSaved > 0) {
        savingsMessage.textContent =
            "You're making progress! Keep going, chomi!";
    } else {
        savingsMessage.textContent = "Let's start saving!";
    }
}

savingsGoalForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const newTarget = Number(savingsTargetInput.value);
    const newAmountSaved = Number(amountSavedInput.value);

    if (
        !Number.isFinite(newTarget) ||
        !Number.isFinite(newAmountSaved) ||
        newTarget <= 0 ||
        newAmountSaved < 0
    ) {
        alert(
            "Enter a target greater than zero and a saved amount of zero or more."
        );
        return;
    }

    savingsTarget = newTarget;
    amountSaved = newAmountSaved;

    localStorage.setItem("savingsTarget", savingsTarget);
    localStorage.setItem("amountSaved", amountSaved);

    updateSavingsProgress();
});

/* =====================================
   FUTURE SAVINGS CALCULATOR
===================================== */

futureSavingsForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const target = Number(futureTargetInput.value);
    const alreadySaved = Number(futureSavedInput.value);
    const deadlineValue = savingsDeadlineInput.value;

    if (
        !Number.isFinite(target) ||
        !Number.isFinite(alreadySaved) ||
        target <= 0 ||
        alreadySaved < 0 ||
        !deadlineValue
    ) {
        futureSavingsResult.textContent =
            "Please enter a valid target, saved amount and target date.";
        return;
    }

    const remaining = Math.max(target - alreadySaved, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(deadlineValue + "T00:00:00");

    if (Number.isNaN(deadline.getTime()) || deadline < today) {
        futureSavingsResult.textContent =
            "Your target date has passed or is invalid. Please choose a future date.";
        return;
    }

    const todayMonth = today.getFullYear() * 12 + today.getMonth();
    const deadlineMonth = deadline.getFullYear() * 12 + deadline.getMonth();
    const monthsAvailable = deadlineMonth - todayMonth + 1;

    if (remaining === 0) {
        futureSavingsResult.innerHTML = `
            <h3>🎉 Savings Goal Achieved!</h3>
            <p>You've already reached your target of
            <strong>${formatRand(target)}</strong>.</p>
        `;
        return;
    }

    const monthlySavings = remaining / monthsAvailable;

    futureSavingsResult.innerHTML = `
        <h3>Your Savings Plan</h3>
        <div class="future-result-grid">
            <div class="future-result-card">
                <span>Savings Target</span>
                <strong>${formatRand(target)}</strong>
            </div>
            <div class="future-result-card">
                <span>Already Saved</span>
                <strong>${formatRand(alreadySaved)}</strong>
            </div>
            <div class="future-result-card">
                <span>Still Needed</span>
                <strong>${formatRand(remaining)}</strong>
            </div>
            <div class="future-result-card highlight">
                <span>Save Each Month</span>
                <strong>${formatRand(monthlySavings)}</strong>
            </div>
        </div>
        <p class="future-result-note">
            You have ${monthsAvailable} calendar months available,
            including this month, to reach your target.
        </p>
    `;
});

/* =====================================
   LOAD TRANSACTIONS AND UPDATE TOTALS
===================================== */

function loadTransactions() {
    const savedTransactions = localStorage.getItem("transactions");

    if (savedTransactions !== null) {
        try {
            const parsedTransactions = JSON.parse(savedTransactions);

            if (Array.isArray(parsedTransactions)) {
                transactions = parsedTransactions;
            }
        } catch (error) {
            console.error("Could not load saved transactions:", error);
        }
    }

    totalIncome = 0;
    totalExpenses = 0;

    getFilteredTransactions().forEach(function(transaction) {
        const amount = Number(transaction.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return;
        }

        if (transaction.type === "income") {
            totalIncome += amount;
        } else if (transaction.type === "expense") {
            totalExpenses += amount;
        }
    });

    updateBalance();
    renderTransactions();
    renderSpendingBreakdown();
    updateFinancialDashboard();
    updateMonthlyBudget();
}

/* =====================================
   SEARCH, FILTER AND MONTH CHANGE
===================================== */

monthFilter.addEventListener("change", loadTransactions);
transactionSearch.addEventListener("input", renderTransactions);
transactionTypeFilter.addEventListener("change", renderTransactions);

/* =====================================
   EXPORT TRANSACTIONS TO CSV
===================================== */

exportCsvButton.addEventListener("click", function() {
    const filteredTransactions = getFilteredTransactions();

    if (filteredTransactions.length === 0) {
        alert("There are no transactions to export for the selected month.");
        return;
    }

    function escapeCsv(value) {
        let text = String(value ?? "");

        // Prevent spreadsheet formula injection
        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return '"' + text.replace(/"/g, '""') + '"';
    }

    const headers = [
        "Date",
        "Type",
        "Category",
        "Description",
        "Amount (R)"
    ];

    const rows = filteredTransactions.map(function(transaction) {
        return [
            transaction.date || "",
            transaction.type || "",
            transaction.category || "Other",
            transaction.description || "",
            Number(transaction.amount).toFixed(2)
        ];
    });

    const csvContent = [
        headers.map(escapeCsv).join(","),
        ...rows.map(function(row) {
            return row.map(escapeCsv).join(",");
        })
    ].join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
        "budget-transactions-" +
        (monthFilter.value || "all-transactions") +
        ".csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Delay revoking the URL slightly to support browser downloads
    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);
});

/* =====================================
   INITIALISE THE TRACKER
   KEEP THIS AT THE VERY BOTTOM
===================================== */

updateSavingsProgress();
loadTransactions();
