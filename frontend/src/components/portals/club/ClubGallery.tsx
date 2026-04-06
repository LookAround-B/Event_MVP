
import { useState } from "react";
import { Plus, Check, X, Camera, ImageIcon, Trash2, Edit, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalModal } from "@/components/portals/PortalModal";

interface GalleryItem {
  id: number; title: string; description: string;
  imageUrl: string | null; addedAt: string;
}

interface ClubGalleryProps {
  demoGallery: GalleryItem[];
}

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5 font-bold uppercase tracking-widest text-muted-foreground ml-1">
    <label className="text-[10px]">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props}
    className="w-full px-4 py-3 rounded-xl bg-surface-container/50 border border-border/40 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed" />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props}
    className="w-full px-4 py-3 rounded-xl bg-surface-container/50 border border-border/40 text-sm text-on-surface focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all min-h-[100px] resize-none placeholder:opacity-40" />
);

export const ClubGallery = ({ demoGallery }: ClubGalleryProps) => {
  const [items, setItems] = useState<GalleryItem[]>(demoGallery);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: null as string | null });

  const handleSave = () => {
    if (editItem) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...form } : i));
    } else {
      setItems(prev => [...prev, { id: Date.now(), title: form.title, description: form.description, imageUrl: form.imageUrl, addedAt: new Date().toISOString().split("T")[0] }]);
    }
    setShowForm(false);
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-12">
      {/* ── Header Area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface tracking-tight">Visual <span className="gradient-text">Archive</span></h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">{items.length} captures in the unit's media vault.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2.5 px-6 py-3 btn-cta rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Add Asset to Gallery
        </button>
      </div>

      {/* ── Form Modal ────────────────────────────────────────── */}
      <PortalModal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        title="Onboard Media Asset"
      >
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="w-full lg:w-48 flex-shrink-0 text-center">
            <div className="relative inline-block group">
               <div className="w-40 h-40 rounded-[2.5rem] bg-surface-container/60 border-2 border-white/5 overflow-hidden flex items-center justify-center transition-all duration-500 group-hover:rotate-2 group-hover:scale-105 shadow-inner">
                  {form.imageUrl
                    ? <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    : <ImageIcon className="w-12 h-12 text-muted-foreground/20" />}
               </div>
               <label className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-2xl hover:scale-110 active:scale-95 transition-all group-hover:rotate-6">
                  <Camera className="w-6 h-6" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setForm(p => ({ ...p, imageUrl: URL.createObjectURL(file) }));
                  }} />
               </label>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-8 opacity-40">Asset Visualization</p>
          </div>

          <div className="flex-1 space-y-6 w-full">
            <Field label="Asset Designation" required>
              <Input placeholder="e.g. Annual Championship 2025" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </Field>
            <Field label="Operational Context">
              <Textarea placeholder="Describe the media asset context..." value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </Field>
          </div>
        </div>

        <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
          <button onClick={() => setShowForm(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-[11px] font-black uppercase tracking-widest text-on-surface hover:bg-white/10 transition-all border border-white/5">Abort Calibration</button>
          <button onClick={handleSave} className="flex-1 py-4 btn-cta rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
            <Check className="w-5 h-5 font-black" /> Authorize Entry
          </button>
        </div>
      </PortalModal>

      {/* ── Gallery Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {items.map((item, i) => (
          <div key={item.id} className={cn("bento-card overflow-hidden group relative flex flex-col transition-all duration-500 hover:border-primary/30 hover:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.4)]", `animate-slide-up-${(i % 5) + 1}`)}>
            {/* Action Overlay */}
            <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
               <button className="p-2.5 rounded-xl bg-background/60 backdrop-blur-md text-on-surface hover:bg-primary hover:text-white transition-all shadow-xl">
                  <Edit className="w-4 h-4" />
               </button>
               <button onClick={() => setItems(p => p.filter(x => x.id !== item.id))} className="p-2.5 rounded-xl bg-background/60 backdrop-blur-md text-on-surface hover:bg-destructive hover:text-white transition-all shadow-xl">
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>

            {/* Media Canvas */}
            <div className="aspect-[16/10] bg-surface-container relative overflow-hidden flex items-center justify-center">
              {item.imageUrl
                ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                : <div className="flex flex-col items-center gap-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <ImageIcon className="w-16 h-16 group-hover:rotate-6 transition-transform" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Asset Missing</p>
                  </div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="absolute bottom-4 left-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                 <ArrowUpRight className="w-8 h-8 text-white/50" />
              </div>
            </div>

            {/* Descriptor */}
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 mb-2">
                 <h4 className="text-sm font-black text-on-surface truncate group-hover:text-primary transition-colors tracking-tight">{item.title}</h4>
                 <span className="font-mono text-[9px] font-black text-muted-foreground opacity-40 uppercase tracking-widest">{item.addedAt}</span>
              </div>
              {item.description && (
                <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
