import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Play,
  Pause,
  Cpu,
  Globe,
  Video,
  Download,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Loader,
  Palette,
  Volume2,
  Search,
  X,
  Scissors,
  Undo,
  Redo,
  Layers,
  FileText
} from 'lucide-react'
import { Project } from './Dashboard'
import { AppSettings } from './Settings'
import { parseSRT, stringifySRT, stringifyTxt, formatTime, SubtitleSegment, splitSegmentsBySentences, buildSegmentsFromWords, displayStart } from '../utils/srt'

function fixUtf8Garbage(str: string): string {
  if (!str) return ''
  try {
    if (/[À-ÿ\u0102\u0103\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178]/.test(str)) {
      const cp1258ReverseMap: Record<string, number> = {
        '\u20AC': 0x80, '\u201A': 0x82, '\u0192': 0x83, '\u201E': 0x84, '\u2026': 0x85,
        '\u2020': 0x86, '\u2021': 0x87, '\u02C6': 0x88, '\u2030': 0x89, '\u0160': 0x8A,
        '\u2039': 0x8B, '\u0152': 0x8C, '\u017D': 0x8E, '\u2018': 0x91, '\u2019': 0x92,
        '\u201C': 0x93, '\u201D': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
        '\u02DC': 0x98, '\u2122': 0x99, '\u0161': 0x9A, '\u203A': 0x9B, '\u0153': 0x9C,
        '\u017E': 0x9E, '\u0178': 0x9F,
        '\u0102': 0xC3, // Ă
        '\u0103': 0xE3  // ă
      }
      const bytes = new Uint8Array(str.split('').map((c) => {
        if (cp1258ReverseMap[c] !== undefined) {
          return cp1258ReverseMap[c]
        }
        return c.charCodeAt(0) & 0xff
      }))
      const decoded = new TextDecoder('utf-8').decode(bytes)
      if (decoded && decoded !== str && !decoded.includes('\uFFFD')) {
        return decoded
      }
    }
  } catch (e) {
    // ignore
  }

  // Layer 2: Dictionary fallback
  let result = str

  // Apply contextual rules first
  result = result.split('\u00c6\u00a1\u00e1\u00bb\u0069').join('ườ') // Æ°á»i -> ườ
  result = result.split('Æ°á»i').join('ườ')
  result = result.split('nhá»').join('nhỏ')
  result = result.split('vá»').join('về')
  result = result.split('Ä‘á»').join('đề')
  result = result.split('thá»').join('thở')

  const stableMojibake: [string, string][] = [
    ['\u00e1\u00ba\u00a3', 'ả'],
    ['\u00e1\u00ba\u00a1', 'ạ'],
    ['\u00e1\u00ba\u00b1', 'ằ'],
    ['\u00e1\u00ba\u00af', 'ắ'],
    ['\u00e1\u00ba\u00b3', 'ẳ'],
    ['\u00e1\u00ba\u00b5', 'ẵ'],
    ['\u00e1\u00ba\u00b7', 'ặ'],
    ['\u00e1\u00ba\u00a7', 'ầ'],
    ['\u00e1\u00ba\u00a5', 'ấ'],
    ['\u00e1\u00ba\u00a9', 'ẩ'],
    ['\u00e1\u00ba\u00ab', 'ẫ'],
    ['\u00e1\u00ba\u00ad', 'ậ'],
    ['\u00e1\u00ba\u00a2', 'Ả'],
    ['\u00e1\u00ba\u00a0', 'Ạ'],
    ['\u00e1\u00ba\u00b0', 'Ằ'],
    ['\u00e1\u00ba\u00ae', 'Ắ'],
    ['\u00e1\u00ba\u00b2', 'Ẳ'],
    ['\u00e1\u00ba\u00b4', 'Ẵ'],
    ['\u00e1\u00ba\u00b6', 'Ặ'],
    ['\u00e1\u00ba\u00a6', 'Ầ'],
    ['\u00e1\u00ba\u00a4', 'Ấ'],
    ['\u00e1\u00ba\u00a8', 'Ẩ'],
    ['\u00e1\u00ba\u00aa', 'Ẫ'],
    ['\u00e1\u00ba\u00ac', 'Ậ'],
    ['\u00e1\u00ba\u00bb', 'ẻ'],
    ['\u00e1\u00ba\u00bd', 'ẽ'],
    ['\u00e1\u00ba\u00b9', 'ẹ'],
    ['\u00e1\u00ba\u00bf', 'ế'],
    ['\u00e1\u00bb\u0192', 'ể'],
    ['\u00e1\u00bb\u2026', 'ễ'],
    ['\u00e1\u00bb\u2021', 'ệ'],
    ['\u00e1\u00ba\u00ba', 'Ẻ'],
    ['\u00e1\u00ba\u00bc', 'Ẽ'],
    ['\u00e1\u00ba\u00b8', 'Ẹ'],
    ['\u00e1\u00bb\u20ac', 'Ề'],
    ['\u00e1\u00ba\u00be', 'Ế'],
    ['\u00e1\u00bb\u201a', 'Ể'],
    ['\u00e1\u00bb\u201e', 'Ễ'],
    ['\u00e1\u00bb\u2020', 'Ệ'],
    ['\u00e1\u00bb\u2030', 'ỉ'],
    ['\u00e1\u00bb\u2039', 'ị'],
    ['\u00e1\u00bb\u02c6', 'Ỉ'],
    ['\u00e1\u00bb\u0160', 'Ị'],
    ['\u00e1\u00bb\u201c', 'ồ'],
    ['\u00e1\u00bb\u2018', 'ố'],
    ['\u00e1\u00bb\u2022', 'ổ'],
    ['\u00e1\u00bb\u2014', 'ỗ'],
    ['\u00e1\u00bb\u2122', 'ộ'],
    ['\u00e1\u00bb\u203a', 'ớ'],
    ['\u00e1\u00bb\u0178', 'ở'],
    ['\u00e1\u00bb\u00a1', 'ỡ'],
    ['\u00e1\u00bb\u00a3', 'ợ'],
    ['\u00e1\u00bb\u017d', 'Ỏ'],
    ['\u00e1\u00bb\u0152', 'Ọ'],
    ['\u00e1\u00bb\u2019', 'Ồ'],
    ['\u00e1\u00bb\u201d', 'Ổ'],
    ['\u00e1\u00bb\u2013', 'Ỗ'],
    ['\u00e1\u00bb\u02dc', 'Ộ'],
    ['\u00e1\u00bb\u0153', 'Ờ'],
    ['\u00e1\u00bb\u0161', 'Ớ'],
    ['\u00e1\u00bb\u017e', 'Ở'],
    ['\u00e1\u00bb\u00a0', 'Ỡ'],
    ['\u00e1\u00bb\u00a2', 'Ợ'],
    ['\u00e1\u00bb\u00a7', 'ủ'],
    ['\u00e1\u00bb\u00a5', 'ụ'],
    ['\u00e1\u00bb\u00ab', 'ừ'],
    ['\u00e1\u00bb\u00a9', 'ứ'],
    ['\u00e1\u00bb\u00ad', 'ử'],
    ['\u00e1\u00bb\u00af', 'ữ'],
    ['\u00e1\u00bb\u00b1', 'ự'],
    ['\u00e1\u00bb\u00a6', 'Ủ'],
    ['\u00e1\u00bb\u00a4', 'Ụ'],
    ['\u00e1\u00bb\u00aa', 'Ừ'],
    ['\u00e1\u00bb\u00a8', 'Ứ'],
    ['\u00e1\u00bb\u00ac', 'Ử'],
    ['\u00e1\u00bb\u00ae', 'Ữ'],
    ['\u00e1\u00bb\u00b0', 'Ự'],
    ['\u00e1\u00bb\u00b3', 'ỳ'],
    ['\u00e1\u00bb\u00b7', 'ỷ'],
    ['\u00e1\u00bb\u00b9', 'ỹ'],
    ['\u00e1\u00bb\u00b5', 'ỵ'],
    ['\u00e1\u00bb\u00b2', 'Ỳ'],
    ['\u00e1\u00bb\u00b6', 'Ỷ'],
    ['\u00e1\u00bb\u00b8', 'Ỹ'],
    ['\u00e1\u00bb\u00b4', 'Ỵ'],
    ['\u00c3\u00a0', 'à'],
    ['\u0102\u00a0', 'à'],
    ['\u00c3\u00a1', 'á'],
    ['\u0102\u00a1', 'á'],
    ['\u00c3\u00a3', 'ã'],
    ['\u0102\u00a3', 'ã'],
    ['\u00c4\u0192', 'ă'],
    ['\u00c2\u0192', 'ă'],
    ['\u00c3\u00a2', 'â'],
    ['\u0102\u00a2', 'â'],
    ['\u00c3\u20ac', 'À'],
    ['\u0102\u20ac', 'À'],
    ['\u00c3\u0192', 'Ã'],
    ['\u0102\u0192', 'Ã'],
    ['\u00c4\u201a', 'Ă'],
    ['\u00c2\u201a', 'Ă'],
    ['\u00c3\u201a', 'Â'],
    ['\u0102\u201a', 'Â'],
    ['\u00c3\u00a8', 'è'],
    ['\u0102\u00a8', 'è'],
    ['\u00c3\u00a9', 'é'],
    ['\u0102\u00a9', 'é'],
    ['\u00c3\u00aa', 'ê'],
    ['\u0102\u00aa', 'ê'],
    ['\u00e1\u00bb', 'ề'],
    ['\u00c3\u02c6', 'È'],
    ['\u0102\u02c6', 'È'],
    ['\u00c3\u2030', 'É'],
    ['\u0102\u2030', 'É'],
    ['\u00c3\u0160', 'Ê'],
    ['\u0102\u0160', 'Ê'],
    ['\u00c3\u00ac', 'ì'],
    ['\u0102\u00ac', 'ì'],
    ['\u00c3\u00ad', 'í'],
    ['\u0102\u00ad', 'í'],
    ['\u00c4\u00a9', 'ĩ'],
    ['\u00c2\u00a9', 'ĩ'],
    ['\u00c3\u0152', 'Ì'],
    ['\u0102\u0152', 'Ì'],
    ['\u00c4\u00a8', 'Ĩ'],
    ['\u00c2\u00a8', 'Ĩ'],
    ['\u00c3\u00b2', 'ò'],
    ['\u0102\u00b2', 'ò'],
    ['\u00c3\u00b3', 'ó'],
    ['\u0102\u00b3', 'ó'],
    ['\u00e1\u00bb', 'ỏ'],
    ['\u00c3\u00b5', 'õ'],
    ['\u0102\u00b5', 'õ'],
    ['\u00e1\u00bb', 'ọ'],
    ['\u00c3\u00b4', 'ô'],
    ['\u0102\u00b4', 'ô'],
    ['\u00c6\u00a1', 'ơ'],
    ['\u00e1\u00bb', 'ờ'],
    ['\u00c3\u2012', 'Ò'],
    ['\u0102\u2012', 'Ò'],
    ['\u00c3\u201c', 'Ó'],
    ['\u0102\u201c', 'Ó'],
    ['\u00c3\u2022', 'Õ'],
    ['\u0102\u2022', 'Õ'],
    ['\u00c3\u201d', 'Ô'],
    ['\u0102\u201d', 'Ô'],
    ['\u00e1\u00bb', 'Ố'],
    ['\u00c6\u00a0', 'Ơ'],
    ['\u00c3\u00b9', 'ù'],
    ['\u0102\u00b9', 'ù'],
    ['\u00c3\u00ba', 'ú'],
    ['\u0102\u00ba', 'ú'],
    ['\u00c5\u00a9', 'ũ'],
    ['\u00ca\u00a9', 'ũ'],
    ['\u00c6\u00b0', 'ư'],
    ['\u00c3\u2122', 'Ù'],
    ['\u0102\u2122', 'Ù'],
    ['\u00c3\u0161', 'Ú'],
    ['\u0102\u0161', 'Ú'],
    ['\u00c5\u00a8', 'Ũ'],
    ['\u00ca\u00a8', 'Ũ'],
    ['\u00c6\u00af', 'Ư'],
    ['\u00c3\u00bd', 'ý'],
    ['\u0102\u00bd', 'ý'],
    ['\u00c4\u2018', 'đ'],
    ['\u00c2\u2018', 'đ'],
    ['\u0102 ', 'à'],
    ['\u00c3', 'Á'],
    ['\u0102', 'Á'],
    ['\u00c3', 'Í'],
    ['\u0102', 'Í'],
    ['\u00c3', 'Ý'],
    ['\u0102', 'Ý'],
    ['\u00c4', 'Đ'],
    ['\u00c2', 'Đ']
  ]

  for (const [garbled, original] of stableMojibake) {
    result = result.split(garbled).join(original)
  }

  // Fallback for remaining á»
  result = result.split('á»').join('o')

  return result
}

function extractVoiceId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  const urlMatch = trimmed.match(/[?&]voiceId=([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  
  const pathMatch = trimmed.match(/\/([a-zA-Z0-9]+)$/);
  if (pathMatch && (trimmed.includes('elevenlabs.io') || trimmed.startsWith('http'))) {
    return pathMatch[1];
  }
  
  return trimmed;
}

// Helper to convert CSS color (hex, rgb, rgba) to ASS format (&HAABBGGRR)
function cssColorToAss(cssColor: string): string {
  if (!cssColor) return '&H00FFFFFF';
  
  const cleanColor = cssColor.trim();
  
  // 1. Hex format: #RRGGBB or #RGB
  if (cleanColor.startsWith('#')) {
    let hex = cleanColor.substring(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = hex.substring(0, 2);
    const g = hex.substring(2, 4);
    const b = hex.substring(4, 6);
    return `&H00${b}${g}${r}`;
  }
  
  // 2. RGB or RGBA format: rgba(r, g, b, a)
  const rgbaMatch = cleanColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0').toUpperCase();
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0').toUpperCase();
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0').toUpperCase();
    let a = '00'; // Default fully opaque
    if (rgbaMatch[4] !== undefined) {
      const alphaVal = parseFloat(rgbaMatch[4]);
      // ASS Alpha: 00 is fully opaque, FF is fully transparent.
      // So Alpha ASS = Math.round((1 - alpha) * 255) in hex
      const alphaHex = Math.round((1 - alphaVal) * 255).toString(16).padStart(2, '0').toUpperCase();
      a = alphaHex;
    }
    return `&H${a}${b}${g}${r}`;
  }
  
  // 3. Named colors fallback
  if (cleanColor === 'transparent') {
    return '&HFFFFFFFF'; // Fully transparent
  }
  
  return '&H00FFFFFF';
}

// Chuyển màu hex + độ trong suốt (0-100%) sang định dạng màu ASS (&HAABBGGRR),
// tái dùng cssColorToAss bằng cách dựng chuỗi rgba trung gian
function hexOpacityToAss(hex: string, opacityPct: number): string {
  const clean = (hex || '#000000').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0');
  const r = parseInt(full.substring(0, 2), 16) || 0;
  const g = parseInt(full.substring(2, 4), 16) || 0;
  const b = parseInt(full.substring(4, 6), 16) || 0;
  const alpha = Math.min(100, Math.max(0, opacityPct)) / 100;
  return cssColorToAss(`rgba(${r},${g},${b},${alpha})`);
}

function formatAssTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((ms % 1000) / 10);
  
  const pad = (num: number, size: number) => num.toString().padStart(size, '0');
  
  return `${hours}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(centiseconds, 2)}`;
}

function convertToAss(
  segments: SubtitleSegment[],
  style: AppSettings['subtitleStyle'],
  videoWidth: number = 1280,
  videoHeight: number = 720
): string {
  const primaryColor = cssColorToAss(style.color);
  const outlineColor = cssColorToAss(style.outlineColor);
  const backColor = cssColorToAss(style.bgColor);
  
  const isBgTransparent = style.bgColor === 'transparent' || 
                          style.bgColor.replace(/\s+/g, '') === 'rgba(0,0,0,0)' || 
                          style.bgColor.replace(/\s+/g, '') === 'rgba(255,255,255,0)';
  
  const borderStyle = isBgTransparent ? '1' : '3';
  const outlineWidth = style.outlineWidth !== undefined ? style.outlineWidth : 2;
  const fontSize = style.fontSize || 24;

  // Swapping outline and backColor colors for BorderStyle 3 (opaque background box) in ASS:
  // ASS uses OutlineColour for drawing the background box in BorderStyle 3.
  const assOutlineColor = borderStyle === '3' ? backColor : outlineColor;
  const assBackColor = borderStyle === '3' ? outlineColor : backColor;

  const playResY = 720;
  const playResX = Math.round(720 * (videoWidth / videoHeight));

  const posX = style.posX !== undefined ? style.posX : 50;
  const posY = style.posY !== undefined ? style.posY : 12;

  const X = Math.round(playResX * (posX / 100));
  const Y = Math.round(playResY * (1 - posY / 100));

  let ass = `[Script Info]
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${fontSize},${primaryColor},&H000000FF,${assOutlineColor},${assBackColor},1,0,0,0,100,100,0,0,${borderStyle},${outlineWidth},0,2,10,10,10,1
`;

  if (style.showBgStrip) {
    // Vị trí/kích thước không giới hạn (kéo tự do trên preview); màu + độ trong suốt
    // tùy chỉnh thay vì đen cố định; \blur tạo hiệu ứng viền mờ như kính mờ (spec 06)
    const stripHeight = style.bgStripHeight !== undefined ? style.bgStripHeight : 8;
    const stripPosY = style.bgStripPosY !== undefined ? style.bgStripPosY : 12;
    const stripWidth = style.bgStripWidth !== undefined ? style.bgStripWidth : 100;
    const stripPosX = style.bgStripPosX !== undefined ? style.bgStripPosX : 50;
    const stripColor = hexOpacityToAss(
      style.bgStripColor || '#15151d',
      style.bgStripOpacity !== undefined ? style.bgStripOpacity : 60
    );

    const centerY = Math.round(playResY * (1 - stripPosY / 100));
    const h = Math.round(playResY * (stripHeight / 100));
    const topY = Math.round(centerY - h / 2);
    const bottomY = Math.round(centerY + h / 2);

    const centerX = Math.round(playResX * (stripPosX / 100));
    const w = Math.round(playResX * (stripWidth / 100));
    const leftX = Math.round(centerX - w / 2);
    const rightX = Math.round(centerX + w / 2);

    ass += `Style: StripStyle,Arial,10,${stripColor},&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1\n`;
    ass += `[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,9:59:59.99,StripStyle,,0,0,0,,{\\pos(0,0)\\blur4\\p1}m ${leftX} ${topY} l ${rightX} ${topY} l ${rightX} ${bottomY} l ${leftX} ${bottomY}{\\p0}\n`;
  } else {
    ass += `[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  }

  // Mốc hiển thị = mốc nói thật - lead-in 200ms (spec 05 FR2), không lấn câu trước
  let prevEnd = 0;
  segments.forEach((seg) => {
    const start = formatAssTime(displayStart(seg.start, prevEnd));
    const end = formatAssTime(seg.end);
    prevEnd = seg.end;
    const text = (seg.translatedText || seg.text).replace(/\n/g, '\\N');
    ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,{\\pos(${X},${Y})}${text}\n`;
  });

  return ass;
}

interface Interval {
  id: string
  start: number
  end: number
}

function assignLanes(intervals: Interval[]): { lanes: Record<string, number>; maxLane: number } {
  const sorted = [...intervals].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start
    return a.end - b.end
  })

  const lanes: Record<string, number> = {}
  const laneEndTimes: number[] = []
  const buffer = 50 // 50ms buffer

  for (const item of sorted) {
    let assignedLane = -1
    for (let i = 0; i < laneEndTimes.length; i++) {
      if (laneEndTimes[i] + buffer <= item.start) {
        assignedLane = i
        laneEndTimes[i] = item.end
        break
      }
    }
    if (assignedLane === -1) {
      assignedLane = laneEndTimes.length
      laneEndTimes.push(item.end)
    }
    lanes[item.id] = assignedLane
  }

  const maxLane = laneEndTimes.length - 1
  return { lanes, maxLane }
}

interface WorkspaceProps {
  project: Project
  settings: AppSettings
  onSaveProject: (updatedProject: Project) => void
  onBack: () => void
  onChangeSettings: (settings: AppSettings) => void
  bgVolume: number
  setBgVolume: (v: number) => void
  ttsVolume: number
  setTtsVolume: (v: number) => void
}

export const Workspace: React.FC<WorkspaceProps> = ({
  project,
  settings,
  onSaveProject,
  onBack,
  onChangeSettings,
  bgVolume,
  setBgVolume,
  ttsVolume,
  setTtsVolume
}) => {
  const [segments, setSegments] = useState<SubtitleSegment[]>([])
  // Ref cho vòng lặp rAF đọc segments mà không cần re-subscribe effect
  const segmentsRef = useRef<SubtitleSegment[]>([])
  useEffect(() => {
    segmentsRef.current = segments
  }, [segments])
  const [activeSegId, setActiveSegId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; segId: string } | null>(null)
  const undoStack = useRef<SubtitleSegment[][]>([])
  const redoStack = useRef<SubtitleSegment[][]>([])
  const [currentTime, setCurrentTime] = useState(0) // in milliseconds
  const [duration, setDuration] = useState(0) // in milliseconds
  const [isPlaying, setIsPlaying] = useState(false)

  // AI & Export State
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [asrLanguage, setAsrLanguage] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)
  const [isFlippedHorizontal, setIsFlippedHorizontal] = useState(false)
  const [isFlippedVertical, setIsFlippedVertical] = useState(false)
  const [videoRotation, setVideoRotation] = useState<number>(0)

  // Timeline State
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [audioOffset, setAudioOffset] = useState(0)
  const [exportStartTime, setExportStartTime] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const scrollWrapperRef = useRef<HTMLDivElement>(null)
  const innerContainerRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)

  // Zoom state for timeline scale
  const [zoom, setZoom] = useState(1.0)

  // Timeline dragging refs
  const isDraggingLeftTrimRef = useRef(false)
  const isDraggingRightTrimRef = useRef(false)
  const isDraggingPlayheadRef = useRef(false)
  const isDraggingAudioShiftRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartOffsetRef = useRef(0)
  const lastSeekTimeRef = useRef(0)
  const keydownTargetTimeRef = useRef<number | null>(null)
  const lastVideoSeekTimeRef = useRef(0)
  const draggedTimeRef = useRef(0)
  const lastAudioShiftTimeRef = useRef(0)
  const draggedAudioOffsetRef = useRef(0)
  const zoomTimeoutRef = useRef<any>(null)
  const currentZoomRef = useRef(1.0)
  const isZoomingRef = useRef(false)

  // Individual clip dragging refs
  const isDraggingIndividualClipRef = useRef(false)
  const isTrimmingClipLeftRef = useRef(false)
  const isTrimmingClipRightRef = useRef(false)
  const dragStartYRef = useRef(0)
  const hasMovedClipRef = useRef(false)
  const draggedClipIdRef = useRef<string | null>(null)
  const draggedClipTypeRef = useRef<'subtitle' | 'audio' | null>(null)
  const dragStartClipTimeRef = useRef<{ start: number; end: number; audioOffset: number } | null>(null)
  const draggedClipTimesRef = useRef<{ start: number; end: number; audioOffset: number } | null>(null)

  const subtitleIntervals = useMemo(() => {
    return segments.map((seg) => ({
      id: seg.id,
      start: seg.start,
      end: seg.end
    }))
  }, [segments])

  const { lanes: subtitleLanes, maxLane: maxSubtitleLane } = useMemo(() => {
    return assignLanes(subtitleIntervals)
  }, [subtitleIntervals])

  const audioIntervals = useMemo(() => {
    return segments.map((seg) => {
      const startPos = seg.start + (seg.audioOffset || 0) + audioOffset
      const endPos = seg.end + (seg.audioOffset || 0) + audioOffset
      return {
        id: seg.id,
        start: startPos,
        end: endPos
      }
    })
  }, [segments, audioOffset])

  const { lanes: audioLanes, maxLane: maxAudioLane } = useMemo(() => {
    return assignLanes(audioIntervals)
  }, [audioIntervals])

  // Calculate dynamic tick step for ruler marks based on zoom and duration
  const getTickStep = () => {
    if (duration <= 0) return 5000
    const scrollWrapper = scrollWrapperRef.current
    const viewportWidth = scrollWrapper ? scrollWrapper.clientWidth : 1000
    const totalWidth = viewportWidth * zoom
    const pxPerMs = totalWidth / duration

    // Spacing between major ticks should be at least 120px to avoid text collision
    const minPx = 120
    const niceSteps = [100, 200, 500, 1000, 2000, 5000, 10000, 15000, 30000, 60000, 120000, 300000, 600000]

    for (const step of niceSteps) {
      if (step * pxPerMs >= minPx) {
        return step
      }
    }
    return niceSteps[niceSteps.length - 1]
  }

  // Initialize trimEnd when duration becomes available
  useEffect(() => {
    if (duration > 0 && trimEnd === 0) {
      setTrimEnd(duration)
    }
  }, [duration, trimEnd])

  const lastProjectIdRef = useRef<string | null>(null)

  // Load SRT content ONLY when switching projects (to avoid losing input focus when typing)
  useEffect(() => {
    if (project.id !== lastProjectIdRef.current) {
      lastProjectIdRef.current = project.id
      setSelectedSegIds(new Set())
      setTrimStart(0)
      setTrimEnd(0)
      setAudioOffset(0)
      if (project.srtContent) {
        try {
          const parsed = JSON.parse(project.srtContent)
          if (Array.isArray(parsed)) {
            let wasGarbled = false
            const healed = parsed.map((seg) => {
              const healedText = fixUtf8Garbage(seg.text || '')
              const healedTrans = fixUtf8Garbage(seg.translatedText || '')
              if (healedText !== seg.text || healedTrans !== seg.translatedText) {
                wasGarbled = true
              }
              return {
                ...seg,
                text: healedText,
                translatedText: healedTrans
              }
            })
            setSegments(healed)
            if (wasGarbled) {
              console.log('[Healer] Automatically healed Mojibake in segments')
              setTimeout(() => saveSubtitleChanges(healed), 100)
            }
          } else {
            const healedSrt = fixUtf8Garbage(project.srtContent)
            const parsedSrt = parseSRT(healedSrt)
            setSegments(parsedSrt)
            if (healedSrt !== project.srtContent) {
              console.log('[Healer] Automatically healed Mojibake in srtContent')
              setTimeout(() => saveSubtitleChanges(parsedSrt), 100)
            }
          }
        } catch (e) {
          const healedSrt = fixUtf8Garbage(project.srtContent)
          setSegments(parseSRT(healedSrt))
        }
      } else {
        setSegments([])
      }
    }
  }, [project])

  // Wheel event listener to handle zoom (Ctrl + wheel) and horizontal scroll (wheel)
  useEffect(() => {
    const timelineEl = timelineRef.current
    if (!timelineEl) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        
        // Exponential zoom is much more natural and standard for timeline editors (like CapCut)
        const zoomFactor = Math.pow(1.12, -e.deltaY / 120)
        let newZoom = currentZoomRef.current * zoomFactor
        newZoom = Math.max(1.0, Math.min(30.0, newZoom))
        newZoom = parseFloat(newZoom.toFixed(2))
        
        currentZoomRef.current = newZoom
        isZoomingRef.current = true

        // 1. Direct DOM update of innerContainer width for 60 FPS visual zoom
        const container = innerContainerRef.current
        if (container) {
          container.style.width = `${newZoom * 100}%`
        }

        // 2. Adjust scroll position to keep the playhead centered in the viewport
        const wrapper = scrollWrapperRef.current
        const video = videoRef.current
        if (wrapper && video && duration > 0) {
          const currentMs = video.currentTime * 1000
          const viewportWidth = wrapper.clientWidth
          const pct = currentMs / duration
          const playheadX = 20 + pct * (newZoom * viewportWidth - 40)
          wrapper.scrollLeft = playheadX - viewportWidth / 2
        }

        // 3. Debounce React state update to completely avoid layout re-render lag during active zooming
        if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
        zoomTimeoutRef.current = setTimeout(() => {
          setZoom(newZoom)
          isZoomingRef.current = false
        }, 150)
      } else {
        if (e.shiftKey) {
          e.preventDefault()
          const wrapper = scrollWrapperRef.current
          if (wrapper) {
            wrapper.scrollLeft += e.deltaY
          }
        }
      }
    }

    timelineEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      timelineEl.removeEventListener('wheel', handleWheel)
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
    }
  }, [duration])

  // Smoothly update playhead position during active video playback at 60 FPS
  useEffect(() => {
    let animId: number
    let lastOverlayUpdate = 0
    const updatePlayhead = () => {
      if (videoRef.current && !videoRef.current.paused && duration > 0) {
        const ms = Math.floor(videoRef.current.currentTime * 1000)
        const pct = ms / duration
        // Sự kiện timeupdate của <video> chỉ bắn ~4 lần/giây khiến phụ đề preview trễ tới
        // 250ms. Cập nhật overlay TRỰC TIẾP trên DOM tại đây (60fps) — không setCurrentTime
        // liên tục vì mỗi lần là cả component lớn re-render, gây lag.
        const now = performance.now()
        if (now - lastOverlayUpdate > 50) {
          lastOverlayUpdate = now
          const overlay = document.getElementById('subtitle-preview-overlay')
          if (overlay) {
            const active = segmentsRef.current.find(
              (s) => ms >= displayStart(s.start + audioOffset) && ms <= s.end + audioOffset
            )
            const span = overlay.firstElementChild as HTMLElement | null
            if (active) {
              const text = active.translatedText || active.text
              if (span && span.textContent !== text) span.textContent = text
              overlay.style.display = ''
            } else {
              overlay.style.display = 'none'
            }
          }
        }
        if (playheadRef.current) {
          playheadRef.current.style.left = `calc(20px + ${pct * 100}% - ${pct * 40}px)`
        }
        const timeDisplay = document.getElementById('playhead-time-display')
        if (timeDisplay) {
          timeDisplay.innerText = `${formatTime(ms)} / ${formatTime(duration)}`
        }
        // Auto-scroll timeline to keep playhead in viewport during playback
        const wrapper = scrollWrapperRef.current
        if (wrapper) {
          const scrollWidth = wrapper.scrollWidth
          const clientWidth = wrapper.clientWidth
          const timelineWidth = scrollWidth - 40
          const playheadX = 20 + pct * timelineWidth

          const scrollLeft = wrapper.scrollLeft
          const rightEdge = scrollLeft + clientWidth
          if (playheadX > rightEdge - 100 || playheadX < scrollLeft + 100) {
            wrapper.scrollLeft = playheadX - clientWidth / 2
          }
        }
      }
      animId = requestAnimationFrame(updatePlayhead)
    }

    if (isPlaying) {
      animId = requestAnimationFrame(updatePlayhead)
    }

    return () => {
      if (animId) {
        cancelAnimationFrame(animId)
      }
    }
  }, [isPlaying, duration, audioOffset])

  const [enableTts, setEnableTts] = useState(false)
  const [videoRect, setVideoRect] = useState({ left: 0, top: 0, width: 0, height: 0 })
  const [videoWidth, setVideoWidth] = useState(1280)
  const [videoHeight, setVideoHeight] = useState(720)
  const [ttsVoice, setTtsVoice] = useState('edge_hoaimy')
  const [exportMode, setExportMode] = useState<'hardsub' | 'tts' | 'audio_only'>('hardsub')
  const [exportGreenScreen, setExportGreenScreen] = useState(false)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [showAiToolsPopover, setShowAiToolsPopover] = useState(false)
  const [showSubSettingsPopover, setShowSubSettingsPopover] = useState(false)
  const [timeShiftValue, setTimeShiftValue] = useState<string>('0')
  const [isTtsGenerated, setIsTtsGenerated] = useState(false)
  // 1.0 = giọng tự nhiên, khớp nhịp nói nhân vật; nén tốc độ chỉ xảy ra khi câu
  // dài hơn khoảng trống (đo thật + atempo ở main, spec 04)
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0)
  const [autoSpeed, setAutoSpeed] = useState(true)
  const prevTimeRef = useRef<number>(0)

  // (Đã bỏ bộ ước lượng tốc độ đếm-từ ở preview — mỗi câu một tốc độ ngẫu hứng làm
  // preview khác video xuất và phá cache. Giờ mọi nơi sinh ở ttsSpeed thống nhất;
  // nén-cho-vừa-slot do main đo thời lượng thật + atempo lúc xuất, spec 04)

  // Bulk Find and Replace State
  const [showBulkReplace, setShowBulkReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [isWholeWord, setIsWholeWord] = useState(true)
  const [isCaseSensitive, setIsCaseSensitive] = useState(false)
  const [replaceStatus, setReplaceStatus] = useState<string | null>(null)
  const [selectedSegIds, setSelectedSegIds] = useState<Set<string>>(new Set())

  // Quick Search Modal State & Memoized Filters
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchWholeWord, setSearchWholeWord] = useState(true)
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false)
  const [modalPos, setModalPos] = useState({ x: 300, y: 150 })
  const modalPosRef = useRef({ x: 300, y: 150 })
  const searchModalRef = useRef<HTMLDivElement>(null)

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.tagName.toLowerCase() === 'button' ||
      target.closest('button') ||
      target.tagName.toLowerCase() === 'input'
    ) {
      return
    }
    e.preventDefault()

    const modalEl = searchModalRef.current
    if (!modalEl) return

    const currentX = modalPosRef.current.x
    const currentY = modalPosRef.current.y
    const startMouseX = e.clientX
    const startMouseY = e.clientY

    let newX = currentX
    let newY = currentY
    let animationFrameId: number | null = null

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startMouseX
      const deltaY = moveEvent.clientY - startMouseY
      newX = currentX + deltaX
      newY = currentY + deltaY

      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(() => {
          if (modalEl) {
            modalEl.style.left = `${newX}px`
            modalEl.style.top = `${newY}px`
          }
          animationFrameId = null
        })
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      modalPosRef.current = { x: newX, y: newY }
      setModalPos({ x: newX, y: newY })
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // AI Han Viet & Pinyin Lookup State
  const [lookupResults, setLookupResults] = useState<Record<string, any>>({})
  const [lookupLoading, setLookupLoading] = useState<Record<string, boolean>>({})

  const handleLookupHanViet = async (segId: string, text: string) => {
    if (!settings.apiKey) {
      alert('Vui lòng cấu hình OpenAI API Key trong Cài đặt trước!')
      return
    }
    if (!text || !text.trim()) {
      alert('Không có văn bản gốc để tra cứu!')
      return
    }

    setLookupLoading((prev) => ({ ...prev, [segId]: true }))

    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a professional Chinese-to-Vietnamese translation assistant. Return ONLY a valid JSON object.'
        },
        {
          role: 'user',
          content: `Phân tích dòng chữ Trung Quốc sau và trả về kết quả dưới dạng JSON:
Văn bản: "${text}"

Yêu cầu định dạng JSON trả về:
{
  "pinyin": "phiên âm Pinyin có thanh điệu, ngăn cách các từ bằng khoảng trắng",
  "hanviet": "âm Hán Việt tương ứng, ngăn cách các từ bằng khoảng trắng",
  "words": [
    { "zh": "từ tiếng Trung", "pinyin": "pinyin", "hanviet": "hán việt", "meaning": "giải nghĩa ngắn gọn tiếng Việt" }
  ]
}
Trả về DUY NHẤT chuỗi JSON hợp lệ. Không viết thêm bất kỳ chữ nào khác ngoài JSON.`
        }
      ]

      const resText = await window.api.callGptApi({
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
        messages
      })

      const cleaned = resText.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)

      setLookupResults((prev) => ({ ...prev, [segId]: parsed }))
    } catch (err: any) {
      console.error(err)
      alert('Lỗi tra cứu: ' + err.message)
    } finally {
      setLookupLoading((prev) => ({ ...prev, [segId]: false }))
    }
  }

  const applyHanVietText = (segId: string, hanvietText: string) => {
    const updated = segments.map((seg) => {
      if (seg.id === segId) {
        return { ...seg, translatedText: hanvietText }
      }
      return seg
    })
    setSegments(updated)
    saveSubtitleChanges(updated)
  }

  const filteredSearchSegments = useMemo(() => {
    if (!searchQuery.trim()) return []
    try {
      let regexFlags = 'u'
      if (!searchCaseSensitive) regexFlags += 'i'

      let pattern = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // escape regex chars
      if (searchWholeWord) {
        pattern = `(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`
      }
      const regex = new RegExp(pattern, regexFlags)

      return segments.filter((seg) => {
        const hasOriginal = regex.test(seg.text || '')
        const hasTranslation = regex.test(seg.translatedText || '')
        return hasOriginal || hasTranslation
      })
    } catch (e) {
      console.error(e)
      return []
    }
  }, [searchQuery, searchWholeWord, searchCaseSensitive, segments])

  const renderHighlightedText = (text: string, query: string) => {
    if (!text) return ''
    if (!query.trim()) return text

    try {
      let regexFlags = 'ug'
      if (!searchCaseSensitive) regexFlags += 'i'

      let pattern = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      if (searchWholeWord) {
        pattern = `(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`
      }
      const regex = new RegExp(pattern, regexFlags)

      const parts: { text: string; isMatch: boolean }[] = []
      let lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(text)) !== null) {
        const matchIndex = match.index
        const matchText = match[0]

        if (matchIndex > lastIndex) {
          parts.push({ text: text.substring(lastIndex, matchIndex), isMatch: false })
        }
        parts.push({ text: matchText, isMatch: true })
        lastIndex = matchIndex + matchText.length

        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
      }

      if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex), isMatch: false })
      }

      if (parts.length === 0) return text

      return (
        <>
          {parts.map((part, idx) => (
            <span
              key={idx}
              style={part.isMatch ? { background: 'rgba(139, 92, 246, 0.3)', color: '#fff', padding: '1px 3px', borderRadius: '2px', fontWeight: 600 } : {}}
            >
              {part.text}
            </span>
          ))}
        </>
      )
    } catch (e) {
      return text
    }
  }

  const toggleSelectSegment = (id: string) => {
    setSelectedSegIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedSegIds((prev) => {
      if (prev.size === segments.length) {
        return new Set()
      } else {
        return new Set(segments.map((s) => s.id))
      }
    })
  }

  const handleBulkReplace = (onlySelected: boolean) => {
    if (!findText) {
      setReplaceStatus('Vui lòng nhập từ khóa cần tìm!')
      setTimeout(() => setReplaceStatus(null), 3000)
      return
    }

    if (onlySelected && selectedSegIds.size === 0) {
      setReplaceStatus('Chưa chọn dòng phụ đề nào!')
      setTimeout(() => setReplaceStatus(null), 3000)
      return
    }

    let count = 0
    const escapedFind = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    let regexStr = escapedFind

    if (isWholeWord) {
      // Safe boundary for Vietnamese Unicode characters: ensure not preceded or followed by Unicode letters or digits
      regexStr = `(?<![\\p{L}\\p{N}])${escapedFind}(?![\\p{L}\\p{N}])`
    }

    const flags = 'g' + (isCaseSensitive ? '' : 'i') + (isWholeWord ? 'u' : '')

    try {
      const regex = new RegExp(regexStr, flags)
      const updatedSegments = segments.map((seg) => {
        if (onlySelected && !selectedSegIds.has(seg.id)) {
          return seg
        }
        const originalText = seg.translatedText || ''
        const newText = originalText.replace(regex, replaceText)
        if (newText !== originalText) {
          count++
        }
        return {
          ...seg,
          translatedText: newText
        }
      })

      if (count > 0) {
        saveSubtitleChanges(updatedSegments)
        setReplaceStatus(`Đã thay thế thành công ở ${count} dòng!`)
      } else {
        setReplaceStatus('Không tìm thấy từ khóa phù hợp.')
      }
    } catch (e) {
      console.error('[BulkReplace] Error parsing regex: ', e)
      setReplaceStatus('Có lỗi xảy ra khi thay thế.')
    }

    setTimeout(() => setReplaceStatus(null), 3000)
  }

  const handlePreviewVoice = async () => {
    const isEdge = ttsVoice.startsWith('edge_')
    const isEleven = ttsVoice.startsWith('eleven_') || (ttsVoice.length === 20 && !ttsVoice.includes(' '));
    const keyToUse = isEleven ? settings.elevenLabsApiKey : settings.apiKey;
    if (!isEdge && !keyToUse) {
      alert(isEleven ? 'Vui lòng cấu hình ElevenLabs API Key trong Cài đặt trước!' : 'Vui lòng cấu hình OpenAI API Key trong Cài đặt trước!')
      return
    }
    setIsPreviewPlaying(true)
    try {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
      const audioUrl = await window.api.previewTtsVoice(ttsVoice, settings.apiKey || '', settings.baseUrl || '', settings.elevenLabsApiKey || '', ttsSpeed)
      const audio = new Audio(audioUrl)
      previewAudioRef.current = audio
      await audio.play()
      audio.onended = () => {
        setIsPreviewPlaying(false)
      }
      audio.onerror = () => {
        setIsPreviewPlaying(false)
      }
    } catch (err: any) {
      console.error(err)
      alert('Lỗi nghe thử giọng nói: ' + err.message)
      setIsPreviewPlaying(false)
    }
  }

  // ResizeObserver to calculate absolute bounds of the video stream (handles window resize, sidebar toggle, project changes)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new ResizeObserver((entries) => {
      if (entries.length === 0) return
      const entry = entries[0]
      const target = entry.target as HTMLVideoElement
      setVideoRect({
        left: target.offsetLeft,
        top: target.offsetTop,
        width: target.offsetWidth,
        height: target.offsetHeight
      })
    })

    observer.observe(video)

    // Trigger initial size calculation
    setVideoRect({
      left: video.offsetLeft,
      top: video.offsetTop,
      width: video.offsetWidth,
      height: video.offsetHeight
    })

    return () => {
      observer.disconnect()
    }
  }, [project.videoPath, isPlaying])

  const lastSpokenIdRef = useRef<string | null>(null)
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)
  const manuallySelectedSegIdRef = useRef<string | null>(null)

  const restoreVideoVolume = () => {
    if (videoRef.current) {
      videoRef.current.volume = bgVolume / 100
    }
  }

  const duckVideoVolume = () => {
    if (videoRef.current && !isMuted) {
      videoRef.current.volume = (bgVolume / 100) * 0.15
    }
  }

  useEffect(() => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = 0
      } else if (activeAudioRef.current && !activeAudioRef.current.paused) {
        videoRef.current.volume = (bgVolume / 100) * 0.15
      } else {
        videoRef.current.volume = bgVolume / 100
      }
    }
  }, [bgVolume, isMuted])

  // Audio đã tải trước cho các câu sắp tới (spec 05 FR1) — đến lượt là phát tức thì
  const prefetchedAudioRef = useRef<Map<string, { text: string; audio: HTMLAudioElement }>>(new Map())

  const prefetchUpcomingTts = (fromMs: number): void => {
    const upcoming = segments
      .filter((s) => s.start > fromMs)
      .sort((a, b) => a.start - b.start)
      .slice(0, 3)
    for (const s of upcoming) {
      const text = (s.translatedText || s.text || '').replace(/\{[^}]*\}/g, '').replace(/\\N/g, ' ').trim()
      if (!text) continue
      const existing = prefetchedAudioRef.current.get(s.id)
      if (existing && existing.text === text) continue
      // Đặt placeholder ngay để không gọi trùng khi effect chạy lại
      prefetchedAudioRef.current.set(s.id, { text, audio: new Audio() })
      window.api
        .getTtsAudio({
          text,
          voice: ttsVoice,
          apiKey: settings.apiKey || '',
          baseUrl: settings.baseUrl || '',
          elevenLabsApiKey: settings.elevenLabsApiKey || '',
          speed: ttsSpeed
        })
        .then((url) => {
          const a = new Audio(url)
          a.preload = 'auto'
          prefetchedAudioRef.current.set(s.id, { text, audio: a })
        })
        .catch(() => prefetchedAudioRef.current.delete(s.id))
    }
    // Giữ map gọn — xóa mục cũ nhất khi vượt 12
    while (prefetchedAudioRef.current.size > 12) {
      const oldest = prefetchedAudioRef.current.keys().next().value
      if (oldest === undefined) break
      prefetchedAudioRef.current.delete(oldest)
    }
  }

  // Bộ chọn giọng/tốc độ DÙNG CHUNG cho panel Thuyết minh và modal Xuất video —
  // cùng một state (ttsVoice/ttsSpeed/autoSpeed), chọn ở đâu cũng đồng bộ (REVIEW 4.9b)
  const PRESET_TTS_VOICES = ['edge_hoaimy', 'edge_namminh', 'nova', 'shimmer', 'alloy', 'fable', 'echo', 'onyx', 'eleven_bella', 'eleven_antoni']

  const renderVoiceSettings = (): React.JSX.Element => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Giọng thuyết minh AI</span>
      <select
        className="form-select"
        style={{ fontSize: '0.8rem', padding: '4px 8px', height: '28px', width: '100%' }}
        value={PRESET_TTS_VOICES.includes(ttsVoice) ? ttsVoice : 'custom'}
        onChange={(e) => {
          const val = e.target.value
          if (val === 'custom') {
            if (PRESET_TTS_VOICES.includes(ttsVoice)) setTtsVoice('')
          } else {
            setTtsVoice(val)
          }
        }}
      >
        <optgroup label="Miễn phí (Không cần API Key)">
          <option value="edge_hoaimy">Giọng nữ Tiếng Việt (Hoài My - Miễn phí)</option>
          <option value="edge_namminh">Giọng nam Tiếng Việt (Nam Minh - Miễn phí)</option>
        </optgroup>
        <optgroup label="OpenAI (TTS)">
          <option value="nova">Giọng nữ OpenAI (Nova)</option>
          <option value="shimmer">Giọng nữ OpenAI (Shimmer)</option>
          <option value="alloy">Giọng trung tính OpenAI (Alloy)</option>
          <option value="fable">Giọng trung tính OpenAI (Fable)</option>
          <option value="echo">Giọng nam OpenAI (Echo)</option>
          <option value="onyx">Giọng nam OpenAI (Onyx)</option>
        </optgroup>
        <optgroup label="ElevenLabs (Premium - Đọc Tiếng Việt tốt)">
          <option value="eleven_bella">Giọng nữ Tiếng Việt (Bella)</option>
          <option value="eleven_antoni">Giọng nam Tiếng Việt (Antoni)</option>
          <option value="custom">-- Nhập ID tùy chỉnh --</option>
        </optgroup>
      </select>
      {!PRESET_TTS_VOICES.includes(ttsVoice) && (
        <div style={{ marginTop: '4px' }}>
          <input
            type="text"
            className="form-input"
            style={{ fontSize: '0.8rem', padding: '4px 8px', height: '28px', width: '100%', borderColor: 'var(--accent-purple)' }}
            placeholder="Dán ElevenLabs Voice ID vào đây..."
            value={ttsVoice}
            onChange={(e) => setTtsVoice(extractVoiceId(e.target.value))}
          />
        </div>
      )}
      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={autoSpeed}
            onChange={(e) => {
              setAutoSpeed(e.target.checked)
              setIsTtsGenerated(false)
            }}
            style={{ accentColor: 'var(--accent-purple)' }}
          />
          Tự động khớp tốc độ với lời nói nhân vật (khuyên dùng)
        </label>
      </div>
      {/* Tốc độ thủ công chỉ có ý nghĩa khi TẮT tự động khớp — bật auto thì mỗi câu
          đã được đo và co giãn theo khung nói thật, chọn nền bao nhiêu cũng bị kéo về khớp */}
      {!autoSpeed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Tốc độ thuyết minh (cố định)</span>
          <select
            className="form-select"
            style={{ fontSize: '0.8rem', padding: '4px 8px', height: '28px', width: '100%' }}
            value={ttsSpeed}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              setTtsSpeed(val)
              setIsTtsGenerated(false)
            }}
          >
            <option value="0.8">0.8x (Chậm)</option>
            <option value="0.9">0.9x</option>
            <option value="1.0">1.0x (Tự nhiên)</option>
            <option value="1.05">1.05x</option>
            <option value="1.1">1.1x</option>
            <option value="1.15">1.15x</option>
            <option value="1.2">1.2x</option>
            <option value="1.25">1.25x</option>
            <option value="1.3">1.3x</option>
            <option value="1.4">1.4x</option>
            <option value="1.5">1.5x (Nhanh)</option>
          </select>
        </div>
      )}
    </div>
  )

  // Tên hiển thị của giọng đang chọn (cho dòng tóm tắt ở modal xuất)
  const ttsVoiceLabel = (): string => {
    const labels: Record<string, string> = {
      edge_hoaimy: 'Hoài My (nữ, miễn phí)',
      edge_namminh: 'Nam Minh (nam, miễn phí)',
      nova: 'Nova (OpenAI)',
      shimmer: 'Shimmer (OpenAI)',
      alloy: 'Alloy (OpenAI)',
      fable: 'Fable (OpenAI)',
      echo: 'Echo (OpenAI)',
      onyx: 'Onyx (OpenAI)',
      eleven_bella: 'Bella (ElevenLabs)',
      eleven_antoni: 'Antoni (ElevenLabs)'
    }
    return labels[ttsVoice] || `ElevenLabs ID: ${ttsVoice || '(chưa chọn)'}`
  }

  const playTtsAudio = async (text: string, startOffsetMs = 0, segId?: string): Promise<void> => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause()
      activeAudioRef.current = null
      restoreVideoVolume()
    }
    const isEdge = ttsVoice.startsWith('edge_')
    const isEleven = ttsVoice.startsWith('eleven_') || (ttsVoice.length === 20 && !ttsVoice.includes(' '));
    const keyToUse = isEleven ? settings.elevenLabsApiKey : settings.apiKey;
    if (!isEdge && !keyToUse) return

    const cleanText = text.replace(/\{[^}]*\}/g, '').replace(/\\N/g, ' ').trim()
    if (!cleanText) return

    const speedToUse = ttsSpeed

    try {
      // Ưu tiên audio đã prefetch — phát tức thì, không chờ IPC/tải file
      let audio: HTMLAudioElement
      const pre = segId ? prefetchedAudioRef.current.get(segId) : undefined
      if (pre && pre.text === cleanText && pre.audio.src) {
        audio = pre.audio
        audio.currentTime = 0
      } else {
        const audioUrl = await window.api.getTtsAudio({
          text: cleanText,
          voice: ttsVoice,
          apiKey: settings.apiKey || '',
          baseUrl: settings.baseUrl || '',
          elevenLabsApiKey: settings.elevenLabsApiKey || '',
          speed: speedToUse
        })
        audio = new Audio(audioUrl)
      }
      activeAudioRef.current = audio
      audio.volume = ttsVolume / 100

      // Dùng on* (không addEventListener) để audio prefetch tái dùng không bị chồng listener
      audio.onplay = () => {
        duckVideoVolume()
      }
      audio.onpause = () => {
        if (activeAudioRef.current === audio) {
          restoreVideoVolume()
        }
      }
      audio.onended = () => {
        if (activeAudioRef.current === audio) {
          restoreVideoVolume()
        }
      }

      // Trễ nhỏ (<500ms) là do thời gian tải/sinh audio — phát từ ĐẦU câu để không
      // nuốt chữ đầu; chỉ seek vào giữa khi người dùng thực sự tua vào giữa câu
      const offsetSec = startOffsetMs > 500 ? startOffsetMs / 1000 : 0
      if (offsetSec > 0) {
        if (audio.readyState >= 1) {
          if (offsetSec < audio.duration) {
            audio.currentTime = offsetSec
          }
        } else {
          audio.addEventListener('loadedmetadata', () => {
            if (offsetSec < audio.duration) {
              audio.currentTime = offsetSec
            }
          })
        }
      }

      duckVideoVolume()
      await audio.play()
    } catch (err) {
      console.error('[Play TTS Audio Error]:', err)
      restoreVideoVolume()
    }
  }

  // Track currently active subtitle segment and trigger TTS
  useEffect(() => {
    let nextActiveId: string | null = null
    const isInteractionActive = isDraggingIndividualClipRef.current || isTrimmingClipLeftRef.current || isTrimmingClipRightRef.current

    // If there is a manually selected segment, check if currentTime is still within its bounds
    if (manuallySelectedSegIdRef.current) {
      const clickedSeg = segments.find((s) => s.id === manuallySelectedSegIdRef.current)
      let segStart = clickedSeg ? clickedSeg.start : 0
      let segEnd = clickedSeg ? clickedSeg.end : 0
      
      if (isInteractionActive && clickedSeg && draggedClipIdRef.current === clickedSeg.id && draggedClipTimesRef.current) {
        segStart = draggedClipTimesRef.current.start
        segEnd = draggedClipTimesRef.current.end
      }

      if (clickedSeg && currentTime >= segStart + audioOffset && currentTime <= segEnd + audioOffset) {
        nextActiveId = clickedSeg.id
      } else if (!isInteractionActive) {
        // Once the currentTime is outside the clicked segment's bounds, reset the ref
        manuallySelectedSegIdRef.current = null
      } else {
        nextActiveId = manuallySelectedSegIdRef.current
      }
    }

    // If no manual selection is active, fallback to automatic tracking
    if (!manuallySelectedSegIdRef.current) {
      const activeSeg = segments.find((s) => {
        let segStart = s.start
        let segEnd = s.end
        if (isInteractionActive && draggedClipIdRef.current === s.id && draggedClipTimesRef.current) {
          segStart = draggedClipTimesRef.current.start
          segEnd = draggedClipTimesRef.current.end
        }
        return currentTime >= segStart + audioOffset && currentTime <= segEnd + audioOffset
      })
      nextActiveId = activeSeg ? activeSeg.id : null
    }

    const active = segments.find((s) => s.id === nextActiveId)
    setActiveSegId(nextActiveId)

    // TTS Synchronized Playback Loop
    if (!enableTts) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause()
        activeAudioRef.current = null
      }
      lastSpokenIdRef.current = null
    } else if (!isPlaying) {
      if (activeAudioRef.current && !activeAudioRef.current.paused) {
        activeAudioRef.current.pause()
      }
    } else {
      // playing && enableTts
      // Tải trước audio 3 câu sắp tới để phát tức thì, không nuốt từ đầu câu (spec 05 FR1)
      prefetchUpcomingTts(currentTime)
      if (!active) {
        if (activeAudioRef.current) {
          activeAudioRef.current.pause()
          activeAudioRef.current = null
        }
        lastSpokenIdRef.current = null
      } else {
        const textToSpeak = active.translatedText || active.text || ''
        const cleanText = textToSpeak.replace(/\{[^}]*\}/g, '').replace(/\\N/g, ' ').trim()
        if (!cleanText) {
          if (activeAudioRef.current) {
            activeAudioRef.current.pause()
            activeAudioRef.current = null
          }
        } else {
          let segStart = active.start
          if (isInteractionActive && draggedClipIdRef.current === active.id && draggedClipTimesRef.current) {
            segStart = draggedClipTimesRef.current.start
          }
          const expectedOffsetMs = currentTime - (segStart + audioOffset)

          if (lastSpokenIdRef.current !== active.id) {
            lastSpokenIdRef.current = active.id
            playTtsAudio(cleanText, expectedOffsetMs, active.id)
          } else {
            const audio = activeAudioRef.current
            if (audio) {
              if (audio.paused) {
                const offsetSec = expectedOffsetMs / 1000
                if (offsetSec >= 0 && offsetSec < (audio.duration || 999)) {
                  if (audio.readyState >= 1) {
                    audio.currentTime = offsetSec
                  }
                  audio.play().catch((err) => console.error('[Play Resumed Audio Error]:', err))
                }
              } else {
                const expectedOffsetSec = expectedOffsetMs / 1000
                const drift = Math.abs(audio.currentTime - expectedOffsetSec)
                // Ngưỡng 800ms: trễ khởi phát ~500ms là chủ đích (không nuốt chữ đầu câu)
                // — chỉ can thiệp khi lệch thật sự lớn (user tua video giữa câu)
                if (drift > 0.8) {
                  if (expectedOffsetSec >= 0 && expectedOffsetSec < (audio.duration || 999)) {
                    audio.currentTime = expectedOffsetSec
                  }
                }
              }
            } else {
              playTtsAudio(cleanText, expectedOffsetMs, active.id)
            }
          }
        }
      }
    }

    prevTimeRef.current = currentTime
  }, [currentTime, segments, enableTts, isPlaying, audioOffset])

  // Pause audio when playing state changes to false
  useEffect(() => {
    if (!isPlaying && activeAudioRef.current) {
      activeAudioRef.current.pause()
    }
  }, [isPlaying])

  // Auto-scroll active subtitle segment into view in the Left Panel list
  useEffect(() => {
    if (activeSegId) {
      const activeElement = document.getElementById(`segment-${activeSegId}`)
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    }
  }, [activeSegId])

  const handleClipTrimMouseDown = (
    e: React.MouseEvent,
    seg: SubtitleSegment,
    type: 'subtitle' | 'audio',
    edge: 'left' | 'right'
  ) => {
    e.stopPropagation()
    if (edge === 'left') {
      isTrimmingClipLeftRef.current = true
    } else {
      isTrimmingClipRightRef.current = true
    }
    draggedClipIdRef.current = seg.id
    draggedClipTypeRef.current = type
    dragStartClipTimeRef.current = {
      start: seg.start,
      end: seg.end,
      audioOffset: seg.audioOffset || 0
    }
    dragStartXRef.current = e.clientX
    dragStartYRef.current = e.clientY
    hasMovedClipRef.current = false
    draggedClipTimesRef.current = {
      start: seg.start,
      end: seg.end,
      audioOffset: seg.audioOffset || 0
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'
  }

  const handleClipContextMenu = (e: React.MouseEvent, segId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      segId
    })
  }

  const handleClipMouseDown = (
    e: React.MouseEvent,
    seg: SubtitleSegment,
    type: 'subtitle' | 'audio'
  ) => {
    e.stopPropagation()
    isDraggingIndividualClipRef.current = true
    draggedClipIdRef.current = seg.id
    draggedClipTypeRef.current = type
    dragStartClipTimeRef.current = {
      start: seg.start,
      end: seg.end,
      audioOffset: seg.audioOffset || 0
    }
    dragStartXRef.current = e.clientX
    dragStartYRef.current = e.clientY
    hasMovedClipRef.current = false
    draggedClipTimesRef.current = {
      start: seg.start,
      end: seg.end,
      audioOffset: seg.audioOffset || 0
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
  }

  // Window mouse event listeners for timeline dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const wrapper = scrollWrapperRef.current
      if (!wrapper || duration <= 0) return

      const rect = wrapper.getBoundingClientRect()
      const scrollLeft = wrapper.scrollLeft
      const scrollWidth = wrapper.scrollWidth
      const timelineWidth = scrollWidth - 40
      const relativeX = e.clientX - rect.left - 20 + scrollLeft
      const pct = Math.max(0, Math.min(1, relativeX / timelineWidth))
      const timeMs = Math.round(pct * duration)

      const isMoving = isDraggingIndividualClipRef.current
      const isTrimmingLeft = isTrimmingClipLeftRef.current
      const isTrimmingRight = isTrimmingClipRightRef.current

      if ((isMoving || isTrimmingLeft || isTrimmingRight) && draggedClipIdRef.current && dragStartClipTimeRef.current) {
        const dx = e.clientX - dragStartXRef.current
        const dy = e.clientY - dragStartYRef.current
        if (!hasMovedClipRef.current && Math.sqrt(dx * dx + dy * dy) > 3) {
          hasMovedClipRef.current = true
        }

        if (hasMovedClipRef.current) {
          const msPerPx = duration / timelineWidth
          const deltaMs = Math.round(dx * msPerPx)

          const clipId = draggedClipIdRef.current
          const type = draggedClipTypeRef.current
          const startTimes = dragStartClipTimeRef.current

          // Snapping targets
          const snapTargets: number[] = [currentTime]
          segments.forEach((s) => {
            if (s.id !== clipId) {
              snapTargets.push(s.start)
              snapTargets.push(s.end)
            }
          })

          const getSnappedTime = (time: number): number => {
            const threshold = 100 // 100ms threshold
            let closest = time
            let minDiff = threshold
            snapTargets.forEach((target) => {
              const diff = Math.abs(time - target)
              if (diff < minDiff) {
                minDiff = diff
                closest = target
              }
            })
            return closest
          }

          let newStart = startTimes.start
          let newEnd = startTimes.end
          let newAudioOffset = startTimes.audioOffset

          // Tìm các phân đoạn lân cận trước và sau
          const prevSeg = segments
            .filter((s) => s.id !== clipId && s.end <= startTimes.start)
            .sort((a, b) => b.end - a.end)[0]
          const nextSeg = segments
            .filter((s) => s.id !== clipId && s.start >= startTimes.end)
            .sort((a, b) => a.start - b.start)[0]

          if (isTrimmingLeft) {
            newStart = startTimes.start + deltaMs
            newStart = getSnappedTime(newStart)
            if (newStart < 0) newStart = 0
            if (newStart > startTimes.end - 100) newStart = startTimes.end - 100
            
            // Ngăn chồng lấn với phân đoạn trước
            if (type === 'subtitle' && prevSeg && newStart < prevSeg.end) {
              newStart = prevSeg.end
            }

            if (type === 'subtitle') {
              const el = document.getElementById(`clip-${clipId}`)
              if (el) {
                const leftPct = newStart / duration
                const widthPct = (startTimes.end - newStart) / duration
                el.style.left = `calc(20px + ${leftPct * 100}% - ${leftPct * 40}px)`
                el.style.width = `calc(${widthPct * 100}% - ${widthPct * 40}px)`
              }
            } else if (type === 'audio') {
              const el = document.getElementById(`audio-clip-${clipId}`)
              const seg = segments.find((s) => s.id === clipId)
              if (el && seg) {
                const leftPct = (newStart + (seg.audioOffset || 0) + audioOffset) / duration
                const widthPct = (startTimes.end - newStart) / duration
                el.style.left = `calc(20px + ${leftPct * 100}% - ${leftPct * 40}px)`
                el.style.width = `calc(${widthPct * 100}% - ${widthPct * 40}px)`
              }
            }
            draggedClipTimesRef.current = { start: newStart, end: startTimes.end, audioOffset: startTimes.audioOffset }
          } else if (isTrimmingRight) {
            newEnd = startTimes.end + deltaMs
            newEnd = getSnappedTime(newEnd)
            if (newEnd < startTimes.start + 100) newEnd = startTimes.start + 100
            if (newEnd > duration) newEnd = duration

            // Ngăn chồng lấn với phân đoạn sau
            if (type === 'subtitle' && nextSeg && newEnd > nextSeg.start) {
              newEnd = nextSeg.start
            }

            if (type === 'subtitle') {
              const el = document.getElementById(`clip-${clipId}`)
              if (el) {
                const leftPct = startTimes.start / duration
                const widthPct = (newEnd - startTimes.start) / duration
                el.style.left = `calc(20px + ${leftPct * 100}% - ${leftPct * 40}px)`
                el.style.width = `calc(${widthPct * 100}% - ${widthPct * 40}px)`
              }
            } else if (type === 'audio') {
              const el = document.getElementById(`audio-clip-${clipId}`)
              const seg = segments.find((s) => s.id === clipId)
              if (el && seg) {
                const leftPct = (startTimes.start + (seg.audioOffset || 0) + audioOffset) / duration
                const widthPct = (newEnd - startTimes.start) / duration
                el.style.left = `calc(20px + ${leftPct * 100}% - ${leftPct * 40}px)`
                el.style.width = `calc(${widthPct * 100}% - ${widthPct * 40}px)`
              }
            }
            draggedClipTimesRef.current = { start: startTimes.start, end: newEnd, audioOffset: startTimes.audioOffset }
          } else {
            // Original moving logic
            if (type === 'subtitle') {
              newStart = startTimes.start + deltaMs
              newEnd = startTimes.end + deltaMs
              const clipDuration = startTimes.end - startTimes.start

              // Snap start
              const snappedStart = getSnappedTime(newStart)
              if (snappedStart !== newStart) {
                newStart = snappedStart
                newEnd = newStart + clipDuration
              } else {
                // Snap end
                const snappedEnd = getSnappedTime(newEnd)
                if (snappedEnd !== newEnd) {
                  newEnd = snappedEnd
                  newStart = newEnd - clipDuration
                }
              }

              if (newStart < 0) {
                newStart = 0
                newEnd = clipDuration
              }
              if (newEnd > duration) {
                newEnd = duration
                newStart = duration - clipDuration
              }

              // Ngăn chồng lấn khi di chuyển phân đoạn
              if (prevSeg && newStart < prevSeg.end) {
                newStart = prevSeg.end
                newEnd = newStart + clipDuration
              }
              if (nextSeg && newEnd > nextSeg.start) {
                newEnd = nextSeg.start
                newStart = Math.max(prevSeg ? prevSeg.end : 0, newEnd - clipDuration)
              }

              const el = document.getElementById(`clip-${clipId}`)
              if (el) {
                const leftPct = newStart / duration
                const widthPct = (newEnd - newStart) / duration
                el.style.left = `calc(20px + ${leftPct * 100}% - ${leftPct * 40}px)`
                el.style.width = `calc(${widthPct * 100}% - ${widthPct * 40}px)`
              }

              draggedClipTimesRef.current = { start: newStart, end: newEnd, audioOffset: startTimes.audioOffset }
            } else if (type === 'audio') {
              newAudioOffset = startTimes.audioOffset + deltaMs
              const seg = segments.find((s) => s.id === clipId)
              if (seg) {
                let currentAudioStart = seg.start + newAudioOffset
                const snappedAudioStart = getSnappedTime(currentAudioStart)
                if (snappedAudioStart !== currentAudioStart) {
                  newAudioOffset = snappedAudioStart - seg.start
                }

                if (seg.start + newAudioOffset < 0) {
                  newAudioOffset = -seg.start
                }
                if (seg.end + newAudioOffset > duration) {
                  newAudioOffset = duration - seg.end
                }

                const el = document.getElementById(`audio-clip-${clipId}`)
                if (el) {
                  const leftPct = (seg.start + newAudioOffset + audioOffset) / duration
                  const widthPct = (seg.end - seg.start) / duration
                  el.style.left = `calc(20px + ${leftPct * 100}% - ${leftPct * 40}px)`
                  el.style.width = `calc(${widthPct * 100}% - ${widthPct * 40}px)`
                }

                draggedClipTimesRef.current = { start: seg.start, end: seg.end, audioOffset: newAudioOffset }
              }
            }
          }

          // --- REAL-TIME SCREEN SYNC ---
          // 1. Determine target playhead time to seek to
          let targetSeekTime = currentTime
          if (isTrimmingLeft) {
            targetSeekTime = newStart
          } else if (isTrimmingRight) {
            targetSeekTime = newEnd
          } else if (isMoving) {
            if (type === 'subtitle') {
              targetSeekTime = newStart
            } else if (type === 'audio') {
              const seg = segments.find((s) => s.id === clipId)
              if (seg) targetSeekTime = seg.start + newAudioOffset
            }
          }

          // 2. Update Playhead position directly on DOM for smoothness
          const playhead = playheadRef.current
          if (playhead) {
            const pctPlayhead = targetSeekTime / duration
            playhead.style.left = `calc(20px + ${pctPlayhead * 100}% - ${pctPlayhead * 40}px)`
          }

          const timeDisplay = document.getElementById('playhead-time-display')
          if (timeDisplay) {
            timeDisplay.innerText = `${formatTime(targetSeekTime)} / ${formatTime(duration)}`
          }

          // 3. Update active subtitle visibility on screen overlay
          if (type === 'subtitle') {
            const subTextEl = document.getElementById(`subtitle-preview-text-${clipId}`)
            if (subTextEl) {
              if (targetSeekTime >= newStart && targetSeekTime <= newEnd) {
                subTextEl.style.display = 'inline-block'
              } else {
                subTextEl.style.display = 'none'
              }
            }
          }

          // 4. Seek video in real-time (throttled at 20 FPS)
          const nowTime = Date.now()
          if (nowTime - lastSeekTimeRef.current > 50) {
            if (videoRef.current) {
              videoRef.current.currentTime = targetSeekTime / 1000
            }
            setCurrentTime(targetSeekTime)
            lastSeekTimeRef.current = nowTime
          }
        }
      } else if (isDraggingPlayheadRef.current) {
        draggedTimeRef.current = timeMs

        // Update Playhead position directly on DOM for 60fps smoothness
        const playhead = playheadRef.current
        if (playhead) {
          playhead.style.left = `calc(20px + ${pct * 100}% - ${pct * 40}px)`
        }

        // Update Time Display directly on DOM for 60fps smoothness
        const timeDisplay = document.getElementById('playhead-time-display')
        if (timeDisplay) {
          timeDisplay.innerText = `${formatTime(timeMs)} / ${formatTime(duration)}`
        }

        const now = Date.now()
        if (now - lastSeekTimeRef.current > 40) { // Limit React re-renders and seeks to 25 FPS
          if (videoRef.current) {
            videoRef.current.currentTime = timeMs / 1000
          }
          setCurrentTime(timeMs)
          lastSeekTimeRef.current = now
        }
      } else if (isDraggingLeftTrimRef.current) {
        const maxLeft = Math.max(0, trimEnd - 1000)
        const val = Math.max(0, Math.min(maxLeft, timeMs))
        setTrimStart(val)
        if (videoRef.current) {
          videoRef.current.currentTime = val / 1000
          setCurrentTime(val)
        }
      } else if (isDraggingRightTrimRef.current) {
        const minRight = Math.min(duration, trimStart + 1000)
        const val = Math.max(minRight, Math.min(duration, timeMs))
        setTrimEnd(val)
        if (videoRef.current) {
          videoRef.current.currentTime = val / 1000
          setCurrentTime(val)
        }
      } else if (isDraggingAudioShiftRef.current) {
        const dx = e.clientX - dragStartXRef.current
        const msPerPx = duration / timelineWidth
        const deltaMs = Math.round(dx * msPerPx)
        const newOffset = dragStartOffsetRef.current + deltaMs
        const clampedOffset = Math.max(-30000, Math.min(30000, newOffset))
        
        // Throttle React state update to avoid component re-render lag during dragging
        const now = Date.now()
        if (now - lastAudioShiftTimeRef.current > 40) {
          setAudioOffset(clampedOffset)
          lastAudioShiftTimeRef.current = now
        }
        draggedAudioOffsetRef.current = clampedOffset
      }
    }

    const handleMouseUp = () => {
      const isClipInteraction = isDraggingIndividualClipRef.current || isTrimmingClipLeftRef.current || isTrimmingClipRightRef.current
      if (isClipInteraction && draggedClipIdRef.current) {
        if (!hasMovedClipRef.current && isDraggingIndividualClipRef.current) {
          const clipId = draggedClipIdRef.current
          const seg = segments.find((s) => s.id === clipId)
          if (seg) {
            manuallySelectedSegIdRef.current = seg.id
            seekVideo(seg.start)
            setActiveSegId(seg.id)
          }
        } else if (draggedClipTimesRef.current) {
          const clipId = draggedClipIdRef.current
          const newTimes = draggedClipTimesRef.current
          const type = draggedClipTypeRef.current

          const updated = segments.map((seg) => {
            if (seg.id === clipId) {
              if (isTrimmingClipLeftRef.current || isTrimmingClipRightRef.current) {
                return { ...seg, start: newTimes.start, end: newTimes.end }
              } else if (type === 'subtitle') {
                return { ...seg, start: newTimes.start, end: newTimes.end }
              } else {
                return { ...seg, audioOffset: newTimes.audioOffset }
              }
            }
            return seg
          })
          saveSubtitleChanges(updated)
        }
      }

      if (isDraggingPlayheadRef.current) {
        seekVideo(draggedTimeRef.current)
      }
      if (isDraggingAudioShiftRef.current) {
        setAudioOffset(draggedAudioOffsetRef.current)
      }
      isDraggingPlayheadRef.current = false
      isDraggingLeftTrimRef.current = false
      isDraggingRightTrimRef.current = false
      isDraggingAudioShiftRef.current = false
      isDraggingIndividualClipRef.current = false
      isTrimmingClipLeftRef.current = false
      isTrimmingClipRightRef.current = false
      draggedClipIdRef.current = null
      draggedClipTimesRef.current = null
      draggedClipTypeRef.current = null
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    const handleWindowClick = () => {
      setContextMenu(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('click', handleWindowClick)
    window.addEventListener('contextmenu', handleWindowClick)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('click', handleWindowClick)
      window.removeEventListener('contextmenu', handleWindowClick)
    }
  }, [duration, trimStart, trimEnd, bgVolume, audioOffset, zoom, isMuted, segments])

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      if (activeAudioRef.current) activeAudioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (trimEnd > 0 && currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart / 1000
        setCurrentTime(trimStart)
      } else if (currentTime < trimStart) {
        videoRef.current.currentTime = trimStart / 1000
        setCurrentTime(trimStart)
      }
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  // Global key listeners for shortcuts (Space to play/pause, 1/2 to navigate, Shift to select)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      let isTyping = false
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase()
        const isEditable = activeEl.getAttribute('contenteditable') === 'true'
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          isEditable
        ) {
          isTyping = true
        }
      }

      if (isTyping) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        handleRedo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        handleUndo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        handleRedo()
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        handleSplitSegmentAtPlayhead()
      } else if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === '1') {
        e.preventDefault()
        if (segments.length === 0) return
        let prevIndex = -1
        if (activeSegId) {
          const currentIdx = segments.findIndex((s) => s.id === activeSegId)
          if (currentIdx > 0) {
            prevIndex = currentIdx - 1
          }
        } else {
          prevIndex = 0
        }

        if (prevIndex !== -1) {
          const prevSeg = segments[prevIndex]
          manuallySelectedSegIdRef.current = prevSeg.id
          setActiveSegId(prevSeg.id)
          seekVideo(prevSeg.start)
        }
      } else if (e.key === '2') {
        e.preventDefault()
        if (segments.length === 0) return
        let nextIndex = -1
        if (activeSegId) {
          const currentIdx = segments.findIndex((s) => s.id === activeSegId)
          if (currentIdx !== -1 && currentIdx < segments.length - 1) {
            nextIndex = currentIdx + 1
          }
        } else {
          nextIndex = 0
        }

        if (nextIndex !== -1) {
          const nextSeg = segments[nextIndex]
          manuallySelectedSegIdRef.current = nextSeg.id
          setActiveSegId(nextSeg.id)
          seekVideo(nextSeg.start)
        }
      } else if (e.key === 'Tab') {
        e.preventDefault()
        if (activeSegId) {
          toggleSelectSegment(activeSegId)
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (videoRef.current && duration > 0) {
          const currentMs = keydownTargetTimeRef.current !== null
            ? keydownTargetTimeRef.current
            : Math.floor(videoRef.current.currentTime * 1000)
          const step = e.shiftKey ? 500 : 50
          const targetTime = Math.max(0, currentMs - step)
          keydownTargetTimeRef.current = targetTime

          // Update Playhead directly on DOM for 60fps smoothness
          const playhead = playheadRef.current
          if (playhead) {
            const pct = targetTime / duration
            playhead.style.left = `calc(20px + ${pct * 100}% - ${pct * 40}px)`
          }

          // Update time display directly
          const timeDisplay = document.getElementById('playhead-time-display')
          if (timeDisplay) {
            timeDisplay.innerText = `${formatTime(targetTime)} / ${formatTime(duration)}`
          }

          // Auto-scroll timeline if playhead goes off viewport
          const wrapper = scrollWrapperRef.current
          if (wrapper) {
            const scrollWidth = wrapper.scrollWidth
            const clientWidth = wrapper.clientWidth
            const timelineWidth = scrollWidth - 40
            const pct = targetTime / duration
            const playheadX = 20 + pct * timelineWidth
            const scrollLeft = wrapper.scrollLeft
            const rightEdge = scrollLeft + clientWidth
            if (playheadX > rightEdge - 50 || playheadX < scrollLeft + 50) {
              wrapper.scrollLeft = playheadX - clientWidth / 2
            }
          }

          // Throttle physical video seek and React state update to avoid lag while holding keys
          const now = Date.now()
          if (now - lastVideoSeekTimeRef.current > 60) {
            videoRef.current.currentTime = targetTime / 1000
            setCurrentTime(targetTime)
            lastVideoSeekTimeRef.current = now
          }
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (videoRef.current && duration > 0) {
          const currentMs = keydownTargetTimeRef.current !== null
            ? keydownTargetTimeRef.current
            : Math.floor(videoRef.current.currentTime * 1000)
          const step = e.shiftKey ? 500 : 50
          const targetTime = Math.min(duration, currentMs + step)
          keydownTargetTimeRef.current = targetTime

          // Update Playhead directly on DOM for 60fps smoothness
          const playhead = playheadRef.current
          if (playhead) {
            const pct = targetTime / duration
            playhead.style.left = `calc(20px + ${pct * 100}% - ${pct * 40}px)`
          }

          // Update time display directly
          const timeDisplay = document.getElementById('playhead-time-display')
          if (timeDisplay) {
            timeDisplay.innerText = `${formatTime(targetTime)} / ${formatTime(duration)}`
          }

          // Auto-scroll timeline if playhead goes off viewport
          const wrapper = scrollWrapperRef.current
          if (wrapper) {
            const scrollWidth = wrapper.scrollWidth
            const clientWidth = wrapper.clientWidth
            const timelineWidth = scrollWidth - 40
            const pct = targetTime / duration
            const playheadX = 20 + pct * timelineWidth
            const scrollLeft = wrapper.scrollLeft
            const rightEdge = scrollLeft + clientWidth
            if (playheadX > rightEdge - 50 || playheadX < scrollLeft + 50) {
              wrapper.scrollLeft = playheadX - clientWidth / 2
            }
          }

          // Throttle physical video seek and React state update to avoid lag while holding keys
          const now = Date.now()
          if (now - lastVideoSeekTimeRef.current > 60) {
            videoRef.current.currentTime = targetTime / 1000
            setCurrentTime(targetTime)
            lastVideoSeekTimeRef.current = now
          }
        }
      }
    }

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (keydownTargetTimeRef.current !== null) {
          const finalTime = keydownTargetTimeRef.current
          if (videoRef.current) {
            videoRef.current.currentTime = finalTime / 1000
          }
          setCurrentTime(finalTime)
          keydownTargetTimeRef.current = null
        }
      }
    }

    const handleBlur = () => {
      if (keydownTargetTimeRef.current !== null) {
        const finalTime = keydownTargetTimeRef.current
        if (videoRef.current) {
          videoRef.current.currentTime = finalTime / 1000
        }
        setCurrentTime(finalTime)
        keydownTargetTimeRef.current = null
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    window.addEventListener('keyup', handleGlobalKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
      window.removeEventListener('keyup', handleGlobalKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [togglePlay, activeSegId, segments, toggleSelectSegment, duration])

  // Handle Video Time Update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    if (isZoomingRef.current) return
    let ms = Math.floor(videoRef.current.currentTime * 1000)
    if (trimEnd > 0 && ms >= trimEnd) {
      videoRef.current.pause()
      setIsPlaying(false)
      videoRef.current.currentTime = trimStart / 1000
      ms = trimStart
    } else if (ms < trimStart) {
      videoRef.current.currentTime = trimStart / 1000
      ms = trimStart
    }
    setCurrentTime(ms)

    // Auto-scroll timeline to keep playhead in viewport during playback
    const wrapper = scrollWrapperRef.current
    if (wrapper && duration > 0) {
      const scrollWidth = wrapper.scrollWidth
      const clientWidth = wrapper.clientWidth
      const timelineWidth = scrollWidth - 40
      const pct = ms / duration
      const playheadX = 20 + pct * timelineWidth

      const scrollLeft = wrapper.scrollLeft
      const rightEdge = scrollLeft + clientWidth
      if (playheadX > rightEdge - 100 || playheadX < scrollLeft + 100) {
        wrapper.scrollLeft = playheadX - clientWidth / 2
      }
    }
  }

  // Jump Video to millisecond timestamp
  const seekVideo = (ms: number) => {
    if (!videoRef.current) return
    let targetMs = ms
    if (trimEnd > 0) {
      targetMs = Math.max(trimStart, Math.min(trimEnd, ms))
    } else {
      targetMs = Math.max(0, ms)
    }
    videoRef.current.currentTime = targetMs / 1000
    setCurrentTime(targetMs)

    // Auto-scroll timeline on manual seek if playhead is out of viewport
    const wrapper = scrollWrapperRef.current
    if (wrapper && duration > 0) {
      const scrollWidth = wrapper.scrollWidth
      const clientWidth = wrapper.clientWidth
      const timelineWidth = scrollWidth - 40
      const pct = targetMs / duration
      const playheadX = 20 + pct * timelineWidth

      const scrollLeft = wrapper.scrollLeft
      const rightEdge = scrollLeft + clientWidth
      if (playheadX > rightEdge - 50 || playheadX < scrollLeft + 50) {
        wrapper.scrollLeft = playheadX - clientWidth / 2
      }
    }
  }

  // Save Project SRT Changes
  const saveSubtitleChanges = (updated: SubtitleSegment[], skipHistory = false) => {
    if (!skipHistory) {
      undoStack.current.push(JSON.parse(JSON.stringify(segments)))
      if (undoStack.current.length > 50) {
        undoStack.current.shift()
      }
      redoStack.current = []
    }
    const healed = updated.map((seg) => ({
      ...seg,
      text: fixUtf8Garbage(seg.text || ''),
      translatedText: fixUtf8Garbage(seg.translatedText || '')
    }))
    setSegments(healed)
    setIsTtsGenerated(false)
    onSaveProject({
      ...project,
      srtContent: JSON.stringify(healed)
    })
  }

  const handleUndo = () => {
    if (undoStack.current.length === 0) return
    const prevState = undoStack.current.pop()!
    redoStack.current.push(JSON.parse(JSON.stringify(segments)))
    saveSubtitleChanges(prevState, true)
    if (activeSegId && !prevState.some((s) => s.id === activeSegId) && prevState.length > 0) {
      setActiveSegId(prevState[0].id)
    }
  }

  const handleRedo = () => {
    if (redoStack.current.length === 0) return
    const nextState = redoStack.current.pop()!
    undoStack.current.push(JSON.parse(JSON.stringify(segments)))
    saveSubtitleChanges(nextState, true)
    if (activeSegId && !nextState.some((s) => s.id === activeSegId) && nextState.length > 0) {
      setActiveSegId(nextState[0].id)
    }
  }

  // Edit Subtitle Text
  const handleTextChange = (id: string, field: 'text' | 'translatedText', val: string) => {
    const updated = segments.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    saveSubtitleChanges(updated)
  }


  // Delete Subtitle
  const handleDeleteSegment = (id: string) => {
    const updated = segments.filter((s) => s.id !== id).map((s, idx) => ({ ...s, index: idx + 1 }))
    saveSubtitleChanges(updated)
  }

  const getOverlappingSegments = (segId: string) => {
    const targetSeg = segments.find(s => s.id === segId)
    if (!targetSeg) return []
    return segments.filter(s => s.id !== segId && Math.max(s.start, targetSeg.start) < Math.min(s.end, targetSeg.end))
  }

  const handleMergeOverlappingSegments = (segId: string) => {
    const targetSeg = segments.find(s => s.id === segId)
    if (!targetSeg) return

    const overlapping = getOverlappingSegments(segId)
    if (overlapping.length === 0) return

    const allToMerge = [targetSeg, ...overlapping]
    allToMerge.sort((a, b) => a.start - b.start)

    const mergedStart = Math.min(...allToMerge.map(s => s.start))
    const mergedEnd = Math.max(...allToMerge.map(s => s.end))

    const mergeText = (field: 'text' | 'translatedText') => {
      return allToMerge
        .map(s => {
          const val = (s[field] || '').trim()
          if (!val) return ''
          return val.startsWith('-') ? val : `- ${val}`
        })
        .filter(Boolean)
        .join('\n')
    }

    const mergedText = mergeText('text')
    const mergedTranslatedText = mergeText('translatedText')

    const mergedSeg: SubtitleSegment = {
      ...targetSeg,
      start: mergedStart,
      end: mergedEnd,
      text: mergedText,
      translatedText: mergedTranslatedText
    }

    const overlappingIds = new Set(overlapping.map(s => s.id))
    const updatedSegments = segments
      .filter(s => !overlappingIds.has(s.id))
      .map(s => s.id === segId ? mergedSeg : s)

    saveSubtitleChanges(updatedSegments)
    setActiveSegId(segId)
  }


  const splitTextAtRatio = (text: string, ratio: number): [string, string] => {
    if (!text) return ['', '']
    const words = text.trim().split(/\s+/)
    if (words.length <= 1) {
      return [text, '']
    }
    const splitIndex = Math.max(1, Math.round(words.length * ratio))
    const part1 = words.slice(0, splitIndex).join(' ')
    const part2 = words.slice(splitIndex).join(' ')
    return [part1, part2]
  }

  const handleSplitSegmentAtPlayhead = () => {
    let targetSeg: SubtitleSegment | undefined = undefined

    // 1. Check active segment first
    if (activeSegId) {
      const activeSeg = segments.find((s) => s.id === activeSegId)
      if (activeSeg && currentTime > activeSeg.start + 100 && currentTime < activeSeg.end - 100) {
        targetSeg = activeSeg
      }
    }

    // 2. If not found, look for any segment containing the playhead
    if (!targetSeg) {
      targetSeg = segments.find((seg) => currentTime > seg.start + 100 && currentTime < seg.end - 100)
    }

    if (!targetSeg) return

    const seg = targetSeg
    const segIndex = segments.findIndex((s) => s.id === seg.id)
    if (segIndex === -1) return

    // Split text based on time ratio
    const ratio = (currentTime - seg.start) / (seg.end - seg.start)
    const [text1, text2] = splitTextAtRatio(seg.text || '', ratio)
    const [translated1, translated2] = splitTextAtRatio(seg.translatedText || '', ratio)

    const newId = Math.random().toString(36).substring(2, 9)

    const segA: SubtitleSegment = {
      ...seg,
      end: currentTime,
      text: text1,
      translatedText: translated1
    }

    const segB: SubtitleSegment = {
      id: newId,
      index: seg.index + 1,
      start: currentTime,
      end: seg.end,
      text: text2,
      translatedText: translated2,
      audioOffset: seg.audioOffset,
      originalStart: currentTime,
      originalEnd: seg.end
    }

    const updated = [
      ...segments.slice(0, segIndex),
      segA,
      segB,
      ...segments.slice(segIndex + 1)
    ].map((s, idx) => ({ ...s, index: idx + 1 }))

    saveSubtitleChanges(updated)

    // Select the first half
    manuallySelectedSegIdRef.current = segA.id
    setActiveSegId(segA.id)
  }

  // Add new subtitle segment
  const handleAddSegment = () => {
    // 1. Kiểm tra vị trí hiện tại có bị chiếm bởi sub khác không
    const isOccupied = segments.some((s) => currentTime >= s.start && currentTime < s.end)
    if (isOccupied) {
      alert('Không thể thêm phụ đề đè lên phân cảnh khác!')
      return
    }

    const newStart = currentTime
    let newEnd = currentTime + 2000

    // 2. Tìm phân đoạn tiếp theo để giới hạn không cho chồng lấn
    const nextSeg = segments.filter((s) => s.start > currentTime).sort((a, b) => a.start - b.start)[0]
    if (nextSeg && newEnd > nextSeg.start) {
      newEnd = nextSeg.start
    }

    if (newEnd - newStart < 200) {
      alert('Không đủ khoảng trống để thêm phụ đề mới!')
      return
    }

    const newId = Math.random().toString(36).substring(2, 9)
    const newSeg: SubtitleSegment = {
      id: newId,
      index: segments.length + 1,
      start: newStart,
      end: newEnd,
      text: '',
      translatedText: 'Dòng phụ đề mới',
      originalStart: newStart,
      originalEnd: newEnd
    }

    const updated = [...segments, newSeg].sort((a, b) => a.start - b.start).map((s, idx) => ({ ...s, index: idx + 1 }))
    saveSubtitleChanges(updated)

    manuallySelectedSegIdRef.current = newId
    setActiveSegId(newId)
    seekVideo(newStart)

    // Focus and select the Vietnamese text input automatically so they can type immediately
    setTimeout(() => {
      const inputs = Array.from(document.querySelectorAll('.vietsub-textarea')) as HTMLTextAreaElement[]
      const newIdx = updated.findIndex((s) => s.id === newId)
      if (newIdx !== -1 && inputs[newIdx]) {
        inputs[newIdx].focus()
        inputs[newIdx].select()
        inputs[newIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 150)
  }

  // Helper to handle settings changes from Workspace
  const handleStyleChange = (field: string, value: any) => {
    onChangeSettings({
      ...settings,
      subtitleStyle: {
        ...settings.subtitleStyle,
        [field]: value
      }
    })
  }

  const getBgOpacity = (colorStr: string) => {
    if (!colorStr || colorStr === 'transparent') return 0
    const match = colorStr.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/i)
    if (match) {
      return Math.round(parseFloat(match[1]) * 100)
    }
    return 100
  }

  const handleOpacityChange = (val: number) => {
    if (val === 0) {
      handleStyleChange('bgColor', 'transparent')
    } else {
      handleStyleChange('bgColor', `rgba(15, 17, 23, ${(val / 100).toFixed(2)})`)
    }
  }

  // AI ASR (Speech-to-Text)
  const handleRunASR = async () => {
    if (!settings.apiKey) {
      alert('Vui lòng cấu hình OpenAI API Key trong Cài đặt trước!')
      return
    }

    setIsProcessing(true)
    setProgress(10)
    setStatusMessage('Đang kết nối OpenAI Whisper API...')

    try {
      // Prompt mồi TRUNG TÍNH: chỉ làm mẫu ngắt câu/dấu câu, không chứa nội dung chủ đề
      // (prompt có chủ đề cụ thể sẽ làm Whisper thiên vị từ vựng đó, nghe sai nội dung khác)
      let prompt: string
      if (asrLanguage === 'zh') {
        prompt = '你好，欢迎收看。今天的内容开始了。请注意，句子要短，加上逗号和句号。'
      } else if (asrLanguage === 'en') {
        prompt = 'Hello, welcome back. Here is the content, in short sentences, with commas and periods.'
      } else if (asrLanguage === 'vi') {
        prompt = 'Xin chào mọi người. Nội dung bắt đầu. Câu ngắn, có dấu phẩy và dấu chấm đầy đủ.'
      } else {
        prompt = 'Hello, welcome. Short sentences, with proper punctuation.'
      }

      // KHÔNG bơm Từ điển tên riêng vào prompt Whisper (đã thử ở spec 03, bỏ ở spec 07).
      // Bằng chứng thực tế: 2 máy cùng file/cùng cài đặt, chỉ khác nội dung Từ điển
      // (chứa tên từ dự án khác, không liên quan video) → chênh lệch 138 vs 112 dòng
      // (thiếu 19%). Prompt của Whisper là "ngữ cảnh mồi", nội dung không liên quan
      // làm mô hình lệch hướng giải mã và bỏ cả cụm câu — rủi ro mất nội dung lớn hơn
      // lợi ích "nghe đúng tên riêng". Ưu tiên đầy đủ/chính xác > tiện ích nhỏ.
      // Từ điển vẫn dùng bình thường cho bước Dịch (không ảnh hưởng ở đó).

      // Video dài (audio >24MB) được chia khúc ở main process — hiện tiến độ từng khúc
      const cleanupProgress = window.api.onFfmpegProgress((data) => {
        if (data.type === 'whisper-chunks') {
          setProgress(10 + Math.round(data.percent * 0.8))
          setStatusMessage(`Đang nhận diện giọng nói... ${data.percent}% (video dài, xử lý theo khúc)`)
        }
      })

      let asrResult: Awaited<ReturnType<typeof window.api.callWhisperApi>>
      try {
        asrResult = await window.api.callWhisperApi({
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
          audioPath: project.audioPath,
          language: asrLanguage || undefined,
          prompt
        })
      } finally {
        cleanupProgress()
      }

      setProgress(90)
      setStatusMessage('Đang tải phụ đề...')

      // Ưu tiên mốc thời gian từng từ (khớp lời nói thật); fallback tách theo tỷ lệ chữ
      let splitParsed: SubtitleSegment[]
      if (typeof asrResult === 'string') {
        // Backend tùy chỉnh (baseUrl khác) có thể vẫn trả chuỗi SRT kiểu cũ
        splitParsed = splitSegmentsBySentences(parseSRT(asrResult))
      } else if (asrResult.segments && asrResult.segments.length > 0) {
        splitParsed = buildSegmentsFromWords(asrResult.words || [], asrResult.segments)
      } else {
        throw new Error('Whisper không trả về phụ đề nào.')
      }
      saveSubtitleChanges(splitParsed)
      setProgress(100)
      alert('Nhận diện giọng nói hoàn tất!')
    } catch (err: any) {
      console.error(err)
      alert('Lỗi nhận diện giọng nói: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // AI Translation (GPT Batching)
  const handleTranslate = async () => {
    if (!settings.apiKey) {
      alert('Vui lòng cấu hình OpenAI API Key trong Cài đặt trước!')
      return
    }
    if (segments.length === 0) {
      alert('Chưa có phụ đề để dịch. Hãy chạy nhận diện giọng nói (ASR) hoặc tạo phụ đề trước!')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setStatusMessage('Đang chuẩn bị dịch thuật...')

    // Dịch 1 lô câu, trả về map index -> bản dịch. Format "số|câu" tiết kiệm token so với JSON.
    const translateBatch = async (
      batch: SubtitleSegment[]
    ): Promise<Map<number, string>> => {
      const lines = batch.map((b) => `${b.index}|${b.text.replace(/\n/g, ' ')}`).join('\n')
      const messages = [
        { role: 'system', content: settings.systemPrompt },
        {
          role: 'user',
          content: `${settings.characterContext ? `Xưng hô: ${settings.characterContext}\n` : ''}${settings.nameDictionary ? `Từ điển bắt buộc:\n${settings.nameDictionary}\n` : ''}Dịch sang tiếng Việt. Trả về đúng số dòng, mỗi dòng dạng "số|bản dịch", không thêm gì khác.

${lines}`
        }
      ]

      const resText = await window.api.callGptApi({
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
        messages
      })

      const translations = new Map<number, string>()
      for (const line of resText.split('\n')) {
        const m = line.match(/^\s*(\d+)\s*\|(.*)$/)
        if (m) {
          const idx = parseInt(m[1], 10)
          const translated = m[2].trim()
          if (translated) translations.set(idx, translated)
        }
      }
      return translations
    }

    try {
      // Chỉ dịch câu chưa có bản dịch (tiết kiệm token khi dịch tiếp/dịch bổ sung);
      // nếu tất cả đã dịch rồi thì hiểu là muốn dịch lại toàn bộ
      const untranslated = segments.filter((s) => !(s.translatedText || '').trim())
      const toTranslate = untranslated.length > 0 ? untranslated : segments

      const batchSize = 50
      const totalBatches = Math.ceil(toTranslate.length / batchSize)
      const updatedSegments = [...segments]
      const failedIndexes: number[] = []

      for (let i = 0; i < toTranslate.length; i += batchSize) {
        const batchIdx = Math.floor(i / batchSize) + 1
        setStatusMessage(`Đang dịch đoạn phụ đề ${batchIdx}/${totalBatches}...`)

        // Retry tối đa 2 lần cho các câu còn thiếu; lô hỏng không chặn lô sau
        let pending = toTranslate.slice(i, i + batchSize)
        for (let attempt = 0; attempt <= 2 && pending.length > 0; attempt++) {
          try {
            const translations = await translateBatch(pending)
            pending = pending.filter((seg) => {
              const translated = translations.get(seg.index)
              if (translated) {
                const target = updatedSegments.find((s) => s.index === seg.index)
                if (target) target.translatedText = translated
                return false
              }
              return true
            })
          } catch (err) {
            console.error(`[Dịch] Lô ${batchIdx} lần thử ${attempt + 1} lỗi:`, err)
          }
        }
        failedIndexes.push(...pending.map((s) => s.index))

        setProgress(Math.round((batchIdx / totalBatches) * 100))
      }

      saveSubtitleChanges(updatedSegments)
      if (failedIndexes.length > 0) {
        alert(
          `Dịch xong ${toTranslate.length - failedIndexes.length}/${toTranslate.length} câu.\n` +
            `${failedIndexes.length} câu chưa dịch được (dòng: ${failedIndexes.slice(0, 10).join(', ')}${failedIndexes.length > 10 ? '...' : ''}).\n` +
            `Bấm "Dịch AI" lần nữa để dịch tiếp các câu còn thiếu.`
        )
      } else {
        alert('Dịch thuật hoàn tất!')
      }
    } catch (err: any) {
      console.error(err)
      alert('Lỗi dịch thuật: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTimeShift = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) {
      alert('Vui lòng nhập số giây lệch hợp lệ (khác 0)!')
      return
    }
    const ms = Math.round(seconds * 1000)
    const updated = segments.map((seg) => {
      const newStart = Math.max(0, seg.start + ms)
      const newEnd = Math.max(0, seg.end + ms)
      return {
        ...seg,
        start: newStart,
        end: newEnd
      }
    })
    saveSubtitleChanges(updated)
    alert(`Đã dịch chuyển thời gian tất cả phụ đề đi ${seconds > 0 ? '+' : ''}${seconds} giây!`)
  }

  const handleGenerateAllTts = async () => {
    const isEdge = ttsVoice.startsWith('edge_')
    const isEleven = ttsVoice.startsWith('eleven_') || (ttsVoice.length === 20 && !ttsVoice.includes(' '));
    const keyToUse = isEleven ? settings.elevenLabsApiKey : settings.apiKey;
    if (!isEdge && !keyToUse) {
      alert(isEleven ? 'Vui lòng cấu hình ElevenLabs API Key trong Cài đặt trước!' : 'Vui lòng cấu hình OpenAI API Key trong Cài đặt trước!')
      return
    }

    if (segments.length === 0) {
      alert('Không có phụ đề để tạo thuyết minh!')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setStatusMessage('Đang chuẩn bị sinh giọng thuyết minh AI...')

    try {
      const validSegs = segments.filter((seg) => {
        const text = seg.translatedText || ''
        return text && text.replace(/\{[^}]*\}/g, '').replace(/\\N/g, ' ').trim()
      })

      const total = validSegs.length
      if (total === 0) {
        throw new Error('Không có dòng phụ đề nào hợp lệ để tạo thuyết minh!')
      }

      let completed = 0
      for (const seg of validSegs) {
        const text = seg.translatedText || ''
        const cleanText = text.replace(/\{[^}]*\}/g, '').replace(/\\N/g, ' ').trim()
        try {
          const speedToUse = ttsSpeed
          await window.api.getTtsAudio({
            text: cleanText,
            voice: ttsVoice,
            apiKey: settings.apiKey || '',
            baseUrl: settings.baseUrl || '',
            elevenLabsApiKey: settings.elevenLabsApiKey || '',
            speed: speedToUse
          })
        } catch (e) {
          console.error(`Failed to pre-fetch TTS for segment ${seg.index}:`, e)
        }
        completed++
        setProgress(Math.round((completed / total) * 100))
        // 120ms delay to prevent rate limit
        await new Promise((resolve) => setTimeout(resolve, 120))
      }

      setIsTtsGenerated(true)
      alert('Đã sinh giọng thuyết minh AI cho toàn bộ phụ đề thành công!')
    } catch (err: any) {
      console.error(err)
      alert('Lỗi khi tạo thuyết minh: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Hardsub (Open export modal options)
  const handleHardsubExport = async () => {
    if (segments.length === 0) {
      alert('Không có phụ đề để ghép vào video!')
      return
    }
    setShowExportModal(true)
  }

  // Run hardsub with tts or audio_only option
  const startHardsubExport = async (mode: 'hardsub' | 'tts' | 'audio_only') => {
    setShowExportModal(false)

    const isEdge = ttsVoice.startsWith('edge_')
    const isEleven = ttsVoice.startsWith('eleven_') || (ttsVoice.length === 20 && !ttsVoice.includes(' '));
    const needKey = mode === 'tts' || mode === 'audio_only';

    if (needKey) {
      if (!isEdge) {
        if (isEleven && !settings.elevenLabsApiKey) {
          alert('Vui lòng cấu hình ElevenLabs API Key trong Cài đặt trước khi xuất kèm thuyết minh AI!')
          return
        }
        if (!isEleven && !settings.apiKey) {
          alert('Vui lòng cấu hình OpenAI API Key trong Cài đặt trước khi xuất kèm thuyết minh AI!')
          return
        }
      }
    }

    // Filter and shift segments based on trim range
    const trimmedSegments = segments
      .filter((s) => s.end > trimStart && s.start < trimEnd)
      .map((s) => ({
        ...s,
        start: Math.max(0, s.start - trimStart),
        end: Math.min(trimEnd - trimStart, s.end - trimStart)
      }))

    try {
      if (mode === 'audio_only') {
        const defaultOutName = project.name + '_thuyetminh.mp3'
        const outputAudioPath = await window.api.selectSaveAudioPath(defaultOutName)
        if (!outputAudioPath) return // user canceled

        setIsProcessing(true)
        setExportStartTime(Date.now())
        setProgress(0)
        setStatusMessage('Đang chuẩn bị xuất âm thanh thuyết minh...')

        const cleanupProgress = window.api.onFfmpegProgress((data) => {
          if (data.type === 'export-dubbed-audio') {
            setProgress(data.percent)
          }
        })

        await window.api.exportDubbedAudio(outputAudioPath, trimmedSegments, {
          apiKey: settings.apiKey || '',
          baseUrl: settings.baseUrl || '',
          elevenLabsApiKey: settings.elevenLabsApiKey || '',
          voice: ttsVoice,
          ttsVolume: ttsVolume / 100,
          speed: ttsSpeed,
          autoSpeed,
          trimStart,
          trimEnd,
          audioOffset
        })

        cleanupProgress()
        setProgress(100)
        alert('Trích xuất âm thanh thuyết minh Việt thành công!')
        return
      }

      const enableTts = mode === 'tts'
      const defaultOutName = project.name + (enableTts ? '_thuyetminh.mp4' : '_vietsub.mp4')
      const outputVideoPath = await window.api.selectSaveVideoPath(defaultOutName)
      if (!outputVideoPath) return // user canceled

      setIsProcessing(true)
      setExportStartTime(Date.now())
      setProgress(0)
      setStatusMessage('Đang chuẩn bị ghép phụ đề...')

      // Listen to FFmpeg progress
      const cleanupProgress = window.api.onFfmpegProgress((data) => {
        if (data.type === 'burn-subtitles') {
          setProgress(data.percent)
        }
      })

      // Detect rotation metadata by comparing videoRect layout (actual preview bounds) with metadata bounds
      const isDisplayPortrait = videoRect.height > videoRect.width
      const isMetadataPortrait = videoHeight > videoWidth
      const isRotated = videoRect.width && videoRect.height ? (isDisplayPortrait !== isMetadataPortrait) : false

      let actualWidth = isRotated ? videoHeight : videoWidth
      let actualHeight = isRotated ? videoWidth : videoHeight

      // If we manually rotate the video 90 or 270 degrees, the output resolution's width and height will swap
      if (videoRotation === 90 || videoRotation === 270) {
        const temp = actualWidth
        actualWidth = actualHeight
        actualHeight = temp
      }

      const assContent = convertToAss(trimmedSegments, settings.subtitleStyle, actualWidth, actualHeight)
      setStatusMessage(enableTts ? 'Đang gọi TTS sinh giọng nói và ghép vào video...' : 'Đang ghép cứng phụ đề bằng FFmpeg (Có thể mất vài phút)...')

      await window.api.burnSubtitles(project.videoPath, assContent, outputVideoPath, {
        enableTts,
        apiKey: settings.apiKey || '',
        baseUrl: settings.baseUrl || '',
        elevenLabsApiKey: settings.elevenLabsApiKey || '',
        voice: ttsVoice,
        bgVolume: bgVolume / 100,
        ttsVolume: ttsVolume / 100,
        exportGreenScreen,
        speed: ttsSpeed,
        autoSpeed,
        segments: trimmedSegments,
        trimStart,
        trimEnd,
        audioOffset,
        isFlippedHorizontal,
        isFlippedVertical,
        videoRotation
      })
      cleanupProgress()

      setProgress(100)
      alert(enableTts ? 'Ghép phụ đề & Thuyết minh lồng tiếng xuất video thành công!' : 'Ghép phụ đề và xuất video thành công!')
    } catch (err: any) {
      console.error(err)
      alert('Lỗi khi xuất: ' + err.message)
    } finally {
      setIsProcessing(false)
      setExportStartTime(null)
    }
  }



  // Handle srt download
  const handleExportSRT = async () => {
    if (segments.length === 0) {
      alert('Không có phụ đề để xuất!')
      return
    }
    const srtText = stringifySRT(segments, true)
    const defaultName = project.name + '.srt'
    const success = await window.api.saveSubtitleFile(srtText, defaultName)
    if (success) {
      alert('Đã xuất file phụ đề thành công!')
    }
  }

  // Handle plain text export without timestamps
  const handleExportTxt = async () => {
    if (segments.length === 0) {
      alert('Không có phụ đề để xuất!')
      return
    }
    const txtText = stringifyTxt(segments, true)
    const defaultName = project.name + '.txt'
    const success = await window.api.saveSubtitleFile(txtText, defaultName)
    if (success) {
      alert('Đã xuất file văn bản thô thành công!')
    }
  }



  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {isProcessing && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(7, 8, 12, 0.85)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '40px',
              width: '400px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}
          >
            <Loader size={40} className="animate-spin" color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{statusMessage}</h3>

            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-indigo))',
                  transition: 'width 0.2s ease',
                  boxShadow: '0 0 10px var(--accent-purple)'
                }}
              />
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Tiến trình: {progress}%
            </span>
            {(() => {
              if (progress <= 0 || !exportStartTime) {
                return (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-8px' }}>
                    Đang tính toán thời gian còn lại...
                  </span>
                )
              }
              const elapsed = (Date.now() - exportStartTime) / 1000
              if (progress >= 100) return null
              const totalEstimated = elapsed / (progress / 100)
              const remaining = Math.max(0, totalEstimated - elapsed)
              const minutes = Math.floor(remaining / 60)
              const seconds = Math.floor(remaining % 60)
              return (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-8px' }}>
                  Dự kiến còn lại: {minutes} phút {seconds} giây
                </span>
              )
            })()}
          </div>
        </div>
      )}

      {/* Workspace Top Header */}
      <div
        className="top-bar"
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-sidebar)',
          padding: '0 20px',
          height: '56px',
          position: 'relative',
          zIndex: 600
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={onBack}>
            Quay lại
          </button>
        </div>

        {/* Toolbar of essential tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={`btn ${showBulkReplace ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowBulkReplace(!showBulkReplace)}
            title="Tìm kiếm & Thay thế hàng loạt"
          >
            <Search size={14} /> Tìm & Thay thế
          </button>
          <button
            className={`btn ${showSearchModal ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowSearchModal(true)}
            title="Tra cứu & Lọc phụ đề theo từ khóa"
          >
            <Search size={14} /> Tra cứu nhanh
          </button>
          <button
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: 'rgba(139, 92, 246, 0.4)'
            }}
            onClick={handleAddSegment}
            title="Thêm dòng phụ đề mới"
          >
            <Plus size={14} /> Thêm dòng
          </button>
          <button
            className={`btn ${showAiToolsPopover ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => {
              setShowAiToolsPopover(!showAiToolsPopover)
              setShowSubSettingsPopover(false)
            }}
            title="Công cụ AI tự động"
          >
            <Cpu size={14} /> Công cụ AI
          </button>
          <button
            className={`btn ${showSubSettingsPopover ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => {
              setShowSubSettingsPopover(!showSubSettingsPopover)
              setShowAiToolsPopover(false)
            }}
            title="Thiết lập phụ đề & thuyết minh"
          >
            <Palette size={14} /> Thiết lập phụ đề
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleExportSRT}>
            <Download size={16} /> Xuất phụ đề SRT
          </button>
          <button className="btn btn-secondary" onClick={handleExportTxt}>
            <FileText size={16} /> Xuất văn bản (.txt)
          </button>
          <button
            className="btn btn-primary"
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))'
            }}
            onClick={handleHardsubExport}
          >
            <Video size={16} /> Ghép vào Video (Xuất video)
          </button>
        </div>

        {/* Popovers */}
        {showAiToolsPopover && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              top: '60px',
              left: '420px',
              width: '450px',
              zIndex: 9999,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#13141f',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', userSelect: 'none', margin: 0, paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} color="var(--accent-purple)" /> Công cụ AI tự động
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                onClick={() => setShowAiToolsPopover(false)}
                title="Đóng"
              >
                <X size={16} />
              </button>
            </h3>
            
            {/* Whisper ASR Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: '#fff' }}>
                  1. Nhận diện giọng nói
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select
                  className="form-select"
                  style={{ padding: '4px 24px 4px 8px', fontSize: '0.8rem', width: '100px', height: '28px' }}
                  value={asrLanguage}
                  onChange={(e) => setAsrLanguage(e.target.value)}
                >
                  <option value="">Tự động</option>
                  <option value="zh">Trung</option>
                  <option value="en">Anh</option>
                  <option value="vi">Việt</option>
                </select>
                <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', height: '28px' }} onClick={handleRunASR}>
                  Chạy ASR
                </button>
              </div>
            </div>

             {/* Translation Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: '#fff' }}>
                  2. Dịch tự động bằng GPT
                </span>
              </div>
              <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', height: '28px' }} onClick={handleTranslate}>
                <Globe size={14} /> Dịch AI
              </button>
            </div>

            {/* Embedded Subtitle Extraction Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: '#fff' }}>
                  3. Trích xuất phụ đề nhúng trong Video
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Lấy phụ đề có sẵn (Anh/Trung...) nhúng sẵn trong video gốc
                </span>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '4px 10px', fontSize: '0.8rem', height: '28px' }}
                onClick={async () => {
                  setIsProcessing(true)
                  setStatusMessage('Đang trích xuất phụ đề nhúng từ video...')
                  try {
                    const srtText = await window.api.extractEmbeddedSubtitles(project.videoPath)
                    if (!srtText || !srtText.trim()) {
                      throw new Error('Không tìm thấy phụ đề nhúng trong file video này.')
                    }
                    const parsedSrt = parseSRT(srtText)
                    if (parsedSrt.length === 0) {
                      throw new Error('Phụ đề trích xuất trống hoặc không đúng định dạng.')
                    }
                    saveSubtitleChanges(parsedSrt)
                    alert(`Đã trích xuất và nhập thành công ${parsedSrt.length} dòng phụ đề từ video gốc!`)
                  } catch (err: any) {
                    console.error(err)
                    alert(
                      `Không thể trích xuất phụ đề nhúng từ video này.\n\n` +
                      `Lưu ý: Chức năng này chỉ trích xuất được phụ đề ẩn (soft subtitles) dạng luồng track có sẵn (như file MKV/MP4 có nhiều ngôn ngữ phụ đề ẩn).\n\n` +
                      `Nếu video của bạn có phụ đề cứng (chữ vẽ trực tiếp lên hình ảnh) hoặc chỉ có giọng nói, vui lòng sử dụng công cụ "1. Nhận diện giọng nói" (Nút "Chạy ASR" ở ngay hàng phía trên) để tự động tạo phụ đề!`
                    )
                  } finally {
                    setIsProcessing(false)
                  }
                }}
              >
                Trích xuất Sub
              </button>
            </div>

            {/* Time Shift Row */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                  4. Lệch thời gian (Time Shift)
                </span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Giây"
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.85rem',
                      width: '75px',
                      height: '28px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                    value={timeShiftValue}
                    onChange={(e) => setTimeShiftValue(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '0.8rem', height: '28px' }}
                    onClick={() => handleTimeShift(parseFloat(timeShiftValue))}
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Nhập số dương (ví dụ: 0.5) để phụ đề xuất hiện muộn hơn, số âm (ví dụ: -0.5) để xuất hiện sớm hơn.
              </span>
            </div>
          </div>
        )}

        {showSubSettingsPopover && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              top: '60px',
              left: '420px',
              width: '520px',
              zIndex: 9999,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#13141f',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', userSelect: 'none', margin: 0, paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={16} color="var(--accent-purple)" /> Thiết lập phụ đề & Thuyết minh
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                onClick={() => setShowSubSettingsPopover(false)}
                title="Đóng"
              >
                <X size={16} />
              </button>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', color: '#fff' }}>Cỡ chữ (px)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleStyleChange('fontSize', Math.max(12, (settings.subtitleStyle?.fontSize || 24) - 2))}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: '#fff',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Giảm cỡ chữ"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    className="form-input"
                    style={{ height: '28px', fontSize: '0.8rem', padding: '4px', width: '44px', textAlign: 'center', margin: 0 }}
                    min={12}
                    max={150}
                    value={settings.subtitleStyle?.fontSize || 24}
                    onChange={(e) => handleStyleChange('fontSize', Math.min(150, Math.max(12, parseInt(e.target.value) || 24)))}
                  />
                  <button
                    type="button"
                    onClick={() => handleStyleChange('fontSize', Math.min(150, (settings.subtitleStyle?.fontSize || 24) + 2))}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: '#fff',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Tăng cỡ chữ"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Độ trong suốt nền: {getBgOpacity(settings.subtitleStyle?.bgColor)}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer', height: '4px' }}
                  value={getBgOpacity(settings.subtitleStyle?.bgColor)}
                  onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vị trí dọc: {settings.subtitleStyle?.posY !== undefined ? settings.subtitleStyle.posY : 12}%</span>
                <input
                  type="range"
                  min={0}
                  max={95}
                  step={1}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer', height: '4px' }}
                  value={settings.subtitleStyle?.posY !== undefined ? settings.subtitleStyle.posY : 12}
                  onChange={(e) => handleStyleChange('posY', parseInt(e.target.value) || 12)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Vị trí ngang: {settings.subtitleStyle?.posX !== undefined ? settings.subtitleStyle.posX : 50}%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer', height: '4px' }}
                  value={settings.subtitleStyle?.posX !== undefined ? settings.subtitleStyle.posX : 50}
                  onChange={(e) => handleStyleChange('posX', parseInt(e.target.value) || 50)}
                />
              </div>
            </div>

            {/* Màu chữ / màu viền / độ dày viền — cùng nguồn settings.subtitleStyle với tab Cài đặt */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Màu chữ</span>
                <input
                  type="color"
                  value={settings.subtitleStyle?.color || '#ffffff'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                  style={{ width: '100%', height: '28px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-secondary)', cursor: 'pointer', padding: '2px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Màu viền</span>
                <input
                  type="color"
                  value={settings.subtitleStyle?.outlineColor || '#000000'}
                  onChange={(e) => handleStyleChange('outlineColor', e.target.value)}
                  style={{ width: '100%', height: '28px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-secondary)', cursor: 'pointer', padding: '2px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Độ dày viền: {settings.subtitleStyle?.outlineWidth !== undefined ? settings.subtitleStyle.outlineWidth : 2}px
                </span>
                <input
                  type="range"
                  min={0}
                  max={8}
                  step={1}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer', height: '4px', marginTop: '10px' }}
                  value={settings.subtitleStyle?.outlineWidth !== undefined ? settings.subtitleStyle.outlineWidth : 2}
                  onChange={(e) => handleStyleChange('outlineWidth', parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Dải nền che phụ đề gốc controls */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.01)',
                marginTop: '4px'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.subtitleStyle?.showBgStrip || false}
                  onChange={(e) => handleStyleChange('showBgStrip', e.target.checked)}
                  style={{ accentColor: 'var(--accent-purple)' }}
                />
                Dải nền che Sub gốc
              </label>

              {settings.subtitleStyle?.showBgStrip && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Kéo trực tiếp trên video preview để đổi vị trí, hoặc chỉnh bằng thanh trượt bên dưới
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Vị trí dọc: {settings.subtitleStyle.bgStripPosY !== undefined ? settings.subtitleStyle.bgStripPosY : 12}%
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer', height: '4px' }}
                        value={settings.subtitleStyle.bgStripPosY !== undefined ? settings.subtitleStyle.bgStripPosY : 12}
                        onChange={(e) => handleStyleChange('bgStripPosY', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Vị trí ngang: {settings.subtitleStyle.bgStripPosX !== undefined ? settings.subtitleStyle.bgStripPosX : 50}%
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer', height: '4px' }}
                        value={settings.subtitleStyle.bgStripPosX !== undefined ? settings.subtitleStyle.bgStripPosX : 50}
                        onChange={(e) => handleStyleChange('bgStripPosX', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Chiều cao: {settings.subtitleStyle.bgStripHeight !== undefined ? settings.subtitleStyle.bgStripHeight : 8}%
                      </span>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer', height: '4px' }}
                        value={settings.subtitleStyle.bgStripHeight !== undefined ? settings.subtitleStyle.bgStripHeight : 8}
                        onChange={(e) => handleStyleChange('bgStripHeight', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Chiều rộng: {settings.subtitleStyle.bgStripWidth !== undefined ? settings.subtitleStyle.bgStripWidth : 100}%
                      </span>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer', height: '4px' }}
                        value={settings.subtitleStyle.bgStripWidth !== undefined ? settings.subtitleStyle.bgStripWidth : 100}
                        onChange={(e) => handleStyleChange('bgStripWidth', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Màu dải nền</span>
                      <input
                        type="color"
                        value={settings.subtitleStyle.bgStripColor || '#15151d'}
                        onChange={(e) => handleStyleChange('bgStripColor', e.target.value)}
                        style={{ width: '100%', height: '28px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-secondary)', cursor: 'pointer', padding: '2px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Độ trong suốt: {settings.subtitleStyle.bgStripOpacity !== undefined ? settings.subtitleStyle.bgStripOpacity : 60}%
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer', height: '4px', marginTop: '6px' }}
                        value={settings.subtitleStyle.bgStripOpacity !== undefined ? settings.subtitleStyle.bgStripOpacity : 60}
                        onChange={(e) => handleStyleChange('bgStripOpacity', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-color)',
                marginTop: '4px'
              }}
            >
              <div style={{ flex: 1 }}>{renderVoiceSettings()}</div>
              <button
                className="btn btn-secondary"
                style={{
                  padding: '0 8px',
                  height: '28px',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  minWidth: '95px'
                }}
                onClick={handlePreviewVoice}
                disabled={isPreviewPlaying}
              >
                {isPreviewPlaying ? (
                  <Loader size={12} className="animate-spin" />
                ) : (
                  <Volume2 size={12} />
                )}
                {isPreviewPlaying ? 'Đang phát' : 'Nghe thử'}
              </button>
            </div>

            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '32px'
              }}
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn khôi phục lại mốc thời gian của tất cả các dòng phụ đề tiếng Việt khớp hoàn toàn với phụ đề gốc?')) {
                  const updated = segments.map((seg) => ({
                    ...seg,
                    start: seg.originalStart !== undefined ? seg.originalStart : seg.start,
                    end: seg.originalEnd !== undefined ? seg.originalEnd : seg.end
                  }))
                  saveSubtitleChanges(updated)
                  alert('Đã khôi phục toàn bộ thời lượng phụ đề gốc!')
                }
              }}
            >
              Khôi phục thời lượng gốc
            </button>

            <button
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                background: isTtsGenerated ? 'rgba(16, 185, 129, 0.1)' : 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))',
                borderColor: isTtsGenerated ? '#10b981' : 'transparent',
                color: isTtsGenerated ? '#10b981' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '32px'
              }}
              onClick={handleGenerateAllTts}
            >
              {isTtsGenerated ? '✓ Giọng thuyết minh đã sẵn sàng' : 'Tạo toàn bộ thuyết minh AI'}
            </button>
          </div>
        )}
      </div>

      {/* Main split workarea */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Panel: Subtitle List */}
        <div
          style={{
            width: '45%',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--bg-sidebar)'
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Biên tập phụ đề ({segments.length} dòng)
            </span>
          </div>

          {showBulkReplace && (
            <div
              className="glass-panel animate-fade-in"
              style={{
                margin: '12px 16px 4px 16px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tìm từ/cụm từ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ví dụ: ta"
                    style={{ height: '30px', fontSize: '0.8rem', padding: '4px 8px' }}
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Thay thế bằng</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ví dụ: tôi"
                    style={{ height: '30px', fontSize: '0.8rem', padding: '4px 8px' }}
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={segments.length > 0 && selectedSegIds.size === segments.length}
                      onChange={toggleSelectAll}
                      style={{ accentColor: 'var(--accent-purple)' }}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>Chọn tất cả dòng</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={isWholeWord}
                      onChange={(e) => setIsWholeWord(e.target.checked)}
                      style={{ accentColor: 'var(--accent-purple)' }}
                    />
                    Khớp cả từ
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={isCaseSensitive}
                      onChange={(e) => setIsCaseSensitive(e.target.checked)}
                      style={{ accentColor: 'var(--accent-purple)' }}
                    />
                    Phân biệt hoa/thường
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedSegIds.size > 0 && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.8rem', height: '28px', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)' }}
                      onClick={() => handleBulkReplace(true)}
                    >
                      Thay thế dòng chọn ({selectedSegIds.size})
                    </button>
                  )}
                  <button
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '0.8rem', height: '28px' }}
                    onClick={() => handleBulkReplace(false)}
                  >
                    Thay thế tất cả
                  </button>
                </div>
              </div>

              {replaceStatus && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: replaceStatus.includes('thành công') ? 'var(--text-success)' : 'var(--text-secondary)',
                    marginTop: '4px',
                    textAlign: 'right'
                  }}
                >
                  {replaceStatus}
                </div>
              )}
            </div>
          )}

          {/* Subtitle scroll area */}
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {segments.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                Chưa có phụ đề nào. Vui lòng bấm vào nút AI nhận diện giọng nói ở bảng bên phải để bắt đầu.
              </div>
            ) : (
              segments.map((seg) => (
                <div
                  key={seg.id}
                  id={`segment-${seg.id}`}
                  className="glass-panel animate-fade-in"
                  style={{
                    padding: '12px',
                    borderColor: seg.id === activeSegId ? 'var(--accent-purple)' : 'var(--border-color)',
                    background: seg.id === activeSegId ? 'rgba(139, 92, 246, 0.04)' : 'rgba(255,255,255,0.01)',
                    boxShadow: seg.id === activeSegId ? '0 0 12px rgba(139, 92, 246, 0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    manuallySelectedSegIdRef.current = seg.id
                    seekVideo(seg.start)
                    setActiveSegId(seg.id)
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedSegIds.has(seg.id)}
                        onChange={() => toggleSelectSegment(seg.id)}
                        onClick={(e) => e.stopPropagation()} // Prevent player seeking on click
                        style={{ accentColor: 'var(--accent-purple)', cursor: 'pointer', margin: 0 }}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-purple)' }}>
                        #{seg.index}
                      </span>
                    </div>

                    {/* Time fields */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                      <span
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--border-color)',
                          color: '#fff',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          textAlign: 'center',
                          borderRadius: '4px',
                          width: '90px',
                          padding: '2px',
                          display: 'inline-block',
                          userSelect: 'none',
                          cursor: 'default'
                        }}
                      >
                        {formatTime(seg.start)}
                      </span>
                      <ArrowRight size={10} color="var(--text-muted)" />
                      <span
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--border-color)',
                          color: '#fff',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          textAlign: 'center',
                          borderRadius: '4px',
                          width: '90px',
                          padding: '2px',
                          display: 'inline-block',
                          userSelect: 'none',
                          cursor: 'default'
                        }}
                      >
                        {formatTime(seg.end)}
                      </span>
                    </div>

                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSegment(seg.id)
                      }}
                    >
                      <Trash2 size={14} hover-color="red" />
                    </button>
                  </div>

                  {/* Edit Text fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gốc</span>
                        <button
                          type="button"
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--accent-cyan)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: 0
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLookupHanViet(seg.id, seg.text)
                          }}
                          disabled={lookupLoading[seg.id]}
                        >
                          {lookupLoading[seg.id] ? 'Đang tra...' : 'Tra Hán Việt'}
                        </button>
                      </div>
                      <textarea
                        className="goc-textarea"
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: '#fff',
                          padding: '6px',
                          fontSize: '0.85rem',
                          resize: 'none'
                        }}
                        rows={1}
                        value={seg.text || ''}
                        onChange={(e) => handleTextChange(seg.id, 'text', e.target.value)}
                        onFocus={() => {
                          manuallySelectedSegIdRef.current = seg.id
                          setActiveSegId(seg.id)
                          seekVideo(seg.start)
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault()
                            const inputs = Array.from(document.querySelectorAll('.vietsub-textarea')) as HTMLTextAreaElement[]
                            const currentIdx = segments.findIndex(s => s.id === seg.id)
                            if (e.shiftKey) {
                              const prevInput = inputs[currentIdx - 1]
                              if (prevInput) prevInput.focus()
                            } else {
                              const currentInput = inputs[currentIdx]
                              if (currentInput) currentInput.focus()
                            }
                          }
                        }}
                      />

                      {lookupResults[seg.id] && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '8px 10px',
                            background: 'rgba(0,0,0,0.25)',
                            border: '1px dashed rgba(139, 92, 246, 0.3)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Pinyin:</span>{' '}
                            <span style={{ color: 'var(--accent-cyan)' }}>{lookupResults[seg.id].pinyin}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Hán Việt:</span>{' '}
                              <span style={{ color: '#fff', fontWeight: 600 }}>{lookupResults[seg.id].hanviet}</span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '2px 6px', fontSize: '0.65rem', height: '20px' }}
                              onClick={() => applyHanVietText(seg.id, lookupResults[seg.id].hanviet)}
                            >
                              Áp dụng
                            </button>
                          </div>
                          {lookupResults[seg.id].words && lookupResults[seg.id].words.length > 0 && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '2px' }}>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Từ điển cụ thể:</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {lookupResults[seg.id].words.map((w: any, idx: number) => (
                                  <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'baseline', lineHeight: '1.2' }}>
                                    <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{w.zh}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({w.pinyin} - {w.hanviet}):</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{w.meaning}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                            <button
                              type="button"
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.65rem' }}
                              onClick={() => {
                                setLookupResults((prev) => {
                                  const updated = { ...prev }
                                  delete updated[seg.id]
                                  return updated
                                })
                              }}
                            >
                              Đóng tra cứu
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)' }}>ViệtSub</span>
                        {seg.translatedText && seg.translatedText.trim() && (
                          <button
                            type="button"
                            style={{
                              fontSize: '0.65rem',
                              color: 'var(--accent-purple)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: 0
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (videoRef.current && !videoRef.current.paused) {
                                videoRef.current.pause()
                              }
                              playTtsAudio(seg.translatedText || '')
                            }}
                            title="Nghe thử giọng thuyết minh AI câu này"
                          >
                            <Volume2 size={11} /> Nghe thử
                          </button>
                        )}
                      </div>
                      <textarea
                        className="vietsub-textarea"
                        style={{
                          width: '100%',
                          background: 'rgba(139,92,246,0.02)',
                          border: '1px solid rgba(139,92,246,0.15)',
                          borderRadius: '4px',
                          color: '#c084fc',
                          padding: '6px',
                          fontSize: '0.85rem',
                          resize: 'none'
                        }}
                        rows={1}
                        value={seg.translatedText || ''}
                        onChange={(e) => handleTextChange(seg.id, 'translatedText', e.target.value)}
                        placeholder="Chưa dịch..."
                        onFocus={() => {
                          manuallySelectedSegIdRef.current = seg.id
                          setActiveSegId(seg.id)
                          seekVideo(seg.start)
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault()
                            const inputs = Array.from(document.querySelectorAll('.vietsub-textarea')) as HTMLTextAreaElement[]
                            const currentIdx = segments.findIndex(s => s.id === seg.id)
                            if (e.shiftKey) {
                              const gocInputs = Array.from(document.querySelectorAll('.goc-textarea')) as HTMLTextAreaElement[]
                              const currentGoc = gocInputs[currentIdx]
                              if (currentGoc) currentGoc.focus()
                            } else {
                              const nextInput = inputs[currentIdx + 1]
                              if (nextInput) nextInput.focus()
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Video & AI Panel */}
        <div style={{ width: '55%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Upper Right: Player */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              background: '#000',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            {/* Custom Video Wrapper for Subtitles Overlay */}
            <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 40px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <video
                ref={videoRef}
                muted={isMuted}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scaleX(${isFlippedHorizontal ? -1 : 1}) scaleY(${isFlippedVertical ? -1 : 1}) rotate(${videoRotation}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                src={`media://local/${encodeURIComponent(project.videoPath.replace(/\\/g, '/'))}`}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={(e) => setDuration(Math.floor(e.currentTarget.duration * 1000))}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => {
                  setVideoWidth(e.currentTarget.videoWidth)
                  setVideoHeight(e.currentTarget.videoHeight)
                }}
              />

              {/* Subtitles Overlay bounding container (aligned exactly to actual video stream) */}
              <div
                style={{
                  position: 'absolute',
                  left: `${videoRect.left}px`,
                  top: `${videoRect.top}px`,
                  width: `${videoRect.width}px`,
                  height: `${videoRect.height}px`,
                  pointerEvents: 'none',
                  zIndex: 10,
                  overflow: 'hidden'
                }}
              >
                {settings.subtitleStyle?.showBgStrip && (() => {
                  const stripPosX = settings.subtitleStyle.bgStripPosX !== undefined ? settings.subtitleStyle.bgStripPosX : 50
                  const stripPosY = settings.subtitleStyle.bgStripPosY !== undefined ? settings.subtitleStyle.bgStripPosY : 12
                  const stripWidth = settings.subtitleStyle.bgStripWidth !== undefined ? settings.subtitleStyle.bgStripWidth : 100
                  const stripHeight = settings.subtitleStyle.bgStripHeight !== undefined ? settings.subtitleStyle.bgStripHeight : 8
                  return (
                    <div
                      title="Kéo để đổi vị trí dải nền che"
                      style={{
                        position: 'absolute',
                        bottom: `${stripPosY}%`,
                        left: `${stripPosX}%`,
                        width: `${stripWidth}%`,
                        height: `${stripHeight}%`,
                        transform: 'translate(-50%, 50%)',
                        background: settings.subtitleStyle.bgStripColor || '#15151d',
                        opacity: (settings.subtitleStyle.bgStripOpacity !== undefined ? settings.subtitleStyle.bgStripOpacity : 60) / 100,
                        // backdrop-filter chỉ có hiệu lực trong preview (không dịch được sang ASS);
                        // video xuất dùng \blur4 (xem convertToAss) làm mờ viền tương tự
                        backdropFilter: 'blur(6px)',
                        zIndex: 1,
                        cursor: 'grab',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const el = e.currentTarget as HTMLDivElement
                        const container = el.parentElement
                        if (!container) return
                        const rect = container.getBoundingClientRect()
                        let newX = stripPosX
                        let newY = stripPosY
                        el.style.cursor = 'grabbing'
                        const onMove = (me: MouseEvent): void => {
                          newX = Math.round(Math.min(100, Math.max(0, ((me.clientX - rect.left) / rect.width) * 100)))
                          newY = Math.round(Math.min(100, Math.max(0, (1 - (me.clientY - rect.top) / rect.height) * 100)))
                          el.style.left = `${newX}%`
                          el.style.bottom = `${newY}%`
                        }
                        const onUp = (): void => {
                          window.removeEventListener('mousemove', onMove)
                          window.removeEventListener('mouseup', onUp)
                          el.style.cursor = 'grab'
                          onChangeSettings({
                            ...settings,
                            subtitleStyle: { ...settings.subtitleStyle, bgStripPosX: newX, bgStripPosY: newY }
                          })
                        }
                        window.addEventListener('mousemove', onMove)
                        window.addEventListener('mouseup', onUp)
                      }}
                    />
                  )
                })()}
                {(() => {
                  const isInteractionActive = isDraggingIndividualClipRef.current || isTrimmingClipLeftRef.current || isTrimmingClipRightRef.current
                  const activeSegment = segments.find((s) => {
                    let segStart = s.start
                    let segEnd = s.end
                    if (isInteractionActive && draggedClipIdRef.current === s.id && draggedClipTimesRef.current) {
                      segStart = draggedClipTimesRef.current.start
                      segEnd = draggedClipTimesRef.current.end
                    }
                    // Hiển thị sớm lead-in 200ms so với mốc nói thật (spec 05 FR2)
                    return currentTime >= displayStart(segStart + audioOffset) && currentTime <= (segEnd + audioOffset)
                  })

                  // Luôn render container (ẩn khi không có câu active) để vòng lặp rAF
                  // cập nhật chữ trực tiếp trên DOM khi phát video — không re-render React
                  const scale = videoRect.height ? videoRect.height / 720 : 1;
                  const fontSize = Math.round((settings.subtitleStyle?.fontSize || 24) * scale);
                  const oW = (settings.subtitleStyle?.outlineWidth || 2) * scale;
                  const oColor = settings.subtitleStyle?.outlineColor || '#000000';
                  
                  const isBgTransparent = !settings.subtitleStyle?.bgColor || 
                                          settings.subtitleStyle.bgColor === 'transparent' ||
                                          settings.subtitleStyle.bgColor.replace(/\s+/g, '') === 'rgba(0,0,0,0)';

                  return (
                    <div
                      id="subtitle-preview-overlay"
                      title="Kéo để đổi vị trí phụ đề"
                      style={{
                        position: 'absolute',
                        bottom: `${settings.subtitleStyle?.posY !== undefined ? settings.subtitleStyle.posY : 12}%`,
                        left: `${settings.subtitleStyle?.posX !== undefined ? settings.subtitleStyle.posX : 50}%`,
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                        width: 'max-content',
                        maxWidth: '95%',
                        boxSizing: 'border-box',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        zIndex: 2,
                        cursor: 'grab',
                        display: activeSegment ? undefined : 'none',
                        // Cha (bounding container) đặt pointerEvents:none để chuột xuyên
                        // xuống video — bật lại riêng cho dòng phụ đề để kéo-thả được
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => {
                        // Kéo-thả vị trí phụ đề: cập nhật DOM trực tiếp khi kéo (mượt),
                        // chỉ lưu settings 1 lần lúc thả chuột (tránh spam ghi settings/IPC)
                        e.preventDefault()
                        e.stopPropagation()
                        const el = e.currentTarget as HTMLDivElement
                        const container = el.parentElement
                        if (!container) return
                        const rect = container.getBoundingClientRect()
                        let newX = settings.subtitleStyle?.posX !== undefined ? settings.subtitleStyle.posX : 50
                        let newY = settings.subtitleStyle?.posY !== undefined ? settings.subtitleStyle.posY : 12
                        el.style.cursor = 'grabbing'
                        const onMove = (me: MouseEvent): void => {
                          // Chỉ giữ trong khung hình (0-100), không giới hạn thêm
                          newX = Math.round(Math.min(100, Math.max(0, ((me.clientX - rect.left) / rect.width) * 100)))
                          newY = Math.round(Math.min(95, Math.max(0, (1 - (me.clientY - rect.top) / rect.height) * 100)))
                          el.style.left = `${newX}%`
                          el.style.bottom = `${newY}%`
                        }
                        const onUp = (): void => {
                          window.removeEventListener('mousemove', onMove)
                          window.removeEventListener('mouseup', onUp)
                          el.style.cursor = 'grab'
                          onChangeSettings({
                            ...settings,
                            subtitleStyle: { ...settings.subtitleStyle, posX: newX, posY: newY }
                          })
                        }
                        window.addEventListener('mousemove', onMove)
                        window.addEventListener('mouseup', onUp)
                      }}
                    >
                      <span
                        id={activeSegment ? `subtitle-preview-text-${activeSegment.id}` : 'subtitle-preview-text-none'}
                        style={{
                          fontFamily: 'Arial',
                          fontSize: `${fontSize}px`,
                          color: settings.subtitleStyle?.color || '#ffffff',
                          fontWeight: 'bold',
                          wordBreak: 'break-word',
                          display: 'inline-block',
                          backgroundColor: isBgTransparent ? 'transparent' : (settings.subtitleStyle?.bgColor || 'rgba(15, 17, 23, 0.75)'),
                          borderRadius: '0px',
                          padding: isBgTransparent ? '0px' : `${Math.max(2, Math.round(oW))}px ${Math.max(4, Math.round(oW * 1.5))}px`,
                          textShadow: isBgTransparent ? `
                            -${oW}px -${oW}px 0 ${oColor},  
                            0px -${oW}px 0 ${oColor},
                            ${oW}px -${oW}px 0 ${oColor},
                            -${oW}px 0px 0 ${oColor},
                            ${oW}px 0px 0 ${oColor},
                            -${oW}px ${oW}px 0 ${oColor},
                            0px ${oW}px 0 ${oColor},
                            ${oW}px ${oW}px 0 ${oColor}
                          ` : 'none'
                        }}
                      >
                        {activeSegment ? activeSegment.translatedText || activeSegment.text : ''}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Custom Player Controls */}
            <div
              style={{
                height: '40px',
                width: '100%',
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <button
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                  onClick={handleSplitSegmentAtPlayhead}
                  title="Chia đôi phân cảnh tại con trỏ phát (Ctrl + B hoặc B)"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Scissors size={13} style={{ color: '#fbbf24' }} />
                  <span>Chia đôi (B)</span>
                </button>

                <button
                  disabled={undoStack.current.length === 0}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    cursor: undoStack.current.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    opacity: undoStack.current.length === 0 ? 0.4 : 1
                  }}
                  onClick={handleUndo}
                  title="Hoàn tác chỉnh sửa (Ctrl + Z)"
                  onMouseEnter={(e) => {
                    if (undoStack.current.length > 0) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (undoStack.current.length > 0) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <Undo size={13} style={{ color: '#fff' }} />
                  <span>Hoàn tác</span>
                </button>

                <button
                  disabled={redoStack.current.length === 0}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    cursor: redoStack.current.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    opacity: redoStack.current.length === 0 ? 0.4 : 1
                  }}
                  onClick={handleRedo}
                  title="Làm lại chỉnh sửa (Ctrl + Y hoặc Ctrl + Shift + Z)"
                  onMouseEnter={(e) => {
                    if (redoStack.current.length > 0) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (redoStack.current.length > 0) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <Redo size={13} style={{ color: '#fff' }} />
                  <span>Làm lại</span>
                </button>

                {isTtsGenerated ? (
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      color: '#10b981',
                      userSelect: 'none',
                      fontWeight: 600
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={enableTts}
                      onChange={(e) => {
                        setEnableTts(e.target.checked)
                      }}
                    />
                    Bật thuyết minh (TTS) Tiếng Việt
                  </label>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    (Hãy nhấn nút "Tạo toàn bộ thuyết minh AI" ở bảng bên phải để bắt đầu thuyết minh)
                  </span>
                )}

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isMuted}
                    onChange={(e) => setIsMuted(e.target.checked)}
                  />
                  Tắt âm thanh gốc
                </label>

                <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.12)', margin: '0 4px' }} />

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isFlippedHorizontal}
                    onChange={(e) => setIsFlippedHorizontal(e.target.checked)}
                  />
                  Lật ngang
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isFlippedVertical}
                    onChange={(e) => setIsFlippedVertical(e.target.checked)}
                  />
                  Lật dọc
                </label>

                <button
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginLeft: '4px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onClick={() => setVideoRotation((prev) => (prev + 90) % 360)}
                  title="Xoay hình video 90 độ"
                >
                  Xoay hình ({videoRotation}°)
                </button>
              </div>

              <div
                id="playhead-time-display"
                style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>



        </div>
      </div>

      {/* Timeline Panel */}
      <div
        ref={timelineRef}
        style={{
          height: '170px',
          flexShrink: 0,
          borderTop: '1px solid var(--border-color)',
          background: '#0f1013', // Pitch dark background like CapCut
          display: 'flex',
          flexDirection: 'column',
          padding: '10px 0px', // horizontal padding removed so scrollbar takes full width
          position: 'relative',
          userSelect: 'none'
        }}
      >
        {/* Horizontal Scroll Wrapper */}
        <div
          ref={scrollWrapperRef}
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            flex: 1,
            width: '100%',
            position: 'relative'
          }}
        >
          {/* Zoomable Inner Container */}
          <div
            ref={innerContainerRef}
            style={{
              width: `${zoom * 100}%`,
              minWidth: '100%',
              height: '100%',
              position: 'relative',
              boxSizing: 'border-box'
            }}
          >
            {/* Ruler Row */}
            <div
              style={{
                height: '24px',
                width: '100%',
                position: 'relative',
                cursor: 'ew-resize',
                background: '#18191c', // Lighter grey background for ruler
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '6px',
                borderRadius: '4px'
              }}
              onMouseDown={(e) => {
                isDraggingPlayheadRef.current = true
                document.body.style.userSelect = 'none'
                const wrapper = scrollWrapperRef.current
                if (!wrapper || duration <= 0) return
                const rect = wrapper.getBoundingClientRect()
                const scrollLeft = wrapper.scrollLeft
                const scrollWidth = wrapper.scrollWidth
                const timelineWidth = scrollWidth - 40
                const relativeX = e.clientX - rect.left - 20 + scrollLeft
                const pct = Math.max(0, Math.min(1, relativeX / timelineWidth))
                const timeMs = Math.round(pct * duration)
                draggedTimeRef.current = timeMs
                seekVideo(timeMs)
              }}
            >
              {/* Time marks */}
              {(() => {
                if (duration <= 0) return null
                const marks: React.ReactElement[] = []
                const step = getTickStep()
                const subStep = step / 5
                
                for (let time = 0; time <= duration; time += subStep) {
                  const isMajor = Math.round(time % step) === 0 || time === 0
                  const pct = time / duration
                  marks.push(
                    <div
                      key={time}
                      style={{
                        position: 'absolute',
                        left: `calc(20px + ${pct * 100}% - ${pct * 40}px - 1px)`,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      {isMajor && (
                        <span style={{ fontSize: '0.65rem', color: '#a3a3a3', fontFamily: 'monospace', transform: 'translateY(-2px)' }}>
                          {formatTime(time).slice(3, 8)}
                        </span>
                      )}
                      <div style={{ 
                        width: '1px', 
                        height: isMajor ? '6px' : '3px', 
                        background: isMajor ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)' 
                      }} />
                    </div>
                  )
                }
                return marks
              })()}
            </div>

            {/* Video Track Row */}
            <div
              style={{
                height: '32px',
                width: '100%',
                background: '#1e1f22',
                borderRadius: '4px',
                position: 'relative',
                marginBottom: '6px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.03)'
              }}
            >
              {/* Video track label */}
              <span style={{ position: 'sticky', left: '10px', top: '8px', zIndex: 5, fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', display: 'inline-block' }}>
                VIDEO
              </span>

              {/* Out of Trim Left */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `calc(20px + ${(trimStart / (duration || 1)) * 100}% - ${(trimStart / (duration || 1)) * 40}px)`,
                  background: 'rgba(0,0,0,0.65)',
                  zIndex: 2
                }}
              />

              {/* Video clip representation */}
              <div
                style={{
                  position: 'absolute',
                  left: `calc(20px + ${(trimStart / (duration || 1)) * 100}% - ${(trimStart / (duration || 1)) * 40}px)`,
                  top: 0,
                  bottom: 0,
                  width: `calc(${((trimEnd - trimStart) / (duration || 1)) * 100}% - ${((trimEnd - trimStart) / (duration || 1)) * 40}px)`,
                  background: 'linear-gradient(90deg, #2d3139, #3a3f4d)', // Sleek CapCut-style clip block
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '60px'
                }}
              >
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                  {project.videoName || 'video.mp4'}
                </span>
              </div>

              {/* Active border overlay for trimmed area */}
              <div
                style={{
                  position: 'absolute',
                  left: `calc(20px + ${(trimStart / (duration || 1)) * 100}% - ${(trimStart / (duration || 1)) * 40}px)`,
                  top: 0,
                  bottom: 0,
                  width: `calc(${((trimEnd - trimStart) / (duration || 1)) * 100}% - ${((trimEnd - trimStart) / (duration || 1)) * 40}px)`,
                  borderLeft: '2px solid #ffffff',
                  borderRight: '2px solid #ffffff',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              />

              {/* Out of Trim Right */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  left: `calc(20px + ${(trimEnd / (duration || 1)) * 100}% - ${(trimEnd / (duration || 1)) * 40}px)`,
                  background: 'rgba(0,0,0,0.65)',
                  zIndex: 2
                }}
              />

              {/* Left Bracket Handle */}
              <div
                style={{
                  position: 'absolute',
                  left: `calc(20px + ${(trimStart / (duration || 1)) * 100}% - ${(trimStart / (duration || 1)) * 40}px - 4px)`,
                  top: 0,
                  bottom: 0,
                  width: '8px',
                  background: '#ffffff',
                  borderRadius: '2px 0 0 2px',
                  cursor: 'ew-resize',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 4px rgba(0,0,0,0.5)'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  isDraggingLeftTrimRef.current = true
                  document.body.style.userSelect = 'none'
                }}
              >
                <div style={{ width: '1px', height: '12px', background: '#000' }} />
              </div>

              {/* Right Bracket Handle */}
              <div
                style={{
                  position: 'absolute',
                  left: `calc(20px + ${(trimEnd / (duration || 1)) * 100}% - ${(trimEnd / (duration || 1)) * 40}px - 4px)`,
                  top: 0,
                  bottom: 0,
                  width: '8px',
                  background: '#ffffff',
                  borderRadius: '0 2px 2px 0',
                  cursor: 'ew-resize',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 4px rgba(0,0,0,0.5)'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  isDraggingRightTrimRef.current = true
                  document.body.style.userSelect = 'none'
                }}
              >
                <div style={{ width: '1px', height: '12px', background: '#000' }} />
              </div>
            </div>

            {/* Text/Subtitle Track Row */}
            <div
              style={{
                height: `${Math.max(1, maxSubtitleLane + 1) * 28 + 12}px`,
                width: '100%',
                background: '#1e1f22',
                borderRadius: '4px',
                position: 'relative',
                marginBottom: '6px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.03)'
              }}
            >
              <span style={{ position: 'sticky', left: '10px', top: '8px', zIndex: 10, fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', display: 'inline-block' }}>
                TEXT (PHỤ ĐỀ)
              </span>

              {/* Subtitle Clips */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {duration > 0 && segments.map((seg) => {
                  const leftPct = seg.start / duration
                  const widthPct = (seg.end - seg.start) / duration
                  const isActive = seg.id === activeSegId
                  const laneIndex = subtitleLanes[seg.id] ?? 0

                  return (
                    <div
                      key={seg.id}
                      id={`clip-${seg.id}`}
                      className={`timeline-clip subtitle-clip ${isActive ? 'active' : ''}`}
                      onMouseDown={(e) => handleClipMouseDown(e, seg, 'subtitle')}
                      onContextMenu={(e) => handleClipContextMenu(e, seg.id)}
                      style={{
                        position: 'absolute',
                        left: `calc(20px + ${leftPct * 100}% - ${leftPct * 40}px)`,
                        width: `calc(${widthPct * 100}% - ${widthPct * 40}px)`,
                        height: '24px',
                        top: `${laneIndex * 28 + 6}px`,
                        zIndex: isActive ? 6 : 5,
                        background: isActive 
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.45), rgba(217, 119, 6, 0.45))'
                          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.25))',
                        border: isActive
                          ? '1px solid #fbbf24'
                          : '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '3px',
                        boxShadow: isActive ? '0 0 8px rgba(245, 158, 11, 0.4)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 10px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        boxSizing: 'border-box',
                        pointerEvents: 'auto',
                        cursor: 'grab'
                      }}
                    >
                      {/* Left Trim Handle */}
                      <div
                        className="trim-handle left-handle"
                        onMouseDown={(e) => handleClipTrimMouseDown(e, seg, 'subtitle', 'left')}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          background: isActive ? '#fff' : 'rgba(251, 191, 36, 0.7)',
                          cursor: 'w-resize',
                          zIndex: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '3px 0 0 3px'
                        }}
                      >
                        <div style={{ width: '1px', height: '10px', background: '#000', opacity: 0.5 }} />
                      </div>

                      {/* CapCut Style T Icon */}
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, background: '#fbbf24', color: '#000', padding: '0px 3px', borderRadius: '2px', marginRight: '4px', flexShrink: 0, zIndex: 1 }}>
                        T
                      </span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          color: isActive ? '#fff' : '#fbbf24',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          zIndex: 1
                        }}
                      >
                        #{seg.index}: {seg.translatedText || seg.text}
                      </span>

                      {/* Right Trim Handle */}
                      <div
                        className="trim-handle right-handle"
                        onMouseDown={(e) => handleClipTrimMouseDown(e, seg, 'subtitle', 'right')}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          background: isActive ? '#fff' : 'rgba(251, 191, 36, 0.7)',
                          cursor: 'e-resize',
                          zIndex: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '0 3px 3px 0'
                        }}
                      >
                        <div style={{ width: '1px', height: '10px', background: '#000', opacity: 0.5 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Audio Track Row */}
            <div
              style={{
                height: `${Math.max(1, maxAudioLane + 1) * 28 + 12}px`,
                width: '100%',
                background: '#1e1f22',
                borderRadius: '4px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.03)',
                cursor: 'grab'
              }}
              onMouseDown={(e) => {
                isDraggingAudioShiftRef.current = true
                dragStartXRef.current = e.clientX
                dragStartOffsetRef.current = audioOffset
                draggedAudioOffsetRef.current = audioOffset
                document.body.style.userSelect = 'none'
              }}
            >
              <span style={{ position: 'sticky', left: '10px', top: '8px', zIndex: 10, fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', display: 'inline-block' }}>
                AUDIO (KÉO NGANG ĐỒNG BỘ GIỌNG TTS: {audioOffset > 0 ? `+${audioOffset}ms` : `${audioOffset}ms`})
              </span>

              {/* Voice Clips */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {duration > 0 && segments.map((seg) => {
                  const leftPct = (seg.start + (seg.audioOffset || 0) + audioOffset) / duration
                  const widthPct = (seg.end - seg.start) / duration
                  const isActive = seg.id === activeSegId
                  const laneIndex = audioLanes[seg.id] ?? 0

                  return (
                    <div
                      key={seg.id}
                      id={`audio-clip-${seg.id}`}
                      className={`timeline-clip audio-clip ${isActive ? 'active' : ''}`}
                      onMouseDown={(e) => handleClipMouseDown(e, seg, 'audio')}
                      onContextMenu={(e) => handleClipContextMenu(e, seg.id)}
                      style={{
                        position: 'absolute',
                        left: `calc(20px + ${leftPct * 100}% - ${leftPct * 40}px)`,
                        width: `calc(${widthPct * 100}% - ${widthPct * 40}px)`,
                        height: '24px',
                        top: `${laneIndex * 28 + 6}px`,
                        zIndex: isActive ? 6 : 5,
                        background: isActive 
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.45), rgba(5, 150, 105, 0.45))'
                          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.25))',
                        border: isActive
                          ? '1px solid #34d399'
                          : '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '3px',
                        boxShadow: isActive ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 10px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        boxSizing: 'border-box',
                        pointerEvents: 'auto',
                        cursor: 'grab'
                      }}
                    >
                      {/* Left Trim Handle */}
                      <div
                        className="trim-handle left-handle"
                        onMouseDown={(e) => handleClipTrimMouseDown(e, seg, 'audio', 'left')}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          background: isActive ? '#fff' : 'rgba(52, 211, 153, 0.7)',
                          cursor: 'w-resize',
                          zIndex: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '3px 0 0 3px'
                        }}
                      >
                        <div style={{ width: '1px', height: '10px', background: '#000', opacity: 0.5 }} />
                      </div>

                      {/* Waveform graphic */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5px', marginRight: '4px', flexShrink: 0, zIndex: 1 }}>
                        <div style={{ width: '1.5px', height: '6px', background: isActive ? '#34d399' : 'rgba(52, 211, 153, 0.7)', borderRadius: '1px' }} />
                        <div style={{ width: '1.5px', height: '12px', background: isActive ? '#34d399' : 'rgba(52, 211, 153, 0.9)', borderRadius: '1px' }} />
                        <div style={{ width: '1.5px', height: '8px', background: isActive ? '#34d399' : 'rgba(52, 211, 153, 0.8)', borderRadius: '1px' }} />
                        <div style={{ width: '1.5px', height: '14px', background: isActive ? '#34d399' : 'rgba(52, 211, 153, 1)', borderRadius: '1px' }} />
                        <div style={{ width: '1.5px', height: '5px', background: isActive ? '#34d399' : 'rgba(52, 211, 153, 0.6)', borderRadius: '1px' }} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          color: isActive ? '#fff' : '#34d399',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          zIndex: 1
                        }}
                      >
                        #{seg.index}: Audio
                      </span>

                      {/* Right Trim Handle */}
                      <div
                        className="trim-handle right-handle"
                        onMouseDown={(e) => handleClipTrimMouseDown(e, seg, 'audio', 'right')}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          background: isActive ? '#fff' : 'rgba(52, 211, 153, 0.7)',
                          cursor: 'e-resize',
                          zIndex: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '0 3px 3px 0'
                        }}
                      >
                        <div style={{ width: '1px', height: '10px', background: '#000', opacity: 0.5 }} />
                      </div>
                    </div>
                  )
                })}
              </div>


            </div>

            {/* Vertical Playhead Line running across tracks */}
            {duration > 0 && (
              <div
                ref={playheadRef}
                style={{
                  position: 'absolute',
                  left: `calc(20px + ${(currentTime / duration) * 100}% - ${(currentTime / duration) * 40}px)`,
                  top: '0px',
                  bottom: '0px',
                  width: '2px',
                  background: '#ff4d4f', // Bright red playhead
                  zIndex: 12,
                  pointerEvents: 'none',
                  boxShadow: '0 0 6px rgba(255, 77, 79, 0.5)'
                }}
              >
                {/* Playhead handle needle */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-5px',
                    width: '12px',
                    height: '14px',
                    background: '#ff4d4f',
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 60%, 50% 100%, 0% 60%)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Export Options Modal */}
      {showExportModal && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(7, 8, 12, 0.85)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              width: '460px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '4px' }}>
              Tùy chọn Xuất Video
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Chọn chế độ ghép cứng phụ đề vào video của bạn:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option 1: Hardsub Only */}
              <div
                className="glass-panel"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: exportMode === 'hardsub' ? 'var(--accent-purple)' : 'var(--border-color)',
                  background: exportMode === 'hardsub' ? 'rgba(139, 92, 246, 0.04)' : 'rgba(255,255,255,0.01)',
                  boxShadow: exportMode === 'hardsub' ? '0 0 10px rgba(139, 92, 246, 0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setExportMode('hardsub')}
                onMouseEnter={(e) => {
                  if (exportMode !== 'hardsub') {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (exportMode !== 'hardsub') {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff', marginBottom: '4px' }}>
                  1. Chỉ ghép cứng phụ đề chữ
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Vẽ chữ phụ đề tiếng Việt lên video, giữ nguyên âm thanh gốc. Tốc độ xuất nhanh, hoàn toàn miễn phí.
                </div>
              </div>

              {/* Option 2: Sub + TTS Voice */}
              <div
                className="glass-panel"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: exportMode === 'tts' ? 'var(--accent-purple)' : 'var(--border-color)',
                  background: exportMode === 'tts' ? 'rgba(139, 92, 246, 0.04)' : 'rgba(255,255,255,0.01)',
                  boxShadow: exportMode === 'tts' ? '0 0 10px rgba(139, 92, 246, 0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setExportMode('tts')}
                onMouseEnter={(e) => {
                  if (exportMode !== 'tts') {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (exportMode !== 'tts') {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--accent-purple)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  2. Ghép phụ đề + Thuyết minh giọng đọc AI
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Vẽ chữ phụ đề và lồng tiếng thuyết minh tiếng Việt chuẩn xác bằng OpenAI/Edge/ElevenLabs TTS.
                </div>
              </div>

              {/* Option 3: Export Dubbed Audio Only */}
              <div
                className="glass-panel"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: exportMode === 'audio_only' ? 'var(--accent-purple)' : 'var(--border-color)',
                  background: exportMode === 'audio_only' ? 'rgba(139, 92, 246, 0.04)' : 'rgba(255,255,255,0.01)',
                  boxShadow: exportMode === 'audio_only' ? '0 0 10px rgba(139, 92, 246, 0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setExportMode('audio_only')}
                onMouseEnter={(e) => {
                  if (exportMode !== 'audio_only') {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (exportMode !== 'audio_only') {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff', marginBottom: '4px' }}>
                  3. Chỉ xuất âm thanh thuyết minh (Tệp MP3)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sinh giọng thuyết minh tiếng Việt và xuất thành tệp âm thanh MP3 riêng biệt (không kèm hình ảnh hay âm thanh gốc).
                </div>
              </div>
            </div>

            {exportMode !== 'audio_only' && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  userSelect: 'none',
                  marginTop: '4px',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '4px',
                  border: '1px dashed var(--border-color)'
                }}
              >
                <input
                  type="checkbox"
                  checked={exportGreenScreen}
                  onChange={(e) => setExportGreenScreen(e.target.checked)}
                />
                Xuất phụ đề trên nền xanh (Chroma Key Green Screen)
              </label>
            )}

            {/* TTS Settings form */}
            {(exportMode === 'tts' || exportMode === 'audio_only') && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Chỉ tóm tắt — cấu hình giọng ở một nơi duy nhất: "Thiết lập phụ đề" */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    🎙️ Giọng: <strong style={{ color: '#fff' }}>{ttsVoiceLabel()}</strong>
                    {' · '}
                    {autoSpeed ? 'Tự động khớp tốc độ với lời nói' : `Tốc độ cố định ${ttsSpeed}x`}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Đổi giọng/tốc độ trong &quot;Thiết lập phụ đề&quot; ở màn biên tập
                  </span>
                </div>

                {exportMode !== 'audio_only' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Âm lượng video gốc</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{bgVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bgVolume}
                      onChange={(e) => setBgVolume(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-purple)', height: '4px', cursor: 'pointer' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Âm lượng thuyết minh AI</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{ttsVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={ttsVolume}
                    onChange={(e) => setTtsVolume(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-purple)', height: '4px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button className="btn btn-secondary" onClick={() => setShowExportModal(false)}>
                Hủy bỏ
              </button>
              <button
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))'
                }}
                onClick={() => startHardsubExport(exportMode)}
              >
                Bắt đầu xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {showSearchModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          <div
            ref={searchModalRef}
            style={{
              position: 'absolute',
              left: `${modalPos.x}px`,
              top: `${modalPos.y}px`,
              width: '650px',
              height: '500px',
              minWidth: '400px',
              minHeight: '300px',
              maxWidth: '95vw',
              maxHeight: '95vh',
              background: '#13141f',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
              resize: 'both',
              overflow: 'hidden',
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'move',
                userSelect: 'none'
              }}
              onMouseDown={handleHeaderMouseDown}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={18} color="var(--accent-purple)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Tra cứu & Lọc phụ đề nhanh</h3>
              </div>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
                onClick={() => setShowSearchModal(false)}
              >
                &times;
              </button>
            </div>

            {/* Modal Search Bar */}
            <div
              style={{
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.01)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập từ hoặc cụm từ tìm kiếm (ví dụ: ta)..."
                  style={{
                    flex: 1,
                    height: '36px',
                    fontSize: '0.9rem',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '6px'
                  }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={searchWholeWord}
                    onChange={(e) => setSearchWholeWord(e.target.checked)}
                    style={{ accentColor: 'var(--accent-purple)' }}
                  />
                  Khớp cả từ (Whole Word)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={searchCaseSensitive}
                    onChange={(e) => setSearchCaseSensitive(e.target.checked)}
                    style={{ accentColor: 'var(--accent-purple)' }}
                  />
                  Phân biệt hoa/thường
                </label>
                <div style={{ flexGrow: 1 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {searchQuery.trim() ? `Tìm thấy ${filteredSearchSegments.length} dòng` : 'Nhập từ khóa để bắt đầu'}
                </span>
              </div>
            </div>

            {/* Modal Results list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!searchQuery.trim() ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  Nhập từ khóa vào ô tìm kiếm ở trên để lọc các dòng phụ đề.
                </div>
              ) : filteredSearchSegments.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  Không tìm thấy dòng phụ đề nào chứa từ khóa "{searchQuery}".
                </div>
              ) : (
                filteredSearchSegments.map((seg) => (
                  <div
                    key={seg.id}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => {
                      manuallySelectedSegIdRef.current = seg.id
                      seekVideo(seg.start)
                      setActiveSegId(seg.id)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                      e.currentTarget.style.borderColor = 'var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={selectedSegIds.has(seg.id)}
                          onChange={() => toggleSelectSegment(seg.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ accentColor: 'var(--accent-purple)', cursor: 'pointer', margin: 0 }}
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-purple)' }}>
                          #{seg.index}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {formatTime(seg.start)} &rarr; {formatTime(seg.end)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', width: '32px', flexShrink: 0 }}>Gốc:</span>
                        <span style={{ color: '#fff', wordBreak: 'break-word' }}>
                          {renderHighlightedText(seg.text || '', searchQuery)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ color: 'var(--accent-purple)', fontSize: '0.7rem', width: '32px', flexShrink: 0 }}>Dịch:</span>
                        <span style={{ color: '#c084fc', wordBreak: 'break-word' }}>
                          {renderHighlightedText(seg.translatedText || '', searchQuery)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {contextMenu && (() => {
        const overlapping = getOverlappingSegments(contextMenu.segId)
        const hasOverlapping = overlapping.length > 0

        return (
          <div
            style={{
              position: 'fixed',
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              background: '#13141f',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              zIndex: 9999,
              padding: '4px',
              minWidth: '160px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              backdropFilter: 'blur(20px)'
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                handleSplitSegmentAtPlayhead()
                setContextMenu(null)
              }}
            >
              <Scissors size={14} style={{ color: '#fbbf24' }} />
              <span>Chia đôi (B)</span>
            </button>

            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                const seg = segments.find((s) => s.id === contextMenu.segId)
                if (seg) {
                  navigator.clipboard.writeText(seg.translatedText || seg.text || '')
                }
                setContextMenu(null)
              }}
            >
              <Palette size={14} style={{ color: '#38bdf8' }} />
              <span>Sao chép chữ</span>
            </button>

            {hasOverlapping && (
              <>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => {
                    handleMergeOverlappingSegments(contextMenu.segId)
                    setContextMenu(null)
                  }}
                >
                  <Layers size={14} style={{ color: '#10b981' }} />
                  <span>Gộp thoại đè ({overlapping.length} đoạn)</span>
                </button>
              </>
            )}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => {
                handleDeleteSegment(contextMenu.segId)
                setContextMenu(null)
              }}
            >
              <Trash2 size={14} />
              <span>Xóa phân cảnh</span>
            </button>
          </div>
        )
      })()}
    </div>
  )
}
