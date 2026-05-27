import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "MOU Builder",
  description: "Prepare MOU documents from a Google Docs template.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
