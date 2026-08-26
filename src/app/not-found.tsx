import Link from "next/link";

function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 text-[15px] font-extrabold tracking-tight text-inherit no-underline">
      <span className="brand-mark" aria-hidden="true" />
      AI TIER MAKER<span className="text-[#c8f04b]">.</span>
    </Link>
  );
}

export default function NotFound() {
  return (
    <>
      <header className="site-header">
        <div className="mx-auto flex max-w-[1100px] items-center px-5 py-3">
          <Brand />
        </div>
      </header>
      <main className="blank-page">
        <div>
          <p className="mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#c8f04b]">404</p>
          <h1 className="mt-2 text-[clamp(28px,5vw,44px)] font-black tracking-tight">Page not found</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#8b8f98]">That route does not exist. Head back to the board.</p>
          <Link href="/" className="btn btn-primary mt-6">
            Back to AI Tier Maker
          </Link>
        </div>
      </main>
    </>
  );
}
