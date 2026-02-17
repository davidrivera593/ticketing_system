const MIN_LENGTH = 8;
const UPPER_RE = /[A-Z]/;
const LOWER_RE = /[a-z]/;
const NUMBER_RE = /[0-9]/;
const SPECIAL_RE = /[^A-Za-z0-9]/;

const validatePassword = (password) => {
  const errors = [];

  if (typeof password !== "string") {
    return { valid: false, errors: ["Password must be a string."] };
  }

  if (password.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters.`);
  }
  if (!UPPER_RE.test(password)) {
    errors.push("Password must include at least 1 uppercase letter.");
  }
  if (!LOWER_RE.test(password)) {
    errors.push("Password must include at least 1 lowercase letter.");
  }
  if (!NUMBER_RE.test(password)) {
    errors.push("Password must include at least 1 number.");
  }
  if (!SPECIAL_RE.test(password)) {
    errors.push("Password must include at least 1 special character.");
  }

  return { valid: errors.length === 0, errors };
};

module.exports = {
  validatePassword,
};
