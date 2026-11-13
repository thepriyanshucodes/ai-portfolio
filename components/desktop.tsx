"use client"

import React, { useState, useRef, useEffect } from 'react';
import {
  type DesktopItem,
  INITIAL_ITEMS,
  TOTAL_COLS,
  TOTAL_ROWS,
  RESERVED_CELLS,
} from './../types/desktop.types';
import Image from 'next/image';

/* ------------------------------------------------------------------ */
/*  RESPONSIVE GRID LAYOUT                                             */
/*  desktop (>=1024px): original fixed TOTAL_COLS x TOTAL_ROWS grid     */
/*  tablet  (640-1023): ~104px cells, columns/rows computed from size  */
/*  mobile  (<640px)  : ~84px cells,  columns/rows computed from size  */
/* ------------------------------------------------------------------ */
type LayoutMode = 'desktop' | 'tablet' | 'mobile';

interface GridLayout {
  mode: LayoutMode;
  cols: number;
  rows: number;
  cellSize: number;
  reserved: Set<string>;
}

const NO_RESERVED = new Set<string>();
const TARGET_CELL: Record<'tablet' | 'mobile', number> = { tablet: 104, mobile: 84 };
// vertical space kept free at the bottom for the taskbar (px)
const DOCK_SPACE: Record<'tablet' | 'mobile', number> = { tablet: 130, mobile: 110 };

const DEFAULT_LAYOUT: GridLayout = {
  mode: 'desktop',
  cols: TOTAL_COLS,
  rows: TOTAL_ROWS,
  cellSize: 96,
  reserved: RESERVED_CELLS,
};

function computeLayout(width: number, height: number): GridLayout {
  if (width >= 1024) {
    return {
      mode: 'desktop',
      cols: TOTAL_COLS,
      rows: TOTAL_ROWS,
      cellSize: Math.min(width / TOTAL_COLS, height / TOTAL_ROWS),
      reserved: RESERVED_CELLS,
    };
  }

  const mode: 'tablet' | 'mobile' = width < 640 ? 'mobile' : 'tablet';
  const isShort = height < 500; // phones in landscape
  const target = isShort ? 72 : TARGET_CELL[mode];
  const dock = isShort ? 80 : DOCK_SPACE[mode];

  const cols = Math.max(3, Math.floor(width / target));
  const cellSize = width / cols;
  const rows = Math.max(2, Math.floor((height - dock) / cellSize));

  return { mode, cols, rows, cellSize, reserved: NO_RESERVED };
}

const sameLayout = (a: GridLayout, b: GridLayout) =>
  a.mode === b.mode &&
  a.cols === b.cols &&
  a.rows === b.rows &&
  Math.abs(a.cellSize - b.cellSize) < 0.5;

/* ------------------------------------------------------------------ */
/*  GRID HELPERS (pure)                                                */
/* ------------------------------------------------------------------ */
function isCellAvailable(
  col: number,
  row: number,
  occupied: Set<string>,
  layout: GridLayout
) {
  if (col < 0 || col >= layout.cols || row < 0 || row >= layout.rows) return false;
  if (layout.reserved.has(`${col}-${row}`)) return false;
  return !occupied.has(`${col}-${row}`);
}

function findNearestEmptyCell(
  targetCol: number,
  targetRow: number,
  occupied: Set<string>,
  layout: GridLayout
): { col: number; row: number } {
  const startCol = Math.max(0, Math.min(layout.cols - 1, targetCol));
  const startRow = Math.max(0, Math.min(layout.rows - 1, targetRow));

  if (isCellAvailable(startCol, startRow, occupied, layout)) {
    return { col: startCol, row: startRow };
  }

  const queue: [number, number][] = [[startCol, startRow]];
  const visited = new Set<string>([`${startCol}-${startRow}`]);
  const directions = [
    [0, -1], [1, 0], [0, 1], [-1, 0],
    [-1, -1], [1, -1], [1, 1], [-1, 1],
  ];

  while (queue.length > 0) {
    const [c, r] = queue.shift()!;
    for (const [dc, dr] of directions) {
      const nc = c + dc;
      const nr = r + dr;
      const key = `${nc}-${nr}`;
      if (nc >= 0 && nc < layout.cols && nr >= 0 && nr < layout.rows && !visited.has(key)) {
        visited.add(key);
        if (isCellAvailable(nc, nr, occupied, layout)) return { col: nc, row: nr };
        queue.push([nc, nr]);
      }
    }
  }

  return { col: startCol, row: startRow };
}

/**
 * When the grid changes size (rotation, resize, desktop <-> mobile),
 * keep icons that still fit and move the ones that fell outside / onto
 * reserved cells to the nearest free cell. Returns the SAME array when
 * nothing changed so React doesn't re-render.
 */
function reflowItems(items: DesktopItem[], layout: GridLayout): DesktopItem[] {
  const occupied = new Set<string>();
  const invalid: DesktopItem[] = [];

  items.forEach((item) => {
    const { col, row } = item.gridPos;
    if (isCellAvailable(col, row, occupied, layout)) {
      occupied.add(`${col}-${row}`);
    } else {
      invalid.push(item);
    }
  });

  if (invalid.length === 0) return items;

  const moved = new Map<number, { col: number; row: number }>();
  invalid.forEach((item) => {
    const pos = findNearestEmptyCell(item.gridPos.col, item.gridPos.row, occupied, layout);
    occupied.add(`${pos.col}-${pos.row}`);
    moved.set(item.id, pos);
  });

  return items.map((item) =>
    moved.has(item.id) ? { ...item, gridPos: moved.get(item.id)! } : item
  );
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */
const DRAG_THRESHOLD = 6; // px – below this a press counts as a tap

export default function DesktopGrid() {
  const [items, setItems] = useState<DesktopItem[]>(INITIAL_ITEMS);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [layout, setLayout] = useState<GridLayout>(DEFAULT_LAYOUT);
  const { cellSize } = layout;

  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [dragState, setDragState] = useState<{
    activeId: number;
    pointerType: string;
    moved: boolean;
    startPointerPos: { x: number; y: number };
    itemStartPositions: Map<number, { col: number; row: number }>;
    tempOffset: { x: number; y: number };
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const openedByTapRef = useRef(false);

  // --- Recompute grid + keep icons inside it whenever the container resizes ---
  // (setState happens inside the observer callback, not synchronously in the effect body.
  //  ResizeObserver fires once as soon as observe() is called, so this also covers first mount.)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const next = computeLayout(el.clientWidth, el.clientHeight);
      setLayout((prev) => (sameLayout(prev, next) ? prev : next));
      setItems((prev) => reflowItems(prev, next));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- OPEN ITEM ---
  const openItem = (item: DesktopItem) => {
    if (item.type === 'pdf' && item.content.pdfPath) {
      window.open(item.content.pdfPath, '_blank');
    } else if (item.type === 'project' && item.content.url) {
      window.open(item.content.url, '_blank');
    }
  };

  // Mouse: double click. (Touch uses single tap, see handlePointerUp.)
  const handleItemDoubleClick = (item: DesktopItem) => {
    if (openedByTapRef.current) return; // already opened by the tap that started this double-tap
    openItem(item);
  };

  // --- POINTER HANDLERS ---
  const handlePointerDownBackground = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectedIds(new Set());
    setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleItemPointerDown = (e: React.PointerEvent, item: DesktopItem) => {
    e.stopPropagation();

    let currentSelected = new Set(selectedIds);
    if (!currentSelected.has(item.id)) {
      currentSelected = new Set([item.id]);
      setSelectedIds(currentSelected);
    }

    const startPositions = new Map<number, { col: number; row: number }>();
    items.forEach((it) => {
      if (currentSelected.has(it.id)) startPositions.set(it.id, { ...it.gridPos });
    });

    setDragState({
      activeId: item.id,
      pointerType: e.pointerType,
      moved: false,
      startPointerPos: { x: e.clientX, y: e.clientY },
      itemStartPositions: startPositions,
      tempOffset: { x: 0, y: 0 },
    });

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (selectionBox && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      setSelectionBox((prev) => (prev ? { ...prev, currentX, currentY } : null));

      const boxLeft = Math.min(selectionBox.startX, currentX);
      const boxTop = Math.min(selectionBox.startY, currentY);
      const boxRight = Math.max(selectionBox.startX, currentX);
      const boxBottom = Math.max(selectionBox.startY, currentY);

      const newSelected = new Set<number>();
      items.forEach((item) => {
        const itemLeft = item.gridPos.col * cellSize;
        const itemTop = item.gridPos.row * cellSize;
        if (
          itemLeft < boxRight &&
          itemLeft + cellSize > boxLeft &&
          itemTop < boxBottom &&
          itemTop + cellSize > boxTop
        ) {
          newSelected.add(item.id);
        }
      });
      setSelectedIds(newSelected);
      return;
    }

    if (dragState) {
      const deltaX = e.clientX - dragState.startPointerPos.x;
      const deltaY = e.clientY - dragState.startPointerPos.y;
      const moved = dragState.moved || Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD;

      setDragState((prev) =>
        prev
          ? { ...prev, moved, tempOffset: moved ? { x: deltaX, y: deltaY } : prev.tempOffset }
          : null
      );
    }
  };

  const handlePointerUp = () => {
    if (selectionBox) {
      setSelectionBox(null);
      return;
    }

    if (!dragState) return;

    // Plain tap (no drag) on touch / pen -> open the item
    if (!dragState.moved) {
      if (dragState.pointerType !== 'mouse') {
        const tapped = items.find((it) => it.id === dragState.activeId);
        if (tapped) {
          openedByTapRef.current = true;
          setTimeout(() => { openedByTapRef.current = false; }, 800);
          openItem(tapped);
        }
      }
      setDragState(null);
      return;
    }

    const deltaCols = Math.round(dragState.tempOffset.x / cellSize);
    const deltaRows = Math.round(dragState.tempOffset.y / cellSize);
    const activeItemIds = new Set(dragState.itemStartPositions.keys());

    const occupied = new Set<string>();
    items.forEach((item) => {
      if (!activeItemIds.has(item.id)) occupied.add(`${item.gridPos.col}-${item.gridPos.row}`);
    });

    const updated = new Map<number, { col: number; row: number }>();
    dragState.itemStartPositions.forEach((startPos, id) => {
      const pos = findNearestEmptyCell(
        startPos.col + deltaCols,
        startPos.row + deltaRows,
        occupied,
        layout
      );
      updated.set(id, pos);
      occupied.add(`${pos.col}-${pos.row}`);
    });

    setItems((prev) =>
      prev.map((item) => (updated.has(item.id) ? { ...item, gridPos: updated.get(item.id)! } : item))
    );
    setDragState(null);
  };

  const handlePointerCancel = () => {
    setSelectionBox(null);
    setDragState(null);
  };

  // Icon + label scale with the cell so they look right on every screen
  const iconSize = Math.round(Math.min(56, cellSize * 0.58));
  const isCompactCell = cellSize < 90;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDownBackground}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className="relative w-full h-dvh bg-transparent select-none overflow-hidden touch-none"
    >
      {/* Desktop File/Project Icons */}
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id);
        const isDragging = !!dragState?.moved && dragState.itemStartPositions.has(item.id);

        let x = item.gridPos.col * cellSize;
        let y = item.gridPos.row * cellSize;

        if (isDragging && dragState) {
          x += dragState.tempOffset.x;
          y += dragState.tempOffset.y;
        }

        return (
          <div
            key={item.id}
            onPointerDown={(e) => handleItemPointerDown(e, item)}
            onDoubleClick={() => handleItemDoubleClick(item)}
            style={{
              width: cellSize,
              height: cellSize,
              transform: `translate3d(${x}px, ${y}px, 0)`,
              zIndex: isDragging ? 50 : 10,
            }}
            className={`absolute top-0 left-0 flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg cursor-grab active:cursor-grabbing touch-none ${
              isDragging ? '' : 'transition-transform duration-150 ease-out'
            } ${
              isSelected
                ? 'bg-blue-500/30 border border-blue-400'
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            {item.icon ? (
              <Image
                src={item.icon}
                alt={item.title}
                width={56}
                height={56}
                style={{ width: iconSize, height: iconSize }}
                className="mb-1 object-contain pointer-events-none"
              />
            ) : (
              <div
                style={{ width: iconSize, height: iconSize, fontSize: iconSize * 0.7 }}
                className="mb-1 rounded bg-transparent flex items-center justify-center font-bold text-white shadow-sm"
              >
                {item.type === 'project' ? '🚀' : '📄'}
              </div>
            )}
            <span
              className={`${
                isCompactCell ? 'text-[11px]' : 'text-xs'
              } text-slate-200 text-center truncate w-full pointer-events-none font-medium drop-shadow`}
            >
              {item.title}
            </span>
          </div>
        );
      })}

      {/* Selection Box Overlay */}
      {selectionBox && (
        <div
          style={{
            left: Math.min(selectionBox.startX, selectionBox.currentX),
            top: Math.min(selectionBox.startY, selectionBox.currentY),
            width: Math.abs(selectionBox.currentX - selectionBox.startX),
            height: Math.abs(selectionBox.currentY - selectionBox.startY),
          }}
          className="absolute bg-blue-500/20 border border-blue-400/60 pointer-events-none z-40"
        />
      )}
    </div>
  );
}