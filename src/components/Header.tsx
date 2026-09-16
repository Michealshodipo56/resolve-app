import Link from "next/link";
import { WalletButton } from "./WalletButton";

const NAV = [
  { href: "/", label: "Markets" },
  { href: "/create", label: "Create" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Header() {
  return (
    <header className="border-b border-ink-line bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-content items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <div className="flex items-baseline gap-8">
          <Link href="/" className="group">
            <span className="font-serif text-2xl tracking-tight text-ink">
              Resolve
            </span>
            <span className="ml-2 hidden text-xs uppercase tracking-[0.18em] text-ink-faint sm:inline">
              Markets
            </span>
          </Link>
          <nav className="hidden items-center gap-5 sm:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <WalletButton />
      </div>
      <nav
        className="flex gap-4 border-t border-ink-line px-4 py-2 sm:hidden"
        aria-label="Mobile"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-ink-soft hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
