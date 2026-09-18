"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import { Search, MapPin, ShieldCheck, Clock, Store, TrendingUp, Zap, BarChart3, Package, Users } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push("/customer/search?q=" + encodeURIComponent(searchQuery.trim()));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find what you need,<br />
              <span className="text-teal-200">where it actually is.</span>
            </h1>
            <p className="text-lg md:text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
              Real-time inventory discovery. Search a product, see which verified shops have it in stock, and reserve it instantly.
            </p>
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-2xl">
                <div className="flex-1 flex items-center gap-2 px-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for any product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none text-sm"
                  />
                </div>
                <Button type="submit" size="lg" className="rounded-lg">Search</Button>
              </div>
            </form>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {["Drills", "Cement", "Rice", "Water Pump", "Steel Bar", "Solar Panel"].map((term) => (
                <Link
                  key={term}
                  href={"/customer/search?q=" + encodeURIComponent(term)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm text-teal-100 transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How StockSpot works</h2>
            <p className="text-gray-600 max-w-lg mx-auto">
              Connect demand with supply in real-time.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Search, title: "Search", desc: "Find the exact product or discover alternatives" },
              { icon: MapPin, title: "Find shops", desc: "See verified shops with real-time stock" },
              { icon: ShieldCheck, title: "Verify", desc: "Check stock freshness and seller trust" },
              { icon: Clock, title: "Reserve", desc: "Reserve the product and pick up" },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative bg-white rounded-xl p-6 border border-gray-200">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="absolute top-6 right-6 text-3xl font-bold text-gray-100">{i + 1}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">For Sellers</h2>
            <p className="text-gray-600 max-w-lg mx-auto">
              Know what customers want. Manage your inventory effectively. Discover demand opportunities.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Demand Intelligence", desc: "See what products customers in your area are searching for" },
              { icon: Package, title: "Inventory Management", desc: "Update stock in real-time with freshness tracking" },
              { icon: BarChart3, title: "Analytics", desc: "Track sales, demand gaps, and restock opportunities" },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-teal-300 transition-colors">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary">
                <Store className="w-4 h-4 mr-2" />
                Register Your Shop
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to find what you need?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Join thousands of customers and sellers using StockSpot for real-time inventory discovery.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/customer/search">
              <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                <Search className="w-4 h-4 mr-2" />
                Search Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">StockSpot</span>
          </div>
          <p className="text-sm text-gray-500">
            Real-time supply discovery and demand-matching platform
          </p>
        </div>
      </footer>
    </div>
  );
}
