using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
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
                            q.ModuleId as target,
                            q.Date as time
                        FROM QuizResults q
                        JOIN Users u ON q.UserId = u.Id
                        
                        UNION ALL
                        
                        SELECT 
                            'sub_' + CAST(s.Id AS VARCHAR) as id,
                            u.Name as [user],
                            'submitted content' as action,
                            s.Title as target,
                            s.SubmittedAt as time
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
    }
}
