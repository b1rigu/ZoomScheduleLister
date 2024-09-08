import { createClient } from "@/utils/supabase/server";
import { ZoomAccessTokenResponse, ZoomUserResponse } from "@/utils/types";
import { redirect } from "next/navigation";

async function getZoomAccessToken(code: string) {
  try {
    const clientId = process.env.ZOOM_CLIENT_ID; // Use environment variables for security
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const redirectUri = process.env.ZOOM_REDIRECT_URI; // Replace with your Redirect URI

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // Make a request to Zoom's token endpoint to exchange the authorization code for an access token
    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(
        `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`
      ),
      cache: "no-store",
    });

    if (!response.ok) {
      console.log("Error fetching access token:", await response.json());
      return null;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.log("Error fetching access token:", error);
    return null;
  }
}

async function getUserInfo(accessToken: string) {
  try {
    const response = await fetch("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.log("Error fetching user info:", await response.json());
      return null;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.log("Error fetching user info:", error);
    return null;
  }
}

export default async function IntegrationsCallback({
  searchParams,
}: {
  searchParams: { code: string };
}) {
  if (!searchParams.code) {
    return (
      <div className="h-full flex items-center justify-center">
        <h2>No authorization code provided</h2>
      </div>
    );
  }

  const data: ZoomAccessTokenResponse | null = await getZoomAccessToken(searchParams.code);

  if (data) {
    const zoomUserData: ZoomUserResponse | null = await getUserInfo(data.access_token);

    if (zoomUserData) {
      const supabase = createClient();
      await supabase.from("zoom_integrations").insert({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        zoom_user_email: zoomUserData.email,
      });
      redirect("/integrations");
    }
  }

  return (
    <div className="h-full flex items-center justify-center">
      <h2>Authenticating!!!</h2>
    </div>
  );
}
