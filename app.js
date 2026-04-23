const fileInput = document.getElementById("fileInput");
const chunkSizeInput = document.getElementById("chunkSizeInput");
const prefixInput = document.getElementById("prefixInput");
const splitBtn = document.getElementById("splitBtn");
const statusEl = document.getElementById("status");
const resultList = document.getElementById("resultList");
const downloadAllBtn = document.getElementById("downloadAllBtn");

let generatedFiles = [];

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#9f1239" : "#1f2f38";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(field);
      if (row.length > 1 || row[0] !== "") {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function escapeCsvField(value) {
  const safeValue = value == null ? "" : String(value);
  if (/[",\n\r]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

function toCsv(rows) {
  return rows
    .map((r) => r.map((field) => escapeCsvField(field)).join(","))
    .join("\r\n");
}

function clearResults() {
  generatedFiles = [];
  resultList.innerHTML = "";
  downloadAllBtn.disabled = true;
}

function renderResults() {
  resultList.innerHTML = "";

  generatedFiles.forEach((fileObj) => {
    const li = document.createElement("li");
    li.className = "result-item";

    const left = document.createElement("div");
    left.innerHTML = `<strong>${fileObj.name}</strong><div class="result-meta">${fileObj.recordCount.toLocaleString()} records</div>`;

    const link = document.createElement("a");
    link.className = "download";
    link.href = fileObj.url;
    link.download = fileObj.name;
    link.textContent = "Download";

    li.appendChild(left);
    li.appendChild(link);
    resultList.appendChild(li);
  });

  downloadAllBtn.disabled = generatedFiles.length === 0;
}

function splitRows(rows, chunkSize) {
  const header = rows[0];
  const dataRows = rows.slice(1);
  const chunks = [];

  for (let i = 0; i < dataRows.length; i += chunkSize) {
    const chunk = dataRows.slice(i, i + chunkSize);
    chunks.push([header, ...chunk]);
  }

  return chunks;
}

splitBtn.addEventListener("click", async () => {
  clearResults();

  const file = fileInput.files?.[0];
  const chunkSize = Number(chunkSizeInput.value || 10000);
  const prefixRaw = prefixInput.value.trim();
  const prefix = prefixRaw || "split_list";

  if (!file) {
    setStatus("Please select a CSV file first.", true);
    return;
  }

  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    setStatus("Records per file must be a whole number greater than 0.", true);
    return;
  }

  setStatus("Reading and splitting file...");

  try {
    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length <= 1) {
      setStatus("The file has no data rows to split.", true);
      return;
    }

    const chunks = splitRows(rows, chunkSize);

    generatedFiles = chunks.map((chunkRows, idx) => {
      const csvContent = toCsv(chunkRows);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      return {
        name: `${prefix}_part_${idx + 1}.csv`,
        url,
        recordCount: chunkRows.length - 1,
      };
    });

    renderResults();
    setStatus(
      `Done. Created ${generatedFiles.length} files from ${(rows.length - 1).toLocaleString()} total records.`
    );
  } catch (error) {
    setStatus(`Failed to split file: ${error.message}`, true);
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) {
    const nameWithoutExt = file.name.replace(/\.csv$/i, "");
    prefixInput.value = nameWithoutExt;
  }
});

downloadAllBtn.addEventListener("click", () => {
  if (!generatedFiles.length) return;

  generatedFiles.forEach((fileObj, index) => {
    setTimeout(() => {
      const tempLink = document.createElement("a");
      tempLink.href = fileObj.url;
      tempLink.download = fileObj.name;
      tempLink.style.display = "none";
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();
    }, index * 160);
  });
});
