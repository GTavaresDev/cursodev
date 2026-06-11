import type { Metadata } from "next";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Autenticacao",
    template: "%s | Autenticacao",
  },
  description: "Acesso autenticado ao sistema.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
