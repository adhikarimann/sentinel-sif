import { Link } from "react-router";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background text-foreground"
    >
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-primary">
          404 — off the permitted route
        </p>
        <h1 className="mt-3 text-[28px] font-bold tracking-tight">This page isn't on the permit</h1>
        <p className="mt-2 max-w-md text-[13px] text-muted-foreground">
          The route you followed doesn't exist in SIF Sentinel. Head back to the operations screens.
        </p>
        <Link
          to="/command-center"
          className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          🛰 Back to Command Center
        </Link>
      </div>
    </motion.div>
  );
}
