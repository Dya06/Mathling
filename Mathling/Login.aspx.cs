using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;
using System.Web.UI;

namespace Mathling
{
    public partial class Login : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (Session["UserId"] != null)
            {
                RedirectByRole(Session["UserRole"]?.ToString());
            }
        }

        //  LOGIN BUTTON CLICK
        protected void LoginBtn_Click(object sender, EventArgs e)
        {
            string email = LoginEmail.Text.Trim();
            string password = LoginPassword.Text;


            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                ShowError("Please fill in all fields.");
                return;
            }

            string connStr = ConfigurationManager
                .ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string query = @"
                    SELECT Id, Name, Role, PasswordHash, Avatar
                    FROM Users
                    WHERE Email = @Email
                    AND IsActive = 1";

                SqlCommand cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Email", email);

                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    string storedHash = reader["PasswordHash"].ToString();
                    string role = reader["Role"].ToString();
                    string name = reader["Name"].ToString();
                    string id = reader["Id"].ToString();
                    string avatar = reader["Avatar"] == DBNull.Value ? null : reader["Avatar"].ToString();

                    string inputHash = HashPassword(password);

                    if (inputHash.Equals(storedHash, StringComparison.OrdinalIgnoreCase))
                    {
                        Session["UserId"] = id;
                        Session["UserRole"] = role;
                        Session["UserName"] = name;
                        Session["UserEmail"] = email;
                        Session["UserAvatar"] = avatar;


                        RedirectByRole(role);
                    }
                    else
                    {
                        ShowError("Invalid email or password.");
                    }
                }
                else
                {
                    ShowError("Invalid email or password.");
                }
            }
        }


        //REDIRECT BY ROLE
        private void RedirectByRole(string role)
        {
            var destinations = new Dictionary<string, string>
            {
                { "student",    "Quiz.aspx"     },
                { "parent",     "Progress.aspx" },
                { "instructor", "Forum.aspx"    },
                { "admin",      "Admin.aspx"    }
            };

            string dest = destinations.ContainsKey(role ?? "")
                ? destinations[role]
                : "Default.aspx";

            Response.Redirect(dest);
        }
        private void ShowError(string message)
        {
            ErrorMessage.Text = message;
            ErrorMessage.Visible = true;
        }
        private static string HashPassword(string password)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(
                    Encoding.UTF8.GetBytes(password));

                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                    builder.Append(bytes[i].ToString("x2"));

                return builder.ToString();
            }
        }
    }
}
