import React from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
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
      </form>
    </main>
  );
}
