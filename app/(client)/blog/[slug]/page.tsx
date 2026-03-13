/** @format */

import Container from "@/components/Container";
import Title from "@/components/Title";
import {
  SINGLE_BLOG_QUERYResult,
  OTHERS_BLOG_QUERYResult,
} from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import {
  getBlogCategories,
  getOthersBlog,
  getSingleBlog,
} from "@/sanity/queries";
import dayjs from "dayjs";
import { Calendar, ChevronLeftIcon, Pencil } from "lucide-react";
import { PortableText } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

type CategoryType = {
  blogcategories: {
    title: string | null;
  }[];
};

const SingleBlogPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  const blog: SINGLE_BLOG_QUERYResult | null = await getSingleBlog(slug);

  if (!blog) return notFound();

  return (
    <div className="py-10">
      <Container className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Blog Content */}
        <div className="md:col-span-3">
          {blog?.mainImage && (
            <Image
              src={urlFor(blog.mainImage).width(2000).height(1200).url()}
              alt={blog?.title ?? "Blog Image"}
              width={1200}
              height={700}
              className="w-full max-h-[500px] object-cover rounded-lg"
              unoptimized
            />
          )}

          <div>
            {/* Blog Meta */}
            <div className="text-xs flex items-center gap-5 my-7">
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
              </div>

              <p className="flex items-center gap-1 text-lightColor">
                <Pencil size={15} /> {blog?.author?.name}
              </p>

              <p className="flex items-center gap-1 text-lightColor">
                <Calendar size={15} />
                {dayjs(blog.publishedAt).format("MMMM D, YYYY")}
              </p>
            </div>

            {/* Blog Title */}
            <h2 className="text-2xl font-bold my-5">{blog?.title}</h2>

            {/* Blog Body */}
            <div className="text-lightColor">
              {blog.body && (
                <PortableText
                  value={blog.body}
                  components={{
                    block: {
                      normal: ({ children }) => (
                        <p className="my-5 text-base/8">{children}</p>
                      ),
                      h2: ({ children }) => (
                        <h2 className="my-5 text-2xl font-semibold text-gray-900">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="my-5 text-xl font-semibold text-gray-900">
                          {children}
                        </h3>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="my-5 border-l-2 border-gray-300 pl-6 text-gray-900">
                          {children}
                        </blockquote>
                      ),
                    },

                    types: {
                      image: ({ value }) => (
                        <Image
                          src={urlFor(value).width(2000).url()}
                          alt={value.alt || ""}
                          width={1400}
                          height={900}
                          className="w-full rounded-xl my-6"
                          unoptimized
                        />
                      ),
                    },

                    list: {
                      bullet: ({ children }) => (
                        <ul className="list-disc pl-5">{children}</ul>
                      ),
                      number: ({ children }) => (
                        <ol className="list-decimal pl-5">{children}</ol>
                      ),
                    },

                    listItem: {
                      bullet: ({ children }) => (
                        <li className="my-2">{children}</li>
                      ),
                      number: ({ children }) => (
                        <li className="my-2">{children}</li>
                      ),
                    },

                    marks: {
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900">
                          {children}
                        </strong>
                      ),

                      link: ({ value, children }) => (
                        <Link
                          href={value?.href}
                          className="underline text-shop_dark_green"
                        >
                          {children}
                        </Link>
                      ),
                    },
                  }}
                />
              )}

              {/* Back Button */}
              <div className="mt-10">
                <Link href="/blog" className="flex items-center gap-1">
                  <ChevronLeftIcon className="size-5" />
                  <span className="text-sm font-semibold">Back to blog</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <BlogLeft slug={slug} />
      </Container>
    </div>
  );
};

const BlogLeft = async ({ slug }: { slug: string }) => {
  const categories = await getBlogCategories();

  const blogs: OTHERS_BLOG_QUERYResult = await getOthersBlog(slug, 5);

  return (
    <div>
      {/* Categories */}
      <div className="border border-lightColor p-5 rounded-md">
        <Title className="text-base">Blog Categories</Title>

        <div className="space-y-2 mt-2">
          {categories?.map((item: CategoryType, index: number) => (
            <div
              key={index}
              className="text-lightColor flex items-center justify-between text-sm font-medium"
            >
              <p>{item.blogcategories?.[0]?.title}</p>
              <p className="text-darkColor font-semibold">(1)</p>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Blogs */}
      <div className="border border-lightColor p-5 rounded-md mt-10">
        <Title className="text-base">Latest Blogs</Title>

        <div className="space-y-4 mt-4">
          {blogs?.map(
            (blog: OTHERS_BLOG_QUERYResult[number], index: number) => (
              <Link
                href={`/blog/${blog?.slug?.current}`}
                key={index}
                className="flex items-center gap-2 group"
              >
                {blog?.mainImage && (
                  <Image
                    src={urlFor(blog.mainImage).width(400).url()}
                    alt="blogImage"
                    width={100}
                    height={100}
                    className="w-16 h-16 rounded-full object-cover border border-shop_dark_green/10 group-hover:border-shop_dark_green hoverEffect"
                    unoptimized
                  />
                )}

                <p className="line-clamp-2 text-sm text-lightColor group-hover:text-shop_dark_green hoverEffect">
                  {blog?.title}
                </p>
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleBlogPage;
