import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "@/api/auth.js";

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setIsSubmitting(true);
    try {
      await register({ email, password });
      const { user } = await login({ email, password });
      navigate(user.role === "admin" ? "/Admin_dashboard" : "/user-dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>QueueSmart Registration</h1>

        <label>
          Email Username
          <input
            type="email"
            name="email"
            placeholder="student@example.edu"
            autoComplete="username"
            required
          />
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

        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
