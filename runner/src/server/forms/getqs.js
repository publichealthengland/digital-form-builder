const fs = require("fs");

const analyzeQuestionsAndAnswers = (jsonData) => {
  const results = [];

  // Create a map of list names to their items
  const listMap = new Map();
  if (jsonData.lists && Array.isArray(jsonData.lists)) {
    jsonData.lists.forEach((list) => {
      listMap.set(list.name, list.items.map((item) => item.text).join(" | "));
    });
  }

  // Process each page
  jsonData.pages.forEach((page) => {
    if (page.components && Array.isArray(page.components)) {
      page.components.forEach((component) => {
        if (component.title && component.name) {
          // Get answer options if available
          const answers = component.list
            ? listMap.get(component.list) || component.list
            : "";

          results.push({
            title: component.title.trim(),
            name: component.name,
            type: component.type || "",
            answers: answers,
            hint: component.hint || "",
            summaryTitle: component.options?.summaryTitle || "",
          });
        }
      });
    }
  });

  return results;
};

try {
  const rawData = fs.readFileSync("ReportAnOutbreak.json", "utf8");
  const jsonData = JSON.parse(rawData);

  const analysis = analyzeQuestionsAndAnswers(jsonData);

  // Create TSV content using tab as separator
  const headers = [
    "Title",
    "Name",
    "Type",
    "Answer Options",
    "Hint",
    "Summary Title",
  ];
  const tsvRows = [
    headers.join("\t"),
    ...analysis.map((item) =>
      [
        item.title.trim(),
        item.name,
        item.type,
        item.answers,
        item.hint,
        item.summaryTitle,
      ].join("\t")
    ),
  ];

  // Write to TSV file
  fs.writeFileSync("questions_analysis_v2.tsv", tsvRows.join("\n"));
  console.log("TSV file has been created: questions_analysis_v2.tsv");

  // Also log to console for verification
  console.log("\nFirst few entries:");
  console.log(tsvRows.slice(0, 5).join("\n"));
} catch (error) {
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
}
