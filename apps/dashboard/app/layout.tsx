import "./globals.css";

export const metadata = {
  title: "EdgeOps Dashboard",
  description: "EdgeOps Platform frontend dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full w-full">
      <body className="h-full w-full m-0">{children}</body>
    </html>
  );
}
