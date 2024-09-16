import { AvailableUsersSearch } from "@/components/AvailableUsersSearch";
import { ZoomAddButton } from "@/components/ZoomAddButton";
import { createClient } from "@/utils/supabase/server";
import {
  SupabaseIntegration,
  ZoomAccessTokenResponse,
  ZoomMeetings,
  ZoomUserMeetingType,
} from "@/utils/types";

async function refreshAccessToken(refreshToken: string): Promise<ZoomAccessTokenResponse | null> {
  try {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

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

async function getSingleUserMeetings(accessToken: string): Promise<ZoomMeetings | null> {
  try {
    const response = await fetch(
      "https://api.zoom.us/v2/users/me/meetings?type=upcoming&page_size=300",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Error fetching user info:", error);
    return null;
  }
}

function isAccessTokenExpired(validToString: string): boolean {
  const currentDate = new Date();
  const validToDate = new Date(validToString);
  return validToDate < currentDate;
}

async function getZoomUsersMeetings(): Promise<ZoomUserMeetingType[]> {
  let zoomUserMeetings: ZoomUserMeetingType[] = [];

  const supabase = createClient();
  const { data: zoom_integrations } = await supabase
    .from("zoom_integrations")
    .select("access_token, refresh_token, zoom_user_email, valid_to")
    .returns<SupabaseIntegration[]>();

  if (zoom_integrations) {
    for (const zoom_integration of zoom_integrations) {
      let accessToken = zoom_integration.access_token;
      const accessTokenExpired = isAccessTokenExpired(zoom_integration.valid_to);
      if (accessTokenExpired) {
        const refreshedTokens = await refreshAccessToken(zoom_integration.refresh_token);
        if (refreshedTokens) {
          accessToken = refreshedTokens.access_token;
          await supabase
            .from("zoom_integrations")
            .update({
              access_token: refreshedTokens.access_token,
              refresh_token: refreshedTokens.refresh_token,
            })
            .eq("zoom_user_email", zoom_integration.zoom_user_email);
        }
      }

      const singleUserMeetings = await getSingleUserMeetings(accessToken);
      if (singleUserMeetings) {
        zoomUserMeetings.push({
          meetings: singleUserMeetings.meetings.map((meeting) => {
            const startTime = new Date(meeting.start_time);
            const endTime = new Date(startTime.getTime() + meeting.duration * 60 * 1000);
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

  return zoomUserMeetings;
}

function disconnectIntegration(zoomUserEmail: string) {
  const supabase = createClient();
  supabase.from("zoom_integrations").delete().eq("zoom_user_email", zoomUserEmail);
}

export default async function Integrations() {
  const zoomUserMeetings = await getZoomUsersMeetings();

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {zoomUserMeetings.map((oneUserMeetings) => (
            <div
              key={oneUserMeetings.user_email}
              className="dark:bg-gray-800 bg-gray-300 flex flex-col justify-between items-center rounded-xl p-4 drop-shadow-lg gap-2"
            >
              <div>
                <p className="text-lg font-bold">{oneUserMeetings.user_email}</p>
                <p>Upcoming meetings: {oneUserMeetings.meetings.length}</p>
              </div>
              <form action={() => disconnectIntegration(oneUserMeetings.user_email)}>
                <button type="submit" className="py-1 px-2 flex rounded-md bg-red-400/60 hover:bg-red-500/80">
                  Disconnect
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
