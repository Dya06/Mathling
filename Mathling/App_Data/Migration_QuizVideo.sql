USE MathlingDB;
GO

IF COL_LENGTH('dbo.Submissions', 'VideoUrl') IS NULL
BEGIN
    ALTER TABLE [dbo].[Submissions] ADD [VideoUrl] NVARCHAR(500) NULL;
END
GO

IF COL_LENGTH('dbo.QuestionSets', 'VideoUrl') IS NULL
BEGIN
    ALTER TABLE [dbo].[QuestionSets] ADD [VideoUrl] NVARCHAR(500) NULL;
END
GO

PRINT 'Quiz video migration completed.';
GO
