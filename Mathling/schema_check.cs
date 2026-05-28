using System;
using System.Data.SqlClient;

class Program
{
    static void Main()
    {
        string connStr = @"Data Source=(LocalDB)\MSSQLLocalDB;AttachDbFilename=C:\Users\Dyasi\Desktop\Projects\Test\Mathling\App_Data\MathlingDB.mdf;Integrated Security=True";
        
        using (SqlConnection conn = new SqlConnection(connStr))
        {
            conn.Open();
            using (SqlCommand cmd = new SqlCommand("SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('Users', 'ForumThreads', 'ForumReplies')", conn))
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Console.WriteLine(string.Format("{0}.{1} - {2}", reader["TABLE_NAME"], reader["COLUMN_NAME"], reader["DATA_TYPE"]));
                }
            }

            Console.WriteLine("--- Users Data ---");
            using (SqlCommand cmd = new SqlCommand("SELECT Id, Name FROM Users", conn))
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Console.WriteLine(string.Format("ID: {0}, Name: {1}", reader["Id"], reader["Name"]));
                }
            }

            Console.WriteLine("--- ForumThreads Data ---");
            using (SqlCommand cmd = new SqlCommand("SELECT Id, AuthorId FROM ForumThreads", conn))
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    Console.WriteLine(string.Format("ID: {0}, AuthorId: {1}", reader["Id"], reader["AuthorId"]));
                }
            }
        }
    }
}
