"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
// import { DateRange } from "react-day-picker";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export function DatePickerWithRange({ className, onDateChange }) {
  const [date, setDate] = React.useState({
    // from: new Date(2022, 3, 2),
    // to: addDays(new Date(2022, 3, 2), 0),
    from: null,
    to: null,
  });
  const [open, setOpen] = React.useState(false);
  const prevDateRef = React.useRef({ from: "", to: "" });

  // Default month for calendar
  const defaultMonth = new Date(2022, 3, 1); // April 2022 (month is 0-based)

  React.useEffect(() => {
    if (!date?.from || !date?.to || !onDateChange) return;

    const fromStr = format(date.from, "yyyy-MM-dd");
    const toStr = format(date.to, "yyyy-MM-dd");

    // Avoid redundant calls
    if (
      prevDateRef.current?.from === fromStr &&
      prevDateRef.current?.to === toStr
    ) {
      return;
    }

    prevDateRef.current = { from: fromStr, to: toStr };
    // onDateChange(fromStr, toStr);
  }, [date, onDateChange]);

  const handleButton = () => {
    const fromStr = format(date.from, "yyyy-MM-dd");
    const toStr = format(date.to, "yyyy-MM-dd");
    onDateChange(fromStr, toStr);
    setOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={defaultMonth}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
          <Button
            className={cn("w-[120px] font-normal text-center")}
            onClick={handleButton}
          >
            <span>Submit</span>
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
