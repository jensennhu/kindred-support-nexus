import React, { useState, useEffect, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, AlertTriangle, Zap, Search, Filter, Edit3, DollarSign, Brain, Target, ArrowRight, Calendar, Building2, Users, TrendingUpDown, Globe, Gavel, Wrench, Trash2 } from 'lucide-react';
import { useStockPositions, StockPosition, NewStockPosition } from '@/hooks/useStockPositions';
import { useAnalysisNotes, AnalysisNote, NewAnalysisNote } from '@/hooks/useAnalysisNotes';
import {
  DndContext,
  closestCenter,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from "@dnd-kit/core";

// Parent categories for organizing notes

const PARENT_CATEGORIES = [
  { id: 'financial', name: 'Financial', icon: DollarSign, color: 'text-emerald-600' },
  { id: 'management', name: 'Management', icon: Users, color: 'text-blue-600' },
  { id: 'market', name: 'Market', icon: TrendingUpDown, color: 'text-purple-600' },
  { id: 'regulatory', name: 'Regulatory', icon: Gavel, color: 'text-orange-600' },
  { id: 'operational', name: 'Operational', icon: Wrench, color: 'text-gray-600' },
  { id: 'competitive', name: 'Competitive', icon: Globe, color: 'text-red-600' },
];

const ThoughtStockJournal = () => {
  // Use hooks for data
  const { positions, loading: positionsLoading, addPosition: addStockPosition, deletePosition: deleteStockPosition } = useStockPositions();
  const { notes, loading: notesLoading, addNote, updateNote, deleteNote, deleteNotesByStock } = useAnalysisNotes();

  function DroppableContainer({ id, children }: { id: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });
  
    return (
      <div
        ref={setNodeRef}
        className={`min-h-[100px] p-2 rounded-lg border ${
          isOver ? "bg-blue-50 border-blue-400" : "bg-gray-50 border-gray-200"
        }`}
      >
        {children}
      </div>
    );
  }

  // State
  const [activeTab, setActiveTab] = useState('positions');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<string | null>(null);
  const [showNoteDetail, setShowNoteDetail] = useState(false);
  const [selectedNote, setSelectedNote] = useState<AnalysisNote | null>(null);
  const [showEditNote, setShowEditNote] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<AnalysisNote | null>(null);


  const [newPosition, setNewPosition] = useState<NewStockPosition>({
    symbol: '',
    price: '',
    position: 'watching',
    strategy: 'General',
    date: new Date().toISOString().split('T')[0]
  });

  const [newNote, setNewNote] = useState<NewAnalysisNote>({
    category: 'research',
    parentCategory: 'general',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    tags: ''
  });


  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    if (activeId === overId) return;
  
    const activeNote = notes.find(n => n.id === activeId);
    if (!activeNote) return;

    // Case 1: Dropped over a container
    if (overId.includes("-")) {
      const [newCategory, newParentCategory] = overId.split("-");

      let updates: Partial<AnalysisNote> = {};
      if (newCategory === "research") {
        updates = {
          category: "research",
          parentCategory: "general",
          sentiment: undefined,
        };
      } else if (newCategory === "catalyst") {
        updates = {
          category: "catalyst",
          parentCategory: newParentCategory,
          sentiment: "bullish",
        };
      } else if (newCategory === "block") {
        updates = {
          category: "block",
          parentCategory: newParentCategory,
          sentiment: "bearish",
        };
      }

      updateNote(activeId, updates);
    }
  };
  

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    // Simplified drag over - just for visual feedback
    return;
  };
  
  // Add position
  const handleAddPosition = async () => {
    if (newPosition.symbol && newPosition.price) {
      try {
        await addStockPosition(newPosition);
        setNewPosition({
          symbol: '',
          price: '',
          position: 'watching',
          strategy: 'General',
          date: new Date().toISOString().split('T')[0]
        });
        setShowAddPosition(false);
      } catch (error) {
        console.error('Failed to add position:', error);
      }
    }
  };

  // Add note
  const handleAddNote = async () => {
    if (selectedStock && newNote.title && newNote.description) {
      const stockPosition = positions.find(p => p.symbol === selectedStock);
      if (stockPosition) {
        try {
          await addNote(stockPosition.id, selectedStock, newNote);
          setNewNote({
            category: 'research',
            parentCategory: 'general',
            title: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            tags: ''
          });
          setShowAddNote(false);
        } catch (error) {
          console.error('Failed to add note:', error);
        }
      }
    }
  };

  // Delete position and related notes
  const handleDeletePosition = async (positionId: string) => {
    try {
      await deleteNotesByStock(positionId);
      await deleteStockPosition(positionId);
      setShowDeleteConfirm(false);
      setPositionToDelete(null);
    } catch (error) {
      console.error('Failed to delete position:', error);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (positionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setPositionToDelete(positionId);
    setShowDeleteConfirm(true);
  };

  // Handle row click
  const handleRowClick = (symbol: string) => {
    setSelectedStock(symbol);
    setActiveTab('analysis');
  };

  // Handle note click
  const handleNoteClick = (note: AnalysisNote) => {
    setSelectedNote(note);
    setShowNoteDetail(true);
  };

  const handleEditNote = (note: AnalysisNote) => {
    setNoteToEdit(note);
    setShowEditNote(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setShowNoteDetail(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Get stock projects for display grouped by strategy
  const stockProjects = useMemo(() => {
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

  const filteredProjects = useMemo(() => 
    stockProjects.filter(project =>
      project.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    ), [stockProjects, searchTerm]);

  // Group positions by strategy
  const groupedByStrategy = useMemo(() => {
    return filteredProjects.reduce((acc, stock) => {
      if (!acc[stock.strategy]) {
        acc[stock.strategy] = [];
      }
      acc[stock.strategy].push(stock);
      return acc;
    }, {} as Record<string, typeof filteredProjects>);
  }, [filteredProjects]);

  const getPositionColor = (position: 'holding' | 'sold' | 'watching') => {
    switch (position) {
      case 'holding': return 'bg-green-100 text-green-800 border-green-200';
      case 'sold': return 'bg-red-100 text-red-800 border-red-200';
      case 'watching': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Sortable note component for drag and drop
  const SortableNote = ({ note }: { note: AnalysisNote }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: note.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    // Different styling for research notes
    const getNoteStyling = () => {
      if (note.category === 'research') {
        return 'bg-gray-50 border-l-gray-500 border border-gray-200';
      }
      return note.sentiment === 'bullish' 
        ? 'bg-green-50 border-l-green-500 border border-green-200' 
        : 'bg-red-50 border-l-red-500 border border-red-200';
    };

    const getSentimentIcon = () => {
      if (note.category === 'research') {
        return <Brain className="w-4 h-4 text-gray-600" />;
      }
      return note.sentiment === 'bullish' ? 
        <TrendingUp className="w-4 h-4 text-green-600" /> : 
        <TrendingDown className="w-4 h-4 text-red-600" />;
    };

    const getTagStyling = () => {
      if (note.category === 'research') {
        return 'bg-gray-100 text-gray-800';
      }
      return note.sentiment === 'bullish' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800';
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onDoubleClick={() => handleNoteClick(note)}
        className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${getNoteStyling()}`}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900">{note.title}</h4>
          <div className="flex items-center gap-1">
            {getSentimentIcon()}
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{note.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{note.date}</span>
        </div>
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 4).map((tag, index) => (
              <span key={index} className={`px-2 py-0.5 rounded-full text-xs ${getTagStyling()}`}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
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
              onClick={() => {
                setActiveTab('positions');
                setSelectedStock(null);
              }}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'positions' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Stock Positions
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
              </button>
            )}
          </div>
        </div>

        {/* Stock Positions Page */}
        {activeTab === 'positions' && (
          <div className="space-y-6">
            {/* Search and Add */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search stock positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>
              
              <button
                onClick={() => setShowAddPosition(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Position
              </button>
            </div>

            {/* Positions Table */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Position</th>
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
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">Total Notes</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Date Added</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProjects.map(project => (
                    <tr 
                      key={project.id} 
                      className="hover:bg-blue-50 cursor-pointer transition-colors group"
                      onClick={() => handleRowClick(project.symbol)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{project.symbol}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-600 font-semibold">${project.price}</span>
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
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              setSelectedStock(project.symbol);
                              setActiveTab('analysis');
                            }}
                            className="inline-flex items-center text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <span>Analyze</span>
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(project.id, e)}
                            className="text-red-600 hover:text-red-800 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredProjects.length === 0 && (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No stock positions yet. Add your first position!</p>
                  <button
                    onClick={() => setShowAddPosition(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add First Position
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis Board */}
        {activeTab === 'analysis' && selectedStock && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStock} Analysis Board</h2>
                  <p className="text-gray-600">Drag notes between categories and sections</p>
                </div>
                <button
                  onClick={() => setShowAddNote(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              </div>

              {/* Columns: Catalysts, Blockers & Research */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {["catalyst", "block", "research"].map((categoryColumn) => (
                  <div
                    key={categoryColumn}
                    className="bg-white rounded-lg shadow-lg border border-gray-200"
                  >
                    <div
                      className={`p-4 border-b border-gray-200 ${
                        categoryColumn === "catalyst" 
                          ? "bg-blue-50" 
                          : categoryColumn === "block" 
                          ? "bg-orange-50" 
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {categoryColumn === "catalyst" ? (
                          <Zap className="w-5 h-5 text-blue-600" />
                        ) : categoryColumn === "block" ? (
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        ) : (
                          <Brain className="w-5 h-5 text-gray-600" />
                        )}
                        <h3 className="font-semibold text-gray-900">
                          {categoryColumn === "catalyst" 
                            ? "Catalysts" 
                            : categoryColumn === "block" 
                            ? "Blockers" 
                            : "Research"}
                        </h3>
                        <span className={`${
                          categoryColumn === "catalyst" 
                            ? "bg-blue-100 text-blue-800" 
                            : categoryColumn === "block" 
                            ? "bg-orange-100 text-orange-800" 
                            : "bg-gray-100 text-gray-800"
                        } px-2 py-1 rounded-full text-sm font-medium`}>
                          {notes.filter(n => n.symbol === selectedStock && n.category === categoryColumn).length}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-6">
                      {/* For research, show all notes in one section */}
                      {categoryColumn === "research" ? (
                        <SortableContext
                          items={notes.filter(n => n.symbol === selectedStock && n.category === "research").map(n => n.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <DroppableContainer id="research-general">
                            <div className="flex items-center gap-2 mb-3">
                              <Brain className="w-4 h-4 text-gray-600" />
                              <h4 className="font-medium text-sm text-gray-900">General Research</h4>
                              <span className="text-xs text-gray-500">
                                ({notes.filter(n => n.symbol === selectedStock && n.category === "research").length})
                              </span>
                            </div>

                            <div className="space-y-3">
                              {notes
                                .filter(n => n.symbol === selectedStock && n.category === "research")
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map(note => (
                                  <SortableNote key={note.id} note={note} />
                                ))}

                              {notes.filter(n => n.symbol === selectedStock && n.category === "research").length === 0 && (
                                <div className="text-center py-4">
                                  <p className="text-xs text-gray-500">
                                    Drop research notes here
                                  </p>
                                </div>
                              )}
                            </div>
                          </DroppableContainer>
                        </SortableContext>
                      ) : (
                        /* For catalysts and blocks, maintain parent category structure */
                        PARENT_CATEGORIES.map(parentCat => {
                          const Icon = parentCat.icon;
                          const categoryNotes = notes
                            .filter(
                              n =>
                                n.symbol === selectedStock &&
                                n.category === categoryColumn &&
                                n.parentCategory === parentCat.id
                            )
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                          return (
                            <SortableContext
                              key={`${categoryColumn}-${parentCat.id}`}
                              items={categoryNotes.map(n => n.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <DroppableContainer id={`${categoryColumn}-${parentCat.id}`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <Icon className={`w-4 h-4 ${parentCat.color}`} />
                                  <h4 className="font-medium text-sm text-gray-900">{parentCat.name}</h4>
                                  <span className="text-xs text-gray-500">({categoryNotes.length})</span>
                                </div>

                                <div className="space-y-3">
                                  {categoryNotes.map(note => (
                                    <SortableNote key={note.id} note={note} />
                                  ))}

                                  {categoryNotes.length === 0 && (
                                    <div className="text-center py-4">
                                      <p className="text-xs text-gray-500">
                                        Drop notes here
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </DroppableContainer>
                            </SortableContext>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DndContext>
        )}

        {/* Add Position Modal */}
        {showAddPosition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full border border-gray-200 shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Add Stock Position</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Stock Symbol*</label>
                  <input
                    type="text"
                    value={newPosition.symbol}
                    onChange={(e) => setNewPosition({...newPosition, symbol: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="e.g., AAPL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Current Price*</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPosition.price}
                    onChange={(e) => setNewPosition({...newPosition, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Position</label>
                    <select
                      value={newPosition.position}
                      onChange={(e) => setNewPosition({...newPosition, position: e.target.value as 'holding' | 'sold' | 'watching'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="watching">Watching</option>
                      <option value="holding">Holding</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Strategy</label>
                    <input
                      type="text"
                      value={newPosition.strategy}
                      onChange={(e) => setNewPosition({...newPosition, strategy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                      placeholder="e.g. Crypto, LEAPS, Swing Trade"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Date</label>
                  <input
                    type="date"
                    value={newPosition.date}
                    onChange={(e) => setNewPosition({...newPosition, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddPosition(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPosition}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Position
                </button>
              </div>
            </div>
          </div>
        )}

{showAddNote && selectedStock && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          Add Analysis Note for {selectedStock}
        </h2>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Date</label>
            <input
              type="date"
              value={newNote.date}
              onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Category*</label>
            <select
              value={newNote.category}
              onChange={(e) => {
                const category = e.target.value as 'catalyst' | 'block' | 'research';
                setNewNote({
                  ...newNote,
                  category,
                  sentiment: category === 'research' ? undefined : (newNote.sentiment || 'bullish'),
                  parentCategory: category === 'research' ? 'general' : newNote.parentCategory,
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              <option value="catalyst">Catalyst (Driver)</option>
              <option value="block">Block (Obstacle)</option>
              <option value="research">Research Note</option>
            </select>
          </div>

          {newNote.category !== 'research' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Sentiment*</label>
              <select
                value={newNote.sentiment || 'bullish'}
                onChange={(e) => setNewNote({ ...newNote, sentiment: e.target.value as 'bullish' | 'bearish' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="bullish">Bullish</option>
                <option value="bearish">Bearish</option>
              </select>
            </div>
          )}
        </div>

        {newNote.category !== 'research' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Parent Category*</label>
            <select
              value={newNote.parentCategory}
              onChange={(e) => setNewNote({ ...newNote, parentCategory: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            >
              {PARENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Title*</label>
          <input
            type="text"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            placeholder="Brief title for this analysis point"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Analysis*</label>
          <textarea
            value={newNote.description}
            onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            placeholder="Detailed analysis of this catalyst or block..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Tags</label>
          <input
            type="text"
            value={newNote.tags}
            onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            placeholder="earnings, tech, regulation (comma-separated)"
          />
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
        <button
          onClick={() => setShowAddNote(false)}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAddNote}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Note
        </button>
      </div>
    </div>
  </div>
)}


        {/* Note Detail Modal */}
        {showNoteDetail && selectedNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto border border-gray-200 shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedNote.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {selectedNote.date}
                      </span>
                      <span className="flex items-center gap-1">
                        {selectedNote.category === 'research' ? (
                          <>
                            <Brain className="w-4 h-4" />
                            Research
                          </>
                        ) : selectedNote.category === 'catalyst' ? (
                          <>
                            <Zap className="w-4 h-4" />
                            Catalyst
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4" />
                            Block
                          </>
                        )}
                      </span>
                      {selectedNote.sentiment && (
                        <span className={`flex items-center gap-1 ${
                          selectedNote.sentiment === 'bullish' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedNote.sentiment === 'bullish' ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {selectedNote.sentiment}
                        </span>
                      )}
                      
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowNoteDetail(false);
                      setSelectedNote(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Analysis</h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedNote.description}</p>
                  </div>
                </div>

                {selectedNote.tags && selectedNote.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedNote.tags.map((tag, index) => (
                        <span key={index} className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedNote.category === 'research' 
                            ? 'bg-gray-100 text-gray-800' 
                            : selectedNote.sentiment === 'bullish' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNote.parentCategory && selectedNote.parentCategory !== 'general' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Category</h3>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const parentCat = PARENT_CATEGORIES.find(cat => cat.id === selectedNote.parentCategory);
                        if (parentCat) {
                          const Icon = parentCat.icon;
                          return (
                            <>
                              <Icon className={`w-5 h-5 ${parentCat.color}`} />
                              <span className="text-gray-700">{parentCat.name}</span>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
                  <span>Stock: {selectedNote.symbol}</span>
                  <span className="mx-2">•</span>
                  <span>Created: {new Date(selectedNote.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
  <button
    onClick={() => {
      setShowNoteDetail(false);
      setSelectedNote(null);
    }}
    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
  >
    Close
  </button>
  <button
    onClick={() => {
      setNoteToEdit(selectedNote);
      setShowEditNote(true);
    }}
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
  >
    Edit
  </button>
  <button
    onClick={() => handleDeleteNote(selectedNote.id)}
    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
  >
    Delete
  </button>
</div>

          </div>
          
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && positionToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full border border-gray-200 shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Confirm Deletion</h2>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Delete this stock position?</p>
                    <p className="text-sm text-gray-600 mt-1">
                      This will permanently delete the position and all related analysis notes. This action cannot be undone.
                    </p>
                  </div>
                </div>
                
                {(() => {
                  const project = stockProjects.find(p => p.id === positionToDelete);
                  return project ? (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{project.symbol}</span>
                        <span className="text-sm text-gray-600">{project.notesCount} notes will be deleted</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPositionToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePosition(positionToDelete)}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Position
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThoughtStockJournal;