# Google OAuth2 Setup Guide

This guide will walk you through setting up Google OAuth2 authentication for the Silverbridge booking system.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Select "New Project"
4. Enter a project name (e.g., "Silverbridge Booking System")
5. Click "Create"

## Step 2: Enable the Google Calendar API

1. In your project dashboard, search for "Google Calendar API"
2. Click on "Google Calendar API"
3. Click "Enable"

## Step 3: Create OAuth2 Credentials

1. In the left sidebar, click "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the consent screen if prompted:
   - Application type: "Web application"
   - Name: "Silverbridge Booking System"
   - Add your domain to authorized domains if applicable
4. For the OAuth 2.0 Client, add authorized redirect URIs:
   - `http://localhost:3000/oauth2callback` (for development)
   - Your production domain (e.g., `https://yourdomain.com/oauth2callback`)
5. Click "Create"
6. Download the credentials JSON file and save it securely

## Step 4: Extract Client ID and Secret

From the downloaded JSON file, extract:
- `client_id`: This is your `GOOGLE_CLIENT_ID`
- `client_secret`: This is your `GOOGLE_CLIENT_SECRET`

## Step 5: Set Up Environment Variables

In your hosting platform (Netlify, Vercel, etc.), set these environment variables:

- `GOOGLE_CLIENT_ID`: The client ID from the JSON file
- `GOOGLE_CLIENT_SECRET`: The client secret from the JSON file
- `GOOGLE_CALENDAR_ID`: The calendar ID where appointments should be added (typically your email address or 'primary')

## Step 6: Initial Authentication

The first time the application runs, users will need to authenticate:

1. Navigate to the OAuth initiation endpoint (this might be built into your application)
2. Google will prompt for permission to access your calendar
3. After approval, Google will provide an authorization code
4. Exchange this code for access and refresh tokens

## Important Security Notes

- Never commit credentials to version control
- Use environment variables to store sensitive information
- Regularly rotate your OAuth2 credentials
- Monitor API usage in the Google Cloud Console
- Restrict the OAuth2 application to only the necessary permissions (calendar events)

## Troubleshooting

### Common Issues:

- **Redirect URI mismatch**: Ensure the redirect URI in Google Cloud Console matches exactly what your application uses
- **API not enabled**: Verify that the Google Calendar API is enabled for your project
- **Invalid grant**: Refresh tokens may expire; implement proper error handling to re-authenticate when needed

### Permissions Required:

The OAuth2 application needs these Google Calendar permissions:
- View and manage your calendar events (`https://www.googleapis.com/auth/calendar.events`)
- View your calendar events (`https://www.googleapis.com/auth/calendar.readonly`)