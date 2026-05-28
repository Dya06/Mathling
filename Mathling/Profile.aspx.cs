using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Web.Services;
using System.Web.UI;

namespace Mathling
{
    public partial class Profile : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
        }

        public class ProfileResponse
        {
            public StudentData student { get; set; }
            public ParentData parent { get; set; }
            public InstructorData instructor { get; set; }
            public AdminData admin { get; set; }
            public string errorMessage { get; set; }
        }

        public class StudentData
        {
            public int xp { get; set; }
            public int level { get; set; }
            public List<BadgeDto> badges { get; set; }
            public List<ChapterDto> chapters { get; set; }
            public List<ActivityDto> history { get; set; }
        }

        public class BadgeDto
        {
            public string icon { get; set; }
            public string name { get; set; }
            public bool earned { get; set; }
        }

        public class ChapterDto
        {
            public string title { get; set; }
            public string description { get; set; }
            public bool completed { get; set; }
            public bool unlocked { get; set; }
            public int stars { get; set; }
        }

        public class ActivityDto
        {
            public int score { get; set; }
            public string chapter { get; set; }
            public string date { get; set; }
        }

        public class ParentData
        {
            public List<LinkedStudentDto> linkedStudents { get; set; }
            public int totalQuizzes { get; set; }
            public int avgScore { get; set; }
        }

        public class LinkedStudentDto
        {
            public string name { get; set; }
            public int level { get; set; }
            public int xp { get; set; }
        }

        public class InstructorData
        {
            public List<SubmissionDto> submissions { get; set; }
        }

        public class SubmissionDto
        {
            public string title { get; set; }
            public string chapter { get; set; }
            public string status { get; set; }
        }

        public class AdminData
        {
            public int totalUsers { get; set; }
            public int totalStudents { get; set; }
        }

        [WebMethod]
        public static ProfileResponse GetProfileData(string userId, string role)
        {
            var res = new ProfileResponse();
            try
            {
                string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

                using (SqlConnection conn = new SqlConnection(connStr))
                {
                    conn.Open();

                    if (role == "student" || role == "Student")
                    {
                        res.student = new StudentData { badges = new List<BadgeDto>(), chapters = new List<ChapterDto>(), history = new List<ActivityDto>() };
                        
                        // Fetch Level and XP
                        using (SqlCommand cmd = new SqlCommand("SELECT Level, XP FROM Users WHERE Id = @Id", conn))
                        {
                            cmd.Parameters.AddWithValue("@Id", userId);
                            using (var reader = cmd.ExecuteReader())
                            {
                                if (reader.Read())
                                {
                                    res.student.level = Convert.ToInt32(reader["Level"]);
                                    res.student.xp = Convert.ToInt32(reader["XP"]);
                                }
                            }
                        }

                        // Fetch Chapters
                        using (SqlCommand cmd = new SqlCommand(@"
                            SELECT m.Id, m.Title, m.Description, ISNULL(mp.IsCompleted, 0) as IsCompleted
                            FROM Modules m
                            LEFT JOIN ModuleProgress mp ON m.Id = mp.ModuleId AND mp.UserId = @Id
                            ORDER BY m.SortOrder ASC", conn))
                        {
                            cmd.Parameters.AddWithValue("@Id", userId);
                            using (var reader = cmd.ExecuteReader())
                            {
                                bool previousCompleted = true; // First one is unlocked
                                while (reader.Read())
                                {
                                    bool completed = Convert.ToBoolean(reader["IsCompleted"]);
                                    res.student.chapters.Add(new ChapterDto
                                    {
                                        title = reader["Title"].ToString(),
                                        description = reader["Description"].ToString(),
                                        completed = completed,
                                        unlocked = previousCompleted || completed,
                                        stars = completed ? 3 : 0 // Simplified stars
                                    });
                                    previousCompleted = completed;
                                }
                            }
                        }

                        // Fetch History (last 4)
                        using (SqlCommand cmd = new SqlCommand(@"
                            SELECT TOP 4 qr.Percentage as Score, m.Title as Chapter, qr.CompletedAt
                            FROM QuizResults qr
                            JOIN QuestionSets qs ON qr.SetId = qs.Id
                            JOIN Modules m ON qs.ModuleId = m.Id
                            WHERE qr.UserId = @Id
                            ORDER BY qr.CompletedAt DESC", conn))
                        {
                            cmd.Parameters.AddWithValue("@Id", userId);
                            using (var reader = cmd.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    int score = reader["Score"] != DBNull.Value ? Convert.ToInt32(reader["Score"]) : 0;
                                    res.student.history.Add(new ActivityDto
                                    {
                                        score = score,
                                        chapter = reader["Chapter"].ToString(),
                                        date = Convert.ToDateTime(reader["CompletedAt"]).ToString("MM-dd")
                                    });
                                }
                            }
                        }
                    }
                    else if (role == "parent" || role == "Parent")
                    {
                        res.parent = new ParentData { linkedStudents = new List<LinkedStudentDto>() };
                        
                        // Fetch Linked Students
                        using (SqlCommand cmd = new SqlCommand(@"
                            SELECT u.Name, u.Level, u.XP
                            FROM ParentStudentLinks psl
                            JOIN Users u ON psl.StudentId = u.Id
                            WHERE psl.ParentId = @Id", conn))
                        {
                            cmd.Parameters.AddWithValue("@Id", userId);
                            using (var reader = cmd.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    res.parent.linkedStudents.Add(new LinkedStudentDto
                                    {
                                        name = reader["Name"].ToString(),
                                        level = Convert.ToInt32(reader["Level"]),
                                        xp = Convert.ToInt32(reader["XP"])
                                    });
                                }
                            }
                        }
                    }
                    else if (role == "instructor" || role == "Instructor")
                    {
                        res.instructor = new InstructorData { submissions = new List<SubmissionDto>() };
                        
                        using (SqlCommand cmd = new SqlCommand("SELECT Title, Chapter, Status FROM Submissions WHERE InstructorId = @Id ORDER BY CreatedAt DESC", conn))
                        {
                            cmd.Parameters.AddWithValue("@Id", userId);
                            using (var reader = cmd.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    res.instructor.submissions.Add(new SubmissionDto
                                    {
                                        title = reader["Title"].ToString(),
                                        chapter = reader["Chapter"].ToString(),
                                        status = reader["Status"].ToString()
                                    });
                                }
                            }
                        }
                    }
                    else if (role == "admin" || role == "Admin")
                    {
                        res.admin = new AdminData();
                        using (SqlCommand cmd = new SqlCommand("SELECT COUNT(*) FROM Users", conn))
                            res.admin.totalUsers = Convert.ToInt32(cmd.ExecuteScalar());
                            
                        using (SqlCommand cmd = new SqlCommand("SELECT COUNT(*) FROM Users WHERE Role = 'student'", conn))
                            res.admin.totalStudents = Convert.ToInt32(cmd.ExecuteScalar());
                    }
                    else 
                    {
                        res.errorMessage = "Role not recognized: " + role;
                    }
                }
            }
            catch (Exception ex)
            {
                res.errorMessage = ex.Message;
            }
            return res;
        }
    }
}
