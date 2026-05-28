<%@ Page Title="Quiz" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Quiz.aspx.cs" Inherits="Mathling.Quiz" %>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="/css/quiz.css?v=2">

    <style>
        .formula-switcher {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin: 14px 0 18px;
        }
        .formula-link {
            display: inline-block;
            padding: 8px 12px;
            border-radius: 10px;
            background: #f1f5f9;
            color: #1f2937;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.9rem;
        }
        .formula-link.active { background: #2563eb; color: #fff; }
        .formula-link.locked { background: #e5e7eb; color: #6b7280; cursor: not-allowed; opacity: 0.75; }
        .module-nav-item.completed { background: #dcfce7 !important; border-color: #22c55e !important; color: #14532d !important; }
        .set-completed { background: #16a34a !important; border-color: #15803d !important; color: #fff !important; }
        .set-completed-badge { display: block; font-size: var(--text-xs); margin-top: 4px; opacity: .95; }
    </style>
</asp:Content>

<asp:Content ID="MainContent" ContentPlaceHolderID="MainContent" runat="server">
    <nav class="navbar">
        <div class="navbar-inner">
            <a href="Default.aspx" class="navbar-brand">
                <img src="/favicon.svg" alt="Mathlings" class="navbar-logo">
                <span class="navbar-title">Math<span>lings</span></span>
            </a>
            <div class="navbar-nav" id="main-nav"></div>
            <div class="navbar-actions">
                <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode"></button>
                <button type="button" class="hamburger" id="hamburger" aria-label="Menu"><div class="hamburger-lines"><span></span><span></span><span></span></div></button>
            </div>
        </div>
    </nav>
    <div class="mobile-nav" id="mobile-nav"></div>

    <main class="main">
        <asp:UpdatePanel ID="QuizUpdatePanel" runat="server" UpdateMode="Conditional">
            <ContentTemplate>
                <asp:Timer ID="FlashTimer" runat="server" Interval="1000" Enabled="false" OnTick="FlashTimer_Tick" />
                <asp:Timer ID="AssessmentTimer" runat="server" Interval="1000" Enabled="false" OnTick="AssessmentTimer_Tick" />

                <div class="quiz-layout">
                    <aside class="quiz-sidebar">
                        <div class="formula-badge">
                            <h3><asp:Literal ID="FormulaNameLiteral" runat="server" /></h3>
                            <div class="formula-rule"><asp:Literal ID="FormulaRuleLiteral" runat="server" /></div>
                        </div>


                        <div class="formula-switcher">
                            <a class='<%= GetFormulaLinkCss("SF+4") %>' href='<%= GetFormulaUrl("SF+4") %>'><%= GetFormulaLinkLabel("SF+4") %></a>
                            <a class='<%= GetFormulaLinkCss("SF+3") %>' href='<%= GetFormulaUrl("SF+3") %>'><%= GetFormulaLinkLabel("SF+3") %></a>
                            <a class='<%= GetFormulaLinkCss("SF+2") %>' href='<%= GetFormulaUrl("SF+2") %>'><%= GetFormulaLinkLabel("SF+2") %></a>
                            <a class='<%= GetFormulaLinkCss("SF+1") %>' href='<%= GetFormulaUrl("SF+1") %>'><%= GetFormulaLinkLabel("SF+1") %></a>
                        </div>

                        <div class="module-nav">
                            <asp:Repeater ID="ModuleRepeater" runat="server" OnItemCommand="ModuleRepeater_ItemCommand" OnItemDataBound="ModuleRepeater_ItemDataBound">
                                <ItemTemplate>
                                    <asp:LinkButton ID="ModuleButton" runat="server"
                                        CssClass="module-nav-item"
                                        CommandName="SelectModule"
                                        CommandArgument='<%# Eval("Id") %>'>
                                        <span class="mod-icon"><%# GetModuleIcon(Eval("Icon")) %></span>
                                        <span class="mod-label"><%# Eval("Title") %></span>
                                        <asp:Literal ID="CompletedLiteral" runat="server" />
                                    </asp:LinkButton>
                                </ItemTemplate>
                            </asp:Repeater>
                        </div>
                    </aside>

                    <div class="quiz-main">
                        <asp:Panel ID="MessagePanel" runat="server" Visible="false" CssClass="instruction-card">
                            <h3><asp:Literal ID="MessageTitleLiteral" runat="server" /></h3>
                            <p><asp:Literal ID="MessageBodyLiteral" runat="server" /></p>
                        </asp:Panel>

                        <asp:Panel ID="StartPanel" runat="server" CssClass="start-screen">
                            <div style="font-size:4rem;margin-bottom:var(--space-lg)"></div>
                            <h2>Formula: <asp:Literal ID="StartFormulaNameLiteral" runat="server" /></h2>
                            <p>
                                <asp:Literal ID="StartDescriptionLiteral" runat="server" /><br />
                                <strong><asp:Literal ID="StartRuleLiteral" runat="server" /></strong>
                            </p>
                            <p style="color:var(--text-tertiary);font-size:var(--text-sm);margin-bottom:var(--space-xl)">
                                Select a module from the sidebar to begin learning.
                            </p>
                            <asp:Button ID="StartLearningButton" runat="server" Text=" Start Learning"
                                CssClass="btn btn-primary btn-lg" OnClick="StartLearningButton_Click" />
                        </asp:Panel>

                        <asp:Panel ID="ModuleIntroPanel" runat="server" Visible="false">
                            <div class="module-header">
                                <span class="module-tag" id="ModuleTagSpan" runat="server">
                                    <asp:Literal ID="ModuleTagLiteral" runat="server" />
                                </span>
                                <h2><asp:Literal ID="ModuleTitleLiteral" runat="server" /></h2>
                                <p><asp:Literal ID="ModuleDescriptionLiteral" runat="server" /></p>
                                <asp:Literal ID="ModuleTimerLiteral" runat="server" />
                            </div>

                            <asp:Panel ID="MentalBannerPanel" runat="server" Visible="false" CssClass="mental-banner">
                                <div class="mental-icon"></div>
                                <h3>Mental Mode</h3>
                                <p>You cannot use the abacus for this module.<br />Imagine the beads moving in your mind.</p>
                            </asp:Panel>

                            <div style="text-align:center">
                                <h3 style="margin-bottom:var(--space-lg)">Choose a Set</h3>
                                <div style="display:flex;gap:var(--space-md);justify-content:center;flex-wrap:wrap">
                                    <asp:Repeater ID="SetRepeater" runat="server" OnItemCommand="SetRepeater_ItemCommand" OnItemDataBound="SetRepeater_ItemDataBound">
                                        <ItemTemplate>
                                            <asp:LinkButton ID="SetButton" runat="server" CssClass="btn btn-primary"
                                                CommandName="SelectSet" CommandArgument='<%# Eval("Id") %>'>
                                                <%# Eval("Label") %>
                                                <span style="display:block;font-size:var(--text-xs);opacity:0.8;margin-top:4px">
                                                    <%# Eval("QuestionCount") %> questions  <%# Eval("DisplayMode") %>
                                                </span>
                                                <asp:Literal ID="SetCompletedLiteral" runat="server" />
                                            </asp:LinkButton>
                                        </ItemTemplate>
                                    </asp:Repeater>
                                </div>
                            </div>
                        </asp:Panel>

                        <asp:Panel ID="QuestionPanel" runat="server" Visible="false">
                            <div class="module-header" style="padding-bottom:var(--space-md);margin-bottom:var(--space-lg)">
                                <span class="module-tag" id="QuestionTagSpan" runat="server">
                                    <asp:Literal ID="QuestionTagLiteral" runat="server" />
                                </span>
                            </div>

                            <asp:Panel ID="TimerPanel" runat="server" Visible="false" CssClass="assessment-timer">
                                <div class="timer-value"><asp:Literal ID="TimerValueLiteral" runat="server" /></div>
                                <div class="timer-label">Time Remaining</div>
                                <div class="timer-bar">
                                    <div class="timer-bar-fill" id="TimerFillDiv" runat="server"></div>
                                </div>
                            </asp:Panel>

                            <asp:Panel ID="QuestionMentalBannerPanel" runat="server" Visible="false" CssClass="mental-banner" Style="margin-bottom:var(--space-lg)">
                                <div class="mental-icon"></div>
                                <h3>Use Mental Only!</h3>
                                <p>Imagine the abacus beads moving. Use your hand movements!</p>
                            </asp:Panel>

                            <div class="quiz-progress">
                                <div class="quiz-progress-info">
                                    <span><asp:Literal ID="QuestionNumberLiteral" runat="server" /></span>
                                    <span><asp:Literal ID="ScoreLiteral" runat="server" /></span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-bar-fill" id="ProgressFillDiv" runat="server"></div>
                                </div>
                            </div>

                            <div class="question-area">
                                <asp:Literal ID="QuestionDisplayLiteral" runat="server" />
                            </div>



                            <div class="answer-display">
                                <asp:Literal ID="AnswerDisplayLiteral" runat="server" />
                            </div>

                            <div class="numpad">
                                <asp:Button runat="server" Text="1" CssClass="numpad-btn" CommandArgument="1" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text="2" CssClass="numpad-btn" CommandArgument="2" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text="3" CssClass="numpad-btn" CommandArgument="3" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text="4" CssClass="numpad-btn" CommandArgument="4" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text="5" CssClass="numpad-btn" CommandArgument="5" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text="6" CssClass="numpad-btn" CommandArgument="6" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text="7" CssClass="numpad-btn" CommandArgument="7" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text="8" CssClass="numpad-btn" CommandArgument="8" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text="9" CssClass="numpad-btn" CommandArgument="9" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text="0" CssClass="numpad-btn" CommandArgument="0" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text="C" CssClass="numpad-btn clear" CommandArgument="clear" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text="" CssClass="numpad-btn" CommandArgument="back" OnCommand="Numpad_Command" />
                                <asp:Button runat="server" Text=" Submit" CssClass="numpad-btn submit" CommandArgument="submit" OnCommand="Numpad_Command" />
                            </div>
                        </asp:Panel>

                        <asp:Panel ID="FeedbackPanel" runat="server" Visible="false" CssClass="instruction-card">
                            <h3><asp:Literal ID="FeedbackTitleLiteral" runat="server" /></h3>
                            <p><asp:Literal ID="FeedbackBodyLiteral" runat="server" /></p>
                            <asp:Button ID="NextQuestionButton" runat="server" Text="Next Question" CssClass="btn btn-primary" OnClick="NextQuestionButton_Click" />
                        </asp:Panel>

                        <asp:Panel ID="CompletePanel" runat="server" Visible="false" CssClass="module-complete">
                            <div style="font-size:4rem;margin-bottom:var(--space-md)"><asp:Literal ID="CompleteIconLiteral" runat="server" /></div>
                            <h2><asp:Literal ID="CompleteTitleLiteral" runat="server" /></h2>
                            <div class="completion-stats">
                                <div class="completion-stat">
                                    <div class="cs-value"><asp:Literal ID="CompleteCorrectLiteral" runat="server" /></div>
                                    <div class="cs-label">Correct</div>
                                </div>
                                <div class="completion-stat">
                                    <div class="cs-value"><asp:Literal ID="CompletePercentageLiteral" runat="server" /></div>
                                    <div class="cs-label">Score</div>
                                </div>
                            </div>
                            <div style="display:flex;gap:var(--space-md);justify-content:center;flex-wrap:wrap;margin-top:var(--space-xl)">
                                <asp:Button ID="RetryButton" runat="server" Text=" Retry" CssClass="btn btn-secondary" OnClick="RetryButton_Click" />
                                <asp:Button ID="BackToModuleButton" runat="server" Text="Finish Module" CssClass="btn btn-primary" OnClick="BackToModuleButton_Click" CausesValidation="false" UseSubmitBehavior="false" />
                            </div>
                        </asp:Panel>
                    </div>
                </div>
            </ContentTemplate>

        </asp:UpdatePanel>
    </main>
</asp:Content>

<asp:Content ID="ScriptContent" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="/js/app.js?v=9"></script>
</asp:Content>


