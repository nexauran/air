import { SINGLE_BLOG_QUERYResult } from "@/sanity.types";
import { defineQuery } from "next-sanity";
import { client } from "../lib/client";

/* -------------------------------- */
/* BRANDS */
/* -------------------------------- */

const BRANDS_QUERY = defineQuery(`*[_type=='brand'] | order(name asc)`);

/* -------------------------------- */
/* LATEST BLOG */
/* -------------------------------- */

const LATEST_BLOG_QUERY = defineQuery(
  `*[_type == 'blog' && isLatest == true]|order(name asc){
    ...,
    blogcategories[]->{
      title
    }
  }`
);

/* -------------------------------- */
/* DEAL PRODUCTS */
/* -------------------------------- */

const DEAL_PRODUCTS = defineQuery(
  `*[_type == 'product' && status == 'hot'] | order(name asc){
    ...,
    categories[]->{
      _id,
      title
    }
  }`
);

/* -------------------------------- */
/* PRODUCT BY SLUG */
/* -------------------------------- */

const PRODUCT_BY_SLUG_QUERY = defineQuery(
  `*[_type == "product" && slug.current == $slug][0]{
    ...,
    categories[]->{
      _id,
      title
    }
  }`
);

/* -------------------------------- */
/* RELATED PRODUCTS (BY CATEGORY) */
/* -------------------------------- */

const RELATED_PRODUCTS_QUERY = defineQuery(
  `*[_type == "product"
    && references($categoryId)
    && slug.current != $slug
  ] | order(_createdAt desc)[0...8]{
    ...,
    categories[]->{
      _id,
      title
    }
  }`
);

/* -------------------------------- */
/* OTHER PRODUCTS */
/* -------------------------------- */

const OTHER_PRODUCTS_QUERY = defineQuery(
  `*[_type == "product"
    && slug.current != $slug
  ] | order(_createdAt desc)[0...10]{
    ...,
    categories[]->{
      _id,
      title
    }
  }`
);

/* -------------------------------- */
/* BRAND NAME */
/* -------------------------------- */

const BRAND_QUERY = defineQuery(
  `*[_type == "product" && slug.current == $slug]{
    "brandName": brand->title
  }`
);

/* -------------------------------- */
/* USER ORDERS */
/* -------------------------------- */

const MY_ORDERS_QUERY = defineQuery(
  `*[_type == 'order' && clerkUserId == $userId] | order(orderDate desc){
    ...,
    products[]{
      ...,
      product->
    }
  }`
);

/* -------------------------------- */
/* BLOG LIST */
/* -------------------------------- */

const GET_ALL_BLOG = defineQuery(
  `*[_type == 'blog'] | order(publishedAt desc)[0...$quantity]{
    ...,
    blogcategories[]->{
      title
    }
  }`
);

/* -------------------------------- */
/* FREE ITEM COUPON */
/* -------------------------------- */

export async function getFreeItemCoupon(code: string) {
  return await client.fetch(
    `*[_type == "freeItemCoupon" && lower(code) == $c && active == true][0]{
      code,
      minimumCartValue,
      maxUsage,
      maxUsagePerUser,
      expiresAt,
      freeProducts[] {
        quantity,
        "productRef": product->{
          _id,
          _type,
          title,
          name,
          slug,
          price,
          images,
          "imageUrl": coalesce(images[0].asset->url, null),
          active
        }
      }
    }`,
    { c: code.toLowerCase() }
  );
}

/* -------------------------------- */
/* SINGLE BLOG */
/* -------------------------------- */

const SINGLE_BLOG_QUERY = defineQuery(
  `*[_type == "blog" && slug.current == $slug][0]{
    ...,
    author->{
      name,
      image
    },
    blogcategories[]->{
      title,
      "slug": slug.current
    }
  }`
);

export async function getSingleBlog(
  slug: string
): Promise<SINGLE_BLOG_QUERYResult> {
  return client.fetch<SINGLE_BLOG_QUERYResult>(SINGLE_BLOG_QUERY, { slug });
}

/* -------------------------------- */
/* BLOG CATEGORIES */
/* -------------------------------- */

const BLOG_CATEGORIES = defineQuery(
  `*[_type == "blog"]{
    blogcategories[]->{
      ...
    }
  }`
);

/* -------------------------------- */
/* OTHER BLOGS */
/* -------------------------------- */

const OTHERS_BLOG_QUERY = defineQuery(
  `*[
    _type == "blog"
    && defined(slug.current)
    && slug.current != $slug
  ] | order(publishedAt desc)[0...$quantity]{
    ...,
    publishedAt,
    title,
    mainImage,
    slug,
    author->{
      name,
      image
    },
    categories[]->{
      title,
      "slug": slug.current
    }
  }`
);

/* -------------------------------- */
/* FETCH FUNCTIONS */
/* -------------------------------- */

export async function getProductBySlug(slug: string) {
  return client.fetch(PRODUCT_BY_SLUG_QUERY, { slug });
}

export async function getRelatedProducts(categoryId: string, slug: string) {
  return client.fetch(RELATED_PRODUCTS_QUERY, {
    categoryId,
    slug,
  });
}

/* NEW FUNCTION */

export async function getOtherProducts(slug: string) {
  return client.fetch(OTHER_PRODUCTS_QUERY, { slug });
}

/* -------------------------------- */
/* EXPORTS */
/* -------------------------------- */

export {
  BRANDS_QUERY,
  LATEST_BLOG_QUERY,
  DEAL_PRODUCTS,
  PRODUCT_BY_SLUG_QUERY,
  RELATED_PRODUCTS_QUERY,
  OTHER_PRODUCTS_QUERY,
  BRAND_QUERY,
  MY_ORDERS_QUERY,
  GET_ALL_BLOG,
  SINGLE_BLOG_QUERY,
  BLOG_CATEGORIES,
  OTHERS_BLOG_QUERY,
};