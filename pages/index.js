function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto grid min-h-screen max-w-listing items-center gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
            Area inicial
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-bold text-primary">
            Bem-vindo ao sistema
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-muted">
            Acesse sua conta para continuar usando as areas autenticadas.
          </p>
        </div>

        <div className="rounded-lg border border-[rgb(var(--color-border))] bg-surface p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
            Acesso
          </p>
          <h2 className="mt-3 text-3xl font-bold text-primary">
            Pronto para entrar?
          </h2>
          <p className="mt-3 text-base leading-7 text-muted">
            Use a tela de login para iniciar uma sessao com seu email e senha.
          </p>
          <a
            className="mt-8 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-surface transition hover:opacity-90"
            href="/login"
          >
            Entrar
          </a>
        </div>
      </section>
    </main>
  );
}

export default Home;
