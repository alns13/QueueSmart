import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "./auth.service.js";
import {
  validateLoginBody,
  validateRegisterBody,
} from "./auth.validation.js";

export async function register(req, res, next) {
  try {
    const input = validateRegisterBody(req.body);
    const user = await registerUser(input);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const input = validateLoginBody(req.body);
    const result = await loginUser(input);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    // JWT logout is client-side for now: discard the token.
    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = getCurrentUser(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}
