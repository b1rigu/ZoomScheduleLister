import {
  ZoomUsersResponse,
  SingleUserMeetings,
  ZoomSingleUserMeetings,
  ZoomUserResponse,
  ZoomUserMeetingType,
  SupabaseIntegration,
} from "@/utils/types";
import { createClient } from "@/utils/supabase/server";

export async function getAccessToken(
  accountId: string,
  clientId: string,
  clientSecret: string,
  id?: string
) {
  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "account_credentials",
        account_id: accountId,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const data = await response.json();

    return {
      accessToken: data.access_token as string,
      id: id,
    };
  } catch (error) {
    console.log("Error getting access token:", error);
    throw error;
  }
}

function isAccessTokenExpired(validToString: string): boolean {
  const currentDate = new Date();
  const validToDate = new Date(validToString);
  return validToDate < currentDate;
}

async function getActiveUsersOfSingleAccount(accessToken: string): Promise<ZoomUsersResponse> {
  try {
    const response = await fetch("https://api.zoom.us/v2/users?page_size=300", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.log("Error fetching users:", error);
    throw error;
  }
}

async function getSingleUserMeetings(
  accessToken: string,
  userId: string,
  userEmail: string,
  adminIndex: number
): Promise<SingleUserMeetings> {
  try {
    const response = await fetch(
      `https://api.zoom.us/v2/users/${userId}/meetings?type=upcoming&page_size=300`,
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

    const data = (await response.json()) as ZoomSingleUserMeetings;

    return {
      meetings: data.meetings.map((meeting) => {
        const startTime = new Date(meeting.start_time);
        const endTime = new Date(startTime.getTime() + meeting.duration * 60 * 1000);
        return {
          start_time: startTime,
          end_time: endTime,
        };
      }),
      userEmail: userEmail,
      adminIndex: adminIndex,
    };
  } catch (error) {
    console.log("Error fetching meetings:", error);
    throw error;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSingleUserMeetingsWithRateLimit(
  customUsersResponses: {
    users: ZoomUserResponse[];
    accessToken: string;
  }[],
  limit = 2,
  interval = 1000
) {
  const results = [];
  let queue = [];

  const moreCustomUsersResponses = customUsersResponses
    .map((customUserResponse, index) => {
      return customUserResponse.users.map((user) => {
        return {
          userEmail: user.email,
          accessToken: customUserResponse.accessToken,
          userId: user.id,
          adminIndex: index,
        };
      });
    })
    .flat();

  for (let i = 0; i < moreCustomUsersResponses.length; i += limit) {
    queue = moreCustomUsersResponses
      .slice(i, i + limit)
      .map((userResponses) =>
        getSingleUserMeetings(
          userResponses.accessToken,
          userResponses.userId,
          userResponses.userEmail,
          userResponses.adminIndex
        )
      );

    // Wait for the promises to resolve and push results
    try {
      const batchResults = await Promise.all(queue);
      results.push(...batchResults);
    } catch (error) {
      throw error;
    }

    // Wait for the specified interval (e.g., 1 second) before continuing
    if (i + limit < moreCustomUsersResponses.length) {
      await delay(interval);
    }
  }

  return results;
}

function groupByAdminIndex(data: SingleUserMeetings[]): ZoomUserMeetingType[] {
  const grouped = data.reduce<Record<number, SingleUserMeetings[]>>((acc, item) => {
    const key = item.adminIndex;

    // If the group for this key doesn't exist, create an empty array for it
    if (!acc[key]) {
      acc[key] = [];
    }

    // Add the current item to the group
    acc[key].push(item);

    return acc;
  }, {});

  // Convert the grouped object into an array of ZoomUserMeetingType
  return Object.keys(grouped).map((key) => ({
    index: Number(key),
    usersMeetings: grouped[Number(key)],
  }));
}

export async function getZoomUsersMeetings(): Promise<ZoomUserMeetingType[] | "Error"> {
  const supabase = createClient();
  const { data: zoomIntegrations } = await supabase
    .from("zoom_integrations")
    .select("id, access_token, valid_to, account_id, client_id, client_secret")
    .returns<SupabaseIntegration[]>();

  if (!zoomIntegrations) {
    return [];
  }

  const allIntegrationsAccessTokensPromises = zoomIntegrations.map((integration) => {
    const accessTokenExpired = isAccessTokenExpired(integration.valid_to);
    if (accessTokenExpired) {
      return getAccessToken(
        integration.account_id,
        integration.client_id,
        integration.client_secret,
        integration.id
      );
    }
    return integration.access_token;
  });

  let accessTokens: string[] = [];
  try {
    accessTokens = await Promise.all(allIntegrationsAccessTokensPromises).then((results) => {
      return results.map((result) => {
        if (typeof result === "string") {
          return result;
        }

        if (!result) {
          throw new Error("No access token");
        }

        supabase
          .from("zoom_integrations")
          .update({
            access_token: result.accessToken,
          })
          .eq("id", result.id)
          .then();
        return result.accessToken;
      });
    });
  } catch (error) {
    console.error("Error: ", error);
    return "Error";
  }

  const activeUsersOfSingleAccountsPromises = accessTokens.map((accessToken) => {
    return getActiveUsersOfSingleAccount(accessToken);
  });

  let activeUsersOfSingleAccounts: ZoomUsersResponse[] = [];

  try {
    activeUsersOfSingleAccounts = await Promise.all(activeUsersOfSingleAccountsPromises).then(
      (results) => {
        return results.map((result) => {
          if (!result) {
            throw new Error("No active users");
          }
          return {
            users: result.users,
          };
        });
      }
    );
  } catch (error) {
    console.error("Error: ", error);
    return "Error";
  }

  const customUsersResponses = activeUsersOfSingleAccounts.map((result, index) => {
    return {
      users: result.users,
      accessToken: accessTokens[index],
    };
  });

  return getSingleUserMeetingsWithRateLimit(customUsersResponses, 1, 500)
    .then((userMeetings) => {
      return groupByAdminIndex(userMeetings);
    })
    .catch((error) => {
      console.log("Error:", error);
      return "Error";
    });
}
