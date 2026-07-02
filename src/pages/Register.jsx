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
    navigate("/blank");
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p>Use your email as your username.</p>
        <label>
          Full Name
          <input type="text" name="name" maxLength="100" autoComplete="name" required />
        </label>
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
            autoComplete="new-password"
            required
          />
        </label>
        <button type="submit">Register</button>
        <p>
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
