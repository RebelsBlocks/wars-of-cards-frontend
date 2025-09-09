import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Social } from '@builddao/near-social-js';
import ReactMarkdown from 'react-markdown';
import { fetchTimeByBlockHeight } from '@/utils/timeFormat';
import HolographicEffect from './HolographicEffect';

const ACCOUNT_ID = 'warsofcards.near';
const BATCH_SIZE = '10';
const VISIBLE_POSTS = 1; // Number of posts visible at once - only 1 post at a time
const SCROLL_INTERVAL = 60000; // Time between auto-scrolls in milliseconds (60 seconds = 1 minute)

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
    <HolographicEffect type="glow" className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(237,201,81)]">
      <div></div>
    </HolographicEffect>
    <HolographicEffect type="text" intensity="subtle" className="mt-2 text-sm text-center px-4">Loading posts...</HolographicEffect>
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Auto-scroll effect with fade animation
  useEffect(() => {
    if (posts.length <= 1) return;

    const interval = setInterval(() => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          return nextIndex >= posts.length ? 0 : nextIndex;
        });
        setIsTransitioning(false);
      }, 150); // Half of transition duration
    }, SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [posts.length, isTransitioning]);



  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchPosts();
    }
  };

  const openPostModal = (post: Post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const closePostModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
  };

  if (loading && posts.length === 0) return <LoadingSpinner />;
  
  if (error) return (
    <div className="mx-auto max-w-4xl md:max-w-5xl px-3 md:px-4 py-6">
      <HolographicEffect type="border" className="card">
        <div className="text-red-400 text-center">
          <HolographicEffect type="text" intensity="strong" className="font-semibold">NEAR Social is currently down.</HolographicEffect>
          <HolographicEffect type="text" intensity="subtle" className="text-sm mt-2 text-red-300">{error}</HolographicEffect>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-[rgb(237,201,81)] text-black font-semibold rounded-lg hover:bg-[rgba(237,201,81,0.9)] transition-all duration-200 shadow-[0_0_15px_rgba(237,201,81,0.3)] hover:shadow-[0_0_25px_rgba(237,201,81,0.5)] transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </HolographicEffect>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl px-3 md:px-4 lg:px-6 py-6">
          {posts.length === 0 ? (
            <HolographicEffect type="border" className="card">
              <div className="text-center py-8">
                <HolographicEffect type="text" intensity="subtle">No community posts yet.</HolographicEffect>
              </div>
            </HolographicEffect>
          ) : (
          <div className="relative">


            {/* Single post container */}
            <div 
              ref={tickerRef}
              className="flex justify-center"
            >
              {posts.length > 0 && (
                <HolographicEffect type="border" className={`card overflow-hidden w-full ${isTransitioning ? 'post-fade-out' : 'post-fade-in'} cursor-pointer hover:bg-[rgba(237,201,81,0.05)] transition-colors duration-200`}>
                  <article 
                    key={posts[currentIndex]?.id} 
                    className="w-full"
                    onClick={() => openPostModal(posts[currentIndex])}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openPostModal(posts[currentIndex]);
                      }
                    }}
                  >
                {/* Enhanced Post Header with Better Layout */}
                <header className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden">
                      <img 
                          src={`https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/${posts[currentIndex].accountId}`}
                          alt={`${posts[currentIndex].accountId} avatar`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <HolographicEffect type="text" intensity="subtle" className="font-semibold text-sm md:text-base truncate">
                        {posts[currentIndex].accountId}
                    </HolographicEffect>
                    <HolographicEffect type="text" intensity="subtle" className="text-xs block mt-1">
                        {posts[currentIndex].timestamp}
                    </HolographicEffect>
                  </div>
                </header>
                
                {/* News Ticker Content Layout */}
                <div className="text-[rgba(237,201,81,0.95)] relative">
                  {/* Image Preview - Top Right Corner */}
                  {posts[currentIndex].imageIPFSHash && (
                    <div className="absolute -top-16 -right-1 z-0">
                      <HolographicEffect type="glow" className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden">
                        <img 
                          src={`https://ipfs.near.social/ipfs/${posts[currentIndex].imageIPFSHash}`}
                          alt="Post preview"
                          className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-200"
                          loading="lazy"
                        />
                      </HolographicEffect>
                    </div>
                  )}
                  
                  {/* Text Content */}
                  <div className={`prose prose-sm md:prose-base max-w-none break-words overflow-wrap-anywhere ${posts[currentIndex].imageIPFSHash ? 'pr-24 md:pr-28' : ''}`}>
                    <div className="markdown-content">
                      <div className="break-words overflow-wrap-anywhere hyphens-auto">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <HolographicEffect type="text" intensity="subtle" className="break-words overflow-wrap-anywhere hyphens-auto text-sm md:text-base leading-relaxed">
                                {children}
                              </HolographicEffect>
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
                          {posts[currentIndex].content.length > 100 
                            ? `${posts[currentIndex].content.substring(0, 100)}...`
                            : posts[currentIndex].content
                          }
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
                  

                  </article>
                </HolographicEffect>
              )}
            </div>


          </div>
        )}
        
        {/* Loading indicator during refresh */}
        {isRefreshing && posts.length > 0 && (
          <div className="text-center mt-6">
            <HolographicEffect type="glow" className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(237,201,81)] bg-opacity-20 rounded-lg">
              <HolographicEffect type="glow" className="animate-spin rounded-full h-4 w-4 border-b-2 border-[rgb(237,201,81)]">
                <div></div>
              </HolographicEffect>
              <HolographicEffect type="text" intensity="subtle" className="text-sm">Refreshing posts...</HolographicEffect>
            </HolographicEffect>
          </div>
        )}
      </div>

      {/* Post Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-[rgba(0,0,0,0.95)] rounded-lg w-full max-w-2xl mx-4 backdrop-blur flex flex-col max-h-[90vh]">
            {/* Modal Header - Always Visible */}
            <div className="flex items-center p-4 sm:p-6 pb-3 border-b border-[rgba(237,201,81,0.25)] flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <HolographicEffect type="glow" className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={`https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/${selectedPost.accountId}`}
                    alt={selectedPost.accountId}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPost.accountId)}&background=edc951&color=000&size=48`;
                    }}
                  />
                </HolographicEffect>
                <div className="min-w-0 flex-1">
                  <HolographicEffect type="text" intensity="normal" className="font-semibold text-lg truncate">
                    {selectedPost.accountId}
                  </HolographicEffect>
                  <HolographicEffect type="text" intensity="normal" className="text-sm block mt-1">
                    {selectedPost.timestamp}
                  </HolographicEffect>
                </div>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="prose prose-sm md:prose-base max-w-none break-words overflow-wrap-anywhere">
                <div className="markdown-content">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-3 break-words overflow-wrap-anywhere hyphens-auto text-[rgb(237,201,81)]">
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
                        <code className="bg-gray-800 px-2 py-1 rounded text-sm break-all overflow-x-auto inline-block max-w-full text-[rgb(237,201,81)]">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm text-[rgb(237,201,81)]">
                          {children}
                        </pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[rgb(237,201,81)] pl-4 italic my-4 break-words text-[rgb(237,201,81)]">
                          {children}
                        </blockquote>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-xl font-bold mb-3 break-words text-[rgb(237,201,81)]">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-lg font-bold mb-2 break-words text-[rgb(237,201,81)]">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-base font-bold mb-2 break-words text-[rgb(237,201,81)]">
                          {children}
                        </h3>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-[rgb(237,201,81)]">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-[rgb(237,201,81)]">
                          {children}
                        </em>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-3 break-words text-[rgb(237,201,81)]">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-3 break-words text-[rgb(237,201,81)]">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="break-words text-[rgb(237,201,81)]">
                          {children}
                        </li>
                      )
                    }}
                  >
                    {selectedPost.content}
                  </ReactMarkdown>
                </div>
              </div>
              
              {/* Post Image in Modal */}
              {selectedPost.imageIPFSHash && (
                <div className="mt-6">
                  <IPFSImage hash={selectedPost.imageIPFSHash} />
                </div>
              )}
            </div>

            {/* Modal Footer - Always Visible */}
            <div className="p-4 sm:p-6 pt-3 border-t border-[rgba(237,201,81,0.25)] flex justify-end flex-shrink-0">
              <button
                onClick={closePostModal}
                className="px-6 py-2 bg-[rgb(237,201,81)] text-black font-semibold rounded-lg hover:bg-[rgba(237,201,81,0.9)] transition-colors shadow-[0_0_20px_rgba(237,201,81,0.3)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
