import { NavLink, Link } from "react-router";
import { cn } from "@/lib/utils";
import { SignalDot } from "./ui";

const NAV = [
  { to: "/command-center", emoji: "🛰", label: "Command Center", hint: "Signals & alerts" },
  { to: "/investigator", emoji: "🔍", label: "Report Investigator", hint: "Analyse a report" },
  { to: "/network", emoji: "🧬", label: "Precursor Network", hint: "Connections & patterns" },
  { to: "/sites", emoji: "📍", label: "Site Intelligence", hint: "Heatmap by site" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-[5px] bg-primary text-[13px] font-bold text-primary-foreground">
                S
              </span>
              <div>
                <div className="text-[13.5px] font-bold leading-tight tracking-tight">SIF SENTINEL</div>
                <div className="font-mono-tech text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  Precursor Intelligence
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-2.5 py-3">
            <div className="px-2 pb-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
              Operations
            </div>
            <ul className="space-y-0.5">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-start gap-2.5 rounded-[5px] px-2.5 py-2 transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground/75 hover:bg-muted hover:text-foreground",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="mt-0.5 text-[13px] leading-none">{item.emoji}</span>
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block truncate text-[12.5px] font-medium leading-tight",
                              isActive && "font-semibold",
                            )}
                          >
                            {item.label}
                          </span>
                          <span className="block truncate text-[10.5px] text-muted-foreground">
                            {item.hint}
                          </span>
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-2 border-t border-border px-4 py-3.5">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <SignalDot tone="controlled" />
              <span>Intelligence engine online</span>
            </div>
            <div className="font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
              ● Demo Environment
              <br />
              OIL • HSSE
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile nav */}
          <div className="border-b border-border bg-sidebar px-3 py-2 md:hidden">
            <div className="flex items-center gap-2 pb-2">
              <span className="grid size-6 place-items-center rounded-[5px] bg-primary text-[11px] font-bold text-primary-foreground">
                S
              </span>
              <span className="text-[12.5px] font-bold tracking-tight">SIF SENTINEL</span>
              <span className="ml-auto font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                ● Demo • OIL HSSE
              </span>
            </div>
            <nav className="flex gap-1 overflow-x-auto">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "whitespace-nowrap rounded-[5px] px-2.5 py-1.5 text-[11.5px] font-medium",
                      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted",
                    )
                  }
                >
                  <span className="mr-1">{item.emoji}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-border px-6 py-3.5">
            <p className="text-[11px] text-muted-foreground">
              Prototype • Synthetic demonstration data • AI-assisted HSE decision support{" "}
              <Link to="/" className="ml-2 font-medium text-primary/80 transition-colors hover:text-primary">
                About this prototype →
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-6 py-5">
      <div>
        <h1 className="text-[19px] font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
