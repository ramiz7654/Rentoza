# Rentoza deploy guide (GitHub + Render + Vercel)

## 0) GitHub se pehle
- `.env` kabhi upload mat karo (`.gitignore` me already hai). Sirf `.env.example` upload hoti hai.
- Agar `.env` galti se upload ho gayi: Atlas > Database Access me password badal do.

## 1) Backend: Render (server folder)
1. render.com > New > Web Service > GitHub repo chuno.
2. Root Directory: `server`   |   Build: `npm install`   |   Start: `npm start`
3. Environment variables:
   - `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - `CLIENT_URL` = apni Vercel site ka address, aakhir me `/` nahi (jaise https://rentoza.vercel.app)
4. Deploy ke baad Render ka link note karo (jaise https://rentoza-api.onrender.com).
5. Pehli baar admin banane ke liye Render Shell me: `npm run seed`

## 2) Atlas
Network Access > Add IP > Allow Access From Anywhere (`0.0.0.0/0`), kyunki Render ka IP badalta rehta hai.

## 3) Frontend: Vercel (client folder)
1. vercel.com > Add New Project > repo chuno.
2. Root Directory: `client`   (Framework: Vite, auto detect hota hai)
3. Environment variable: `VITE_API_URL` = `https://<render-link>/api`
4. Deploy. (`client/vercel.json` refresh pe 404 rokta hai.)

## 4) Dhyan
- `.env` badalne ke baad Vercel aur Render dono redeploy karo.
- Render free plan: kuch der use na ho to server so jaata hai, pehli request 30-60 sec le sakti hai ("Failed to fetch" jaisa lag sakta hai, ruk ke dobara try karo).
- "Find near me" sirf HTTPS pe chalta hai; Vercel/Render dono HTTPS dete hain.
- Login har browser tab me alag hota hai (sessionStorage): tab band karne pe logout.
