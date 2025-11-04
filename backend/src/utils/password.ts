import bcrypt from 'bcryptjs';
import { config } from '@config/config'; // Assuming salt rounds are in config

// Function to hash a password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = config.AUTH?.SALT_ROUNDS || 10; // Use config or default to 10
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
};

// Function to compare a plain password with a hash
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
