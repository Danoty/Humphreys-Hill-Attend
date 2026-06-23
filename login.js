const USERS=[{username:"admin",password:"admin123",name:"Administrator",role:"Admin"},{username:"scanner",password:"scan123",name:"Check-in Officer",role:"Scanner"}];
document.getElementById("loginBtn").addEventListener("click", login);
document.addEventListener("keydown", e => { if(e.key === "Enter") login(); });
function login(){
  const username=document.getElementById("username").value.trim();
  const password=document.getElementById("password").value;
  const user=USERS.find(u=>u.username===username && u.password===password);
  if(!user){document.getElementById("loginMessage").textContent="Wrong username or password.";return;}
  sessionStorage.setItem("hhh_user_secure", JSON.stringify({name:user.name, role:user.role, username:user.username, loggedIn:true}));
  window.location.href="dashboard.html";
}
