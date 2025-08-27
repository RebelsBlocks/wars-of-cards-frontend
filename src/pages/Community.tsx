import React from 'react';
import type { NextPage } from 'next';
import Community from '@/components/Community';
import Chat from '@/components/Chat';

const CommunityPage: NextPage = () => {
  return (
    <div className="w-full min-h-screen">
      {/* Community Posts Section */}
      <div>
        <Community />
      </div>

      {/* Chat Section */}
      <div className="mb-4">
        <Chat />
      </div>
    </div>
  );
};

export default CommunityPage;
