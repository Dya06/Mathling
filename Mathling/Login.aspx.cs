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
            // If already logged in, redirect away from login page
            if (Session["UserId"] != null)
            {
                RedirectByRole(Session["UserRole"]?.ToString());
            }
        }

        // =========================
        // 🔐 LOGIN BUTTON CLICK
        // =========================
        protected void LoginBtn_Click(object sender, EventArgs e)
        {
            string email = LoginEmail.Text.Trim();
            string password = LoginPassword.Text;

            // Basic validation
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
                    SELECT Id, Name, Role, PasswordHash
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
                    int id = Convert.ToInt32(reader["Id"]);

                    string inputHash = HashPassword(password);

                    if (inputHash == storedHash)
                    {
                        // ✅ Store user info in Session
                        Session["UserId"] = id;
                        Session["UserRole"] = role;
                        Session["UserName"] = name;
                        Session["UserEmail"] = email;

                        // Redirect based on role
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

        // =========================
        // 🔀 REDIRECT BY ROLE
        // =========================
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

        // =========================
        // ❌ SHOW ERROR
        // =========================
        private void ShowError(string message)
        {
            ErrorMessage.Text = message;
            ErrorMessage.Visible = true;
        }

        // =========================
        // 🔐 HASH FUNCTION (SHA256)
        // =========================
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
        // =========================
        // 🆕 REGISTER BUTTON CLICK
        // =========================
        protected void RegBtn_Click(object sender, EventArgs e)
        {
            string name = RegName.Text.Trim();
            string email = RegEmail.Text.Trim();
            string password = RegPassword.Text;
            string role = RegRole.Value; // Gets value from HiddenField set by JS

            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(role))
            {
                ShowError("Please fill in all registration fields and select a role.");
                return;
            }

            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                // Check if email exists
                string checkQuery = "SELECT COUNT(*) FROM Users WHERE Email = @Email";
                using (SqlCommand checkCmd = new SqlCommand(checkQuery, conn))
                {
                    checkCmd.Parameters.AddWithValue("@Email", email);
                    int exists = (int)checkCmd.ExecuteScalar();
                    if (exists > 0)
                    {
                        ShowError("An account with that email already exists.");
                        return;
                    }
                }

                // Insert user
                string insertQuery = @"
                    INSERT INTO Users (Name, Email, PasswordHash, Role, Level, XP)
                    OUTPUT INSERTED.Id
                    VALUES (@Name, @Email, @PasswordHash, @Role, 1, 0)";
                
                using (SqlCommand cmd = new SqlCommand(insertQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@Name", name);
                    cmd.Parameters.AddWithValue("@Email", email);
                    cmd.Parameters.AddWithValue("@PasswordHash", HashPassword(password));
                    cmd.Parameters.AddWithValue("@Role", role);

                    int newUserId = (int)cmd.ExecuteScalar();

                    // ✅ Log them in automatically
                    Session["UserId"] = newUserId;
                    Session["UserRole"] = role;
                    Session["UserName"] = name;
                    Session["UserEmail"] = email;

                    RedirectByRole(role);
                }
            }
        }
    }
}
