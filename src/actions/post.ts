'use server';

import { PostSchema } from '@/forms/create-form';
import { insertNewLine } from '@/lib/utils';
import { Comment } from '@/types/Comment';
import { Post } from '@/types/Post';
import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export async function getPosts(
  url: string,
  options: { page?: number; liked?: string; tag?: string; author?: string }
) {
  const limit = 5;
  const token = cookies().get('AUTH_TOKEN')?.value;

  const response = await fetch(
    `${url}?limit=${limit}&page=${options.page || ''}&favorited=${options.liked || ''}&author=${options.author || ''}${options.tag ? `&tag=${options.tag}` : ''}`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      next: { tags: ['posts'] }
    }
  );
  if (!response.ok) {
    throw new Error('Could not get posts.');
  }

  const data: { articles: Post[]; articlesCount: number; page: number } = await response.json();

  return {
    posts: data.articles,
    postsCount: data.articlesCount,
    page: data.page,
    nextPage: data.page * limit >= data.articlesCount ? null : data.page + 1
  };
}

export async function getSinglePost(slug: string) {
  const url = `${process.env.BACKEND_URL}/api/articles/${slug}`;
  const token = cookies().get('AUTH_TOKEN')?.value;

  const [postResponse, commentsResponse] = await Promise.all([
    fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      next: { tags: [slug] }
    }),
    fetch(`${url}/comments`, { next: { tags: [`${slug}-comments`] } })
  ]);

  if (!postResponse.ok) {
    return null;
  }

  const [postData, commentsData] = await Promise.all([
    postResponse.json(),
    commentsResponse.json()
  ]);

  return { post: postData.article as Post, comments: commentsData.comments as Comment[] };
}

export async function createPost(createPostFormData: z.infer<typeof PostSchema>) {
  const token = cookies().get('AUTH_TOKEN')?.value;

  if (!token) {
    throw new Error('You need login to create post');
  }

  const postBody = processPostFormData(createPostFormData);

  const response = await fetch(`${process.env.BACKEND_URL}/api/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      article: postBody
    })
  });

  if (!response.ok) {
    throw new Error('Could not create post');
  }

  const slug: string | null | undefined = (await response.json())?.article?.slug;
  if (!!slug) {
    revalidateTag('posts');
    redirect(`/post/${slug}`);
  }
}

export async function updatePost({
  updatePostFormData,
  slug
}: {
  updatePostFormData: z.infer<typeof PostSchema>;
  slug: string;
}) {
  const token = cookies().get('AUTH_TOKEN')?.value;

  if (!token) {
    throw new Error('You need login to update post');
  }

  const putBody = processPostFormData(updatePostFormData);

  const response = await fetch(`${process.env.BACKEND_URL}/api/articles/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      article: putBody
    })
  });

  if (!response.ok) {
    throw new Error('Could not update post');
  }

  revalidateTag('posts');
}

export async function deletePost(slug: string) {
  const token = cookies().get('AUTH_TOKEN')?.value;

  if (!token) {
    throw new Error('You need login to delete post');
  }

  const response = await fetch(`${process.env.BACKEND_URL}/api/articles/${slug}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Could not delete post');
  }

  revalidateTag('posts');
}

export async function likePost(slug: string) {
  const token = cookies().get('AUTH_TOKEN')?.value;

  if (!token) {
    throw new Error('You need login to like this post');
  }

  const response = await fetch(`${process.env.BACKEND_URL}/api/articles/${slug}/favorite`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Could not like this post');
  }

  revalidateTag('posts');
  revalidateTag('tags');
  revalidateTag(slug);
}

export async function unlikePost(slug: string) {
  const token = cookies().get('AUTH_TOKEN')?.value;

  if (!token) {
    throw new Error('You need login to unlike this post');
  }

  const response = await fetch(`${process.env.BACKEND_URL}/api/articles/${slug}/favorite`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Could not unlike this post');
  }

  revalidate('posts');
  revalidateTag(slug);
}

export async function commentPost({ slug, comment }: { slug: string; comment: string }) {
  const token = cookies().get('AUTH_TOKEN')?.value;

  if (!token) {
    throw new Error('You need login to comment this post');
  }

  const response = await fetch(`${process.env.BACKEND_URL}/api/articles/${slug}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      comment: {
        body: comment
      }
    })
  });

  if (!response.ok) {
    throw new Error('Could not comment this post');
  }

  revalidateTag(`${slug}-comments`);
}

export async function deleteComment({ slug, commentId }: { slug: string; commentId: string }) {
  const token = cookies().get('AUTH_TOKEN')?.value;

  if (!token) {
    throw new Error('You need login to detete this comment');
  }

  const response = await fetch(
    `${process.env.BACKEND_URL}/api/articles/${slug}/comments/${commentId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Could not delete this comment');
  }

  revalidateTag(`${slug}-comments`);
}

export async function revalidate(path: string) {
  revalidatePath(path, 'layout');
}

function processPostFormData(formData: z.infer<typeof PostSchema>): {
  title: string;
  description?: string;
  body: string;
  tagList?: string[];
} {
  const { title, description, body, tagList } = formData;

  const requestBody: { title: string; description?: string; body: string; tagList?: string[] } = {
    title,
    body: insertNewLine(body)
  };
  if (description.length > 0) requestBody.description = description;
  const trimmedTagList = tagList
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
  if (trimmedTagList.length > 0) requestBody.tagList = trimmedTagList;

  return requestBody;
}
