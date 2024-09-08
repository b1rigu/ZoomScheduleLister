export type ZoomUserMeetingType = {
  meetings: {
    start_time: Date;
    end_time: Date;
  }[];
  user_email: string;
};

export type ZoomMeetings = {
  meetings: {
    start_time: string;
    duration: number;
    timezone: string;
  }[];
};

export type ZoomAccessTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type ZoomUserResponse = {
  email: string;
  display_name: string;
  id: string;
};