import React from "react";
import { Link, useNavigate } from "react-router-dom";

//this is hard coded admin uid and pw for now
const ADMIN_UID = "admin@email.com";
const ADMIN_PW = "admin123";

export default function Login() {
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }
    
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (email === ADMIN_UID && password === ADMIN_PW) {
      sessionStorage.setItem("role", "admin");
      navigate("/Admin_dashboard");
    } else {
      sessionStorage.setItem("role", "user");
      navigate("/user-dashboard");
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>QueueSmart Login</h1>
        <p>Use your email as your username.</p>
        <label>
          Email Username
          <input type="email" name="email" placeholder="student@example.edu" autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            minLength="6"
            placeholder="At least 6 characters"
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit">Login</button>
        <p>
          New user? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
