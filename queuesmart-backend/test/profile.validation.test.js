import assert from "node:assert/strict";
import test from "node:test";
import {
  validateRegisterProfileFields,
  validateUpdateProfileBody,
} from "../src/modules/profile/profile.validation.js";
import { validateRegisterBody } from "../src/modules/auth/auth.validation.js";

test("profile registration requires full name", () => {
  assert.throws(
    () => validateRegisterProfileFields({ fullName: "" }),
    /Missing required fields|Full name is required/
  );
});

test("profile registration rejects full names over 100 characters", () => {
  assert.throws(
    () => validateRegisterProfileFields({ fullName: "a".repeat(101) }),
    /Full name must be 100 characters or less/
  );
});

test("profile update requires at least one field", () => {
  assert.throws(
    () => validateUpdateProfileBody({}),
    /Provide at least one profile field to update/
  );
});

test("profile update accepts phone and preferences", () => {
  const updates = validateUpdateProfileBody({
    phone: "555-0100",
    preferences: "email notifications",
  });

  assert.deepEqual(updates, {
    phone: "555-0100",
    preferences: "email notifications",
  });
});

test("registration requires fullName with email and password", () => {
  assert.throws(
    () =>
      validateRegisterBody({
        email: "user@example.com",
        password: "test123",
      }),
    /Missing required fields/
  );
});

test("registration accepts fullName and optional phone", () => {
  const result = validateRegisterBody({
    email: "User@Example.com",
    password: "test123",
    fullName: "Ada Lovelace",
    phone: "555-1234",
  });

  assert.equal(result.email, "user@example.com");
  assert.equal(result.fullName, "Ada Lovelace");
  assert.equal(result.phone, "555-1234");
});
