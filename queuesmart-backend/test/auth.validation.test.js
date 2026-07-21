import assert from "node:assert/strict";
import test from "node:test";
import {
  validateLoginBody,
  validateRegisterBody,
} from "../src/modules/auth/auth.validation.js";

test("registration rejects a non-string email", () => {
  assert.throws(
    () =>
      validateRegisterBody({
        email: 12345,
        password: "test123",
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
        }),
      /Password must be 72 characters or less/
    );
  });