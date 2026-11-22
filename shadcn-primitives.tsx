// import React from "react";
// import { cn } from "@/lib/utils";

// export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
//   return (
//     <div className={cn("rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm", className)}>
//       {children}
//     </div>
//   );
// }

// export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
//   return <div className={cn("flex flex-col space-y-1 p-5 pb-2", className)}>{children}</div>;
// }

// export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
//   return <h3 className={cn("text-base font-semibold tracking-tight text-slate-900", className)}>{children}</h3>;
// }

// export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
//   return <div className={cn("p-5 pt-2", className)}>{children}</div>;
// }

// export function Badge({
//   variant = "default",
//   className,
//   children,
// }: {
//   variant?: "default" | "success" | "warning" | "danger";
//   className?: string;
//   children: React.ReactNode;
// }) {
//   const styles = {
//     default: "bg-slate-100 text-slate-800 border-slate-200",
//     success: "bg-emerald-50 text-emerald-700 border-emerald-200",
//     warning: "bg-amber-50 text-amber-800 border-amber-200",
//     danger: "bg-rose-50 text-rose-700 border-rose-200",
//   };
//   return (
//     <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", styles[variant], className)}>
//       {children}
//     </span>
//   );
// }

// export function AlertBox({
//   variant = "info",
//   className,
//   children,
// }: {
//   variant?: "info" | "danger";
//   className?: string;
//   children: React.ReactNode;
// }) {
//   const styles =
//     variant === "danger"
//       ? "border-rose-300 bg-rose-50 text-rose-900"
//       : "border-sky-200 bg-sky-50 text-sky-900";
//   return <div className={cn("rounded-lg border p-3.5 text-sm", styles, className)}>{children}</div>;
// }
import React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  accent = "teal",
  children,
}: {
  className?: string;
  accent?: "teal" | "indigo" | "amber" | "rose" | "sky";
  children: React.ReactNode;
}) {
  const accentMap = {
    teal: "border-t-4 border-t-teal-500 bg-gradient-to-b from-teal-50/40 to-white",
    indigo: "border-t-4 border-t-indigo-500 bg-gradient-to-b from-indigo-50/40 to-white",
    amber: "border-t-4 border-t-amber-500 bg-gradient-to-b from-amber-50/40 to-white",
    rose: "border-t-4 border-t-rose-500 bg-gradient-to-b from-rose-50/40 to-white",
    sky: "border-t-4 border-t-sky-500 bg-gradient-to-b from-sky-50/40 to-white",
  };
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/90 text-slate-900 shadow-md shadow-slate-900/5 transition-all",
        accentMap[accent],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col space-y-1 p-5 pb-2", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn("text-base font-semibold tracking-tight text-slate-900", className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5 pt-2", className)}>{children}</div>;
}

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
  children: React.ReactNode;
}) {
  const styles = {
    default: "bg-indigo-50 text-indigo-800 border-indigo-200",
    success: "bg-emerald-100/80 text-emerald-800 border-emerald-300",
    warning: "bg-amber-100/80 text-amber-900 border-amber-300",
    danger: "bg-rose-100/80 text-rose-800 border-rose-300",
    info: "bg-sky-100/80 text-sky-800 border-sky-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function AlertBox({
  variant = "info",
  className,
  children,
}: {
  variant?: "info" | "danger";
  className?: string;
  children: React.ReactNode;
}) {
  const styles =
    variant === "danger"
      ? "border-rose-300 bg-gradient-to-r from-rose-50 to-orange-50 text-rose-950"
      : "border-sky-200 bg-gradient-to-r from-sky-50 to-teal-50 text-sky-950";
  return <div className={cn("rounded-xl border p-3.5 text-sm", styles, className)}>{children}</div>;
} 