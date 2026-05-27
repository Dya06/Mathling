using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Web.UI;

namespace Mathling
{
    public partial class Profile : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            // 1. Guard against unauthenticated users
            if (Session["UserId"] == null)
            {
                Response.Redirect("Login.aspx");
                return;
            }

            if (!IsPostBack)
            {
                LoadUserProfile();
            }
        }

        private void LoadUserProfile()
        {
            // Keep it as a string to preserve any padded zeros (like "001")
            string userId = Session["UserId"]?.ToString();
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                // Select Avatar column too since it exists in your schema
                string query = "SELECT Name, Email, Role, Avatar, Level, XP FROM Users WHERE Id = @Id";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    // Explicitly pass it as a VarChar to match your VARCHAR(10) column perfectly
                    cmd.Parameters.Add("@Id", SqlDbType.VarChar, 10).Value = userId;

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            string name = reader["Name"].ToString();
                            string email = reader["Email"].ToString();
                            string role = reader["Role"].ToString();
                            int level = Convert.ToInt32(reader["Level"]);
                            int xp = Convert.ToInt32(reader["XP"]);

                            // 2. Bind straight to your elements
                            profileName.InnerText = name;
                            profileRoleBadge.InnerText = role.ToUpper();
                            lblEmail.InnerText = email;

                            // Assign customizable dynamic avatars / styles
                            if (role.Equals("student", StringComparison.OrdinalIgnoreCase))
                            {
                                profile_avatar.InnerHtml = "&#129330;"; // Student emoji
                                profileRoleBadge.Attributes["class"] = "badge badge-blue profile-role";

                                // Show level tracker section
                                levelSection.Style["display"] = "block";
                                levelNum.InnerText = $"Level {level}";

                                // Render XP Progress
                                int nextLevelXp = 500;
                                xpText.InnerText = $"{xp} / {nextLevelXp} XP";
                                double xpPercentage = ((double)xp / nextLevelXp) * 100;
                                xpFill.Style["width"] = $"{Math.Min(xpPercentage, 100)}%";
                            }
                            else if (role.Equals("instructor", StringComparison.OrdinalIgnoreCase))
                            {
                                profile_avatar.InnerHtml = "&#128104;&#2005;"; // Instructor emoji
                                profileRoleBadge.Attributes["class"] = "badge badge-purple profile-role";
                                levelSection.Style["display"] = "none";
                            }
                            else if (role.Equals("parent", StringComparison.OrdinalIgnoreCase))
                            {
                                profile_avatar.InnerHtml = "&#128105;"; // Parent emoji
                                profileRoleBadge.Attributes["class"] = "badge badge-green profile-role";
                                levelSection.Style["display"] = "none";
                            }
                        }
                    }
                }
            }
        }
    }
}