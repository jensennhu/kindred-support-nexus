// src/components/StockPositionsTable.tsx
import React, { useState } from 'react';
import { Target, AlertTriangle, ArrowRight, Trash2, Edit3, Save, X, GripVertical, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StockProject {
  id: string;
  symbol: string;
  price: string;
  position: 'holding' | 'sold' | 'watching';
  strategy: string;
  category: string;
  date: string;
  notesCount: number;
  risk_level: number;
  position_size: number;
}

interface StockPositionsTableProps {
  projects: StockProject[];
  onRowClick: (symbol: string) => void;
  onAnalyzeClick: (symbol: string, e: React.MouseEvent) => void;
  onDeleteClick: (positionId: string, e: React.MouseEvent) => void;
  onUpdatePosition: (positionId: string, updates: { price?: string; position?: 'holding' | 'sold' | 'watching'; strategy?: string; category?: string; risk_level?: number; position_size?: number }) => Promise<void>;
  onMoveToStrategy: (positionId: string, newStrategy: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const getPositionColor = (position: 'holding' | 'sold' | 'watching') => {
  switch (position) {
    case 'holding': return 'bg-green-100 text-green-800 border-green-200';
    case 'sold': return 'bg-red-100 text-red-800 border-red-200';
    case 'watching': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

type SortColumn = 'symbol' | 'price' | 'position_size' | 'strategy' | 'category' | 'risk_level' | 'notesCount';
type SortDirection = 'asc' | 'desc' | null;

const TableHeader: React.FC<{
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}> = ({ sortColumn, sortDirection, onSort }) => {
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4 ml-1" />;
    return <ArrowDown className="w-4 h-4 ml-1" />;
  };

  return (
    <thead className="bg-muted border-b border-border">
      <tr>
        <th className="px-2 py-4 text-left"></th>
        <th 
          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={() => onSort('symbol')}
        >
          <div className="flex items-center">
            Stock
            <SortIcon column="symbol" />
          </div>
        </th>
        <th 
          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={() => onSort('price')}
        >
          <div className="flex items-center">
            Price
            <SortIcon column="price" />
          </div>
        </th>
        <th 
          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={() => onSort('position_size')}
        >
          <div className="flex items-center">
            Position Size
            <SortIcon column="position_size" />
          </div>
        </th>
        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
          % of Strategy
        </th>
        <th 
          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={() => onSort('strategy')}
        >
          <div className="flex items-center">
            Strategy
            <SortIcon column="strategy" />
          </div>
        </th>
        <th 
          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={() => onSort('category')}
        >
          <div className="flex items-center">
            Category
            <SortIcon column="category" />
          </div>
        </th>
        <th 
          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={() => onSort('risk_level')}
        >
          <div className="flex items-center">
            Risk Level
            <SortIcon column="risk_level" />
          </div>
        </th>
        <th 
          className="px-6 py-4 text-center text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
          onClick={() => onSort('notesCount')}
        >
          <div className="flex items-center justify-center">
            Total Notes
            <SortIcon column="notesCount" />
          </div>
        </th>
        <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
          Actions
        </th>
      </tr>
    </thead>
  );
};

const SortableTableRow: React.FC<{
  project: StockProject;
  strategyTotal: number;
  onRowClick: (symbol: string) => void;
  onAnalyzeClick: (symbol: string, e: React.MouseEvent) => void;
  onDeleteClick: (positionId: string, e: React.MouseEvent) => void;
  onUpdatePosition: (positionId: string, updates: { price?: string; position?: 'holding' | 'sold' | 'watching'; strategy?: string; category?: string; risk_level?: number; position_size?: number }) => Promise<void>;
}> = ({ project, strategyTotal, onRowClick, onAnalyzeClick, onDeleteClick, onUpdatePosition }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    price: project.price,
    position: project.position,
    strategy: project.strategy,
    category: project.category,
    risk_level: project.risk_level,
    position_size: project.position_size
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };


  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onUpdatePosition(project.id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update position:', error);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditData({
      price: project.price,
      position: project.position,
      strategy: project.strategy,
      category: project.category,
      risk_level: project.risk_level,
      position_size: project.position_size
    });
    setIsEditing(false);
  };

  const getRiskColor = (riskLevel: number) => {
    // Green (120) to Red (0) on HSL scale
    const hue = ((100 - riskLevel) / 100) * 120;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  return (
  <tr 
    ref={setNodeRef}
    style={style}
    key={project.id} 
    className="hover:bg-accent/50 cursor-pointer transition-colors group"
    onClick={() => !isEditing && onRowClick(project.symbol)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onRowClick(project.symbol);
      }
    }}
    aria-label={`View analysis for ${project.symbol}`}
  >
    <td className="px-2 py-4">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-5 h-5" />
      </button>
    </td>
    <td className="px-6 py-4">
      <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
        {project.symbol}
      </span>
    </td>
    <td className="px-6 py-4">
      {isEditing ? (
        <input
          type="number"
          step="0.01"
          value={editData.price}
          onChange={(e) => setEditData(prev => ({ ...prev, price: e.target.value }))}
          onClick={(e) => e.stopPropagation()}
          className="w-20 px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <span className="text-bullish font-semibold">
          ${parseFloat(project.price).toFixed(2)}
        </span>
      )}
    </td>
    <td className="px-6 py-4">
      {isEditing ? (
        <input
          type="number"
          step="100"
          value={editData.position_size}
          onChange={(e) => setEditData(prev => ({ ...prev, position_size: parseFloat(e.target.value) || 0 }))}
          onClick={(e) => e.stopPropagation()}
          className="w-24 px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <span className="text-foreground font-semibold">
          ${project.position_size.toLocaleString()}
        </span>
      )}
    </td>
    <td className="px-6 py-4">
      <span className="text-muted-foreground font-medium">
        {strategyTotal > 0 ? ((project.position_size / strategyTotal) * 100).toFixed(1) : '0.0'}%
      </span>
    </td>
    <td className="px-6 py-4">
      {isEditing ? (
        <input
          type="text"
          value={editData.strategy}
          onChange={(e) => setEditData(prev => ({ ...prev, strategy: e.target.value }))}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <span className="text-foreground">{project.strategy}</span>
      )}
    </td>
    <td className="px-6 py-4">
      {isEditing ? (
        <input
          type="text"
          value={editData.category}
          onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <span className="text-foreground">{project.category}</span>
      )}
    </td>
    <td className="px-6 py-4">
      {isEditing ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="range"
            min="1"
            max="100"
            value={editData.risk_level}
            onChange={(e) => setEditData(prev => ({ ...prev, risk_level: parseInt(e.target.value) }))}
            className="w-24"
            style={{
              accentColor: getRiskColor(editData.risk_level)
            }}
          />
          <span className="text-xs font-medium w-8">{editData.risk_level}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div 
            className="h-2 w-24 rounded-full bg-muted overflow-hidden"
          >
            <div 
              className="h-full transition-all"
              style={{
                width: `${project.risk_level}%`,
                backgroundColor: getRiskColor(project.risk_level)
              }}
            />
          </div>
          <span className="text-xs font-medium text-foreground">{project.risk_level}</span>
        </div>
      )}
    </td>
    <td className="px-6 py-4 text-center">
      <span className="text-foreground font-medium">{project.notesCount}</span>
    </td>
    <td className="px-6 py-4 text-center">
      <div className="flex items-center justify-center gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-800 transition-colors"
              aria-label="Save changes"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="Cancel editing"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleEdit}
              className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
              aria-label={`Edit ${project.symbol} position`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => onAnalyzeClick(project.symbol, e)}
              className="inline-flex items-center text-primary text-sm font-medium hover:text-primary/80 transition-colors opacity-0 group-hover:opacity-100"
              aria-label={`Analyze ${project.symbol}`}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => onDeleteClick(project.id, e)}
              className="text-destructive hover:text-destructive/80 transition-colors opacity-0 group-hover:opacity-100"
              aria-label={`Delete ${project.symbol} position`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </td>
  </tr>
  );
};

export const StockPositionsTable: React.FC<StockPositionsTableProps> = ({
  projects,
  onRowClick,
  onAnalyzeClick,
  onDeleteClick,
  onUpdatePosition,
  onMoveToStrategy,
  loading = false,
  error
}) => {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mx-auto mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow-lg border border-destructive overflow-hidden">
        <div className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-2">Error loading positions</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No stock positions yet. Add your first position!</p>
        </div>
      </div>
    );
  }

  // Apply sorting
  const sortedProjects = [...projects].sort((a, b) => {
    if (!sortColumn || !sortDirection) {
      // Default sort: Strategy (desc), Category (desc), Risk Level (desc)
      const strategyCompare = (b.strategy || 'General').localeCompare(a.strategy || 'General');
      if (strategyCompare !== 0) return strategyCompare;
      
      const categoryCompare = (b.category || 'General').localeCompare(a.category || 'General');
      if (categoryCompare !== 0) return categoryCompare;
      
      return b.risk_level - a.risk_level;
    }

    // Custom sorting based on selected column
    let comparison = 0;
    switch (sortColumn) {
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol);
        break;
      case 'price':
        comparison = parseFloat(a.price) - parseFloat(b.price);
        break;
      case 'position_size':
        comparison = a.position_size - b.position_size;
        break;
      case 'strategy':
        comparison = (a.strategy || 'General').localeCompare(b.strategy || 'General');
        break;
      case 'category':
        comparison = (a.category || 'General').localeCompare(b.category || 'General');
        break;
      case 'risk_level':
        comparison = a.risk_level - b.risk_level;
        break;
      case 'notesCount':
        comparison = a.notesCount - b.notesCount;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Group sorted projects by strategy
  const groupedProjects = sortedProjects.reduce((acc, project) => {
    const strategy = project.strategy || 'General';
    if (!acc[strategy]) {
      acc[strategy] = [];
    }
    acc[strategy].push(project);
    return acc;
  }, {} as Record<string, StockProject[]>);

  const strategies = Object.keys(groupedProjects).sort((a, b) => b.localeCompare(a));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    // Find which strategy group the dragged item is being dropped into
    const draggedProject = projects.find(p => p.id === active.id);
    if (!draggedProject) return;

    // Check if dropped onto a different strategy group
    for (const [strategy, strategyProjects] of Object.entries(groupedProjects)) {
      const isInGroup = strategyProjects.some(p => p.id === over.id);
      if (isInGroup && draggedProject.strategy !== strategy) {
        onMoveToStrategy(draggedProject.id, strategy);
        break;
      }
    }
  };

  // Calculate overall total position size across all strategies
  const overallTotalPositionSize = projects.reduce((sum, p) => sum + p.position_size, 0);

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-8">
        {strategies.map((strategy) => {
          const strategyProjects = groupedProjects[strategy];
          const totalPositionSize = strategyProjects.reduce((sum, p) => sum + p.position_size, 0);
          const percentOfTotal = overallTotalPositionSize > 0 ? (totalPositionSize / overallTotalPositionSize) * 100 : 0;
          
          return (
            <div key={strategy} className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
              <div className="px-6 py-4 bg-muted border-b border-border">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{strategy}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {strategyProjects.length} position{strategyProjects.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Position Size</p>
                    <p className="text-xl font-bold text-primary">
                      ${totalPositionSize.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({percentOfTotal.toFixed(1)}% of total)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <TableHeader sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                  <tbody className="divide-y divide-border">
                    <SortableContext
                      items={strategyProjects.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {strategyProjects.map(project => (
                        <SortableTableRow
                          key={project.id}
                          project={project}
                          strategyTotal={totalPositionSize}
                          onRowClick={onRowClick}
                          onAnalyzeClick={onAnalyzeClick}
                          onDeleteClick={onDeleteClick}
                          onUpdatePosition={onUpdatePosition}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
};
