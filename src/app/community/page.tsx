'use client';

import { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Trophy,
  TrendingUp,
  Hash,
  Search,
  Flame,
  Star,
  Plus,
} from 'lucide-react';
import { communityPosts } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TabType = 'latest' | 'hot' | 'challenge';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = communityPosts.filter((post) => {
    if (activeTab === 'challenge') return post.isChallenge;
    if (searchQuery) {
      return (
        post.title.includes(searchQuery) ||
        post.content.includes(searchQuery) ||
        post.tags.some((t) => t.includes(searchQuery))
      );
    }
    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (activeTab === 'hot') return b.likes - a.likes;
    return 0;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">学习社区</h1>
          <p className="text-sm text-muted-foreground mt-1">
            与全球英语学习者交流心得，共同进步
          </p>
        </div>
        <Button className="bg-sky-500 hover:bg-sky-600 text-white">
          <Plus className="w-4 h-4 mr-1" />
          发布动态
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-border">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="搜索帖子、话题或用户..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-border p-1">
        <TabButton
          active={activeTab === 'latest'}
          onClick={() => setActiveTab('latest')}
          icon={<TrendingUp className="w-4 h-4" />}
          label="最新"
        />
        <TabButton
          active={activeTab === 'hot'}
          onClick={() => setActiveTab('hot')}
          icon={<Flame className="w-4 h-4" />}
          label="热门"
        />
        <TabButton
          active={activeTab === 'challenge'}
          onClick={() => setActiveTab('challenge')}
          icon={<Trophy className="w-4 h-4" />}
          label="挑战活动"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts List */}
        <div className="lg:col-span-2 space-y-4">
          {sortedPosts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-border">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-muted-foreground text-sm">暂无相关帖子</p>
            </div>
          ) : (
            sortedPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Hot Topics */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-sky-500" />
              热门话题
            </h3>
            <div className="space-y-2">
              {[
                { tag: '每日打卡', count: 1280 },
                { tag: '词汇挑战', count: 856 },
                { tag: '口语练习', count: 642 },
                { tag: '雅思备考', count: 531 },
                { tag: '英文原著', count: 423 },
              ].map((topic) => (
                <button
                  key={topic.tag}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-sm text-foreground">#{topic.tag}</span>
                  <span className="text-xs text-muted-foreground">{topic.count} 讨论</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Challenge */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-foreground text-sm">进行中的挑战</h3>
            </div>
            <h4 className="font-semibold text-foreground text-sm">7天词汇打卡</h4>
            <p className="text-xs text-muted-foreground mt-1">
              每天学习20个新单词并造句，坚持7天获得专属徽章
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">已有 256 人参加</span>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                立即参加
              </Button>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              学习排行榜
            </h3>
            <div className="space-y-2">
              {[
                { rank: 1, name: 'EnglishPro', avatar: '🥇', time: '128小时' },
                { rank: 2, name: 'Learner2024', avatar: '🥈', time: '115小时' },
                { rank: 3, name: 'WordMaster', avatar: '🥉', time: '102小时' },
                { rank: 4, name: '你', avatar: '🧑‍🎓', time: '44小时' },
              ].map((user) => (
                <div
                  key={user.rank}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg',
                    user.name === '你' ? 'bg-sky-50' : ''
                  )}
                >
                  <span className="text-lg">{user.avatar}</span>
                  <span className="text-sm font-medium text-foreground flex-1">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors',
        active ? 'bg-sky-50 text-sky-700' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function PostCard({ post }: { post: (typeof communityPosts)[0] }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
      {/* Author */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 flex items-center justify-center text-lg">
          {post.avatar}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{post.author}</p>
          <p className="text-[11px] text-muted-foreground">{post.time}</p>
        </div>
        {post.isChallenge && (
          <Badge className="bg-orange-50 text-orange-600 border-orange-200" variant="outline">
            <Trophy className="w-3 h-3 mr-1" />
            挑战
          </Badge>
        )}
      </div>

      {/* Content */}
      <h3 className="font-bold text-foreground text-sm mb-2">{post.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-md bg-slate-50 text-[11px] text-muted-foreground"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <button
          onClick={() => setLiked(!liked)}
          className={cn(
            'flex items-center gap-1.5 text-xs transition-colors',
            liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
          )}
        >
          <Heart className={cn('w-4 h-4', liked && 'fill-red-500')} />
          <span>{liked ? post.likes + 1 : post.likes}</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sky-500 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments}</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sky-500 transition-colors ml-auto">
          <Share2 className="w-4 h-4" />
          <span>分享</span>
        </button>
      </div>
    </div>
  );
}
