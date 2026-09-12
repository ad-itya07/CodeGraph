import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "@/config/env.js";
import { ConflictError } from "@/errors/ConfictError.js";
import { AuthenticationError } from "@/errors/AuthenticationError.js";
import { ValidationError } from "@/errors/ValidationError.js";
import { NotFoundError } from "@/errors/NotFoundError.js";
import { findUserByEmail, findUserById, createUser } from "@/persistence/user.js";

const SALT_ROUNDS = 12;

class AuthService {
  async register(name: string, email: string, password: string) {
    if (!name || !email || !password) {
      throw new ValidationError("Name, email, and password are required");
    }

    if (password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new ConflictError("A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser(name, email, hashedPassword);
    const token = this.generateToken(user.id);

    return { user, token };
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    const user = await findUserByEmail(email);
    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password");
    }

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }

  async getMe(userId: string) {
    const user = await findUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  private generateToken(userId: string): string {
    const secret: string = config.jwtSecret;
    return jwt.sign({ userId }, secret, {
      expiresIn: config.jwtExpiresIn as unknown as number,
    });
  }
}

export default new AuthService();
