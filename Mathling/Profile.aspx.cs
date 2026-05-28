using System;
using System.Configuration;
using System.Data.SqlClient;
using System.Diagnostics;

namespace Mathling
{
    public partial class Profile : System.Web.UI.Page
    {
        string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

        protected void Page_Load(object sender, EventArgs e)
        {
            // ============================================
            // DEBUG: PRINT ALL SESSION VALUES
            // ============================================
            Debug.WriteLine("====== SESSION DEBUG ======");
            Debug.WriteLine("UserId:    " + (Session["UserId"] ?? "NULL"));
            Debug.WriteLine("UserName:  " + (Session["UserName"] ?? "NULL"));
            Debug.WriteLine("UserRole:  " + (Session["UserRole"] ?? "NULL"));
            Debug.WriteLine("UserEmail: " + (Session["UserEmail"] ?? "NULL"));
            Debug.WriteLine("===========================");

            if (!IsPostBack)
            {
                LoadProfile();
            }
        }

        private void LoadProfile()
        {
            if (Session["UserId"] == null)
            {
                Debug.WriteLine("PROFILE: UserId is null, redirecting to Login");
                Response.Redirect("Login.aspx");
                return;
            }

            int userId = Convert.ToInt32(Session["UserId"]);
            Debug.WriteLine("PROFILE: Loading profile for UserId = " + userId);

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                // Load Name, Role, Level, XP from DB
                string userQuery = @"
                    SELECT Name, Role, Level, XP
                    FROM Users
                    WHERE Id = @Id";

                using (SqlCommand cmd = new SqlCommand(userQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", userId);
                    SqlDataReader reader = cmd.ExecuteReader();
                    if (reader.Read())
                    {
                        lblName.Text = reader["Name"].ToString();
                        lblRole.Text = reader["Role"].ToString();
                        lblLevel.Text = "Level " + reader["Level"].ToString();
                        lblXP.Text = reader["XP"].ToString() + " XP";

                        Debug.WriteLine("PROFILE: Name=" + lblName.Text);
                        Debug.WriteLine("PROFILE: Role=" + lblRole.Text);
                        Debug.WriteLine("PROFILE: Level=" + lblLevel.Text);
                        Debug.WriteLine("PROFILE: XP=" + lblXP.Text);
                    }
                    else
                    {
                        Debug.WriteLine("PROFILE: No user found in DB for Id = " + userId);
                    }
                    reader.Close();
                }

                // Load Quiz Count + Average Score
                string statsQuery = @"
                    SELECT 
                        COUNT(*) AS QuizCount,
                        ISNULL(AVG(Percentage), 0) AS AvgScore
                    FROM QuizResults
                    WHERE UserId = @Id";

                using (SqlCommand cmd = new SqlCommand(statsQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", userId);
                    SqlDataReader reader = cmd.ExecuteReader();
                    if (reader.Read())
                    {
                        lblQuizCount.Text = reader["QuizCount"].ToString();
                        lblAverage.Text = reader["AvgScore"].ToString() + "%";

                        Debug.WriteLine("PROFILE: QuizCount=" + lblQuizCount.Text);
                        Debug.WriteLine("PROFILE: AvgScore=" + lblAverage.Text);
                    }
                    reader.Close();
                }

                // Load Recent Activity
                string historyQuery = @"
                    SELECT TOP 10
                        m.Title        AS ChapterName,
                        qr.Percentage  AS Score,
                        qr.CompletedAt AS DateTaken
                    FROM QuizResults qr
                    JOIN QuestionSets qs ON qr.SetId   = qs.Id
                    JOIN Modules      m  ON qs.ModuleId = m.Id
                    WHERE qr.UserId = @Id
                    ORDER BY qr.CompletedAt DESC";

                using (SqlCommand cmd = new SqlCommand(historyQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@Id", userId);
                    SqlDataReader reader = cmd.ExecuteReader();
                    rptHistory.DataSource = reader;
                    rptHistory.DataBind();
                    reader.Close();
                }
            }
        }
    }
}