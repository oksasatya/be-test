import {
	handleServiceErrorWithResponse,
	response_bad_request,
	response_success
} from "$utils/response.utils";
import * as ProductService from "$services/ProductService";
import {ProductUploadDTO} from "$entities/Product";
import {parseExcelToDTO} from "$utils/product.utils";
import { Request, Response } from 'express';
import {checkFilteringQueryV2} from "$controllers/helpers/CheckFilteringQuery";

/**
 * ProductController handles the RESTful API requests for products.
 * It provides endpoints for bulk uploading products.
 */
export async function uploadProducts(req: Request, res: Response): Promise<Response> {
	try {
		const file = (req as any).file as Express.Multer.File;
		
		// validate the request file
		if (!file) {
			return response_bad_request(res, "No file uploaded");
		}
		
		let products: ProductUploadDTO[] = [];
		try {
			products = parseExcelToDTO(file.buffer);
		} catch (err) {
			return response_bad_request(res, "Failed to parse Excel file");
		}
		
		if (products.length === 0) {
			return response_bad_request(res, "No valid products found in the Excel file");
		}
		
		// Call the service to upload products
		const serviceResponse = await ProductService.uploadBulkProducts(products);
		
		if (!serviceResponse.status) {
			return handleServiceErrorWithResponse(res, serviceResponse);
		}
		
		// Create informative message based on results
		const result = serviceResponse.data;
		if (!result) {
			return response_bad_request(res, "Invalid service response");
		}
		
		let message: string;
		
		if (result.newProducts > 0 && result.duplicates > 0) {
			message = `Upload completed! ${result.newProducts} new products added, ${result.duplicates} duplicates skipped.`;
		} else if (result.newProducts > 0) {
			message = `${result.newProducts} products uploaded and processed successfully!`;
		} else if (result.duplicates > 0) {
			message = `All ${result.duplicates} products already exist in the system. No new products added.`;
		} else {
			message = "Upload processed, but no products were added.";
		}
		
		// Return success response with detailed information
		return response_success(res, result, message);
		
	} catch (err) {
		console.error("Upload error:", err);
		return response_bad_request(res, "Failed to process product upload");
	}
}


/**
 * Controller to get list of products with filtering, searching, sorting, and pagination.
 * @route GET /products
 * @query FilteringQueryV2 (see checkFilteringQueryV2)
 */
export async function getProducts(req: Request, res: Response): Promise<Response> {
	const filter = checkFilteringQueryV2(req);
	
	// call the service to get products with filter
	const serviceResponse = await ProductService.getProductsWithFilter(filter);
	
	// Follows NodeWave backend base response standard as instructed in the assessment.
	if (!serviceResponse.status) {
		return handleServiceErrorWithResponse(res, serviceResponse);
	}
	
	// return success response with products and total count
	return response_success(res, serviceResponse.data, "Products retrieved successfully!");
}