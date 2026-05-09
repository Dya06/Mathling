/* ============================================
   MATHLINGS DATABASE SCHEMA
   SQL Server LocalDB
   ============================================
   
   HOW TO USE:
   1. In Visual Studio, go to View → Server Explorer
   2. Right-click "Data Connections" → Add Connection
   3. Server name: (LocalDb)\MSSQLLocalDB
   4. Database name: MathlingDB
   5. Click OK, then right-click MathlingDB → New Query
   6. Paste this entire script and click Execute (Ctrl+Shift+E)
   
   OR: The database will be auto-created via the connection string 
   in Web.config when the application first runs.
   ============================================ */

-- =============================================
-- USERS
-- Stores all user accounts (students, parents, instructors, admins)
-- =============================================
CREATE TABLE [dbo].[Users] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [Name]          NVARCHAR(100)   NOT NULL,
    [Email]         NVARCHAR(256)   NOT NULL UNIQUE,
    [PasswordHash]  NVARCHAR(256)   NOT NULL,
    [Role]          NVARCHAR(20)    NOT NULL DEFAULT 'student',  -- student, parent, instructor, admin
    [Avatar]        NVARCHAR(10)    NULL DEFAULT N'🧒',
    [Level]         INT             NOT NULL DEFAULT 1,
    [XP]            INT             NOT NULL DEFAULT 0,
    [CreatedAt]     DATETIME2       NOT NULL DEFAULT GETDATE(),
    [IsActive]      BIT             NOT NULL DEFAULT 1,

    CONSTRAINT [CK_Users_Role] CHECK ([Role] IN ('student','parent','instructor','admin'))
);

-- =============================================
-- FORMULAS
-- Each formula represents a learning unit (e.g. SF+4 = +5-1)
-- =============================================
CREATE TABLE [dbo].[Formulas] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [Name]          NVARCHAR(50)    NOT NULL UNIQUE,    -- e.g. 'SF+4'
    [Rule]          NVARCHAR(100)   NOT NULL,            -- e.g. '+5 − 1'
    [Description]   NVARCHAR(255)   NULL,                -- e.g. 'Small Friend +4'
    [SortOrder]     INT             NOT NULL DEFAULT 0,
    [IsActive]      BIT             NOT NULL DEFAULT 1
);

-- =============================================
-- MODULES
-- Each formula has modules A-E (Learning, Exercise Abacus, etc.)
-- =============================================
CREATE TABLE [dbo].[Modules] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [FormulaId]     INT             NOT NULL,
    [ModuleKey]     NVARCHAR(30)    NOT NULL,  -- learning, exerciseAbacus, exerciseMental, preparation, assessment
    [Title]         NVARCHAR(100)   NOT NULL,  -- e.g. 'A. Learning Module'
    [Icon]          NVARCHAR(10)    NULL,
    [Description]   NVARCHAR(500)   NULL,
    [UseAbacus]     BIT             NOT NULL DEFAULT 0,
    [MentalMode]    BIT             NOT NULL DEFAULT 0,
    [IsTimed]       BIT             NOT NULL DEFAULT 0,
    [TimeLimitSec]  INT             NULL,
    [SortOrder]     INT             NOT NULL DEFAULT 0,

    CONSTRAINT [FK_Modules_Formulas] FOREIGN KEY ([FormulaId]) REFERENCES [dbo].[Formulas]([Id])
);

-- =============================================
-- QUESTION SETS
-- Each module contains one or more sets (Set 1, Set 2, etc.)
-- =============================================
CREATE TABLE [dbo].[QuestionSets] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [ModuleId]      INT             NOT NULL,
    [Label]         NVARCHAR(100)   NOT NULL,  -- e.g. 'Set 1 — Static'
    [DisplayMode]   NVARCHAR(20)    NOT NULL DEFAULT 'static',  -- static, flash
    [SortOrder]     INT             NOT NULL DEFAULT 0,

    CONSTRAINT [FK_QuestionSets_Modules] FOREIGN KEY ([ModuleId]) REFERENCES [dbo].[Modules]([Id]),
    CONSTRAINT [CK_QuestionSets_Mode] CHECK ([DisplayMode] IN ('static','flash'))
);

-- =============================================
-- QUESTIONS
-- Each question has multiple rows displayed vertically
-- Answer is the expected result
-- =============================================
CREATE TABLE [dbo].[Questions] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [SetId]         INT             NOT NULL,
    [Answer]        INT             NOT NULL,    -- correct answer
    [SortOrder]     INT             NOT NULL DEFAULT 0,

    CONSTRAINT [FK_Questions_Sets] FOREIGN KEY ([SetId]) REFERENCES [dbo].[QuestionSets]([Id])
);

-- =============================================
-- QUESTION ROWS
-- Individual numbers in each question (displayed vertically)
-- e.g. Question "2+1-2+4=5" has rows: 2, 1, -2, 4
-- =============================================
CREATE TABLE [dbo].[QuestionRows] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [QuestionId]    INT             NOT NULL,
    [Value]         INT             NOT NULL,    -- positive = add, negative = subtract
    [SortOrder]     INT             NOT NULL DEFAULT 0,

    CONSTRAINT [FK_QuestionRows_Questions] FOREIGN KEY ([QuestionId]) REFERENCES [dbo].[Questions]([Id])
);

-- =============================================
-- QUIZ RESULTS
-- Tracks each student's quiz attempt
-- =============================================
CREATE TABLE [dbo].[QuizResults] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [UserId]        INT             NOT NULL,
    [SetId]         INT             NOT NULL,
    [Score]         INT             NOT NULL DEFAULT 0,
    [TotalCorrect]  INT             NOT NULL DEFAULT 0,
    [TotalQuestions] INT            NOT NULL DEFAULT 0,
    [Percentage]    DECIMAL(5,2)    NULL,
    [TimeTakenSec]  INT             NULL,
    [CompletedAt]   DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_QuizResults_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [FK_QuizResults_Sets] FOREIGN KEY ([SetId]) REFERENCES [dbo].[QuestionSets]([Id])
);

-- =============================================
-- MODULE PROGRESS
-- Tracks which modules a student has completed
-- =============================================
CREATE TABLE [dbo].[ModuleProgress] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [UserId]        INT             NOT NULL,
    [ModuleId]      INT             NOT NULL,
    [IsCompleted]   BIT             NOT NULL DEFAULT 0,
    [CompletedAt]   DATETIME2       NULL,

    CONSTRAINT [FK_ModuleProgress_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [FK_ModuleProgress_Modules] FOREIGN KEY ([ModuleId]) REFERENCES [dbo].[Modules]([Id]),
    CONSTRAINT [UQ_ModuleProgress] UNIQUE ([UserId], [ModuleId])
);

-- =============================================
-- FORUM THREADS
-- =============================================
CREATE TABLE [dbo].[ForumThreads] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [Title]         NVARCHAR(200)   NOT NULL,
    [Content]       NVARCHAR(MAX)   NOT NULL,
    [Category]      NVARCHAR(50)    NOT NULL DEFAULT 'General',
    [AuthorId]      INT             NOT NULL,
    [CreatedAt]     DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_ForumThreads_Users] FOREIGN KEY ([AuthorId]) REFERENCES [dbo].[Users]([Id])
);

-- =============================================
-- FORUM REPLIES
-- =============================================
CREATE TABLE [dbo].[ForumReplies] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [ThreadId]      INT             NOT NULL,
    [Content]       NVARCHAR(MAX)   NOT NULL,
    [AuthorId]      INT             NOT NULL,
    [CreatedAt]     DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_ForumReplies_Threads] FOREIGN KEY ([ThreadId]) REFERENCES [dbo].[ForumThreads]([Id]),
    CONSTRAINT [FK_ForumReplies_Users] FOREIGN KEY ([AuthorId]) REFERENCES [dbo].[Users]([Id])
);

-- =============================================
-- CONTENT SUBMISSIONS (Instructor → Admin review)
-- =============================================
CREATE TABLE [dbo].[Submissions] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [Title]         NVARCHAR(200)   NOT NULL,
    [Chapter]       NVARCHAR(100)   NULL,
    [Difficulty]    NVARCHAR(20)    NULL,
    [Status]        NVARCHAR(20)    NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
    [Reason]        NVARCHAR(500)   NULL,
    [InstructorId]  INT             NOT NULL,
    [CreatedAt]     DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_Submissions_Users] FOREIGN KEY ([InstructorId]) REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [CK_Submissions_Status] CHECK ([Status] IN ('pending','approved','rejected'))
);

-- =============================================
-- BADGES
-- =============================================
CREATE TABLE [dbo].[Badges] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [Name]          NVARCHAR(100)   NOT NULL,
    [Icon]          NVARCHAR(10)    NULL,
    [Description]   NVARCHAR(255)   NULL
);

-- =============================================
-- USER BADGES (many-to-many)
-- =============================================
CREATE TABLE [dbo].[UserBadges] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [UserId]        INT             NOT NULL,
    [BadgeId]       INT             NOT NULL,
    [EarnedAt]      DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_UserBadges_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [FK_UserBadges_Badges] FOREIGN KEY ([BadgeId]) REFERENCES [dbo].[Badges]([Id]),
    CONSTRAINT [UQ_UserBadges] UNIQUE ([UserId], [BadgeId])
);

-- =============================================
-- PARENT-STUDENT LINKS
-- =============================================
CREATE TABLE [dbo].[ParentStudentLinks] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [ParentId]      INT             NOT NULL,
    [StudentId]     INT             NOT NULL,
    [LinkedAt]      DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_PSL_Parent] FOREIGN KEY ([ParentId]) REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [FK_PSL_Student] FOREIGN KEY ([StudentId]) REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [UQ_ParentStudent] UNIQUE ([ParentId], [StudentId])
);


-- =============================================
-- SEED DATA
-- =============================================

-- Demo Users (password = 'demo123' — in production use hashed passwords!)
INSERT INTO [dbo].[Users] ([Name], [Email], [PasswordHash], [Role], [Avatar])
VALUES
    (N'Alex Student',       'student@demo.com',     'demo123', 'student',    N'🧒'),
    (N'Sarah Parent',       'parent@demo.com',      'demo123', 'parent',     N'👩'),
    (N'Robert Instructor',  'instructor@demo.com',  'demo123', 'instructor', N'👨‍🏫'),
    (N'Admin User',         'admin@demo.com',       'demo123', 'admin',      N'🛡️');

-- Formula: SF+4
INSERT INTO [dbo].[Formulas] ([Name], [Rule], [Description], [SortOrder])
VALUES (N'SF+4', N'+5 − 1', N'Small Friend +4', 1);

-- Modules for SF+4
DECLARE @fid INT = SCOPE_IDENTITY();

INSERT INTO [dbo].[Modules] ([FormulaId], [ModuleKey], [Title], [Icon], [Description], [UseAbacus], [MentalMode], [IsTimed], [TimeLimitSec], [SortOrder])
VALUES
    (@fid, 'learning',        'A. Learning Module',    N'📖', 'Learn how the abacus moves for this formula',                    1, 0, 0, NULL, 1),
    (@fid, 'exerciseAbacus',  'B. Exercise (Abacus)',   N'🧮', 'Solve using the abacus',                                        1, 0, 0, NULL, 2),
    (@fid, 'exerciseMental',  'C. Exercise (Mental)',   N'🧠', 'No abacus! Imagine the beads moving in your mind.',              0, 1, 0, NULL, 3),
    (@fid, 'preparation',     'D. Preparation',         N'📝', 'Prepare for the final assessment — 10 questions, 5 rows each.',  0, 1, 0, NULL, 4),
    (@fid, 'assessment',      'E. Assessment',           N'🏆', '10 questions, 5 rows each. 1 minute time limit!',               0, 1, 1, 60,   5);

-- Learning Module Set 1
DECLARE @modLearning INT = (SELECT [Id] FROM [dbo].[Modules] WHERE [ModuleKey] = 'learning' AND [FormulaId] = @fid);

INSERT INTO [dbo].[QuestionSets] ([ModuleId], [Label], [DisplayMode], [SortOrder])
VALUES (@modLearning, 'Set 1 — Static', 'static', 1);

DECLARE @setId INT = SCOPE_IDENTITY();

-- Question 1: 2+1-2+4 = 5
INSERT INTO [dbo].[Questions] ([SetId], [Answer], [SortOrder]) VALUES (@setId, 5, 1);
DECLARE @qid INT = SCOPE_IDENTITY();
INSERT INTO [dbo].[QuestionRows] ([QuestionId], [Value], [SortOrder]) VALUES (@qid, 2, 1), (@qid, 1, 2), (@qid, -2, 3), (@qid, 4, 4);

-- Question 2: 1+4+2-1 = 6
INSERT INTO [dbo].[Questions] ([SetId], [Answer], [SortOrder]) VALUES (@setId, 6, 2);
SET @qid = SCOPE_IDENTITY();
INSERT INTO [dbo].[QuestionRows] ([QuestionId], [Value], [SortOrder]) VALUES (@qid, 1, 1), (@qid, 4, 2), (@qid, 2, 3), (@qid, -1, 4);

-- Question 3: 4+4+1-2 = 7
INSERT INTO [dbo].[Questions] ([SetId], [Answer], [SortOrder]) VALUES (@setId, 7, 3);
SET @qid = SCOPE_IDENTITY();
INSERT INTO [dbo].[QuestionRows] ([QuestionId], [Value], [SortOrder]) VALUES (@qid, 4, 1), (@qid, 4, 2), (@qid, 1, 3), (@qid, -2, 4);

-- Question 4: 6+2-5+4 = 7
INSERT INTO [dbo].[Questions] ([SetId], [Answer], [SortOrder]) VALUES (@setId, 7, 4);
SET @qid = SCOPE_IDENTITY();
INSERT INTO [dbo].[QuestionRows] ([QuestionId], [Value], [SortOrder]) VALUES (@qid, 6, 1), (@qid, 2, 2), (@qid, -5, 3), (@qid, 4, 4);

-- Question 5: 9-5+4-3 = 5
INSERT INTO [dbo].[Questions] ([SetId], [Answer], [SortOrder]) VALUES (@setId, 5, 5);
SET @qid = SCOPE_IDENTITY();
INSERT INTO [dbo].[QuestionRows] ([QuestionId], [Value], [SortOrder]) VALUES (@qid, 9, 1), (@qid, -5, 2), (@qid, 4, 3), (@qid, -3, 4);

-- Learning Module Set 2 (Flash — empty, to be populated)
INSERT INTO [dbo].[QuestionSets] ([ModuleId], [Label], [DisplayMode], [SortOrder])
VALUES (@modLearning, 'Set 2 — Flash', 'flash', 2);

-- Exercise Abacus Sets (empty, to be populated)
DECLARE @modEA INT = (SELECT [Id] FROM [dbo].[Modules] WHERE [ModuleKey] = 'exerciseAbacus' AND [FormulaId] = @fid);
INSERT INTO [dbo].[QuestionSets] ([ModuleId], [Label], [DisplayMode], [SortOrder])
VALUES (@modEA, 'EA Set 1 — Static', 'static', 1), (@modEA, 'EA Set 2 — Static', 'static', 2);

-- Exercise Mental Sets (empty, to be populated)
DECLARE @modEM INT = (SELECT [Id] FROM [dbo].[Modules] WHERE [ModuleKey] = 'exerciseMental' AND [FormulaId] = @fid);
INSERT INTO [dbo].[QuestionSets] ([ModuleId], [Label], [DisplayMode], [SortOrder])
VALUES (@modEM, 'EM Set 1 — Flash', 'flash', 1), (@modEM, 'EM Set 2 — Flash', 'flash', 2);

-- Preparation Set (empty, to be populated)
DECLARE @modPrep INT = (SELECT [Id] FROM [dbo].[Modules] WHERE [ModuleKey] = 'preparation' AND [FormulaId] = @fid);
INSERT INTO [dbo].[QuestionSets] ([ModuleId], [Label], [DisplayMode], [SortOrder])
VALUES (@modPrep, 'Preparation', 'flash', 1);

-- Assessment Set (empty, to be populated)
DECLARE @modAssess INT = (SELECT [Id] FROM [dbo].[Modules] WHERE [ModuleKey] = 'assessment' AND [FormulaId] = @fid);
INSERT INTO [dbo].[QuestionSets] ([ModuleId], [Label], [DisplayMode], [SortOrder])
VALUES (@modAssess, 'Final Assessment', 'flash', 1);

-- Sample Badges
INSERT INTO [dbo].[Badges] ([Name], [Icon], [Description])
VALUES
    (N'First Steps',     N'🌟', N'Complete your first quiz'),
    (N'Perfect Score',   N'💯', N'Score 100% on any quiz'),
    (N'Speed Demon',     N'⚡', N'Complete assessment under 30 seconds'),
    (N'Streak Master',   N'🔥', N'Get 10 correct answers in a row'),
    (N'Formula Hero',    N'🏆', N'Complete all modules in a formula');

PRINT 'MathlingDB schema created and seeded successfully!';
GO
