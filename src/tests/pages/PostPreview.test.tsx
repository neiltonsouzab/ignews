import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/client';
import { useRouter } from 'next/router';
import { mocked } from 'ts-jest/utils';

import PostPreview, { getStaticProps, getStaticPaths } from '../../pages/posts/preview/[slug]';
import { getPrismicClient } from '../../services/prismic';

const post =  { 
  slug: 'my-new-post', 
  title: 'My New Post', 
  content: '<p>Post excerpt</p>', 
  updatedAt: '10 de abril' 
}


jest.mock('next-auth/client');
jest.mock('next/router');
jest.mock('../../services/prismic');

describe('Post preview page', () => {
  it('render correctly', () => {
    const useSessionMock = mocked(useSession);

    useSessionMock.mockReturnValueOnce([null, false]);

    render(<PostPreview post={post} />)
    
    expect(screen.getByText('My New Post')).toBeInTheDocument();
    expect(screen.getByText('Post excerpt')).toBeInTheDocument();
    expect(screen.getByText('Wanna continue reading?')).toBeInTheDocument();
  });

  
  it('redirects user to full post when user is subscribed', async () => {
    const useSessionMock = mocked(useSession);
    const useRouterMock = mocked(useRouter);

    const pushMock = jest.fn();

    useSessionMock.mockReturnValueOnce([
      {
        activeSubscription: 'fake-active-subscription',
      }
      , 
      false]
    );

    useRouterMock.mockReturnValueOnce({
      push: pushMock,
    } as any)
    
    render(<PostPreview post={post} />)
    
    expect(pushMock).toHaveBeenCalledWith('/posts/my-new-post');
  });
    
  
  it('loads initial data', async () => {
    const getPrismicClientMock = mocked(getPrismicClient);
    
    getPrismicClientMock.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValueOnce({
        data: {
          title: [
            { type: 'heading', text: 'My New Post'},
          ],
          content: [
            { type: 'paragraph', text: 'Post excerpt'},
          ],
        },
        last_publication_date: '04-01-2021',
      }),
    } as any);

    const response = await getStaticProps({ params: { slug: 'my-new-post' } });

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          post: {
            slug: 'my-new-post',
            title: 'My New Post',
            content: '<p>Post excerpt</p>',
            updatedAt: '01 de abril de 2021',
          }
        }
      })
    )
  });
})