// import type { Metadata } from "next";
// import "./globals.css";

// export const metadata: Metadata = {
//   title: "PRMS-AI | Patient Record Management System",
//   description: "Agentic AI Patient Record Management System with LangChain & RBAC",
// };

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
//     </html>
//   );
// }
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRMS-AI | Patient Record Management System",
  description: "Agentic AI Patient Record Management System with LangChain & RBAC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-sky-100/80 via-teal-50/70 to-indigo-100/80 text-slate-900 antialiased selection:bg-teal-200 selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}