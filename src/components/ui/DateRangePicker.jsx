import React from "react";
import * as DatePicker from "@ark-ui/react/date-picker";
import { format } from "date-fns";

export function DateRangePicker({ onDateChange }) {
  const [selected, setSelected] = React.useState();

  React.useEffect(() => {
    if (selected?.start && selected?.end) {
      const from = format(new Date(selected.start), "yyyy-MM-dd");
      const to = format(new Date(selected.end), "yyyy-MM-dd");
      onDateChange(from, to);
    }
  }, [selected]);

  return (
    <DatePicker.Root
      selectionMode="range"
      value={selected}
      onValueChange={(e) => setSelected(e)}
    >
      <DatePicker.Label>Pick a date range</DatePicker.Label>
      <DatePicker.Control>
        <DatePicker.Input
          placeholder="Start date"
          position="start"
          className="border p-2 rounded-l"
        />
        <DatePicker.Input
          placeholder="End date"
          position="end"
          className="border p-2 rounded-r"
        />
      </DatePicker.Control>
      <DatePicker.Content className="mt-2 border rounded shadow bg-white z-50">
        <DatePicker.PresetGroup>
          <DatePicker.Preset value="today">Today</DatePicker.Preset>
          <DatePicker.Preset value="last7Days">Last 7 Days</DatePicker.Preset>
        </DatePicker.PresetGroup>
        <DatePicker.View>
          <DatePicker.Header>
            <DatePicker.PrevTrigger>{"<"}</DatePicker.PrevTrigger>
            <DatePicker.Label />
            <DatePicker.NextTrigger>{">"}</DatePicker.NextTrigger>
          </DatePicker.Header>
          <DatePicker.Table>
            <DatePicker.TableHead />
            <DatePicker.TableBody />
          </DatePicker.Table>
        </DatePicker.View>
      </DatePicker.Content>
    </DatePicker.Root>
  );
}
