"use client";

import dynamic from "next/dynamic";

import Loading from "@/components/Loading";

const ProductsContent = dynamic(
  async () => await import("@/components/Products/ProductsContent"),
  {
    loading: () => <Loading />,
    ssr: false,
  }
);

const ProductsPage = () => {
  return <ProductsContent />;
};

export default ProductsPage;
