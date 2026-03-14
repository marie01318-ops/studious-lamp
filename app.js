const STORAGE_KEY = "care-flow-console:v1";
const STATUS_ITEMS = [
  "食事",
  "睡眠",
  "排泄",
  "水分",
  "服薬",
  "疼痛",
  "体調",
  "精神状態",
  "活動量",
  "移動",
  "清潔",
  "対人関係",
  "住環境",
];
const STATUS_OPTIONS = ["改善", "維持", "悪化", "変化なし", "気になる点あり"];

const seedEvents = [
  {
    id: crypto.randomUUID(),
    category: "モニタリング",
    userName: "山田 太郎",
    eventDateTime: "2026-03-18T10:00",
    memo: "食事量の変化と夜間睡眠の状況を確認する。",
    completed: false,
    record: "",
    color: "default",
  },
  {
    id: crypto.randomUUID(),
    category: "担当者会議",
    userName: "佐藤 花子",
    eventDateTime: "2026-03-22T14:00",
    memo: "家族との共有事項と福祉サービスの調整状況を確認。",
    completed: false,
    record: "",
    color: "default",
  },
  {
    id: crypto.randomUUID(),
    category: "モニタリング",
    userName: "高橋 恒一",
    eventDateTime: "2026-02-20T09:30",
    memo: "支援経過は保存済み。",
    completed: true,
    record: "前回対応済み",
    color: "8",
  },
];

const state = loadState();

const elements = {
  todayLabel: document.querySelector("#todayLabel"),
  pendingCount: document.querySelector("#pendingCount"),
  selectedName: document.querySelector("#selectedName"),
  messageBanner: document.querySelector("#messageBanner"),
  eventForm: document.querySelector("#eventForm"),
  categoryInput: document.querySelector("#categoryInput"),
  nameInput: document.querySelector("#nameInput"),
  dateInput: document.querySelector("#dateInput"),
  memoInput: document.querySelector("#memoInput"),
  eventList: document.querySelector("#eventList"),
  eventCardTemplate: document.querySelector("#eventCardTemplate"),
  eventDetail: document.querySelector("#eventDetail"),
  statusGrid: document.querySelector("#statusGrid"),
  statusCardTemplate: document.querySelector("#statusCardTemplate"),
  notesInput: document.querySelector("#notesInput"),
  findingsInput: document.querySelector("#findingsInput"),
  nextActionsInput: document.querySelector("#nextActionsInput"),
  aiDraftOutput: document.querySelector("#aiDraftOutput"),
  draftPanel: document.querySelector("#draftPanel"),
  generateDraftButton: document.querySelector("#generateDraftButton"),
  copyDraftButton: document.querySelector("#copyDraftButton"),
  completeButton: document.querySelector("#completeButton"),
  backButton: document.querySelector("#backButton"),
  reloadEventsButton: document.querySelector("#reloadEventsButton"),
  headingButtons: document.querySelector("#headingButtons"),
  tabButtons: document.querySelectorAll("[data-tab]"),
  tabPanels: document.querySelectorAll("[data-tab-panel]"),
};

state.activeTab ||= "register";

elements.eventForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = {
    id: crypto.randomUUID(),
    category: elements.categoryInput.value,
    userName: elements.nameInput.value.trim(),
    eventDateTime: elements.dateInput.value,
    memo: elements.memoInput.value.trim(),
    completed: false,
    record: "",
    color: "default",
  };

  if (!payload.userName || !payload.eventDateTime) {
    showMessage("必須項目を入力してください", true);
    return;
  }

  state.events.unshift(payload);
  state.activeTab = "pending";
  saveState();
  elements.eventForm.reset();
  showMessage("予定を登録しました");
  render();
});

elements.reloadEventsButton.addEventListener("click", () => {
  showMessage("未完了予定一覧を更新しました");
  render();
});

elements.backButton.addEventListener("click", () => {
  state.selectedEventId = null;
  state.activeTab = "pending";
  saveState();
  render();
});

elements.generateDraftButton.addEventListener("click", () => {
  elements.draftPanel.open = true;
  elements.aiDraftOutput.value = buildAiDraft();
  showMessage("Gemini 連携用テキストを更新しました");
});

elements.copyDraftButton.addEventListener("click", async () => {
  elements.draftPanel.open = true;
  elements.aiDraftOutput.value = buildAiDraft();

  try {
    await navigator.clipboard.writeText(elements.aiDraftOutput.value);
    showMessage("Gemini 連携用テキストをコピーしました");
  } catch {
    showMessage("コピーに失敗しました", true);
  }
});

elements.completeButton.addEventListener("click", () => {
  const selected = getSelectedEvent();

  if (!selected) {
    showMessage("対象予定を選択してください", true);
    return;
  }

  const finalRecord = buildFinalRecord();

  if (!finalRecord.trim()) {
    showMessage("支援経過を入力してください", true);
    return;
  }

  selected.completed = true;
  selected.title = `【完了】${selected.category} ${selected.userName}`;
  selected.record = finalRecord;
  selected.color = "8";
  state.selectedEventId = null;
  state.activeTab = "pending";
  saveState();
  showMessage("支援経過を保存し、予定を完了にしました");
  resetRecordInputs();
  render();
});

[elements.notesInput, elements.findingsInput, elements.nextActionsInput].forEach((node) => {
  node.addEventListener("input", () => {
    elements.aiDraftOutput.value = buildAiDraft();
  });
});

elements.headingButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-heading]");

  if (!button) {
    return;
  }

  insertHeading(elements.notesInput, button.dataset.heading);
  elements.aiDraftOutput.value = buildAiDraft();
});

elements.tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.activeTab = button.dataset.tab;
    saveState();
    renderTabs();
  });
});

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return {
      events: seedEvents,
      selectedEventId: null,
      statuses: {},
    };
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      events: seedEvents,
      selectedEventId: null,
      statuses: {},
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  normalizeActiveTab();
  renderSummary();
  renderTabs();
  renderEventList();
  renderSelectedEvent();
  renderStatuses();
  elements.aiDraftOutput.value = buildAiDraft();
  syncDraftPanel();
}

function normalizeActiveTab() {
  if (!state.activeTab) {
    state.activeTab = "pending";
  }

  if (state.activeTab === "record" && !getSelectedEvent()) {
    state.activeTab = "pending";
  }
}

function syncDraftPanel() {
  if (state.activeTab !== "record") {
    elements.draftPanel.open = false;
    return;
  }

  elements.draftPanel.open = Boolean(getSelectedEvent());
}

function renderTabs() {
  elements.tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === state.activeTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.tabPanel === state.activeTab);
  });
}

function renderSummary() {
  const pendingEvents = state.events.filter((event) => !event.completed && isWithinTargetRange(event.eventDateTime));
  elements.todayLabel.textContent = formatDate(new Date(), false);
  elements.pendingCount.textContent = String(pendingEvents.length);
  elements.selectedName.textContent = getSelectedEvent()?.userName || "未選択";
}

function renderEventList() {
  const pendingEvents = state.events
    .filter((event) => !event.completed && isWithinTargetRange(event.eventDateTime))
    .sort((left, right) => new Date(left.eventDateTime) - new Date(right.eventDateTime));

  elements.eventList.innerHTML = "";

  if (pendingEvents.length === 0) {
    const empty = document.createElement("p");
    empty.className = "subtle";
    empty.textContent = "対象期間内の未完了予定はありません。";
    elements.eventList.appendChild(empty);
    return;
  }

  pendingEvents.forEach((eventItem) => {
    const fragment = elements.eventCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".event-card");
    const category = fragment.querySelector(".event-card__category");
    const title = fragment.querySelector("h3");
    const date = fragment.querySelector(".event-card__date");
    const memo = fragment.querySelector(".event-card__memo");
    const button = fragment.querySelector("button");

    category.textContent = eventItem.category;
    title.textContent = `${eventItem.category} ${eventItem.userName}`;
    date.textContent = formatDate(eventItem.eventDateTime, true);
    memo.textContent = eventItem.memo || "事前メモなし";

    if (state.selectedEventId === eventItem.id) {
      card.style.outline = "2px solid rgba(31, 111, 178, 0.35)";
    }

    button.addEventListener("click", () => {
      state.selectedEventId = eventItem.id;
      state.activeTab = "record";
      state.statuses[eventItem.id] ||= {};
      saveState();
      render();
    });

    elements.eventList.appendChild(fragment);
  });
}

function renderSelectedEvent() {
  const selected = getSelectedEvent();
  elements.eventDetail.innerHTML = "";

  const details = [
    ["日時", selected ? formatDate(selected.eventDateTime, true) : "-"],
    ["カテゴリー", selected?.category || "-"],
    ["氏名", selected?.userName || "-"],
    ["事前メモ", selected?.memo || "-"],
  ];

  details.forEach(([term, value]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = value;
    elements.eventDetail.append(dt, dd);
  });
}

function renderStatuses() {
  const selected = getSelectedEvent();
  elements.statusGrid.innerHTML = "";

  STATUS_ITEMS.forEach((item) => {
    const fragment = elements.statusCardTemplate.content.cloneNode(true);
    const title = fragment.querySelector("h4");
    const options = fragment.querySelector(".status-card__options");
    title.textContent = item;

    STATUS_OPTIONS.forEach((option) => {
      const button = document.createElement("button");
      button.className = "button button--status";
      button.type = "button";
      button.textContent = option;

      if (selected && state.statuses[selected.id]?.[item] === option) {
        button.classList.add("is-selected");
      }

      button.addEventListener("click", (event) => {
        event.preventDefault();

        if (!selected) {
          showMessage("先に未完了予定を選択してください", true);
          return;
        }

        state.statuses[selected.id] ||= {};
        state.statuses[selected.id][item] = option;
        saveState();
        renderStatuses();
        elements.aiDraftOutput.value = buildAiDraft();
      });

      options.appendChild(button);
    });

    elements.statusGrid.appendChild(fragment);
  });
}

function buildAiDraft() {
  const selected = getSelectedEvent();

  if (!selected) {
    return "未完了予定を選択すると、Gemini 用の整形文がここに表示されます。";
  }

  const statuses = state.statuses[selected.id] || {};
  const lines = STATUS_ITEMS.map((item) => `- ${item}: ${statuses[item] || "未入力"}`).join("\n");

  return [
    "以下の内容をもとに、介護・福祉現場向けの支援経過記録を自然な日本語で作成してください。",
    "",
    `【対象者】${selected.userName}`,
    `【予定】${selected.category}`,
    `【日時】${formatDate(selected.eventDateTime, true)}`,
    `【事前メモ】${selected.memo || "なし"}`,
    "",
    "【状態】",
    lines,
    "",
    "【支援経過メモ】",
    elements.notesInput.value.trim() || "未入力",
    "",
    "【所見】",
    elements.findingsInput.value.trim() || "未入力",
    "",
    "【次回確認事項】",
    elements.nextActionsInput.value.trim() || "未入力",
  ].join("\n");
}

function buildFinalRecord() {
  const selected = getSelectedEvent();

  if (!selected) {
    return "";
  }

  const statuses = state.statuses[selected.id] || {};
  const statusSummary = STATUS_ITEMS.map((item) => `${item}:${statuses[item] || "未入力"}`).join(" / ");

  return [
    `【対象者】${selected.userName}`,
    `【予定】${selected.category}`,
    `【状態】${statusSummary}`,
    `【支援経過】${elements.notesInput.value.trim() || "未入力"}`,
    `【所見】${elements.findingsInput.value.trim() || "未入力"}`,
    `【次回確認事項】${elements.nextActionsInput.value.trim() || "未入力"}`,
  ].join("\n");
}

function getSelectedEvent() {
  return state.events.find((event) => event.id === state.selectedEventId) || null;
}

function resetRecordInputs() {
  elements.notesInput.value = "";
  elements.findingsInput.value = "";
  elements.nextActionsInput.value = "";
  elements.aiDraftOutput.value = "";
}

function formatDate(value, withTime) {
  const date = typeof value === "string" ? new Date(value) : value;
  const options = withTime
    ? { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "2-digit", day: "2-digit" };

  return new Intl.DateTimeFormat("ja-JP", options).format(date);
}

function isWithinTargetRange(dateTime) {
  const target = new Date(dateTime);
  const base = new Date();
  const start = new Date(base);
  const end = new Date(base);
  start.setMonth(start.getMonth() - 2);
  end.setMonth(end.getMonth() + 1);
  return target >= start && target <= end;
}

function showMessage(message, isError = false) {
  elements.messageBanner.hidden = false;
  elements.messageBanner.textContent = message;
  elements.messageBanner.classList.toggle("is-error", isError);
}

function insertHeading(textarea, heading) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const insertion = `${heading}\n`;
  textarea.value = `${before}${insertion}${after}`;
  textarea.focus({ preventScroll: true });
  const cursor = start + insertion.length;
  textarea.setSelectionRange(cursor, cursor);
}

render();
