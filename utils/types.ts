export type SingleUserMeetings = {
  meetings: {
    start_time: Date;
    end_time: Date;
  }[];
  userEmail: string;
  adminEmail: string;
};

export type ZoomUserMeetingType = {
  usersMeetings: SingleUserMeetings[];
  email: string;
};

export type ZoomSingleUserMeetings = {
  meetings: {
    start_time: string;
    duration: number;
  }[];
};

export type ZoomUsersResponse = {
  users: ZoomUserResponse[];
};

export type ZoomUserResponse = {
  email: string;
  display_name: string;
  id: string;
};

export type SupabaseIntegration = {
  id: string;
  access_token: string;
  valid_to: string;
  account_id: string;
  client_id: string;
  decrypted_client_secret: string;
  zoom_user_email: string;
};

export type ZoomError = {
  error: string;
  reason: string;
};
