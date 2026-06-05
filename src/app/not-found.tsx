import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-7xl font-bold gradient-text mb-4">404</h1>
      <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center px-6 rounded-full text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-all"
      >
        Back to Home
      </Link>
    </div>
  );
}
