export class UpdateProductDto {
  updates: {
    name?: string;
    shortDesc?: string;
    fullDesc?: string;
    price?: number;
    categoryId?: number;
    imgFileKey?: string;
  };
  productId: string;
}
