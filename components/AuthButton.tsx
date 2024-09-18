import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AuthButton() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signOut = async () => {
    "use server";

    const supabase = createClient();
    await supabase.auth.signOut();
    return redirect("/auth/login");
  };

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-lg">Hey, {user.email}!</span>
      <form action={signOut}>
        <button className="py-2 px-3 flex rounded-md bg-red-500/50 hover:bg-red-500/70">
          Logout
        </button>
      </form>
    </div>
  ) : (
    <Link
      href="/auth/login"
      className="py-2 px-3 flex rounded-md bg-slate-500/20 hover:bg-slate-500/30"
    >
      Login
    </Link>
  );
}
