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

        // ---- Get Formulas for dropdown ----
        [WebMethod]
        public static List<FormulaDto> GetFormulas()
        {
            var formulas = new List<FormulaDto>();
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                using (SqlCommand cmd = new SqlCommand("SELECT Id, Name, Rule FROM Formulas WHERE IsActive = 1 ORDER BY SortOrder", conn))
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

        // ---- Get Modules for a formula ----
        [WebMethod]
        public static List<ModuleDto> GetModules(string formulaId)
        {
            var modules = new List<ModuleDto>();
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                using (SqlCommand cmd = new SqlCommand("SELECT Id, FormulaId, Title, ModuleKey FROM Modules WHERE FormulaId = @FormulaId ORDER BY SortOrder", conn))
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

        // ---- Submit a new quiz (creates QuestionSet + Questions + QuestionRows) ----
        [WebMethod(EnableSession = true)]
        public static string SubmitQuiz(string moduleId, string label, string displayMode, string questionsJson)
        {
            try
            {
                var userId = HttpContext.Current.Session["UserId"]?.ToString();
                if (string.IsNullOrEmpty(userId)) return "error|Not logged in";

                var serializer = new JavaScriptSerializer();
                var questions = serializer.Deserialize<List<QuestionInput>>(questionsJson);

                if (questions == null || questions.Count == 0) return "error|No questions provided";
                if (string.IsNullOrEmpty(moduleId) || string.IsNullOrEmpty(label)) return "error|Missing required fields";

                string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
                using (SqlConnection conn = new SqlConnection(connStr))
                {
                    conn.Open();

                    // Get next sort order for this module
                    int nextSort = 0;
                    using (SqlCommand cmd = new SqlCommand("SELECT ISNULL(MAX(SortOrder), 0) + 1 FROM QuestionSets WHERE ModuleId = @ModuleId", conn))
                    {
                        cmd.Parameters.AddWithValue("@ModuleId", moduleId);
                        nextSort = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    string setId = "S" + Guid.NewGuid().ToString().Substring(0, 6).ToUpper();

                    using (SqlTransaction trans = conn.BeginTransaction())
                    {
                        try
                        {
                            // Insert QuestionSet with pending status
                            using (SqlCommand cmd = new SqlCommand(@"
                                INSERT INTO QuestionSets (Id, ModuleId, Label, DisplayMode, SortOrder, Status, CreatedBy, SubmittedAt)
                                VALUES (@Id, @ModuleId, @Label, @DisplayMode, @SortOrder, 'pending', @CreatedBy, GETDATE())", conn, trans))
                            {
                                cmd.Parameters.AddWithValue("@Id", setId);
                                cmd.Parameters.AddWithValue("@ModuleId", moduleId);
                                cmd.Parameters.AddWithValue("@Label", label);
                                cmd.Parameters.AddWithValue("@DisplayMode", displayMode);
                                cmd.Parameters.AddWithValue("@SortOrder", nextSort);
                                cmd.Parameters.AddWithValue("@CreatedBy", int.Parse(userId));
                                cmd.ExecuteNonQuery();
                            }

                            // Insert each question and its rows
                            for (int qi = 0; qi < questions.Count; qi++)
                            {
                                string qId = "Q" + Guid.NewGuid().ToString().Substring(0, 7).ToUpper();
                                using (SqlCommand cmd = new SqlCommand(@"
                                    INSERT INTO Questions (Id, SetId, Answer, SortOrder)
                                    VALUES (@Id, @SetId, @Answer, @SortOrder)", conn, trans))
                                {
                                    cmd.Parameters.AddWithValue("@Id", qId);
                                    cmd.Parameters.AddWithValue("@SetId", setId);
                                    cmd.Parameters.AddWithValue("@Answer", questions[qi].answer);
                                    cmd.Parameters.AddWithValue("@SortOrder", qi + 1);
                                    cmd.ExecuteNonQuery();
                                }

                                for (int ri = 0; ri < questions[qi].rows.Count; ri++)
                                {
                                    string rId = "R" + Guid.NewGuid().ToString().Substring(0, 7).ToUpper();
                                    using (SqlCommand cmd = new SqlCommand(@"
                                        INSERT INTO QuestionRows (Id, QuestionId, Value, SortOrder)
                                        VALUES (@Id, @QuestionId, @Value, @SortOrder)", conn, trans))
                                    {
                                        cmd.Parameters.AddWithValue("@Id", rId);
                                        cmd.Parameters.AddWithValue("@QuestionId", qId);
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

        // ---- Get submissions (from QuestionSets with CreatedBy) ----
        [WebMethod(EnableSession = true)]
        public static List<SubmissionItem> GetSubmissions(string userId, string role)
        {
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            var subs = new List<SubmissionItem>();

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = @"
                    SELECT 
                        qs.Id, qs.Label, qs.DisplayMode, qs.Status, qs.Reason, qs.SubmittedAt,
                        f.Name as FormulaName,
                        m.Title as ModuleTitle,
                        u.Name as InstructorName,
                        (SELECT COUNT(*) FROM Questions q WHERE q.SetId = qs.Id) as QuestionCount
                    FROM QuestionSets qs
                    INNER JOIN Modules m ON qs.ModuleId = m.Id
                    INNER JOIN Formulas f ON m.FormulaId = f.Id
                    LEFT JOIN Users u ON qs.CreatedBy = u.Id
                    WHERE (@Role = 'admin' OR qs.CreatedBy = TRY_CAST(@UserId AS INT))
                    ORDER BY qs.SubmittedAt DESC, qs.Id DESC";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@UserId", userId ?? "");
                    cmd.Parameters.AddWithValue("@Role", role);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            subs.Add(new SubmissionItem
                            {
                                id = reader["Id"].ToString(),
                                label = reader["Label"].ToString(),
                                formulaName = reader["FormulaName"].ToString(),
                                moduleTitle = reader["ModuleTitle"].ToString(),
                                displayMode = reader["DisplayMode"].ToString(),
                                status = reader["Status"].ToString(),
                                reason = reader["Reason"] != DBNull.Value ? reader["Reason"].ToString() : "",
                                instructor = reader["InstructorName"] != DBNull.Value ? reader["InstructorName"].ToString() : "System",
                                questionCount = Convert.ToInt32(reader["QuestionCount"]),
                                date = reader["SubmittedAt"] != DBNull.Value
                                    ? Convert.ToDateTime(reader["SubmittedAt"]).ToString("yyyy-MM-dd")
                                    : ""
                            });
                        }
                    }
                }
            }
            return subs;
        }

        // ---- Update status (admin approves/rejects) ----
        [WebMethod(EnableSession = true)]
        public static string UpdateStatus(string setId, string status, string reason)
        {
            if (HttpContext.Current.Session["UserRole"]?.ToString() != "admin")
                return "error|Unauthorized";

            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = "UPDATE QuestionSets SET Status = @Status, Reason = @Reason WHERE Id = @Id";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Status", status);
                    cmd.Parameters.AddWithValue("@Reason", string.IsNullOrEmpty(reason) ? (object)DBNull.Value : reason);
                    cmd.Parameters.AddWithValue("@Id", setId);
                    return cmd.ExecuteNonQuery() > 0 ? "success" : "error|Set not found";
                }
            }
        }
    }
}
