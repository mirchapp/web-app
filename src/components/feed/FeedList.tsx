'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  Smile,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type {
  FeedAnnouncementContent,
  FeedItem,
  FeedPost,
  FeedReactionType,
  FeedReviewContent,
  FeedFlixContent,
  FeedNewsletterContent,
  FeedMedia,
} from '@/types/feed';

type FeedListProps = {
  items: FeedItem[];
};

type FeedPostEngagementState = {
  reaction: FeedReactionType | null;
  isSaved: boolean;
};

const REACTION_OPTIONS: Array<{
  type: FeedReactionType;
  label: string;
  emoji: string;
}> = [
  { type: 'like', label: 'Like', emoji: '👍' },
  { type: 'love', label: 'Love', emoji: '❤️' },
  { type: 'yum', label: 'Yum', emoji: '😋' },
  { type: 'wow', label: 'Wow', emoji: '🤯' },
  { type: 'insightful', label: 'Insightful', emoji: '🧠' },
  { type: 'support', label: 'Support', emoji: '👏' },
];

const AUDIENCE_LABEL: Record<string, string> = {
  followers: 'Followers',
  network: 'Network',
  community: 'Mirch Community',
};

const announcementGradient =
  'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(244, 114, 182, 0.08))';

export function FeedList({ items }: FeedListProps) {
  const posts = React.useMemo(
    () =>
      items.filter((item): item is FeedPost => 'content' in item && !!item.content),
    [items],
  );

  const [engagementState, setEngagementState] = React.useState<
    Record<string, FeedPostEngagementState>
  >(() => buildEngagementState(posts));

  React.useEffect(() => {
    setEngagementState((prev) => ({
      ...buildEngagementState(posts),
      ...prev,
    }));
  }, [posts]);

  const handleReactionChange = React.useCallback(
    (postId: string, nextReaction: FeedReactionType | null) => {
      setEngagementState((prev) => ({
        ...prev,
        [postId]: {
          reaction:
            prev[postId]?.reaction === nextReaction ? null : nextReaction,
          isSaved: prev[postId]?.isSaved ?? false,
        },
      }));
    },
    [],
  );

  const handleSaveToggle = React.useCallback((postId: string) => {
    setEngagementState((prev) => ({
      ...prev,
      [postId]: {
        reaction: prev[postId]?.reaction ?? null,
        isSaved: !(prev[postId]?.isSaved ?? false),
      },
    }));
  }, []);

  const renderItem = (item: FeedItem) => {
    if ('content' in item && item.content) {
      return (
        <FeedPostCard
          key={item.id}
          post={item}
          state={engagementState[item.id] ?? { reaction: null, isSaved: false }}
          onReactionChange={handleReactionChange}
          onToggleSave={handleSaveToggle}
        />
      );
    }

    if (item.type === 'section-header') {
      return (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm shadow-sm backdrop-blur-md"
        >
          <div className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="font-semibold leading-tight">{item.title}</p>
            {item.subtitle ? (
              <p className="text-muted-foreground text-xs leading-snug">
                {item.subtitle}
              </p>
            ) : null}
          </div>
        </div>
      );
    }

    if (item.type === 'divider') {
      return (
        <div
          key={item.id}
          className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground"
        >
          <div className="h-px flex-1 bg-border" aria-hidden />
          {item.label ? <span>{item.label}</span> : null}
          <div className="h-px flex-1 bg-border" aria-hidden />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-[calc(env(safe-area-inset-bottom,0)+88px)] pt-6 sm:px-6"
      style={{
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {items.map(renderItem)}
    </div>
  );
}

type FeedPostCardProps = {
  post: FeedPost;
  state: FeedPostEngagementState;
  onReactionChange: (postId: string, nextReaction: FeedReactionType | null) => void;
  onToggleSave: (postId: string) => void;
};

function FeedPostCard({
  post,
  state,
  onReactionChange,
  onToggleSave,
}: FeedPostCardProps) {
  const { author, content } = post;
  const currentReaction = state.reaction;
  const isSaved = state.isSaved;

  const baseReactionTotal = React.useMemo(() => {
    const totals = Object.values(post.stats.reactions ?? {});
    return totals.reduce((acc, value = 0) => acc + value, 0);
  }, [post.stats.reactions]);

  const initialReactionCount = post.state?.userReaction ? 1 : 0;
  const initialSaved = post.state?.isSaved ? 1 : 0;

  const adjustedReactionTotal =
    baseReactionTotal + (currentReaction ? 1 : 0) - initialReactionCount;

  const adjustedSaveTotal =
    post.stats.saves + (isSaved ? 1 : 0) - initialSaved;

  const handleLike = () => {
    onReactionChange(post.id, 'like');
  };

  const handleComment = () => {
    console.info('[Feed] Open comments drawer for post', post.id);
  };

  const handleShare = async () => {
    const fallbackUrl = typeof window !== 'undefined' ? window.location.href : '/';
    const shareData = {
      title: 'Mirch Feed',
      text: 'Check out this post on Mirch',
      url:
        post.content.type === 'newsletter'
          ? post.content.canonicalUrl ?? fallbackUrl
          : fallbackUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.warn('[Feed] Share cancelled or failed', error);
      }
    } else {
      void navigator.clipboard?.writeText(shareData.url);
      console.info('[Feed] Shared URL copied to clipboard', shareData.url);
    }
  };

  return (
    <Card className="border-border/50 bg-background/90 shadow-xl shadow-black/5 backdrop-blur">
      <header className="flex items-start gap-4 px-5 pb-4">
        <AvatarImage
          src={author.avatarUrl}
          fallback={author.name.charAt(0)}
          alt={`${author.name} avatar`}
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-2 font-semibold leading-tight">
                {author.name}
                {author.isVerified ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    Verified
                  </span>
                ) : null}
              </p>
              {author.headline ? (
                <p className="text-xs text-muted-foreground">{author.headline}</p>
              ) : null}
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground/80">
                <span>{formatRelativeTime(post.createdAt)}</span>
                <span aria-hidden>•</span>
                <span>{AUDIENCE_LABEL[post.audience] ?? post.audience}</span>
                {post.context?.detail ? (
                  <>
                    <span aria-hidden>•</span>
                    <span>{post.context.detail}</span>
                  </>
                ) : null}
              </div>
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
              {post.context?.reason === 'trending'
                ? 'Trending'
                : post.context?.reason === 'second-degree'
                  ? 'In Your Network'
                  : undefined}
            </span>
          </div>
        </div>
      </header>

      <section className="space-y-4 px-5 pb-5 pt-1">
        {renderContent(content)}
      </section>

      <footer className="border-t border-border/50 px-5 pt-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{formatCount(adjustedReactionTotal)} reactions</span>
          <span aria-hidden>•</span>
          <span>{formatCount(post.stats.comments)} comments</span>
          <span aria-hidden>•</span>
          <span>{formatCount(adjustedSaveTotal)} saves</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'flex-1 rounded-full border border-transparent bg-muted/40 text-sm font-medium transition-colors',
              currentReaction === 'like' && 'border-primary/40 bg-primary/10 text-primary',
            )}
            onClick={handleLike}
          >
            <Heart
              className={cn(
                'size-4',
                currentReaction === 'like' ? 'fill-current text-primary' : undefined,
              )}
            />
            Like
          </Button>
          <ReactionButton
            postId={post.id}
            currentReaction={currentReaction}
            onSelect={onReactionChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1 rounded-full bg-muted/30 text-sm font-medium"
            onClick={handleComment}
          >
            <MessageCircle className="size-4" />
            Comment
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'flex-1 rounded-full bg-muted/30 text-sm font-medium',
              isSaved && 'bg-primary/10 text-primary',
            )}
            onClick={() => onToggleSave(post.id)}
          >
            <Bookmark className={cn('size-4', isSaved && 'fill-current')} />
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1 rounded-full bg-muted/30 text-sm font-medium"
            onClick={handleShare}
          >
            <Share2 className="size-4" />
            Share
          </Button>
        </div>
      </footer>
    </Card>
  );
}

function renderContent(content: FeedPost['content']) {
  switch (content.type) {
    case 'review':
      return <ReviewContent content={content} />;
    case 'flix':
      return <FlixContent content={content} />;
    case 'announcement':
      return <AnnouncementContent content={content} />;
    case 'newsletter':
      return <NewsletterContent content={content} />;
    default:
      return null;
  }
}

function ReviewContent({ content }: { content: FeedReviewContent }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-foreground">{content.body}</p>
      {content.highlights && content.highlights.length > 0 ? (
        <ul className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          {content.highlights.map((highlight) => (
            <li
              key={highlight}
              className="rounded-full border border-border/50 bg-muted/40 px-3 py-1 font-medium"
            >
              {highlight}
            </li>
          ))}
        </ul>
      ) : null}

      {content.media?.length ? (
        <MediaGallery media={content.media} />
      ) : null}

      {content.location ? (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
          <p className="font-semibold">{content.location.restaurantName}</p>
          {content.location.address ? (
            <p className="text-muted-foreground text-xs">{content.location.address}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {content.location.rating ? (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-4 text-amber-500" aria-hidden />
                {content.location.rating.toFixed(1)}
              </span>
            ) : null}
            {content.tasteRating ? (
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-green-600">
                {content.tasteRating}
              </span>
            ) : null}
            {content.valueForMoney ? (
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-sky-600">
                {content.valueForMoney}
              </span>
            ) : null}
            {content.wouldReturn ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-primary">
                Would return
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FlixContent({ content }: { content: FeedFlixContent }) {
  return (
    <div className="space-y-3">
      {content.caption ? (
        <p className="text-sm text-foreground">{content.caption}</p>
      ) : null}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-black">
        <video
          src={content.media.url}
          poster={content.media.thumbnailUrl}
          className="h-full w-full object-cover"
          playsInline
          controls
          loop
          muted
        />
      </div>
      {content.relatedLocation ? (
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
          <div>
            <p className="font-semibold">{content.relatedLocation.restaurantName}</p>
            {content.relatedLocation.address ? (
              <p className="text-xs text-muted-foreground">
                {content.relatedLocation.address}
              </p>
            ) : null}
          </div>
          <Button variant="outline" size="sm" className="rounded-full text-xs">
            View Menu
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function AnnouncementContent({ content }: { content: FeedAnnouncementContent }) {
  return (
    <div
      className="space-y-4 rounded-2xl border border-border/60 p-5"
      style={{
        background: announcementGradient,
      }}
    >
      <div>
        <h3 className="text-lg font-semibold leading-tight text-foreground">
          {content.headline}
        </h3>
        <p className="mt-2 text-sm text-foreground/90">{content.body}</p>
      </div>
      {content.media?.length ? <MediaGallery media={content.media} /> : null}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {content.validFrom ? (
          <span>From {formatCalendarDate(content.validFrom)}</span>
        ) : null}
        {content.validThrough ? (
          <span>Until {formatCalendarDate(content.validThrough)}</span>
        ) : null}
      </div>
      {content.ctaButton ? (
        <Button
          variant="default"
          size="sm"
          className="rounded-full text-sm"
          asChild
        >
          <a href={content.ctaButton.href}>{content.ctaButton.label}</a>
        </Button>
      ) : null}
    </div>
  );
}

function NewsletterContent({
  content,
}: {
  content: FeedNewsletterContent;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/20 p-5 sm:grid-cols-[160px_1fr] sm:items-center sm:gap-6">
      {content.coverImage ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/40">
          <OptimizedImage media={content.coverImage} />
        </div>
      ) : null}
      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Mirch Newsletter
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-tight">
            {content.title}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">{content.summary}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {content.readingTimeMinutes ? (
            <span>{content.readingTimeMinutes} min read</span>
          ) : null}
          {content.sections?.slice(0, 2).map((section) => (
            <span
              key={section}
              className="rounded-full bg-background px-3 py-1 font-medium text-foreground/80"
            >
              {section}
            </span>
          ))}
        </div>
        {content.canonicalUrl ? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-sm"
            asChild
          >
            <a href={content.canonicalUrl}>Read story</a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function MediaGallery({ media }: { media: FeedMedia[] }) {
  if (media.length === 1) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60">
        <OptimizedImage media={media[0]} />
      </div>
    );
  }

  if (media.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {media.map((item) => (
          <div
            key={item.id}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60"
          >
            <OptimizedImage media={item} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {media.slice(0, 3).map((item, index) => (
        <div
          key={item.id}
          className={cn(
            'relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60',
            index === 2 && 'col-span-2',
          )}
        >
          <OptimizedImage media={item} />
        </div>
      ))}
    </div>
  );
}

function OptimizedImage({ media }: { media: FeedMedia }) {
  if (media.type === 'video') {
    return (
      <video
        src={media.url}
        poster={media.thumbnailUrl}
        className="h-full w-full object-cover"
        playsInline
        controls
        muted
      />
    );
  }

  return (
    <Image
      src={media.url}
      alt={media.alt ?? ''}
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      className="object-cover"
    />
  );
}

function AvatarImage({
  src,
  fallback,
  alt,
}: {
  src?: string;
  fallback: string;
  alt: string;
}) {
  if (src) {
    return (
      <div className="relative size-12 overflow-hidden rounded-full border border-border/40 bg-muted">
        <Image src={src} alt={alt} fill sizes="48px" className="object-cover" />
      </div>
    );
  }

  return (
    <div className="flex size-12 items-center justify-center rounded-full border border-border/40 bg-muted text-lg font-semibold text-muted-foreground">
      {fallback}
    </div>
  );
}

function ReactionButton({
  postId,
  currentReaction,
  onSelect,
}: {
  postId: string;
  currentReaction: FeedReactionType | null;
  onSelect: (postId: string, reaction: FeedReactionType) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'flex-1 rounded-full bg-muted/30 text-sm font-medium',
            currentReaction &&
              currentReaction !== 'like' &&
              'bg-primary/10 text-primary',
          )}
        >
          <Smile className="size-4" />
          {currentReaction && currentReaction !== 'like'
            ? REACTION_OPTIONS.find((option) => option.type === currentReaction)
                ?.label ?? 'React'
            : 'React'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-auto">
        <div className="flex items-center gap-2">
          {REACTION_OPTIONS.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => {
                onSelect(postId, option.type);
                setOpen(false);
              }}
              className={cn(
                'flex size-12 flex-col items-center justify-center gap-1 rounded-full border border-transparent bg-muted/30 text-xs font-medium transition-all',
                currentReaction === option.type &&
                  'border-primary/40 bg-primary/10 text-primary',
              )}
            >
              <span className="text-xl">{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatRelativeTime(dateString: string) {
  const target = new Date(dateString).getTime();
  const now = Date.now();
  const diff = Math.max(now - target, 0);

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;

  const years = Math.floor(days / 365);
  return `${years}y`;
}

function formatCount(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return value.toString();
}

function formatCalendarDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function buildEngagementState(posts: FeedPost[]) {
  const initial: Record<string, FeedPostEngagementState> = {};
  for (const post of posts) {
    initial[post.id] = {
      reaction: post.state?.userReaction ?? null,
      isSaved: post.state?.isSaved ?? false,
    };
  }
  return initial;
}
