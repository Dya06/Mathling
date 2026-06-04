using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Web.Services;
using System.Web.UI;

namespace Mathling
{
    public partial class Leaderboard : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
        }

        public class LeaderboardUserDto
        {
            public int Rank { get; set; }
            public string Id { get; set; }
            public string Name { get; set; }
            public string Avatar { get; set; }
            public int Level { get; set; }
            public int XP { get; set; }
        }

        [WebMethod]
        public static List<LeaderboardUserDto> GetLeaderboard()
        {
            var leaderboard = new List<LeaderboardUserDto>();
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                
                // Query only students, order by XP descending, and tie-break by Level or Name
                string query = @"
                    SELECT Id, Name, Avatar, Level, XP
                    FROM Users
                    WHERE Role = 'student' AND IsActive = 1
                    ORDER BY XP DESC, Level DESC, Name ASC";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    int rank = 1;
                    while (reader.Read())
                    {
                        leaderboard.Add(new LeaderboardUserDto
                        {
                            Rank = rank,
                            Id = reader["Id"].ToString(),
                            Name = reader["Name"].ToString(),
                            Avatar = reader["Avatar"].ToString(),
                            Level = Convert.ToInt32(reader["Level"]),
                            XP = Convert.ToInt32(reader["XP"])
                        });
                        rank++;
                    }
                }
            }

            return leaderboard;
        }
    }
}
