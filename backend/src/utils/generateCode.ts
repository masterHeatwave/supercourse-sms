import UserSchema from '@components/users/user.model';

export const generateRandomCode = async (): Promise<string> => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  while (true) {
    // Generate random letter
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];

    // Generate 8 random digits
    let randomDigits = '';
    for (let i = 0; i < 8; i++) {
      randomDigits += numbers[Math.floor(Math.random() * numbers.length)];
    }

    const code = `${randomLetter}${randomDigits}`;

    // Check if code already exists
    const existingUser = await UserSchema.findOne({ code });
    if (!existingUser) {
      return code;
    }
  }
};
