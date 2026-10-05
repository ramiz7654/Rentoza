// Sends email through Brevo's HTTPS API (works on Render free, which blocks SMTP ports).
// Set BREVO_API_KEY and MAIL_FROM_EMAIL (a sender verified in Brevo). Without them nothing is sent and the caller can log the link (dev).
const configured = () => !!(process.env.BREVO_API_KEY && process.env.MAIL_FROM_EMAIL);

async function sendMail({ to, subject, html, text }) {
  if (!configured()) return false;
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: { name: process.env.MAIL_FROM_NAME || 'Rentoza', email: process.env.MAIL_FROM_EMAIL }, to: [{ email: to }], subject, htmlContent: html, textContent: text }),
  });
  if (!r.ok) throw new Error(`Brevo responded ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return true;
}

const resetEmail = (link) => ({
  subject: 'Reset your Rentoza password',
  text: `We received a request to reset your Rentoza password.\n\nOpen this link within 30 minutes to set a new password:\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
  html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#12202B">
    <h2 style="margin:0 0 12px">Reset your password</h2>
    <p>We received a request to reset your Rentoza password. This link works for 30 minutes.</p>
    <p style="margin:24px 0"><a href="${link}" style="background:#F2B705;color:#12202B;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">Set a new password</a></p>
    <p style="font-size:13px;color:#667085">If the button does not work, copy this link into your browser:<br>${link}</p>
    <p style="font-size:13px;color:#667085">If you did not ask for this, you can ignore this email.</p></div>`,
});

module.exports = { sendMail, resetEmail, configured };