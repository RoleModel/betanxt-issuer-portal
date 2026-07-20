"use client";

import dynamic from "next/dynamic";

import Loading from "@/components/Loading";

const ProductsContent = dynamic(
  () => import("@/components/Products/ProductsContent"),
  {
    loading: () => <Loading />,
    ssr: false,
  }
);

export default function ProductsPage() {
  return <ProductsContent />;
}
