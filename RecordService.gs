function buildAiPrompt(payload) {
  const safe = payload || {};
  const statuses = safe.statuses || {};
  const statusLines = STATUS_ITEMS.map(function(item) {
    return "- " + item + ": " + (statuses[item] || "未入力");
  }).join("\n");

  return [
    "以下の内容をもとに、介護・福祉現場向けの支援経過記録を自然な日本語で作成してください。",
    "",
    "【対象者】" + normalizeString_(safe.userName),
    "【予定】" + normalizeString_(safe.category),
    "【日時】" + normalizeString_(safe.eventDateTimeLabel),
    "【事前メモ】" + (normalizeString_(safe.memo) || "なし"),
    "",
    "【状態】",
    statusLines,
    "",
    "【支援経過メモ】",
    normalizeString_(safe.notes) || "未入力",
    "",
    "【所見】",
    normalizeString_(safe.findings) || "未入力",
    "",
    "【次回確認事項】",
    normalizeString_(safe.nextActions) || "未入力",
  ].join("\n");
}

function buildFinalRecord(payload) {
  const safe = payload || {};
  const statuses = safe.statuses || {};
  const statusSummary = STATUS_ITEMS.map(function(item) {
    return item + ":" + (statuses[item] || "未入力");
  }).join(" / ");

  return [
    "【状態】",
    statusSummary || "未入力",
    "",
    "【支援経過メモ】",
    normalizeString_(safe.notes) || "未入力",
    "",
    "【所見】",
    normalizeString_(safe.findings) || "未入力",
    "",
    "【次回確認事項】",
    normalizeString_(safe.nextActions) || "未入力",
  ].join("\n");
}

