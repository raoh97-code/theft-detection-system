// Clear auth flag whenever the login page loads.
// This ensures that if a user signs out (or navigates back), the dashboard
// auth check will fail and they cannot re-enter without logging in again.
sessionStorage.removeItem('loggedIn');

// Allowed Admins (Hardcoded for Hackathon)
const admins = [
  { email: "admin1@secure.com", password: "admin123" },
  { email: "admin2@secure.com", password: "secure456" },
  { email: "owner@secure.com", password: "owner789" }
];

document.getElementById("loginForm").addEventListener("submit", function (e) {
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

    // Mark session as authenticated, then redirect
    sessionStorage.setItem('loggedIn', 'true');
    setTimeout(() => {
      window.location.replace("dashboard.html");
    }, 1000);

  } else {
    errorMsg.style.color = "red";
    errorMsg.innerText = "Incorrect Email or Password";
  }
});