import bcrypt from 'bcryptjs';

import { User } from '../models/User';

export async function seedAdminFromEnv() {
  const name = process.env.ADMIN_SEED_NAME?.trim();
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD?.trim();

  if (!name || !email || !password) {
    return;
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.role === 'ADMIN') {
      console.log(`✅ Admin user already exists: ${email}`);
      return;
    }

    console.warn(
      `⚠️ Cannot seed admin because the email ${email} already exists with role ${existingUser.role}.` +
      ' Use a different ADMIN_SEED_EMAIL or remove the existing account.'
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email,
    passwordHash,
    role: 'ADMIN',
  });

  console.log(`✅ Admin user seeded successfully: ${email}`);
}
