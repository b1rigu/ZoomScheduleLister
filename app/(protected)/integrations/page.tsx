import { AvailableUsersSearch } from "@/components/AvailableUsersSearch";
import { ZoomAddButton } from "@/components/ZoomAddButton";
import { createClient } from "@/utils/supabase/server";
import { ZoomAccessTokenResponse, ZoomMeetings, ZoomUserMeetingType } from "@/utils/types";

async function refreshAccessToken(refreshToken: string) {
  try {
    const clientId = process.env.ZOOM_CLIENT_ID; // Use environment variables for security
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // Make a request to Zoom's token endpoint to exchange the authorization code for an access token
    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(`grant_type=refresh_token&refresh_token=${refreshToken}`),
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

async function getUserMeetings(accessToken: string) {
  try {
    const response = await fetch("https://api.zoom.us/v2/users/me/meetings?type=upcoming", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code == 124) return "expired";
      return null;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.log("Error fetching user info:", error);
    return null;
  }
}

export default async function Integrations() {
  const supabase = createClient();

  // gets notes from the notes table if available
  const { data: zoom_integrations } = await supabase.from("zoom_integrations").select();

  let zoomUserMeetings: ZoomUserMeetingType[] = [];

  if (zoom_integrations) {
    for (const zoom_integration of zoom_integrations) {
      let zoomMeetings: ZoomMeetings | null | "expired" = await getUserMeetings(
        zoom_integration.access_token
      );
      if (zoomMeetings == "expired") {
        const refreshedAccessToken: ZoomAccessTokenResponse | null = await refreshAccessToken(
          zoom_integration.refresh_token
        );
        if (refreshedAccessToken) {
          await supabase
            .from("zoom_integrations")
            .update({
              access_token: refreshedAccessToken.access_token,
              refresh_token: refreshedAccessToken.refresh_token,
            })
            .eq("zoom_user_email", zoom_integration.zoom_user_email);
          zoomMeetings = await getUserMeetings(refreshedAccessToken.access_token);
        }
      }
      if (zoomMeetings != null && zoomMeetings != "expired") {
        zoomUserMeetings.push({
          meetings: zoomMeetings.meetings.map((meeting) => {
            const startTime = new Date(meeting.start_time);
            const endTime = new Date(startTime.getTime() + 60 * 60000);
            return {
              start_time: startTime,
              end_time: endTime,
            };
          }),
          user_email: zoom_integration.zoom_user_email,
        });
      }
    }
  }

  return (
    <div className="flex justify-center p-8">
      <div className="flex flex-col gap-4 w-full max-w-4xl">
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold">Search available users</p>
        </div>
        <div>
          <AvailableUsersSearch zoomUserMeetings={zoomUserMeetings} />
        </div>
        <hr />
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold">Connected zoom accounts</p>
          <ZoomAddButton />
        </div>
        {zoomUserMeetings.map((oneUserMeetings, index) => (
          <p key={oneUserMeetings.user_email}>
            {index + 1}. {oneUserMeetings.user_email}
          </p>
        ))}
      </div>
    </div>
  );
}
