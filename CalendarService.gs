function getCalendar_() {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    throw new Error("Google カレンダーにアクセスできません。");
  }
  return calendar;
}

function createCalendarEvent(payload) {
  const data = validateCreateEventPayload(payload);
  const calendar = getCalendar_();
  const start = new Date(data.eventDateTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const title = data.category + " " + data.userName;
  const description = buildEventDescription_({
    memo: data.memo,
    record: "",
  });

  const event = calendar.createEvent(title, start, end, {
    description: description,
  });

  return formatEvent_(event);
}

function getPendingEvents() {
  const calendar = getCalendar_();
  const base = new Date();
  const start = new Date(base);
  const end = new Date(base);
  start.setMonth(start.getMonth() - LOOKBACK_MONTHS);
  end.setMonth(end.getMonth() + LOOKAHEAD_MONTHS);

  return calendar
    .getEvents(start, end)
    .filter(function(event) {
      return event.getTitle().indexOf(COMPLETED_PREFIX) === -1;
    })
    .sort(function(a, b) {
      return a.getStartTime().getTime() - b.getStartTime().getTime();
    })
    .map(formatEvent_);
}

function getEventDetail(eventId) {
  const event = getEventById_(eventId);
  return formatEvent_(event);
}

function completeEvent(payload) {
  const data = validateCompleteEventPayload(payload);
  const event = getEventById_(data.eventId);
  const current = parseEventDescription_(event.getDescription());
  const currentTitle = event.getTitle();
  const nextTitle = currentTitle.indexOf(COMPLETED_PREFIX) === 0
    ? currentTitle
    : COMPLETED_PREFIX + currentTitle;

  event.setTitle(nextTitle);
  event.setDescription(buildEventDescription_({
    memo: current.memo,
    record: data.finalRecord,
  }));
  event.setColor(COMPLETED_COLOR_ID);

  return formatEvent_(event);
}

function getEventById_(eventId) {
  const calendar = getCalendar_();
  const event = calendar.getEventById(eventId);
  if (!event) {
    throw new Error("対象予定が見つかりません。");
  }
  return event;
}

function formatEvent_(event) {
  const title = event.getTitle();
  const parsedTitle = parseTitle_(title);
  const parsedDescription = parseEventDescription_(event.getDescription());

  return {
    id: event.getId(),
    title: title,
    category: parsedTitle.category,
    userName: parsedTitle.userName,
    start: event.getStartTime().toISOString(),
    end: event.getEndTime().toISOString(),
    memo: parsedDescription.memo,
    record: parsedDescription.record,
    description: event.getDescription() || "",
    colorId: event.getColor(),
    completed: title.indexOf(COMPLETED_PREFIX) === 0,
  };
}

function parseTitle_(title) {
  const cleaned = String(title || "").replace(COMPLETED_PREFIX, "").trim();
  const matched = CATEGORIES.filter(function(category) {
    return cleaned.indexOf(category + " ") === 0 || cleaned === category;
  })[0];

  if (!matched) {
    return {
      category: "",
      userName: cleaned,
    };
  }

  return {
    category: matched,
    userName: cleaned.slice(matched.length).trim(),
  };
}

function buildEventDescription_(sections) {
  return [
    "【事前メモ】",
    sections.memo || "なし",
    "",
    "【支援経過】",
    sections.record || "未入力",
  ].join("\n");
}

function parseEventDescription_(description) {
  const text = String(description || "");
  const memoMatch = text.match(/【事前メモ】\n([\s\S]*?)\n\n【支援経過】/);
  const recordMatch = text.match(/【支援経過】\n([\s\S]*)$/);

  return {
    memo: memoMatch ? memoMatch[1].trim() : "",
    record: recordMatch ? recordMatch[1].trim() : "",
  };
}

