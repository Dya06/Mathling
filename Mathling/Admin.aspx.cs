using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Web;
using System.Web.Services;
using System.Web.UI;

namespace Mathling
{
    public partial class Admin : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
        }

        public class AdminStatsDto
        {
            public int totalUsers { get; set; }
            public int totalQuizzes { get; set; }
            public int contentItems { get; set; }
            public int pendingReviews { get; set; }
        }

        public class AdminUserDto
        {
            public string id { get; set; }
            public string name { get; set; }
            public string email { get; set; }
            public string role { get; set; }
            public string joinDate { get; set; }
            public string status { get; set; }
        }

        public class AdminActivityDto
        {
            public string id { get; set; }
            public string user { get; set; }
            public string action { get; set; }
            public string target { get; set; }
            public string time { get; set; }
        }

        [WebMethod]
        public static AdminStatsDto GetStats()
        {
            var stats = new AdminStatsDto();
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                
                using (SqlCommand cmd = new SqlCommand("SELECT COUNT(*) FROM Users", conn))
                    stats.totalUsers = (int)cmd.ExecuteScalar();
                    
                using (SqlCommand cmd = new SqlCommand("SELECT COUNT(*) FROM QuizResults", conn))
                    stats.totalQuizzes = (int)cmd.ExecuteScalar();
                    
                using (SqlCommand cmd = new SqlCommand("SELECT COUNT(*) FROM Submissions", conn))
                    stats.contentItems = (int)cmd.ExecuteScalar();
                    
                using (SqlCommand cmd = new SqlCommand("SELECT COUNT(*) FROM Submissions WHERE Status = 'pending'", conn))
                    stats.pendingReviews = (int)cmd.ExecuteScalar();
            }
            return stats;
        }

        [WebMethod]
        public static List<AdminUserDto> GetUsers()
        {
            var users = new List<AdminUserDto>();
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = "SELECT Id, Name, Email, Role, CreatedAt, IsActive FROM Users ORDER BY CreatedAt DESC";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        users.Add(new AdminUserDto
                        {
                            id = reader["Id"].ToString(),
                            name = reader["Name"].ToString(),
                            email = reader["Email"].ToString(),
                            role = reader["Role"].ToString(),
                            joinDate = Convert.ToDateTime(reader["CreatedAt"]).ToString("MMM dd, yyyy"),
                            status = Convert.ToBoolean(reader["IsActive"]) ? "Active" : "Inactive"
                        });
                    }
                }
            }
            return users;
        }

        [WebMethod]
        public static List<AdminActivityDto> GetActivity()
        {
            var activity = new List<AdminActivityDto>();
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                // Query QuizResults and Submissions to mock an activity feed
                string query = @"
                    SELECT TOP 10 * FROM (
                        SELECT 
                            'quiz_' + CAST(q.Id AS VARCHAR) as id,
                            u.Name as [user],
                            'completed quiz' as action,
                            q.SetId as target,
                            q.CompletedAt as time
                        FROM QuizResults q
                        JOIN Users u ON q.UserId = u.Id
                        
                        UNION ALL
                        
                        SELECT 
                            'sub_' + CAST(s.Id AS VARCHAR) as id,
                            u.Name as [user],
                            'submitted content' as action,
                            s.Title as target,
                            s.CreatedAt as time
                        FROM Submissions s
                        JOIN Users u ON s.InstructorId = u.Id
                    ) ActivityFeed
                    ORDER BY time DESC
                ";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var timeVal = Convert.ToDateTime(reader["time"]);
                        var diff = DateTime.Now - timeVal;
                        string timeAgo = diff.TotalHours < 1 ? $"{(int)diff.TotalMinutes} mins ago" :
                                         diff.TotalDays < 1 ? $"{(int)diff.TotalHours} hours ago" :
                                         $"{(int)diff.TotalDays} days ago";

                        activity.Add(new AdminActivityDto
                        {
                            id = reader["id"].ToString(),
                            user = reader["user"].ToString(),
                            action = reader["action"].ToString(),
                            target = reader["target"].ToString(),
                            time = timeAgo
                        });
                    }
                }
            }
            return activity;
        }

        [WebMethod(EnableSession = true)]
        public static string UpdateUser(int targetUserId, string name, string role)
        {
            if (HttpContext.Current.Session["UserRole"]?.ToString() != "admin")
                return "error|Unauthorized";

            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                // Avatar is linked to role, so we update it as well if it's one of the defaults
                string query = "UPDATE Users SET Name = @Name, Role = @Role, Avatar = @Role WHERE Id = @Id";
                using(SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Name", name);
                    cmd.Parameters.AddWithValue("@Role", role);
                    cmd.Parameters.AddWithValue("@Id", targetUserId);
                    cmd.ExecuteNonQuery();
                }
            }
            return "success";
        }

        [WebMethod(EnableSession = true)]
        public static string DeleteUser(int targetUserId)
        {
            if (HttpContext.Current.Session["UserRole"]?.ToString() != "admin")
                return "error|Unauthorized";

            if (HttpContext.Current.Session["UserId"]?.ToString() == targetUserId.ToString())
                return "error|Cannot delete your own admin account";

            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                using (SqlTransaction trans = conn.BeginTransaction())
                {
                    try
                    {
                        ExecuteNonQuery("DELETE FROM ForumReplies WHERE ThreadId IN (SELECT Id FROM ForumThreads WHERE AuthorId = @Id)", targetUserId, conn, trans);
                        ExecuteNonQuery("DELETE FROM ForumReplies WHERE AuthorId = @Id", targetUserId, conn, trans);
                        ExecuteNonQuery("DELETE FROM ForumThreads WHERE AuthorId = @Id", targetUserId, conn, trans);
                        ExecuteNonQuery("DELETE FROM Submissions WHERE InstructorId = @Id", targetUserId, conn, trans);
                        ExecuteNonQuery("DELETE FROM QuizResults WHERE UserId = @Id", targetUserId, conn, trans);
                        ExecuteNonQuery("DELETE FROM UserBadges WHERE UserId = @Id", targetUserId, conn, trans);
                        ExecuteNonQuery("DELETE FROM ParentStudentLinks WHERE ParentId = @Id OR StudentId = @Id", targetUserId, conn, trans);
                        ExecuteNonQuery("DELETE FROM Users WHERE Id = @Id", targetUserId, conn, trans);

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

        // ---- Content Moderation ----
        public class ContentItemDto
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

        [WebMethod(EnableSession = true)]
        public static List<ContentItemDto> GetContentItems()
        {
            if (HttpContext.Current.Session["UserRole"]?.ToString() != "admin")
                return new List<ContentItemDto>();

            var items = new List<ContentItemDto>();
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
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
                    ORDER BY 
                        CASE qs.Status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
                        qs.SubmittedAt DESC, qs.Id DESC";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        items.Add(new ContentItemDto
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
            return items;
        }

        [WebMethod(EnableSession = true)]
        public static string ApproveContent(string setId)
        {
            if (HttpContext.Current.Session["UserRole"]?.ToString() != "admin")
                return "error|Unauthorized";

            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                using (SqlCommand cmd = new SqlCommand("UPDATE QuestionSets SET Status = 'approved', Reason = NULL WHERE Id = @Id", conn))
                {
                    cmd.Parameters.AddWithValue("@Id", setId);
                    return cmd.ExecuteNonQuery() > 0 ? "success" : "error|Not found";
                }
            }
        }

        [WebMethod(EnableSession = true)]
        public static string RejectContent(string setId, string reason)
        {
            if (HttpContext.Current.Session["UserRole"]?.ToString() != "admin")
                return "error|Unauthorized";

            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                using (SqlCommand cmd = new SqlCommand("UPDATE QuestionSets SET Status = 'rejected', Reason = @Reason WHERE Id = @Id", conn))
                {
                    cmd.Parameters.AddWithValue("@Reason", string.IsNullOrEmpty(reason) ? (object)DBNull.Value : reason);
                    cmd.Parameters.AddWithValue("@Id", setId);
                    return cmd.ExecuteNonQuery() > 0 ? "success" : "error|Not found";
                }
            }
        }

        private static void ExecuteNonQuery(string query, int userId, SqlConnection conn, SqlTransaction trans)
        {
            using (SqlCommand cmd = new SqlCommand(query, conn, trans))
            {
                cmd.Parameters.AddWithValue("@Id", userId);
                cmd.ExecuteNonQuery();
            }
        }
    }
}
