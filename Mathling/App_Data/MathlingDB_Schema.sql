/* ============================================
   MATHLINGS DATABASE SCHEMA
   SQL Server LocalDB
   ============================================ */

-- =============================================
-- USERS
-- =============================================

CREATE DATABASE MathlingDB;
GO
USE MathlingDB;

CREATE TABLE [dbo].[Users] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [Name]          NVARCHAR(100)   NOT NULL,
    [Email]         NVARCHAR(256)   NOT NULL UNIQUE,
    [PasswordHash]  NVARCHAR(256)   NOT NULL,
    [Role]          NVARCHAR(20)    NOT NULL DEFAULT 'student',
    [Avatar]        NVARCHAR(50)    NULL DEFAULT 'student',
    [Level]         INT             NOT NULL DEFAULT 1,
    [XP]            INT             NOT NULL DEFAULT 0,
    [CreatedAt]     DATETIME2       NOT NULL DEFAULT GETDATE(),
    [IsActive]      BIT             NOT NULL DEFAULT 1,

    CONSTRAINT [CK_Users_Role]
    CHECK ([Role] IN ('student','parent','instructor','admin'))
);

-- =============================================
-- FORMULAS
-- =============================================
CREATE TABLE [dbo].[Formulas] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [Name]          NVARCHAR(50)    NOT NULL UNIQUE,
    [Rule]          NVARCHAR(100)   NOT NULL,
    [Description]   NVARCHAR(255)   NULL,
    [SortOrder]     INT             NOT NULL DEFAULT 0,
    [IsActive]      BIT             NOT NULL DEFAULT 1
);

-- =============================================
-- MODULES
-- =============================================
CREATE TABLE [dbo].[Modules] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [FormulaId]     INT             NOT NULL,
    [ModuleKey]     NVARCHAR(30)    NOT NULL,
    [Title]         NVARCHAR(100)   NOT NULL,
    [Icon]          NVARCHAR(50)    NULL,
    [Description]   NVARCHAR(500)   NULL,
    [UseAbacus]     BIT             NOT NULL DEFAULT 0,
    [MentalMode]    BIT             NOT NULL DEFAULT 0,
    [IsTimed]       BIT             NOT NULL DEFAULT 0,
    [TimeLimitSec]  INT             NULL,
    [SortOrder]     INT             NOT NULL DEFAULT 0,

    CONSTRAINT [FK_Modules_Formulas]
    FOREIGN KEY ([FormulaId])
    REFERENCES [dbo].[Formulas]([Id])
);

-- =============================================
-- QUESTION SETS
-- =============================================
CREATE TABLE [dbo].[QuestionSets] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [ModuleId]      INT             NOT NULL,
    [Label]         NVARCHAR(100)   NOT NULL,
    [DisplayMode]   NVARCHAR(20)    NOT NULL DEFAULT 'static',
    [SortOrder]     INT             NOT NULL DEFAULT 0,

    CONSTRAINT [FK_QuestionSets_Modules]
    FOREIGN KEY ([ModuleId])
    REFERENCES [dbo].[Modules]([Id]),

    CONSTRAINT [CK_QuestionSets_Mode]
    CHECK ([DisplayMode] IN ('static','flash'))
);

-- =============================================
-- QUESTIONS
-- =============================================
CREATE TABLE [dbo].[Questions] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [SetId]         INT             NOT NULL,
    [Answer]        INT             NOT NULL,
    [SortOrder]     INT             NOT NULL DEFAULT 0,

    CONSTRAINT [FK_Questions_Sets]
    FOREIGN KEY ([SetId])
    REFERENCES [dbo].[QuestionSets]([Id])
);

-- =============================================
-- QUESTION ROWS
-- =============================================
CREATE TABLE [dbo].[QuestionRows] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [QuestionId]    INT             NOT NULL,
    [Value]         INT             NOT NULL,
    [SortOrder]     INT             NOT NULL DEFAULT 0,

    CONSTRAINT [FK_QuestionRows_Questions]
    FOREIGN KEY ([QuestionId])
    REFERENCES [dbo].[Questions]([Id])
);

-- =============================================
-- QUIZ RESULTS
-- =============================================
CREATE TABLE [dbo].[QuizResults] (
    [Id]             INT IDENTITY(1,1) PRIMARY KEY,
    [UserId]         INT             NOT NULL,
    [SetId]          INT             NOT NULL,
    [Score]          INT             NOT NULL DEFAULT 0,
    [TotalCorrect]   INT             NOT NULL DEFAULT 0,
    [TotalQuestions] INT             NOT NULL DEFAULT 0,
    [Percentage]     DECIMAL(5,2)    NULL,
    [TimeTakenSec]   INT             NULL,
    [CompletedAt]    DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_QuizResults_Users]
    FOREIGN KEY ([UserId])
    REFERENCES [dbo].[Users]([Id]),

    CONSTRAINT [FK_QuizResults_Sets]
    FOREIGN KEY ([SetId])
    REFERENCES [dbo].[QuestionSets]([Id])
);

-- =============================================
-- MODULE PROGRESS
-- =============================================
CREATE TABLE [dbo].[ModuleProgress] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [UserId]        INT             NOT NULL,
    [ModuleId]      INT             NOT NULL,
    [IsCompleted]   BIT             NOT NULL DEFAULT 0,
    [CompletedAt]   DATETIME2       NULL,

    CONSTRAINT [FK_ModuleProgress_Users]
    FOREIGN KEY ([UserId])
    REFERENCES [dbo].[Users]([Id]),

    CONSTRAINT [FK_ModuleProgress_Modules]
    FOREIGN KEY ([ModuleId])
    REFERENCES [dbo].[Modules]([Id]),

    CONSTRAINT [UQ_ModuleProgress]
    UNIQUE ([UserId], [ModuleId])
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

    CONSTRAINT [FK_ForumThreads_Users]
    FOREIGN KEY ([AuthorId])
    REFERENCES [dbo].[Users]([Id])
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

    CONSTRAINT [FK_ForumReplies_Threads]
    FOREIGN KEY ([ThreadId])
    REFERENCES [dbo].[ForumThreads]([Id]),

    CONSTRAINT [FK_ForumReplies_Users]
    FOREIGN KEY ([AuthorId])
    REFERENCES [dbo].[Users]([Id])
);

-- =============================================
-- SUBMISSIONS
-- =============================================
CREATE TABLE [dbo].[Submissions] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [Title]         NVARCHAR(200)   NOT NULL,
    [Chapter]       NVARCHAR(100)   NULL,
    [Difficulty]    NVARCHAR(20)    NULL,
    [Status]        NVARCHAR(20)    NOT NULL DEFAULT 'pending',
    [Reason]        NVARCHAR(500)   NULL,
    [InstructorId]  INT             NOT NULL,
    [CreatedAt]     DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_Submissions_Users]
    FOREIGN KEY ([InstructorId])
    REFERENCES [dbo].[Users]([Id]),

    CONSTRAINT [CK_Submissions_Status]
    CHECK ([Status] IN ('pending','approved','rejected'))
);

-- =============================================
-- BADGES
-- =============================================
CREATE TABLE [dbo].[Badges] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [Name]          NVARCHAR(100)   NOT NULL,
    [Icon]          NVARCHAR(50)    NULL,
    [Description]   NVARCHAR(255)   NULL
);

-- =============================================
-- USER BADGES
-- =============================================
CREATE TABLE [dbo].[UserBadges] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [UserId]        INT             NOT NULL,
    [BadgeId]       INT             NOT NULL,
    [EarnedAt]      DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_UserBadges_Users]
    FOREIGN KEY ([UserId])
    REFERENCES [dbo].[Users]([Id]),

    CONSTRAINT [FK_UserBadges_Badges]
    FOREIGN KEY ([BadgeId])
    REFERENCES [dbo].[Badges]([Id]),

    CONSTRAINT [UQ_UserBadges]
    UNIQUE ([UserId], [BadgeId])
);

-- =============================================
-- PARENT-STUDENT LINKS
-- =============================================
CREATE TABLE [dbo].[ParentStudentLinks] (
    [Id]            INT IDENTITY(1,1) PRIMARY KEY,
    [ParentId]      INT             NOT NULL,
    [StudentId]     INT             NOT NULL,
    [LinkedAt]      DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_PSL_Parent]
    FOREIGN KEY ([ParentId])
    REFERENCES [dbo].[Users]([Id]),

    CONSTRAINT [FK_PSL_Student]
    FOREIGN KEY ([StudentId])
    REFERENCES [dbo].[Users]([Id]),

    CONSTRAINT [UQ_ParentStudent]
    UNIQUE ([ParentId], [StudentId])
);

-- =============================================
-- SEED DATA (FIXED WITH HASHING)
-- =============================================

INSERT INTO [dbo].[Users]
([Name], [Email], [PasswordHash], [Role], [Avatar])
VALUES
(
    'Alex Student',
    'student@demo.com',
    CONVERT(NVARCHAR(256), HASHBYTES('SHA2_256', 'demo123'), 2),
    'student',
    'student'
),
(
    'Sarah Parent',
    'parent@demo.com',
    CONVERT(NVARCHAR(256), HASHBYTES('SHA2_256', 'demo123'), 2),
    'parent',
    'parent'
),
(
    'Robert Instructor',
    'instructor@demo.com',
    CONVERT(NVARCHAR(256), HASHBYTES('SHA2_256', 'demo123'), 2),
    'instructor',
    'instructor'
),
(
    'Admin User',
    'admin@demo.com',
    CONVERT(NVARCHAR(256), HASHBYTES('SHA2_256', 'demo123'), 2),
    'admin',
    'admin'
);
INSERT INTO [dbo].[Formulas]
([Name], [Rule], [Description], [SortOrder])
VALUES
('SF+4', '+5 - 1', 'Small Friend +4', 1);

DECLARE @fid INT = SCOPE_IDENTITY();

INSERT INTO [dbo].[Modules]
([FormulaId], [ModuleKey], [Title], [Icon], [Description],
 [UseAbacus], [MentalMode], [IsTimed], [TimeLimitSec], [SortOrder])
VALUES
(@fid, 'learning',       'A. Learning Module',     'book',
 'Learn how the abacus moves for this formula',
 1, 0, 0, NULL, 1),

(@fid, 'exerciseAbacus', 'B. Exercise (Abacus)',   'abacus',
 'Solve using the abacus',
 1, 0, 0, NULL, 2),

(@fid, 'exerciseMental', 'C. Exercise (Mental)',   'brain',
 'No abacus. Imagine the beads moving mentally.',
 0, 1, 0, NULL, 3),

(@fid, 'preparation',    'D. Preparation',         'prep',
 'Prepare for the final assessment.',
 0, 1, 0, NULL, 4),

(@fid, 'assessment',     'E. Assessment',          'trophy',
 'Timed final assessment.',
 0, 1, 1, 60, 5);

PRINT 'MathlingDB schema created successfully!';
GO