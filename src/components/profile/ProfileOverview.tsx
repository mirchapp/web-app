'use client';

import * as React from 'react';
import Image from 'next/image';
import { MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { createClient } from '@/utils/supabase/client';
import { FollowersDrawer } from './FollowersDrawer';
import { useRouter } from 'next/navigation';

// Custom hook for parallax scrolling effect
function useParallax(speed = 0.5) {
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * speed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return offset;
}

// Custom hook for animated counter
function useCounter(end: number, duration = 2000) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

interface ProfileData {
  display_name?: string;
  username?: string;
  avatar_url?: string;
  location?: string;
}

export function ProfileOverview() {
  // Load cached profile data immediately to avoid skeleton loader
  const getCachedProfile = () => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('cached_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const getCachedUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = React.useState<{ id: string; email?: string } | null>(getCachedUser);
  const [profile, setProfile] = React.useState<ProfileData | null>(getCachedProfile);
  const [loading, setLoading] = React.useState(!getCachedUser()); // Only show loader if no cache
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [authLoading, setAuthLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [_isStandalone, setIsStandalone] = React.useState(false);
  const [followersCountData, setFollowersCountData] = React.useState(0);
  const [followingCountData, setFollowingCountData] = React.useState(0);
  const [showFollowersDrawer, setShowFollowersDrawer] = React.useState(false);
  const [followDrawerMode, setFollowDrawerMode] = React.useState<"followers" | "following">("followers");

  const supabase = createClient();
  const router = useRouter();
  const parallaxOffset = useParallax(0.3);
  const followersCount = useCounter(followersCountData, 2000);
  const followingCount = useCounter(followingCountData, 2000);
  const postsCount = useCounter(89, 2000);

  // Memoize star positions so they don't change on re-render
  const starPositions = React.useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    }));
  }, []);

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // Cache user data
      if (user) {
        localStorage.setItem('cached_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('cached_user');
        localStorage.removeItem('cached_profile');
      }

      setUser(user);

      if (user) {
        // Fetch fresh profile data in background
        const { data: profileData } = await supabase
          .from('Profile')
          .select('display_name, username, avatar_url, location')
          .eq('user_id', user.id)
          .single();

        // Cache profile data
        if (profileData) {
          localStorage.setItem('cached_profile', JSON.stringify(profileData));
        }

        setProfile(profileData);

        // Fetch followers count (people following this user)
        const { count: followersCount } = await supabase
          .from('Follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);

        if (followersCount !== null) {
          setFollowersCountData(followersCount);
        }

        // Fetch following count (people this user is following)
        const { count: followingCount } = await supabase
          .from('Follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id);

        if (followingCount !== null) {
          setFollowingCountData(followingCount);
        }
      }

      setLoading(false);
    };
    getUser();
  }, [supabase]);

  // Detect iOS/Android PWA standalone mode to tweak layout
  React.useEffect(() => {
    try {
      const mq = window.matchMedia && window.matchMedia('(display-mode: standalone)');
      const standalone = !!(mq && mq.matches) || (
        typeof navigator !== 'undefined' &&
        'standalone' in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true
      );
      setIsStandalone(standalone);
    } catch {}
  }, []);

  // In standalone PWA, bottom nav is still present, so use consistent padding
  const bottomPadding = 'calc(env(safe-area-inset-bottom, 20px) + 88px)';

  if (loading) {
    return (
      <div className="absolute inset-0 bg-white dark:bg-[#0A0A0F] overflow-y-auto" style={{ paddingBottom: bottomPadding }}>
        {/* Animated purple wave background - matching profile page */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Purple wave gradient */}
          <div
            className="absolute left-0 right-0 h-[400px] opacity-20 dark:opacity-30"
            style={{
              top: '10%',
              background: 'linear-gradient(90deg, rgba(138, 66, 214, 0.4) 0%, rgba(168, 85, 247, 0.3) 50%, rgba(138, 66, 214, 0.4) 100%)',
              filter: 'blur(80px)',
              transform: 'translateZ(0)',
              animation: 'wave 8s ease-in-out infinite alternate'
            }}
          />

          {/* Subtle stars/particles */}
          <div className="absolute inset-0 opacity-15 dark:opacity-30">
            {starPositions.map((star, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-purple-500/30 dark:bg-white/20 rounded-full"
                style={{
                  top: `${star.top}%`,
                  left: `${star.left}%`,
                  animation: `twinkle ${star.duration}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                  willChange: 'opacity',
                }}
              />
            ))}
          </div>
        </div>
        <div className="container mx-auto px-4 relative z-10" style={{ paddingTop: 'var(--profile-top-padding-safe)' }}>
          <div className="max-w-md mx-auto">
            <div className="flex flex-col items-center space-y-8 animate-pulse">
              {/* Avatar skeleton */}
              <div className="relative">
                <div className="h-40 w-40 rounded-full bg-muted/50" />
                <div className="absolute inset-0 blur-3xl opacity-25 bg-muted/50 rounded-full -z-10" />
              </div>

              {/* Name skeleton */}
              <div className="space-y-2 w-full flex flex-col items-center">
                <div className="h-10 bg-muted/50 rounded-lg w-48" />
                <div className="h-4 bg-muted/30 rounded w-32" />
              </div>

              {/* Button skeleton */}
              <div className="h-9 bg-muted/50 rounded-[12px] w-28" />

              {/* Stats skeleton */}
              <div className="flex items-center gap-10">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-8 w-12 bg-muted/50 rounded" />
                  <div className="h-3 w-16 bg-muted/30 rounded" />
                </div>
                <div className="h-12 w-px bg-muted/30" />
                <div className="flex flex-col items-center gap-1">
                  <div className="h-8 w-12 bg-muted/50 rounded" />
                  <div className="h-3 w-16 bg-muted/30 rounded" />
                </div>
                <div className="h-12 w-px bg-muted/30" />
                <div className="flex flex-col items-center gap-1">
                  <div className="h-8 w-12 bg-muted/50 rounded" />
                  <div className="h-3 w-16 bg-muted/30 rounded" />
                </div>
              </div>

              {/* Bio skeleton */}
              <div className="space-y-2 w-full max-w-xs">
                <div className="h-3 bg-muted/30 rounded w-full" />
                <div className="h-3 bg-muted/30 rounded w-5/6 mx-auto" />
              </div>

              {/* Tabs skeleton */}
              <div className="w-full space-y-4">
                <div className="h-12 bg-muted/50 rounded-2xl w-full" />
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="aspect-square bg-muted/50 rounded-2xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in - show login/signup UI directly
  if (!user) {

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setAuthLoading(false);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setAuthLoading(false);
      }
    };

    const handleSignUp = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setError(null);
      setMessage(null);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/confirm`,
        },
      });

      if (error) {
        setError(error.message);
        setAuthLoading(false);
      } else {
        setMessage('Check your email for the confirmation link!');
        setAuthLoading(false);
      }
    };

    const handleGoogleAuth = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/confirm`,
        },
      });

      if (error) {
        setError(error.message);
      }
    };

    const handleAppleAuth = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${location.origin}/auth/confirm`,
        },
      });

      if (error) {
        setError(error.message);
      }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setError(null);
      setMessage(null);

      if (!email) {
        setError('Please enter your email address');
        setAuthLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
        setAuthLoading(false);
      } else {
        setMessage('Password reset link sent! Check your email.');
        setAuthLoading(false);
        setShowForgotPassword(false);
      }
    };

    return (
      <div className="absolute inset-0 bg-white dark:bg-[#0A0A0F] overflow-y-auto">
        {/* Animated purple wave background - matching profile page */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          {/* Purple wave gradient */}
          <div
            className="absolute left-0 right-0 h-[400px] opacity-20 dark:opacity-30"
            style={{
              top: '10%',
              background: 'linear-gradient(90deg, rgba(138, 66, 214, 0.4) 0%, rgba(168, 85, 247, 0.3) 50%, rgba(138, 66, 214, 0.4) 100%)',
              filter: 'blur(80px)',
              transform: 'translateZ(0)',
              animation: 'wave 8s ease-in-out infinite alternate'
            }}
          />

          {/* Subtle stars/particles */}
          <div className="absolute inset-0 opacity-15 dark:opacity-30">
            {starPositions.map((star, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-purple-500/30 dark:bg-white/20 rounded-full"
                style={{
                  top: `${star.top}%`,
                  left: `${star.left}%`,
                  animation: `twinkle ${star.duration}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                  willChange: 'opacity',
                }}
              />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 relative flex items-center" style={{ paddingTop: 'var(--profile-top-padding-safe)', paddingBottom: bottomPadding, minHeight: '100%', zIndex: 1 }}>
          <div className="max-w-md mx-auto w-full">
            <div
              className="flex flex-col items-center animate-fade-in"
              style={{
                animation: 'fadeIn 0.6s ease-out'
              }}
            >
              {/* Brand Logo/Icon */}
              <div className="mb-3 relative">
                <div className="relative w-36 h-24 sm:w-40 sm:h-28">
                  {/* Light mode logo */}
                  <Image
                    src="/mirch-logo-transparent-dark.png"
                    alt="Mirch"
                    width={160}
                    height={112}
                    className="object-contain scale-125 object-top dark:hidden"
                    style={{
                      filter: 'drop-shadow(0 0 30px rgba(138, 66, 214, 0.6)) drop-shadow(0 0 15px rgba(138, 66, 214, 0.4))'
                    }}
                    priority
                  />
                  {/* Dark mode logo */}
                  <Image
                    src="/mirch-logo-transparent.png"
                    alt="Mirch"
                    width={160}
                    height={112}
                    className="object-contain scale-125 object-top hidden dark:block"
                    style={{
                      filter: 'drop-shadow(0 0 30px rgba(138, 66, 214, 0.6)) drop-shadow(0 0 15px rgba(138, 66, 214, 0.4))'
                    }}
                    priority
                  />
                </div>
                <div className="absolute inset-0 blur-2xl opacity-30 bg-primary/40 rounded-full -z-10" />
              </div>

              <div className="text-center mb-5">
                <h1 className="text-3xl sm:text-4xl font-thin mb-2 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="text-sm text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
                  {isSignUp
                    ? 'Join Mirch to start sharing your culinary adventures'
                    : 'Sign in to view your profile and continue exploring'
                  }
                </p>
              </div>

              <form className="w-full space-y-4" onSubmit={showForgotPassword ? handleForgotPassword : (isSignUp ? handleSignUp : handleLogin)}>
                {error && (
                  <div className="rounded-md bg-red-50 dark:bg-red-950/20 p-4">
                    <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                  </div>
                )}
                {message && (
                  <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-4">
                    <p className="text-sm text-green-800 dark:text-green-400">{message}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 px-4 text-sm rounded-[13px] border border-border/30 dark:border-white/5 bg-card/50 dark:bg-white/[0.02] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all duration-200 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                  />
                  {!showForgotPassword && (
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full h-12 px-4 text-sm rounded-[13px] border border-border/30 dark:border-white/5 bg-card/50 dark:bg-white/[0.02] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all duration-200 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                    />
                  )}
                </div>

                {!isSignUp && !showForgotPassword && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary/80 hover:text-primary transition-colors duration-200 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-12 text-sm font-semibold rounded-[13px] bg-primary hover:bg-primary/90 shadow-[0_4px_20px_rgba(138,66,214,0.35)] hover:shadow-[0_6px_24px_rgba(138,66,214,0.45)] transition-all duration-200 active:scale-[0.98]"
                >
                  {authLoading
                    ? (showForgotPassword ? 'Sending reset link...' : (isSignUp ? 'Creating account...' : 'Signing in...'))
                    : (showForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Sign In'))
                  }
                </Button>

                {showForgotPassword && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError(null);
                        setMessage(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      Back to sign in
                    </button>
                  </div>
                )}

                {!showForgotPassword && (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 border-t border-white/[0.08]" />
                      <span className="text-xs text-muted-foreground/40 font-medium">Or continue with</span>
                      <div className="flex-1 border-t border-white/[0.08]" />
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleAuth}
                        className="w-full h-12 text-sm font-medium rounded-[13px] bg-card dark:bg-[#1a1a1a] border border-border/50 dark:border-white/[0.08] hover:bg-accent dark:hover:bg-[#242424] hover:border-border dark:hover:border-white/[0.12] transition-all duration-200 active:scale-[0.98] shadow-sm dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.2)]"
                      >
                        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Sign {isSignUp ? 'up' : 'in'} with Google
                      </Button>

                      <Button
                        type="button"
                        onClick={handleAppleAuth}
                        className="w-full h-12 text-sm font-medium rounded-[13px] bg-black dark:bg-black text-white hover:bg-black/80 dark:hover:bg-[#1a1a1a] border border-black dark:border-white/[0.08] transition-all duration-200 active:scale-[0.98] shadow-[0_2px_8px_rgba(0,0,0,0.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_2px_8px_rgba(0,0,0,0.4)]"
                      >
                        <svg className="mr-3" viewBox="0 0 24 24" fill="currentColor" style={{ width: '22px', height: '22px' }}>
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Sign {isSignUp ? 'up' : 'in'} with Apple
                      </Button>
                    </div>

                    <div className="text-center text-xs sm:text-sm pt-1">
                      <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-primary/90 hover:text-primary transition-colors duration-200 font-medium"
                      >
                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - show profile
  return (
    <div className="absolute inset-0 overflow-y-auto bg-white dark:bg-[#0A0A0F]" style={{
      paddingBottom: bottomPadding,
      fontFamily: "'Manrope', -apple-system, system-ui, sans-serif"
    }}>
      {/* Animated purple wave background - matching hero aesthetic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Purple wave gradient */}
        <div
          className="absolute left-0 right-0 h-[400px] opacity-20 dark:opacity-30"
          style={{
            top: '10%',
            background: 'linear-gradient(90deg, rgba(138, 66, 214, 0.4) 0%, rgba(168, 85, 247, 0.3) 50%, rgba(138, 66, 214, 0.4) 100%)',
            filter: 'blur(80px)',
            transform: 'translateZ(0)',
            animation: 'wave 8s ease-in-out infinite alternate'
          }}
        />

        {/* Subtle stars/particles */}
        <div className="absolute inset-0 opacity-15 dark:opacity-30">
          {starPositions.map((star, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-500/30 dark:bg-white/20 rounded-full"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                animation: `twinkle ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`,
                willChange: 'opacity',
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-5 sm:px-6 relative z-10" style={{ paddingTop: 'var(--profile-top-padding-safe)' }}>
        <div className="max-w-lg mx-auto">
          {/* Parallax header section */}
          <div
            className="flex flex-col items-center justify-center opacity-0 pt-4 sm:pt-6"
            style={{
              animation: 'fadeIn 0.8s ease-out forwards',
              transform: `translateY(${parallaxOffset}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            {/* Avatar with minimal styling */}
            <div className="relative mb-5 sm:mb-6">
              <div className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-white/10 shadow-lg dark:shadow-lg shadow-purple-500/10">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name || 'User'}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 640px) 128px, 144px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                    <svg className="w-16 h-16 sm:w-18 sm:h-18 text-gray-300 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Name with hero-style typography */}
            <div className="mb-2 text-center px-4">
              <h1 className="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white tracking-tight">
                {profile?.display_name || 'User'}
              </h1>
              {profile?.username && (
                <p className="text-sm sm:text-base font-light text-gray-500 dark:text-white/45 mt-1.5">
                  @{profile.username}
                </p>
              )}
            </div>

            {/* Location */}
            {profile?.location && (
              <div className="flex items-center gap-1.5 mb-5 text-gray-600 dark:text-white/50">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-xs sm:text-sm font-light">{profile.location}</span>
              </div>
            )}

            {/* Edit Profile Button - Minimal pill */}
            <div className="mb-5 sm:mb-6">
              <button
                className="h-8 px-5 text-xs font-light rounded-full text-gray-700 dark:text-white/70 border border-gray-300 dark:border-white/15 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-white/25 transition-all duration-200"
                onClick={() => {
                  // TODO: Navigate to edit profile
                  console.log('Edit profile clicked');
                }}
              >
                Edit Profile
              </button>
            </div>

            {/* Stats with animated counters */}
            <div className="flex items-center gap-6 sm:gap-8 mb-5 sm:mb-6 px-4">
              <button
                onClick={() => {
                  setFollowDrawerMode("followers");
                  setShowFollowersDrawer(true);
                }}
                className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer"
              >
                <span className="text-2xl sm:text-3xl font-extralight text-gray-900 dark:text-white">{followersCount}</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-white/35 uppercase tracking-widest font-light">Followers</span>
              </button>
              <div className="h-8 sm:h-9 w-px bg-gray-200 dark:bg-white/10" />
              <button
                onClick={() => {
                  setFollowDrawerMode("following");
                  setShowFollowersDrawer(true);
                }}
                className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer"
              >
                <span className="text-2xl sm:text-3xl font-extralight text-gray-900 dark:text-white">{followingCount}</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-white/35 uppercase tracking-widest font-light">Following</span>
              </button>
              <div className="h-8 sm:h-9 w-px bg-gray-200 dark:bg-white/10" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl sm:text-3xl font-extralight text-gray-900 dark:text-white">{postsCount}</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-white/35 uppercase tracking-widest font-light">Posts</span>
              </div>
            </div>

            {/* Bio with minimal typography */}
            <p className="text-center text-sm sm:text-base leading-loose text-gray-600 dark:text-white/50 mb-4 sm:mb-5 px-6 max-w-md font-light">
              Food enthusiast and explorer. Always on the hunt for the perfect dish and hidden gems in the city.
            </p>

            {/* Joined Date */}
            <div className="flex items-center gap-1.5 text-gray-400 dark:text-white/30 mb-6 sm:mb-8">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="text-[10px] sm:text-xs font-light">Joined September 2024</span>
            </div>

            {/* Flix & Reviews Tabs - Matching navbar style */}
            <Tabs defaultValue="flix" className="w-full px-2 sm:px-0">
              <TabsList
                className="w-full grid grid-cols-2 h-11 sm:h-12 rounded-[1.625rem] p-1 relative overflow-visible border border-gray-200 dark:border-white/15 bg-gray-100/80 dark:bg-[rgba(0,0,0,0.4)]"
                style={{
                  backdropFilter: 'blur(3px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(3px) saturate(140%)',
                }}
              >
                {/* Top edge gradient - light mode */}
                <div
                  className="absolute inset-0 rounded-[1.625rem] pointer-events-none dark:hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 65%, transparent 100%)',
                  }}
                />
                {/* Top edge gradient - dark mode */}
                <div
                  className="absolute inset-0 rounded-[1.625rem] pointer-events-none hidden dark:block"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 65%, transparent 100%)',
                  }}
                />

                <TabsTrigger
                  value="flix"
                  className="relative z-10 rounded-[1.125rem] !text-gray-600 dark:!text-white/90 font-light text-xs sm:text-sm transition-all duration-200 flex items-center justify-center !bg-transparent !border-transparent !shadow-none data-[state=active]:!bg-[rgba(168,85,247,0.15)] dark:data-[state=active]:!bg-[rgba(168,85,247,0.3)] data-[state=active]:!text-purple-700 dark:data-[state=active]:!text-white data-[state=active]:!shadow-[0_2px_8px_rgba(138,66,214,0.25),inset_0_1px_0_rgba(138,66,214,0.15)] dark:data-[state=active]:!shadow-[0_4px_10px_rgba(168,85,247,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] data-[state=active]:!border data-[state=active]:!border-purple-300 dark:data-[state=active]:!border-[rgba(192,132,252,0.35)] data-[state=active]:backdrop-blur-xl"
                >
                  Flix
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="relative z-10 rounded-[1.125rem] !text-gray-600 dark:!text-white/90 font-light text-xs sm:text-sm transition-all duration-200 flex items-center justify-center !bg-transparent !border-transparent !shadow-none data-[state=active]:!bg-[rgba(168,85,247,0.15)] dark:data-[state=active]:!bg-[rgba(168,85,247,0.3)] data-[state=active]:!text-purple-700 dark:data-[state=active]:!text-white data-[state=active]:!shadow-[0_2px_8px_rgba(138,66,214,0.25),inset_0_1px_0_rgba(138,66,214,0.15)] dark:data-[state=active]:!shadow-[0_4px_10px_rgba(168,85,247,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] data-[state=active]:!border data-[state=active]:!border-purple-300 dark:data-[state=active]:!border-[rgba(192,132,252,0.35)] data-[state=active]:backdrop-blur-xl"
                >
                  Posts
                </TabsTrigger>
              </TabsList>
              <TabsContent value="flix" className="mt-5 sm:mt-6">
                {/* Flix Masonry Grid */}
                <div className="columns-2 sm:columns-3 gap-2 sm:gap-2.5 space-y-2 sm:space-y-2.5">
                  {[
                    { id: 'photo-1546069901-ba9599a7e63c', height: 400 }, // burger
                    { id: 'photo-1565299624946-b28f40a0ae38', height: 500 }, // pizza
                    { id: 'photo-1567620905732-2d1ec7ab7445', height: 350 }, // pancakes
                    { id: 'photo-1540189549336-e6e99c3679fe', height: 450 }, // salad
                    { id: 'photo-1565958011703-44f9829ba187', height: 400 }, // sushi
                    { id: 'photo-1551782450-a2132b4ba21d', height: 380 }, // pasta
                    { id: 'photo-1484723091739-30a097e8f929', height: 420 }, // breakfast
                    { id: 'photo-1550547660-d9450f859349', height: 460 }, // tacos
                    { id: 'photo-1563379926898-05f4575a45d8', height: 390 }, // ramen
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="break-inside-avoid mb-2 sm:mb-2.5 group"
                    >
                      <div className="relative rounded-lg sm:rounded-xl bg-gray-100 dark:bg-white/5 overflow-hidden cursor-pointer ring-1 ring-gray-200 dark:ring-white/10 hover:ring-gray-300 dark:hover:ring-white/20 transition-all duration-300 shadow-lg hover:shadow-xl">
                        <Image
                          src={`https://images.unsplash.com/${item.id}?w=400&h=${item.height}&fit=crop`}
                          alt={`Food ${i + 1}`}
                          width={400}
                          height={item.height}
                          className="object-cover w-full"
                          unoptimized
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="mt-6">
                {/* Posts content will go here */}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Followers/Following Drawer */}
      {user && (
        <FollowersDrawer
          isOpen={showFollowersDrawer}
          onClose={() => setShowFollowersDrawer(false)}
          userId={user.id}
          currentUserId={user.id}
          mode={followDrawerMode}
          onProfileClick={(userId) => router.push(`/profile/${userId}`)}
        />
      )}
    </div>
  );
}

