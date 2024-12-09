# Email Templates

## Overview
This document outlines the email templates used in Meta.Salon for various system communications. These templates are designed to be spam-filter friendly while maintaining a professional appearance.

## Template Variables
Supabase provides several template variables that can be used in email templates:

- `{{ .Email }}` - The user's email address
- `{{ .Token }}` - The verification token
- `{{ .ConfirmationURL }}` - The complete confirmation URL (includes token and redirect)
- `{{ .SiteURL }}` - Your site's URL
- `{{ .RedirectTo }}` - The URL where users will be redirected after confirmation

## Email Templates

### Sign Up Confirmation
This template is used when a new user signs up for Meta.Salon.

**Subject:** Welcome to Meta.Salon - Please Verify Your Email

**From Name:** Meta.Salon

**Template:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email for Meta.Salon</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
        <tr>
            <td style="padding: 20px;">
                <h2 style="color: #1a202c; margin-bottom: 20px; text-align: center;">Welcome to Meta.Salon</h2>
                
                <p style="margin-bottom: 24px;">
                    Thank you for joining Meta.Salon, where art meets innovation. To complete your registration and receive your welcome tokens, please verify your email address.
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <a href="{{ .ConfirmationURL }}" 
                               style="display: inline-block; background-color: #3182ce; color: #ffffff; 
                                      padding: 12px 24px; text-decoration: none; border-radius: 4px;
                                      font-weight: bold;">
                                Verify Email Address
                            </a>
                        </td>
                    </tr>
                </table>
                
                <p style="margin-top: 24px;">
                    After verification, you'll receive:
                </p>
                <ul style="margin-bottom: 24px;">
                    <li>500 SLN tokens to start</li>
                    <li>Access to vote on artworks</li>
                    <li>Ability to participate in the community</li>
                </ul>
                
                <p style="color: #666666; font-size: 14px; margin-bottom: 24px;">
                    This verification link will expire in 24 hours. If you didn't create an account,
                    you can safely ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #edf2f7; margin: 24px 0;">
                
                <p style="color: #666666; font-size: 14px; text-align: center;">
                    Meta.Salon - Where Art Meets Innovation
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
```

### Design Principles

1. **Spam Filter Optimization**
   - Use proper HTML structure with DOCTYPE
   - Include meta tags
   - Use tables for layout (better email client compatibility)
   - Avoid spam trigger words
   - Use inline CSS (external CSS often gets stripped)

2. **Mobile Responsiveness**
   - Use viewport meta tag
   - Use percentage-based widths
   - Set max-width for readability

3. **Accessibility**
   - Use semantic HTML
   - Maintain good color contrast
   - Clear, readable text

4. **Security**
   - Include "didn't sign up" disclaimer
   - Mention link expiration
   - Use clear sender identification

## Implementation

To update these templates:

1. Go to Supabase Dashboard
2. Navigate to Authentication → Email Templates
3. Select the template to update
4. Copy and paste the HTML
5. Update Subject and Sender Name
6. Save changes

## Testing

Before deploying new templates:
1. Test with different email clients (Gmail, Outlook, Apple Mail)
2. Check spam score using tools like mail-tester.com
3. Verify all links work correctly
4. Test on mobile devices