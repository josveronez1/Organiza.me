/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import {
  defaultDropAnimation,
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  DropAnimation,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface KanbanContextProps<T> {
  columns: Record<string, T[]>
  setColumns: (columns: Record<string, T[]>) => void
  getItemId: (item: T) => string
  columnIds: string[]
  activeId: UniqueIdentifier | null
  setActiveId: (id: UniqueIdentifier | null) => void
  findContainer: (id: UniqueIdentifier) => string | undefined
  isColumn: (id: UniqueIdentifier) => boolean
}

const KanbanContext = React.createContext<KanbanContextProps<any>>({
  columns: {},
  setColumns: () => {},
  getItemId: () => '',
  columnIds: [],
  activeId: null,
  setActiveId: () => {},
  findContainer: () => undefined,
  isColumn: () => false,
})

const ColumnContext = React.createContext<{
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners | undefined
  isDragging?: boolean
  disabled?: boolean
}>({
  attributes: {} as DraggableAttributes,
  listeners: undefined,
  isDragging: false,
  disabled: false,
})

const ItemContext = React.createContext<{
  listeners: DraggableSyntheticListeners | undefined
  isDragging?: boolean
  disabled?: boolean
}>({
  listeners: undefined,
  isDragging: false,
  disabled: false,
})

const dropAnimationConfig: DropAnimation = {
  ...defaultDropAnimation,
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
}

export interface KanbanMoveEvent {
  event: DragEndEvent
  activeContainer: string
  activeIndex: number
  overContainer: string
  overIndex: number
}

export interface KanbanRootProps<T> {
  value: Record<string, T[]>
  onValueChange: (value: Record<string, T[]>) => void
  getItemValue: (item: T) => string
  children: React.ReactNode
  className?: string
  onMove?: (event: KanbanMoveEvent) => void
}

function Kanban<T>({ value, onValueChange, getItemValue, children, className, onMove }: KanbanRootProps<T>) {
  const columns = value
  const setColumns = onValueChange
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const columnIds = React.useMemo(() => Object.keys(columns), [columns])

  const isColumn = React.useCallback((id: UniqueIdentifier) => columnIds.includes(id as string), [columnIds])

  const findContainer = React.useCallback(
    (id: UniqueIdentifier) => {
      if (isColumn(id)) return id as string
      return columnIds.find((key) => columns[key].some((item) => getItemValue(item) === id))
    },
    [columns, columnIds, getItemValue, isColumn],
  )

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragOver = React.useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return
      if (isColumn(active.id)) return

      const activeContainer = findContainer(active.id)
      const overContainer = findContainer(over.id)

      // Only handle moving items between different columns
      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return
      }

      const activeItems = columns[activeContainer]
      const overItems = columns[overContainer]
      const activeIndex = activeItems.findIndex((item: T) => getItemValue(item) === active.id)

      let overIndex = overItems.findIndex((item: T) => getItemValue(item) === over.id)

      // If dropping on the column itself, not an item
      if (isColumn(over.id)) {
        overIndex = overItems.length
      }

      const newOverItems = [...overItems]
      const [movedItem] = activeItems.splice(activeIndex, 1)
      newOverItems.splice(overIndex, 0, movedItem)

      // Sempre fazer update otimista, mesmo quando onMove está definido
      // Isso garante que a UI atualize imediatamente durante o drag
      setColumns({
        ...columns,
        [activeContainer]: [...activeItems],
        [overContainer]: newOverItems,
      })
    },
    [findContainer, getItemValue, isColumn, setColumns, columns],
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over) return

      // Handle item move callback
      if (onMove && !isColumn(active.id)) {
        const activeContainer = findContainer(active.id)
        const overContainer = findContainer(over.id)

        if (activeContainer && overContainer) {
          const activeIndex = columns[activeContainer].findIndex((item: T) => getItemValue(item) === active.id)
          const overIndex = isColumn(over.id)
            ? columns[overContainer].length
            : columns[overContainer].findIndex((item: T) => getItemValue(item) === over.id)

          onMove({
            event,
            activeContainer,
            activeIndex,
            overContainer,
            overIndex,
          })
        }
        return
      }

      // Handle column reordering
      if (isColumn(active.id) && isColumn(over.id)) {
        const activeIndex = columnIds.indexOf(active.id as string)
        const overIndex = columnIds.indexOf(over.id as string)

        if (activeIndex !== overIndex) {
          const newOrder = arrayMove(Object.keys(columns), activeIndex, overIndex)
          const newColumns: Record<string, T[]> = {}

          newOrder.forEach((key) => {
            newColumns[key] = columns[key]
          })

          setColumns(newColumns)
        }
        return
      }

      const activeContainer = findContainer(active.id)
      const overContainer = findContainer(over.id)

      // Handle item reordering within the same column
      if (activeContainer && overContainer && activeContainer === overContainer) {
        const container = activeContainer
        const activeIndex = columns[container].findIndex((item: T) => getItemValue(item) === active.id)
        const overIndex = columns[container].findIndex((item: T) => getItemValue(item) === over.id)

        if (activeIndex !== overIndex) {
          setColumns({
            ...columns,
            [container]: arrayMove(columns[container], activeIndex, overIndex),
          })
        }
      }
    },
    [columnIds, columns, findContainer, getItemValue, isColumn, setColumns, onMove],
  )

  const contextValue = React.useMemo(
    () => ({
      columns,
      setColumns,
      getItemId: getItemValue,
      columnIds,
      activeId,
      setActiveId,
      findContainer,
      isColumn,
    }),
    [columns, setColumns, getItemValue, columnIds, activeId, findContainer, isColumn],
  )

  return (
    <KanbanContext.Provider value={contextValue}>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div data-slot="kanban" data-dragging={activeId !== null} className={className}>
          {children}
        </div>
      </DndContext>
    </KanbanContext.Provider>
  )
}

export interface KanbanBoardProps {
  className?: string
  children: React.ReactNode
}

function KanbanBoard({ children, className }: KanbanBoardProps) {
  const { columnIds } = React.useContext(KanbanContext)

  return (
    <SortableContext items={columnIds} strategy={rectSortingStrategy}>
      <div data-slot="kanban-board" className={className || 'kanban'}>
        {children}
      </div>
    </SortableContext>
  )
}

export interface KanbanColumnProps {
  value: string
  className?: string
  children: React.ReactNode
  disabled?: boolean
}

function KanbanColumn({ value, className, children, disabled }: KanbanColumnProps) {
  const {
    setNodeRef: setSortableRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging: isSortableDragging,
  } = useSortable({
    id: value,
    disabled,
  })

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: value,
  })

  // Combine refs
  const setNodeRef = React.useCallback((node: HTMLElement | null) => {
    setSortableRef(node)
    setDroppableRef(node)
  }, [setSortableRef, setDroppableRef])

  const { activeId, isColumn } = React.useContext(KanbanContext)
  const isColumnDragging = activeId ? isColumn(activeId) : false

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  } as React.CSSProperties

  return (
    <ColumnContext.Provider value={{ attributes, listeners, isDragging: isColumnDragging, disabled }}>
      <div
        data-slot="kanban-column"
        data-value={value}
        data-dragging={isSortableDragging}
        data-over={isOver}
        data-disabled={disabled}
        ref={setNodeRef}
        style={style}
        className={className}
      >
        {children}
      </div>
    </ColumnContext.Provider>
  )
}

export interface KanbanColumnHandleProps {
  asChild?: boolean
  className?: string
  children?: React.ReactNode
  cursor?: boolean
}

function KanbanColumnHandle({ asChild, className, children, cursor = true }: KanbanColumnHandleProps) {
  const { attributes, listeners, isDragging, disabled } = React.useContext(ColumnContext)
  const Comp = asChild ? React.Fragment : 'div'

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...attributes,
      ...listeners,
      className: `${children.props.className || ''} ${className || ''}`.trim(),
    } as any)
  }

  return (
    <Comp
      data-slot="kanban-column-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      {...attributes}
      {...listeners}
      className={className}
    >
      {children}
    </Comp>
  )
}

export interface KanbanItemProps {
  value: string
  asChild?: boolean
  className?: string
  children: React.ReactNode
  disabled?: boolean
}

function KanbanItem({ value, asChild = false, className, children, disabled }: KanbanItemProps) {
  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging: isSortableDragging,
  } = useSortable({
    id: value,
    disabled,
  })

  const { activeId, isColumn } = React.useContext(KanbanContext)
  const isItemDragging = activeId ? !isColumn(activeId) : false

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  } as React.CSSProperties

  if (asChild && React.isValidElement(children)) {
    // Merge onClick - only call if not dragging
    const originalOnClick = (children.props as any).onClick
    const mergedOnClick = (e: React.MouseEvent) => {
      // Don't call onClick during drag
      if (!isSortableDragging && originalOnClick) {
        originalOnClick(e)
      }
    }

    return React.cloneElement(children, {
      ref: setNodeRef,
      style: { ...(children.props.style || {}), ...style },
      ...attributes,
      ...listeners,
      onClick: mergedOnClick,
      className: `${children.props.className || ''} ${isSortableDragging ? 'dragging' : ''} ${className || ''}`.trim(),
    } as any)
  }

  return (
    <ItemContext.Provider value={{ listeners, isDragging: isItemDragging, disabled }}>
      <div
        data-slot="kanban-item"
        data-value={value}
        data-dragging={isSortableDragging}
        data-disabled={disabled}
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`${isSortableDragging ? 'dragging' : ''} ${disabled ? 'opacity-50' : ''} ${className || ''}`.trim()}
      >
        {children}
      </div>
    </ItemContext.Provider>
  )
}

export interface KanbanItemHandleProps {
  asChild?: boolean
  className?: string
  children?: React.ReactNode
  cursor?: boolean
}

function KanbanItemHandle({ asChild, className, children, cursor = true }: KanbanItemHandleProps) {
  const { listeners, isDragging, disabled } = React.useContext(ItemContext)
  const Comp = asChild ? React.Fragment : 'div'

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...listeners,
      className: `${children.props.className || ''} ${className || ''}`.trim(),
    } as any)
  }

  return (
    <Comp
      data-slot="kanban-item-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      {...listeners}
      className={className}
    >
      {children}
    </Comp>
  )
}

export interface KanbanColumnContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

function KanbanColumnContent({ value, className, children }: KanbanColumnContentProps) {
  const { columns, getItemId } = React.useContext(KanbanContext)

  const itemIds = React.useMemo(() => columns[value]?.map(getItemId) || [], [columns, getItemId, value])

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <div 
        data-slot="kanban-column-content" 
        className={className || 'kanban-column-body'}
      >
        {children}
      </div>
    </SortableContext>
  )
}

export interface KanbanOverlayProps {
  className?: string
  children?: React.ReactNode | ((params: { value: UniqueIdentifier; variant: 'column' | 'item' }) => React.ReactNode)
}

function KanbanOverlay({ children, className }: KanbanOverlayProps) {
  const { activeId, isColumn } = React.useContext(KanbanContext)
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null)

  React.useEffect(() => {
    if (activeId) {
      const element = document.querySelector(
        `[data-slot="kanban-${isColumn(activeId) ? 'column' : 'item'}"][data-value="${activeId}"]`,
      )
      if (element) {
        const rect = element.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    } else {
      setDimensions(null)
    }
  }, [activeId, isColumn])

  const style = {
    width: dimensions?.width,
    height: dimensions?.height,
  } as React.CSSProperties

  const content = React.useMemo(() => {
    if (!activeId) return null

    if (typeof children === 'function') {
      return children({
        value: activeId,
        variant: isColumn(activeId) ? 'column' : 'item',
      })
    }

    return children
  }, [activeId, children, isColumn])

  return (
    <DragOverlay dropAnimation={dropAnimationConfig}>
      <div
        data-slot="kanban-overlay"
        data-dragging={true}
        style={style}
        className={className}
      >
        {content}
      </div>
    </DragOverlay>
  )
}

export {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanColumnContent,
  KanbanOverlay,
}

