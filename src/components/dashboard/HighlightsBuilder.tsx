import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Eye, EyeOff, Camera, X, Image as ImageIcon, Link as LinkIcon, Trash2 } from 'lucide-react';
import ImageCropper from '@/components/ui/ImageCropper';
import api from '@/lib/api';
import { useI18n } from '@/i18n';

interface HighlightsBuilderProps {
  business: any;
  highlights: any[];
  setHighlights: (h: any[]) => void;
  storyArchive: any[];
  activeOffers?: any[];
}

export default function HighlightsBuilder({ business, highlights, setHighlights, storyArchive, activeOffers = [] }: HighlightsBuilderProps) {
  const { t } = useI18n();
  const highlightInputRef = useRef<HTMLInputElement>(null);
  
  const [draggedHighlightIndex, setDraggedHighlightIndex] = useState<number | null>(null);
  const [newHighlightTitle, setNewHighlightTitle] = useState("");
  const [highlightCoverUrl, setHighlightCoverUrl] = useState<string>("");
  const [highlightLink, setHighlightLink] = useState<string>("");
  const [highlightRingColor, setHighlightRingColor] = useState<string>("");
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);
  const [isStoryArchiveModalOpen, setIsStoryArchiveModalOpen] = useState(false);
  const [archiveModalTab, setArchiveModalTab] = useState<"stories" | "offers">("stories");
  const [selectedArchiveStories, setSelectedArchiveStories] = useState<string[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [previewingHighlightGroup, setPreviewingHighlightGroup] = useState<any | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isStoryArchiveModalOpen || previewingHighlightGroup || croppingImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isStoryArchiveModalOpen, previewingHighlightGroup, croppingImage]);

  const handleHighlightCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit");
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setCroppingImage(imageUrl);
      if (e.target) e.target.value = '';
    }
  };

  const updateHighlightsBackend = async (newHighlights: any[]) => {
    if (!business) return;
    try {
      await api.put(`/businesses/${business._id}`, { highlights: newHighlights });
      setSuccess("Highlights updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save highlights.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const addHighlightItem = () => {
    if (!newHighlightTitle.trim()) {
      setError((t.builder as any)?.stories?.enterHighlightTitle || "Please enter a highlight title.");
      return;
    }
    const newHighlights = [...highlights];
    if (editingHighlightId) {
      const idx = newHighlights.findIndex(h => h.id === editingHighlightId);
      if (idx !== -1) {
        newHighlights[idx] = {
          ...newHighlights[idx],
          title: newHighlightTitle,
          imageUrl: highlightCoverUrl,
          stories: selectedArchiveStories,
          offers: selectedOffers,
          link: highlightLink,
          ringColor: highlightRingColor
        };
      }
    } else {
      newHighlights.push({
        id: Date.now().toString(),
        title: newHighlightTitle,
        imageUrl: highlightCoverUrl,
        stories: selectedArchiveStories,
        offers: selectedOffers,
        link: highlightLink,
        ringColor: highlightRingColor,
        isActive: true
      });
    }
    setHighlights(newHighlights);
    setNewHighlightTitle("");
    setHighlightCoverUrl("");
    setHighlightLink("");
    setHighlightRingColor("");
    setSelectedArchiveStories([]);
    setSelectedOffers([]);
    setEditingHighlightId(null);
    updateHighlightsBackend(newHighlights);
  };

  const removeHighlightItem = (id: string) => {
    const newHighlights = highlights.filter(h => h.id !== id);
    setHighlights(newHighlights);
    updateHighlightsBackend(newHighlights);
  };

  const toggleHighlightStatus = (id: string) => {
    const newHighlights = highlights.map(item => item.id === id ? { ...item, isActive: item.isActive === false ? true : false } : item);
    setHighlights(newHighlights);
    updateHighlightsBackend(newHighlights);
  };

  const handleHighlightDragStart = (e: React.DragEvent, index: number) => {
    setDraggedHighlightIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleHighlightDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedHighlightIndex === null || draggedHighlightIndex === index) return;
    const newHighlights = [...highlights];
    const draggedItem = newHighlights[draggedHighlightIndex];
    newHighlights.splice(draggedHighlightIndex, 1);
    newHighlights.splice(index, 0, draggedItem);
    setDraggedHighlightIndex(index);
    setHighlights(newHighlights);
  };

  const handleHighlightDragEnd = () => {
    setDraggedHighlightIndex(null);
    updateHighlightsBackend(highlights); // Save new order
  };

  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl p-5 shadow-sm space-y-4 h-fit border-0">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-1 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-amber-500" />
            {(t.builder as any)?.stories?.highlightsTitle || "Circular Highlights"}
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {(t.builder as any)?.stories?.highlightsSubtitle || "Create story collection tags from your archive and publish them on your profile."}
          </p>
        </div>
        {editingHighlightId && (
          <button
            type="button"
            onClick={() => {
              setEditingHighlightId(null);
              setNewHighlightTitle("");
              setSelectedArchiveStories([]);
              setSelectedOffers([]);
              setHighlightCoverUrl("");
              setHighlightLink("");
              setHighlightRingColor("");
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 text-green-500 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
          <span>{success}</span>
        </div>
      )}

      {/* Builder Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col items-center shrink-0">
            <input
              ref={highlightInputRef}
              type="file"
              accept="image/*"
              onChange={handleHighlightCoverUpload}
              className="hidden"
            />
            <div
              onClick={() => highlightInputRef.current?.click()}
              className="group relative h-20 w-20 rounded-full border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-[hsl(var(--primary))]/50 transition-colors"
            >
              {highlightCoverUrl ? (
                <img src={highlightCoverUrl} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-[hsl(var(--muted-foreground))] group-hover:scale-110 transition-transform" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[9px] text-white font-semibold text-center leading-tight">Change<br/>Cover</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2">
            <input
              type="text"
              placeholder={(t.builder as any)?.stories?.highlightTitlePlaceholder || "e.g., Summer Menu, Interior..."}
              value={newHighlightTitle}
              onChange={(e) => setNewHighlightTitle(e.target.value)}
              className="w-full rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]"
            />
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsStoryArchiveModalOpen(true)}
                className="flex-1 px-3 py-2 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {selectedArchiveStories.length > 0 || selectedOffers.length > 0
                  ? `${selectedArchiveStories.length + selectedOffers.length} ${(t.builder as any)?.stories?.itemsSelected || "items selected"}`
                  : (t.builder as any)?.stories?.selectContent || "Select Content"}
              </button>
            </div>
          </div>
        </div>


        <button
          type="button"
          onClick={addHighlightItem}
          className="w-full py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {editingHighlightId 
            ? ((t.builder as any)?.stories?.updateHighlight || "Update Highlight") 
            : ((t.builder as any)?.stories?.publishHighlight || "Publish Highlight")}
        </button>
      </div>

      {/* Published Highlights List */}
      <div className="pt-2">
        <h4 className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
          {(t.builder as any)?.stories?.publishedHighlights || "Published Highlights"}
        </h4>
        {highlights.length === 0 ? (
          <div className="py-8 text-center text-xs text-[hsl(var(--muted-foreground))] border border-dashed border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--muted))]/10">
            No highlights created yet. Create one above!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {highlights.map((h: any, index: number) => (
              <div
                key={h.id || h._id || `highlight-${index}`}
                draggable
                onDragStart={(e) => handleHighlightDragStart(e, index)}
                onDragOver={(e) => handleHighlightDragOver(e, index)}
                onDragEnd={handleHighlightDragEnd}
                className={`group relative p-3.5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50 transition-all flex flex-col items-center shadow-sm cursor-grab active:cursor-grabbing ${h.isActive === false ? 'opacity-50 grayscale' : ''}`}
              >
                <div 
                  className="h-14 w-14 rounded-full p-[2px] border-2 border-[hsl(var(--border))] group-hover:border-[hsl(var(--primary))] transition-all overflow-hidden mb-2"
                  style={{ borderColor: h.ringColor || undefined }}
                >
                  <div className="h-full w-full rounded-full overflow-hidden bg-[hsl(var(--muted))] flex items-center justify-center">
                    {h.imageUrl ? (
                      <img src={h.imageUrl} alt={h.title} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg">✨</span>
                    )}
                  </div>
                </div>

                <span className="text-xs font-bold text-[hsl(var(--foreground))] truncate w-full text-center mb-0.5">{h.title}</span>
                <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                  {((h.stories?.length || 0) + (h.offers?.length || 0)) > 0 
                    ? `${(h.stories?.length || 0) + (h.offers?.length || 0)} ${(t.builder as any)?.stories?.itemsSelected ? (t.builder as any)?.stories?.itemsSelected.replace('selected', '').trim() : "items"}`
                    : "Highlight"}
                  {h.link && <LinkIcon className="h-2.5 w-2.5" />}
                </span>

                <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-[hsl(var(--border))]/50 w-full justify-center flex-wrap">
                  <button
                    type="button"
                    title={h.isActive === false ? "Show Highlight" : "Hide Highlight"}
                    onClick={() => toggleHighlightStatus(h.id)}
                    className={`p-1.5 rounded-lg transition-colors ${h.isActive === false ? 'text-[hsl(var(--muted-foreground))] hover:text-green-500 hover:bg-green-500/10' : 'text-[hsl(var(--primary))] hover:text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                  >
                    {h.isActive === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    title="Edit Highlight"
                    onClick={() => {
                      setEditingHighlightId(h.id);
                      setNewHighlightTitle(h.title);
                      setHighlightCoverUrl(h.imageUrl || "");
                      setSelectedArchiveStories(h.stories || []);
                      setSelectedOffers(h.offers || []);
                      setHighlightLink(h.link || "");
                      setHighlightRingColor(h.ringColor || "");
                    }}
                    className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Delete Highlight"
                    onClick={() => removeHighlightItem(h.id)}
                    className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {croppingImage && (
        <ImageCropper
          image={croppingImage}
          circularCrop={true}
          aspect={1}
          onCancel={() => setCroppingImage(null)}
          onCropDone={(croppedUrl) => {
            setHighlightCoverUrl(croppedUrl);
            setCroppingImage(null);
          }}
        />
      )}

      <AnimatePresence>
        {isStoryArchiveModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
              className="bg-[hsl(var(--card))] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-[hsl(var(--border))]"
            >
            <div className="p-4 sm:p-5 border-b border-[hsl(var(--border))]/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-[hsl(var(--foreground))]">{(t.builder as any)?.stories?.archiveModalTitle || "Select from Archive"}</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{(t.builder as any)?.stories?.archiveModalSubtitle || "Pick the stories you want to include in this highlight"}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsStoryArchiveModalOpen(false)}
                className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              {storyArchive.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-3">
                      <ImageIcon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">Your archive is empty</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Publish some stories first to add them to highlights.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                    {storyArchive.map((s: any) => {
                      const isSelected = selectedArchiveStories.includes(s._id);
                      const selectionIndex = isSelected ? selectedArchiveStories.indexOf(s._id) + 1 : null;
                      return (
                        <div
                          key={s._id}
                          onClick={() => {
                            setSelectedArchiveStories(prev => 
                              prev.includes(s._id) 
                                ? prev.filter(id => id !== s._id)
                                : [...prev, s._id]
                            );
                          }}
                          className={`group relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer bg-black ${
                            isSelected ? "ring-2 ring-[hsl(var(--primary))] ring-offset-2 ring-offset-[hsl(var(--background))]" : "opacity-70 hover:opacity-100"
                          } transition-all`}
                        >
                          {s.mediaType === "video" ? (
                            <video src={s.mediaUrl} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={s.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                          
                          <div className={`absolute top-2 right-2 h-6 w-6 rounded-full border-[1.5px] flex items-center justify-center backdrop-blur-sm transition-colors ${
                            isSelected ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]" : "bg-black/30 border-white"
                          }`}>
                            {isSelected && <span className="text-xs font-bold text-[hsl(var(--primary-foreground))]">{selectionIndex}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>

            <div className="flex flex-col border-t border-[hsl(var(--border))]/50 bg-[hsl(var(--muted))]/20 shrink-0">
              {selectedArchiveStories.length > 0 && (
                <div className="px-4 sm:px-5 py-3 border-b border-[hsl(var(--border))]/30 flex items-center gap-2.5 overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-[hsl(var(--border))] [&::-webkit-scrollbar-thumb]:rounded-full">
                  {selectedArchiveStories.map((id, index) => {
                    const story = storyArchive.find(s => s._id === id);
                    if (!story) return null;
                    return (
                      <div key={id} className="relative w-11 sm:w-12 shrink-0 aspect-[9/16] rounded-md overflow-hidden ring-2 ring-[hsl(var(--primary))] ring-offset-1 ring-offset-[hsl(var(--muted))/20]">
                        {story.mediaType === 'video' ? (
                          <video src={story.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={story.mediaUrl} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-1 right-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[10px] h-4 w-4 rounded-full flex items-center justify-center font-bold shadow-sm z-10">
                          {index + 1}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="p-4 sm:p-5 flex justify-between items-center">
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  <span className="text-[hsl(var(--primary))] font-bold">{selectedArchiveStories.length}</span> {(t.builder as any)?.stories?.itemsSelected || "items selected"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsStoryArchiveModalOpen(false)}
                  className="px-5 py-2.5 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  {(t.builder as any)?.stories?.archiveModalDone || "Done"}
                </button>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
