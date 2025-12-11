/* start.js - Login / Registration UI logic
   - Reads username and password from input fields.
   - On button click, validates input locally, then asks the server whether the user exists.
   - If the user exists, attempts to log in; otherwise attempts to register.
   - Redirects to /main on success, and shows a short error message on failure.
*/

/* UI elements:
   usernameInput  - text input where the player types their username
   passwordInput  - text input where the player types their password
   btnStart       - button that begins the login/register flow
   startMessage   - small area for inline feedback (errors / prompts)
*/
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnStart = document.getElementById('btnStart');
const startMessage = document.getElementById('start-message');

// Click handler for the start button: performs basic validation, then contacts the server.
// Flow:
// 1. Ensure both fields are non-empty.
// 2. POST to /api/user/check to determine whether to log in or register.
// 3a. If user exists -> POST /api/user/login with credentials. On success navigate to /main.
// 3b. If user doesn't exist -> POST /api/user/register to create account. On success navigate to /main.
// Display brief error text in startMessage on any failure.
btnStart.addEventListener('click', async ()=>{
  const name = usernameInput.value.trim();
  const pass = passwordInput.value.trim();
  if(!name || !pass){ startMessage.textContent='Enter username & password'; return;}

  // check if user exists
  const res = await fetch('/api/user/check',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({name})
  });
  const data = await res.json();
  if(data.exists){
    // login existing user
    const loginRes = await fetch('/api/user/login',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name, password:pass})
    });
    const loginData = await loginRes.json();
    if(loginData.ok){ window.location='/main'; }
    else startMessage.textContent='Wrong password';
  } else {
    // register a new user with the provided credentials
    const regRes = await fetch('/api/user/register',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name, password:pass})
    });
    const regData = await regRes.json();
    if(regData.ok){ window.location='/main'; }
    else startMessage.textContent=regData.error;
  }
});