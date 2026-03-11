import "../styles/global.css";
import { Providers } from "./providers";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "MERN Skill Test",
  description: "Recruitment dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={cn("font-sans", inter.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
