using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Web;
using System.Web.Services;
using System.Web.UI;

namespace Mathling
{
    public partial class Forum : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
        }

        public class ThreadDto
        {
            public int id { get; set; }
            public string title { get; set; }
            public string content { get; set; }
            public string category { get; set; }
            public string author { get; set; }
            public string role { get; set; }
            public string avatar { get; set; }
            public int replies { get; set; }
            public string date { get; set; }
            public List<ReplyDto> replyList { get; set; }
        }

        public class ReplyDto
        {
            public string author { get; set; }
            public string role { get; set; }
            public string avatar { get; set; }
            public string content { get; set; }
            public string date { get; set; }
        }

        [WebMethod]
        public static List<ThreadDto> GetThreads()
        {
            var threads = new List<ThreadDto>();
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = @"
                    SELECT 
                        t.Id, t.Title, t.Category, t.CreatedAt,
                        u.Name as AuthorName, u.Role as AuthorRole, u.Avatar,
                        (SELECT COUNT(*) FROM ForumReplies r WHERE r.ThreadId = t.Id) as ReplyCount
                    FROM ForumThreads t
                    JOIN Users u ON t.AuthorId = u.Id
                    ORDER BY t.CreatedAt DESC";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        threads.Add(new ThreadDto
                        {
                            id = (int)reader["Id"],
                            title = reader["Title"].ToString(),
                            category = reader["Category"].ToString(),
                            author = reader["AuthorName"].ToString(),
                            role = reader["AuthorRole"].ToString(),
                            avatar = reader["Avatar"].ToString(),
                            replies = (int)reader["ReplyCount"],
                            date = Convert.ToDateTime(reader["CreatedAt"]).ToString("yyyy-MM-dd")
                        });
                    }
                }
            }
            return threads;
        }

        [WebMethod]
        public static ThreadDto GetThread(int threadId)
        {
            ThreadDto thread = null;
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                
                // Get Thread
                string threadQuery = @"
                    SELECT 
                        t.Id, t.Title, t.Content, t.Category, t.CreatedAt,
                        u.Name as AuthorName, u.Role as AuthorRole, u.Avatar
                    FROM ForumThreads t
                    JOIN Users u ON t.AuthorId = u.Id
                    WHERE t.Id = @Id";

                using (SqlCommand cmd = new SqlCommand(threadQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", threadId);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            thread = new ThreadDto
                            {
                                id = (int)reader["Id"],
                                title = reader["Title"].ToString(),
                                content = reader["Content"].ToString(),
                                category = reader["Category"].ToString(),
                                author = reader["AuthorName"].ToString(),
                                role = reader["AuthorRole"].ToString(),
                                avatar = reader["Avatar"].ToString(),
                                date = Convert.ToDateTime(reader["CreatedAt"]).ToString("yyyy-MM-dd"),
                                replyList = new List<ReplyDto>()
                            };
                        }
                    }
                }

                if (thread != null)
                {
                    // Get Replies
                    string replyQuery = @"
                        SELECT 
                            r.Content, r.CreatedAt,
                            u.Name as AuthorName, u.Role as AuthorRole, u.Avatar
                        FROM ForumReplies r
                        JOIN Users u ON r.AuthorId = u.Id
                        WHERE r.ThreadId = @ThreadId
                        ORDER BY r.CreatedAt ASC";

                    using (SqlCommand rCmd = new SqlCommand(replyQuery, conn))
                    {
                        rCmd.Parameters.AddWithValue("@ThreadId", threadId);
                        using (SqlDataReader rReader = rCmd.ExecuteReader())
                        {
                            while (rReader.Read())
                            {
                                thread.replyList.Add(new ReplyDto
                                {
                                    author = rReader["AuthorName"].ToString(),
                                    role = rReader["AuthorRole"].ToString(),
                                    avatar = rReader["Avatar"].ToString(),
                                    content = rReader["Content"].ToString(),
                                    date = Convert.ToDateTime(rReader["CreatedAt"]).ToString("yyyy-MM-dd")
                                });
                            }
                        }
                    }
                    thread.replies = thread.replyList.Count;
                }
            }
            return thread;
        }

        [WebMethod(EnableSession = true)]
        public static string CreateThread(string title, string content, string category)
        {
            if (HttpContext.Current.Session["UserId"] == null)
                return "error|Not logged in";

            int userId = (int)HttpContext.Current.Session["UserId"];
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = @"
                    INSERT INTO ForumThreads (Title, Content, Category, AuthorId, CreatedAt)
                    VALUES (@Title, @Content, @Category, @AuthorId, GETDATE())";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Title", title);
                    cmd.Parameters.AddWithValue("@Content", content);
                    cmd.Parameters.AddWithValue("@Category", category);
                    cmd.Parameters.AddWithValue("@AuthorId", userId);
                    cmd.ExecuteNonQuery();
                }
            }
            return "success";
        }

        [WebMethod(EnableSession = true)]
        public static string AddReply(int threadId, string content)
        {
            if (HttpContext.Current.Session["UserId"] == null)
                return "error|Not logged in";

            int userId = (int)HttpContext.Current.Session["UserId"];
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string query = @"
                    INSERT INTO ForumReplies (ThreadId, Content, AuthorId, CreatedAt)
                    VALUES (@ThreadId, @Content, @AuthorId, GETDATE())";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@ThreadId", threadId);
                    cmd.Parameters.AddWithValue("@Content", content);
                    cmd.Parameters.AddWithValue("@AuthorId", userId);
                    cmd.ExecuteNonQuery();
                }
            }
            return "success";
        }
    }
}
