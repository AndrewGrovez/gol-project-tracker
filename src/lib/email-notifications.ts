import { google } from "googleapis";

interface TaskAssignmentEmailData {
  taskTitle: string;
  taskDescription?: string;
  projectName: string;
  assignedToEmail: string;
  assignedByEmail: string;
  dueDate?: string;
}

interface CommentMentionEmailData {
  projectName: string;
  commentText: string;
  mentionedToEmail: string;
  authorName: string;
  projectUrl: string;
}

export class EmailNotificationService {
  constructor() {
    // Auth clients are created dynamically for each email send
  }

  private createAuthClient(impersonateEmail: string) {
    const privateKey = Buffer.from(
      process.env.GOOGLE_PRIVATE_KEY_B64!,
      "base64"
    ).toString();

    const jwt = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      privateKey,
      ['https://www.googleapis.com/auth/gmail.send'],
      impersonateEmail // This impersonates the user
    );

    return google.gmail({ version: 'v1', auth: jwt });
  }

  async sendTaskAssignmentNotification(data: TaskAssignmentEmailData, senderEmail?: string): Promise<boolean> {
    try {
      // Don't send notification if person assigned it to themselves
      if (data.assignedToEmail === data.assignedByEmail) {
        return false;
      }

      // Use the sender's email or a default admin email for impersonation
      const impersonateEmail = senderEmail || data.assignedByEmail;
      const gmail = this.createAuthClient(impersonateEmail);

      const subject = `New Task Assigned: ${data.taskTitle}`;
      const body = this.createTaskAssignmentEmailBody(data);

      const message = this.createEmailMessage(
        data.assignedToEmail,
        subject,
        body
      );

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to send task assignment email:', error);
      return false;
    }
  }

  async sendCommentMentionNotification(data: CommentMentionEmailData, senderEmail?: string): Promise<boolean> {
    try {
      const impersonateEmail = senderEmail || 'notifications@golcentres.co.uk';
      const gmail = this.createAuthClient(impersonateEmail);

      const subject = `You were mentioned in ${data.projectName}`;
      const body = this.createCommentMentionEmailBody(data);

      const message = this.createEmailMessage(
        data.mentionedToEmail,
        subject,
        body
      );

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to send comment mention email:', error);
      return false;
    }
  }

  private createTaskAssignmentEmailBody(data: TaskAssignmentEmailData): string {
    const dueDateText = data.dueDate 
      ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
            <strong style="color: #333;">Due Date:</strong>
            <span style="color: #666; margin-left: 10px;">${new Date(data.dueDate).toLocaleDateString()}</span>
          </td>
        </tr>`
      : '';

    const descriptionText = data.taskDescription 
      ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
            <strong style="color: #333;">Description:</strong>
            <div style="color: #666; margin-top: 5px; line-height: 1.5;">${data.taskDescription}</div>
          </td>
        </tr>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Task Assigned</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #81bb26 0%, #6fa01f 100%); padding: 30px 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">New Task Assigned</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                What's up big dawg?
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                You've been assigned a new task in the <strong style="color: #81bb26;">${data.projectName}</strong> project.
            </p>
            
            <!-- Task Details Box -->
            <div style="background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #81bb26; padding: 25px; margin: 30px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <strong style="color: #333;">Task:</strong>
                            <div style="color: #333; font-size: 18px; font-weight: 600; margin-top: 5px;">${data.taskTitle}</div>
                        </td>
                    </tr>
                    ${descriptionText}
                    ${dueDateText}
                </table>
            </div>
            
            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="https://projects.golcentres.co.uk" 
                   style="display: inline-block; 
                          background: linear-gradient(135deg, #81bb26 0%, #6fa01f 100%); 
                          color: #ffffff; 
                          text-decoration: none; 
                          font-weight: 600; 
                          font-size: 16px; 
                          padding: 15px 30px; 
                          border-radius: 25px; 
                          box-shadow: 0 3px 15px rgba(129, 187, 38, 0.3);
                          transition: all 0.3s ease;">
                    📋 View Your Tasks
                </a>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0; text-align: center;">
                This is an automated notification from Grawtz.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Gol Centres. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private createCommentMentionEmailBody(data: CommentMentionEmailData): string {
    const escapedComment = this.escapeHtml(data.commentText)
      .replace(/\n/g, '<br />');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Mention</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1c3145 0%, #162435 100%); padding: 24px 36px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">You were mentioned</h1>
            <p style="color: #cbd5f5; margin: 8px 0 0; font-size: 15px;">${this.escapeHtml(data.projectName)}</p>
        </div>
        <div style="padding: 32px 36px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              <strong style="color: #1c3145;">${this.escapeHtml(data.authorName)}</strong> mentioned you in a comment.
            </p>
            <div style="background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #81bb26; padding: 20px 24px; margin-bottom: 32px;">
              <p style="color: #111827; font-size: 15px; line-height: 1.6; margin: 0;">
                ${escapedComment}
              </p>
            </div>
            <div style="text-align: center;">
              <a href="${data.projectUrl}" style="display: inline-block; background: linear-gradient(135deg, #81bb26 0%, #6fa01f 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 9999px; box-shadow: 0 8px 20px rgba(129, 187, 38, 0.25);">
                View Comment
              </a>
            </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 18px 36px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Gol Centres. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  private createEmailMessage(to: string, subject: string, body: string): string {
    const email = [
      `To: ${to}`,
      `From: notifications@golcentres.co.uk`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=utf-8`,
      '',
      body
    ].join('\r\n');

    return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  }

  private escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
