import React, { useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { formatNaira } from '../../utils/calculations';
import { InventoryItem } from '../../types';
import { Boxes, Plus, Search, Filter, AlertTriangle, CheckCircle2, XCircle, Trash2, Edit2 } from 'lucide-react';

export const FarmInventoryView: React.FC = () => {
  const { inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useFarmProject();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Fertilizer & Chemicals');
  const [qty, setQty] = useState(10);
  const [unit, setUnit] = useState('bags (50kg)');
  const [unitCost, setUnitCost] = useState(35000);
  const [reorderPoint, setReorderPoint] = useState(5);
  const stockStatus = (quantity: number, minimum: number): InventoryItem['status'] => quantity <= 0 ? 'Out of Stock' : quantity <= minimum ? 'Low Stock' : 'In Stock';

  const categories = [
    'All',
    'Seeds & Seedlings',
    'Fertilizer & Chemicals',
    'Feed & Nutrition',
    'Tools & Equipment',
    'Harvested Produce',
    'Packaging & Fuel'
  ];

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalItemsCount = inventoryItems.length;
  const lowStockCount = inventoryItems.filter(i => stockStatus(i.quantity, i.reorderPoint) === 'Low Stock').length;
  const outOfStockCount = inventoryItems.filter(i => stockStatus(i.quantity, i.reorderPoint) === 'Out of Stock').length;
  const totalInventoryValue = inventoryItems.reduce((acc, i) => acc + (i.quantity * i.unitCost), 0);

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingItem) {
      updateInventoryItem(editingItem.id, {
        name,
        category,
        quantity: qty,
        unit,
        unitCost,
        status: stockStatus(qty, reorderPoint),
        reorderPoint
      });
      setEditingItem(null);
    } else {
      addInventoryItem({
        name,
        category,
        quantity: qty,
        unit,
        unitCost,
        status: stockStatus(qty, reorderPoint),
        reorderPoint
      });
      setIsAddModalOpen(false);
    }

    // Reset
    setName('');
    setQty(10);
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setQty(item.quantity);
    setUnit(item.unit);
    setUnitCost(item.unitCost);
    setReorderPoint(item.reorderPoint);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Farm Inventory Management
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Monitor agricultural inputs, seed stocks, chemicals, and equipment supplies on site.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setName('');
            setQty(10);
            setUnit('bags (50kg)');
            setUnitCost(35000);
            setReorderPoint(5);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Total Tracked Items</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1">{totalItemsCount}</p>
          <p className="text-[11px] text-neutral-500 mt-1">Across 6 operational categories</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Low Stock Alert</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-neutral-900'}`}>
            {lowStockCount}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Below minimum threshold</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Out of Stock</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${outOfStockCount > 0 ? 'text-red-600' : 'text-neutral-900'}`}>
            {outOfStockCount}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">Requires immediate purchase</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs font-medium text-neutral-500">Total Inventory Value</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{formatNaira(totalInventoryValue)}</p>
          <p className="text-[11px] text-neutral-500 mt-1">Based on purchase costs</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search items by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Quantity on Hand</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-semibold text-neutral-900">{item.name}</td>
                  <td className="py-3.5 px-4 font-sans text-neutral-500">{item.category}</td>
                  <td className="py-3.5 px-4 font-bold text-neutral-900">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className={`inline-block rounded-md border px-2 py-1 text-[11px] font-semibold ${
                      stockStatus(item.quantity, item.reorderPoint) === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      stockStatus(item.quantity, item.reorderPoint) === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>{stockStatus(item.quantity, item.reorderPoint)}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-neutral-600">{formatNaira(item.unitCost)}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-neutral-900">
                    {formatNaira(item.quantity * item.unitCost)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-sans">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteInventoryItem(item.id)}
                        className="p-1 rounded text-neutral-500 hover:text-red-600 hover:bg-neutral-100"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="text-base font-bold text-neutral-900">
                {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h4>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. NPK 15:15:15 Fertilizer"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. bags (50kg)"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                  />
                </div>
              </div>

              <p className="rounded-lg bg-neutral-50 p-3 text-neutral-600">Stock status is calculated from quantity on hand and reorder point.</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Unit Cost (₦)</label>
                  <input
                    type="number"
                    value={unitCost}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
