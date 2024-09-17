import { AvailableUsersSearch } from "@/components/AvailableUsersSearch";
import ZoomAddButton from "@/components/ZoomAddButton";
import { getZoomUsersMeetings } from "@/lib/myUtils";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function disconnectIntegration(formData: FormData) {
  "use server";
  const zoomUserEmail = formData.get("zoomUserEmail");
  const supabase = createClient();
  await supabase.from("zoom_integrations").delete().eq("zoom_user_email", zoomUserEmail);
  revalidatePath("/integrations");
}

export default async function Integrations() {
  const zoomUserMeetings = await getZoomUsersMeetings();

  if (zoomUserMeetings === "Error") {
    return <p>Error fetching meetings</p>;
  }

  const flattenedZoomUserMeetings = zoomUserMeetings.map((meeting) => meeting.usersMeetings).flat();

  return (
    <div className="flex justify-center p-8">
      <div className="flex flex-col gap-4 w-full max-w-4xl">
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold">Search available users</p>
        </div>
        <div>
          <AvailableUsersSearch zoomUserMeetings={flattenedZoomUserMeetings} />
        </div>
        <hr />
        <div className="flex justify-between items-center">
          <p className="text-2xl font-bold">Connected zoom accounts</p>
          <ZoomAddButton />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {zoomUserMeetings.map((subUsersMeetings) => (
            <div
              key={subUsersMeetings.email}
              className="dark:bg-gray-800 bg-gray-300 flex flex-col rounded-xl p-4 drop-shadow-lg gap-2"
            >
              <p className="text-lg font-bold">{subUsersMeetings.email}</p>
              <p>{subUsersMeetings.usersMeetings.length} users</p>
              {subUsersMeetings.usersMeetings.map((subUser) => (
                <div key={subUser.userEmail}>
                  <hr className="border-gray-200 border-1 w-full mb-2" />
                  <p>{subUser.userEmail}</p>
                  <p>Upcoming meetings: {subUser.meetings.length}</p>
                </div>
              ))}
              {/* Learnt how to use form action and that you can't pass arguments to it other than the form data it auto passes */}
              <form action={disconnectIntegration}>
                <input type="hidden" name="zoomUserEmail" value={subUsersMeetings.email} />
                <button
                  type="submit"
                  className="py-1 px-2 flex rounded-md bg-red-400/60 hover:bg-red-500/80"
                >
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
