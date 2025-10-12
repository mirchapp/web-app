import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'
  const code = searchParams.get('code')

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('code')

  // Handle OAuth callback
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user needs to complete onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('Profile')
          .select('signup_completed')
          .eq('user_id', user.id)
          .single()

        // If signup not completed, redirect to onboarding
        if (profile && !profile.signup_completed) {
          redirectTo.pathname = '/onboarding'
          redirectTo.searchParams.delete('next')
          return NextResponse.redirect(redirectTo)
        }
      }

      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
    // OAuth error - redirect to login with error
    redirectTo.pathname = '/login'
    redirectTo.searchParams.set('error', error.message)
    return NextResponse.redirect(redirectTo)
  }

  // Handle email OTP verification
  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Check if user needs to complete onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('Profile')
          .select('signup_completed')
          .eq('user_id', user.id)
          .single()

        // If signup not completed, redirect to onboarding
        if (profile && !profile.signup_completed) {
          redirectTo.pathname = '/onboarding'
          redirectTo.searchParams.delete('next')
          return NextResponse.redirect(redirectTo)
        }
      }

      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = '/error'
  return NextResponse.redirect(redirectTo)
}
