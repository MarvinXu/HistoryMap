import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "历迹 - 交互式历史学习工具",
  description: "Interactive History Map Learning Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-gray-50 overflow-hidden antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
