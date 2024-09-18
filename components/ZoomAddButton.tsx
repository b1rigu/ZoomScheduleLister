"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useRef, useState } from "react";
import { addZoomIntegration } from "@/actions/actions";
import ZoomAddFormButton from "./ZoomAddFormButton";

export default function ZoomAddButton() {
  const ref = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<boolean>(false);

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Add zoom account</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add zoom account</DialogTitle>
            <DialogDescription>
              Add Admin account app information here to connect to Zoom.
            </DialogDescription>
          </DialogHeader>
          <form
            ref={ref}
            action={async (formData) => {
              const result = await addZoomIntegration(formData);
              if (result === "Success") {
                setError(false);
                ref.current?.reset();
              } else {
                setError(true);
              }
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountId" className="text-right">
                  Account Id
                </Label>
                <Input type="password" name="accountId" id="accountId" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientId" className="text-right">
                  Client Id
                </Label>
                <Input type="password" name="clientId" id="clientId" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientSecret" className="text-right">
                  Client Secret
                </Label>
                <Input
                  type="password"
                  name="clientSecret"
                  id="clientSecret"
                  className="col-span-3"
                  required
                />
              </div>
              {error && (
                <div className="text-end">
                  <p className="text-red-500 text-sm">Failed to connect zoom account</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <ZoomAddFormButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
