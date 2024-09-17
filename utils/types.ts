export type SingleUserMeetings = {
  meetings: {
    start_time: Date;
    end_time: Date;
  }[];
  userEmail: string;
  adminIndex: number;
};

export type ZoomUserMeetingType = {
  usersMeetings: SingleUserMeetings[];
  index: number;
};

export type ZoomSingleUserMeetings = {
  meetings: {
    start_time: string;
    duration: number;
  }[];
};

export type ZoomUsersResponse = {
  users: ZoomUserResponse[];
}

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
  client_secret: string;
};
