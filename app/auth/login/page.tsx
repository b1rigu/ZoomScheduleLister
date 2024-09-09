import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";

export default async function Login({
  searchParams,
}: {
  searchParams: { message: string; redirect?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return redirect("/integrations");

  const signIn = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (searchParams.redirect)
        return redirect(`/auth/login?message=${error.message}&redirect=${searchParams.redirect}`);
      return redirect(`/auth/login?message=${error.message}`);
    }

    if (searchParams.redirect) return redirect(searchParams.redirect);
    return redirect("/integrations");
  };

  const signUp = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (searchParams.redirect)
        return redirect(`/auth/login?message=${error.message}&redirect=${searchParams.redirect}`);
    }

    if (searchParams.redirect)
      return redirect(
        `/auth/confirm-signup?email=${email}&redirect=${searchParams.redirect}&message=Confirmation code has been sent to ${email}. You might have to check your spam folder.`
      );
    return redirect(
      `/auth/confirm-signup?email=${email}&message=Confirmation code has been sent to ${email}. You might have to check your spam folder.`
    );
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
        <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
          <label className="text-md" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="email"
            placeholder="you@example.com"
            required
          />
          <label className="text-md" htmlFor="password">
            Password
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
          <SubmitButton
            formAction={signIn}
            className="bg-green-700 rounded-md px-4 py-2 text-foreground mb-2"
            pendingText="Signing In..."
          >
            Sign In
          </SubmitButton>
          <SubmitButton
            formAction={signUp}
            className="border border-foreground/20 rounded-md px-4 py-2 text-foreground mb-2"
            pendingText="Signing Up..."
          >
            Sign Up
          </SubmitButton>
          {searchParams?.message && (
            <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
              {searchParams.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
