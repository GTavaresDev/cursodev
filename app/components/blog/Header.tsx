import Link from "next/link";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgb(var(--color-border))] bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-listing items-center justify-between px-4 py-4">
        <Link className="text-lg font-bold text-primary" href="/">
          Blog
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-muted">
          <Link className="transition hover:text-primary" href="/">
            Posts
          </Link>
          <Link className="transition hover:text-primary" href="/categories">
            Categorias
          </Link>
          <Link className="transition hover:text-primary" href="/login">
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
