using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Web.Services;
using System.Web.UI;

namespace Mathling
{
    public partial class Moderate : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
        }

        public class SubmissionItem
        {
            public string id { get; set; }
            public string title { get; set; }
            public string chapter { get; set; }
            public string difficulty { get; set; }
            public string status { get; set; }
            public string reason { get; set; }
            public string instructor { get; set; }
            public string date { get; set; }
        }

        [WebMethod]
        public static List<SubmissionItem> GetSubmissions(string userId, string role)
        {
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            List<SubmissionItem> subs = new List<SubmissionItem>();

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = @"
                    SELECT 
                        s.Id, s.Title, s.Chapter, s.Difficulty, s.Status, s.Reason, s.CreatedAt,
                        u.Name as InstructorName
                    FROM Submissions s
                    JOIN Users u ON s.InstructorId = u.Id
                    WHERE (@Role = 'admin' OR s.InstructorId = @UserId)
                    ORDER BY s.CreatedAt DESC";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@UserId", userId);
                    cmd.Parameters.AddWithValue("@Role", role);

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            subs.Add(new SubmissionItem
                            {
                                id = reader["Id"].ToString(),
                                title = reader["Title"].ToString(),
                                chapter = reader["Chapter"].ToString(),
                                difficulty = reader["Difficulty"].ToString(),
                                status = reader["Status"].ToString(),
                                reason = reader["Reason"] != DBNull.Value ? reader["Reason"].ToString() : "",
                                instructor = reader["InstructorName"].ToString(),
                                date = Convert.ToDateTime(reader["CreatedAt"]).ToString("yyyy-MM-dd")
                            });
                        }
                    }
                }
            }
            return subs;
        }

        [WebMethod]
        public static bool SubmitContent(string instructorId, string title, string chapter, string difficulty)
        {
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string newId = Guid.NewGuid().ToString().Substring(0, 8);
                string query = "INSERT INTO Submissions (Id, InstructorId, Title, Chapter, Difficulty) VALUES (@Id, @InstructorId, @Title, @Chapter, @Difficulty)";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", newId);
                    cmd.Parameters.AddWithValue("@InstructorId", instructorId);
                    cmd.Parameters.AddWithValue("@Title", title);
                    cmd.Parameters.AddWithValue("@Chapter", chapter);
                    cmd.Parameters.AddWithValue("@Difficulty", difficulty);
                    return cmd.ExecuteNonQuery() > 0;
                }
            }
        }

        [WebMethod]
        public static bool UpdateStatus(string submissionId, string status, string reason)
        {
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = "UPDATE Submissions SET Status = @Status, Reason = @Reason WHERE Id = @Id";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Status", status);
                    cmd.Parameters.AddWithValue("@Reason", string.IsNullOrEmpty(reason) ? (object)DBNull.Value : reason);
                    cmd.Parameters.AddWithValue("@Id", submissionId);
                    return cmd.ExecuteNonQuery() > 0;
                }
            }
        }
    }
}
