-- ============================================================
-- PERSONAL FINANCE MANAGEMENT SYSTEM
-- schema.sql — Full schema including all tables used by the GUI
-- ============================================================
-- HOW TO USE:
--   Import this file once in MySQL Workbench or via CLI:
--     mysql -u root -p < schema.sql
-- ============================================================

DROP DATABASE IF EXISTS PersonalFinance;
CREATE DATABASE PersonalFinance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE PersonalFinance;

-- ============================================================
-- TABLES
-- ============================================================

-- Users: core authentication table.
-- Fields editable via GUI: UserName, PhoneNumber.
-- Email is immutable (used as login key).
CREATE TABLE Users (
    UserID       INT AUTO_INCREMENT PRIMARY KEY,
    UserName     VARCHAR(100)  NOT NULL,
    Email        VARCHAR(100)  UNIQUE NOT NULL,
    PhoneNumber  VARCHAR(20) UNIQUE,
    PasswordHash VARCHAR(255)  NOT NULL   -- bcrypt hash, never stored plain-text
);

-- ExpenseCategories: master list of spending categories.
-- Editable via Settings > Categories (future feature).
CREATE TABLE ExpenseCategories (
    CategoryID   INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100) UNIQUE NOT NULL
);

-- BankAccounts: one row per account per user.
-- AccountType controls which extra field (BankName / Provider) is shown in the GUI.
-- Supported AccountType values:
--   'Cash' | 'Bank Account' | 'Credit Card' | 'Investment' | 'E-Wallet' | 'Other'
CREATE TABLE BankAccounts (
    AccountID   INT AUTO_INCREMENT PRIMARY KEY,
    UserID      INT          NOT NULL,
    AccountName VARCHAR(100) NOT NULL,                    -- user-defined name, e.g. "Lương VCB"
    AccountType VARCHAR(50)  NOT NULL DEFAULT 'Bank Account',
    BankName    VARCHAR(100),                             -- filled when type = Bank Account / Credit Card
    Provider    VARCHAR(100),                             -- filled when type = E-Wallet (MoMo, ZaloPay…)
    Balance     DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Income: every income transaction belongs to a user.
-- AccountID links to BankAccounts (optional — NULL means "all accounts").
CREATE TABLE Income (
    IncomeID    INT AUTO_INCREMENT PRIMARY KEY,
    UserID      INT           NOT NULL,
    AccountID   INT           NOT NULL,                            -- which account was credited
    Amount      DECIMAL(15,2) NOT NULL,
    IncomeDate  DATE          NOT NULL,
    Description VARCHAR(255),
    FOREIGN KEY (UserID)    REFERENCES Users(UserID)        ON DELETE CASCADE,
    FOREIGN KEY (AccountID) REFERENCES BankAccounts(AccountID) ON DELETE RESTRICT
);

-- Expenses: every expense transaction.
-- AccountID links to BankAccounts (optional).
CREATE TABLE Expenses (
    ExpenseID   INT AUTO_INCREMENT PRIMARY KEY,
    UserID      INT           NOT NULL,
    CategoryID  INT           NOT NULL,
    AccountID   INT           NOT NULL,                         -- which account was debited 
    Amount      DECIMAL(15,2) NOT NULL,
    ExpenseDate DATE          NOT NULL,
    Description VARCHAR(255),
    FOREIGN KEY (UserID)     REFERENCES Users(UserID)          ON DELETE CASCADE,
    FOREIGN KEY (CategoryID) REFERENCES ExpenseCategories(CategoryID),
    FOREIGN KEY (AccountID)  REFERENCES BankAccounts(AccountID) ON DELETE RESTRICT
);

-- Budgets: per-user, per-category monthly spending limit.
-- Created/updated via Budget > Edit Budgets in the GUI.
CREATE TABLE Budgets (
    BudgetID    INT AUTO_INCREMENT PRIMARY KEY,
    UserID      INT           NOT NULL,
    CategoryID  INT           NOT NULL,
    LimitAmount DECIMAL(15,2) NOT NULL DEFAULT 0,
    UNIQUE KEY uq_user_cat (UserID, CategoryID),
    FOREIGN KEY (UserID)     REFERENCES Users(UserID)             ON DELETE CASCADE,
    FOREIGN KEY (CategoryID) REFERENCES ExpenseCategories(CategoryID)
);

-- Goals: savings goals with a target amount, saved amount, and optional deadline.
-- Icon stores the image path under /public/icons/goals/ (e.g. '/icons/goals/home.svg').
CREATE TABLE Goals (
    GoalID       INT AUTO_INCREMENT PRIMARY KEY,
    UserID       INT           NOT NULL,
    GoalName     VARCHAR(100)  NOT NULL,
    Icon         VARCHAR(100)  DEFAULT '/icons/goals/target.svg',
    TargetAmount DECIMAL(15,2) NOT NULL,
    SavedAmount  DECIMAL(15,2) NOT NULL DEFAULT 0,
    TargetDate   DATE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES (improve query performance for common filters)
-- ============================================================

CREATE INDEX idx_expenses_user     ON Expenses(UserID);
CREATE INDEX idx_expenses_date     ON Expenses(ExpenseDate);
CREATE INDEX idx_expenses_category ON Expenses(CategoryID);
CREATE INDEX idx_expenses_account  ON Expenses(AccountID);

CREATE INDEX idx_income_user       ON Income(UserID);
CREATE INDEX idx_income_date       ON Income(IncomeDate);
CREATE INDEX idx_income_account    ON Income(AccountID);

CREATE INDEX idx_accounts_user     ON BankAccounts(UserID);
CREATE INDEX idx_goals_user        ON Goals(UserID);
CREATE INDEX idx_budgets_user      ON Budgets(UserID);

-- ============================================================
-- VIEWS
-- ============================================================

-- Monthly expense summary — used by Dashboard chart and Analytics
CREATE VIEW MonthlyExpenseSummary AS
SELECT UserID,
       YEAR(ExpenseDate)  AS Year,
       MONTH(ExpenseDate) AS Month,
       SUM(Amount)        AS TotalExpense
FROM Expenses
GROUP BY UserID, Year, Month;

-- Monthly income summary — used by Dashboard chart and Analytics
CREATE VIEW MonthlyIncomeSummary AS
SELECT UserID,
       YEAR(IncomeDate)  AS Year,
       MONTH(IncomeDate) AS Month,
       SUM(Amount)       AS TotalIncome
FROM Income
GROUP BY UserID, Year, Month;

-- All-time category spending — used by Expense Breakdown pie and Budget page
CREATE VIEW CategorySpendingSummary AS
SELECT e.UserID,
       c.CategoryName,
       SUM(e.Amount) AS TotalSpent
FROM Expenses e
JOIN ExpenseCategories c ON e.CategoryID = c.CategoryID
GROUP BY e.UserID, c.CategoryName;

-- Monthly category breakdown — used by Analytics page trend chart
CREATE VIEW MonthlyCategoryExpense AS
SELECT e.UserID,
       YEAR(e.ExpenseDate)  AS Year,
       MONTH(e.ExpenseDate) AS Month,
       c.CategoryName,
       SUM(e.Amount)        AS TotalSpent
FROM Expenses e
JOIN ExpenseCategories c ON e.CategoryID = c.CategoryID
GROUP BY e.UserID, Year, Month, c.CategoryName;

-- Account-scoped monthly expense — used by Dashboard chart "filter by account"
CREATE VIEW MonthlyExpenseByAccount AS
SELECT UserID,
       AccountID,
       YEAR(ExpenseDate)  AS Year,
       MONTH(ExpenseDate) AS Month,
       SUM(Amount)        AS TotalExpense
FROM Expenses
WHERE AccountID IS NOT NULL
GROUP BY UserID, AccountID, Year, Month;

-- Account-scoped monthly income — used by Dashboard chart "filter by account"
CREATE VIEW MonthlyIncomeByAccount AS
SELECT UserID,
       AccountID,
       YEAR(IncomeDate)  AS Year,
       MONTH(IncomeDate) AS Month,
       SUM(Amount)       AS TotalIncome
FROM Income
WHERE AccountID IS NOT NULL
GROUP BY UserID, AccountID, Year, Month;

-- ============================================================
-- TRIGGERS (auto-update BankAccounts.Balance on insert/delete)
-- ============================================================

DELIMITER $$

-- Add to balance when income is recorded
CREATE TRIGGER trg_after_income_insert
AFTER INSERT ON Income
FOR EACH ROW
BEGIN
    IF NEW.AccountID IS NOT NULL THEN
        UPDATE BankAccounts
        SET Balance = Balance + NEW.Amount
        WHERE AccountID = NEW.AccountID AND UserID = NEW.UserID;
    END IF;
END$$

-- Subtract from balance when expense is recorded
CREATE TRIGGER trg_after_expense_insert
AFTER INSERT ON Expenses
FOR EACH ROW
BEGIN
    IF NEW.AccountID IS NOT NULL THEN
        UPDATE BankAccounts
        SET Balance = Balance - NEW.Amount
        WHERE AccountID = NEW.AccountID AND UserID = NEW.UserID;
    END IF;
END$$

-- Reverse balance when income is deleted
CREATE TRIGGER trg_after_income_delete
AFTER DELETE ON Income
FOR EACH ROW
BEGIN
    IF OLD.AccountID IS NOT NULL THEN
        UPDATE BankAccounts
        SET Balance = Balance - OLD.Amount
        WHERE AccountID = OLD.AccountID AND UserID = OLD.UserID;
    END IF;
END$$

-- Reverse balance when expense is deleted
CREATE TRIGGER trg_after_expense_delete
AFTER DELETE ON Expenses
FOR EACH ROW
BEGIN
    IF OLD.AccountID IS NOT NULL THEN
        UPDATE BankAccounts
        SET Balance = Balance + OLD.Amount
        WHERE AccountID = OLD.AccountID AND UserID = OLD.UserID;
    END IF;
END$$

-- ============================================================
-- USER DEFINED FUNCTIONS (UDF)
-- ============================================================

-- Total all-time expense for a user
CREATE FUNCTION GetTotalExpense(p_UserID INT)
RETURNS DECIMAL(15,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total DECIMAL(15,2);
    SELECT SUM(Amount) INTO total FROM Expenses WHERE UserID = p_UserID;
    RETURN IFNULL(total, 0);
END$$

-- Total all-time income for a user
CREATE FUNCTION GetTotalIncome(p_UserID INT)
RETURNS DECIMAL(15,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total DECIMAL(15,2);
    SELECT SUM(Amount) INTO total FROM Income WHERE UserID = p_UserID;
    RETURN IFNULL(total, 0);
END$$

-- Returns 'Saving' if income > expense, else 'Overspending'
CREATE FUNCTION GetBudgetStatus(p_UserID INT)
RETURNS VARCHAR(50)
DETERMINISTIC
READS SQL DATA
BEGIN
    IF GetTotalIncome(p_UserID) > GetTotalExpense(p_UserID) THEN
        RETURN 'Saving';
    ELSE
        RETURN 'Overspending';
    END IF;
END$$

-- ============================================================
-- USER DEFINED FUNCTIONS (additional helpers)
-- ============================================================

-- Check if deducting p_Amount from p_AccountID would make balance negative.
-- Returns 1 (true) = would go negative, 0 (false) = safe to proceed.
-- Used by sp_AddExpense before inserting.
CREATE FUNCTION fn_WouldGoNegative(p_AccountID INT, p_Amount DECIMAL(15,2))
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_Balance DECIMAL(15,2) DEFAULT 0;
    SELECT Balance INTO v_Balance
    FROM   BankAccounts
    WHERE  AccountID = p_AccountID;

    -- Credit Card accounts are allowed to go negative (debt), so skip the check
    IF v_AccType = 'Credit Card' THEN
        RETURN 0;
    END IF;

    RETURN IF(v_Balance - p_Amount < 0, 1, 0);
END$$

-- Return the current balance of an account.
-- Python calls this to show the live balance hint in the UI.
CREATE FUNCTION fn_GetAccountBalance(p_AccountID INT)
RETURNS DECIMAL(15,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_Balance DECIMAL(15,2) DEFAULT 0;
    SELECT Balance INTO v_Balance
    FROM   BankAccounts
    WHERE  AccountID = p_AccountID;
    RETURN IFNULL(v_Balance, 0);
END$$

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- sp_AddIncome
-- ------------
-- Insert one income record linked to a specific account.
-- The trg_after_income_insert trigger fires automatically and
-- credits p_Amount to BankAccounts.Balance for p_AccountID.
--
-- OUT p_Error: empty string = success; non-empty = error message.
-- Python reads p_Error after callproc to decide whether to show an alert.
CREATE PROCEDURE sp_AddIncome(
    IN  p_UserID    INT,
    IN  p_AccountID INT,
    IN  p_Amount    DECIMAL(15,2),
    IN  p_Date      DATE,
    IN  p_Desc      VARCHAR(255),
    OUT p_Error     VARCHAR(255)
)
BEGIN
    SET p_Error = '';

    -- Guard: account must belong to this user
    IF NOT EXISTS (
        SELECT 1 FROM BankAccounts
        WHERE AccountID = p_AccountID AND UserID = p_UserID
    ) THEN
        SET p_Error = 'Account not found or does not belong to this user.';
    ELSE
        INSERT INTO Income(UserID, AccountID, Amount, IncomeDate, Description)
        VALUES (p_UserID, p_AccountID, p_Amount, p_Date, p_Desc);
    END IF;
END$$

-- sp_AddExpense
-- -------------
-- Insert one expense record linked to a specific account.
-- Before inserting, checks that the deduction would not make the balance
-- go below zero. If it would, the procedure sets p_Error and does NOT insert.
-- The trg_after_expense_insert trigger fires on success and debits the balance.
--
-- OUT p_Error: empty string = success; non-empty = error message for the UI.
CREATE PROCEDURE sp_AddExpense(
    IN  p_UserID     INT,
    IN  p_CategoryID INT,
    IN  p_AccountID  INT,
    IN  p_Amount     DECIMAL(15,2),
    IN  p_Date       DATE,
    IN  p_Desc       VARCHAR(255),
    OUT p_Error      VARCHAR(255)
)
BEGIN
    SET p_Error = '';

    -- Guard: account must belong to this user
    IF NOT EXISTS (
        SELECT 1 FROM BankAccounts
        WHERE AccountID = p_AccountID AND UserID = p_UserID
    ) THEN
        SET p_Error = 'Account not found or does not belong to this user.';

    -- Guard: balance must not go negative
    ELSEIF fn_WouldGoNegative(p_AccountID, p_Amount) = 1 THEN
        SET p_Error = CONCAT(
            'Insufficient balance. Account has ₫',
            FORMAT(fn_GetAccountBalance(p_AccountID), 0),
            ' but expense is ₫',
            FORMAT(p_Amount, 0),
            '.'
        );

    -- Guard: category must exist
    ELSEIF NOT EXISTS (
        SELECT 1 FROM ExpenseCategories WHERE CategoryID = p_CategoryID
    ) THEN
        SET p_Error = 'Invalid category.';

    ELSE
        INSERT INTO Expenses(UserID, CategoryID, AccountID, Amount, ExpenseDate, Description)
        VALUES (p_UserID, p_CategoryID, p_AccountID, p_Amount, p_Date, p_Desc);
    END IF;
END$$

-- sp_DeleteExpense
-- ----------------
-- Delete one expense row.
-- The trg_after_expense_delete trigger fires automatically and
-- credits the amount back to the linked account.
CREATE PROCEDURE sp_DeleteExpense(
    IN  p_ExpenseID INT,
    IN  p_UserID    INT,
    OUT p_Error     VARCHAR(255)
)
BEGIN
    SET p_Error = '';
    IF NOT EXISTS (
        SELECT 1 FROM Expenses WHERE ExpenseID = p_ExpenseID AND UserID = p_UserID
    ) THEN
        SET p_Error = 'Expense not found.';
    ELSE
        DELETE FROM Expenses WHERE ExpenseID = p_ExpenseID AND UserID = p_UserID;
    END IF;
END$$

-- sp_DeleteIncome
-- ---------------
-- Delete one income row.
-- The trg_after_income_delete trigger fires automatically and
-- debits the amount back from the linked account.
CREATE PROCEDURE sp_DeleteIncome(
    IN  p_IncomeID INT,
    IN  p_UserID   INT,
    OUT p_Error    VARCHAR(255)
)
BEGIN
    SET p_Error = '';
    IF NOT EXISTS (
        SELECT 1 FROM Income WHERE IncomeID = p_IncomeID AND UserID = p_UserID
    ) THEN
        SET p_Error = 'Income record not found.';
    ELSE
        DELETE FROM Income WHERE IncomeID = p_IncomeID AND UserID = p_UserID;
    END IF;
END$$

-- sp_MonthlySummary
-- -----------------
-- Return aggregate KPIs for the Dashboard stat cards.
CREATE PROCEDURE sp_MonthlySummary(IN p_UserID INT)
BEGIN
    SELECT
        GetTotalIncome(p_UserID)  AS TotalIncome,
        GetTotalExpense(p_UserID) AS TotalExpense,
        GetBudgetStatus(p_UserID) AS Status;
END$$

-- sp_DeleteUser
-- -------------
-- Hard-delete a user. ON DELETE CASCADE in the schema removes all
-- related rows (Income, Expenses, BankAccounts, Budgets, Goals) automatically.
-- Called by Settings > Delete Account after email confirmation.
CREATE PROCEDURE sp_DeleteUser(IN p_UserID INT)
BEGIN
    DELETE FROM Users WHERE UserID = p_UserID;
END$$

DELIMITER ;