// Usage: node reset-password.js <email> <newPassword>
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.error('Usage: node reset-password.js <email> <newPassword>');
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('User not found:', email);
    process.exit(1);
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { password: hashed } });
  console.log('Password reset successful for', email);
  process.exit(0);
}

const [,, email, newPassword] = process.argv;
resetPassword(email, newPassword);
