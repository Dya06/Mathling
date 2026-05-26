using System;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;
using System.Web.UI;

namespace Mathling
{
    public partial class Register : Page
    {
        private string connectionString = System.Configuration.ConfigurationManager
                                            .ConnectionStrings["MathlingDB"].ConnectionString;

        protected void Page_Load(object sender, EventArgs e)
        {
        }

        protected void RegBtn_Click(object sender, EventArgs e)
        {
            string name = RegName.Text.Trim();
            string email = RegEmail.Text.Trim();
            string password = RegPassword.Text.Trim();
            string role = RegRole.SelectedValue;

            if (string.IsNullOrWhiteSpace(name) ||
                string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(password))
            {
                ShowError("Please fill in all fields.");
                return;
            }

            if (string.IsNullOrWhiteSpace(role))
            {
                ShowError("Please select a role.");
                return;
            }

            try
            {
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    string checkQuery = "SELECT COUNT(*) FROM Users WHERE Email = @Email";
                    using (SqlCommand checkCmd = new SqlCommand(checkQuery, conn))
                    {
                        checkCmd.Parameters.AddWithValue("@Email", email);
                        int count = (int)checkCmd.ExecuteScalar();

                        if (count > 0)
                        {
                            ShowError("A user with this email already exists. Please use a different email.");
                            return;
                        }
                    }

                    string newId;
                    string maxIdQuery = "SELECT ISNULL(MAX(CAST(Id AS INT)), 0) + 1 FROM Users";
                    using (SqlCommand maxIdCmd = new SqlCommand(maxIdQuery, conn))
                    {
                        int nextNum = (int)maxIdCmd.ExecuteScalar();
                        newId = nextNum.ToString("D3");
                    }
                    string passwordHash = HashPassword(password);

                    string insertQuery = @"
                        INSERT INTO Users 
                            (Id, Name, Email, PasswordHash, Role, Avatar, Level, XP, CreatedAt, IsActive)
                        VALUES 
                            (@Id, @Name, @Email, @PasswordHash, @Role, @Avatar, @Level, @XP, @CreatedAt, @IsActive)";

                    using (SqlCommand insertCmd = new SqlCommand(insertQuery, conn))
                    {
                        insertCmd.Parameters.AddWithValue("@Id", newId);
                        insertCmd.Parameters.AddWithValue("@Name", name);
                        insertCmd.Parameters.AddWithValue("@Email", email);
                        insertCmd.Parameters.AddWithValue("@PasswordHash", passwordHash);
                        insertCmd.Parameters.AddWithValue("@Role", role);
                        insertCmd.Parameters.AddWithValue("@Avatar", role);
                        insertCmd.Parameters.AddWithValue("@Level", 1);
                        insertCmd.Parameters.AddWithValue("@XP", 0);
                        insertCmd.Parameters.AddWithValue("@CreatedAt", DateTime.Now);
                        insertCmd.Parameters.AddWithValue("@IsActive", 1);

                        insertCmd.ExecuteNonQuery();
                    }
                }
                ShowAlertAndRedirect("User created successfully! Redirecting to login...", "Login.aspx");
            }
            catch (Exception ex)
            {
                ShowError("Something went wrong: " + ex.Message);
            }
        }

        private string HashPassword(string password)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                StringBuilder sb = new StringBuilder();
                foreach (byte b in bytes)
                    sb.Append(b.ToString("X2"));
                return sb.ToString();
            }
        }

        private void ShowError(string message)
        {
            ErrorMessage.Text = message;
            ErrorMessage.Visible = true;
        }

        private void ShowAlertAndRedirect(string message, string url)
        {
            string safe = message.Replace("'", "\\'");
            ScriptManager.RegisterStartupScript(this, GetType(), "alertRedirect",
                $"alert('{safe}'); window.location='{url}';", true);
        }
    }
}