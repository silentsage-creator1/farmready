import React, { useMemo, useState } from 'react';
import { useFarmProject } from '../../context/FarmProjectContext';
import { formatNaira } from '../../utils/calculations';
import { InventoryItem, InventoryMovement } from '../../types';
import { AlertTriangle, Boxes, CalendarClock, ChevronDown, ClipboardList, Edit2, History, MapPin, Plus, Search, Trash2, Truck } from 'lucide-react';

type MovementType = InventoryMovement['type'];
const categories: InventoryItem['category'][] = ['Seeds & Seedlings', 'Fertilizer & Chemicals', 'Feed & Nutrition', 'Tools & Equipment', 'Harvested Produce', 'Packaging & Fuel'];
const movementTypes: MovementType[] = ['Purchase', 'Usage', 'Sale', 'Loss', 'Adjustment'];
const today = () => new Date().toISOString().slice(0, 10);

const statusFor = (quantity: number, reorderPoint: number): InventoryItem['status'] => quantity <= 0 ? 'Out of Stock' : quantity <= reorderPoint ? 'Low Stock' : 'In Stock';
const statusStyle = (status: InventoryItem['status']) => status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200';
const inputClass = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20';

export const FarmInventoryView: React.FC = () => {
  const { inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem, recordInventoryMovement } = useFarmProject();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('Purchase');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementDate, setMovementDate] = useState(today());
  const [movementSupplier, setMovementSupplier] = useState('');
  const [movementUnitCost, setMovementUnitCost] = useState('');
  const [movementReference, setMovementReference] = useState('');
  const [movementNote, setMovementNote] = useState('');
  const [formError, setFormError] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Fertilizer & Chemicals');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [targetStock, setTargetStock] = useState('');
  const [status, setStatus] = useState<InventoryItem['status']>('In Stock');
  const [supplier, setSupplier] = useState('');
  const [lastPurchaseDate, setLastPurchaseDate] = useState('');
  const [purchaseReference, setPurchaseReference] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [storageLocation, setStorageLocation] = useState('');

  const filteredItems = useMemo(() => inventoryItems.filter(item => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.name, item.supplier, item.storageLocation, item.batchNumber].some(value => value?.toLowerCase().includes(query));
    return matchesSearch && (categoryFilter === 'All' || item.category === categoryFilter);
  }), [inventoryItems, search, categoryFilter]);

  const lowStockCount = inventoryItems.filter(item => statusFor(item.quantity, item.reorderPoint) === 'Low Stock').length;
  const outOfStockCount = inventoryItems.filter(item => statusFor(item.quantity, item.reorderPoint) === 'Out of Stock').length;
  const totalInventoryValue = inventoryItems.reduce((total, item) => total + item.quantity * item.unitCost, 0);
  const belowTargetCount = inventoryItems.filter(item => item.targetStock != null && item.quantity < item.targetStock).length;
  const expiryAlerts = inventoryItems.filter(item => {
    if (!item.expiryDate) return false;
    const days = (new Date(`${item.expiryDate}T00:00:00`).getTime() - new Date(`${today()}T00:00:00`).getTime()) / 86400000;
    return days <= 30;
  });

  const resetItemForm = () => {
    setName(''); setCategory('Fertilizer & Chemicals'); setQty(''); setUnit(''); setUnitCost('');
    setReorderPoint(''); setTargetStock(''); setStatus('In Stock'); setSupplier(''); setLastPurchaseDate('');
    setPurchaseReference(''); setExpiryDate(''); setBatchNumber(''); setStorageLocation(''); setFormError('');
  };

  const openNewItem = () => { setEditingItem(null); resetItemForm(); setShowItemForm(true); };
  const startEdit = (item: InventoryItem) => {
    setEditingItem(item); setName(item.name); setCategory(item.category); setQty(String(item.quantity)); setUnit(item.unit);
    setUnitCost(String(item.unitCost)); setReorderPoint(String(item.reorderPoint)); setTargetStock(String(item.targetStock ?? ''));
    setStatus(item.status); setSupplier(item.supplier ?? ''); setLastPurchaseDate(item.lastPurchaseDate ?? '');
    setPurchaseReference(item.purchaseReference ?? ''); setExpiryDate(item.expiryDate ?? ''); setBatchNumber(item.batchNumber ?? '');
    setStorageLocation(item.storageLocation ?? ''); setFormError(''); setShowItemForm(true);
  };

  const handleSaveItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !unit.trim()) { setFormError('Enter an item name and stock unit.'); return; }
    const quantity = Math.max(0, Number(qty) || 0);
    const minimum = Math.max(0, Number(reorderPoint) || 0);
    const itemData = {
      name: name.trim(), category, quantity, unit: unit.trim(), unitCost: Math.max(0, Number(unitCost) || 0),
      status: editingItem ? status : statusFor(quantity, minimum), reorderPoint: minimum,
      targetStock: targetStock === '' ? undefined : Math.max(minimum, Number(targetStock) || 0),
      supplier: supplier.trim() || undefined, lastPurchaseDate: lastPurchaseDate || undefined,
      purchaseReference: purchaseReference.trim() || undefined, expiryDate: expiryDate || undefined,
      batchNumber: batchNumber.trim() || undefined, storageLocation: storageLocation.trim() || undefined,
    };
    if (editingItem) updateInventoryItem(editingItem.id, itemData);
    else addInventoryItem({ ...itemData, movements: [] });
    setShowItemForm(false); setEditingItem(null); resetItemForm();
  };

  const openMovement = (item: InventoryItem, type: MovementType = 'Purchase') => {
    setMovementItem(item); setMovementType(type); setMovementQuantity(''); setMovementDate(today());
    setMovementSupplier(item.supplier ?? ''); setMovementUnitCost(type === 'Purchase' ? String(item.unitCost || '') : '');
    setMovementReference(''); setMovementNote(''); setFormError('');
  };

  const handleSaveMovement = (event: React.FormEvent) => {
    event.preventDefault();
    if (!movementItem || movementQuantity === '' || !movementDate) { setFormError('Enter a quantity and date for this stock movement.'); return; }
    const quantity = Math.max(0, Number(movementQuantity) || 0);
    if (movementType !== 'Purchase' && movementType !== 'Adjustment' && quantity > movementItem.quantity) {
      setFormError(`Only ${movementItem.quantity} ${movementItem.unit} is currently on hand.`); return;
    }
    recordInventoryMovement(movementItem.id, {
      type: movementType, quantity, date: movementDate, note: movementNote.trim() || undefined,
      supplier: movementType === 'Purchase' ? movementSupplier.trim() || undefined : undefined,
      unitCost: movementType === 'Purchase' && movementUnitCost !== '' ? Math.max(0, Number(movementUnitCost) || 0) : undefined,
      reference: movementReference.trim() || undefined,
    });
    setMovementItem(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h2 className="text-2xl font-bold tracking-tight text-neutral-900">Farm Inventory Management</h2><p className="mt-1 text-sm text-neutral-500">Track stock, purchases, use, storage, expiry dates, and restocking needs.</p></div>
        <button onClick={openNewItem} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" />Add Stock Item</button>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Tracked items" value={inventoryItems.length} detail="Across your farm inventory" icon={<Boxes className="h-4 w-4" />} />
        <SummaryCard label="Low or out of stock" value={lowStockCount + outOfStockCount} detail={`${outOfStockCount} out of stock · ${lowStockCount} low`} icon={<AlertTriangle className="h-4 w-4" />} warning={lowStockCount + outOfStockCount > 0} />
        <SummaryCard label="Inventory value" value={formatNaira(totalInventoryValue)} detail="Current quantity × average unit cost" icon={<ClipboardList className="h-4 w-4" />} />
        <SummaryCard label="Items below target" value={belowTargetCount} detail="Items below their preferred stock level" icon={<Truck className="h-4 w-4" />} />
      </section>

      {(lowStockCount + outOfStockCount > 0 || expiryAlerts.length > 0) && <section aria-label="Inventory alerts" className="grid gap-3 md:grid-cols-2">
        {inventoryItems.filter(item => statusFor(item.quantity, item.reorderPoint) !== 'In Stock').map(item => <div key={`stock-${item.id}`} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${item.quantity <= 0 ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>{item.name}</strong> is {item.quantity <= 0 ? 'out of stock' : `low (${item.quantity} ${item.unit}; reorder at ${item.reorderPoint})`}. {item.targetStock ? `Target stock: ${item.targetStock} ${item.unit}.` : ''}</p></div>)}
        {expiryAlerts.map(item => { const expired = item.expiryDate! < today(); return <div key={`expiry-${item.id}`} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${expired ? 'border-red-200 bg-red-50 text-red-800' : 'border-orange-200 bg-orange-50 text-orange-900'}`}><CalendarClock className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>{item.name}</strong> {expired ? 'expired' : 'expires soon'} on {item.expiryDate}.</p></div>; })}
      </section>}

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" /><input type="search" placeholder="Search item, supplier, batch, or location" value={search} onChange={event => setSearch(event.target.value)} className={`${inputClass} pl-9`} /></div>
          <div className="flex gap-2 overflow-x-auto pb-1">{['All', ...categories].map(option => <button key={option} onClick={() => setCategoryFilter(option)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${categoryFilter === option ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>{option}</button>)}</div>
        </div>

        {filteredItems.length === 0 ? <div className="rounded-xl border border-dashed border-neutral-300 px-5 py-12 text-center"><Boxes className="mx-auto h-8 w-8 text-neutral-300" /><h3 className="mt-3 font-semibold text-neutral-800">{inventoryItems.length ? 'No matching stock items' : 'Your inventory is empty'}</h3><p className="mt-1 text-sm text-neutral-500">{inventoryItems.length ? 'Change the search or category filter.' : 'Add your first item to start tracking stock and movements.'}</p>{!inventoryItems.length && <button onClick={openNewItem} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Add Stock Item</button>}</div> : <div className="space-y-3">
          {filteredItems.map(item => {
            const computedStatus = statusFor(item.quantity, item.reorderPoint);
            const movements = item.movements ?? [];
            const daysToExpiry = item.expiryDate ? (new Date(`${item.expiryDate}T00:00:00`).getTime() - new Date(`${today()}T00:00:00`).getTime()) / 86400000 : Infinity;
            return <article key={item.id} className="rounded-xl border border-neutral-200 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-neutral-900">{item.name}</h3><span className="rounded-md border px-2 py-0.5 text-[11px] font-semibold text-neutral-600">{item.category}</span><span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusStyle(item.status)}`}>{item.status}</span>{computedStatus !== item.status && <span className="text-[11px] text-amber-700">Calculated: {computedStatus}</span>}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500"><span className="font-mono text-sm font-bold text-neutral-900">{item.quantity.toLocaleString()} {item.unit}</span><span>Min {item.reorderPoint} · Target {item.targetStock ?? 'not set'}</span><span>{formatNaira(item.unitCost)} / {item.unit}</span>{item.supplier && <span>Supplier: {item.supplier}</span>}{item.storageLocation && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{item.storageLocation}</span>}{item.expiryDate && <span className={daysToExpiry < 0 ? 'font-semibold text-red-700' : daysToExpiry <= 30 ? 'font-semibold text-amber-700' : ''}>Expiry: {item.expiryDate}</span>}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2"><button onClick={() => openMovement(item, 'Purchase')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Record purchase</button><button onClick={() => openMovement(item, 'Usage')} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Record usage</button><button onClick={() => openMovement(item, 'Adjustment')} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Adjust count</button><button onClick={() => startEdit(item)} aria-label={`Edit ${item.name}`} title="Edit item" className="rounded-lg border border-neutral-300 p-2 text-neutral-600 hover:bg-neutral-50"><Edit2 className="h-4 w-4" /></button><button onClick={() => { if (window.confirm(`Delete ${item.name} and its movement history?`)) deleteInventoryItem(item.id); }} aria-label={`Delete ${item.name}`} title="Delete item" className="rounded-lg border border-neutral-300 p-2 text-neutral-600 hover:border-red-200 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></div>
              </div>
              <details className="mt-3 border-t border-neutral-100 pt-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-neutral-600"><span className="inline-flex items-center gap-2"><History className="h-3.5 w-3.5" />Stock history and item details ({movements.length} movements)</span><ChevronDown className="h-4 w-4" /></summary>
                <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1.3fr]"><div className="grid grid-cols-2 gap-2 text-xs text-neutral-600"><Info label="Storage" value={item.storageLocation} /><Info label="Batch / lot" value={item.batchNumber} /><Info label="Last purchased" value={item.lastPurchaseDate} /><Info label="Purchase reference" value={item.purchaseReference} /><Info label="Supplier" value={item.supplier} /><Info label="Expiry" value={item.expiryDate} /></div>
                  <div className="space-y-2">{movements.length === 0 ? <p className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500">No stock movements recorded yet. Record a purchase, usage, sale, loss, or count adjustment.</p> : movements.slice(0, 8).map(movement => <div key={movement.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs"><span className="font-semibold text-neutral-800">{movement.type} · {movement.date}</span><span className="font-mono text-neutral-700">{movement.type === 'Adjustment' ? 'Set to ' : movement.type === 'Purchase' ? '+' : '−'}{movement.quantity} {item.unit}</span>{movement.supplier && <span className="text-neutral-500">{movement.supplier}</span>}{movement.unitCost != null && <span className="text-neutral-500">{formatNaira(movement.unitCost)}/unit</span>}{movement.reference && <span className="text-neutral-500">Ref: {movement.reference}</span>}{movement.note && <span className="basis-full text-neutral-500">{movement.note}</span>}</div>)}</div>
                </div>
              </details>
            </article>;
          })}
        </div>}
      </section>

      {showItemForm && <Modal title={editingItem ? 'Edit stock item' : 'Add stock item'} onClose={() => { setShowItemForm(false); setEditingItem(null); }}>
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Item name" value={name} onChange={setName} placeholder="e.g. Maize seed" /><label className="space-y-1 text-xs font-semibold text-neutral-700">Category<select value={category} onChange={event => setCategory(event.target.value as InventoryItem['category'])} className={inputClass}>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
            <NumberField label="Quantity on hand" value={qty} onChange={setQty} /><Field label="Stock unit" value={unit} onChange={setUnit} placeholder="bags, kg, litres, units" /><NumberField label="Current unit cost (₦)" value={unitCost} onChange={setUnitCost} /><NumberField label="Minimum / reorder level" value={reorderPoint} onChange={setReorderPoint} /><NumberField label="Target stock level (optional)" value={targetStock} onChange={setTargetStock} /><Field label="Supplier (optional)" value={supplier} onChange={setSupplier} /><label className="space-y-1 text-xs font-semibold text-neutral-700">Last purchase date<input type="date" value={lastPurchaseDate} onChange={event => setLastPurchaseDate(event.target.value)} className={inputClass} /></label><Field label="Purchase reference (optional)" value={purchaseReference} onChange={setPurchaseReference} placeholder="Invoice or receipt number" /><label className="space-y-1 text-xs font-semibold text-neutral-700">Expiry / best-before date<input type="date" value={expiryDate} onChange={event => setExpiryDate(event.target.value)} className={inputClass} /></label><Field label="Batch / lot number" value={batchNumber} onChange={setBatchNumber} placeholder="Optional traceability code" /><Field label="Storage location" value={storageLocation} onChange={setStorageLocation} placeholder="e.g. Feed store" />
            {editingItem && <label className="space-y-1 text-xs font-semibold text-neutral-700">Stock status<select value={status} onChange={event => setStatus(event.target.value as InventoryItem['status'])} className={inputClass}><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option></select><span className="block font-normal text-neutral-500">Editable status; stock movements also recalculate it automatically.</span></label>}
          </div>
          {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          <div className="flex justify-end gap-2 border-t pt-3"><button type="button" onClick={() => setShowItemForm(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100">Cancel</button><button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Save item</button></div>
        </form>
      </Modal>}

      {movementItem && <Modal title={`Record ${movementType.toLowerCase()} · ${movementItem.name}`} onClose={() => setMovementItem(null)}>
        <form onSubmit={handleSaveMovement} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs font-semibold text-neutral-700">Movement type<select value={movementType} onChange={event => setMovementType(event.target.value as MovementType)} className={inputClass}>{movementTypes.map(type => <option key={type}>{type}</option>)}</select><span className="block font-normal text-neutral-500">Adjustment sets the new on-hand count.</span></label><NumberField label={movementType === 'Adjustment' ? `Counted quantity (${movementItem.unit})` : `Quantity (${movementItem.unit})`} value={movementQuantity} onChange={setMovementQuantity} /><label className="space-y-1 text-xs font-semibold text-neutral-700">Date<input type="date" value={movementDate} onChange={event => setMovementDate(event.target.value)} className={inputClass} /></label>
            {movementType === 'Purchase' && <><Field label="Supplier" value={movementSupplier} onChange={setMovementSupplier} placeholder="Supplier name" /><NumberField label="Purchase unit price (₦)" value={movementUnitCost} onChange={setMovementUnitCost} /><Field label="Receipt / reference" value={movementReference} onChange={setMovementReference} placeholder="Optional invoice number" /></>}
            <label className="space-y-1 text-xs font-semibold text-neutral-700 sm:col-span-2">Note (optional)<textarea value={movementNote} onChange={event => setMovementNote(event.target.value)} rows={2} placeholder="Reason or additional details" className={inputClass} /></label>
          </div>
          {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          <div className="flex justify-end gap-2 border-t pt-3"><button type="button" onClick={() => setMovementItem(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100">Cancel</button><button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Save movement</button></div>
        </form>
      </Modal>}
    </div>
  );
};

function SummaryCard({ label, value, detail, icon, warning = false }: { label: string; value: string | number; detail: string; icon: React.ReactNode; warning?: boolean }) {
  return <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs"><div className="flex items-center justify-between text-neutral-500"><p className="text-xs font-medium">{label}</p><span className={warning ? 'text-amber-600' : 'text-emerald-700'}>{icon}</span></div><p className={`mt-2 truncate text-xl font-bold ${warning ? 'text-amber-700' : 'text-neutral-900'}`}>{value}</p><p className="mt-1 text-[11px] text-neutral-500">{detail}</p></div>;
}

function Info({ label, value }: { label: string; value?: string }) {
  return <p><span className="block text-[10px] uppercase tracking-wide text-neutral-400">{label}</span><span className="mt-0.5 block font-medium text-neutral-700">{value || 'Not recorded'}</span></p>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="space-y-1 text-xs font-semibold text-neutral-700">{label}<input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className={inputClass} /></label>;
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="space-y-1 text-xs font-semibold text-neutral-700">{label}<input type="number" min="0" step="any" value={value} onChange={event => onChange(event.target.value)} placeholder="Enter value" className={`${inputClass} font-mono`} /></label>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"><header className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3"><h3 className="text-base font-bold text-neutral-900">{title}</h3><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg px-2 py-1 text-neutral-500 hover:bg-neutral-100">✕</button></header>{children}</section></div>;
}
