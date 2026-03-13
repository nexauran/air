import AddToCartButton from "@/components/AddToCartButton";
import Container from "@/components/Container";
import FavoriteButton from "@/components/FavouriteButton";
import ImageView from "@/components/ImageView";
import PriceView from "@/components/PriceView";
import ProductChar from "@/components/ProductChar";
import ProductCard from "@/components/ProductCard";

import {
  getProductBySlug,
  getRelatedProducts,
  getOtherProducts
} from "@/sanity/queries";

import { CornerDownLeft, Truck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import { FaRegQuestionCircle } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { TbTruckDelivery } from "react-icons/tb";

const SingleProductPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {

  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    return notFound();
  }

  /* CATEGORY ID */

  const categoryId = product?.categories?.[0]?._id;

  /* RELATED PRODUCTS */

  const relatedProducts = categoryId
    ? await getRelatedProducts(categoryId, slug)
    : [];

  /* OTHER PRODUCTS */

  const otherProducts = await getOtherProducts(slug);

  return (
    <>
      <Container className="flex flex-col md:flex-row gap-10 py-10">

        {/* PRODUCT IMAGE */}

        {product?.images && (
          <ImageView
            images={product?.images}
            isStock={product?.stock}
          />
        )}

        {/* PRODUCT INFO */}

        <div className="w-full md:w-1/2 flex flex-col gap-5">

          <div className="space-y-1">
            <h2 className="text-2xl font-bold">
              {product?.name}
            </h2>

            <p className="text-sm text-gray-600 tracking-wide">
              {product?.description}
            </p>
          </div>

          {/* PRICE */}

          <div className="space-y-2 border-t border-b border-gray-200 py-5">

            <div className="font-semibold">
              For better clarity and high-quality results, kindly send your images and requirements through WhatsApp after payment.
            </div>

            <PriceView
              price={product?.price}
              discount={product?.discount}
              className="text-lg font-bold"
            />

            <p
              className={`px-4 py-1.5 text-sm text-center inline-block font-semibold rounded-lg ${
                product?.stock === 0
                  ? "bg-red-100 text-red-600"
                  : "text-green-600 bg-green-100"
              }`}
            >
              {(product?.stock as number) > 0
                ? "In Stock"
                : "Out of Stock"}
            </p>

          </div>

          {/* BUTTONS */}

          <div className="flex items-center gap-2.5 lg:gap-3">

            <AddToCartButton product={product} />

            <FavoriteButton
              showProduct={true}
              product={product}
            />

          </div>

          <ProductChar product={product} />

          {/* QUICK LINKS */}

          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-b-gray-200 py-5 -mt-2">

            <div className="flex items-center gap-2 text-sm hover:text-red-600">
              <FaRegQuestionCircle className="text-lg" />
              <Link href="https://wa.me/917306328115">
                Ask a question
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm hover:text-red-600">
              <TbTruckDelivery className="text-lg" />
              <Link href="https://wa.me/917306328115">
                Delivery Details
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm hover:text-red-600">
              <FiShare2 className="text-lg" />
              <Link href="https://wa.me/917306328115">
                Contact Us
              </Link>
            </div>

          </div>

          {/* DELIVERY INFO */}

          <div className="flex flex-col">

            <div className="border border-lightColor/25 border-b-0 p-3 flex items-center gap-2.5">

              <Truck size={30} className="text-shop_orange" />

              <div>
                <p className="text-base font-semibold">
                  All India Delivery Available
                </p>

                <p className="text-sm text-gray-500 underline">
                  Order will be dispatched within 1-2 days
                </p>
              </div>

            </div>

            <div className="border border-lightColor/25 p-3 flex items-center gap-2.5">

              <CornerDownLeft size={30} className="text-shop_orange" />

              <div>
                <p className="text-base font-semibold">
                  Return Delivery
                </p>

                <p className="text-sm text-gray-500">
                  Free 30 days Delivery Returns.
                </p>
              </div>

            </div>

          </div>

        </div>

      </Container>

      {/* RELATED PRODUCTS */}

      {relatedProducts?.length > 0 && (

        <Container className="py-12">

          <h2 className="text-2xl font-bold mb-6">
            Related Products
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

            {relatedProducts.map((item: any) => (
              <ProductCard
                key={item._id}
                product={item}
              />
            ))}

          </div>

        </Container>

      )}

      {/* OTHER PRODUCTS */}

      {otherProducts?.length > 0 && (

        <Container className="py-12">

          <h2 className="text-2xl font-bold mb-6">
            You May Also Like
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

            {otherProducts.map((item: any) => (
              <ProductCard
                key={item._id}
                product={item}
              />
            ))}

          </div>

        </Container>

      )}

    </>
  );
};

export default SingleProductPage;