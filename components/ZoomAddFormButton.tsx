import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useFormStatus } from "react-dom";

export default function ZoomAddFormButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting & Adding
        </Button>
      ) : (
        <Button type="submit">Connect & Add</Button>
      )}
    </>
  );
}
