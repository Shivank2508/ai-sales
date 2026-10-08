import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi, IProduct } from "../api/productApi";

export const PRODUCTS_KEY = ["products"];

export function useProducts() {
  return useQuery<IProduct[]>({
    queryKey: PRODUCTS_KEY,
    queryFn: () => productApi.getProducts(),
  });
}

export function useProduct(id: string) {
  return useQuery<IProduct | null>({
    queryKey: [...PRODUCTS_KEY, id],
    queryFn: () => productApi.getProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: Partial<IProduct>) => productApi.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<IProduct> }) =>
      productApi.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}
