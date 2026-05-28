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

        /// <summary>
        /// Fetches user profile details from the database and binds them to the page controls.
        /// </summary>
        private void LoadUserProfile()
        {
            // Now that your database uses INT IDENTITY, we parse the session safely as an integer
            int userId = Convert.ToInt32(Session["UserId"]);
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string query = "SELECT Name, Email, Role, Avatar, Level, XP FROM Users WHERE Id = @Id";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    // Updated to SqlDbType.Int to match your shiny new INT database primary key!
                    cmd.Parameters.Add("@Id", SqlDbType.Int).Value = userId;

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            string name = reader["Name"].ToString();
                            string email = reader["Email"].ToString();
                            string role = reader["Role"].ToString();
                            int level = Convert.ToInt32(reader["Level"]);
                            int xp = Convert.ToInt32(reader["XP"]);

                            // 2. Bind straight to your elements declared in Profile.aspx
                            profileName.InnerText = name;
                            profileRoleBadge.InnerText = role.ToUpper();
                            lblEmail.InnerText = email;

                            // Assign customizable dynamic avatars and styles
                            if (role.Equals("student", StringComparison.OrdinalIgnoreCase))
                            {
                                profileAvatar.InnerHtml = "&#129330;"; // Student emoji
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
                                profileAvatar.InnerHtml = "&#128104;&#2005;"; // Instructor emoji
                                profileRoleBadge.Attributes["class"] = "badge badge-purple profile-role";
                                levelSection.Style["display"] = "none";
                            }
                            else if (role.Equals("parent", StringComparison.OrdinalIgnoreCase))
                            {
                                profileAvatar.InnerHtml = "&#128105;"; // Parent emoji
                                profileRoleBadge.Attributes["class"] = "badge badge-green profile-role";
                                levelSection.Style["display"] = "none";
                            }
                            else if (role.Equals("admin", StringComparison.OrdinalIgnoreCase))
                            {
                                profileAvatar.InnerHtml = "&#128100;"; // Admin/Default profile emoji
                                profileRoleBadge.Attributes["class"] = "badge badge-red profile-role";
                                levelSection.Style["display"] = "none";
                            }
                        }
                    }
                }
            }
        }
    }
}
