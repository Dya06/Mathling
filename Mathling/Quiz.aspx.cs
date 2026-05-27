using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;

namespace Mathling
{
    public partial class Quiz : Page
    {
        private readonly string _connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

        private string SelectedFormulaName
        {
            get
            {
                string formula = Request.QueryString["formula"];
                if (string.IsNullOrWhiteSpace(formula)) return "SF+4";

                formula = formula.Trim().ToUpperInvariant();
                if (formula == "SF+4" || formula == "SF+3" || formula == "SF+2" || formula == "SF+1")
                {
                    return formula;
                }

                return "SF+4";
            }
        }

        private QuizFormula CurrentFormula
        {
            get { return Session["QuizFormula"] as QuizFormula; }
            set { Session["QuizFormula"] = value; }
        }

        private string SelectedModuleId
        {
            get { return Session["QuizSelectedModuleId"] == null ? string.Empty : Session["QuizSelectedModuleId"].ToString(); }
            set { Session["QuizSelectedModuleId"] = value; }
        }

        private string SelectedSetId
        {
            get { return Session["QuizSelectedSetId"] == null ? string.Empty : Session["QuizSelectedSetId"].ToString(); }
            set { Session["QuizSelectedSetId"] = value; }
        }

        private int QuestionIndex
        {
            get { return Session["QuizQuestionIndex"] == null ? 0 : (int)Session["QuizQuestionIndex"]; }
            set { Session["QuizQuestionIndex"] = value; }
        }

        private int TotalCorrect
        {
            get { return Session["QuizTotalCorrect"] == null ? 0 : (int)Session["QuizTotalCorrect"]; }
            set { Session["QuizTotalCorrect"] = value; }
        }

        private string CurrentAnswer
        {
            get { return Session["QuizCurrentAnswer"] == null ? string.Empty : Session["QuizCurrentAnswer"].ToString(); }
            set { Session["QuizCurrentAnswer"] = value; }
        }

        private int TimeLeft
        {
            get { return Session["QuizTimeLeft"] == null ? 0 : (int)Session["QuizTimeLeft"]; }
            set { Session["QuizTimeLeft"] = value; }
        }

        private int FlashIndex
        {
            get { return Session["QuizFlashIndex"] == null ? 0 : (int)Session["QuizFlashIndex"]; }
            set { Session["QuizFlashIndex"] = value; }
        }

        private DateTime SetStartedAt
        {
            get { return Session["QuizSetStartedAt"] == null ? DateTime.Now : (DateTime)Session["QuizSetStartedAt"]; }
            set { Session["QuizSetStartedAt"] = value; }
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            if (Session["UserId"] == null || !string.Equals(Session["UserRole"]?.ToString(), "student", StringComparison.OrdinalIgnoreCase))
            {
                Response.Redirect("Login.aspx");
                return;
            }

            // Formula access rule:
            // SF+4 is open by default.
            // SF+3 unlocks only after SF+4 Assessment is completed.
            // SF+2 unlocks only after SF+3 Assessment is completed.
            // SF+1 unlocks only after SF+2 Assessment is completed.
            if (!IsFormulaUnlocked(SelectedFormulaName))
            {
                string allowedFormula = GetHighestUnlockedFormulaName();
                Response.Redirect("Quiz.aspx?formula=" + Server.UrlEncode(allowedFormula), false);
                Context.ApplicationInstance.CompleteRequest();
                return;
            }

            if (!IsPostBack)
            {
                CurrentFormula = LoadFormulaFromDatabase();
                SelectedModuleId = string.Empty;
                SelectedSetId = string.Empty;
                QuestionIndex = 0;
                TotalCorrect = 0;
                CurrentAnswer = string.Empty;
                FlashIndex = 0;
                Session["QuizNextFormula"] = string.Empty;

                BindBaseContent();
                BindModuleSidebar();
                ShowStartScreen();
            }
        }

        private void BindBaseContent()
        {
            if (CurrentFormula == null)
            {
                ShowMessage("Quiz data missing", "No formula data was found in the database for " + Server.HtmlEncode(SelectedFormulaName) + ". Run FormulaAbacus.sql first.");
                return;
            }

            FormulaNameLiteral.Text = Server.HtmlEncode(CurrentFormula.Name);
            FormulaRuleLiteral.Text = "= " + Server.HtmlEncode(CurrentFormula.Rule);
            StartFormulaNameLiteral.Text = Server.HtmlEncode(CurrentFormula.Name);
            StartDescriptionLiteral.Text = Server.HtmlEncode(CurrentFormula.Description);
            StartRuleLiteral.Text = Server.HtmlEncode(CurrentFormula.Name + " = " + CurrentFormula.Rule);
        }

        private void BindModuleSidebar()
        {
            if (CurrentFormula == null) return;
            ModuleRepeater.DataSource = CurrentFormula.Modules.OrderBy(m => m.SortOrder).ToList();
            ModuleRepeater.DataBind();
        }

        protected void ModuleRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
        {
            if (e.Item.ItemType != ListItemType.Item && e.Item.ItemType != ListItemType.AlternatingItem) return;

            var module = (QuizModule)e.Item.DataItem;
            var button = (LinkButton)e.Item.FindControl("ModuleButton");
            var completedLiteral = (Literal)e.Item.FindControl("CompletedLiteral");

            string css = "module-nav-item";
            if (module.Id == SelectedModuleId) css += " active";
            if (IsModuleCompleted(module.Id)) css += " completed";

            button.CssClass = css;
            completedLiteral.Text = IsModuleCompleted(module.Id) ? "<span class='mod-check'>✅</span>" : string.Empty;
        }

        protected void ModuleRepeater_ItemCommand(object source, RepeaterCommandEventArgs e)
        {
            if (e.CommandName != "SelectModule") return;
            SelectedModuleId = e.CommandArgument.ToString();
            SelectedSetId = string.Empty;
            AssessmentTimer.Enabled = false;
            FlashTimer.Enabled = false;
            BindModuleSidebar();
            ShowModuleIntro();
        }

        protected void StartLearningButton_Click(object sender, EventArgs e)
        {
            var firstModule = CurrentFormula?.Modules.OrderBy(m => m.SortOrder).FirstOrDefault();
            if (firstModule == null)
            {
                ShowMessage("No module found", "The formula exists, but no quiz modules were found.");
                return;
            }

            SelectedModuleId = firstModule.Id;
            BindModuleSidebar();
            ShowModuleIntro();
        }

        private void ShowStartScreen()
        {
            HideAllPanels();
            StartPanel.Visible = true;
            AssessmentTimer.Enabled = false;
            FlashTimer.Enabled = false;
            BindBaseContent();
        }

        private void ShowModuleIntro()
        {
            HideAllPanels();
            ModuleIntroPanel.Visible = true;

            QuizModule module = GetSelectedModule();
            if (module == null)
            {
                ShowMessage("Module not found", "Please select a valid module.");
                return;
            }

            SetModuleTag(ModuleTagSpan, module);
            ModuleTagLiteral.Text = GetModuleIcon(module.Icon) + " " + Server.HtmlEncode(module.Title);
            ModuleTitleLiteral.Text = Server.HtmlEncode(module.Title);
            ModuleDescriptionLiteral.Text = Server.HtmlEncode(module.Description);
            ModuleTimerLiteral.Text = module.IsTimed ? "<p style='color:var(--accent-red);font-weight:700;margin-top:var(--space-md)'>⏱️ Time Limit: " + module.TimeLimitSec + " seconds</p>" : string.Empty;
            MentalBannerPanel.Visible = module.MentalMode;

            SetRepeater.DataSource = module.Sets.OrderBy(s => s.SortOrder).Select(s => new
            {
                s.Id,
                s.Label,
                s.DisplayMode,
                QuestionCount = s.Questions.Count
            }).ToList();
            SetRepeater.DataBind();
        }

        protected void SetRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
        {
            if (e.Item.ItemType != ListItemType.Item && e.Item.ItemType != ListItemType.AlternatingItem) return;
            var button = (LinkButton)e.Item.FindControl("SetButton");
            string setId = DataBinder.Eval(e.Item.DataItem, "Id").ToString();
            var set = GetSelectedModule()?.Sets.FirstOrDefault(s => s.Id == setId);

            if (set == null || set.Questions.Count == 0)
            {
                button.Enabled = false;
                button.CssClass = "btn btn-secondary";
                button.Style["opacity"] = "0.5";
            }
        }

        protected void SetRepeater_ItemCommand(object source, RepeaterCommandEventArgs e)
        {
            if (e.CommandName != "SelectSet") return;
            SelectedSetId = e.CommandArgument.ToString();
            StartSet();
        }

        private void StartSet()
        {
            QuizSet set = GetSelectedSet();
            QuizModule module = GetSelectedModule();

            if (set == null || set.Questions.Count == 0)
            {
                ShowMessage("No questions", "This set does not have questions yet.");
                return;
            }

            QuestionIndex = 0;
            TotalCorrect = 0;
            CurrentAnswer = string.Empty;
            FlashIndex = 0;
            SetStartedAt = DateTime.Now;
            Session["QuizNextFormula"] = string.Empty;

            if (module.IsTimed)
            {
                TimeLeft = module.TimeLimitSec.HasValue ? module.TimeLimitSec.Value : 60;
                AssessmentTimer.Enabled = true;
            }
            else
            {
                AssessmentTimer.Enabled = false;
            }

            RenderQuestion();
        }

        private void RenderQuestion()
        {
            QuizModule module = GetSelectedModule();
            QuizSet set = GetSelectedSet();

            if (module == null || set == null || QuestionIndex >= set.Questions.Count)
            {
                ShowSetComplete();
                return;
            }

            HideAllPanels();
            QuestionPanel.Visible = true;
            FeedbackPanel.Visible = false;

            QuizQuestion question = set.Questions[QuestionIndex];

            SetModuleTag(QuestionTagSpan, module);
            QuestionTagLiteral.Text = GetModuleIcon(module.Icon) + " " + Server.HtmlEncode(set.Label);
            TimerPanel.Visible = module.IsTimed;
            QuestionMentalBannerPanel.Visible = module.MentalMode && QuestionIndex == 0;

            if (module.IsTimed)
            {
                TimerValueLiteral.Text = TimeLeft + "s";
                int maxTime = module.TimeLimitSec.HasValue ? module.TimeLimitSec.Value : 60;
                decimal pct = maxTime <= 0 ? 0 : ((decimal)TimeLeft / maxTime) * 100;
                TimerFillDiv.Attributes["style"] = "width:" + Math.Max(0, Math.Min(100, pct)).ToString("0") + "%";
            }

            QuestionNumberLiteral.Text = "Question " + (QuestionIndex + 1) + " of " + set.Questions.Count;
            ScoreLiteral.Text = TotalCorrect + "/" + QuestionIndex + " correct";
            ProgressFillDiv.Attributes["style"] = "width:" + ((decimal)QuestionIndex / set.Questions.Count * 100).ToString("0") + "%";

            CurrentAnswer = CurrentAnswer ?? string.Empty;
            AnswerDisplayLiteral.Text = string.IsNullOrEmpty(CurrentAnswer) ? "_" : Server.HtmlEncode(CurrentAnswer);

            if (string.Equals(set.DisplayMode, "flash", StringComparison.OrdinalIgnoreCase))
            {
                FlashIndex = 0;
                FlashTimer.Enabled = true;
                RenderFlashQuestion(question);
            }
            else
            {
                FlashTimer.Enabled = false;
                RenderStaticQuestion(question);
            }
        }

        private void RenderStaticQuestion(QuizQuestion question)
        {
            var html = new StringBuilder();
            html.Append("<div class='vq-counter'>📝</div>");
            html.Append("<div class='vertical-question'>");

            for (int i = 0; i < question.Rows.Count; i++)
            {
                int row = question.Rows[i];
                string css = row < 0 ? "vq-row negative" : "vq-row";
                string display = row < 0 ? "−" + Math.Abs(row) : row.ToString();
                html.Append("<div class='").Append(css).Append("'>").Append(display).Append("</div>");
            }

            html.Append("<div class='vq-separator'></div>");
            html.Append("<div class='vq-answer-slot'>").Append(string.IsNullOrEmpty(CurrentAnswer) ? "?" : Server.HtmlEncode(CurrentAnswer)).Append("</div>");
            html.Append("</div>");
            QuestionDisplayLiteral.Text = html.ToString();
        }

        private void RenderFlashQuestion(QuizQuestion question)
        {
            string display;
            string css = "flash-number show";

            if (FlashIndex < question.Rows.Count)
            {
                int value = question.Rows[FlashIndex];
                display = value < 0 ? "−" + Math.Abs(value) : value.ToString();
                if (value < 0) css += " negative";
            }
            else
            {
                display = "?";
                FlashTimer.Enabled = false;
            }

            QuestionDisplayLiteral.Text =
                "<div class='vq-counter'>Watch carefully! 👀</div>" +
                "<div class='vertical-question' style='min-height:180px;justify-content:center;align-items:center;'>" +
                "<div class='flash-container'><div class='" + css + "'>" + display + "</div></div>" +
                "</div>";
        }

        protected void FlashTimer_Tick(object sender, EventArgs e)
        {
            QuizQuestion question = GetCurrentQuestion();
            if (question == null)
            {
                FlashTimer.Enabled = false;
                return;
            }

            FlashIndex++;
            RenderFlashQuestion(question);
        }

        protected void AssessmentTimer_Tick(object sender, EventArgs e)
        {
            if (!QuestionPanel.Visible) return;

            TimeLeft--;
            if (TimeLeft <= 0)
            {
                TimeLeft = 0;
                AssessmentTimer.Enabled = false;
                FlashTimer.Enabled = false;
                ShowSetComplete();
                return;
            }

            RenderQuestionWithoutResettingFlash();
        }

        private void RenderQuestionWithoutResettingFlash()
        {
            QuizModule module = GetSelectedModule();
            QuizSet set = GetSelectedSet();
            QuizQuestion question = GetCurrentQuestion();
            if (module == null || set == null || question == null) return;

            TimerValueLiteral.Text = TimeLeft + "s";
            int maxTime = module.TimeLimitSec.HasValue ? module.TimeLimitSec.Value : 60;
            decimal pct = maxTime <= 0 ? 0 : ((decimal)TimeLeft / maxTime) * 100;
            TimerFillDiv.Attributes["style"] = "width:" + Math.Max(0, Math.Min(100, pct)).ToString("0") + "%";
        }

        protected void Numpad_Command(object sender, CommandEventArgs e)
        {
            string value = e.CommandArgument.ToString();

            if (value == "clear")
            {
                CurrentAnswer = string.Empty;
            }
            else if (value == "back")
            {
                CurrentAnswer = string.IsNullOrEmpty(CurrentAnswer) ? string.Empty : CurrentAnswer.Substring(0, CurrentAnswer.Length - 1);
            }
            else if (value == "submit")
            {
                CheckAnswer();
                return;
            }
            else if (CurrentAnswer.Length < 5)
            {
                CurrentAnswer += value;
            }

            RenderQuestionPreserveFlash();
        }

        private void RenderQuestionPreserveFlash()
        {
            QuizSet set = GetSelectedSet();
            QuizQuestion question = GetCurrentQuestion();
            if (set == null || question == null) return;

            if (string.Equals(set.DisplayMode, "static", StringComparison.OrdinalIgnoreCase))
            {
                RenderStaticQuestion(question);
            }

            AnswerDisplayLiteral.Text = string.IsNullOrEmpty(CurrentAnswer) ? "_" : Server.HtmlEncode(CurrentAnswer);
        }

        private void CheckAnswer()
        {
            QuizQuestion question = GetCurrentQuestion();
            if (question == null) return;

            FlashTimer.Enabled = false;

            int submittedAnswer;
            if (!int.TryParse(CurrentAnswer, out submittedAnswer))
            {
                AnswerDisplayLiteral.Text = "Enter answer";
                return;
            }

            bool isCorrect = submittedAnswer == question.Answer;
            if (isCorrect) TotalCorrect++;

            ShowTemporaryFeedback(isCorrect ? "Correct! 🎉" : "Not Quite 😅",
                isCorrect ? "Great job! Keep going." : "The correct answer was " + question.Answer + ". Keep trying.",
                true);
        }

        private void ShowTemporaryFeedback(string title, string body, bool canContinue)
        {
            QuestionPanel.Visible = false;
            FeedbackPanel.Visible = true;
            FeedbackTitleLiteral.Text = Server.HtmlEncode(title);
            FeedbackBodyLiteral.Text = Server.HtmlEncode(body);
            NextQuestionButton.Text = "Next Question";
            NextQuestionButton.Visible = canContinue;
        }

        protected void NextQuestionButton_Click(object sender, EventArgs e)
        {
            QuestionIndex++;
            CurrentAnswer = string.Empty;
            FlashIndex = 0;

            QuizSet set = GetSelectedSet();
            if (set == null || QuestionIndex >= set.Questions.Count)
            {
                ShowSetComplete();
            }
            else
            {
                RenderQuestion();
            }
        }

        private void ShowSetComplete()
        {
            AssessmentTimer.Enabled = false;
            FlashTimer.Enabled = false;

            QuizSet set = GetSelectedSet();
            QuizModule module = GetSelectedModule();
            if (set == null || module == null) return;

            SaveQuizResult();
            MarkModuleCompleted(module.Id);
            BindModuleSidebar();

            HideAllPanels();
            CompletePanel.Visible = true;

            int total = set.Questions.Count;
            int pct = total == 0 ? 0 : (int)Math.Round((decimal)TotalCorrect / total * 100);

            CompleteIconLiteral.Text = pct >= 80 ? "🎊" : pct >= 50 ? "👍" : "💪";
            CompleteTitleLiteral.Text = Server.HtmlEncode(set.Label + " — Complete!");
            CompleteCorrectLiteral.Text = TotalCorrect + "/" + total;
            CompletePercentageLiteral.Text = pct + "%";

            string nextFormula = null;
            if (string.Equals(module.ModuleKey, "assessment", StringComparison.OrdinalIgnoreCase))
            {
                nextFormula = GetNextFormulaName(SelectedFormulaName);
            }

            Session["QuizNextFormula"] = nextFormula ?? string.Empty;
            BackToModuleButton.Text = string.IsNullOrEmpty(nextFormula) ? "← Back to Module" : "Continue to " + nextFormula + " →";
        }

        protected void RetryButton_Click(object sender, EventArgs e)
        {
            StartSet();
        }

        protected void BackToModuleButton_Click(object sender, EventArgs e)
        {
            string nextFormula = Session["QuizNextFormula"] == null ? string.Empty : Session["QuizNextFormula"].ToString();
            if (!string.IsNullOrEmpty(nextFormula))
            {
                Response.Redirect(GetFormulaUrl(nextFormula));
                return;
            }

            ShowModuleIntro();
        }

        private void HideAllPanels()
        {
            MessagePanel.Visible = false;
            StartPanel.Visible = false;
            ModuleIntroPanel.Visible = false;
            QuestionPanel.Visible = false;
            FeedbackPanel.Visible = false;
            CompletePanel.Visible = false;
        }

        private void ShowMessage(string title, string body)
        {
            HideAllPanels();
            MessagePanel.Visible = true;
            MessageTitleLiteral.Text = Server.HtmlEncode(title);
            MessageBodyLiteral.Text = Server.HtmlEncode(body);
        }

        private QuizModule GetSelectedModule()
        {
            return CurrentFormula?.Modules.FirstOrDefault(m => m.Id == SelectedModuleId);
        }

        private QuizSet GetSelectedSet()
        {
            return GetSelectedModule()?.Sets.FirstOrDefault(s => s.Id == SelectedSetId);
        }

        private QuizQuestion GetCurrentQuestion()
        {
            QuizSet set = GetSelectedSet();
            if (set == null || QuestionIndex < 0 || QuestionIndex >= set.Questions.Count) return null;
            return set.Questions[QuestionIndex];
        }

        private bool IsModuleCompleted(string moduleId)
        {
            string userId = Session["UserId"].ToString();
            using (SqlConnection conn = new SqlConnection(_connStr))
            using (SqlCommand cmd = new SqlCommand(@"
                SELECT COUNT(*)
                FROM [ModuleProgress]
                WHERE [UserId] = @UserId AND [ModuleId] = @ModuleId AND [IsCompleted] = 1", conn))
            {
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@ModuleId", moduleId);
                conn.Open();
                return (int)cmd.ExecuteScalar() > 0;
            }
        }

        private void SaveQuizResult()
        {
            QuizSet set = GetSelectedSet();
            if (set == null) return;

            string userId = Session["UserId"].ToString();
            int total = set.Questions.Count;
            decimal percentage = total == 0 ? 0 : Math.Round((decimal)TotalCorrect / total * 100, 2);
            int timeTaken = Math.Max(0, (int)(DateTime.Now - SetStartedAt).TotalSeconds);
            int score = TotalCorrect * 10;

            using (SqlConnection conn = new SqlConnection(_connStr))
            {
                conn.Open();
                string resultId = GetNextId(conn, "QuizResults", "QR", 6);

                using (SqlCommand cmd = new SqlCommand(@"
                    INSERT INTO [QuizResults] ([Id], [UserId], [SetId], [Score], [TotalCorrect], [TotalQuestions], [Percentage], [TimeTakenSec])
                    VALUES (@Id, @UserId, @SetId, @Score, @TotalCorrect, @TotalQuestions, @Percentage, @TimeTakenSec);

                    UPDATE [Users]
                    SET [XP] = [XP] + @Score,
                        [Level] = CASE WHEN (([XP] + @Score) / 100) + 1 > [Level] THEN (([XP] + @Score) / 100) + 1 ELSE [Level] END
                    WHERE [Id] = @UserId;", conn))
                {
                    cmd.Parameters.AddWithValue("@Id", resultId);
                    cmd.Parameters.AddWithValue("@UserId", userId);
                    cmd.Parameters.AddWithValue("@SetId", set.Id);
                    cmd.Parameters.AddWithValue("@Score", score);
                    cmd.Parameters.AddWithValue("@TotalCorrect", TotalCorrect);
                    cmd.Parameters.AddWithValue("@TotalQuestions", total);
                    cmd.Parameters.AddWithValue("@Percentage", percentage);
                    cmd.Parameters.AddWithValue("@TimeTakenSec", timeTaken);
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private void MarkModuleCompleted(string moduleId)
        {
            string userId = Session["UserId"].ToString();

            using (SqlConnection conn = new SqlConnection(_connStr))
            {
                conn.Open();

                using (SqlCommand existsCmd = new SqlCommand(@"
                    SELECT [Id]
                    FROM [ModuleProgress]
                    WHERE [UserId] = @UserId AND [ModuleId] = @ModuleId", conn))
                {
                    existsCmd.Parameters.AddWithValue("@UserId", userId);
                    existsCmd.Parameters.AddWithValue("@ModuleId", moduleId);
                    object existingId = existsCmd.ExecuteScalar();

                    if (existingId != null)
                    {
                        using (SqlCommand updateCmd = new SqlCommand(@"
                            UPDATE [ModuleProgress]
                            SET [IsCompleted] = 1, [CompletedAt] = GETDATE()
                            WHERE [Id] = @Id", conn))
                        {
                            updateCmd.Parameters.AddWithValue("@Id", existingId.ToString());
                            updateCmd.ExecuteNonQuery();
                        }
                    }
                    else
                    {
                        string progressId = GetNextId(conn, "ModuleProgress", "MP", 6);
                        using (SqlCommand insertCmd = new SqlCommand(@"
                            INSERT INTO [ModuleProgress] ([Id], [UserId], [ModuleId], [IsCompleted], [CompletedAt])
                            VALUES (@Id, @UserId, @ModuleId, 1, GETDATE())", conn))
                        {
                            insertCmd.Parameters.AddWithValue("@Id", progressId);
                            insertCmd.Parameters.AddWithValue("@UserId", userId);
                            insertCmd.Parameters.AddWithValue("@ModuleId", moduleId);
                            insertCmd.ExecuteNonQuery();
                        }
                    }
                }
            }
        }

        private QuizFormula LoadFormulaFromDatabase()
        {
            QuizFormula formula = null;
            var modules = new Dictionary<string, QuizModule>();
            var sets = new Dictionary<string, QuizSet>();
            var questions = new Dictionary<string, QuizQuestion>();

            using (SqlConnection conn = new SqlConnection(_connStr))
            {
                conn.Open();

                using (SqlCommand cmd = new SqlCommand(@"
                    SELECT TOP 1 [Id], [Name], [Rule], [Description], [SortOrder]
                    FROM [Formulas]
                    WHERE [Name] = @Name AND [IsActive] = 1", conn))
                {
                    cmd.Parameters.AddWithValue("@Name", SelectedFormulaName);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            formula = new QuizFormula
                            {
                                Id = reader["Id"].ToString(),
                                Name = reader["Name"].ToString(),
                                Rule = reader["Rule"].ToString(),
                                Description = reader["Description"].ToString(),
                                SortOrder = Convert.ToInt32(reader["SortOrder"]),
                                Modules = new List<QuizModule>()
                            };
                        }
                    }
                }

                if (formula == null) return null;

                using (SqlCommand cmd = new SqlCommand(@"
                    SELECT [Id], [FormulaId], [ModuleKey], [Title], [Icon], [Description], [UseAbacus], [MentalMode], [IsTimed], [TimeLimitSec], [SortOrder]
                    FROM [Modules]
                    WHERE [FormulaId] = @FormulaId
                    ORDER BY [SortOrder]", conn))
                {
                    cmd.Parameters.AddWithValue("@FormulaId", formula.Id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var module = new QuizModule
                            {
                                Id = reader["Id"].ToString(),
                                FormulaId = reader["FormulaId"].ToString(),
                                ModuleKey = reader["ModuleKey"].ToString(),
                                Title = reader["Title"].ToString(),
                                Icon = reader["Icon"].ToString(),
                                Description = reader["Description"].ToString(),
                                UseAbacus = Convert.ToBoolean(reader["UseAbacus"]),
                                MentalMode = Convert.ToBoolean(reader["MentalMode"]),
                                IsTimed = Convert.ToBoolean(reader["IsTimed"]),
                                TimeLimitSec = reader["TimeLimitSec"] == DBNull.Value ? (int?)null : Convert.ToInt32(reader["TimeLimitSec"]),
                                SortOrder = Convert.ToInt32(reader["SortOrder"]),
                                Sets = new List<QuizSet>()
                            };
                            modules[module.Id] = module;
                            formula.Modules.Add(module);
                        }
                    }
                }

                using (SqlCommand cmd = new SqlCommand(@"
                    SELECT qs.[Id], qs.[ModuleId], qs.[Label], qs.[DisplayMode], qs.[SortOrder]
                    FROM [QuestionSets] qs
                    INNER JOIN [Modules] m ON qs.[ModuleId] = m.[Id]
                    WHERE m.[FormulaId] = @FormulaId
                    ORDER BY m.[SortOrder], qs.[SortOrder]", conn))
                {
                    cmd.Parameters.AddWithValue("@FormulaId", formula.Id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var set = new QuizSet
                            {
                                Id = reader["Id"].ToString(),
                                ModuleId = reader["ModuleId"].ToString(),
                                Label = reader["Label"].ToString(),
                                DisplayMode = reader["DisplayMode"].ToString(),
                                SortOrder = Convert.ToInt32(reader["SortOrder"]),
                                Questions = new List<QuizQuestion>()
                            };
                            sets[set.Id] = set;
                            if (modules.ContainsKey(set.ModuleId)) modules[set.ModuleId].Sets.Add(set);
                        }
                    }
                }

                using (SqlCommand cmd = new SqlCommand(@"
                    SELECT q.[Id], q.[SetId], q.[Answer], q.[SortOrder]
                    FROM [Questions] q
                    INNER JOIN [QuestionSets] qs ON q.[SetId] = qs.[Id]
                    INNER JOIN [Modules] m ON qs.[ModuleId] = m.[Id]
                    WHERE m.[FormulaId] = @FormulaId
                    ORDER BY qs.[SortOrder], q.[SortOrder]", conn))
                {
                    cmd.Parameters.AddWithValue("@FormulaId", formula.Id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var question = new QuizQuestion
                            {
                                Id = reader["Id"].ToString(),
                                SetId = reader["SetId"].ToString(),
                                Answer = Convert.ToInt32(reader["Answer"]),
                                SortOrder = Convert.ToInt32(reader["SortOrder"]),
                                Rows = new List<int>()
                            };
                            questions[question.Id] = question;
                            if (sets.ContainsKey(question.SetId)) sets[question.SetId].Questions.Add(question);
                        }
                    }
                }

                using (SqlCommand cmd = new SqlCommand(@"
                    SELECT qr.[QuestionId], qr.[Value], qr.[SortOrder]
                    FROM [QuestionRows] qr
                    INNER JOIN [Questions] q ON qr.[QuestionId] = q.[Id]
                    INNER JOIN [QuestionSets] qs ON q.[SetId] = qs.[Id]
                    INNER JOIN [Modules] m ON qs.[ModuleId] = m.[Id]
                    WHERE m.[FormulaId] = @FormulaId
                    ORDER BY q.[SortOrder], qr.[SortOrder]", conn))
                {
                    cmd.Parameters.AddWithValue("@FormulaId", formula.Id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            string questionId = reader["QuestionId"].ToString();
                            if (questions.ContainsKey(questionId))
                            {
                                questions[questionId].Rows.Add(Convert.ToInt32(reader["Value"]));
                            }
                        }
                    }
                }
            }

            return formula;
        }

        private string GetNextId(SqlConnection conn, string tableName, string prefix, int digits)
        {
            string sql = "SELECT ISNULL(MAX(TRY_CAST(SUBSTRING([Id], @StartAt, 20) AS INT)), 0) FROM [" + tableName + "] WHERE [Id] LIKE @LikePattern";
            using (SqlCommand cmd = new SqlCommand(sql, conn))
            {
                cmd.Parameters.AddWithValue("@StartAt", prefix.Length + 1);
                cmd.Parameters.AddWithValue("@LikePattern", prefix + "%");
                int current = Convert.ToInt32(cmd.ExecuteScalar());
                return prefix + (current + 1).ToString().PadLeft(digits, '0');
            }
        }

        private string GetNextFormulaName(string currentFormula)
        {
            switch (currentFormula)
            {
                case "SF+4": return "SF+3";
                case "SF+3": return "SF+2";
                case "SF+2": return "SF+1";
                default: return null;
            }
        }

        private string GetPreviousFormulaName(string formulaName)
        {
            switch (formulaName)
            {
                case "SF+3": return "SF+4";
                case "SF+2": return "SF+3";
                case "SF+1": return "SF+2";
                default: return null;
            }
        }

        private bool IsFormulaUnlocked(string formulaName)
        {
            formulaName = (formulaName ?? string.Empty).Trim().ToUpperInvariant();

            // First formula is always available.
            if (formulaName == "SF+4") return true;

            string previousFormula = GetPreviousFormulaName(formulaName);
            if (string.IsNullOrEmpty(previousFormula)) return false;

            return IsAssessmentCompletedForFormula(previousFormula);
        }

        private bool IsAssessmentCompletedForFormula(string formulaName)
        {
            string userId = Session["UserId"] == null ? string.Empty : Session["UserId"].ToString();
            if (string.IsNullOrWhiteSpace(userId)) return false;

            using (SqlConnection conn = new SqlConnection(_connStr))
            {
                conn.Open();
                using (SqlCommand cmd = new SqlCommand(@"
                    SELECT COUNT(1)
                    FROM [ModuleProgress] mp
                    INNER JOIN [Modules] m ON mp.[ModuleId] = m.[Id]
                    INNER JOIN [Formulas] f ON m.[FormulaId] = f.[Id]
                    WHERE mp.[UserId] = @UserId
                      AND mp.[IsCompleted] = 1
                      AND f.[Name] = @FormulaName
                      AND m.[ModuleKey] = 'assessment'", conn))
                {
                    cmd.Parameters.AddWithValue("@UserId", userId);
                    cmd.Parameters.AddWithValue("@FormulaName", formulaName);
                    return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
                }
            }
        }

        private string GetHighestUnlockedFormulaName()
        {
            if (IsFormulaUnlocked("SF+1")) return "SF+1";
            if (IsFormulaUnlocked("SF+2")) return "SF+2";
            if (IsFormulaUnlocked("SF+3")) return "SF+3";
            return "SF+4";
        }

        protected string GetFormulaLinkCss(string formulaName)
        {
            string css = "formula-link";

            if (string.Equals(SelectedFormulaName, formulaName, StringComparison.OrdinalIgnoreCase))
            {
                css += " active";
            }

            if (!IsFormulaUnlocked(formulaName))
            {
                css += " locked";
            }

            return css;
        }

        protected string GetFormulaUrl(string formulaName)
        {
            if (!IsFormulaUnlocked(formulaName))
            {
                return "#";
            }

            return "Quiz.aspx?formula=" + Server.UrlEncode(formulaName);
        }

        protected string GetFormulaLinkLabel(string formulaName)
        {
            return IsFormulaUnlocked(formulaName) ? formulaName : "🔒 " + formulaName;
        }

        public string GetModuleIcon(object iconValue)
        {
            string icon = iconValue == null ? string.Empty : iconValue.ToString();
            switch (icon)
            {
                case "book": return "📖";
                case "abacus": return "🧮";
                case "brain": return "🧠";
                case "prep": return "📝";
                case "trophy": return "🏆";
                default: return string.IsNullOrWhiteSpace(icon) ? "📌" : Server.HtmlEncode(icon);
            }
        }

        private void SetModuleTag(HtmlGenericControl tag, QuizModule module)
        {
            string css = "module-tag ";
            if (module.IsTimed) css += "tag-assessment";
            else if (module.MentalMode) css += "tag-mental";
            else if (module.UseAbacus && module.ModuleKey != "learning") css += "tag-exercise";
            else css += "tag-learning";
            tag.Attributes["class"] = css;
        }
    }

    [Serializable]
    public class QuizFormula
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Rule { get; set; }
        public string Description { get; set; }
        public int SortOrder { get; set; }
        public List<QuizModule> Modules { get; set; }
    }

    [Serializable]
    public class QuizModule
    {
        public string Id { get; set; }
        public string FormulaId { get; set; }
        public string ModuleKey { get; set; }
        public string Title { get; set; }
        public string Icon { get; set; }
        public string Description { get; set; }
        public bool UseAbacus { get; set; }
        public bool MentalMode { get; set; }
        public bool IsTimed { get; set; }
        public int? TimeLimitSec { get; set; }
        public int SortOrder { get; set; }
        public List<QuizSet> Sets { get; set; }
    }

    [Serializable]
    public class QuizSet
    {
        public string Id { get; set; }
        public string ModuleId { get; set; }
        public string Label { get; set; }
        public string DisplayMode { get; set; }
        public int SortOrder { get; set; }
        public List<QuizQuestion> Questions { get; set; }
    }

    [Serializable]
    public class QuizQuestion
    {
        public string Id { get; set; }
        public string SetId { get; set; }
        public int Answer { get; set; }
        public int SortOrder { get; set; }
        public List<int> Rows { get; set; }
    }
}
