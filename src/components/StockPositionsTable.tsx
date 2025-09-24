// src/components/StockPositionsTable.tsx
import React from 'react';
import { Target, Zap, AlertTriangle, Brain, ArrowRight, Trash2 } from 'lucide-react';

interface StockProject {
  id: string;
  symbol: string;
  price: string;
  position: 'holding' | 'sold' | 'watching';
  strategy: string;
  date: string;
  notesCount: number;
  catalystsCount: number;
  blockersCount: number;
  researchCount: number;
}

interface StockPositionsTableProps {
  projects: StockProject[];
  onRowClick: (symbol: string) => void;
  onAnalyzeClick: (symbol: string, e: React.MouseEvent) => void;
  onDeleteClick: (positionId: string, e: React.MouseEvent) => void;
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

export const StockPositionsTable: React.FC<StockPositionsTableProps> = ({
  projects,
  onRowClick,
  onAnalyzeClick,
  onDeleteClick,
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

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                Stock
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                Price
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                Position
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                Date Added
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map(project => (
              <tr 
                key={project.id} 
                className="hover:bg-blue-50 cursor-pointer transition-colors group"
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
                  <div className="text-xs text-gray-500 mt-1">
                    {project.strategy}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-green-600 font-semibold">
                    ${parseFloat(project.price).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPositionColor(project.position)}`}>
                    {project.position}
                  </span>
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
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{project.date}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => onAnalyzeClick(project.symbol, e)}
                      className="inline-flex items-center text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Analyze ${project.symbol}`}
                    >
                      <span>Analyze</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                    <button
                      onClick={(e) => onDeleteClick(project.id, e)}
                      className="text-red-600 hover:text-red-800 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Delete ${project.symbol} position`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};