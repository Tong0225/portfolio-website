import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "创意作品集",
  description: "个人创意作品展示平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.cn/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Inter'] antialiased">
        {children}
      </body>
    </html>
  );
}
