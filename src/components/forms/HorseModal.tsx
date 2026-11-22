import React, { useState, useEffect } from 'react';
import { Horse, CoatColor, CoatPattern } from '../../engine/types';
import {
  heartsToHp,
  time100mToBps,
  time100mToSpeedAttr,
  jumpHeightToAttr,
} from '../../engine/conversions';
import { X, HelpCircle, ArrowRight } from 'lucide-react';

interface HorseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Horse, 'id' | 'createdAt'>) => void;
  editingHorse?: Horse | null;
  existingHorses: Horse[];
}

const COAT_COLORS: CoatColor[] = [
  'White',
  'Creamy',
  'Chestnut',
  'Brown',
  'Black',
  'Gray',
  'Dark Brown',
];

const COAT_PATTERNS: CoatPattern[] = [
  'None',
  'White Stockings',
  'Whitefield',
  'White Dots',
  'Black Dots',
];

export const HorseModal: React.FC<HorseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingHorse,
  existingHorses,
}) => {
  const [name, setName] = useState('');
  const [hearts, setHearts] = useState('11.0');
  const [time100m, setTime100m] = useState('9.5');
  const [jumpHeight, setJumpHeight] = useState('3.2');
  const [coatColor, setCoatColor] = useState<CoatColor>('White');
  const [coatPattern, setCoatPattern] = useState<CoatPattern>('None');
  const [sireId, setSireId] = useState<string>('');
  const [damId, setDamId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (editingHorse) {
      setName(editingHorse.name);
      setHearts(editingHorse.hearts.toString());
      setTime100m(editingHorse.time100m.toString());
      setJumpHeight(editingHorse.jumpHeight.toString());
      setCoatColor(editingHorse.coatColor || 'White');
      setCoatPattern(editingHorse.coatPattern || 'None');
      setSireId(editingHorse.sireId || '');
      setDamId(editingHorse.damId || '');
      setNotes(editingHorse.notes || '');
    } else {
      setName('');
      setHearts('11.0');
      setTime100m('9.5');
      setJumpHeight('3.2');
      setCoatColor('White');
      setCoatPattern('None');
      setSireId('');
      setDamId('');
      setNotes('');
    }
  }, [editingHorse, isOpen]);

  if (!isOpen) return null;

  // Real-time calculation previews
  const numHearts = parseFloat(hearts) || 0;
  const numTime = parseFloat(time100m) || 0;
  const numJump = parseFloat(jumpHeight) || 0;

  const hpPreview = heartsToHp(numHearts);
  const bpsPreview = time100mToBps(numTime);
  const speedAttrPreview = time100mToSpeedAttr(numTime);
  const jumpAttrPreview = jumpHeightToAttr(numJump);

  // Compute calculated generation
  const sireObj = existingHorses.find((h) => h.id === sireId);
  const damObj = existingHorses.find((h) => h.id === damId);
  const computedGeneration =
    sireObj || damObj
      ? Math.max(sireObj?.generation || 0, damObj?.generation || 0) + 1
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      hearts: Number(numHearts.toFixed(1)),
      time100m: Number(numTime.toFixed(2)),
      jumpHeight: Number(numJump.toFixed(2)),
      coatColor,
      coatPattern,
      sireId: sireId || null,
      damId: damId || null,
      generation: computedGeneration,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
              {editingHorse ? `Edit Horse: ${editingHorse.name}` : 'Register New Horse'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Enter measurable in-game metrics. The engine handles physical conversions automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Horse Name */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Horse Identifier / Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sleipnir, Lineage Alpha-1"
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition font-sans text-sm"
            />
          </div>

          {/* Three Metric Inputs with Live Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Hearts */}
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Hearts (7.5 - 15.0) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="7.5"
                max="15.0"
                required
                value={hearts}
                onChange={(e) => setHearts(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500 transition font-mono text-sm"
              />
              <span className="block mt-1 font-mono text-[10px] text-zinc-400">
                = {hpPreview} Health Points (HP)
              </span>
            </div>

            {/* 100-Block Time */}
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                100-Block Sprint (s) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.05"
                min="5.0"
                max="25.0"
                required
                value={time100m}
                onChange={(e) => setTime100m(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500 transition font-mono text-sm"
              />
              <span className="block mt-1 font-mono text-[10px] text-zinc-400">
                = {bpsPreview} b/s (~{speedAttrPreview.toFixed(4)})
              </span>
            </div>

            {/* Jump Height */}
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Jump Height (m) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.05"
                min="0.9"
                max="5.3"
                required
                value={jumpHeight}
                onChange={(e) => setJumpHeight(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500 transition font-mono text-sm"
              />
              <span className="block mt-1 font-mono text-[10px] text-zinc-400">
                = Str ~{jumpAttrPreview.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Appearance Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Coat Color</label>
              <select
                value={coatColor}
                onChange={(e) => setCoatColor(e.target.value as CoatColor)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
              >
                {COAT_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Coat Pattern</label>
              <select
                value={coatPattern}
                onChange={(e) => setCoatPattern(e.target.value as CoatPattern)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
              >
                {COAT_PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pedigree Parentage Links */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-200">Lineage Parentage</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                Assigned: Generation {computedGeneration}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">Sire (Father)</label>
                <select
                  value={sireId}
                  onChange={(e) => setSireId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">None (Foundation Wild Stock)</option>
                  {existingHorses
                    .filter((h) => h.id !== editingHorse?.id)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} (Gen {h.generation})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">Dam (Mother)</label>
                <select
                  value={damId}
                  onChange={(e) => setDamId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">None (Foundation Wild Stock)</option>
                  {existingHorses
                    .filter((h) => h.id !== editingHorse?.id && h.id !== sireId)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} (Gen {h.generation})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Lineage notes, stall location, testing track observations..."
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition text-xs"
            />
          </div>

          {/* Collapsible Measurement Help */}
          <div>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>How to measure speed and jump hurdles in survival Minecraft</span>
            </button>
            {showGuide && (
              <div className="mt-2 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1 font-mono">
                <p>&bull; 100m Sprint: Construct a straight flat track of 100 blocks with pressure plates at start and finish. Time the sprint in seconds (natural range: 6.86s to 20.6s).</p>
                <p>&bull; Jump Hurdle: Stack fences or blocks (1 fence = 1.5 blocks, 2 blocks = 2.0 blocks, 2 fences = 3.0 blocks, 3 fences = 4.5 blocks). Test the highest hurdle your horse clears cleanly.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
            >
              <span>{editingHorse ? 'Update Horse' : 'Add to Pedigree'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
