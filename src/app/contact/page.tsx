import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-16 sm:px-6">
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Contact Mirch
        </h1>
        <p className="text-base text-muted-foreground">
          We love hearing from diners, creators, and restaurant teams. Choose
          the channel that matches what you need and we’ll get back to you
          within a day.
        </p>
        <ul className="space-y-4 text-base text-muted-foreground">
          <li>
            Partnerships:{' '}
            <a
              href="mailto:hello@mirch.app"
              className="font-medium text-primary hover:underline"
            >
              hello@mirch.app
            </a>
          </li>
          <li>
            Press & media:{' '}
            <a
              href="mailto:press@mirch.app"
              className="font-medium text-primary hover:underline"
            >
              press@mirch.app
            </a>
          </li>
          <li>
            Support:{' '}
            <a
              href="mailto:support@mirch.app"
              className="font-medium text-primary hover:underline"
            >
              support@mirch.app
            </a>
          </li>
        </ul>
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
