import bcrypt from "bcryptjs";
import prisma from "../prisma/client";
import { generateToken } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { RegisterInput, LoginInput } from "../utils/validation";

const SALT_ROUNDS = 12;

export async function register(input: RegisterInput) {
  const { email, password, displayName } = input;

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { uoftEmail: email },
  });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      uoftEmail: email,
      passwordHash,
      displayName,
    },
    select: {
      id: true,
      uoftEmail: true,
      displayName: true,
      createdAt: true,
    },
  });

  const token = generateToken({
    id: user.id,
    email: user.uoftEmail,
    displayName: user.displayName,
  });

  return { user, token };
}

export async function login(input: LoginInput) {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { uoftEmail: email },
  });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken({
    id: user.id,
    email: user.uoftEmail,
    displayName: user.displayName,
  });

  return {
    user: {
      id: user.id,
      uoftEmail: user.uoftEmail,
      displayName: user.displayName,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      uoftEmail: true,
      displayName: true,
      createdAt: true,
      _count: {
        select: {
          reports: true,
          sightings: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}
