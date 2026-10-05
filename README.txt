Is zip ki 13 files apne Rentoza project me usi folder me paste (Replace) karo.
Zip ke andar wale client/ aur server/ ko apne project ke client/ aur server/ me merge karo.

Kya hai:
1) End date (India time) ke baad confirmed booking apne aap "completed", bina confirm hui purani pending booking apne aap "expired"
2) Customer Extend (booking details page), owner approval ke bina, availability check ke saath
3) Owner ke Bookings me "Extended +Nd" tag
4) Forgot password me Brevo se email (optional, keys na ho to link server console me aata hai)

Brevo (email) ke liye Render me 3 variables daalo (local me server/.env me):
  BREVO_API_KEY=...        (Brevo > SMTP & API > API keys)
  MAIL_FROM_EMAIL=...      (Brevo me verified sender email)
  MAIL_FROM_NAME=Rentoza

Phir: git add . / git commit -m "Auto complete, extend booking, reset email" / git push
(Vercel aur Render dono redeploy honge)
