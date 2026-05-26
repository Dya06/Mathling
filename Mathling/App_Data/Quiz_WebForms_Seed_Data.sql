USE MathlingDB;
GO

DECLARE @FormulaId INT;

SELECT @FormulaId = [Id]
FROM [Formulas]
WHERE [Name] = 'SF+4';

IF @FormulaId IS NULL
BEGIN
    INSERT INTO [Formulas] ([Name], [Rule], [Description], [SortOrder], [IsActive])
    VALUES ('SF+4', '+5 - 1', 'Small Friend +4', 1, 1);

    SET @FormulaId = SCOPE_IDENTITY();
END

IF NOT EXISTS (SELECT 1 FROM Modules WHERE FormulaId = @FormulaId AND ModuleKey = 'learning')
    INSERT INTO Modules (FormulaId, ModuleKey, Title, Icon, Description, UseAbacus, MentalMode, IsTimed, TimeLimitSec, SortOrder)
    VALUES (@FormulaId, 'learning', 'A. Learning Module', 'book', 'Learn how the abacus moves for this formula', 1, 0, 0, NULL, 1);

IF NOT EXISTS (SELECT 1 FROM Modules WHERE FormulaId = @FormulaId AND ModuleKey = 'exerciseAbacus')
    INSERT INTO Modules (FormulaId, ModuleKey, Title, Icon, Description, UseAbacus, MentalMode, IsTimed, TimeLimitSec, SortOrder)
    VALUES (@FormulaId, 'exerciseAbacus', 'B. Exercise (Abacus)', 'abacus', 'Solve using the abacus', 1, 0, 0, NULL, 2);

IF NOT EXISTS (SELECT 1 FROM Modules WHERE FormulaId = @FormulaId AND ModuleKey = 'exerciseMental')
    INSERT INTO Modules (FormulaId, ModuleKey, Title, Icon, Description, UseAbacus, MentalMode, IsTimed, TimeLimitSec, SortOrder)
    VALUES (@FormulaId, 'exerciseMental', 'C. Exercise (Mental)', 'brain', 'No abacus. Imagine the beads moving mentally.', 0, 1, 0, NULL, 3);

IF NOT EXISTS (SELECT 1 FROM Modules WHERE FormulaId = @FormulaId AND ModuleKey = 'preparation')
    INSERT INTO Modules (FormulaId, ModuleKey, Title, Icon, Description, UseAbacus, MentalMode, IsTimed, TimeLimitSec, SortOrder)
    VALUES (@FormulaId, 'preparation', 'D. Preparation', 'prep', 'Prepare for the final assessment.', 0, 1, 0, NULL, 4);

IF NOT EXISTS (SELECT 1 FROM Modules WHERE FormulaId = @FormulaId AND ModuleKey = 'assessment')
    INSERT INTO Modules (FormulaId, ModuleKey, Title, Icon, Description, UseAbacus, MentalMode, IsTimed, TimeLimitSec, SortOrder)
    VALUES (@FormulaId, 'assessment', 'E. Assessment', 'trophy', 'Timed final assessment.', 0, 1, 1, 60, 5);

/* Clear only SF+4 quiz sets/questions so the script can be rerun safely. */
DELETE qr
FROM QuestionRows qr
INNER JOIN Questions q ON qr.QuestionId = q.Id
INNER JOIN QuestionSets qs ON q.SetId = qs.Id
INNER JOIN Modules m ON qs.ModuleId = m.Id
WHERE m.FormulaId = @FormulaId;

DELETE q
FROM Questions q
INNER JOIN QuestionSets qs ON q.SetId = qs.Id
INNER JOIN Modules m ON qs.ModuleId = m.Id
WHERE m.FormulaId = @FormulaId;

DELETE qs
FROM QuestionSets qs
INNER JOIN Modules m ON qs.ModuleId = m.Id
WHERE m.FormulaId = @FormulaId;

DECLARE @ModuleId INT, @SetId INT, @QuestionId INT;

/* A. Learning Module */
SELECT @ModuleId = Id FROM Modules WHERE FormulaId = @FormulaId AND ModuleKey = 'learning';
INSERT INTO QuestionSets (ModuleId, Label, DisplayMode, SortOrder) VALUES (@ModuleId, 'Set 1 — Static', 'static', 1);
SET @SetId = SCOPE_IDENTITY();

INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 5, 1); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 2, 1), (@QuestionId, 1, 2), (@QuestionId, -2, 3), (@QuestionId, 4, 4);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 6, 2); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 1, 1), (@QuestionId, 4, 2), (@QuestionId, 2, 3), (@QuestionId, -1, 4);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 7, 3); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 4, 1), (@QuestionId, 4, 2), (@QuestionId, 1, 3), (@QuestionId, -2, 4);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 7, 4); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 6, 1), (@QuestionId, 2, 2), (@QuestionId, -5, 3), (@QuestionId, 4, 4);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 5, 5); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 9, 1), (@QuestionId, -5, 2), (@QuestionId, 4, 3), (@QuestionId, -3, 4);

INSERT INTO QuestionSets (ModuleId, Label, DisplayMode, SortOrder) VALUES (@ModuleId, 'Set 2 — Flash', 'flash', 2);
SET @SetId = SCOPE_IDENTITY();
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 8, 1); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 3, 1), (@QuestionId, 4, 2), (@QuestionId, 2, 3), (@QuestionId, -1, 4);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 6, 2); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 7, 1), (@QuestionId, -5, 2), (@QuestionId, 4, 3);

/* B. Exercise Abacus */
SELECT @ModuleId = Id FROM Modules WHERE FormulaId = @FormulaId AND ModuleKey = 'exerciseAbacus';
INSERT INTO QuestionSets (ModuleId, Label, DisplayMode, SortOrder) VALUES (@ModuleId, 'EA Set 1 — Static', 'static', 1);
SET @SetId = SCOPE_IDENTITY();
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 9, 1); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 5, 1), (@QuestionId, 4, 2);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 4, 2); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 1, 1), (@QuestionId, 4, 2), (@QuestionId, -1, 3);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 7, 3); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 3, 1), (@QuestionId, 4, 2);

INSERT INTO QuestionSets (ModuleId, Label, DisplayMode, SortOrder) VALUES (@ModuleId, 'EA Set 2 — Static', 'static', 2);
SET @SetId = SCOPE_IDENTITY();
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 8, 1); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 4, 1), (@QuestionId, 4, 2);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 6, 2); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 2, 1), (@QuestionId, 4, 2);

/* C. Exercise Mental */
SELECT @ModuleId = Id FROM Modules WHERE FormulaId = @FormulaId AND ModuleKey = 'exerciseMental';
INSERT INTO QuestionSets (ModuleId, Label, DisplayMode, SortOrder) VALUES (@ModuleId, 'EM Set 1 — Flash', 'flash', 1);
SET @SetId = SCOPE_IDENTITY();
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 7, 1); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 1, 1), (@QuestionId, 4, 2), (@QuestionId, 2, 3);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 5, 2); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 8, 1), (@QuestionId, -5, 2), (@QuestionId, 4, 3), (@QuestionId, -2, 4);

INSERT INTO QuestionSets (ModuleId, Label, DisplayMode, SortOrder) VALUES (@ModuleId, 'EM Set 2 — Flash', 'flash', 2);
SET @SetId = SCOPE_IDENTITY();
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 9, 1); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 4, 1), (@QuestionId, 4, 2), (@QuestionId, 1, 3);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 6, 2); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 9, 1), (@QuestionId, -5, 2), (@QuestionId, 4, 3), (@QuestionId, -2, 4);

/* D. Preparation */
SELECT @ModuleId = Id FROM Modules WHERE FormulaId = @FormulaId AND ModuleKey = 'preparation';
INSERT INTO QuestionSets (ModuleId, Label, DisplayMode, SortOrder) VALUES (@ModuleId, 'Preparation', 'flash', 1);
SET @SetId = SCOPE_IDENTITY();
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 7, 1); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 3, 1), (@QuestionId, 4, 2), (@QuestionId, -2, 3), (@QuestionId, 1, 4), (@QuestionId, 1, 5);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 8, 2); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 2, 1), (@QuestionId, 4, 2), (@QuestionId, 1, 3), (@QuestionId, -1, 4), (@QuestionId, 2, 5);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 5, 3); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 6, 1), (@QuestionId, -5, 2), (@QuestionId, 4, 3), (@QuestionId, -1, 4), (@QuestionId, 1, 5);

/* E. Assessment */
SELECT @ModuleId = Id FROM Modules WHERE FormulaId = @FormulaId AND ModuleKey = 'assessment';
INSERT INTO QuestionSets (ModuleId, Label, DisplayMode, SortOrder) VALUES (@ModuleId, 'Final Assessment', 'flash', 1);
SET @SetId = SCOPE_IDENTITY();
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 9, 1); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 5, 1), (@QuestionId, 4, 2), (@QuestionId, -3, 3), (@QuestionId, 2, 4), (@QuestionId, 1, 5);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 6, 2); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 1, 1), (@QuestionId, 4, 2), (@QuestionId, -2, 3), (@QuestionId, 3, 4), (@QuestionId, 0, 5);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 8, 3); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 4, 1), (@QuestionId, 4, 2), (@QuestionId, -1, 3), (@QuestionId, 1, 4), (@QuestionId, 0, 5);
INSERT INTO Questions (SetId, Answer, SortOrder) VALUES (@SetId, 7, 4); SET @QuestionId = SCOPE_IDENTITY();
INSERT INTO QuestionRows (QuestionId, Value, SortOrder) VALUES (@QuestionId, 9, 1), (@QuestionId, -5, 2), (@QuestionId, 4, 3), (@QuestionId, -1, 4), (@QuestionId, 0, 5);

PRINT 'Quiz Web Forms seed data inserted successfully.';
GO
