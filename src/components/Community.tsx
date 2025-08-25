import React, { useState, useEffect, useCallback } from 'react';
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
    <p className="mt-2 text-[rgba(237,201,81,0.8)] text-sm text-center px-4">Loading community posts...</p>
  </div>
);

const IPFSImage = ({ hash }: { hash: string }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (imageError) {
    return (
      <div className="mt-3 p-4 bg-gray-800 rounded-lg text-center">
        <div className="text-[rgba(237,201,81,0.6)] text-sm">Failed to load image</div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {imageLoading && (
        <div className="animate-pulse bg-gray-700 h-48 rounded-lg flex items-center justify-center">
          <span className="text-[rgba(237,201,81,0.6)] text-sm">Loading image...</span>
        </div>
      )}
      <img 
        src={`https://ipfs.near.social/ipfs/${hash}`}
        alt="Post image"
        className={`w-full max-w-full h-auto rounded-lg transition-opacity duration-300 ${
          imageLoading ? 'opacity-0 absolute' : 'opacity-100'
        }`}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        onLoad={() => setImageLoading(false)}
        loading="lazy"
        style={{ maxHeight: '500px', objectFit: 'contain' }}
      />
    </div>
  );
};

// Create socialClient outside component to avoid recreating it
const socialClient = new Social({
  network: 'mainnet',
  nodeUrl: 'https://free.rpc.fastnear.com'
} as any);

const Community: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log('Fetching community posts...');
      
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
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchPosts();
    }
  };

  if (loading && posts.length === 0) return <LoadingSpinner />;
  
  if (error) return (
    <div className="mx-auto max-w-4xl md:max-w-5xl px-3 md:px-4 py-6">
      <div className="card">
        <div className="text-red-400 text-center">
          <p className="font-semibold">Error loading posts</p>
          <p className="text-sm mt-2 text-red-300">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen">
      <div className="mx-auto max-w-4xl md:max-w-5xl px-3 md:px-4 lg:px-6 py-6">
        <div className="space-y-4 md:space-y-6">
          {posts.length === 0 ? (
            <div className="card">
              <div className="text-center py-8">
                <p className="text-[rgba(237,201,81,0.8)]">No community posts yet.</p>
                <button 
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-[rgb(237,201,81)] bg-opacity-20 hover:bg-opacity-30 text-[rgb(237,201,81)] rounded-lg transition-colors"
                >
                  Check Again
                </button>
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="card overflow-hidden">
                {/* Post Header */}
                <header className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0">
                    <img 
                      src={`https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/${post.accountId}`}
                      alt={`${post.accountId} avatar`}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[rgb(237,201,81)] truncate">
                      {post.accountId}
                    </div>
                    <time className="text-xs md:text-sm text-[rgba(237,201,81,0.6)]">
                      {post.timestamp}
                    </time>
                  </div>
                </header>
                
                {/* Post Content */}
                <div className="text-[rgba(237,201,81,0.9)] prose prose-sm md:prose-base max-w-none break-words overflow-wrap-anywhere">
                  <div className="markdown-content">
                    <ReactMarkdown
                      components={{
                        // Zapewnienie responsywności dla różnych elementów markdown
                        p: ({ children }) => (
                          <p className="mb-3 break-words overflow-wrap-anywhere hyphens-auto">
                            {children}
                          </p>
                        ),
                        a: ({ href, children }) => (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[rgb(237,201,81)] hover:text-[rgba(237,201,81,0.8)] underline break-all"
                          >
                            {children}
                          </a>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-800 px-2 py-1 rounded text-sm break-all overflow-x-auto inline-block max-w-full">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-[rgb(237,201,81)] pl-4 italic my-4 break-words">
                            {children}
                          </blockquote>
                        )
                      }}
                    >
                      {post.content}
                    </ReactMarkdown>
                  </div>
                </div>
                
                {/* Post Image */}
                {post.imageIPFSHash && (
                  <div className="mt-4">
                    <IPFSImage hash={post.imageIPFSHash} />
                  </div>
                )}
              </article>
            ))
          )}
        </div>
        
        {/* Loading indicator during refresh */}
        {isRefreshing && posts.length > 0 && (
          <div className="text-center mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(237,201,81)] bg-opacity-20 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[rgb(237,201,81)]"></div>
              <span className="text-[rgba(237,201,81,0.8)] text-sm">Refreshing posts...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
