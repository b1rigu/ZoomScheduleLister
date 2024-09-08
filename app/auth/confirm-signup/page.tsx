import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";

// You have to change the email template in the supabase dashboard to include {{ ..Token }} in the body
// and add button to redirect to this page with the email {{ .SiteURL }}/auth/confirm-signup?email={{ .Email }}
function ConfirmLoginPage({
  searchParams,
}: {
  searchParams: { email: string; message?: string; redirect?: string };
}) {
  if (!searchParams.email) {
    return redirect("/");
  }

  const confirmOTP = async (formData: FormData) => {
    "use server";

    const otp = formData.get("otp") as string;
    const supabase = createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: "signup",
      token: otp,
      email: searchParams.email,
    });

    if (error) {
      if (searchParams.redirect)
        return redirect(
          `/auth/confirm-signup?email=${searchParams.email}&message=${error.message}&redirect=${searchParams.redirect}`
        );
      return redirect(`/auth/confirm-signup?email=${searchParams.email}&message=${error.message}`);
    }

    if (searchParams.redirect) return redirect(searchParams.redirect);
    return redirect("/integrations");
  };

  return (
    <div className="flex h-full justify-center items-center">
      <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
        <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
          <label className="text-md" htmlFor="otp">
            OTP
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border mb-6"
            name="otp"
            placeholder="••••••"
            required
          />
          <SubmitButton
            formAction={confirmOTP}
            className="border border-foreground/20 rounded-md px-4 py-2 text-foreground mb-2"
            pendingText="Confirming..."
          >
            Confirm
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

export default ConfirmLoginPage;
