import type { Metadata } from "next";
import "./styles/globals.css";
import { Footer } from "./components/blog/Footer";
import { Header } from "./components/blog/Header";

export const metadata: Metadata = {
  title: {
    default: "Blog",
    template: "%s | Blog",
  },
  description: "Artigos, notas e publicacoes recentes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main className="min-h-screen pt-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
