import {Router} from "express";
import multer from "multer";
import * as ProductController from "$controllers/rest/ProductController";

const ProductRoutes = Router({ mergeParams: true });
const upload = multer();

ProductRoutes.post("/upload", upload.single("file"), ProductController.uploadProducts);
ProductRoutes.get("/", ProductController.getProducts);

export default ProductRoutes;