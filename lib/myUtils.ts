import {
  ZoomUsersResponse,
  SingleUserMeetings,
  ZoomSingleUserMeetings,
  ZoomUserResponse,
  ZoomUserMeetingType,
  SupabaseIntegration,
  ZoomError,
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

export async function getAccountOwnerEmail(accessToken: string): Promise<string> {
  try {
    const response = await fetch("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: {
        revalidate: 10,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const data = await response.json();

    return data.email;
  } catch (error) {
    console.log("Error getting email:", error);
    throw error;
  }
}

async function getActiveUsersOfSingleAccount(accessToken: string): Promise<ZoomUsersResponse> {
  try {
    const response = await fetch("https://api.zoom.us/v2/users?page_size=300", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: {
        revalidate: 10,
      },
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
  adminEmail: string
): Promise<SingleUserMeetings> {
  try {
    const response = await fetch(
      `https://api.zoom.us/v2/users/${userId}/meetings?type=upcoming&page_size=300`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        next: {
          revalidate: 10,
        },
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
      adminEmail: adminEmail,
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
    adminEmail: string;
  }[],
  limit = 2,
  interval = 1000
) {
  const results = [];
  let queue = [];

  const moreCustomUsersResponses = customUsersResponses
    .map((customUserResponse) => {
      return customUserResponse.users.map((user) => {
        return {
          userEmail: user.email,
          accessToken: customUserResponse.accessToken,
          userId: user.id,
          adminEmail: customUserResponse.adminEmail,
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
          userResponses.adminEmail
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

function groupByAdmin(singleUserMeetings: SingleUserMeetings[]): ZoomUserMeetingType[] {
  const grouped = singleUserMeetings.reduce(
    (acc: { [key: string]: SingleUserMeetings[] }, curr) => {
      if (!acc[curr.adminEmail]) {
        acc[curr.adminEmail] = [];
      }
      acc[curr.adminEmail].push(curr);
      return acc;
    },
    {}
  );

  return Object.keys(grouped).map((adminEmail) => ({
    email: adminEmail,
    usersMeetings: grouped[adminEmail],
  }));
}

function isZoomError(obj: any): obj is ZoomError {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.error === "string" &&
    typeof obj.reason === "string"
  );
}

function handleZoomAPIError(error: any) {
  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (isZoomError(error)) {
    errorMessage = error.error;
  } else {
    errorMessage = "Unexpected error occured";
  }
  return {
    zoomUserMeetings: null,
    error: errorMessage,
  };
}

export async function getZoomUsersMeetings(): Promise<{
  zoomUserMeetings: ZoomUserMeetingType[] | null;
  error: string | null;
}> {
  const supabase = createClient();
  const { data: zoomIntegrations, error: supabaseZoomIntegrationsError } = await supabase
    .from("decrypted_zoom_integrations")
    .select("id, access_token, valid_to, account_id, client_id, decrypted_client_secret, zoom_user_email")
    .returns<SupabaseIntegration[]>();

  if (supabaseZoomIntegrationsError) {
    return {
      zoomUserMeetings: null,
      error: supabaseZoomIntegrationsError.message,
    };
  }

  if (!zoomIntegrations) {
    return {
      zoomUserMeetings: null,
      error: "Unexpected error fetching integrations",
    };
  }

  const allIntegrationsAccessTokensPromises = zoomIntegrations.map((integration) => {
    const accessTokenExpired = isAccessTokenExpired(integration.valid_to);
    if (accessTokenExpired) {
      return getAccessToken(
        integration.account_id,
        integration.client_id,
        integration.decrypted_client_secret,
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
    return handleZoomAPIError(error);
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
    return handleZoomAPIError(error);
  }

  const customUsersResponses = activeUsersOfSingleAccounts.map((result, index) => {
    return {
      users: result.users,
      accessToken: accessTokens[index],
      adminEmail: zoomIntegrations[index].zoom_user_email,
    };
  });

  return getSingleUserMeetingsWithRateLimit(customUsersResponses, 1, 500)
    .then((userMeetings) => {
      return {
        zoomUserMeetings: groupByAdmin(userMeetings),
        error: null,
      };
    })
    .catch((error) => {
      return handleZoomAPIError(error);
    });
}
