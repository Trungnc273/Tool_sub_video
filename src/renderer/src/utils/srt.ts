export interface SubtitleSegment {
  id: string;
  index: number;
  start: number; // in milliseconds
  end: number; // in milliseconds
  text: string;
  translatedText: string;
  audioOffset?: number; // individual audio offset in milliseconds
  originalStart?: number;
  originalEnd?: number;
}

// Convert milliseconds to HH:MM:SS,mmm format
export function formatTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  const pad = (num: number, size: number) => num.toString().padStart(size, '0');

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`;
}

// Convert HH:MM:SS,mmm or HH:MM:SS.mmm to milliseconds
export function parseTime(timeStr: string): number {
  const parts = timeStr.trim().replace('.', ',').split(':');
  if (parts.length !== 3) return 0;

  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  
  const secParts = parts[2].split(',');
  const seconds = parseInt(secParts[0], 10) || 0;
  const milliseconds = parseInt(secParts[1], 10) || 0;

  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
}

// Generate unique ID
function uuid(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Parse SRT content into SubtitleSegment array
export function parseSRT(srtContent: string): SubtitleSegment[] {
  const segments: SubtitleSegment[] = [];
  // Normalize line endings
  const normalized = srtContent.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 2) continue;

    const index = parseInt(lines[0], 10);
    if (isNaN(index)) continue;

    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
    if (!timeMatch) continue;

    const start = parseTime(timeMatch[1]);
    const end = parseTime(timeMatch[2]);

    const text = lines.slice(2).join('\n').trim();

    segments.push({
      id: uuid(),
      index,
      start,
      end,
      originalStart: start,
      originalEnd: end,
      text,
      translatedText: '' // default empty, will be translated later
    });
  }

  return segments;
}

// Convert SubtitleSegment array to SRT string
export function stringifySRT(segments: SubtitleSegment[], useTranslation: boolean = false): string {
  return segments
    .map((seg, idx) => {
      const textToUse = useTranslation ? (seg.translatedText || seg.text) : seg.text;
      return `${idx + 1}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${textToUse}`;
    })
    .join('\n\n');
}

// Convert SubtitleSegment array to plain text without timestamps or styling tags
export function stringifyTxt(segments: SubtitleSegment[], useTranslation: boolean = false): string {
  return segments
    .map((seg) => {
      const textToUse = useTranslation ? (seg.translatedText || seg.text) : seg.text;
      // Strip ASS tags like {\an8} and replace \N with space
      return textToUse.replace(/\{[^}]*\}/g, '').replace(/\\N/g, ' ').trim();
    })
    .filter(Boolean)
    .join('\n');
}

export function splitSegmentsBySentences(segments: SubtitleSegment[]): SubtitleSegment[] {
  const result: SubtitleSegment[] = [];
  let newIndex = 1;

  for (const seg of segments) {
    const splitSegs = splitSegment(seg);
    for (const s of splitSegs) {
      result.push({
        ...s,
        index: newIndex++
      });
    }
  }

  return result;
}

function splitSegment(seg: SubtitleSegment): SubtitleSegment[] {
  const text = seg.text.trim();
  if (!text) return [];

  // 1. Try splitting by primary punctuations first (。！？.!?)
  let delimiters = '。！？.!?';
  let sentences = splitTextByDelimiters(text, delimiters);

  // 2. If it didn't split and the segment is long, try splitting by commas (，,)
  const isChinese = /[\u4e00-\u9fa5]/.test(text);
  const lengthThreshold = isChinese ? 12 : 30;

  if (sentences.length <= 1 && (text.length > lengthThreshold || (seg.end - seg.start) > 4000)) {
    delimiters = '。！？.!?，,';
    sentences = splitTextByDelimiters(text, delimiters);
  }

  if (sentences.length <= 1) {
    return [seg];
  }

  const result: SubtitleSegment[] = [];
  const totalLen = sentences.join('').length;
  const totalDuration = seg.end - seg.start;
  let currentStart = seg.start;

  sentences.forEach((sentence, idx) => {
    const sentLen = sentence.length;
    const sentDuration = Math.round((sentLen / totalLen) * totalDuration);
    let currentEnd = currentStart + sentDuration;

    if (idx === sentences.length - 1) {
      currentEnd = seg.end;
    }

    result.push({
      id: Math.random().toString(36).substring(2, 9),
      index: seg.index,
      start: currentStart,
      end: currentEnd,
      originalStart: currentStart,
      originalEnd: currentEnd,
      text: sentence,
      translatedText: ''
    });

    currentStart = currentEnd;
  });

  return result;
}

function splitTextByDelimiters(text: string, delimiters: string): string[] {
  const parts: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    current += char;
    if (delimiters.includes(char)) {
      parts.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts.filter(p => p.length > 0);
}
