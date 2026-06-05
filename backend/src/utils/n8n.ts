import axios from 'axios';

/**
 * Triggers n8n webhook to route onboarding emails to platform administrator
 */
export const triggerOnboardingWebhook = async (vendorData: any): Promise<boolean> => {
  const url = process.env.N8N_ONBOARDING_WEBHOOK;
  console.log(`[n8n Automation] Triggering Onboarding Workflow for: ${vendorData.name}`);
  
  if (!url) {
    console.log('[n8n Automation] No N8N_ONBOARDING_WEBHOOK configured. Simulating structured email routing:');
    console.log(`  From: ${vendorData.email}`);
    console.log(`  To: admin@armbiz.am`);
    console.log(`  Subject: New Vendor Onboarding Request - ${vendorData.name}`);
    console.log(`  Body: Vendor "${vendorData.name}" has completed step-onboarding in category "${vendorData.category}".`);
    return true;
  }

  try {
    const response = await axios.post(url, {
      event: 'vendor_onboarded',
      timestamp: new Date().toISOString(),
      vendor: {
        name: vendorData.name,
        category: vendorData.category,
        email: vendorData.email,
        phone: vendorData.phone,
        address: vendorData.address,
        city: vendorData.city,
        foundedYear: vendorData.foundedYear,
        servicesCount: vendorData.services?.length || 0,
        menuCount: vendorData.menu?.length || 0,
      }
    });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('[n8n Automation] Error triggering onboarding webhook:', (error as Error).message);
    return false;
  }
};

/**
 * Triggers n8n webhook for successful bookings to trigger SMS/Email reminders
 */
export const triggerBookingWebhook = async (bookingData: any): Promise<boolean> => {
  const url = process.env.N8N_BOOKING_WEBHOOK;
  console.log(`[n8n Automation] Triggering Booking Workflow for booking ID: ${bookingData._id}`);

  if (!url) {
    console.log('[n8n Automation] No N8N_BOOKING_WEBHOOK configured. Simulating SMS/Email confirmation flow:');
    console.log(`  Customer: ${bookingData.customerName} (${bookingData.customerPhone})`);
    console.log(`  Service: ${bookingData.serviceName} - AMD ${bookingData.totalPrice}`);
    console.log(`  Time: ${bookingData.date} at ${bookingData.timeSlot}`);
    console.log(`  Status: Confirmed. Event dispatched to business staff.`);
    return true;
  }

  try {
    const response = await axios.post(url, {
      event: 'booking_created',
      timestamp: new Date().toISOString(),
      booking: bookingData
    });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('[n8n Automation] Error triggering booking webhook:', (error as Error).message);
    return false;
  }
};
