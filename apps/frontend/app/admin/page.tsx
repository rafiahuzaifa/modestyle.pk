import { client } from "@/sanity/lib/client";
import { ADMIN_STATS, ADMIN_LOW_STOCK, ADMIN_PRODUCTS } from "@/sanity/lib/queries";
import Link from "next/link";
import Image from "next/image";

interface Stats {
  totalProducts: number;
  totalCategories: number;
  lowStockCount: number;
  featuredCount: number;
}

interface LowStockItem {
  _id: string;
  name: string;
  stock: number;
  image: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image: string;
  category: string;
}

export default async function AdminDashboard() {
  const [rawStats, rawLowStock, rawProducts] = await Promise.all([
    client.fetch<Stats>(ADMIN_STATS).catch(() => null),
    client.fetch<LowStockItem[]>(ADMIN_LOW_STOCK).catch(() => null),
    client.fetch<Product[]>(ADMIN_PRODUCTS).catch(() => null),
  ]);

  const stats = rawStats ?? { totalProducts: 0, totalCategories: 0, lowStockCount: 0, featuredCount: 0 };
  const lowStock = rawLowStock ?? [];
  const products = rawProducts ?? [];

  const statCards = [
    { label: "Total Products", value: stats.totalProducts, color: "bg-blue-50 text-blue-600" },
    { label: "Categories", value: stats.totalCategories, color: "bg-green-50 text-green-600" },
    { label: "Low Stock Alerts", value: stats.lowStockCount, color: "bg-red-50 text-red-600" },
    { label: "Featured", value: stats.featuredCount, color: "bg-gold-50 text-gold-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your ModestStyle.pk store
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className={`text-3xl font-display mt-2 ${stat.color.split(" ")[1]}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Products */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Recent Products</h3>
            <Link href="/admin/products" className="text-xs text-gold-500 hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-xs text-gray-400 font-medium">Product</th>
                  <th className="text-left py-3 text-xs text-gray-400 font-medium">Category</th>
                  <th className="text-right py-3 text-xs text-gray-400 font-medium">Price</th>
                  <th className="text-right py-3 text-xs text-gray-400 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 8).map((product) => (
                  <tr key={product._id} className="border-b border-gray-50">
                    <td className="py-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                        {product.image && (
                          <Image src={product.image} alt="" fill className="object-cover" sizes="40px" />
                        )}
                      </div>
                      <span className="truncate max-w-[180px]">{product.name}</span>
                    </td>
                    <td className="py-3 text-gray-500">{product.category}</td>
                    <td className="py-3 text-right">PKR {product.price.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <span className={product.stock < 10 ? "text-red-500 font-medium" : ""}>
                        {product.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-medium mb-4">Low Stock Alerts</h3>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400">All products well stocked!</p>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 8).map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg overflow-hidden relative flex-shrink-0">
                    {item.image && (
                      <Image src={item.image} alt="" fill className="object-cover" sizes="40px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.name}</p>
                    <p className="text-xs text-red-500 font-medium">
                      Only {item.stock} left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Add Product", href: "/production", desc: "Open Sanity Studio" },
          { label: "View Orders", href: "/admin/orders", desc: "Manage order status" },
          { label: "Manage Users", href: "/admin/users", desc: "View customers" },
          { label: "Store Front", href: "/", desc: "View your store" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gold-300 hover:shadow-sm transition"
          >
            <p className="font-medium text-sm">{action.label}</p>
            <p className="text-xs text-gray-400 mt-1">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
