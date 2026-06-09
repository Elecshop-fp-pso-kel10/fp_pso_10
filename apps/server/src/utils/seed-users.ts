import { faker } from '@faker-js/faker';
import { hash } from 'argon2';

// ROLES defined but only used as a type source — remove the runtime value
// and derive the type directly to avoid the unused-vars error
type Role = 'user' | 'admin';

interface GeneratedUser {
  name: string;
  email: string;
  password: string;
  avatar: string;
  isAdmin: boolean;
  createdAt: Date;
  reviews: number;
  purchases: number;
}

export async function generateUsers(count: number): Promise<GeneratedUser[]> {
  const users: GeneratedUser[] = [];
  const hashedPassword = await hash('password123');

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    // role typed but only used to derive isAdmin — kept for clarity
    const _role: Role = i === 0 ? 'admin' : 'user';

    const user: GeneratedUser = {
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
      }),
      password: hashedPassword,
      avatar: faker.image.avatar(),
      isAdmin: i === 0,
      createdAt: faker.date.past({ years: 1 }),
      reviews: faker.number.int({ min: 0, max: 15 }),
      purchases: faker.number.int({ min: 1, max: 20 }),
    };

    users.push(user);
  }

  return users.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}