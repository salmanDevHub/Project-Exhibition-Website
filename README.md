# VSpark Project Exhibition (real website with database)

Multi-university project exhibition: students register, submit projects (with PDF), supervisors approve or reject, and approved projects show on the public showcase.

## Chalane ka tareeqa (Run)
1. Node.js 18 ya us se naya install karo (https://nodejs.org).
2. Is folder mein terminal kholo aur ye likho:
   ```
   npm install
   npm start
   ```
3. Browser mein kholo: http://localhost:3000

Pehli dafa chalane par database (`exhibition.db`) khud ban jata hai, saath mein universities (Vehari, Burewala, Multan, Sahiwal) aur ek admin.

**Admin login:** `admin@vspark.pk` / `Admin@12345` (pehle password badal lo).
Badalne ke liye pehli dafa chalane se pehle `ADMIN_EMAIL` aur `ADMIN_PASSWORD` set karo.

**Demo data (optional):** `npm run seed` (8 projects, supervisors aur students). Sab demo accounts ka password `demo123`:
`sana@demo.pk` (supervisor), `ali@demo.pk` (student).

## Kaise kaam karta hai
- **Register:** student ya supervisor apni university ka naam khud likhta hai. Agar naam list mein nahi to wo khud add ho jata hai.
- **Student panel:** project form + PDF upload, apne projects ka status (pending / approved / rejected).
- **Supervisor panel:** sirf apne assign hue projects dekhta hai, approve ya reject (reason ke saath).
- **Admin:** sab projects aur sab users dekhta hai, project delete kar sakta hai.
- **Public:** search, category filter, university filter, top 3, like/save (login chahiye).

## Files
- `server.js` – API (login, register, projects, review, likes)
- `db.js` – SQLite database tables
- `seed.js` – demo data
- `public/` – website (index.html, app.js, style.css, assets)
- `uploads/` – uploaded PDF files

## Security
Passwords bcrypt se hash hote hain, login cookie httpOnly hai, 8 galat attempts ke baad 10 minute ka block. Internet par rakhne se pehle HTTPS lagao aur `NODE_ENV=production` set karo.
