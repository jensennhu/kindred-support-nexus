// src/components/StockPositionsTable.tsx
import React, { useState } from 'react';
import { Target, Zap, AlertTriangle, Brain, ArrowRight, Trash2, Edit3, Save, X } from 'lucide-react';

interface StockProject {
  id: string;
  symbol: string;
  price: string;
  position: 'holding' | 'sold' | 'watching';
  strategy: string;
  category: string;
  date: string;
  notesCount: number;
  catalystsCount: number;
  blockersCount: number;
  researchCount: number;
  risk_level: number;
}

interface StockPositionsTableProps {
  projects: StockProject[];
  onRowClick: (symbol: string) => void;
  onAnalyzeClick: (symbol: string, e: React.MouseEvent) => void;
  onDeleteClick: (positionId: string, e: React.MouseEvent) => void;
  onUpdatePosition: (positionId: string, updates: { price?: string; position?: 'holding' | 'sold' | 'watching'; strategy?: string; category?: string; risk_level?: number }) => Promise<void>;
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

const TableHeader = () => (
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
        Stock
      </th>
      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
        Price
      </th>
      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
        Strategy
      </th>
      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
        Category
      </th>
      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
        Risk Level
      </th>
      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">
        <div className="flex items-center justify-center gap-1">
          <Zap className="w-4 h-4 text-blue-600" />
          Catalysts
        </div>
      </th>
      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">
        <div className="flex items-center justify-center gap-1">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          Blockers
        </div>
      </th>
      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">
        <div className="flex items-center justify-center gap-1">
          <Brain className="w-4 h-4 text-gray-600" />
          Research
        </div>
      </th>
      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">
        Total Notes
      </th>
      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">
        Actions
      </th>
    </tr>
  </thead>
);

const TableRow: React.FC<{
  project: StockProject;
  onRowClick: (symbol: string) => void;
  onAnalyzeClick: (symbol: string, e: React.MouseEvent) => void;
  onDeleteClick: (positionId: string, e: React.MouseEvent) => void;
  onUpdatePosition: (positionId: string, updates: { price?: string; position?: 'holding' | 'sold' | 'watching'; strategy?: string; category?: string; risk_level?: number }) => Promise<void>;
}> = ({ project, onRowClick, onAnalyzeClick, onDeleteClick, onUpdatePosition }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    price: project.price,
    position: project.position,
    strategy: project.strategy,
    category: project.category,
    risk_level: project.risk_level
  });

  // Calculate sentiment score based on notes balance
  const sentimentScore = project.catalystsCount - project.blockersCount;
  const totalNotes = project.catalystsCount + project.blockersCount + project.researchCount;
  const getBackgroundColor = () => {
    if (totalNotes === 0) return 'bg-gray-50';
    const ratio = sentimentScore / totalNotes;
    if (ratio > 0.3) return 'bg-green-50';
    if (ratio > 0) return 'bg-green-25';
    if (ratio < -0.3) return 'bg-red-50';
    if (ratio < 0) return 'bg-red-25';
    return 'bg-yellow-50';
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
      risk_level: project.risk_level
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
    key={project.id} 
    className={`hover:bg-blue-50 cursor-pointer transition-colors group ${getBackgroundColor()}`}
    onClick={() => onRowClick(project.symbol)}
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
    <td className="px-6 py-4">
      <span className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
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
          className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <span className="text-green-600 font-semibold">
          ${parseFloat(project.price).toFixed(2)}
        </span>
      )}
    </td>
    <td className="px-6 py-4">
      {isEditing ? (
        <input
          type="text"
          value={editData.strategy}
          onChange={(e) => setEditData(prev => ({ ...prev, strategy: e.target.value }))}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <span className="text-gray-700">{project.strategy}</span>
      )}
    </td>
    <td className="px-6 py-4">
      {isEditing ? (
        <input
          type="text"
          value={editData.category}
          onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <span className="text-gray-700">{project.category}</span>
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
            className="h-2 w-24 rounded-full bg-gray-200 overflow-hidden"
          >
            <div 
              className="h-full transition-all"
              style={{
                width: `${project.risk_level}%`,
                backgroundColor: getRiskColor(project.risk_level)
              }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700">{project.risk_level}</span>
        </div>
      )}
    </td>
    <td className="px-6 py-4 text-center">
      <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold">
        {project.catalystsCount}
      </div>
    </td>
    <td className="px-6 py-4 text-center">
      <div className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-800 rounded-full font-bold">
        {project.blockersCount}
      </div>
    </td>
    <td className="px-6 py-4 text-center">
      <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-800 rounded-full font-bold">
        {project.researchCount}
      </div>
    </td>
    <td className="px-6 py-4 text-center">
      <span className="text-gray-600 font-medium">{project.notesCount}</span>
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
              className="text-gray-600 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
              aria-label={`Edit ${project.symbol} position`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => onAnalyzeClick(project.symbol, e)}
              className="inline-flex items-center text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors opacity-0 group-hover:opacity-100"
              aria-label={`Analyze ${project.symbol}`}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => onDeleteClick(project.id, e)}
              className="text-red-600 hover:text-red-800 transition-colors opacity-0 group-hover:opacity-100"
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
  loading = false,
  error
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-red-200 overflow-hidden">
        <div className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Error loading positions</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No stock positions yet. Add your first position!</p>
        </div>
      </div>
    );
  }

  // Sort projects by Strategy (desc), Category (desc), Risk Level (desc)
  const sortedProjects = [...projects].sort((a, b) => {
    // Sort by strategy (descending)
    const strategyCompare = (b.strategy || 'General').localeCompare(a.strategy || 'General');
    if (strategyCompare !== 0) return strategyCompare;
    
    // Sort by category (descending)
    const categoryCompare = (b.category || 'General').localeCompare(a.category || 'General');
    if (categoryCompare !== 0) return categoryCompare;
    
    // Sort by risk level (descending)
    return b.risk_level - a.risk_level;
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

  return (
    <div className="space-y-8">
      {strategies.map((strategy) => (
        <div key={strategy} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{strategy}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {groupedProjects[strategy].length} position{groupedProjects[strategy].length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableHeader />
              <tbody className="divide-y divide-gray-100">
                {groupedProjects[strategy].map(project => (
                  <TableRow
                    key={project.id}
                    project={project}
                    onRowClick={onRowClick}
                    onAnalyzeClick={onAnalyzeClick}
                    onDeleteClick={onDeleteClick}
                    onUpdatePosition={onUpdatePosition}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};