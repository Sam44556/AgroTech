import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://agrolink-ethiopia.vercel.app'),
  title: {
    default: "AgroLink - Connecting Ethiopian Farmers to Markets",
    template: "%s | AgroLink"
  },
  description: "Empowering Ethiopian farmers by connecting them directly with buyers. Get real-time market prices, expert agricultural advice, weather updates, and maximize profits by eliminating middlemen.",
  keywords: ["Ethiopian agriculture", "farmers market", "agricultural marketplace", "ECX prices", "farm produce", "Ethiopia farming", "agricultural experts", "direct marketing", "crop selling", "agricultural platform"],
  authors: [{ name: "AgroLink" }],
  creator: "AgroLink",
  publisher: "AgroLink",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_ET",
    url: "https://agrolink-ethiopia.vercel.app",
    title: "AgroLink - Connecting Ethiopian Farmers to Markets",
    description: "Empowering Ethiopian farmers by connecting them directly with buyers. Get real-time market prices and expert advice.",
    siteName: "AgroLink",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AgroLink - Ethiopian Agricultural Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgroLink - Connecting Ethiopian Farmers to Markets",
    description: "Empowering Ethiopian farmers by connecting them directly with buyers. Get real-time market prices and expert advice.",
    images: ["/og-image.png"],
    creator: "@AgroLink",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "AgroLink",
              description: "Connecting Ethiopian Farmers to Markets",
              url: "https://agrolink-ethiopia.vercel.app",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://agrolink-ethiopia.vercel.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
