import Link from "next/link";

export default function NotFound() {
  return (
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
  );
}
