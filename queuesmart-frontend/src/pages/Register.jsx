import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }

    sessionStorage.setItem("role", "user");
    navigate("/user-dashboard");
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>QueueSmart Registration</h1>

        <label>
          Email Username
          <input type="email" name="email" placeholder="student@example.edu" autoComplete="username" required />
        </label>

        <label>
          Password
          <input type="password" name="password" minLength="6" placeholder="At least 6 characters" autoComplete="new-password" required />
        </label>

        <button type="submit">Register</button>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
