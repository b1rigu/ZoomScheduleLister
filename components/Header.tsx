import Link from "next/link";
import AuthButton from "./AuthButton";
import { DarkModeToggle } from "./DarkModeToggle";

export function Header() {
  return (
    <nav className="flex justify-center border-b h-16">
      <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm">
        <AuthButton />
        <div className="flex gap-4">
          <Link href="/">
            <div className="py-2 px-3 flex rounded-md bg-slate-500/20 hover:bg-slate-500/30">
              Home
            </div>
          </Link>
          <Link href="/integrations">
            <div className="py-2 px-3 flex rounded-md bg-slate-500/20 hover:bg-slate-500/30">
              Integrations
            </div>
          </Link>
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
}
