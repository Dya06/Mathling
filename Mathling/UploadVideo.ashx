<%@ WebHandler Language="C#" Class="UploadVideo" %>

using System;
using System.IO;
using System.Web;

public class UploadVideo : IHttpHandler, System.Web.SessionState.IRequiresSessionState
{
    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";

        try
        {
            if (context.Request.Files.Count > 0)
            {
                HttpPostedFile file = context.Request.Files[0];
                if (file != null && file.ContentLength > 0)
                {
                    string ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                    if (ext != ".mp4" && ext != ".webm")
                    {
                        context.Response.StatusCode = 400;
                        context.Response.Write("{\"error\": \"Only MP4 and WebM videos are allowed.\"}");
                        return;
                    }

                    string folderPath = context.Server.MapPath("~/Uploads/Videos/");
                    if (!Directory.Exists(folderPath))
                    {
                        Directory.CreateDirectory(folderPath);
                    }

                    string fileName = Guid.NewGuid().ToString("N") + ext;
                    string savePath = Path.Combine(folderPath, fileName);
                    file.SaveAs(savePath);

                    string relativeUrl = "Uploads/Videos/" + fileName;
                    context.Response.Write("{\"success\": true, \"url\": \"" + relativeUrl + "\"}");
                }
                else
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write("{\"error\": \"File is empty.\"}");
                }
            }
            else
            {
                context.Response.StatusCode = 400;
                context.Response.Write("{\"error\": \"No file uploaded.\"}");
            }
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            context.Response.Write("{\"error\": \"" + ex.Message.Replace("\"", "'") + "\"}");
        }
    }

    public bool IsReusable
    {
        get { return false; }
    }
}
