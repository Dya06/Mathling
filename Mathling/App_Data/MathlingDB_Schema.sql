-- =========================================================================
-- STEP 1: FORCE CLOSE ALL APPS USING MATHLINGDB AND WIPE IT CLEAN
-- =========================================================================
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'MathlingDB')
BEGIN
    ALTER DATABASE MathlingDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MathlingDB;
END
GO

-- =========================================================================
-- STEP 2: CREATE DATABASE
-- =========================================================================
CREATE DATABASE MathlingDB;
GO

USE MathlingDB;
GO

-- =========================================================================
-- USERS
-- =========================================================================
CREATE TABLE [dbo].[Users] (
    [Id]            INT             IDENTITY(1,1) NOT NULL PRIMARY KEY,
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
GO

-- =========================================================================
-- FORMULAS
-- =========================================================================
CREATE TABLE [dbo].[Formulas] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [Name]          NVARCHAR(50)    NOT NULL UNIQUE,
    [Rule]          NVARCHAR(100)   NOT NULL,
    [Description]   NVARCHAR(255)   NULL,
    [SortOrder]     INT             NOT NULL DEFAULT 0,
    [IsActive]      BIT             NOT NULL DEFAULT 1
);
GO

-- =========================================================================
-- BADGES
-- =========================================================================
CREATE TABLE [dbo].[Badges] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [Name]          NVARCHAR(100)   NOT NULL,
    [Icon]          NVARCHAR(50)    NULL,
    [Description]   NVARCHAR(255)   NULL
);
GO

-- =========================================================================
-- MODULES
-- =========================================================================
CREATE TABLE [dbo].[Modules] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [FormulaId]     VARCHAR(10)     NOT NULL,
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
GO

-- =========================================================================
-- QUESTION SETS
-- =========================================================================
CREATE TABLE [dbo].[QuestionSets] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [ModuleId]      VARCHAR(10)     NOT NULL,
    [Label]         NVARCHAR(100)   NOT NULL,
    [DisplayMode]   NVARCHAR(20)    NOT NULL DEFAULT 'static',
    [SortOrder]     INT             NOT NULL DEFAULT 0,
    [VideoUrl]      NVARCHAR(500)   NULL,

    CONSTRAINT [FK_QuestionSets_Modules]
    FOREIGN KEY ([ModuleId])
    REFERENCES [dbo].[Modules]([Id]),

    CONSTRAINT [CK_QuestionSets_Mode]
    CHECK ([DisplayMode] IN ('static','flash'))
);
GO

-- =========================================================================
-- QUESTIONS
-- =========================================================================
CREATE TABLE [dbo].[Questions] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [SetId]         VARCHAR(10)     NOT NULL,
    [Answer]        INT             NOT NULL,
    [SortOrder]     INT             NOT NULL DEFAULT 0,

    CONSTRAINT [FK_Questions_Sets]
    FOREIGN KEY ([SetId])
    REFERENCES [dbo].[QuestionSets]([Id])
);
GO

-- =========================================================================
-- QUESTION ROWS
-- =========================================================================
CREATE TABLE [dbo].[QuestionRows] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [QuestionId]    VARCHAR(10)     NOT NULL,
    [Value]         INT             NOT NULL,
    [SortOrder]     INT             NOT NULL DEFAULT 0,

    CONSTRAINT [FK_QuestionRows_Questions]
    FOREIGN KEY ([QuestionId])
    REFERENCES [dbo].[Questions]([Id])
);
GO

-- =========================================================================
-- QUIZ RESULTS
-- =========================================================================
CREATE TABLE [dbo].[QuizResults] (
    [Id]             VARCHAR(10)    NOT NULL PRIMARY KEY,
    [UserId]         INT            NOT NULL,
    [SetId]          VARCHAR(10)    NOT NULL,
    [Score]          INT            NOT NULL DEFAULT 0,
    [TotalCorrect]   INT            NOT NULL DEFAULT 0,
    [TotalQuestions] INT            NOT NULL DEFAULT 0,
    [Percentage]     DECIMAL(5,2)   NULL,
    [TimeTakenSec]   INT            NULL,
    [CompletedAt]    DATETIME2      NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_QuizResults_Users]
    FOREIGN KEY ([UserId])
    REFERENCES [dbo].[Users]([Id]),

    CONSTRAINT [FK_QuizResults_Sets]
    FOREIGN KEY ([SetId])
    REFERENCES [dbo].[QuestionSets]([Id])
);
GO

-- =========================================================================
-- MODULE PROGRESS
-- =========================================================================
CREATE TABLE [dbo].[ModuleProgress] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [UserId]        INT             NOT NULL,
    [ModuleId]      VARCHAR(10)     NOT NULL,
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
GO

-- =========================================================================
-- FORUM THREADS
-- =========================================================================
CREATE TABLE [dbo].[ForumThreads] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [Title]         NVARCHAR(200)   NOT NULL,
    [Content]       NVARCHAR(MAX)   NOT NULL,
    [Category]      NVARCHAR(50)    NOT NULL DEFAULT 'General',
    [AuthorId]      INT             NOT NULL,
    [CreatedAt]     DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT [FK_ForumThreads_Users]
    FOREIGN KEY ([AuthorId])
    REFERENCES [dbo].[Users]([Id])
);
GO

-- =========================================================================
-- FORUM REPLIES
-- =========================================================================
CREATE TABLE [dbo].[ForumReplies] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [ThreadId]      VARCHAR(10)     NOT NULL,
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
GO

-- =========================================================================
-- SUBMISSIONS
-- =========================================================================
CREATE TABLE [dbo].[Submissions] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [Title]         NVARCHAR(200)   NOT NULL,
    [Chapter]       NVARCHAR(100)   NULL,
    [Difficulty]    NVARCHAR(20)    NULL,
    [Status]        NVARCHAR(20)    NOT NULL DEFAULT 'pending',
    [Reason]        NVARCHAR(500)   NULL,
    [InstructorId]  INT             NOT NULL,
    [CreatedAt]     DATETIME2       NOT NULL DEFAULT GETDATE(),
    [ModuleId]      VARCHAR(10)     NULL,
    [Label]         NVARCHAR(100)   NULL,
    [DisplayMode]   NVARCHAR(20)    NULL,
    [SortOrder]     INT             NULL,
    [LiveSetId]     VARCHAR(10)     NULL,
    [VideoUrl]      NVARCHAR(500)   NULL,

    CONSTRAINT [FK_Submissions_Users]
    FOREIGN KEY ([InstructorId])
    REFERENCES [dbo].[Users]([Id]),

    CONSTRAINT [FK_Submissions_Modules]
    FOREIGN KEY ([ModuleId])
    REFERENCES [dbo].[Modules]([Id]),

    CONSTRAINT [CK_Submissions_Status]
    CHECK ([Status] IN ('pending','approved','rejected'))
);
GO

-- =========================================================================
-- SUBMISSION QUESTIONS (draft questions before admin approval)
-- =========================================================================
CREATE TABLE [dbo].[SubmissionQuestions] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [SubmissionId]  VARCHAR(10)     NOT NULL,
    [Answer]        INT             NOT NULL,
    [SortOrder]     INT             NOT NULL,

    CONSTRAINT [FK_SubmissionQuestions_Submissions]
    FOREIGN KEY ([SubmissionId])
    REFERENCES [dbo].[Submissions]([Id])
);
GO

-- =========================================================================
-- SUBMISSION QUESTION ROWS (draft row values before admin approval)
-- =========================================================================
CREATE TABLE [dbo].[SubmissionQuestionRows] (
    [Id]                    VARCHAR(10)     NOT NULL PRIMARY KEY,
    [SubmissionQuestionId]  VARCHAR(10)     NOT NULL,
    [Value]                 INT             NOT NULL,
    [SortOrder]             INT             NOT NULL,

    CONSTRAINT [FK_SubmissionQuestionRows_SubmissionQuestions]
    FOREIGN KEY ([SubmissionQuestionId])
    REFERENCES [dbo].[SubmissionQuestions]([Id])
);
GO

-- =========================================================================
-- USER BADGES
-- =========================================================================
CREATE TABLE [dbo].[UserBadges] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
    [UserId]        INT             NOT NULL,
    [BadgeId]       VARCHAR(10)     NOT NULL,
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
GO

-- =========================================================================
-- PARENT STUDENT LINKS
-- =========================================================================
CREATE TABLE [dbo].[ParentStudentLinks] (
    [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
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
GO

-- =========================================================================
-- SEED USERS
-- =========================================================================
INSERT INTO [dbo].[Users]
([Name],[Email],[PasswordHash],[Role],[Avatar])
VALUES
('Alex Student',      'student@demo.com',    CONVERT(NVARCHAR(256), HASHBYTES('SHA2_256', 'demo123'), 2), 'student',    'student'),
('Jeff Student',      'student2@demo.com',    CONVERT(NVARCHAR(256), HASHBYTES('SHA2_256', 'demo123'), 2), 'student',    'student'),
('Sarah Parent',      'parent@demo.com',     CONVERT(NVARCHAR(256), HASHBYTES('SHA2_256', 'demo123'), 2), 'parent',     'parent'),
('Robert Instructor', 'instructor@demo.com', CONVERT(NVARCHAR(256), HASHBYTES('SHA2_256', 'demo123'), 2), 'instructor', 'instructor'),
('Admin User',        'admin@demo.com',      CONVERT(NVARCHAR(256), HASHBYTES('SHA2_256', 'demo123'), 2), 'admin',      'admin');
GO

-- =========================================================================
-- SEED FORMULAS
-- =========================================================================
INSERT INTO [dbo].[Formulas]
([Id],[Name],[Rule],[Description],[SortOrder])
VALUES
('001', 'SF+4', '+5 - 1', 'Small Friend +4', 1);
GO

-- =========================================================================
-- SEED MODULES
-- =========================================================================
INSERT INTO [dbo].[Modules]
([Id],[FormulaId],[ModuleKey],[Title],[Icon],[Description],[UseAbacus],[MentalMode],[IsTimed],[TimeLimitSec],[SortOrder])
VALUES
('001', '001', 'learning',       'A. Learning Module',   'book',   'Learn how the abacus moves for this formula', 1, 0, 0, NULL, 1),
('002', '001', 'exerciseAbacus', 'B. Exercise (Abacus)', 'abacus', 'Solve using the abacus',                      1, 0, 0, NULL, 2),
('003', '001', 'exerciseMental', 'C. Exercise (Mental)', 'brain',  'No abacus. Imagine the beads moving mentally.',0, 1, 0, NULL, 3),
('004', '001', 'preparation',    'D. Preparation',       'prep',   'Prepare for the final assessment.',           0, 1, 0, NULL, 4),
('005', '001', 'assessment',     'E. Assessment',        'trophy', 'Timed final assessment.',                     0, 1, 1, 60,   5);
GO

PRINT 'MathlingDB rebuilt successfully with all missing tables restored!';
GO