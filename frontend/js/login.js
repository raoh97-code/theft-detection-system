// Allowed Admins (Hardcoded for Hackathon)
const admins = [
  { email: "admin1@secure.com", password: "admin123" },
  { email: "admin2@secure.com", password: "secure456" },
  { email: "owner@secure.com", password: "owner789" }
];

document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const emailInput = document.getElementById("email").value.trim();
  const passwordInput = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  const validAdmin = admins.find(admin => 
    admin.email === emailInput && admin.password === passwordInput
  );

  if (validAdmin) {
    errorMsg.style.color = "green";
    errorMsg.innerText = "Login Successful!";
    
    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);

  } else {
    errorMsg.style.color = "red";
    errorMsg.innerText = "Incorrect Email or Password";
  }
});