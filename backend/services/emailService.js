require("dotenv").config();

console.log("[emailService.js] NODE_ENV:", process.env.NODE_ENV);

if (process.env.NODE_ENV !== "production") {
  module.exports = async () => {
    console.log("DEV MODE: email disabled");
    return true;
  };
} else {
  // Production mode - initialize Azure services
  const fetch = (...a) => import('node-fetch').then(({default: f}) => f(...a));
  const { ClientSecretCredential } = require('@azure/identity');
  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  const senderEmail = process.env.EMAIL_USER;

  // Authenticate using client credentials (no user interaction)
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);


  /**
   * Send an email via Microsoft Graph API (application permission)
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} text - Email body (plain text)
   */
  const sendEmail = async (to, subject, text) => {
    try {
      const tokenResponse = await credential.getToken('https://graph.microsoft.com/.default');

      const message = {
        message: {
          subject,
          body: {
            contentType: 'Text',
            content: text
          },
          toRecipients: [
            { emailAddress: { address: to } }
          ]
        },
        saveToSentItems: 'false'
      };
      const res = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenResponse.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Graph API error (${res.status}): ${errText}`);
      }

      console.log("Email successful");
    } catch (err) {
      console.error('Failed to send email:', err);
      throw err;
    }
  };

  module.exports = sendEmail;
}
