-- ============================================================
-- PERSONAL FINANCE MANAGEMENT SYSTEM
-- sample_data.sql — Demo data for development & testing
-- ============================================================
-- HOW TO USE:
--   1. Import schema.sql first (creates the database and all objects)
--   2. Then import this file:
--        mysql -u root -p PersonalFinance < sample_data.sql
--
-- ACCOUNTS CREATED (for login testing):
--   Email: alice@example.com   Password: password123
--   Email: bob@example.com     Password: password123
--
-- NOTE: PasswordHash values below are bcrypt hashes of "password123"
--       generated with cost factor 12. Do NOT use these in production.
-- ============================================================

USE PersonalFinance;

-- ============================================================
-- 1. EXPENSE CATEGORIES (8 records)
-- Already inserted by schema.sql — skip if already present
-- ============================================================
INSERT IGNORE INTO ExpenseCategories (CategoryName) VALUES
    ('Food'),
    ('Transport'),
    ('Shopping'),
    ('Bills'),
    ('Entertainment'),
    ('Healthcare'),
    ('Education'),
    ('Other');


-- ============================================================
-- 2. USERS (2 demo accounts)
-- ============================================================
-- Password for both accounts: password123
INSERT INTO Users (UserName, Email, PhoneNumber, PasswordHash) VALUES
    ('Alice Nguyen',
     'alice@example.com',
     '0901234567',
     '$2b$12$jLypI6Yi8s7HVuL9utOc5ul6Nfv.JVdbvBXw0x.dV6RxcZfI43Yt2'),
    ('Bob Tran',
     'bob@example.com',
     '0912345678',
     '$2b$12$jLypI6Yi8s7HVuL9utOc5ul6Nfv.JVdbvBXw0x.dV6RxcZfI43Yt2');

-- UserID 1 = Alice, UserID 2 = Bob


-- ============================================================
-- 3. BANK ACCOUNTS (5 accounts for Alice, 3 for Bob)
--    NOTE: Balance is set manually here; INSERT triggers won't
--    fire on direct INSERT to BankAccounts (triggers are on
--    Income/Expenses tables). These are starting balances.
-- ============================================================
INSERT INTO BankAccounts (UserID, AccountName, AccountType, BankName, Provider, Balance) VALUES
    -- Alice's accounts
    (1, 'Vietcombank Salary',  'Bank Account', 'Vietcombank (VCB)', NULL,   45000000.00),
    (1, 'BIDV Savings',        'Bank Account', 'BIDV',              NULL,   20000000.00),
    (1, 'MoMo Wallet',         'E-Wallet',      NULL,               'MoMo',  2500000.00),
    (1, 'Petty Cash',          'Cash',          NULL,               NULL,    1200000.00),
    (1, 'Techcombank Credit',  'Credit Card',  'Techcombank',       NULL,        0.00),
    -- Bob's accounts
    (2, 'MB Bank Main',        'Bank Account', 'MB Bank',           NULL,   30000000.00),
    (2, 'ZaloPay',             'E-Wallet',      NULL,               'ZaloPay', 800000.00),
    (2, 'VPBank Investment',   'Investment',    'VPBank',           NULL,   50000000.00);

-- AccountID mapping:
--   1 = Alice / Vietcombank Salary
--   2 = Alice / BIDV Savings
--   3 = Alice / MoMo Wallet
--   4 = Alice / Petty Cash
--   5 = Alice / Techcombank Credit
--   6 = Bob   / MB Bank Main
--   7 = Bob   / ZaloPay
--   8 = Bob   / VPBank Investment


-- ============================================================
-- 4. INCOME (8 records for Alice, 5 for Bob)
--    Dates spread across the last 6 months
-- ============================================================
INSERT INTO Income (UserID, AccountID, Amount, IncomeDate, Description) VALUES
    -- Alice
    (1, 1, 18000000.00, '2025-12-25', 'Monthly salary - December'),
    (1, 1, 18000000.00, '2026-01-25', 'Monthly salary - January'),
    (1, 1, 18000000.00, '2026-02-25', 'Monthly salary - February'),
    (1, 1, 18000000.00, '2026-03-25', 'Monthly salary - March'),
    (1, 2,  5000000.00, '2026-02-10', 'Freelance web design project'),
    (1, 3,  1500000.00, '2026-03-05', 'Online tutoring payment'),
    (1, 1, 18000000.00, '2026-04-25', 'Monthly salary - April'),
    (1, 4,    800000.00, '2026-04-12', 'Cash gift from family'),
    -- Bob
    (2, 6, 25000000.00, '2026-02-28', 'Monthly salary - February'),
    (2, 6, 25000000.00, '2026-03-31', 'Monthly salary - March'),
    (2, 6, 25000000.00, '2026-04-30', 'Monthly salary - April'),
    (2, 8,  3000000.00, '2026-03-15', 'Stock dividend payment'),
    (2, 7,    500000.00, '2026-04-02', 'Cashback promotion reward'),

    -- Income in May 2026
    (1, 1, 18000000.00, '2026-05-01', 'Monthly salary - May'),
    (1, 2,  2000000.00, '2026-05-07', 'Freelance project payment'),
    (1, 3,    500000.00, '2026-05-10', 'Cashback reward MoMo'),
    (2, 6, 25000000.00, '2026-05-01', 'Monthly salary - May'),
    (2, 8,  1500000.00, '2026-05-09', 'Investment interest');


-- ============================================================
-- 5. EXPENSES (10 records for Alice, 8 for Bob)
-- ============================================================
INSERT INTO Expenses (UserID, CategoryID, AccountID, Amount, ExpenseDate, Description) VALUES
    -- Alice
    -- Food (CategoryID 1)
    (1, 1, 3,  85000.00,  '2026-04-28', 'Grocery shopping at VinMart'),
    (1, 1, 4, 120000.00,  '2026-04-25', 'Lunch with colleagues'),
    (1, 1, 3, 200000.00,  '2026-04-20', 'Family dinner at restaurant'),
    -- Transport (CategoryID 2)
    (1, 2, 3,  55000.00,  '2026-04-27', 'Grab car to office'),
    (1, 2, 4,  25000.00,  '2026-04-22', 'Parking fee'),
    -- Shopping (CategoryID 3)
    (1, 3, 1, 850000.00,  '2026-04-15', 'New shoes at Uniqlo'),
    (1, 3, 1, 320000.00,  '2026-04-10', 'Books and stationery'),
    -- Bills (CategoryID 4)
    (1, 4, 1, 350000.00,  '2026-04-05', 'Electricity bill'),
    (1, 4, 1, 220000.00,  '2026-04-05', 'Internet monthly fee'),
    -- Entertainment (CategoryID 5)
    (1, 5, 3, 180000.00,  '2026-04-18', 'Cinema tickets x2'),
    -- Bob
    -- Food (CategoryID 1)
    (2, 1, 6, 150000.00,  '2026-04-29', 'Supermarket groceries'),
    (2, 1, 7,  75000.00,  '2026-04-26', 'Coffee and snacks'),
    -- Transport (CategoryID 2)
    (2, 2, 6, 320000.00,  '2026-04-24', 'Monthly bus pass'),
    (2, 2, 7,  90000.00,  '2026-04-20', 'Grab Express deliveries'),
    -- Bills (CategoryID 4)
    (2, 4, 6, 500000.00,  '2026-04-03', 'Water + electricity combined'),
    -- Healthcare (CategoryID 6)
    (2, 6, 6, 450000.00,  '2026-03-28', 'Doctor visit and medication'),
    -- Education (CategoryID 7)
    (2, 7, 6, 800000.00,  '2026-03-20', 'Online course subscription'),
    -- Entertainment (CategoryID 5)
    (2, 5, 7, 250000.00,  '2026-04-14', 'Netflix monthly + Spotify'),

    -- Alice - May
    (1, 1, 3,   95000.00, '2026-05-01', 'Breakfast and coffee'),
    (1, 2, 3,   45000.00, '2026-05-02', 'Grab bike to work'),
    (1, 1, 4,  150000.00, '2026-05-03', 'Lunch with team'),
    (1, 4, 1,  350000.00, '2026-05-04', 'Internet monthly bill'),
    (1, 5, 3,   90000.00, '2026-05-04', 'Spotify subscription'),
    (1, 3, 1,  450000.00, '2026-05-05', 'Clothing at H and M'),
    (1, 1, 3,   75000.00, '2026-05-06', 'Grocery shopping'),
    (1, 2, 4,   25000.00, '2026-05-07', 'Parking fee downtown'),
    (1, 6, 1,  200000.00, '2026-05-08', 'Pharmacy and vitamins'),
    -- Bob - May
    (2, 1, 6,  120000.00, '2026-05-01', 'Supermarket groceries'),
    (2, 2, 7,   55000.00, '2026-05-02', 'Grab Express delivery'),
    (2, 4, 6,  500000.00, '2026-05-03', 'Electricity and water'),
    (2, 5, 7,  150000.00, '2026-05-04', 'Gaming subscription'),
    (2, 7, 6,  300000.00, '2026-05-06', 'Online course payment'),
    (2, 1, 6,   85000.00, '2026-05-07', 'Coffee and snacks'),
    (2, 6, 6,  180000.00, '2026-05-08', 'Clinic visit');


-- ============================================================
-- 6. BUDGETS (8 records for Alice, 6 for Bob)
--    Monthly spend limits per category
-- ============================================================
INSERT INTO Budgets (UserID, CategoryID, LimitAmount) VALUES
    -- Alice
    (1, 1, 2000000.00),   -- Food:          2,000,000 ₫/month
    (1, 2,  800000.00),   -- Transport:       800,000 ₫/month
    (1, 3, 1500000.00),   -- Shopping:      1,500,000 ₫/month
    (1, 4, 1000000.00),   -- Bills:         1,000,000 ₫/month
    (1, 5,  500000.00),   -- Entertainment:   500,000 ₫/month
    (1, 6,  600000.00),   -- Healthcare:      600,000 ₫/month
    (1, 7, 1000000.00),   -- Education:     1,000,000 ₫/month
    (1, 8,  300000.00),   -- Other:           300,000 ₫/month
    -- Bob
    (2, 1, 2500000.00),   -- Food:          2,500,000 ₫/month
    (2, 2,  600000.00),   -- Transport:       600,000 ₫/month
    (2, 4, 1200000.00),   -- Bills:         1,200,000 ₫/month
    (2, 5,  400000.00),   -- Entertainment:   400,000 ₫/month
    (2, 6,  800000.00),   -- Healthcare:      800,000 ₫/month
    (2, 7, 1500000.00);   -- Education:     1,500,000 ₫/month


-- ============================================================
-- 7. GOALS (5 goals for Alice, 3 for Bob)
-- Icon values map to files in frontend/public/icons/goals/
-- ============================================================
INSERT INTO Goals (UserID, GoalName, Icon, TargetAmount, SavedAmount, TargetDate) VALUES
    -- Alice
    (1, 'Emergency Fund',    '/icons/goals/savings.png',   50000000.00, 20000000.00, '2026-12-31'),
    (1, 'Vacation to Japan', '/icons/goals/travel.png',    30000000.00,  8500000.00, '2026-09-01'),
    (1, 'New Laptop',        '/icons/goals/laptop.png',    25000000.00, 10000000.00, '2026-07-15'),
    (1, 'Wedding Fund',      '/icons/goals/ring.png',      80000000.00,  5000000.00, '2027-06-01'),
    (1, 'Home Down Payment', '/icons/goals/house.png',     200000000.00, 30000000.00, '2028-01-01'),
    -- Bob
    (2, 'New Car',           '/icons/goals/car.png',      400000000.00, 50000000.00, '2027-12-31'),
    (2, 'MBA Tuition',       '/icons/goals/education.png', 60000000.00, 15000000.00, '2027-03-01')


-- ============================================================
-- SUMMARY
-- ============================================================
-- After importing, you can verify with:
--
--   SELECT 'Users'             AS tbl, COUNT(*) AS n FROM Users
--   UNION ALL
--   SELECT 'ExpenseCategories',        COUNT(*) FROM ExpenseCategories
--   UNION ALL
--   SELECT 'BankAccounts',             COUNT(*) FROM BankAccounts
--   UNION ALL
--   SELECT 'Income',                   COUNT(*) FROM Income
--   UNION ALL
--   SELECT 'Expenses',                 COUNT(*) FROM Expenses
--   UNION ALL
--   SELECT 'Budgets',                  COUNT(*) FROM Budgets
--   UNION ALL
--   SELECT 'Goals',                    COUNT(*) FROM Goals;
-- ============================================================