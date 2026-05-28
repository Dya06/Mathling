-- =========================================================================
-- MIGRATION: Quiz Pipeline — Add moderation columns to QuestionSets
-- Run this against MathlingDB in SSMS before deploying the new code.
-- =========================================================================

USE MathlingDB;
GO

-- Add Status column (pending/approved/rejected)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('QuestionSets') AND name = 'Status')
BEGIN
    ALTER TABLE [dbo].[QuestionSets] ADD [Status] NVARCHAR(20) NOT NULL DEFAULT 'approved';
END
GO

-- Add CreatedBy column (FK to Users, NULL for seed data)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('QuestionSets') AND name = 'CreatedBy')
BEGIN
    ALTER TABLE [dbo].[QuestionSets] ADD [CreatedBy] INT NULL;
END
GO

-- Add SubmittedAt column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('QuestionSets') AND name = 'SubmittedAt')
BEGIN
    ALTER TABLE [dbo].[QuestionSets] ADD [SubmittedAt] DATETIME2 NULL DEFAULT GETDATE();
END
GO

-- Add Reason column (for rejection reasons)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('QuestionSets') AND name = 'Reason')
BEGIN
    ALTER TABLE [dbo].[QuestionSets] ADD [Reason] NVARCHAR(500) NULL;
END
GO

-- Mark all existing quiz content as approved
UPDATE [dbo].[QuestionSets] SET [Status] = 'approved' WHERE [Status] IS NULL OR [Status] = '';
GO

PRINT 'Migration complete: QuestionSets now has Status, CreatedBy, SubmittedAt, and Reason columns.';
GO
