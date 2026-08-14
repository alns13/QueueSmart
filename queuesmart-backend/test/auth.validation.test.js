import assert from "node:assert/strict";
import test from "node:test";
import {
  validateChangePasswordBody,
  validateLoginBody,
  validateRegisterBody,
} from "../src/modules/auth/auth.validation.js";

test("registration rejects a non-string email", () => {
  assert.throws(
    () =>
      validateRegisterBody({
        email: 12345,
        password: "test123",
        fullName: "Test User",
      }),
    /Email must be a string/
  );
});

test("login rejects a non-string password", () => {
  assert.throws(
    () =>
      validateLoginBody({
        email: "user@example.com",
        password: 123456,
      }),
    /Password must be a string/
  );
});

test("registration rejects an email longer than 254 characters", () => {
  const longEmail = `${"a".repeat(245)}@example.com`;

  assert.throws(
    () =>
      validateRegisterBody({
        email: longEmail,
        password: "test123",
        fullName: "Test User",
      }),
    /Email must be 254 characters or less/
  );
});

test("registration rejects a password longer than 72 characters", () => {
  assert.throws(
    () =>
      validateRegisterBody({
        email: "user@example.com",
        password: "a".repeat(73),
        fullName: "Test User",
      }),
    /Password must be 72 characters or less/
  );
});

test("change password requires confirmation to match", () => {
  assert.throws(
    () =>
      validateChangePasswordBody({
        currentPassword: "oldpass1",
        newPassword: "newpass1",
        confirmPassword: "newpass2",
      }),
    /New password and confirmation do not match/
  );
});

test("change password rejects reusing the current password", () => {
  assert.throws(
    () =>
      validateChangePasswordBody({
        currentPassword: "samepass",
        newPassword: "samepass",
        confirmPassword: "samepass",
      }),
    /New password must be different from the current password/
  );
});

test("change password accepts a valid password update payload", () => {
  const result = validateChangePasswordBody({
    currentPassword: "oldpass1",
    newPassword: "newpass1",
    confirmPassword: "newpass1",
  });

  assert.deepEqual(result, {
    currentPassword: "oldpass1",
    newPassword: "newpass1",
  });
});
