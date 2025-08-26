import React from 'react';
import type { NextPage } from 'next';
import Community from '@/components/Community';
import Chat from '@/components/Chat';

const CommunityPage: NextPage = () => {
  return (
    <div className="w-full min-h-screen">
      {/* Chat Section */}
      <div className="mb-4">
        <Chat />
      </div>

      {/* Community Posts Section */}
      <div>
        <Community />
      </div>
    </div>
  );
};

export default CommunityPage;
