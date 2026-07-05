import "./globals.css";

export const metadata = {
  title: "Crypto Wallet Demo",
  description: "Cybersecurity awareness demo - How crypto scams work",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
