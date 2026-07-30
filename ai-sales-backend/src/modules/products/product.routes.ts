import { Router } from "express";
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "./product.controller";

export const productRouter = Router();

productRouter.post("/", createProduct)
productRouter.get("/", getProducts)
productRouter.get("/:id", getProduct)
productRouter.patch("/:id", updateProduct)
productRouter.delete("/:id", deleteProduct)



