// Google Calendar Integration for Silverbridge Booking System
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

class CalendarIntegration {
  constructor() {
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    this.oauth2Client = this.setupOAuth2Client();
  }

  setupOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

    if (!clientId || !clientSecret) {
      throw new Error('Missing Google OAuth2 credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Set credentials if refresh token is available
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });
    }

    return oauth2Client;
  }

  async authenticateUser(res) {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
    });

    return authUrl;
  }

  async handleOAuthCallback(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      // Store refresh token for future use
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
      
      return { success: true, tokens };
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return { success: false, error: error.message };
    }
  }

  async createCalendarEvent(bookingData) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Define the event
      const event = {
        summary: `Appointment: ${bookingData.name} - ${bookingData.service}`,
        location: bookingData.zip ? `Client Location (ZIP: ${bookingData.zip})` : 'TBD',
        description: `
          Service: ${bookingData.service}
          Contact: ${bookingData.email} | ${bookingData.phone || 'No phone provided'}
          
          Issue Description:
          ${bookingData.description}
          
          Preferred Time: ${bookingData.preferred_time || 'Not specified'}
          Mode: ${bookingData.mode || 'Not specified'}
          
          Booking Form Submission
        `,
        start: {
          dateTime: bookingData.startTime,
          timeZone: 'America/Los_Angeles',
        },
        end: {
          dateTime: bookingData.endTime,
          timeZone: 'America/Los_Angeles',
        },
        attendees: [
          { email: bookingData.email },
          { email: 'ai.gwynclaw@gmail.com' } // Gwyn's email for clerical functions
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours
            { method: 'popup', minutes: 10 }       // 10 minutes
          ],
        },
      };

      // Insert the event
      const eventResponse = await calendar.events.insert({
        calendarId: this.calendarId,
        resource: event,
      });

      console.log('Event created: %s', eventResponse.data.htmlLink);
      return { success: true, eventId: eventResponse.data.id, link: eventResponse.data.htmlLink };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return { success: false, error: error.message };
    }
  }

  async findAvailableSlots(date, durationMinutes = 60) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      // Format date for the calendar query
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Determine available hours based on day of week
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      let availableStartHour, availableEndHour;
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend (Sunday or Saturday)
        // Available 9AM-8PM on weekends
        availableStartHour = 9;
        availableEndHour = 20;
      } else { // Weekdays Monday-Friday
        // Available 5PM-8PM on weekdays
        availableStartHour = 17;
        availableEndHour = 20;
      }
      
      // Set the start and end times for the query
      const startTime = new Date(startOfDay);
      startTime.setHours(availableStartHour, 0, 0, 0);
      
      const endTime = new Date(startOfDay);
      endTime.setHours(availableEndHour, 0, 0, 0);
      
      // Query for busy times
      const timeMinMax = {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
      };
      
      const freeBusyResponse = await calendar.freebusy.query({
        requestBody: {
          timeBounds: timeMinMax,
          items: [{ id: this.calendarId }],
        },
      });
      
      const busyTimes = freeBusyResponse.data.calendars[this.calendarId].busy;
      
      // Generate available slots
      const availableSlots = this.generateAvailableSlots(
        startTime, 
        endTime, 
        busyTimes, 
        durationMinutes,
        dayOfWeek
      );
      
      return availableSlots;
    } catch (error) {
      console.error('Error finding available slots:', error);
      throw error;
    }
  }

  generateAvailableSlots(startTime, endTime, busyTimes, durationMinutes, dayOfWeek) {
    const slots = [];
    const current = new Date(startTime);
    
    // Adjust available hours based on day of week
    let availableStartHour, availableEndHour;
    
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      availableStartHour = 9;
      availableEndHour = 20;
    } else { // Weekday
      availableStartHour = 17;
      availableEndHour = 20;
    }
    
    // Ensure current time starts at the earliest available hour
    if (current.getHours() < availableStartHour) {
      current.setHours(availableStartHour, 0, 0, 0);
    }
    
    while (current < endTime) {
      // Skip if outside available hours for the day
      if (current.getHours() < availableStartHour || current.getHours() >= availableEndHour) {
        // Move to next available start hour the next day
        current.setDate(current.getDate() + 1);
        current.setHours(availableStartHour, 0, 0, 0);
        continue;
      }
      
      const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
      
      // Check if this slot overlaps with any busy times
      const isBusy = busyTimes.some(busyPeriod => {
        const busyStart = new Date(busyPeriod.start);
        const busyEnd = new Date(busyPeriod.end);
        
        // Check for overlap: (start1 < end2) AND (end1 > start2)
        return (current < busyEnd) && (slotEnd > busyStart);
      });
      
      if (!isBusy) {
        slots.push({
          start: current.toISOString(),
          end: slotEnd.toISOString(),
          available: true
        });
      }
      
      // Move to next potential slot (30-minute increments)
      current.setTime(current.getTime() + 30 * 60000);
    }
    
    return slots;
  }

  async sendConfirmationEmail(bookingData, eventLink) {
    try {
      // Configure email transport
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'ai.gwynclaw@gmail.com',
          pass: process.env.EMAIL_APP_PASSWORD, // Use app password, not regular password
        },
      });

      // Email content
      const mailOptions = {
        from: `"Silverbridge Appointments" <${process.env.EMAIL_USER || 'ai.gwynclaw@gmail.com'}>`,
        to: bookingData.email,
        cc: 'ai.gwynclaw@gmail.com', // Copy Gwyn for clerical functions
        subject: `Appointment Confirmation - ${bookingData.service}`,
        html: `
          <h2>Appointment Confirmed!</h2>
          <p>Hello ${bookingData.name},</p>
          <p>Your appointment has been successfully booked:</p>
          
          <ul>
            <li><strong>Service:</strong> ${bookingData.service}</li>
            <li><strong>Date & Time:</strong> ${new Date(bookingData.startTime).toLocaleString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit',
              timeZoneName: 'short'
            })}</li>
            <li><strong>Duration:</strong> 1 hour</li>
            <li><strong>Location:</strong> ${bookingData.zip ? `Client Location (ZIP: ${bookingData.zip})` : 'TBD - Will contact you to confirm'}</li>
          </ul>
          
          <p><strong>Issue Description:</strong><br>
          ${bookingData.description}</p>
          
          <p>You can view and manage your appointment on Google Calendar:</p>
          <p><a href="${eventLink}">View Appointment on Calendar</a></p>
          
          <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
          
          <p>Best regards,<br>
          Silverbridge IT Services</p>
          
          <hr>
          <small>This is an automated confirmation. Please do not reply to this email directly.</small>
        `,
      };

      // Send the email
      const result = await transporter.sendMail(mailOptions);
      console.log('Confirmation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  async processBooking(bookingData) {
    try {
      // Validate required fields
      if (!bookingData.name || !bookingData.email || !bookingData.service || !bookingData.startTime) {
        throw new Error('Missing required booking information');
      }

      // Create calendar event
      const eventResult = await this.createCalendarEvent(bookingData);
      if (!eventResult.success) {
        throw new Error(`Failed to create calendar event: ${eventResult.error}`);
      }

      // Send confirmation email
      const emailResult = await this.sendConfirmationEmail(bookingData, eventResult.link);
      if (!emailResult.success) {
        console.warn('Failed to send confirmation email:', emailResult.error);
        // Don't fail the entire booking if email fails
      }

      return {
        success: true,
        eventId: eventResult.eventId,
        calendarLink: eventResult.link,
        emailSent: emailResult.success
      };
    } catch (error) {
      console.error('Error processing booking:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = CalendarIntegration;