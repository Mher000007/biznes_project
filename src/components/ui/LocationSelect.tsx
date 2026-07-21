import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ARMENIA_LOCATIONS } from '@/data/locations';
import { ChevronDown, ChevronRight, ChevronLeft, Search, Check } from 'lucide-react';
import { useI18n } from '@/i18n';
import { transliterateArmenian } from '@/lib/transliterate';

export interface LocationSelectProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  placeholder?: string;
  disablePlaceholder?: boolean;
  required?: boolean;
}

export function LocationSelect({ 
  value, 
  onChange, 
  placeholder = "Select Location", 
  disablePlaceholder = true,
  className,
  style,
  ...props 
}: LocationSelectProps) {
  const { locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Responsive states
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Interaction states
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredCommunity, setHoveredCommunity] = useState<string | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Responsive Detection
  useEffect(() => {
    const checkMedia = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkMedia();
    window.addEventListener('resize', checkMedia);
    return () => window.removeEventListener('resize', checkMedia);
  }, []);

  // Close when clicking outside, update position on scroll/resize
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current && 
        !wrapperRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    
    function handleScrollOrResize() {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom,
          left: rect.left,
          width: rect.width
        });
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  // Translate locations deeply using useMemo
  const localizedLocations = useMemo(() => {
    return ARMENIA_LOCATIONS.map(region => ({
      ...region,
      localizedName: transliterateArmenian(region.name, locale),
      communitiesLocalized: region.communities?.map(comm => ({
        ...comm,
        localizedName: transliterateArmenian(comm.name, locale),
        districtsLocalized: comm.districts?.map(d => ({ raw: d, loc: transliterateArmenian(d, locale) })),
        villagesLocalized: comm.villages?.map(v => ({ raw: v, loc: transliterateArmenian(v, locale) }))
      })) || []
    }));
  }, [locale]);

  // Filter locations based on search
  const filteredLocations = useMemo(() => {
    if (!search.trim()) return localizedLocations;
    
    const query = search.toLowerCase();
    return localizedLocations.map(region => {
      if (region.localizedName.toLowerCase().includes(query)) return region;
      
      const filteredComms = region.communitiesLocalized.map(comm => {
        if (comm.localizedName.toLowerCase().includes(query)) return comm;
        
        const dists = comm.districtsLocalized?.filter(d => d.loc.toLowerCase().includes(query));
        const vils = comm.villagesLocalized?.filter(v => v.loc.toLowerCase().includes(query));
        
        if ((dists && dists.length > 0) || (vils && vils.length > 0)) {
          return { ...comm, districtsLocalized: dists || [], villagesLocalized: vils || [] };
        }
        return null;
      }).filter(Boolean) as typeof region.communitiesLocalized;

      if (filteredComms.length > 0) {
        return { ...region, communitiesLocalized: filteredComms };
      }
      
      return null;
    }).filter(Boolean) as typeof localizedLocations;
  }, [search, localizedLocations]);

  // Set initial hovered region when opening
  useEffect(() => {
    if (isOpen && filteredLocations.length > 0) {
      if (value) {
        const found = filteredLocations.find(r => 
          r.name === value || 
          r.communitiesLocalized.some(c => 
            c.name === value || 
            c.districtsLocalized?.some(d => `${d.raw} (${r.name})` === value) ||
            c.villagesLocalized?.some(v => v.raw === value)
          )
        );
        // On mobile, if we have a value, we open the drill-down. Otherwise we stay on list.
        setHoveredRegion(found ? found.name : (isMobile ? null : filteredLocations[0].name));
      } else {
        setHoveredRegion(isMobile ? null : filteredLocations[0].name);
      }
    }
  }, [isOpen, filteredLocations, value, isMobile]);

  // Reset hovered community when region changes
  useEffect(() => {
    setHoveredCommunity(null);
  }, [hoveredRegion]);

  const handleSelect = (val: string) => {
    onChange({ target: { value: val } });
    setIsOpen(false);
    setSearch('');
  };

  const toggleOpen = () => {
    if (!isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen((prev) => !prev);
  };

  // Helper to show localized currently selected value
  const displayValue = useMemo(() => {
    if (!value) return '';
    for (const reg of localizedLocations) {
      if (reg.name === value) return reg.localizedName;
      for (const comm of reg.communitiesLocalized) {
        if (comm.name === value) return comm.localizedName;
        if (comm.districtsLocalized?.find(d => `${d.raw} (${reg.name})` === value)) {
           const d = comm.districtsLocalized.find(d => `${d.raw} (${reg.name})` === value);
           return `${d?.loc} (${reg.localizedName})`;
        }
        if (comm.villagesLocalized?.find(v => v.raw === value)) {
           return comm.villagesLocalized.find(v => v.raw === value)?.loc;
        }
      }
    }
    return value;
  }, [value, localizedLocations]);

  const activeRegionData = hoveredRegion ? filteredLocations.find(r => r.name === hoveredRegion) : null;

  // Calculate Responsive Styles
  let popupWidth = isMobile ? window.innerWidth - 32 : Math.max(700, coords.width);
  if (isTablet) popupWidth = Math.max(600, coords.width);
  
  const popupLeft = isMobile ? 16 : coords.left;
  // Make sure it doesn't overflow right edge on desktop
  const maxLeft = typeof window !== 'undefined' ? window.innerWidth - popupWidth - 16 : coords.left;
  const finalLeft = isMobile ? 16 : Math.min(coords.left, Math.max(16, maxLeft));

  return (
    <div className="relative w-full h-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className={`focus:outline-none flex items-center justify-between w-full text-left ${className || 'min-h-[38px] px-3 py-2 bg-transparent'}`}
        style={style}
        {...props}
      >
        <span className={`block truncate pr-2 ${!value ? 'text-[hsl(var(--muted-foreground))]' : 'font-medium'}`}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: coords.top,
            left: finalLeft,
            width: popupWidth, 
            maxHeight: `calc(100vh - 20px - ${coords.top}px)`,
            height: isMobile ? '70vh' : 'auto' // Give predictable height on mobile
          }}
        >
          {/* Top Search Bar */}
          <div className="p-2 md:p-3 border-b border-[hsl(var(--border))] flex items-center gap-2 bg-[hsl(var(--muted))/30] z-20">
            <Search className="w-4 h-4 md:w-5 md:h-5 text-[hsl(var(--muted-foreground))]" />
            <input
              autoFocus={!isMobile}
              type="text"
              placeholder={locale === 'hy' ? "Որոնել..." : locale === 'ru' ? "Поиск..." : "Search..."}
              className="w-full bg-transparent outline-none text-sm md:text-base placeholder:text-[hsl(var(--muted-foreground))] h-8 md:h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} overflow-hidden bg-[hsl(var(--card))] relative`} style={{ height: isMobile ? '100%' : '450px' }}>
            
            {/* Left Panel: Regions (Names) */}
            <div className={`
              ${isMobile ? (activeRegionData ? 'hidden' : 'w-full h-full') : 'w-[30%] h-full'} 
              border-r border-[hsl(var(--border))] bg-[hsl(var(--muted))/10] overflow-y-auto custom-scrollbar flex flex-col p-1.5 md:p-2
            `}>
              {!disablePlaceholder && !search && (
                <div 
                  className={`px-3 py-3 md:py-2 mb-1 text-base md:text-sm rounded-md cursor-pointer flex items-center justify-between transition-colors ${!value ? 'bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] font-medium' : 'hover:bg-[hsl(var(--primary))/10] hover:text-[hsl(var(--primary))]'}`}
                  onClick={() => handleSelect('')}
                >
                  <span>{placeholder}</span>
                  {!value && <Check className="w-5 h-5 md:w-4 md:h-4" />}
                </div>
              )}

              {filteredLocations.length === 0 ? (
                 <div className="p-6 md:p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
                   {locale === 'hy' ? "Չի գտնվել" : "Not found"}
                 </div>
              ) : (
                filteredLocations.map((region) => {
                  const isActive = hoveredRegion === region.name;
                  return (
                    <div 
                      key={region.name}
                      onMouseEnter={() => !isMobile && setHoveredRegion(region.name)}
                      onClick={() => {
                        if (isMobile) setHoveredRegion(region.name);
                        else handleSelect(region.name);
                      }}
                      className={`px-4 py-3.5 md:px-3 md:py-2.5 cursor-pointer flex items-center justify-between text-base md:text-sm rounded-lg md:rounded-md transition-all duration-200 mb-1 md:mb-0.5
                        ${!isMobile && isActive 
                          ? 'bg-[hsl(var(--primary))] text-white font-semibold shadow-sm' 
                          : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--primary))/10] hover:text-[hsl(var(--primary))]'
                        }
                        ${value === region.name && (!isActive || isMobile) ? 'ring-1 ring-[hsl(var(--primary))/50] bg-[hsl(var(--primary))/5] font-semibold text-[hsl(var(--primary))]' : ''}
                      `}
                    >
                      <span className="truncate pr-2">{region.localizedName}</span>
                      <div className="flex items-center gap-2 md:gap-1.5 flex-shrink-0">
                        {value === region.name && <Check className={`w-4 h-4 md:w-3.5 md:h-3.5 ${!isMobile && isActive ? 'text-white' : 'text-[hsl(var(--primary))]'}`} />}
                        <ChevronRight className={`w-4 h-4 md:w-3.5 md:h-3.5 transition-transform duration-200 ${!isMobile && isActive ? 'text-white translate-x-0.5' : 'text-[hsl(var(--muted-foreground))] opacity-50'}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Panel: Communities / Districts / Villages */}
            <div className={`
              ${isMobile ? (activeRegionData ? 'w-full h-full' : 'hidden') : 'w-[70%] h-full'} 
              overflow-y-auto custom-scrollbar p-4 md:p-5 relative bg-[hsl(var(--card))]
            `}>
               {activeRegionData ? (
                 <div className={`${isMobile ? 'animate-in slide-in-from-right-4' : 'animate-in fade-in slide-in-from-left-2'} duration-300`}>
                   
                   {/* Mobile Back Button */}
                   {isMobile && (
                     <div 
                       onClick={() => setHoveredRegion(null)}
                       className="flex items-center gap-2 mb-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] active:text-[hsl(var(--primary))] transition-colors cursor-pointer py-1"
                     >
                       <ChevronLeft className="w-5 h-5" />
                       <span className="text-sm font-medium uppercase tracking-wider">{locale === 'hy' ? 'Հետ' : 'Back'}</span>
                     </div>
                   )}

                   <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3 md:pb-3 mb-4 md:mb-5 sticky top-0 bg-[hsl(var(--card))] z-10">
                     <h3 className="text-xl md:text-lg lg:text-xl font-extrabold text-[hsl(var(--foreground))] truncate">
                        {activeRegionData.localizedName}
                     </h3>
                     
                     {/* Select Entire Region Button */}
                     <button
                        onClick={() => handleSelect(activeRegionData.name)}
                        className={`text-xs md:text-sm px-3 py-1.5 rounded-full font-bold transition-colors ${
                          value === activeRegionData.name 
                            ? 'bg-[hsl(var(--primary))] text-white shadow-sm' 
                            : 'bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/20]'
                        }`}
                     >
                        {locale === 'hy' ? 'Ընտրել ամբողջը' : 'Select All'}
                     </button>
                   </div>
                   
                   {/* Interactive Hover List for Communities */}
                   <div className="flex flex-col gap-4 md:gap-3">
                     {activeRegionData.communitiesLocalized.map(comm => {
                       // On mobile, items are always expanded or expand on click. 
                       // For simplicity and fluid UX on touch screens, let's keep them always expanded if there are a few, 
                       // or rely on touch acting like hover (we can just make them always expanded on mobile for a continuous scroll).
                       const isExpanded = isMobile ? true : (hoveredCommunity === comm.name || (search && true));
                       const hasChildren = (comm.districtsLocalized?.length || 0) > 0 || (comm.villagesLocalized?.length || 0) > 0;
                       
                       return (
                         <div 
                           key={comm.name} 
                           className="flex flex-col rounded-lg transition-all duration-300"
                           onMouseEnter={() => !isMobile && setHoveredCommunity(comm.name)}
                           onMouseLeave={() => !isMobile && setHoveredCommunity(null)}
                         >
                           {/* Community Header Row */}
                           {activeRegionData.type !== 'capital' && (
                             <div 
                               onClick={(e) => { e.stopPropagation(); handleSelect(comm.name); }}
                               className={`px-4 py-3 md:py-2.5 rounded-lg font-bold uppercase tracking-wide text-base md:text-sm transition-colors duration-300 border cursor-pointer flex items-center justify-between ${
                                 value === comm.name
                                   ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))] shadow-sm'
                                   : isExpanded && !isMobile
                                     ? 'bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] border-[hsl(var(--primary))/20]' 
                                     : 'bg-[hsl(var(--muted))/40] text-[hsl(var(--foreground))] border-transparent hover:bg-[hsl(var(--muted))]'
                               }`}
                             >
                               <span className="truncate">{comm.localizedName}</span>
                               {value === comm.name && <Check className="w-5 h-5 md:w-4 md:h-4 text-white flex-shrink-0 ml-2" />}
                             </div>
                           )}

                           {/* Smooth Expanding Grid for Children */}
                           {hasChildren && (
                             <div 
                               className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                               style={{ 
                                 gridTemplateRows: isExpanded || activeRegionData.type === 'capital' ? '1fr' : '0fr'
                               }}
                             >
                               <div className="overflow-hidden">
                                 {/* Fluid grid columns: 1 on mobile, 2 on tablet, 3 on desktop, 4 on xl */}
                                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pt-3 md:pt-3 pb-2 px-1 md:px-2">
                                   
                                   {/* Districts */}
                                   {comm.districtsLocalized?.map(d => {
                                     const rawVal = `${d.raw} (${activeRegionData.name})`;
                                     return (
                                       <div 
                                         key={rawVal}
                                         onClick={(e) => { e.stopPropagation(); handleSelect(rawVal); }}
                                         className={`px-3 py-2.5 md:py-1.5 text-base md:text-sm rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                                           value === rawVal 
                                             ? 'bg-[hsl(var(--primary))] text-white font-medium shadow-sm' 
                                             : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--primary))/10] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--muted))/20] md:bg-transparent border border-transparent hover:border-[hsl(var(--primary))/20]'
                                         }`}
                                       >
                                         <span className="truncate" title={d.loc}>{d.loc}</span>
                                         {value === rawVal && <Check className="w-4 h-4 md:w-3.5 md:h-3.5 flex-shrink-0 ml-2" />}
                                       </div>
                                     );
                                   })}

                                   {/* Villages */}
                                   {comm.villagesLocalized?.map(v => (
                                     <div 
                                       key={v.raw}
                                       onClick={(e) => { e.stopPropagation(); handleSelect(v.raw); }}
                                       className={`px-3 py-2.5 md:py-1.5 text-base md:text-sm rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                                         value === v.raw 
                                           ? 'bg-[hsl(var(--primary))] text-white font-medium shadow-sm' 
                                           : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--primary))/10] hover:text-[hsl(var(--foreground))] bg-[hsl(var(--muted))/20] md:bg-transparent border border-transparent hover:border-[hsl(var(--primary))/20]'
                                       }`}
                                     >
                                       <span className="truncate" title={v.loc}>{v.loc}</span>
                                       {value === v.raw && <Check className="w-4 h-4 md:w-3.5 md:h-3.5 flex-shrink-0 ml-2" />}
                                     </div>
                                   ))}
                                   
                                 </div>
                               </div>
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                   
                 </div>
               ) : (
                 <div className="flex h-full items-center justify-center text-sm md:text-base text-[hsl(var(--muted-foreground))] opacity-60">
                   {locale === 'hy' ? "Ընտրեք մարզ ձախ կողմից" : "Select a region from the left"}
                 </div>
               )}
            </div>

          </div>
        </div>
      , document.body)}
    </div>
  );
}
