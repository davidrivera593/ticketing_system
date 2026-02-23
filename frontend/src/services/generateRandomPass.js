const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBER = "0123456789";
const SPECIAL = "!@#$%^&*()-_=+[]{};:,.?/";
const ALL = `${UPPER}${LOWER}${NUMBER}${SPECIAL}`;

const getRandomValues = (length) => {
  const values = new Uint32Array(length);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < length; i++) values[i] = Math.floor(Math.random() * 2 ** 32);
  }
  return values;
};

const pickRandomChar = (charset, rndValue) => charset[rndValue % charset.length];

const shuffle = (chars) => {
  const rnd = getRandomValues(chars.length);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = rnd[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
};

export const generateRandomPassword = (length = 12) => {
  const finalLength = Math.max(8, length);
  const rnd = getRandomValues(finalLength);
  const chars = [
    pickRandomChar(UPPER, rnd[0]),
    pickRandomChar(LOWER, rnd[1]),
    pickRandomChar(NUMBER, rnd[2]),
    pickRandomChar(SPECIAL, rnd[3]),
  ];

  for (let i = chars.length; i < finalLength; i += 1) {
    chars.push(pickRandomChar(ALL, rnd[i]));
  }

  return shuffle(chars).join("");
};