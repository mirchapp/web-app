import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-16 sm:px-6">
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="text-base text-muted-foreground">
          Mirch is currently in limited beta. A full privacy policy is coming
          soon, but the short version is simple: we only collect the information
          required to run your account, keep your preferences in sync, and
          understand how people use the product. We do not sell your data.
        </p>
        <p className="text-base text-muted-foreground">
          Have a question about privacy or want something removed? Reach out to
          us anytime at{' '}
          <a
            href="mailto:privacy@mirch.app"
            className="font-medium text-primary hover:underline"
          >
            privacy@mirch.app
          </a>
          .
        </p>
        <div>
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
