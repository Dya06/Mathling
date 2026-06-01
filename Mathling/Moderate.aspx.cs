using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.Services;
using System.Web.UI;

namespace Mathling
{
    public partial class Moderate : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
        }

        // ---- DTOs ----
        public class FormulaDto
        {
            public string id { get; set; }
            public string name { get; set; }
            public string rule { get; set; }
        }

        public class ModuleDto
        {
            public string id { get; set; }
            public string formulaId { get; set; }
            public string title { get; set; }
            public string moduleKey { get; set; }
        }

        public class SubmissionItem
        {
            public string id { get; set; }
            public string label { get; set; }
            public string formulaName { get; set; }
            public string moduleTitle { get; set; }
            public string displayMode { get; set; }
            public string status { get; set; }
            public string reason { get; set; }
            public string instructor { get; set; }
            public int questionCount { get; set; }
            public string date { get; set; }
        }

        public class QuestionInput
        {
            public List<int> rows { get; set; }
            public int answer { get; set; }
        }

        [WebMethod]
        public static List<FormulaDto> GetFormulas()
        {
            var formulas = new List<FormulaDto>();
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                using (SqlCommand cmd = new SqlCommand("SELECT [Id], [Name], [Rule] FROM [Formulas] WHERE [IsActive] = 1 ORDER BY [SortOrder]", conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        formulas.Add(new FormulaDto
                        {
                            id = reader["Id"].ToString(),
                            name = reader["Name"].ToString(),
                            rule = reader["Rule"].ToString()
                        });
                    }
                }
            }

            return formulas;
        }

        [WebMethod]
        public static List<ModuleDto> GetModules(string formulaId)
        {
            var modules = new List<ModuleDto>();
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                using (SqlCommand cmd = new SqlCommand("SELECT [Id], [FormulaId], [Title], [ModuleKey] FROM [Modules] WHERE [FormulaId] = @FormulaId ORDER BY [SortOrder]", conn))
                {
                    cmd.Parameters.AddWithValue("@FormulaId", formulaId);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            modules.Add(new ModuleDto
                            {
                                id = reader["Id"].ToString(),
                                formulaId = reader["FormulaId"].ToString(),
                                title = reader["Title"].ToString(),
                                moduleKey = reader["ModuleKey"].ToString()
                            });
                        }
                    }
                }
            }

            return modules;
        }

        // Long-term moderation flow:
        // Instructor-created quiz sets are saved into Submissions + SubmissionQuestions + SubmissionQuestionRows.
        // They are NOT inserted into QuestionSets until an admin approves them.
        [WebMethod(EnableSession = true)]
        public static string SubmitQuiz(string moduleId, string label, string displayMode, string questionsJson)
        {
            try
            {
                string userId = HttpContext.Current.Session["UserId"]?.ToString();
                string role = HttpContext.Current.Session["UserRole"]?.ToString();

                if (string.IsNullOrWhiteSpace(userId)) return "error|Not logged in";
                if (!string.Equals(role, "instructor", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase))
                    return "error|Only instructors can submit quizzes";

                if (string.IsNullOrWhiteSpace(moduleId)) return "error|Please select a module";
                if (string.IsNullOrWhiteSpace(label)) return "error|Please enter a set label";
                if (string.IsNullOrWhiteSpace(displayMode)) displayMode = "static";

                var serializer = new JavaScriptSerializer();
                var questions = serializer.Deserialize<List<QuestionInput>>(questionsJson);

                if (questions == null || questions.Count == 0) return "error|No questions provided";

                string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

                using (SqlConnection conn = new SqlConnection(connStr))
                {
                    conn.Open();

                    EnsureModerationTables(conn);

                    int nextSort = 1;
                    using (SqlCommand cmd = new SqlCommand(@"
                        SELECT ISNULL(MAX([SortOrder]), 0) + 1
                        FROM [QuestionSets]
                        WHERE [ModuleId] = @ModuleId", conn))
                    {
                        cmd.Parameters.AddWithValue("@ModuleId", moduleId);
                        nextSort = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    string submissionId = GenerateId("SUB", 10);
                    using (SqlTransaction trans = conn.BeginTransaction())
                    {
                        try
                        {
                            using (SqlCommand cmd = new SqlCommand(@"
                                INSERT INTO [Submissions]
                                (
                                    [Id], [Title], [Chapter], [Difficulty], [Status], [Reason],
                                    [InstructorId], [CreatedAt], [ModuleId], [Label], [DisplayMode], [SortOrder], [LiveSetId]
                                )
                                VALUES
                                (
                                    @Id, @Title, @Chapter, @Difficulty, 'pending', NULL,
                                    @InstructorId, GETDATE(), @ModuleId, @Label, @DisplayMode, @SortOrder, NULL
                                )", conn, trans))
                            {
                                cmd.Parameters.AddWithValue("@Id", submissionId);
                                cmd.Parameters.AddWithValue("@Title", label);
                                cmd.Parameters.AddWithValue("@Chapter", moduleId);
                                cmd.Parameters.AddWithValue("@Difficulty", displayMode);
                                cmd.Parameters.AddWithValue("@InstructorId", Convert.ToInt32(userId));
                                cmd.Parameters.AddWithValue("@ModuleId", moduleId);
                                cmd.Parameters.AddWithValue("@Label", label);
                                cmd.Parameters.AddWithValue("@DisplayMode", displayMode);
                                cmd.Parameters.AddWithValue("@SortOrder", nextSort);
                                cmd.ExecuteNonQuery();
                            }

                            for (int qi = 0; qi < questions.Count; qi++)
                            {
                                if (questions[qi].rows == null || questions[qi].rows.Count == 0)
                                    throw new Exception("Question " + (qi + 1) + " has no rows");

                                string submissionQuestionId = GenerateId("SQ", 10);
                                using (SqlCommand cmd = new SqlCommand(@"
                                    INSERT INTO [SubmissionQuestions] ([Id], [SubmissionId], [Answer], [SortOrder])
                                    VALUES (@Id, @SubmissionId, @Answer, @SortOrder)", conn, trans))
                                {
                                    cmd.Parameters.AddWithValue("@Id", submissionQuestionId);
                                    cmd.Parameters.AddWithValue("@SubmissionId", submissionId);
                                    cmd.Parameters.AddWithValue("@Answer", questions[qi].answer);
                                    cmd.Parameters.AddWithValue("@SortOrder", qi + 1);
                                    cmd.ExecuteNonQuery();
                                }

                                for (int ri = 0; ri < questions[qi].rows.Count; ri++)
                                {
                                    string rowId = GenerateId("SR", 10);
                                    using (SqlCommand cmd = new SqlCommand(@"
                                        INSERT INTO [SubmissionQuestionRows] ([Id], [SubmissionQuestionId], [Value], [SortOrder])
                                        VALUES (@Id, @SubmissionQuestionId, @Value, @SortOrder)", conn, trans))
                                    {
                                        cmd.Parameters.AddWithValue("@Id", rowId);
                                        cmd.Parameters.AddWithValue("@SubmissionQuestionId", submissionQuestionId);
                                        cmd.Parameters.AddWithValue("@Value", questions[qi].rows[ri]);
                                        cmd.Parameters.AddWithValue("@SortOrder", ri + 1);
                                        cmd.ExecuteNonQuery();
                                    }
                                }
                            }

                            trans.Commit();
                            return "success";
                        }
                        catch (Exception ex)
                        {
                            trans.Rollback();
                            return "error|" + ex.Message;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return "error|" + ex.Message;
            }
        }

        [WebMethod(EnableSession = true)]
        public static List<SubmissionItem> GetSubmissions(string userId, string role)
        {
            var subs = new List<SubmissionItem>();
            string sessionUserId = HttpContext.Current.Session["UserId"]?.ToString();
            string sessionRole = HttpContext.Current.Session["UserRole"]?.ToString();

            if (string.IsNullOrWhiteSpace(sessionUserId)) return subs;
            if (string.IsNullOrWhiteSpace(role)) role = sessionRole ?? "student";

            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                EnsureModerationTables(conn);

                string query = @"
                    SELECT 
                        s.[Id],
                        COALESCE(s.[Label], s.[Title]) AS [Label],
                        COALESCE(s.[DisplayMode], s.[Difficulty]) AS [DisplayMode],
                        s.[Status],
                        s.[Reason],
                        s.[CreatedAt],
                        f.[Name] AS [FormulaName],
                        m.[Title] AS [ModuleTitle],
                        u.[Name] AS [InstructorName],
                        (SELECT COUNT(*) FROM [SubmissionQuestions] sq WHERE sq.[SubmissionId] = s.[Id]) AS [QuestionCount]
                    FROM [Submissions] s
                    LEFT JOIN [Modules] m ON s.[ModuleId] = m.[Id]
                    LEFT JOIN [Formulas] f ON m.[FormulaId] = f.[Id]
                    LEFT JOIN [Users] u ON s.[InstructorId] = u.[Id]
                    WHERE (@Role = 'admin' OR s.[InstructorId] = @UserId)
                    ORDER BY
                        CASE s.[Status] WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
                        s.[CreatedAt] DESC,
                        s.[Id] DESC";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@UserId", Convert.ToInt32(sessionUserId));
                    cmd.Parameters.AddWithValue("@Role", string.Equals(sessionRole, "admin", StringComparison.OrdinalIgnoreCase) ? "admin" : "instructor");

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            subs.Add(new SubmissionItem
                            {
                                id = reader["Id"].ToString(),
                                label = reader["Label"].ToString(),
                                formulaName = reader["FormulaName"] != DBNull.Value ? reader["FormulaName"].ToString() : "",
                                moduleTitle = reader["ModuleTitle"] != DBNull.Value ? reader["ModuleTitle"].ToString() : "",
                                displayMode = reader["DisplayMode"] != DBNull.Value ? reader["DisplayMode"].ToString() : "",
                                status = reader["Status"].ToString(),
                                reason = reader["Reason"] != DBNull.Value ? reader["Reason"].ToString() : "",
                                instructor = reader["InstructorName"] != DBNull.Value ? reader["InstructorName"].ToString() : "Unknown",
                                questionCount = Convert.ToInt32(reader["QuestionCount"]),
                                date = reader["CreatedAt"] != DBNull.Value ? Convert.ToDateTime(reader["CreatedAt"]).ToString("yyyy-MM-dd") : ""
                            });
                        }
                    }
                }
            }

            return subs;
        }

        // Admin approve/reject. Approval copies the submission into the official QuestionSets tables.
        [WebMethod(EnableSession = true)]
        public static string UpdateStatus(string setId, string status, string reason)
        {
            if (HttpContext.Current.Session["UserRole"]?.ToString() != "admin")
                return "error|Unauthorized";

            if (string.IsNullOrWhiteSpace(setId)) return "error|Submission id missing";
            status = (status ?? "").ToLowerInvariant();

            if (status != "approved" && status != "rejected")
                return "error|Invalid status";

            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                EnsureModerationTables(conn);

                using (SqlTransaction trans = conn.BeginTransaction())
                {
                    try
                    {
                        if (status == "approved")
                        {
                            ApproveSubmissionIntoQuizTables(conn, trans, setId);
                            using (SqlCommand cmd = new SqlCommand(@"
                                UPDATE [Submissions]
                                SET [Status] = 'approved', [Reason] = NULL
                                WHERE [Id] = @Id", conn, trans))
                            {
                                cmd.Parameters.AddWithValue("@Id", setId);
                                if (cmd.ExecuteNonQuery() == 0) throw new Exception("Submission not found");
                            }
                        }
                        else
                        {
                            using (SqlCommand cmd = new SqlCommand(@"
                                UPDATE [Submissions]
                                SET [Status] = 'rejected', [Reason] = @Reason
                                WHERE [Id] = @Id", conn, trans))
                            {
                                cmd.Parameters.AddWithValue("@Reason", string.IsNullOrWhiteSpace(reason) ? (object)DBNull.Value : reason);
                                cmd.Parameters.AddWithValue("@Id", setId);
                                if (cmd.ExecuteNonQuery() == 0) throw new Exception("Submission not found");
                            }
                        }

                        trans.Commit();
                        return "success";
                    }
                    catch (Exception ex)
                    {
                        trans.Rollback();
                        return "error|" + ex.Message;
                    }
                }
            }
        }

        [WebMethod(EnableSession = true)]
        public static string DeleteContent(string setId)
        {
            if (HttpContext.Current.Session["UserRole"]?.ToString() != "admin")
                return "error|Unauthorized";

            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                EnsureModerationTables(conn);

                using (SqlTransaction trans = conn.BeginTransaction())
                {
                    try
                    {
                        string liveSetId = null;
                        using (SqlCommand cmd = new SqlCommand("SELECT [LiveSetId] FROM [Submissions] WHERE [Id] = @Id", conn, trans))
                        {
                            cmd.Parameters.AddWithValue("@Id", setId);
                            object val = cmd.ExecuteScalar();
                            if (val != null && val != DBNull.Value) liveSetId = val.ToString();
                        }

                        if (!string.IsNullOrWhiteSpace(liveSetId))
                        {
                            DeleteQuestionSet(conn, trans, liveSetId);
                        }

                        using (SqlCommand cmd = new SqlCommand(@"
                            DELETE FROM [SubmissionQuestionRows]
                            WHERE [SubmissionQuestionId] IN (
                                SELECT [Id] FROM [SubmissionQuestions] WHERE [SubmissionId] = @Id
                            )", conn, trans))
                        {
                            cmd.Parameters.AddWithValue("@Id", setId);
                            cmd.ExecuteNonQuery();
                        }

                        using (SqlCommand cmd = new SqlCommand("DELETE FROM [SubmissionQuestions] WHERE [SubmissionId] = @Id", conn, trans))
                        {
                            cmd.Parameters.AddWithValue("@Id", setId);
                            cmd.ExecuteNonQuery();
                        }

                        using (SqlCommand cmd = new SqlCommand("DELETE FROM [Submissions] WHERE [Id] = @Id", conn, trans))
                        {
                            cmd.Parameters.AddWithValue("@Id", setId);
                            if (cmd.ExecuteNonQuery() == 0) throw new Exception("Submission not found");
                        }

                        trans.Commit();
                        return "success";
                    }
                    catch (Exception ex)
                    {
                        trans.Rollback();
                        return "error|" + ex.Message;
                    }
                }
            }
        }

        private static void ApproveSubmissionIntoQuizTables(SqlConnection conn, SqlTransaction trans, string submissionId)
        {
            string moduleId = null;
            string label = null;
            string displayMode = null;
            int sortOrder = 1;
            string existingLiveSetId = null;

            using (SqlCommand cmd = new SqlCommand(@"
                SELECT [ModuleId], COALESCE([Label], [Title]) AS [Label],
                       COALESCE([DisplayMode], [Difficulty]) AS [DisplayMode],
                       ISNULL([SortOrder], 1) AS [SortOrder],
                       [LiveSetId]
                FROM [Submissions]
                WHERE [Id] = @Id", conn, trans))
            {
                cmd.Parameters.AddWithValue("@Id", submissionId);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    if (!reader.Read()) throw new Exception("Submission not found");

                    moduleId = reader["ModuleId"] != DBNull.Value ? reader["ModuleId"].ToString() : "";
                    label = reader["Label"].ToString();
                    displayMode = reader["DisplayMode"].ToString();
                    sortOrder = Convert.ToInt32(reader["SortOrder"]);
                    existingLiveSetId = reader["LiveSetId"] != DBNull.Value ? reader["LiveSetId"].ToString() : null;
                }
            }

            if (string.IsNullOrWhiteSpace(moduleId)) throw new Exception("Submission has no module");
            if (!string.IsNullOrWhiteSpace(existingLiveSetId)) return; // already approved/copied

            string liveSetId = GenerateId("S", 10);

            using (SqlCommand cmd = new SqlCommand(@"
                INSERT INTO [QuestionSets] ([Id], [ModuleId], [Label], [DisplayMode], [SortOrder])
                VALUES (@Id, @ModuleId, @Label, @DisplayMode, @SortOrder)", conn, trans))
            {
                cmd.Parameters.AddWithValue("@Id", liveSetId);
                cmd.Parameters.AddWithValue("@ModuleId", moduleId);
                cmd.Parameters.AddWithValue("@Label", label);
                cmd.Parameters.AddWithValue("@DisplayMode", displayMode);
                cmd.Parameters.AddWithValue("@SortOrder", sortOrder);
                cmd.ExecuteNonQuery();
            }

            var questionMap = new Dictionary<string, string>();

            using (SqlCommand cmd = new SqlCommand(@"
                SELECT [Id], [Answer], [SortOrder]
                FROM [SubmissionQuestions]
                WHERE [SubmissionId] = @SubmissionId
                ORDER BY [SortOrder]", conn, trans))
            {
                cmd.Parameters.AddWithValue("@SubmissionId", submissionId);
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        string submissionQuestionId = reader["Id"].ToString();
                        string liveQuestionId = GenerateId("Q", 10);
                        questionMap[submissionQuestionId] = liveQuestionId;
                    }
                }
            }

            foreach (var pair in questionMap)
            {
                int answer;
                int sortOrderQ;

                using (SqlCommand cmd = new SqlCommand(@"
                    SELECT [Answer], [SortOrder]
                    FROM [SubmissionQuestions]
                    WHERE [Id] = @Id", conn, trans))
                {
                    cmd.Parameters.AddWithValue("@Id", pair.Key);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (!reader.Read()) throw new Exception("Submission question missing");
                        answer = Convert.ToInt32(reader["Answer"]);
                        sortOrderQ = Convert.ToInt32(reader["SortOrder"]);
                    }
                }

                using (SqlCommand cmd = new SqlCommand(@"
                    INSERT INTO [Questions] ([Id], [SetId], [Answer], [SortOrder])
                    VALUES (@Id, @SetId, @Answer, @SortOrder)", conn, trans))
                {
                    cmd.Parameters.AddWithValue("@Id", pair.Value);
                    cmd.Parameters.AddWithValue("@SetId", liveSetId);
                    cmd.Parameters.AddWithValue("@Answer", answer);
                    cmd.Parameters.AddWithValue("@SortOrder", sortOrderQ);
                    cmd.ExecuteNonQuery();
                }

                var rowsToInsert = new List<Tuple<int, int>>();
                using (SqlCommand cmd = new SqlCommand(@"
                    SELECT [Value], [SortOrder]
                    FROM [SubmissionQuestionRows]
                    WHERE [SubmissionQuestionId] = @SubmissionQuestionId
                    ORDER BY [SortOrder]", conn, trans))
                {
                    cmd.Parameters.AddWithValue("@SubmissionQuestionId", pair.Key);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            rowsToInsert.Add(new Tuple<int, int>(
                                Convert.ToInt32(reader["Value"]),
                                Convert.ToInt32(reader["SortOrder"])
                            ));
                        }
                    }
                }

                foreach (var row in rowsToInsert)
                {
                    using (SqlCommand rowCmd = new SqlCommand(@"
                        INSERT INTO [QuestionRows] ([Id], [QuestionId], [Value], [SortOrder])
                        VALUES (@Id, @QuestionId, @Value, @SortOrder)", conn, trans))
                    {
                        rowCmd.Parameters.AddWithValue("@Id", GenerateId("R", 10));
                        rowCmd.Parameters.AddWithValue("@QuestionId", pair.Value);
                        rowCmd.Parameters.AddWithValue("@Value", row.Item1);
                        rowCmd.Parameters.AddWithValue("@SortOrder", row.Item2);
                        rowCmd.ExecuteNonQuery();
                    }
                }
            }

            using (SqlCommand cmd = new SqlCommand("UPDATE [Submissions] SET [LiveSetId] = @LiveSetId WHERE [Id] = @Id", conn, trans))
            {
                cmd.Parameters.AddWithValue("@LiveSetId", liveSetId);
                cmd.Parameters.AddWithValue("@Id", submissionId);
                cmd.ExecuteNonQuery();
            }
        }

        private static void DeleteQuestionSet(SqlConnection conn, SqlTransaction trans, string setId)
        {
            using (SqlCommand cmd = new SqlCommand(@"
                DELETE FROM [QuestionRows]
                WHERE [QuestionId] IN (SELECT [Id] FROM [Questions] WHERE [SetId] = @SetId)", conn, trans))
            {
                cmd.Parameters.AddWithValue("@SetId", setId);
                cmd.ExecuteNonQuery();
            }

            using (SqlCommand cmd = new SqlCommand("DELETE FROM [QuizResults] WHERE [SetId] = @SetId", conn, trans))
            {
                cmd.Parameters.AddWithValue("@SetId", setId);
                cmd.ExecuteNonQuery();
            }

            using (SqlCommand cmd = new SqlCommand("DELETE FROM [Questions] WHERE [SetId] = @SetId", conn, trans))
            {
                cmd.Parameters.AddWithValue("@SetId", setId);
                cmd.ExecuteNonQuery();
            }

            using (SqlCommand cmd = new SqlCommand("DELETE FROM [QuestionSets] WHERE [Id] = @SetId", conn, trans))
            {
                cmd.Parameters.AddWithValue("@SetId", setId);
                cmd.ExecuteNonQuery();
            }
        }

        private static string GenerateId(string prefix, int maxLength)
        {
            string suffix = Guid.NewGuid().ToString("N").Substring(0, Math.Max(1, maxLength - prefix.Length)).ToUpper();
            return (prefix + suffix).Substring(0, maxLength);
        }

        // Creates the long-term moderation tables/columns if the SQL migration has not been run yet.
        // This prevents the instructor page from crashing with missing-column errors.
        private static void EnsureModerationTables(SqlConnection conn)
        {
            string sql = @"
IF COL_LENGTH('dbo.Submissions', 'ModuleId') IS NULL
    ALTER TABLE [dbo].[Submissions] ADD [ModuleId] VARCHAR(10) NULL;

IF COL_LENGTH('dbo.Submissions', 'Label') IS NULL
    ALTER TABLE [dbo].[Submissions] ADD [Label] NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.Submissions', 'DisplayMode') IS NULL
    ALTER TABLE [dbo].[Submissions] ADD [DisplayMode] NVARCHAR(20) NULL;

IF COL_LENGTH('dbo.Submissions', 'SortOrder') IS NULL
    ALTER TABLE [dbo].[Submissions] ADD [SortOrder] INT NULL;

IF COL_LENGTH('dbo.Submissions', 'LiveSetId') IS NULL
    ALTER TABLE [dbo].[Submissions] ADD [LiveSetId] VARCHAR(10) NULL;

IF OBJECT_ID('dbo.SubmissionQuestions', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SubmissionQuestions] (
        [Id] VARCHAR(10) NOT NULL PRIMARY KEY,
        [SubmissionId] VARCHAR(10) NOT NULL,
        [Answer] INT NOT NULL,
        [SortOrder] INT NOT NULL
    );
END;

IF OBJECT_ID('dbo.SubmissionQuestionRows', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SubmissionQuestionRows] (
        [Id] VARCHAR(10) NOT NULL PRIMARY KEY,
        [SubmissionQuestionId] VARCHAR(10) NOT NULL,
        [Value] INT NOT NULL,
        [SortOrder] INT NOT NULL
    );
END;";
            using (SqlCommand cmd = new SqlCommand(sql, conn))
            {
                cmd.ExecuteNonQuery();
            }
        }
    }
}
