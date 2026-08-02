import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchMyProfile, updateMyProfile } from "@/api/profile.js";

export function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
    </div>
  );
}
