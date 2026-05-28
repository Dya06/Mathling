<%@ Page Language="C#" AutoEventWireup="true" %>
<%@ Import Namespace="Mathling" %>
<%@ Import Namespace="System.Diagnostics" %>
<%
    try {
        var data = Progress.GetProgressData("001");
        Response.Write("SUCCESS: " + data.QuizzesTaken);
    } catch(Exception ex) {
        Response.Write("ERROR: " + ex.ToString());
    }
%>
