import { performance } from "node:perf_hooks";

const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error("Ошибка: не указан URL.");
  console.error("Пример запуска: node measure.mjs https://example.com/large-image.jpg");
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(targetUrl);
} catch {
  console.error(`Ошибка: некорректный URL — "${targetUrl}"`);
  process.exit(1);
}

const REQUESTS_COUNT = 10;
let totalBytes = 0;
let totalDurationMs = 0;

console.log(`Запуск замера скорости (${REQUESTS_COUNT} последовательных запросов)...`);
console.log(`URL: ${parsedUrl.href}\n`);

for (let i = 0; i < REQUESTS_COUNT; i++) {
  const startTime = performance.now();
  let response;

  try {
    response = await fetch(parsedUrl, { cache: "no-store" });
  } catch (error) {
    const reason = error.cause?.message || error.message;
    console.error(`\nСетевая ошибка на запросе #${i + 1}: ${reason}`);
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`\nОшибка: запрос #${i + 1} завершился со статусом HTTP ${response.status}`);
    process.exit(1);
  }

  let payload;
  try {
    payload = await response.arrayBuffer();
  } catch (error) {
    const reason = error.cause?.message || error.message;
    console.error(`\nОшибка чтения тела ответа на запросе #${i + 1}: ${reason}`);
    process.exit(1);
  }

  const elapsedMs = performance.now() - startTime;
  const bytesDownloaded = payload.byteLength;

  totalBytes += bytesDownloaded;
  totalDurationMs += elapsedMs;

  console.log(
    `[${i + 1}/${REQUESTS_COUNT}] ${(bytesDownloaded / (1024 * 1024)).toFixed(2)} МиБ за ${elapsedMs.toFixed(0)} мс`
  );
}

const averageTimeMs = totalDurationMs / REQUESTS_COUNT;
const totalDurationSec = totalDurationMs / 1000;
const totalMebibytes = totalBytes / (1024 * 1024);

// МиБ/с — двоичные мебибайты в секунду (1 МиБ = 1024 * 1024 байт)
// Мбит/с — сетевые мегабиты в секунду (1 Мбит = 1 000 000 бит)
const speedMiBps = totalMebibytes / totalDurationSec;
const speedMbps = (totalBytes * 8) / 1_000_000 / totalDurationSec;

console.log("\n--- Результаты ---");
console.log(`Выполнено запросов: ${REQUESTS_COUNT}`);
console.log(`Общий объём данных: ${totalMebibytes.toFixed(2)} МиБ (${totalBytes} байт)`);
console.log(`Среднее время запроса: ${averageTimeMs.toFixed(2)} мс`);
console.log(`Средняя скорость скачивания: ${speedMiBps.toFixed(2)} МиБ/с (${speedMbps.toFixed(2)} Мбит/с)`);
