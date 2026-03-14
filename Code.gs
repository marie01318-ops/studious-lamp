function doGet() {
  const template = HtmlService.createTemplateFromFile("Index");
  return template
    .evaluate()
    .setTitle("Care Flow Console")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getInitialData() {
  return {
    today: new Date().toISOString(),
    categories: CATEGORIES,
    statusItems: STATUS_ITEMS,
    statusOptions: STATUS_OPTIONS,
    headingButtons: HEADING_BUTTONS,
    events: getPendingEvents(),
  };
}

