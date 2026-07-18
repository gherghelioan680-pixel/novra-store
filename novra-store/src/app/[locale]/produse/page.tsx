import { Suspense } from "react";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ProdusePageClient } from "@/components/produse/ProdusePageClient";
import { buildProductUrl, getProductById } from "@/lib/catalog";

type PageProps = {
  searchParams: Promise<{ category?: string; product?: string }>;
};

export default async function ToateProdusele({ searchParams }: PageProps) {
  const params = await searchParams;

  if (params.product && getProductById(params.product)) {
    redirect(buildProductUrl(params.product));
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-novra-bg text-white">
          <Navbar />
          <main className="pb-page site-container pt-8">
            <p className="text-gray-500 text-sm">Se încarcă catalogul...</p>
          </main>
          <Footer />
        </div>
      }
    >
      <ProdusePageClient />
    </Suspense>
  );
}
