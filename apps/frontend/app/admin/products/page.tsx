import { client } from "@/sanity/lib/client";
import { ADMIN_PRODUCTS } from "@/sanity/lib/queries";
import Image from "next/image";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
}

export default async function AdminProductsPage() {
  const products = (await client.fetch<Product[]>(ADMIN_PRODUCTS).catch(() => null)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display">Products</h2>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} products managed via Sanity
          </p>
        </div>
        <a
          href="/production"
          target="_blank"
          className="bg-gold-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gold-600 transition"
        >
          + Add Product in Sanity
        </a>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Product</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400">Category</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400">Price</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400">Stock</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-400">Badges</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                        {product.image && (
                          <Image src={product.image} alt="" fill className="object-cover" sizes="48px" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{product.category}</td>
                  <td className="px-6 py-3 text-right">PKR {product.price.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={product.stock < 10 ? "text-red-500 font-medium" : ""}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      {product.isFeatured && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-50 text-gold-600">Featured</span>
                      )}
                      {product.isBestseller && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Bestseller</span>
                      )}
                      {product.isNewArrival && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600">New</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <a
                      href={`/production/structure/product;${product._id}`}
                      target="_blank"
                      className="text-xs text-gold-500 hover:underline"
                    >
                      Edit in Sanity
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
