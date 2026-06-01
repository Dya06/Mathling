USE MathlingDB;
GO

IF COL_LENGTH('dbo.Submissions', 'ModuleId') IS NULL
BEGIN
    ALTER TABLE [dbo].[Submissions] ADD [ModuleId] VARCHAR(10) NULL;
END
GO

IF COL_LENGTH('dbo.Submissions', 'Label') IS NULL
BEGIN
    ALTER TABLE [dbo].[Submissions] ADD [Label] NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('dbo.Submissions', 'DisplayMode') IS NULL
BEGIN
    ALTER TABLE [dbo].[Submissions] ADD [DisplayMode] NVARCHAR(20) NULL;
END
GO

IF COL_LENGTH('dbo.Submissions', 'SortOrder') IS NULL
BEGIN
    ALTER TABLE [dbo].[Submissions] ADD [SortOrder] INT NULL;
END
GO

IF COL_LENGTH('dbo.Submissions', 'LiveSetId') IS NULL
BEGIN
    ALTER TABLE [dbo].[Submissions] ADD [LiveSetId] VARCHAR(10) NULL;
END
GO

IF OBJECT_ID('dbo.SubmissionQuestions', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SubmissionQuestions] (
        [Id]            VARCHAR(10)     NOT NULL PRIMARY KEY,
        [SubmissionId]  VARCHAR(10)     NOT NULL,
        [Answer]        INT             NOT NULL,
        [SortOrder]     INT             NOT NULL,

        CONSTRAINT [FK_SubmissionQuestions_Submissions]
        FOREIGN KEY ([SubmissionId])
        REFERENCES [dbo].[Submissions]([Id])
    );
END
GO

IF OBJECT_ID('dbo.SubmissionQuestionRows', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SubmissionQuestionRows] (
        [Id]                    VARCHAR(10)     NOT NULL PRIMARY KEY,
        [SubmissionQuestionId]  VARCHAR(10)     NOT NULL,
        [Value]                 INT             NOT NULL,
        [SortOrder]             INT             NOT NULL,

        CONSTRAINT [FK_SubmissionQuestionRows_SubmissionQuestions]
        FOREIGN KEY ([SubmissionQuestionId])
        REFERENCES [dbo].[SubmissionQuestions]([Id])
    );
END
GO

PRINT 'Moderation pipeline migration completed.';
GO
