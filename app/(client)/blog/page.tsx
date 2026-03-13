/** @format */

import Container from "@/components/Container";
import Title from "@/components/Title";
import { urlFor } from "@/sanity/lib/image";
import { getAllBlogs } from "@/sanity/queries";
import { GET_ALL_BLOGResult } from "@/sanity.types";

import dayjs from "dayjs";
import { Calendar } from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import React from "react";

const BlogPage = async () => {
  const blogs: GET_ALL_BLOGResult = await getAllBlogs(6);

  return (
    <div>
      <Container>
        <Title>Blog Page</Title>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 md:mt-10 pb-10">
          {blogs?.map((blog: GET_ALL_BLOGResult[number]) => (
            <div
              key={blog?._id}
              className="rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition group"
            >
              {/* BLOG IMAGE */}

              {blog?.mainImage && (
                <Link href={`/blog/${blog?.slug?.current}`}>
                  <img
                    src={urlFor(blog.mainImage).url()}
                    alt={blog?.title || "Blog image"}
                    width={500}
                    height={350}
                    className="w-full h-60 object-cover group-hover:scale-105 transition"
                    
                  />
                  
                  
                </Link>
              )}

              {/* BLOG CONTENT */}

              <div className="bg-gray-100 p-5">
                <div className="text-xs flex items-center gap-5">
                  {/* CATEGORY */}

                  <div className="flex items-center relative group cursor-pointer">
                    {blog?.blogcategories?.map(
                      (item: { title: string | null }, index: number) => (
                        <p
                          key={index}
                          className="font-semibold text-shop_dark_green tracking-wider"
                        >
                          {item?.title}
                        </p>
                      ),
                    )}

                    <span className="absolute left-0 -bottom-1.5 bg-lightColor/30 w-full h-0.5 group-hover:bg-shop_dark_green transition" />
                  </div>

                  {/* DATE */}

                  <p className="flex items-center gap-1 text-lightColor relative group hover:text-shop_dark_green transition">
                    <Calendar size={15} />

                    {dayjs(blog?.publishedAt).format("MMMM D, YYYY")}

                    <span className="absolute left-0 -bottom-1.5 bg-lightColor/30 w-full h-0.5 group-hover:bg-shop_dark_green transition" />
                  </p>
                </div>

                {/* TITLE */}

                <Link
                  href={`/blog/${blog?.slug?.current}`}
                  className="text-base font-bold tracking-wide mt-4 line-clamp-2 hover:text-shop_dark_green transition block"
                >
                  {blog?.title}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default BlogPage;
