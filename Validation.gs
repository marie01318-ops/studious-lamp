function validateCreateEventPayload(payload) {
  const normalized = {
    category: normalizeString_(payload && payload.category),
    userName: normalizeString_(payload && payload.userName),
    eventDateTime: normalizeString_(payload && payload.eventDateTime),
    memo: normalizeString_(payload && payload.memo),
  };

  if (!normalized.category || CATEGORIES.indexOf(normalized.category) === -1) {
    throw new Error("カテゴリーを選択してください。");
  }

  if (!normalized.userName) {
    throw new Error("氏名を入力してください。");
  }

  if (!normalized.eventDateTime) {
    throw new Error("日時を入力してください。");
  }

  return normalized;
}

function validateCompleteEventPayload(payload) {
  const normalized = {
    eventId: normalizeString_(payload && payload.eventId),
    finalRecord: normalizeString_(payload && payload.finalRecord),
    statuses: payload && payload.statuses ? payload.statuses : {},
    notes: normalizeString_(payload && payload.notes),
    findings: normalizeString_(payload && payload.findings),
    nextActions: normalizeString_(payload && payload.nextActions),
    aiDraft: normalizeString_(payload && payload.aiDraft),
  };

  if (!normalized.eventId) {
    throw new Error("対象予定を選択してください。");
  }

  if (!normalized.finalRecord) {
    throw new Error("支援経過を入力してください。");
  }

  return normalized;
}

function normalizeString_(value) {
  return value == null ? "" : String(value).trim();
}

