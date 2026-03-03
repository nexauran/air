import { SINGLE_BLOG_QUERYResult } from "@/sanity.types";
import { defineQuery } from "next-sanity";
import { client } from "../lib/client";

const BRANDS_QUERY = defineQuery(`*[_type=='brand'] | order(name asc) `);

const LATEST_BLOG_QUERY = defineQuery(
  ` *[_type == 'blog' && isLatest == true]|order(name asc){
      ...,
      blogcategories[]->{
      title
    }
    }`
);

const DEAL_PRODUCTS = defineQuery(
  `*[_type == 'product' && status == 'hot'] | order(name asc){
    ...,"categories": categories[]->title
  }`
);

const PRODUCT_BY_SLUG_QUERY = defineQuery(
  `*[_type == "product" && slug.current == $slug] | order(name asc) [0]`
);

const BRAND_QUERY = defineQuery(`*[_type == "product" && slug.current == $slug]{
  "brandName": brand->title
  }`);

const MY_ORDERS_QUERY =
  defineQuery(`*[_type == 'order' && clerkUserId == $userId] | order(orderDate desc){
...,products[]{
  ...,product->
}
}`);
const GET_ALL_BLOG = defineQuery(
  `*[_type == 'blog'] | order(publishedAt desc)[0...$quantity]{
  ...,  
     blogcategories[]->{
    title
}
    }
  `
);

export async function getFreeItemCoupon(code: string) {
  return await client.fetch(
    `*[_type == "freeItemCoupon" && lower(code) == $c && active == true][0]{
      code,
      minimumCartValue,
      maxUsage,
      maxUsagePerUser,
      expiresAt,
      // freeProducts is now objects { product: reference, quantity }
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



const SINGLE_BLOG_QUERY =
  defineQuery(`*[_type == "blog" && slug.current == $slug][0]{
    ...,
    author->{
      name,
      image,
    },
    blogcategories[]->{
      title,
      "slug": slug.current,
    },
  }`);

// data fetching
export async function getSingleBlog(slug: string): Promise<SINGLE_BLOG_QUERYResult> {
  // note fetch generic matches nullable result
  return client.fetch<SINGLE_BLOG_QUERYResult>(SINGLE_BLOG_QUERY, { slug });
}

const BLOG_CATEGORIES = defineQuery(
  `*[_type == "blog"]{
     blogcategories[]->{
    ...
    }
  }`
);

const OTHERS_BLOG_QUERY = defineQuery(`*[
  _type == "blog"
  && defined(slug.current)
  && slug.current != $slug
]|order(publishedAt desc)[0...$quantity]{
...
  publishedAt,
  title,
  mainImage,
  slug,
  author->{
    name,
    image,
  },
  categories[]->{
    title,
    "slug": slug.current,
  }
}`);
export {
  BRANDS_QUERY,
  LATEST_BLOG_QUERY,
  DEAL_PRODUCTS,
  PRODUCT_BY_SLUG_QUERY,
  BRAND_QUERY,
  MY_ORDERS_QUERY,
  GET_ALL_BLOG,
  SINGLE_BLOG_QUERY,
  BLOG_CATEGORIES,
  OTHERS_BLOG_QUERY,
  
};