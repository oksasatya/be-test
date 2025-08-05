import { Request, Response } from 'express';
import * as UserService from '$services/UserService';
import { handleServiceErrorWithResponse, response_success } from '$utils/response.utils';

export async function register(req: Request, res: Response): Promise<Response> {
	const serviceResponse = await UserService.register(req.body);
	
	// Follows NodeWave backend base response standard as instructed in the assessment.
	if (!serviceResponse.status)
		return handleServiceErrorWithResponse(res, serviceResponse);
	
	return response_success(res, serviceResponse.data, "Register success!");
}

export async function login(req: Request, res: Response): Promise<Response> {
	const serviceResponse = await UserService.login(req.body);
	
	// Follows NodeWave backend base response standard as instructed in the assessment.
	if (!serviceResponse.status)
		return handleServiceErrorWithResponse(res, serviceResponse);
	
	return response_success(res, serviceResponse.data, "Login success!");
}
