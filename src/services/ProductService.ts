import {BulkUploadResult, ProductResponseDTO, ProductUploadDTO} from "$entities/Product";
import {BadRequestWithMessage, INTERNAL_SERVER_ERROR_SERVICE_RESPONSE, ServiceResponse} from "$entities/Service";
import prisma from "../../prisma/instance";
import {mapPrismaToResponseDTO, mapUploadDtoToPrisma} from "$utils/product.utils";
import Logger from "$pkg/logger";
import {FilteringQueryV2} from "$entities/Query";
import {Prisma, ProductStatus} from "@prisma/client";

/**
 * Bulk upload products service.
 * @param products ProductUploadDTO[]
 * @return ServiceResponse<{count:number}>
 */
export async function uploadBulkProducts(
	products: ProductUploadDTO[]
):  Promise<ServiceResponse<BulkUploadResult>> {
	try{
		// Validate the input
		if (!products || products.length === 0) {
			return BadRequestWithMessage("No products found to upload") as ServiceResponse<BulkUploadResult>;
		}
		
		// Check for existing products by SKU
		const skus = products.map(p => p.sku);
		const existingProducts = await prisma.product.findMany({
			where: {
				sku: {
					in: skus
				}
			},
			select: {
				sku: true
			}
		});
		
		const existingSkus = new Set(existingProducts.map(p => p.sku));
		const newProducts = products.filter(p => !existingSkus.has(p.sku));
		const duplicateSkus = products.filter(p => existingSkus.has(p.sku)).map(p => p.sku);
		
		let insertedCount = 0;
		
		// Only insert new products
		if (newProducts.length > 0) {
			const result = await prisma.product.createMany({
				data: newProducts.map(product => ({
					...mapUploadDtoToPrisma(product),
					status: ProductStatus.pending,
				})),
				skipDuplicates: false, // We already filtered duplicates
			});
			insertedCount = result.count;
			
			// Simulate background processing for new products only
			newProducts.forEach(product => {
				setTimeout(async () => {
					await prisma.product.updateMany({
						where: { sku: product.sku, status: ProductStatus.pending },
						data: { status: ProductStatus.success }
					});
				}, 5000);
			});
		}
		
		const uploadResult: BulkUploadResult = {
			totalAttempted: products.length,
			newProducts: insertedCount,
			duplicates: duplicateSkus.length,
			duplicateSkus: duplicateSkus,
			errors: 0
		};
		
		return {
			status: true,
			data: uploadResult,
		};
	}catch (e) {
		Logger.error(`ProductService.uploadBulkProducts : ${e}`);
		return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE as ServiceResponse<BulkUploadResult>;
	}
}

/**
 * Retrieves a list of products from the database with support for filtering, searching, sorting, and pagination.
 *
 * @function getProductsWithFilter
 * @param {FilteringQueryV2} filter - Filtering query object parsed from the request.
 *   Supports properties: filters (Record<string, any>), page (number), rows (number),
 *   orderKey (string), orderRule ("asc"|"desc").
 * @returns {Promise<ServiceResponse<{ products: ProductResponseDTO[]; total: number }>>}
 *   ServiceResponse containing an array of filtered products and the total count matching the filter.
 *
 * @example
 * // Usage in a controller:
 * const filter = checkFilteringQueryV2(req);
 * const serviceResponse = await ProductService.getProductsWithFilter(filter);
 * if (!serviceResponse.status) {
 * 		return handleServiceErrorWithResponse(res, serviceResponse);
 * 	}
 *
 * @see ProductResponseDTO
 * @see FilteringQueryV2
*/
export async function getProductsWithFilter(
	filter: FilteringQueryV2
): Promise<ServiceResponse<{ products: ProductResponseDTO[]; total: number }>> {
	try {
		// Prisma query config
		const prismaWhere: any = {};
		if (filter.filters) {
			Object.entries(filter.filters).forEach(([key, value]) => {
				if (value !== null && value !== undefined && value !== "") {
					prismaWhere[key] = { contains: value};
				}
			});
		}
		
		// paging
		const page = filter.page || 1;
		const rows = filter.rows || 10;
		const skip = (page - 1) * rows;
		const take = rows;
		
		// order
		const orderKey = filter.orderKey || "createdAt"; // default order key
		const orderRule = filter.orderRule == "desc" ? "desc" : "asc"; // default order rule
		const allowedOrderKeys = ["id", "name", "sku", "price", "stock", "category"];
		const safeOrderKey = allowedOrderKeys.includes(orderKey) ? orderKey : "id";
		// Ensure orderRule is either 'asc' or 'desc'
		const orderBy: Prisma.ProductOrderByWithRelationInput = {
			[safeOrderKey]: orderRule
		};
		
		//query products
		const [products, total] = await Promise.all([
			prisma.product.findMany({
				where: prismaWhere,
				skip,
				take,
				orderBy,
			}),
			prisma.product.count({ where: prismaWhere }),
		]);
		
		// mapping products to response DTO
		return{
			status: true,
			data:{
				products: products.map(mapPrismaToResponseDTO),
				total: total,
			},
		};
	} catch (e) {
		Logger.error(`ProductService.getProductsWithFilter : ${e}`);
		return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE as ServiceResponse<{ products: ProductResponseDTO[]; total: number }>;
	}
}