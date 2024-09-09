"use client";

import { ZoomUserMeetingType } from "@/utils/types";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatetimePicker } from "./ui/datetime-picker";

function findAvailableUsers(
  zoomUserMeetings: ZoomUserMeetingType[],
  searchStartTime: Date,
  searchEndTime: Date
): string[] {
  // Filter users who do not have any meetings overlapping the search time window
  return zoomUserMeetings
    .filter(
      (user) =>
        !user.meetings.some(
          (meeting) => meeting.start_time < searchEndTime && meeting.end_time > searchStartTime // Check if meeting overlaps the search time
        )
    )
    .map((user) => user.user_email); // Return the emails of available users
}

export function AvailableUsersSearch({
  zoomUserMeetings,
}: {
  zoomUserMeetings: ZoomUserMeetingType[];
}) {
  const defaultDateValue = new Date();
  defaultDateValue.setMinutes(0, 0, 0);
  const [searchStartTime, setSearchStartTime] = useState<Date>(defaultDateValue);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(30);

  function searchAvailableUsers() {
    const searchEndTime = new Date(searchStartTime.getTime() + duration * 60 * 1000);
    setAvailableUsers(findAvailableUsers(zoomUserMeetings, searchStartTime, searchEndTime));
  }

  // function formatUserEmail(userEmail: string) {
  //   return userEmail.split("@")[0];
  // }

  return (
    <div>
      <div>
        <span>Select starting time: </span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !searchStartTime && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {searchStartTime ? format(searchStartTime, "PPP, HH:mm") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <DatetimePicker
              selected={searchStartTime}
              setDate={setSearchStartTime}
              duration={duration}
              setDuration={setDuration}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <button
          onClick={searchAvailableUsers}
          className="mt-4 py-2 px-3 flex rounded-md bg-slate-500/20 hover:bg-slate-500/30"
        >
          Search
        </button>
      </div>

      <ul className="mt-4">
        {availableUsers.map((userEmail) => (
          <li className="font-bold" key={userEmail}>
            - {userEmail}
          </li>
        ))}
        {availableUsers.length === 0 && <li className="font-bold">No available accounts on this time</li>}
      </ul>
    </div>
  );
}
