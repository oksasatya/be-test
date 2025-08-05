import {ProductResponseDTO, ProductUploadDTO} from "$entities/Product";
import * as XLSX from 'xlsx';
import {Prisma, Product, ProductStatus} from "@prisma/client";

// This file contains utility functions to map between Product entities and DTOs for upload and response.
export function mapUploadDtoToPrisma(dto: ProductUploadDTO): Prisma.ProductCreateInput {
	return {
		sku: dto.sku,
		name: dto.name,
		price: dto.price,
		stock: dto.stock,
		category: dto.category,
		status: ProductStatus.pending,
	};
}


// This function maps a Prisma Product object to a ProductResponseDTO.
export function mapPrismaToResponseDTO(product: Product): ProductResponseDTO {
	return {
		id: product.id,
		sku: product.sku,
		name: product.name,
		price: product.price,
		stock: product.stock,
		category: product.category,
		status: product.status as ProductStatus,
		createdAt: product.createdAt,
		updatedAt: product.updatedAt,
	}
}

export function parseExcelToDTO(buffer: Buffer): ProductUploadDTO[] {
	// Read buffer to workbook
	const workbook = XLSX.read(buffer, { type: 'buffer' });
	const sheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[sheetName];
	const rows = XLSX.utils.sheet_to_json<any>(worksheet);
	
	// Map to DTO
	return rows
		.map(row => ({
			sku: String(row['SKU'] || row['sku']),
			name: String(row['Name'] || row['name']),
			price: parseInt(row['Price'] || row['price']),
			stock: parseInt(row['Stock'] || row['stock']),
			category: String(row['Category'] || row['category']),
		}))
		.filter(dto =>
			dto.sku && dto.name && !isNaN(dto.price) && !isNaN(dto.stock) && dto.category
		);
}