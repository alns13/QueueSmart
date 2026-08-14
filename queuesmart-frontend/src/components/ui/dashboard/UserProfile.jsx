import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { changePassword } from "@/api/auth.js";
import { fetchMyProfile, updateMyProfile } from "@/api/profile.js";

export function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchMyProfile()
      .then(setProfile)
      .catch((requestError) => setError(requestError.message));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }

    const formData = new FormData(event.currentTarget);
    const updates = {
      fullName: String(formData.get("fullName") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      preferences: String(formData.get("preferences") || "").trim(),
    };

    setIsSaving(true);
    try {
      const saved = await updateMyProfile(updates);
      setProfile(saved);
      setMessage("Profile saved.");
    } catch (requestError) {
      setError(requestError.message || "Could not save profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      setPasswordMessage("Password updated.");
      form.reset();
    } catch (requestError) {
      setPasswordError(requestError.message || "Could not change password");
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (!profile && !error) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Update your name, contact details, and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label>
              Full Name
              <input
                type="text"
                name="fullName"
                defaultValue={profile?.fullName || ""}
                maxLength={100}
                required
              />
            </label>

            <label>
              Email
              <input type="email" value={profile?.email || ""} disabled readOnly />
            </label>

            <label>
              Phone (optional)
              <input
                type="tel"
                name="phone"
                defaultValue={profile?.phone || ""}
                maxLength={30}
              />
            </label>

            <label>
              Preferences (optional)
              <input
                type="text"
                name="preferences"
                defaultValue={profile?.preferences || ""}
                placeholder="e.g. email notifications"
                maxLength={500}
              />
            </label>

            {error && <p className="auth-error">{error}</p>}
            {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}

            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Enter your current password, then choose a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <label>
              Current Password
              <input
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                minLength={1}
                maxLength={72}
                required
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                name="newPassword"
                autoComplete="new-password"
                minLength={6}
                maxLength={72}
                required
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                minLength={6}
                maxLength={72}
                required
              />
            </label>

            {passwordError && <p className="auth-error">{passwordError}</p>}
            {passwordMessage && (
              <p className="text-sm font-medium text-emerald-700">{passwordMessage}</p>
            )}

            <button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
