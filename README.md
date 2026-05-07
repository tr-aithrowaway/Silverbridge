# Silverbridge IT Services Website

Professional IT services website with integrated Google Scheduler for appointments.

## Features

- Modern, responsive design with dark theme
- Service listings with detailed descriptions
- Integrated Google Scheduler for booking appointments
- PST timezone with specific availability windows:
  - Weekdays (Mon-Fri): 5PM-8PM
  - Weekends (Sat-Sun): 9AM-8PM

## Setup Instructions

### Google Scheduler Integration

The site now uses a direct Google Scheduler link embedded as an iframe:

1. Visit your Google Scheduler page (e.g., https://calendar.app.google/your-scheduler-link)
2. Replace the iframe src in index.html with your scheduler link
3. Adjust the iframe height if needed for optimal display

### Deployment

This site is designed for static hosting on GitHub Pages or Netlify:

1. Push your repository to GitHub
2. Enable GitHub Pages in your repository settings
3. The site will automatically deploy from the main branch

## File Structure

- `index.html`: Main website with Google Scheduler iframe
- `styles.css`: Styling for the entire site
- `script.js`: Frontend JavaScript for navigation

## Security

- No server-side processing required
- All functionality is client-side
- No sensitive information stored in the repository