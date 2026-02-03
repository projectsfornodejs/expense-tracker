
const { Command } = require("commander");
const fs = require('fs');
const path = require('path');

const program = new Command();
const expensesFilePath = path.join(__dirname, 'expenses.json');

function loadExpenses() {
    if (!fs.existsSync(expensesFilePath)) {
        fs.writeFileSync(expensesFilePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(expensesFilePath, 'utf-8');
    return JSON.parse(data);
}

function saveExpenses(expenses) {
    fs.writeFileSync(expensesFilePath, JSON.stringify(expenses, null, 2));
}

program.name("Expense Tracker CLI").description("A simple CLI for tracking expenses").version("1.0.0");

program.command("add").description("Add a new expense")
    .requiredOption("--description <description>", "Description of the expense")
    .requiredOption("--amount <amount>", "Amount of the expense")
    .action((options) => {
        if(!options.description.trim()) {
            console.error("Description cannot be empty");
            return;
        }
        if (isNaN(options.amount) || Number(options.amount) <= 0) {
            console.error("Amount must be a positive number");
            return;
        }
        const expenses = loadExpenses();
        // Find the max id in the current expenses, default to 0 if none
        const maxId = expenses.length > 0 ? Math.max(...expenses.map(e => typeof e.id === 'number' ? e.id : 0)) : 0;
        const expense = {
            id: maxId + 1,
            description: options.description,
            amount: Number(options.amount),
            date: new Date().toISOString(),
        };
        expenses.push(expense);
        saveExpenses(expenses);
        console.log(`Added expense: ${expense.description}, Amount: ${expense.amount}`);
    });

program
    .command("list")
    .description("List all expenses")
    .action(() => {
        const expenses = loadExpenses();

        if (expenses.length === 0) {
            console.log("No expenses found.");
            return;
        }

        console.log("ID | Description | Amount | Date");
        console.log("-------------------------------------");
        expenses.forEach((e) => {
            console.log(
                `${e.id} | ${e.description} | ${e.amount} | ${e.date.slice(0, 10)}`
            );
        });
    });

program
    .command("summary")
    .description("Show total expenses")
    .option("--month <month>", "Month number (1-12)")
    .action((options) => {
        const expenses = loadExpenses();
        let filtered = expenses;

        if (options.month) {
            const month = Number(options.month) - 1;
            filtered = expenses.filter(
                (e) => new Date(e.date).getMonth() === month
            );
        }

        const total = filtered.reduce((sum, e) => sum + e.amount, 0);
        console.log("Total expenses:", total);
    });

program
    .command("delete")
    .description("Delete an expense by ID")
    .requiredOption("--id <id>", "Expense ID")
    .action((options) => {
        let expenses = loadExpenses();
        const initialLength = expenses.length;

        expenses = expenses.filter((e) => e.id !== Number(options.id));
        saveExpenses(expenses);

        if (expenses.length === initialLength) {
            console.log("Expense not found");
        } else {
            console.log("Expense deleted");
        }
    });

program.parse();