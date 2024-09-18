"use client";

import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function ShowToast({ error }: { error: string | null }) {
  const { toast } = useToast();
  useEffect(() => {
    toast({
      title: "Error fetching meetings",
      description: error || "Unexpected error occured",
      variant: "destructive",
    });
  }, []);

  return <></>;
}
