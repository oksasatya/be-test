import { ServiceResponse, INTERNAL_SERVER_ERROR_SERVICE_RESPONSE, BadRequestWithMessage } from "$entities/Service";
import {UserLoginDTO, UserJWTDAO, exclude, UserRegisterDTO} from "$entities/User";
import prisma from "../../prisma/instance";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Logger from "$pkg/logger";
import {transformRoleToEnumRole} from "$utils/user.utils";

export async function login(dto: UserLoginDTO): Promise<ServiceResponse<{ token: string; user: Omit<any, "password"> }>> {
	try {
		// find user by email
		const user = await prisma.user.findUnique({
			where: { email: dto.email },
		});
		
		// if user not found, return error
		// this is to prevent timing attacks
		// where an attacker could guess the email and then try to brute force the password
		// by always returning the same error message
		if (!user) {
			return BadRequestWithMessage("invalid Credentials!") as ServiceResponse<{ token: string; user: Omit<any, "password"> }>;
		}
		
		// compare password
		// if password is incorrect, return error
		const valid = await bcrypt.compare(dto.password, user.password);
		if (!valid) {
			return BadRequestWithMessage("invalid Credentials!") as ServiceResponse<{ token: string; user: Omit<any, "password"> }>;
		}
		
		// create JWT token
		// and return user data without password
		const payload: UserJWTDAO = {
			id: user.id,
			email: user.email,
			fullName: user.fullName,
			role: user.role,
		};
		
		// sign the token with secret key and set expiration time
		const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "12h" });
		
		// exclude password from user object
		// to avoid sending password in response
		const userWithoutPassword = exclude(user, "password");
		
		// return response with token and user data
		// note: user data is without password
		return {
			status: true,
			data: {
				token,
				user: userWithoutPassword,
			}
		};
	} catch (err) {
		Logger.error(`UserService.login : ${err}`);
		return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE as ServiceResponse<{ token: string; user: Omit<any, "password"> }>;
	}
}

export async function register(
	dto: UserRegisterDTO
): Promise<ServiceResponse<{ user: Omit<any, "password"> }>> {
	try {
		// find if email already registered
		const existing = await prisma.user.findUnique({
			where: { email: dto.email }
		});
		
		// if email already registered, return error
		if (existing) {
			return BadRequestWithMessage("Email Already Register!") as ServiceResponse<{ user: Omit<any, "password"> }>;
		}
		
		// hash password
		const hashedPassword = await bcrypt.hash(dto.password, 10);
		
		// create user
		const user = await prisma.user.create({
			data: {
				fullName: dto.fullName,
				email: dto.email,
				password: hashedPassword,
				role: transformRoleToEnumRole("USER")
			}
		});
		
		// exclude password from user object
		// to avoid sending password in response
		const userWithoutPassword = exclude(user, "password");
		
		return {
			status: true,
			data: { user: userWithoutPassword }
		};
		
	} catch (err) {
		Logger.error(`UserService.register : ${err}`);
		return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE as ServiceResponse<{ user: Omit<any, "password"> }>;
	}
}
