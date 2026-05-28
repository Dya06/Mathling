using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Web.Services;
using System.Web.UI;

namespace Mathling
{
    public partial class Progress : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
        }

        public class ProgressData
        {
            public int QuizzesTaken { get; set; }
            public int AvgScore { get; set; }
            public int BestScore { get; set; }
            public int ChaptersDone { get; set; }
            public int TotalChapters { get; set; }
            public List<QuizHistoryItem> History { get; set; }
        }

        public class QuizHistoryItem
        {
            public string date { get; set; }
            public string chapter { get; set; }
            public int score { get; set; }
            public string time { get; set; }
            public int stars { get; set; }
        }

        [WebMethod]
        public static ProgressData GetProgressData(string userId)
        {
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;
            ProgressData data = new ProgressData();
            data.History = new List<QuizHistoryItem>();

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                // 1. Get History & Stats
                string historyQuery = @"
                    SELECT 
                        qr.Percentage as Score, 
                        qr.TimeTakenSec, 
                        qr.CompletedAt, 
                        m.Title as ChapterName
                    FROM QuizResults qr
                    JOIN QuestionSets qs ON qr.SetId = qs.Id
                    JOIN Modules m ON qs.ModuleId = m.Id
                    WHERE qr.UserId = @UserId
                    ORDER BY qr.CompletedAt ASC";

                int totalScore = 0;
                
                using (SqlCommand cmd = new SqlCommand(historyQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@UserId", userId);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            int score = reader["Score"] != DBNull.Value ? Convert.ToInt32(reader["Score"]) : 0;
                            int timeSec = reader["TimeTakenSec"] != DBNull.Value ? Convert.ToInt32(reader["TimeTakenSec"]) : 0;
                            DateTime completedAt = Convert.ToDateTime(reader["CompletedAt"]);
                            string chapter = reader["ChapterName"].ToString();

                            data.QuizzesTaken++;
                            totalScore += score;
                            if (score > data.BestScore) data.BestScore = score;

                            // Calculate stars (>=80: 3, >=50: 2, else 1)
                            int stars = score >= 80 ? 3 : (score >= 50 ? 2 : 1);
                            
                            string timeStr = $"{timeSec / 60}:{(timeSec % 60).ToString("D2")}";

                            data.History.Add(new QuizHistoryItem
                            {
                                date = completedAt.ToString("MM-dd"),
                                chapter = chapter,
                                score = score,
                                time = timeStr,
                                stars = stars
                            });
                        }
                    }
                }

                data.AvgScore = data.QuizzesTaken > 0 ? totalScore / data.QuizzesTaken : 0;

                // 2. Get Chapters Completion
                string compQuery = @"
                    SELECT 
                        (SELECT COUNT(*) FROM ModuleProgress WHERE UserId = @UserId AND IsCompleted = 1) as ChaptersDone,
                        (SELECT COUNT(*) FROM Modules) as TotalChapters";

                using (SqlCommand cmd = new SqlCommand(compQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@UserId", userId);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            data.ChaptersDone = Convert.ToInt32(reader["ChaptersDone"]);
                            data.TotalChapters = Convert.ToInt32(reader["TotalChapters"]);
                        }
                    }
                }
            }

            return data;
        }
    }
}
