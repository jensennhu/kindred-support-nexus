import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, AlertTriangle, Zap, Search, Filter, Edit3, DollarSign, Brain, Target, ArrowRight, Calendar } from 'lucide-react';

// Type definitions
interface Entry {
  id: number;
  symbol: string;
  price: string;
  position: 'holding' | 'sold' | 'watching';
  sentiment: 'bullish' | 'bearish';
  category: 'catalyst' | 'block';
  title: string;
  description: string;
  date: string;
  timestamp: string;
  tags: string[];
}

interface StockProject {
  symbol: string;
  entries: Entry[];
  latestPrice: string | null;
  latestPosition: 'holding' | 'sold' | 'watching';
  latestDate: string | null;
}

interface NewEntry {
  date: string;
  symbol: string;
  price: string;
  position: 'holding' | 'sold' | 'watching';
  sentiment: 'bullish' | 'bearish';
  category: 'catalyst' | 'block';
  title: string;
  description: string;
  tags: string;
}

const ThoughtStockJournal = () => {
  // Initialize with example data
  const exampleEntries: Entry[] = [
    {
      id: 1,
      symbol: 'AAPL',
      price: '182.50',
      position: 'holding',
      sentiment: 'bullish',
      category: 'catalyst',
      title: 'iPhone 15 Launch Success',
      description: 'Strong pre-order numbers and positive reviews for iPhone 15 Pro. New titanium design and improved camera system driving premium mix. Expect strong Q4 earnings.',
      date: '2024-09-15',
      timestamp: '2024-09-15T10:00:00.000Z',
      tags: ['product-launch', 'earnings', 'premium']
    },
    {
      id: 2,
      symbol: 'AAPL',
      price: '180.25',
      position: 'holding',
      sentiment: 'bullish',
      category: 'block',
      title: 'High Valuation Multiple',
      description: 'Trading at 28x P/E vs historical average of 20x. Valuation stretched relative to growth prospects. May limit upside potential in near term.',
      date: '2024-09-10',
      timestamp: '2024-09-10T14:30:00.000Z',
      tags: ['valuation', 'multiple-expansion']
    },
    {
      id: 3,
      symbol: 'AAPL',
      price: '178.90',
      position: 'holding',
      sentiment: 'bearish',
      category: 'catalyst',
      title: 'China Regulatory Concerns',
      description: 'Increasing restrictions on iPhone usage in government offices. Potential broader consumer impact if tensions escalate. China represents 20% of revenue.',
      date: '2024-09-08',
      timestamp: '2024-09-08T09:15:00.000Z',
      tags: ['china', 'regulatory', 'geopolitical']
    },
    {
      id: 4,
      symbol: 'AAPL',
      price: '181.75',
      position: 'holding',
      sentiment: 'bearish',
      category: 'block',
      title: 'Strong Brand Moat',
      description: 'Ecosystem lock-in effect provides significant downside protection. High switching costs and customer loyalty. Even in bear case, unlikely to see major market share loss.',
      date: '2024-09-12',
      timestamp: '2024-09-12T16:45:00.000Z',
      tags: ['moat', 'brand', 'ecosystem']
    },
    {
      id: 5,
      symbol: 'TSLA',
      price: '258.50',
      position: 'watching',
      sentiment: 'bullish',
      category: 'catalyst',
      title: 'FSD Beta Expansion',
      description: 'Full Self-Driving beta showing significant improvements. Potential for subscription revenue model to drive margins. Robotaxi opportunity could be massive.',
      date: '2024-09-14',
      timestamp: '2024-09-14T11:20:00.000Z',
      tags: ['fsd', 'autonomous', 'subscription']
    },
    {
      id: 6,
      symbol: 'TSLA',
      price: '255.30',
      position: 'watching',
      sentiment: 'bullish',
      category: 'block',
      title: 'Competition Intensifying',
      description: 'Traditional automakers ramping EV production. Ford, GM, and European makers gaining market share. Price wars could pressure margins.',
      date: '2024-09-11',
      timestamp: '2024-09-11T13:10:00.000Z',
      tags: ['competition', 'ev-market', 'margins']
    },
    {
      id: 7,
      symbol: 'TSLA',
      price: '260.80',
      position: 'watching',
      sentiment: 'bearish',
      category: 'catalyst',
      title: 'Demand Concerns',
      description: 'Multiple price cuts suggesting demand weakness. Inventory building up in key markets. Economic slowdown could further impact luxury EV demand.',
      date: '2024-09-13',
      timestamp: '2024-09-13T08:45:00.000Z',
      tags: ['demand', 'pricing', 'inventory']
    },
    {
      id: 8,
      symbol: 'NVDA',
      price: '436.20',
      position: 'holding',
      sentiment: 'bullish',
      category: 'catalyst',
      title: 'AI Chip Demand Surge',
      description: 'Data center revenue up 171% YoY driven by AI workloads. H100 chips supply-constrained with massive backlog. Cloud providers building out AI infrastructure.',
      date: '2024-09-16',
      timestamp: '2024-09-16T15:30:00.000Z',
      tags: ['ai', 'datacenter', 'h100']
    },
    {
      id: 9,
      symbol: 'NVDA',
      price: '430.50',
      position: 'holding',
      sentiment: 'bearish',
      category: 'catalyst',
      title: 'China Export Restrictions',
      description: 'New semiconductor export controls limiting sales to China. Gaming GPU demand normalizing post-crypto crash. Consumer segment showing weakness.',
      date: '2024-09-09',
      timestamp: '2024-09-09T12:00:00.000Z',
      tags: ['china', 'export-controls', 'gaming']
    },
    {
      id: 10,
      symbol: 'NVDA',
      price: '438.75',
      position: 'holding',
      sentiment: 'bearish',
      category: 'block',
      title: 'Switching Costs High',
      description: 'CUDA ecosystem creates significant moat. Enterprise customers heavily invested in NVIDIA stack. AMD and Intel lack software parity despite hardware improvements.',
      date: '2024-09-17',
      timestamp: '2024-09-17T10:15:00.000Z',
      tags: ['cuda', 'moat', 'software']
    }
  ];

  const [entries, setEntries] = useState<Entry[]>(exampleEntries);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [showAddEntry, setShowAddEntry] = useState(false);

  // Save entries to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('stockJournalEntries', JSON.stringify(entries));
  }, [entries]);

  const [newEntry, setNewEntry] = useState<NewEntry>({
    date: new Date().toISOString().split('T')[0],
    symbol: '',
    price: '',
    position: 'watching',
    sentiment: 'bullish',
    category: 'catalyst',
    title: '',
    description: '',
    tags: ''
  });

  const addEntry = () => {
    if (newEntry.symbol && newEntry.title && newEntry.description) {
      const entry = {
        ...newEntry,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      setEntries([entry, ...entries]);
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        symbol: '',
        price: '',
        position: 'watching',
        sentiment: 'bullish',
        category: 'catalyst',
        title: '',
        description: '',
        tags: ''
      });
      setShowAddEntry(false);
    }
  };

  const getStockProjects = (): StockProject[] => {
    const stockGroups: Record<string, StockProject> = entries.reduce((acc, entry) => {
      if (!acc[entry.symbol]) {
        acc[entry.symbol] = {
          symbol: entry.symbol,
          entries: [],
          latestPrice: null,
          latestPosition: 'watching' as const,
          latestDate: null
        };
      }
      acc[entry.symbol].entries.push(entry);
      
      // Update latest info
      if (!acc[entry.symbol].latestDate || entry.date > acc[entry.symbol].latestDate) {
        acc[entry.symbol].latestPrice = entry.price;
        acc[entry.symbol].latestPosition = entry.position;
        acc[entry.symbol].latestDate = entry.date;
      }
      
      return acc;
    }, {} as Record<string, StockProject>);

    return Object.values(stockGroups).sort((a, b) => 
      new Date(b.latestDate || 0).getTime() - new Date(a.latestDate || 0).getTime()
    );
  };

  const getKanbanData = (stockSymbol) => {
    const stockEntries = entries.filter(entry => entry.symbol === stockSymbol);
    
    return {
      bullishCatalysts: stockEntries.filter(e => e.sentiment === 'bullish' && e.category === 'catalyst'),
      bullishBlocks: stockEntries.filter(e => e.sentiment === 'bullish' && e.category === 'block'),
      bearishCatalysts: stockEntries.filter(e => e.sentiment === 'bearish' && e.category === 'catalyst'),
      bearishBlocks: stockEntries.filter(e => e.sentiment === 'bearish' && e.category === 'block')
    };
  };

  const getPositionColor = (position: 'holding' | 'sold' | 'watching') => {
    switch (position) {
      case 'holding': return 'bg-bullish/10 text-bullish border-bullish/20';
      case 'sold': return 'bg-bearish/10 text-bearish border-bearish/20';
      case 'watching': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getCategoryIcon = (category) => {
    return category === 'catalyst' ? 
      <Zap className="w-4 h-4" /> : 
      <AlertTriangle className="w-4 h-4" />;
  };

  const getCategoryColor = (sentiment: 'bullish' | 'bearish', category: 'catalyst' | 'block') => {
    if (sentiment === 'bullish') {
      return category === 'catalyst' ? 
        'bg-bullish/10 border-bullish/20' : 
        'bg-warning/10 border-warning/20';
    } else {
      return category === 'catalyst' ? 
        'bg-bearish/10 border-bearish/20' : 
        'bg-destructive/10 border-destructive/20';
    }
  };

  const stockProjects = getStockProjects();
  const filteredProjects = stockProjects.filter(project =>
    project.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Target className="w-10 h-10 text-primary" />
            Stock Analysis Board
          </h1>
          <p className="text-muted-foreground">Project-based approach to stock analysis with bullish/bearish catalysts and blocks</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-card rounded-lg p-1 shadow-financial border border-border">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setSelectedStock(null);
              }}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Stock Projects
            </button>
            {selectedStock && (
              <button
                onClick={() => setActiveTab('kanban')}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeTab === 'kanban' 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {selectedStock} Board
              </button>
            )}
          </div>
        </div>

        {/* Stock Projects Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Search and Add */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search stock projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
                />
              </div>
              
              <button
                onClick={() => setShowAddEntry(true)}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Analysis
              </button>
            </div>

            {/* Stock Projects Table */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
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
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">Total Notes</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Last Updated</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProjects.map(project => {
                    const totalNotes = project.entries.length;
                    const catalystsCount = project.entries.filter(e => e.category === 'catalyst').length;
                    const blockersCount = project.entries.filter(e => e.category === 'block').length;

                    return (
                      <tr key={project.symbol} className="hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedStock(project.symbol);
                            setActiveTab('kanban');
                          }}>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-foreground">{project.symbol}</span>
                        </td>
                        <td className="px-6 py-4">
                          {project.latestPrice ? (
                            <span className="text-bullish font-semibold">${project.latestPrice}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPositionColor(project.latestPosition)}`}>
                            {project.latestPosition}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full font-bold">
                            {catalystsCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 bg-warning/10 text-warning rounded-full font-bold">
                            {blockersCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-muted-foreground font-medium">{totalNotes}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">{project.latestDate}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center text-primary text-sm font-medium hover:text-primary/80">
                            <span>View Board</span>
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No stock projects yet. Start your first analysis!</p>
                <button
                  onClick={() => setShowAddEntry(true)}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create First Analysis
                </button>
              </div>
              )}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No stock projects yet. Start your first analysis!</p>
                <button
                  onClick={() => setShowAddEntry(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {/* Kanban Board */}
        {activeTab === 'kanban' && selectedStock && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedStock} Analysis Board</h2>
                <p className="text-muted-foreground">Catalysts and blocks organized by sentiment</p>
              </div>
              <button
                onClick={() => {
                  setNewEntry({...newEntry, symbol: selectedStock});
                  setShowAddEntry(true);
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>

            {/* Simplified Kanban Board - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Catalysts Column */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-100">
                <div className="p-4 border-b border-gray-100 bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Catalysts</h3>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
                      {entries.filter(e => e.symbol === selectedStock && e.category === 'catalyst').length}
                    </span>
                  </div>
                  <p className="text-sm text-primary/70 mt-1">Factors that could move the stock</p>
                </div>
                <div className="p-4 space-y-4 min-h-[500px]">
                  {entries
                    .filter(e => e.symbol === selectedStock && e.category === 'catalyst')
                     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(entry => (
                    <div key={entry.id} className={`p-4 rounded-lg border-l-4 ${
                      entry.sentiment === 'bullish' 
                        ? 'bg-bullish/5 border-l-bullish border border-bullish/20' 
                        : 'bg-bearish/5 border-l-bearish border border-bearish/20'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{entry.title}</h4>
                        <div className="flex items-center gap-1">
                          {entry.sentiment === 'bullish' ? 
                            <TrendingUp className="w-4 h-4 text-bullish" /> : 
                            <TrendingDown className="w-4 h-4 text-bearish" />
                          }
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{entry.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>{entry.date}</span>
                        {entry.price && <span className="font-medium">${entry.price}</span>}
                      </div>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.slice(0, 4).map((tag, index) => (
                            <span key={index} className={`px-2 py-0.5 rounded-full text-xs ${
                              entry.sentiment === 'bullish' 
                                ? 'bg-bullish/10 text-bullish' 
                                : 'bg-bearish/10 text-bearish'
                            }`}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {entries.filter(e => e.symbol === selectedStock && e.category === 'catalyst').length === 0 && (
                    <div className="p-8 border-2 border-dashed border-blue-200 rounded-lg text-center">
                      <Zap className="w-12 h-12 text-blue-300 mx-auto mb-2" />
                      <p className="text-blue-600 text-sm">No catalysts identified yet</p>
                      <p className="text-blue-500 text-xs mt-1">Add factors that could drive stock movement</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Blockers Column */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-100">
                <div className="p-4 border-b border-gray-100 bg-orange-50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-800">Blockers</h3>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm font-medium">
                      {entries.filter(e => e.symbol === selectedStock && e.category === 'block').length}
                    </span>
                  </div>
                  <p className="text-sm text-orange-600 mt-1">Obstacles preventing movement</p>
                </div>
                <div className="p-4 space-y-4 min-h-[500px]">
                  {entries
                    .filter(e => e.symbol === selectedStock && e.category === 'block')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(entry => (
                    <div key={entry.id} className={`p-4 rounded-lg border-l-4 ${
                      entry.sentiment === 'bullish' 
                        ? 'bg-green-50 border-l-green-400 border border-green-200' 
                        : 'bg-red-50 border-l-red-400 border border-red-200'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{entry.title}</h4>
                        <div className="flex items-center gap-1">
                          {entry.sentiment === 'bullish' ? 
                            <TrendingUp className="w-4 h-4 text-green-600" /> : 
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          }
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{entry.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{entry.date}</span>
                        {entry.price && <span className="font-medium">${entry.price}</span>}
                      </div>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.slice(0, 4).map((tag, index) => (
                            <span key={index} className={`px-2 py-0.5 rounded-full text-xs ${
                              entry.sentiment === 'bullish' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {entries.filter(e => e.symbol === selectedStock && e.category === 'block').length === 0 && (
                    <div className="p-8 border-2 border-dashed border-orange-200 rounded-lg text-center">
                      <AlertTriangle className="w-12 h-12 text-orange-300 mx-auto mb-2" />
                      <p className="text-orange-600 text-sm">No blockers identified yet</p>
                      <p className="text-orange-500 text-xs mt-1">Add obstacles that prevent stock movement</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Entry Modal */}
        {showAddEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto border border-border shadow-financial">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">New Analysis Note</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Stock Symbol*</label>
                    <input
                      type="text"
                      value={newEntry.symbol}
                      onChange={(e) => setNewEntry({...newEntry, symbol: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
                      placeholder="e.g., AAPL"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newEntry.price}
                      onChange={(e) => setNewEntry({...newEntry, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <select
                      value={newEntry.position}
                      onChange={(e) => setNewEntry({...newEntry, position: e.target.value as 'holding' | 'sold' | 'watching'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="watching">Watching</option>
                      <option value="holding">Holding</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sentiment*</label>
                    <select
                      value={newEntry.sentiment}
                      onChange={(e) => setNewEntry({...newEntry, sentiment: e.target.value as 'bullish' | 'bearish'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="bullish">Bullish</option>
                      <option value="bearish">Bearish</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                  <select
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({...newEntry, category: e.target.value as 'catalyst' | 'block'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="catalyst">Catalyst (Driver)</option>
                    <option value="block">Block (Obstacle)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                  <input
                    type="text"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief title for this analysis point"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Analysis*</label>
                  <textarea
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Detailed analysis of this catalyst or block..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    type="text"
                    value={newEntry.tags}
                    onChange={(e) => setNewEntry({...newEntry, tags: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="earnings, tech, regulation (comma-separated)"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setShowAddEntry(false)}
                  className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addEntry}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Add Analysis
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