"use client";

import Link from "next/link";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <header className="site-header">
        <div className="mx-auto flex max-w-[1100px] items-center px-5 py-3">
          <Link href="/" className="inline-flex items-center gap-2.5 text-[15px] font-extrabold tracking-tight text-inherit no-underline">
            <span className="brand-mark" aria-hidden="true" />
            AI TIER MAKER<span className="text-[#c8f04b]">.</span>
          </Link>
        </div>
      </header>
      <main className="blank-page">
        <div>
          <p className="mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#c8f04b]">Error</p>
          <h1 className="mt-2 text-[clamp(28px,5vw,44px)] font-black tracking-tight">Something broke</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#8b8f98]">{error.message || "An unexpected error occurred."}</p>
          <button type="button" className="btn btn-primary mt-6" onClick={() => retry()}>
            Try again
          </button>
        </div>
      </main>
    </>
  );
}
