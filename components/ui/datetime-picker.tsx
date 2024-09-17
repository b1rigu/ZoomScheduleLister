"use client";

import * as React from "react";
import {
  CalendarCheck,
  CalendarClock,
  CalendarCog,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DayPicker, DayPickerSingleProps, useNavigation } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";

export type DatetimePickerProps = Omit<DayPickerSingleProps, "mode" | "onSelect"> & {
  setDate: (date: Date) => void;
  setDuration: (duration: number) => void;
  duration: number;
};

function DatetimePicker({
  className,
  classNames,
  showOutsideDays = true,
  duration,
  setDate: setGlobalDate,
  setDuration: setGlobalDuration,
  ...props
}: DatetimePickerProps) {
  const { selected: selectedDate } = props as { selected: Date };
  const minutesArray = Array.from({ length: 12 }, (_, index) => index * 5);
  const hoursArray = Array.from({ length: 24 }, (_, index) => index);
  const durationHours = Math.floor(duration / 60);
  const durationMinutes = duration % 60;

  const setDate = (dateInput: Date) => {
    const date = new Date(selectedDate);
    date.setDate(dateInput.getDate());
    date.setMonth(dateInput.getMonth());
    date.setFullYear(dateInput.getFullYear());
    setGlobalDate(date);
  };
  const setTimeHours = (hours: string) => {
    const hoursNumber = parseInt(hours);
    const time = new Date(selectedDate);
    time.setHours(hoursNumber);
    setGlobalDate(time);
  };
  const setTimeMinutes = (minutes: string) => {
    const minutesNumber = parseInt(minutes);
    const time = new Date(selectedDate);
    time.setMinutes(minutesNumber);
    setGlobalDate(time);
  };
  const setDuration = (duration: number, indicator: "hours" | "minutes") => {
    if (indicator === "hours") {
      setGlobalDuration(duration * 60 + durationMinutes);
    } else {
      setGlobalDuration(duration + durationHours * 60);
    }
  };
  return (
    <>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={setDate as any}
        showOutsideDays={showOutsideDays}
        className={cn("p-4", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          Footer: () => {
            const { goToDate } = useNavigation();
            return (
              <div>
                <hr className="mt-2" />
                <div className="mt-2 -ml-2 -mr-2">
                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-between "
                      onClick={() => {
                        const chosenDate = new Date();
                        goToDate(chosenDate);
                        setDate(chosenDate);
                      }}
                    >
                      <div className="flex">
                        <CalendarCheck className="h-5 w-5 mr-2" />
                        Today
                      </div>
                      <p className="text-sm text-gray-400 font-normal">
                        {format(new Date(), "PP")}
                      </p>
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-between "
                      onClick={() => {
                        const chosenDate = new Date();
                        chosenDate.setDate(chosenDate.getDate() + 1);
                        goToDate(chosenDate);
                        setDate(chosenDate);
                      }}
                    >
                      <div className="flex">
                        <CalendarCog className="h-5 w-5 mr-2" />
                        Tomorrow
                      </div>
                      <p className="text-sm text-gray-400 font-normal">
                        {format(new Date(new Date().getTime() + 24 * 60 * 60 * 1000), "PP")}
                      </p>
                    </Button>
                  </div>
                  <div>
                    <div>
                      <Button
                        variant="ghost"
                        className="w-full justify-between "
                        onClick={() => {
                          const chosenDate = new Date();
                          chosenDate.setDate(chosenDate.getDate() + 7);
                          goToDate(chosenDate);
                          setDate(chosenDate);
                        }}
                      >
                        <div className="flex">
                          <CalendarClock className="h-5 w-5 mr-2" />
                          Next week
                        </div>
                        <p className="text-sm text-gray-400 font-normal">
                          {format(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), "PP")}
                        </p>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          },
          IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
      <hr className="my-0" />
      <div className="p-4">
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            <Clock className="h-5 w-5" />
            <p className="text-sm font-medium">Time</p>
          </div>
          <div className="font-medium">
            <div className="flex items-center gap-2">
              <Select
                value={selectedDate.getHours().toString()}
                onValueChange={(value) => setTimeHours(value)}
              >
                <SelectTrigger className="w-[65px]">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {hoursArray.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour.toString().length === 1 ? `0${hour}` : hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>:</span>
              <Select
                value={selectedDate.getMinutes().toString()}
                onValueChange={(value) => setTimeMinutes(value)}
              >
                <SelectTrigger className="w-[65px]">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {minutesArray.map((minute) => (
                    <SelectItem key={minute} value={minute.toString()}>
                      {minute.toString().length === 1 ? `0${minute}` : minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <div className="flex gap-2 items-center">
            <Clock className="h-5 w-5" />
            <p className="text-sm font-medium">Duration (hours)</p>
          </div>
          <div className="font-medium">
            <div className="flex items-center gap-2">
              <Select
                value={durationHours.toString()}
                onValueChange={(value) => setDuration(parseInt(value), "hours")}
              >
                <SelectTrigger className="w-[65px]">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {hoursArray.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour.toString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <div className="flex gap-2 items-center">
            <Clock className="h-5 w-5" />
            <p className="text-sm font-medium">Duration (min)</p>
          </div>
          <div className="font-medium">
            <div className="flex items-center gap-2">
              <Select
                value={durationMinutes.toString()}
                onValueChange={(value) => setDuration(parseInt(value), "minutes")}
              >
                <SelectTrigger className="w-[65px]">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {minutesArray.map((minute) => (
                    <SelectItem key={minute} value={minute.toString()}>
                      {minute.toString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

DatetimePicker.displayName = "DatetimePicker";

export { DatetimePicker as DatetimePicker };
