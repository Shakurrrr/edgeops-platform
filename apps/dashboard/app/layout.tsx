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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
