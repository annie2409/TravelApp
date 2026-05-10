'use client';
// src/components/itinerary/ItineraryPanel.tsx
import { useState, useMemo } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { itineraryApi } from '@/lib/api';
import { useTripStore } from '@/lib/stores/tripStore';
import { ItineraryItem } from '@/types';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import { getSocket } from '@/lib/socket';

interface Props { tripId: string; userId: string; }

export default function ItineraryPanel({ tripId, userId }: Props) {
  const { items, setItems, deleteItem } = useTripStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addDayIndex, setAddDayIndex] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Group items by dayIndex
  const days = useMemo(() => {
    const maxDay = items.reduce((max, i) => Math.max(max, i.dayIndex), 0);
    const grouped: ItineraryItem[][] = [];
    for (let d = 0; d <= maxDay; d++) {
      grouped[d] = items.filter(i => i.dayIndex === d).sort((a, b) => a.order - b.order);
    }
    return grouped;
  }, [items]);

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const allIds = items.map(i => i.id);
    const oldIndex = allIds.indexOf(active.id as string);
    const newIndex = allIds.indexOf(over.id as string);
    const reordered = arrayMove(items, oldIndex, newIndex);

    // Recalculate order within each day
    const activeItem = items.find(i => i.id === active.id)!;
    const overItem = items.find(i => i.id === over.id)!;
    const newDayIndex = overItem.dayIndex;

    const updates = reordered.map((item, idx) => ({
      id: item.id,
      order: idx,
      dayIndex: item.id === active.id ? newDayIndex : item.dayIndex,
    }));

    setItems(reordered.map((item, idx) => ({
      ...item,
      order: idx,
      dayIndex: item.id === active.id ? newDayIndex : item.dayIndex,
    })));

    try {
      await itineraryApi.reorder(updates);
    } catch (e) {
      console.error('Reorder failed', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await itineraryApi.delete(id);
      deleteItem(id);
    } catch (e) {
      console.error(e);
    }
  };

  const activeItem = items.find(i => i.id === activeId);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">Itinerary</h2>
        <button onClick={() => { setAddDayIndex(days.length); setShowAdd(true); }} className="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Activity
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {days.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          <div className="space-y-8">
            {days.map((dayItems, dayIndex) => (
              <DaySection
                key={dayIndex}
                dayIndex={dayIndex}
                items={dayItems}
                onAddItem={() => { setAddDayIndex(dayIndex); setShowAdd(true); }}
                onEditItem={setEditItem}
                onDeleteItem={handleDelete}
                currentUserId={userId}
              />
            ))}
            {/* Add new day */}
            <button
              onClick={() => { setAddDayIndex(days.length); setShowAdd(true); }}
              className="w-full py-3 border border-dashed border-[var(--border)] rounded-xl text-sm text-[var(--text-muted)] hover:border-sand-600 hover:text-sand-500 transition-all"
            >
              + Add Day {days.length + 1}
            </button>
          </div>
        )}
        <DragOverlay>
          {activeItem && (
            <div className="card p-4 shadow-2xl shadow-black/50 opacity-90 rotate-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">{activeItem.title}</p>
              {activeItem.location && (
                <p className="text-xs text-[var(--text-muted)] mt-1">{activeItem.location}</p>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showAdd && (
        <AddItemModal
          tripId={tripId}
          dayIndex={addDayIndex}
          defaultOrder={days[addDayIndex]?.length || 0}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}

function DaySection({ dayIndex, items, onAddItem, onEditItem, onDeleteItem, currentUserId }: {
  dayIndex: number;
  items: ItineraryItem[];
  onAddItem: () => void;
  onEditItem: (item: ItineraryItem) => void;
  onDeleteItem: (id: string) => void;
  currentUserId: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-sand-500 bg-sand-500/10 px-2 py-1 rounded-md uppercase tracking-widest">
            Day {dayIndex + 1}
          </span>
        </div>
        <div className="flex-1 h-px bg-[var(--border)]" />
        <button onClick={onAddItem} className="text-xs text-[var(--text-muted)] hover:text-sand-400 transition-colors">
          + Add
        </button>
      </div>

      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map(item => (
            <SortableItem
              key={item.id}
              item={item}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              isOwn={item.createdById === currentUserId}
            />
          ))}
        </div>
      </SortableContext>

      {items.length === 0 && (
        <div className="text-center py-4 text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-xl">
          No activities yet — add one!
        </div>
      )}
    </div>
  );
}

function SortableItem({ item, onEdit, onDelete, isOwn }: {
  item: ItineraryItem;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (id: string) => void;
  isOwn: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const socket = getSocket();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleEditStart = () => {
    socket.emit('itinerary:editing', { tripId: item.tripId, itemId: item.id });
    onEdit(item);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="card p-4 flex items-start gap-3 group hover:border-[var(--border-light)] transition-all"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-[var(--text-primary)] leading-snug">{item.title}</h4>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={handleEditStart} className="p-1.5 rounded-lg hover:bg-ink-700 text-[var(--text-muted)] hover:text-sand-400 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-950/40 text-[var(--text-muted)] hover:text-red-400 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          {item.location && (
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {item.location}
            </span>
          )}
          {(item.startTime || item.date) && (
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              {item.date && format(new Date(item.date), 'MMM d')}
              {item.startTime && ` · ${item.startTime}`}
              {item.endTime && ` – ${item.endTime}`}
            </span>
          )}
          {item.notes && (
            <span className="text-xs text-[var(--text-muted)] truncate max-w-xs">{item.notes}</span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-2">
          <div className="w-4 h-4 rounded-full bg-sand-700 flex items-center justify-center text-[9px] text-sand-200 font-bold">
            {item.createdBy.name[0].toUpperCase()}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">{item.createdBy.name}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-2xl">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--bg-card)] mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sand-500">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h.01M12 16h.01M8 12h.01M8 16h.01"/>
        </svg>
      </div>
      <h3 className="font-display text-lg font-medium text-[var(--text-secondary)] mb-1">No itinerary yet</h3>
      <p className="text-sm text-[var(--text-muted)] mb-5">Start planning by adding your first activity</p>
      <button onClick={onAdd} className="btn-primary">Add first activity</button>
    </div>
  );
}
