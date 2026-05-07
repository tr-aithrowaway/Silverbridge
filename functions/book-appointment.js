// API Endpoint for Booking Appointments
const CalendarIntegration = require('./calendar-integration');

// Initialize the calendar integration
const calendarIntegration = new CalendarIntegration();

// Handle preflight OPTIONS requests
async function handleOptionsRequest() {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  };
}

// Handle POST requests to book appointments
async function handlePostRequest(event) {
  try {
    // Parse the form data from the request body
    const formData = JSON.parse(event.body);
    
    // Prepare booking data with proper time formatting
    const bookingData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      service: formData.service,
      zip: formData.zip,
      preferred_time: formData.preferred_time,
      mode: formData.mode,
      description: formData.description,
      // Set a default appointment time if not provided (next available slot)
      startTime: formData.startTime || getNextAvailableSlot(),
      endTime: formData.endTime || getNextAvailableSlot(60) // 60 minutes later
    };

    // Process the booking
    const result = await calendarIntegration.processBooking(bookingData);

    if (result.success) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Appointment booked successfully!',
          eventId: result.eventId,
          calendarLink: result.calendarLink,
          emailSent: result.emailSent
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: result.error || 'Failed to book appointment'
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      };
    }
  } catch (error) {
    console.error('Booking error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error occurred while processing your booking'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }
}

// Helper function to calculate next available slot
function getNextAvailableSlot(minutesToAdd = 0) {
  const now = new Date();
  
  // Add the specified minutes to the current time
  const nextSlot = new Date(now.getTime() + minutesToAdd * 60000);
  
  // Round to the next 30-minute increment for consistency
  const minutes = nextSlot.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 30) * 30;
  nextSlot.setMinutes(roundedMinutes);
  nextSlot.setSeconds(0);
  nextSlot.setMilliseconds(0);
  
  // Ensure the time fits within our available hours based on day of week
  const dayOfWeek = nextSlot.getDay(); // 0 = Sunday, 6 = Saturday
  
  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
    // Weekdays: 5PM-8PM (17:00-20:00)
    if (nextSlot.getHours() < 17) {
      nextSlot.setHours(17, 0, 0, 0);
    } else if (nextSlot.getHours() >= 20) {
      // Move to next day and set to 5PM
      nextSlot.setDate(nextSlot.getDate() + 1);
      nextSlot.setHours(17, 0, 0, 0);
    }
  } else { // Weekend (Saturday, Sunday)
    // Weekends: 9AM-8PM (9:00-20:00)
    if (nextSlot.getHours() < 9) {
      nextSlot.setHours(9, 0, 0, 0);
    } else if (nextSlot.getHours() >= 20) {
      // Move to next day and set to 9AM
      nextSlot.setDate(nextSlot.getDate() + 1);
      nextSlot.setHours(9, 0, 0, 0);
    }
  }
  
  return nextSlot.toISOString();
}

// Main handler function
exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return await handleOptionsRequest();
  }
  
  if (event.httpMethod === 'POST') {
    return await handlePostRequest(event);
  }
  
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  };
};