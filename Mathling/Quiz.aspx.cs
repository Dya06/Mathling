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
        private const string FormulaName = "SF+4";
        private readonly string _connStr = ConfigurationManager.ConnectionStrings["MathlingDB"].ConnectionString;

        private QuizFormula CurrentFormula
        {
            get { return Session["QuizFormula"] as QuizFormula; }
            set { Session["QuizFormula"] = value; }
        }

        private int SelectedModuleId
        {
            get { return Session["QuizSelectedModuleId"] == null ? 0 : (int)Session["QuizSelectedModuleId"]; }
            set { Session["QuizSelectedModuleId"] = value; }
        }

        private int SelectedSetId
        {
            get { return Session["QuizSelectedSetId"] == null ? 0 : (int)Session["QuizSelectedSetId"]; }
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

            if (!IsPostBack)
            {
                CurrentFormula = LoadFormulaFromDatabase();
                SelectedModuleId = 0;
                SelectedSetId = 0;
                QuestionIndex = 0;
                TotalCorrect = 0;
                CurrentAnswer = string.Empty;
                FlashIndex = 0;

                BindBaseContent();
                BindModuleSidebar();
                ShowStartScreen();
            }
        }

        private void BindBaseContent()
        {
            if (CurrentFormula == null)
            {
                ShowMessage("Quiz data missing", "No formula data was found in the database. Run the quiz seed SQL script first.");
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
            SelectedModuleId = Convert.ToInt32(e.CommandArgument);
            SelectedSetId = 0;
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
            int setId = Convert.ToInt32(DataBinder.Eval(e.Item.DataItem, "Id"));
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
            SelectedSetId = Convert.ToInt32(e.CommandArgument);
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

            PrepareAbacusForQuestion(module, question);

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


        private void PrepareAbacusForQuestion(QuizModule module, QuizQuestion question)
        {
            bool shouldShowAbacus =
                module != null &&
                question != null &&
                module.UseAbacus &&
                !module.MentalMode &&
                question.Rows != null &&
                question.Rows.Count > 0;

            AbacusPanel.Visible = shouldShowAbacus;

            if (!shouldShowAbacus)
            {
                AbacusStepRepeater.DataSource = null;
                AbacusStepRepeater.DataBind();
                return;
            }

            AbacusStepRepeater.DataSource = question.Rows.Select(r => r >= 0 ? "+" + r : r.ToString()).ToList();
            AbacusStepRepeater.DataBind();

            RegisterAbacusAnimation(question.Rows);
        }

        private void RegisterAbacusAnimation(List<int> rows)
        {
            if (rows == null || rows.Count == 0) return;

            string rowsJson = "[" + string.Join(",", rows) + "]";
            string script = @"
                window.mathlingsLastAbacusRows = " + rowsJson + @";
                setTimeout(function () {
                    if (window.playCurrentQuestionAbacus) {
                        window.playCurrentQuestionAbacus(window.mathlingsLastAbacusRows);
                    }
                }, 250);
            ";

            ScriptManager.RegisterStartupScript(
                QuizUpdatePanel,
                QuizUpdatePanel.GetType(),
                "PlayAbacus_" + Guid.NewGuid().ToString("N"),
                script,
                true
            );
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
        }

        protected void RetryButton_Click(object sender, EventArgs e)
        {
            StartSet();
        }

        protected void BackToModuleButton_Click(object sender, EventArgs e)
        {
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

        private bool IsModuleCompleted(int moduleId)
        {
            int userId = Convert.ToInt32(Session["UserId"]);
            using (SqlConnection conn = new SqlConnection(_connStr))
            using (SqlCommand cmd = new SqlCommand(@"
                SELECT COUNT(*)
                FROM ModuleProgress
                WHERE UserId = @UserId AND ModuleId = @ModuleId AND IsCompleted = 1", conn))
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

            int userId = Convert.ToInt32(Session["UserId"]);
            int total = set.Questions.Count;
            decimal percentage = total == 0 ? 0 : Math.Round((decimal)TotalCorrect / total * 100, 2);
            int timeTaken = Math.Max(0, (int)(DateTime.Now - SetStartedAt).TotalSeconds);
            int score = TotalCorrect * 10;

            using (SqlConnection conn = new SqlConnection(_connStr))
            using (SqlCommand cmd = new SqlCommand(@"
                INSERT INTO QuizResults (UserId, SetId, Score, TotalCorrect, TotalQuestions, Percentage, TimeTakenSec)
                VALUES (@UserId, @SetId, @Score, @TotalCorrect, @TotalQuestions, @Percentage, @TimeTakenSec);

                UPDATE Users
                SET XP = XP + @Score,
                    Level = CASE WHEN ((XP + @Score) / 100) + 1 > Level THEN ((XP + @Score) / 100) + 1 ELSE Level END
                WHERE Id = @UserId;", conn))
            {
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@SetId", set.Id);
                cmd.Parameters.AddWithValue("@Score", score);
                cmd.Parameters.AddWithValue("@TotalCorrect", TotalCorrect);
                cmd.Parameters.AddWithValue("@TotalQuestions", total);
                cmd.Parameters.AddWithValue("@Percentage", percentage);
                cmd.Parameters.AddWithValue("@TimeTakenSec", timeTaken);
                conn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        private void MarkModuleCompleted(int moduleId)
        {
            int userId = Convert.ToInt32(Session["UserId"]);

            using (SqlConnection conn = new SqlConnection(_connStr))
            using (SqlCommand cmd = new SqlCommand(@"
                IF EXISTS (SELECT 1 FROM ModuleProgress WHERE UserId = @UserId AND ModuleId = @ModuleId)
                BEGIN
                    UPDATE ModuleProgress
                    SET IsCompleted = 1, CompletedAt = GETDATE()
                    WHERE UserId = @UserId AND ModuleId = @ModuleId;
                END
                ELSE
                BEGIN
                    INSERT INTO ModuleProgress (UserId, ModuleId, IsCompleted, CompletedAt)
                    VALUES (@UserId, @ModuleId, 1, GETDATE());
                END", conn))
            {
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@ModuleId", moduleId);
                conn.Open();
                cmd.ExecuteNonQuery();
            }
        }

        private QuizFormula LoadFormulaFromDatabase()
        {
            QuizFormula formula = null;
            var modules = new Dictionary<int, QuizModule>();
            var sets = new Dictionary<int, QuizSet>();
            var questions = new Dictionary<int, QuizQuestion>();

            using (SqlConnection conn = new SqlConnection(_connStr))
            {
                conn.Open();

                using (SqlCommand cmd = new SqlCommand(@"
                    SELECT TOP 1 [Id], [Name], [Rule], [Description], [SortOrder]
                    FROM [Formulas]
                    WHERE [Name] = @Name AND [IsActive] = 1", conn))
                {
                    cmd.Parameters.AddWithValue("@Name", FormulaName);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            formula = new QuizFormula
                            {
                                Id = Convert.ToInt32(reader["Id"]),
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
                    SELECT Id, FormulaId, ModuleKey, Title, Icon, Description, UseAbacus, MentalMode, IsTimed, TimeLimitSec, SortOrder
                    FROM Modules
                    WHERE FormulaId = @FormulaId
                    ORDER BY SortOrder", conn))
                {
                    cmd.Parameters.AddWithValue("@FormulaId", formula.Id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var module = new QuizModule
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                FormulaId = Convert.ToInt32(reader["FormulaId"]),
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
                    SELECT qs.Id, qs.ModuleId, qs.Label, qs.DisplayMode, qs.SortOrder
                    FROM QuestionSets qs
                    INNER JOIN Modules m ON qs.ModuleId = m.Id
                    WHERE m.FormulaId = @FormulaId
                    ORDER BY m.SortOrder, qs.SortOrder", conn))
                {
                    cmd.Parameters.AddWithValue("@FormulaId", formula.Id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var set = new QuizSet
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                ModuleId = Convert.ToInt32(reader["ModuleId"]),
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
                    SELECT q.Id, q.SetId, q.Answer, q.SortOrder
                    FROM Questions q
                    INNER JOIN QuestionSets qs ON q.SetId = qs.Id
                    INNER JOIN Modules m ON qs.ModuleId = m.Id
                    WHERE m.FormulaId = @FormulaId
                    ORDER BY qs.SortOrder, q.SortOrder", conn))
                {
                    cmd.Parameters.AddWithValue("@FormulaId", formula.Id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var question = new QuizQuestion
                            {
                                Id = Convert.ToInt32(reader["Id"]),
                                SetId = Convert.ToInt32(reader["SetId"]),
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
                    SELECT qr.QuestionId, qr.Value, qr.SortOrder
                    FROM QuestionRows qr
                    INNER JOIN Questions q ON qr.QuestionId = q.Id
                    INNER JOIN QuestionSets qs ON q.SetId = qs.Id
                    INNER JOIN Modules m ON qs.ModuleId = m.Id
                    WHERE m.FormulaId = @FormulaId
                    ORDER BY q.SortOrder, qr.SortOrder", conn))
                {
                    cmd.Parameters.AddWithValue("@FormulaId", formula.Id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            int questionId = Convert.ToInt32(reader["QuestionId"]);
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
        public int Id { get; set; }
        public string Name { get; set; }
        public string Rule { get; set; }
        public string Description { get; set; }
        public int SortOrder { get; set; }
        public List<QuizModule> Modules { get; set; }
    }

    [Serializable]
    public class QuizModule
    {
        public int Id { get; set; }
        public int FormulaId { get; set; }
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
        public int Id { get; set; }
        public int ModuleId { get; set; }
        public string Label { get; set; }
        public string DisplayMode { get; set; }
        public int SortOrder { get; set; }
        public List<QuizQuestion> Questions { get; set; }
    }

    [Serializable]
    public class QuizQuestion
    {
        public int Id { get; set; }
        public int SetId { get; set; }
        public int Answer { get; set; }
        public int SortOrder { get; set; }
        public List<int> Rows { get; set; }
    }
}
