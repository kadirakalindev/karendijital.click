"use client";

import { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: Record<string, any>;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (info: EventClickArg) => void;
  onDateSelect: (info: DateSelectArg) => void;
  onEventDrop: (info: EventDropArg) => void;
  onEventResize: (info: EventResizeDoneArg) => void;
  onDatesSet: (start: string, end: string) => void;
  initialDate?: string;
}

export default function CalendarView({
  events,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onEventResize,
  onDatesSet,
  initialDate,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      initialDate={initialDate}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "timeGridDay,timeGridWeek,dayGridMonth",
      }}
      locale="tr"
      firstDay={1}
      slotMinTime="07:00:00"
      slotMaxTime="23:00:00"
      slotDuration="00:15:00"
      slotLabelInterval="01:00:00"
      slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
      eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
      allDaySlot={false}
      selectable={true}
      selectMirror={true}
      editable={true}
      eventResizableFromStart={false}
      dayMaxEvents={true}
      weekends={true}
      nowIndicator={true}
      height="auto"
      contentHeight={650}
      events={events}
      select={onDateSelect}
      eventClick={onEventClick}
      eventDrop={onEventDrop}
      eventResize={onEventResize}
      datesSet={(dateInfo) => {
        onDatesSet(dateInfo.startStr, dateInfo.endStr);
      }}
      buttonText={{
        today: "Bugun",
        month: "Ay",
        week: "Hafta",
        day: "Gun",
      }}
    />
  );
}
