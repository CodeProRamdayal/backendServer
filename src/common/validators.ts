export function isValidEmployeePhone(phone: string) {
  return /^\d{10}$/.test(phone);
}
