"use server";

import { getAccessToken, getAccountOwnerEmail } from "@/lib/myUtils";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const checkIfLoggedIn = async () => {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    return false;
  }
  return true;
};

export const addZoomIntegration = async (formData: FormData): Promise<"Success" | "Error"> => {
  if (!(await checkIfLoggedIn())) {
    return "Error";
  }

  const accountId = formData.get("accountId") as string;
  const clientId = formData.get("clientId") as string;
  const clientSecret = formData.get("clientSecret") as string;

  if (!accountId || !clientId || !clientSecret) {
    return "Error";
  }

  try {
    const accessToken = (await getAccessToken(accountId, clientId, clientSecret)).accessToken;
    const supabase = createClient();
    const { data: zoomUserIntegration, error: checkError } = await supabase
      .from("zoom_integrations")
      .select("account_id")
      .eq("account_id", accountId);

    if (checkError) {
      throw checkError;
    }

    if (zoomUserIntegration && zoomUserIntegration.length === 0) {
      const ownerEmail = await getAccountOwnerEmail(accessToken);
      const { error: insertError } = await supabase.from("zoom_integrations").insert({
        access_token: accessToken,
        account_id: accountId,
        client_id: clientId,
        client_secret: clientSecret,
        zoom_user_email: ownerEmail,
      });

      if (insertError) {
        throw insertError;
      }
    }

    revalidatePath("/integrations");
    return "Success";
  } catch (error) {
    console.log("Error adding zoom account:", error);
    return "Error";
  }
};
