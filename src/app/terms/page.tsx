import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-16 sm:px-6">
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Terms of Use
        </h1>
        <p className="text-base text-muted-foreground">
          Mirch is rolling out gradually. While we polish the official terms,
          here’s what you can expect: use the product respectfully, share only
          experiences you have rights to, and contact us if you believe
          something needs to be removed or corrected.
        </p>
        <p className="text-base text-muted-foreground">
          By participating in the beta, you agree that features may change
          quickly. We will always notify you before making any material changes
          that affect data ownership or access.
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
