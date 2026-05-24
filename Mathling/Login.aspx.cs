using System;
using System.Configuration;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;
using System.Web.Services;
using System.Web.UI;

namespace Mathling
{
    public partial class Login : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
        }

        // =========================
        // 🔐 LOGIN USER ONLY
        // =========================
        [WebMethod]
        public static string LoginUser(string email, string password)
        {
            string connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

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

                    if (VerifyPassword(password, storedHash))
                    {
                        // optional: you can store session later
                        return $"success|{role}|{name}|{id}";
                    }
                }

                return "invalid";
            }
        }

        // =========================
        // 🔐 PASSWORD VERIFY
        // =========================
        private static bool VerifyPassword(string password, string storedHash)
        {
            string hashOfInput = HashPassword(password);
            return hashOfInput == storedHash;
        }

        // =========================
        // 🔐 HASH FUNCTION (SHA256)
        // =========================
        private static string HashPassword(string password)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                StringBuilder builder = new StringBuilder();

                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }

                return builder.ToString();
            }
        }
    }
}