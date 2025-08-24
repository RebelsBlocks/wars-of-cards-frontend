import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import { Social } from '@builddao/near-social-js';
import ReactMarkdown from 'react-markdown';
import { fetchTimeByBlockHeight } from '@/utils/timeFormat';

const ACCOUNT_ID = 'warsofcards.near';
const BATCH_SIZE = '10';

interface Post {
  id: string;
  accountId: string;
  content: string;
  blockHeight: number;
  imageIPFSHash: string | null;
  timestamp: string;
}

interface IndexItem {
  blockHeight: string;
  action: string;
  key: string;
  accountId: string;
}

interface SocialData {
  [key: string]: {
    post?: {
      main: string;
    };
  };
}

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(237,201,81)]"></div>
    <p className="mt-2 text-[rgba(237,201,81,0.8)]">Loading posts...</p>
  </div>
);

const IPFSImage = ({ hash }: { hash: string }) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return <div className="text-[rgba(237,201,81,0.6)] text-sm">Failed to load image</div>;
  }

  return (
    <div className="mt-3">
      <img 
        src={`https://ipfs.near.social/ipfs/${hash}`}
        alt="Post image"
        className="max-w-full h-auto rounded-lg"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
};

// Create socialClient outside component to avoid recreating it
const socialClient = new Social({
  network: 'mainnet',
  nodeUrl: 'https://free.rpc.fastnear.com'
} as any);

const MailPage: NextPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log('Fetching posts...');
      
      const indexResult = await socialClient.index({
        action: 'post',
        key: 'main',
        limit: BATCH_SIZE,
        accountId: ACCOUNT_ID,
        order: 'desc'
      });

      console.log('Posts index result:', indexResult);
      if (!indexResult?.length) {
        console.log('No posts found in index');
        setLoading(false);
        return;
      }

      const postsData = await Promise.all(
        (indexResult as unknown as IndexItem[]).map(async (item) => {
          try {
            const blockHeightStr = item.blockHeight;
            console.log('Fetching post data for block height:', blockHeightStr);
            
            const result = await socialClient.get({
              keys: [`${ACCOUNT_ID}/post/main`],
              blockHeight: blockHeightStr as unknown as bigint
            }) as SocialData;

            console.log('Post data result:', JSON.stringify(result));
            const postData = result?.[ACCOUNT_ID];
            if (!postData || typeof postData.post?.main !== 'string') {
              console.log('No post content found for block height:', blockHeightStr);
              return null;
            }

            const postContent = postData.post.main;
            const parsedContent = JSON.parse(postContent);
            console.log('Parsed post content:', parsedContent);
            const time = await fetchTimeByBlockHeight(parseInt(blockHeightStr));

            return {
              id: `${blockHeightStr}-${Date.now()}`,
              accountId: ACCOUNT_ID,
              content: parsedContent.text || '',
              blockHeight: parseInt(blockHeightStr),
              imageIPFSHash: parsedContent.image?.ipfs_cid || null,
              timestamp: time,
            };
          } catch (e) {
            console.error('Error processing post:', e);
            return null;
          }
        })
      );

      const filteredPosts = postsData.filter(Boolean) as Post[];
      console.log('Final posts:', filteredPosts);
      
      if (filteredPosts.length > 0) {
        setPosts(filteredPosts.sort((a, b) => b.blockHeight - a.blockHeight));
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching posts:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []); // No dependencies - socialClient is now stable

  useEffect(() => {
    fetchPosts();
  }, []); // Empty dependency array - run only once on mount

  if (loading && posts.length === 0) return <LoadingSpinner />;
  if (error) return <div className="text-red-400">Error: {error}</div>;

  return (
    <div className="mx-auto max-w-4xl md:max-w-5xl px-3 md:px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-[rgb(237,201,81)]">Mail</h2>
        <button 
          className="bg-[rgba(237,201,81,0.1)] hover:bg-[rgba(237,201,81,0.2)] text-[rgb(237,201,81)] px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => fetchPosts()}
          disabled={isRefreshing}
        >
          {isRefreshing ? '♠️ Loading...' : '♠️ Refresh'}
        </button>
      </div>
      
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="card">
            <p className="text-[rgba(237,201,81,0.8)]">No posts yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src={`https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/${post.accountId}`}
                  alt={post.accountId}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="font-medium text-[rgb(237,201,81)]">{post.accountId}</div>
                  <div className="text-sm text-[rgba(237,201,81,0.6)]">{post.timestamp}</div>
                </div>
              </div>
              
              <div className="text-[rgba(237,201,81,0.9)]">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>
              
              {post.imageIPFSHash && (
                <IPFSImage hash={post.imageIPFSHash} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MailPage;

