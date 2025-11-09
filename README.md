# Campaign Tracker (Client-side)

This is a simple static Campaign Tracker web app that demonstrates client-side user authentication (register/login/forgot password) and a per-user campaign list. Everything is stored in the browser's localStorage — no backend required.

Files:
- `index.html` — main page / UI
- `css/style.css` — styles
- `js/app.js` — JavaScript that handles auth and campaign CRUD using localStorage

How to run:
1. Open `index.html` in your browser (double-click or open via your browser's File->Open).
2. Register a new account (provide a security question and answer).
3. Login using the new account.
4. Add campaigns using the form in the dashboard. Campaigns are saved per-user in localStorage.
5. Use "Forgot" to reset a password — you'll be asked the security question you selected during registration.

Notes:
- This is a demo only. Passwords are stored in plain text in localStorage for simplicity. Do not use real credentials.
- To wipe app data, clear site data/localStorage for the file or run `localStorage.clear()` in the browser console for the page.

Enjoy the demo and feel free to customize the UI and add features like file export/import, charts, or filters.