import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Admin notification recipients
const ADMIN_RECIPIENTS = [
  'lacanteen@elitelac.com',
  'hamza.h@elitelac.com',
//   'finance@school.com',
];

export async function sendBalanceUpdateEmail(
  studentEmail: string,
  studentName: string,
  amount: number,
  newBalance: number
) {
  // Email to student
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'LACanteen <noreply@elitelac.com>',
    to: studentEmail,
    subject: 'Balance Updated - LACanteen',
    html: `
      <h2>Balance Update Notification</h2>
      <p>Dear ${studentName},</p>
      <p>Your canteen balance has been updated:</p>
      <ul>
        <li>Amount Added: ${amount.toFixed(2)} Points</li>
        <li>New Balance: ${newBalance.toFixed(2)} Points</li>
      </ul>
      <p>Best regards,<br>LACanteen Team</p>
    `,
  });

  // Email to administrators
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'LACanteen <noreply@school.com>',
    to: ADMIN_RECIPIENTS,
    subject: `Balance Update - ${studentName}`,
    html: `
      <h2>Student Balance Update</h2>
      <p>A balance update has been processed:</p>
      <ul>
        <li>Student: ${studentName}</li>
        <li>Amount Added: ${amount.toFixed(2)} Points</li>
        <li>New Balance: ${newBalance.toFixed(2)} Points</li>
      </ul>
    `,
  });
}

export async function sendPurchaseNotificationEmail(
  studentEmail: string,
  studentName: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  newBalance: number
) {
  // Email to student
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'LACanteen <noreply@elitelac.com>',
    to: studentEmail,
    subject: 'Purchase Confirmation - LACanteen',
    html: `
      <h2>Purchase Confirmation</h2>
      <p>Dear ${studentName},</p>
      <p>Your recent purchase has been processed:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Quantity</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Price</th>
        </tr>
        ${items.map(item => `
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${item.quantity}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${(item.price * item.quantity).toFixed(2)} Points</td>
          </tr>
        `).join('')}
        <tr style="font-weight: bold;">
          <td colspan="2" style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Total:</td>
          <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${total.toFixed(2)} Points</td>
        </tr>
      </table>
      <p>Remaining Balance: ${newBalance.toFixed(2)} Points</p>
      <p>Best regards,<br>LACanteen Team</p>
    `,
  });

  // Email to administrators
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'LACanteen <noreply@elitelac.com>',
    to: ADMIN_RECIPIENTS,
    subject: `New Purchase - ${studentName}`,
    html: `
      <h2>Purchase Notification</h2>
      <p>A new purchase has been made:</p>
      <ul>
        <li>Student: ${studentName}</li>
        <li>Total Amount: ${total.toFixed(2)} Points</li>
        <li>New Balance: ${newBalance.toFixed(2)} Points</li>
      </ul>
      <h3>Items Purchased:</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Quantity</th>
          <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Price</th>
        </tr>
        ${items.map(item => `
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${item.quantity}</td>
            <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">${(item.price * item.quantity).toFixed(2)} Points</td>
          </tr>
        `).join('')}
      </table>
    `,
  });
}