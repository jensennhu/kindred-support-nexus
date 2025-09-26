// src/components/ThoughtStockJournal.tsx
import React, { useState, useMemo } from 'react';
import { Plus, Target } from 'lucide-react';
import { useStockPositions } from '@/hooks/useStockPositions';
import { useAnalysisNotes } from '@/hooks/useAnalysisNotes';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './LoadingSpinner';
import { SearchInput } from './SearchInput';
import { StockPositionsTable } from './StockPositionsTable';
import { AddPositionModal, NewStockPosition } from './AddPositionModal';
import { AddNoteModal, NewAnalysisNote } from './AddNoteModal';
import { AnalysisBoard } from './AnalysisBoard';
import { DeleteConfirmModal } from './DeleteConfirmModal';

const ThoughtStockJournal = () => {
  const { toast } = useToast();
  
  // Data hooks with improved error handling
  const { 
    positions, 
    loading: positionsLoading, 
    error: positionsError,
    addPosition: addStockPosition, 
    updatePosition,
    deletePosition: deleteStockPosition,
    clearError: clearPositionsError
  } = useStockPositions();
  
  const { 
    notes, 
    loading: notesLoading, 
    error: notesError,
    addNote, 
    updateNote, 
    deleteNote, 
    deleteNotesByStock,
    clearError: clearNotesError
  } = useAnalysisNotes();

  // UI State
  const [activeTab, setActiveTab] = useState<'positions' | 'analysis'>('positions');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<{ id: string; symbol: string } | null>(null);
  
  // Loading states for modals
  const [positionModalLoading, setPositionModalLoading] = useState(false);
  const [noteModalLoading, setNoteModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Enhanced error handling
  const showErrorToast = (message: string, title: string = 'Error') => {
    toast({
      title,
      description: message,
      variant: 'destructive',
    });
  };

  const showSuccessToast = (message: string, title: string = 'Success') => {
    toast({
      title,
      description: message,
    });
  };

  // Clear errors when switching tabs or modals
  const clearErrors = () => {
    clearPositionsError();
    clearNotesError();
  };

  // Enhanced add position handler
  const handleAddPosition = async (newPosition: NewStockPosition): Promise<void> => {
    setPositionModalLoading(true);
    clearErrors();

    try {
      await addStockPosition(newPosition);
      showSuccessToast(`Successfully added ${newPosition.symbol} to your positions`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add position';
      showErrorToast(message, 'Failed to Add Position');
      throw error; // Re-throw so modal can handle it
    } finally {
      setPositionModalLoading(false);
    }
  };

  // Enhanced add note handler
  const handleAddNote = async (newNote: NewAnalysisNote): Promise<void> => {
    if (!selectedStock) {
      showErrorToast('No stock selected');
      return;
    }

    const stockPosition = positions.find(p => p.symbol === selectedStock);
    if (!stockPosition) {
      showErrorToast('Stock position not found');
      return;
    }

    setNoteModalLoading(true);
    clearErrors();

    try {
      await addNote(stockPosition.id, selectedStock, newNote);
      showSuccessToast(`Added ${newNote.category} note for ${selectedStock}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add note';
      showErrorToast(message, 'Failed to Add Note');
      throw error;
    } finally {
      setNoteModalLoading(false);
    }
  };

  // Enhanced delete position handler
  const handleDeletePosition = async (): Promise<void> => {
    if (!positionToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteNotesByStock(positionToDelete.id);
      await deleteStockPosition(positionToDelete.id);
      showSuccessToast(`Deleted ${positionToDelete.symbol} and all related notes`);
      
      // Clear selection if we deleted the selected stock
      if (selectedStock === positionToDelete.symbol) {
        setSelectedStock(null);
        setActiveTab('positions');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete position';
      showErrorToast(message, 'Failed to Delete Position');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setPositionToDelete(null);
    }
  };

  // Enhanced delete confirmation handler
  const handleDeleteClick = (positionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const position = positions.find(p => p.id === positionId);
    if (position) {
      setPositionToDelete({ id: positionId, symbol: position.symbol });
      setShowDeleteConfirm(true);
    }
  };

  // Update position handler for inline editing
  const handleUpdatePosition = async (positionId: string, updates: { price?: string; position?: 'holding' | 'sold' | 'watching'; strategy?: string }): Promise<void> => {
    try {
      await updatePosition(positionId, updates);
      showSuccessToast('Position updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update position';
      showErrorToast(message, 'Update Failed');
      throw error;
    }
  };

  // Navigation handlers
  const handleRowClick = (symbol: string) => {
    setSelectedStock(symbol);
    setActiveTab('analysis');
  };

  const handleAnalyzeClick = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStock(symbol);
    setActiveTab('analysis');
  };

  const handleBackToPositions = () => {
    setActiveTab('positions');
    setSelectedStock(null);
    clearErrors();
  };

  // Enhanced stock projects computation with error handling
  const stockProjects = useMemo(() => {
    if (!positions.length) return [];

    return positions.map(position => {
      const stockNotes = notes.filter(note => note.stockId === position.id);
      const catalystsCount = stockNotes.filter(n => n.category === 'catalyst').length;
      const blockersCount = stockNotes.filter(n => n.category === 'block').length;
      const researchCount = stockNotes.filter(n => n.category === 'research').length;
      
      return {
        ...position,
        notesCount: stockNotes.length,
        catalystsCount,
        blockersCount,
        researchCount,
        notes: stockNotes
      };
    });
  }, [positions, notes]);

  // Enhanced filtering with error handling
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return stockProjects;
    
    const searchLower = searchTerm.toLowerCase();
    return stockProjects.filter(project =>
      project.symbol.toLowerCase().includes(searchLower) ||
      project.strategy.toLowerCase().includes(searchLower)
    );
  }, [stockProjects, searchTerm]);

  // Loading state handling
  if (positionsLoading && notesLoading) {
    return <LoadingSpinner fullScreen text="Loading your stock analysis..." />;
  }

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('ThoughtStockJournal error:', error, errorInfo);
      showErrorToast('An unexpected error occurred. Please refresh the page.');
    }}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
              <Target className="w-10 h-10 text-blue-600" />
              Stock Analysis Board
            </h1>
            <p className="text-gray-600">Manage your stock positions and detailed analysis separately</p>
          </div>

          {/* Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-lg border border-gray-200">
              <button
                onClick={handleBackToPositions}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeTab === 'positions' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Stock Positions {positions.length > 0 && `(${positions.length})`}
              </button>
              {selectedStock && (
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-6 py-2 rounded-md transition-all ${
                    activeTab === 'analysis' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {selectedStock} Analysis
                  {(() => {
                    const project = stockProjects.find(p => p.symbol === selectedStock);
                    return project?.notesCount ? ` (${project.notesCount})` : '';
                  })()}
                </button>
              )}
            </div>
          </div>

          {/* Stock Positions Tab */}
          {activeTab === 'positions' && (
            <div className="space-y-6">
              {/* Error Display */}
              {(positionsError || notesError) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
                  <p className="text-red-600 text-sm">
                    {positionsError?.message || notesError?.message}
                  </p>
                  <button
                    onClick={clearErrors}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Search and Add */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search stock positions..."
                    className="w-full"
                  />
                </div>
                
                <button
                  onClick={() => setShowAddPosition(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  Add Position
                </button>
              </div>

              {/* Positions Table */}
              <StockPositionsTable
                projects={filteredProjects}
                onRowClick={handleRowClick}
                onAnalyzeClick={handleAnalyzeClick}
                onDeleteClick={handleDeleteClick}
                onUpdatePosition={handleUpdatePosition}
                loading={positionsLoading}
                error={positionsError?.message}
              />

              {/* Empty State for Search */}
              {searchTerm && filteredProjects.length === 0 && stockProjects.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No positions found matching "{searchTerm}"</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-800 underline mt-2"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Analysis Board Tab */}
          {activeTab === 'analysis' && selectedStock && (
            <div className="space-y-6">
              {/* Error display */}
              {notesError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-red-800 font-semibold mb-2">Error Loading Notes</h3>
                  <p className="text-red-600 text-sm">{notesError.message}</p>
                  <button
                    onClick={clearNotesError}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <AnalysisBoard
                selectedStock={selectedStock}
                notes={notes.filter(n => n.symbol === selectedStock)}
                onAddNote={() => setShowAddNote(true)}
                onUpdateNote={updateNote}
                onDeleteNote={deleteNote}
                loading={notesLoading}
                onShowSuccess={showSuccessToast}
                onShowError={showErrorToast}
              />
            </div>
          )}

          {/* Add Position Modal */}
          <AddPositionModal
            isOpen={showAddPosition}
            onClose={() => setShowAddPosition(false)}
            onSubmit={handleAddPosition}
            loading={positionModalLoading}
            error={positionsError?.message}
          />

          {/* Add Note Modal */}
          <AddNoteModal
            isOpen={showAddNote}
            onClose={() => setShowAddNote(false)}
            onSubmit={handleAddNote}
            stockSymbol={selectedStock || undefined}
            loading={noteModalLoading}
            error={notesError?.message}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            onClose={() => {
              setShowDeleteConfirm(false);
              setPositionToDelete(null);
            }}
            onConfirm={handleDeletePosition}
            positionSymbol={positionToDelete?.symbol}
            notesCount={positionToDelete ? stockProjects.find(p => p.id === positionToDelete.id)?.notesCount || 0 : 0}
            loading={deleteLoading}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ThoughtStockJournal;