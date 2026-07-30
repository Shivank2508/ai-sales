import { Response } from "express";
import { ProductService } from "./product.service";


const productSeervice = new ProductService()

export async function createProduct(
    req: Request,
    res: Response,

): Promise<void> {
    const product = await productSeervice.createPreoduct(req.body)
    res.send({
        status: 201,
        message: "Product created successfully",
        data: product
    })
}

export async function getProducts(
    req: Request,
    res: Response
): Promise<void> {
    const products = await productSeervice.getProducts()
    res.send({
        message: "Products fetched successfully",
        data: products,
    })
}

export async function getProduct(
    req: Request<{ id: string }>,
    res: Response
): Promise<void> {
    const product =
        await productSeervice.getProduct(req.params.id);

    res.send({
        message: "Product fetched successfully",
        data: product,
    });
}

export async function updateProduct(
    req: Request<{ id: string }>,
    res: Response
): Promise<void> {
    const product =
        await productSeervice.updateProduct(
            req.params.id,
            req.body
        );

    res.send({
        message: "Product updated successfully",
        data: product,
    });
}

export async function deleteProduct(
    req: Request<{ id: string }>,
    res: Response
): Promise<void> {
    await productSeervice.deleteProduct(req.params.id);

    res.send({
        message: "Product deleted successfully",
        data: null,
    });
}