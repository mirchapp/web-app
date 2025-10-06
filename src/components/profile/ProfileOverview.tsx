'use client';

import * as React from 'react';
import Image from 'next/image';
import { MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { createClient } from '@/utils/supabase/client';

export function ProfileOverview() {
  const [user, setUser] = React.useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [authLoading, setAuthLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);

  const supabase = createClient();

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase.auth]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
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
      <div className="relative" style={{ minHeight: '100dvh', paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 88px)' }}>
        {/* Animated floating glow background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-[15%] left-[15%] w-[500px] h-[500px] rounded-full opacity-10 dark:opacity-20 blur-[120px] animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(138, 66, 214, 0.4), transparent 70%)',
              animation: 'float 8s ease-in-out infinite'
            }}
          />
          <div
            className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-8 dark:opacity-15 blur-[100px]"
            style={{
              background: 'radial-gradient(circle, rgba(192, 132, 252, 0.3), transparent 70%)',
              animation: 'float 10s ease-in-out infinite reverse'
            }}
          />
        </div>

        <div className="container mx-auto px-4 pt-16 relative z-10">
          <div className="max-w-md mx-auto">
            <div
              className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in"
              style={{
                animation: 'fadeIn 0.6s ease-out'
              }}
            >
              {/* Brand Logo/Icon */}
              <div className="mb-2 relative -mb-4">
                <div className="relative w-40 h-28">
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

              <div className="text-center mb-6">
                <h1 className="text-4xl font-thin mb-3 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="text-sm text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
                  {isSignUp
                    ? 'Join Mirch to start sharing your culinary adventures'
                    : 'Sign in to view your profile and continue exploring'
                  }
                </p>
              </div>

              <form className="w-full space-y-5" onSubmit={showForgotPassword ? handleForgotPassword : (isSignUp ? handleSignUp : handleLogin)}>
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
                    className="w-full h-14 px-5 rounded-[14px] border border-border/30 dark:border-white/5 bg-card/50 dark:bg-white/[0.02] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all duration-200 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                  />
                  {!showForgotPassword && (
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full h-14 px-5 rounded-[14px] border border-border/30 dark:border-white/5 bg-card/50 dark:bg-white/[0.02] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all duration-200 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                    />
                  )}
                </div>

                {!isSignUp && !showForgotPassword && (
                  <div className="flex justify-end -mt-2">
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
                  className="w-full h-14 text-base font-semibold rounded-[14px] bg-primary hover:bg-primary/90 shadow-[0_4px_20px_rgba(138,66,214,0.35)] hover:shadow-[0_6px_24px_rgba(138,66,214,0.45)] transition-all duration-200 active:scale-[0.98]"
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

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleAuth}
                      className="w-full h-14 text-base font-medium rounded-[14px] bg-card dark:bg-[#1a1a1a] border border-border/50 dark:border-white/[0.08] hover:bg-accent dark:hover:bg-[#242424] hover:border-border dark:hover:border-white/[0.12] transition-all duration-200 active:scale-[0.98] shadow-sm dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.2)]"
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

                    <div className="text-center text-sm pt-2">
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
      <div className="relative" style={{ minHeight: '100dvh', paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 88px)' }}>
      <div className="container mx-auto px-4 pt-16">
      <div className="max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center">
          {/* Avatar */}
          <div className="relative mb-6">
            <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden ring-2 ring-primary/10 dark:ring-primary/20 shadow-sm">
              <Image
                src="/faizaan.jpeg"
                alt="Faizaan Qureshi"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 128px, 160px"
                unoptimized
              />
            </div>
          </div>
          
          {/* Name */}
          <div className="mb-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Faizaan Qureshi
            </h1>
          </div>
          
          {/* Edit Profile Button */}
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs rounded-full border-border/50 bg-transparent hover:bg-muted/50"
              onClick={() => {
                // TODO: Navigate to edit profile
                console.log('Edit profile clicked');
              }}
            >
              Edit Profile
            </Button>
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-1.5 mb-6 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">Waterloo, ON</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mb-6 px-4">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-semibold text-foreground">127</span>
              <span className="text-xs text-muted-foreground">Friends</span>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-semibold text-foreground">43</span>
              <span className="text-xs text-muted-foreground">Reviews</span>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-semibold text-foreground">89</span>
              <span className="text-xs text-muted-foreground">Posts</span>
            </div>
          </div>
          
          {/* Bio */}
          <p className="text-center text-base leading-relaxed text-muted-foreground mb-6 px-4">
            Food enthusiast and explorer. Always on the hunt for the perfect dish and hidden gems in the city.
          </p>
          
          {/* Joined Date */}
          <div className="flex items-center gap-1.5 text-muted-foreground mb-8">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Joined September 2024</span>
          </div>

          {/* Flix & Reviews Tabs */}
          <Tabs defaultValue="flix" className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-12 bg-background/80 backdrop-blur-xl rounded-2xl p-1 border border-border/20 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <TabsTrigger 
                value="flix" 
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/30 transition-all duration-300 ease-out font-medium text-sm"
              >
                Flix
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/30 transition-all duration-300 ease-out font-medium text-sm"
              >
                Reviews
              </TabsTrigger>
            </TabsList>
            <TabsContent value="flix" className="mt-6">
              {/* Flix Masonry Grid */}
              <div className="columns-3 gap-2 space-y-2">
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
                    className="break-inside-avoid mb-2"
                  >
                    <div className="relative rounded-2xl bg-muted overflow-hidden hover:scale-[1.02] hover:shadow-lg transition-all duration-200 ease-out cursor-pointer ring-1 ring-black/5 dark:ring-white/10">
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
              {/* Reviews content will go here */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </div>
    </div>
  );
}


