# Silverbridge IT Services Website

Professional IT services website with integrated booking system that connects to Google Calendar.

## Features

- Modern, responsive design with dark theme
- Service listings with detailed descriptions
- Integrated booking form that creates Google Calendar events
- Automated email confirmations
- PST timezone with specific availability windows:
  - Weekdays (Mon-Fri): 5PM-8PM
  - Weekends (Sat-Sun): 9AM-8PM

## Booking System

The booking form integrates with Google Calendar using OAuth2 authentication:

1. Form submissions create calendar events in the configured calendar
2. Events include customer details, service type, and issue description
3. Confirmation emails are automatically sent to customers
4. Gwyn (ai.gwynclaw@gmail.com) receives copies for clerical functions

## Setup Instructions

### Google Calendar API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Create OAuth2 credentials (Web application)
5. Add your domain to authorized redirect URIs
6. Download the credentials JSON file

### Environment Variables

Set the following environment variables:

- `GOOGLE_CLIENT_ID`: Your Google OAuth2 client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth2 client secret
- `GOOGLE_CALENDAR_ID`: Target calendar ID (or 'primary')
- `EMAIL_USER`: Email address for sending confirmations (ai.gwynclaw@gmail.com)
- `EMAIL_APP_PASSWORD`: Gmail app password for the email account

### Deployment

This site is designed for deployment on Netlify with serverless functions:

1. Connect your GitHub repository to Netlify
2. Set the environment variables in Netlify's dashboard
3. The build command will automatically install dependencies and deploy functions

## File Structure

- `index.html`: Main website with booking form
- `styles.css`: Styling for the entire site
- `script.js`: Frontend JavaScript for navigation and form handling
- `/functions/`: Serverless functions for backend operations
  - `calendar-integration.js`: Core calendar integration logic
  - `book-appointment.js`: API endpoint for booking requests

## Security

- API keys and sensitive information are stored as environment variables
- Form includes honeypot field to prevent spam
- All external API calls are validated and sanitized