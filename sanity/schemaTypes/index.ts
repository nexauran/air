/** @format */

import { type SchemaTypeDefinition } from "sanity";

import { blockContentType } from "./blockContentType";
import { categoryType } from "./categoryType";
import { guaranteeType } from "./guarantee";
import { authorType } from "./authorType";
import { productType } from "./productType";
import { orderType } from "./orderType";
import { brandType } from "./brandTypes";
import { blogCategoryType } from "./blogCategoryType";
import { blogType } from "./blogType";
import { addressType } from "./addressType";
import { postType } from "./postType";
import coupon from "./coupon";
import freeItemCoupon from "./freeItemCoupon";
import freeGift from "./freeGift";
import poster from "./poster";
import posterOrder from "./posterOrder";
import posterCategory from "./posterCategory";




export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    categoryType,
    blockContentType,
    productType,
    orderType,
    brandType,
    blogCategoryType,
    blogType,
    authorType,
    addressType,
    postType,
    coupon,
    freeItemCoupon,
    freeGift,
    guaranteeType,
    posterOrder,
    poster,
    posterCategory,
    
  ],
};
