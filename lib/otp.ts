export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOtpExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000);
}