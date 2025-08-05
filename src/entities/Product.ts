import {ProductStatus} from "@prisma/client";

export interface ProductUploadDTO {
	sku: string;
	name: string;
	price: number;
	stock: number;
	category: string;
}

export interface ProductResponseDTO {
	id: number;
	sku: string;
	name: string;
	price: number;
	stock: number;
	category: string;
	status: ProductStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface BulkUploadResult {
	totalAttempted: number;
	newProducts: number;
	duplicates: number;
	duplicateSkus: string[];
	errors: number;
}
