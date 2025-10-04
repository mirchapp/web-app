'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSafeArea } from '@/hooks/useSafeArea';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image?: string;
}

interface RestaurantMenuPageProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItem) => void;
  restaurantName: string;
  menu?: {
    title?: string;
    sections: Array<{ title: string; items: MenuItem[] }>;
  };
}

export function RestaurantMenuPage({ isOpen, onClose, onConfirm, restaurantName, menu }: RestaurantMenuPageProps) {
  const safeAreaInsets = useSafeArea();
  const [isClosing, setIsClosing] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const effectiveMenu = React.useMemo(() => {
    if (menu) return menu;
    return {
      title: 'Full Menu',
      sections: [
        {
          title: 'Appetizers',
          items: [
            { id: 'a1', name: 'Spring Rolls', description: 'Vegetables, rice paper, peanut sauce', price: 8.99, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop' },
            { id: 'a2', name: 'Chicken Satay', description: 'Coconut curry, grilled skewers', price: 12.99, image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=200&h=200&fit=crop' },
          ],
        },
        {
          title: 'Mains',
          items: [
            { id: 'm1', name: 'Massaman Curry', description: 'Beef, potatoes, peanuts', price: 19.99, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop' },
            { id: 'm2', name: 'Green Curry', description: 'Chicken, eggplant, basil', price: 17.99, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop' },
            { id: 'm3', name: 'Pad See Ew', description: 'Wide noodles, broccoli, soy', price: 15.99, image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=200&h=200&fit=crop' },
          ],
        },
        {
          title: 'Desserts',
          items: [
            { id: 'd1', name: 'Mango Sticky Rice', description: 'Mango, coconut cream', price: 8.99, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop' },
            { id: 'd2', name: 'Thai Tea Ice Cream', description: 'Creamy, authentic', price: 6.99, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&h=200&fit=crop' },
          ],
        },
      ],
    };
  }, [menu]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    const item = effectiveMenu.sections.flatMap(s => s.items).find(i => i.id === selectedId);
    if (!item) return;
    onConfirm(item);
    setSelectedId(null);
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isClosing ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm touch-manipulation"
          onClick={handleClose}
          style={{ willChange: 'opacity', pointerEvents: isClosing ? 'none' : 'auto' }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isClosing ? '100%' : 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: isClosing ? 500 : 400, damping: isClosing ? 45 : 40, mass: isClosing ? 0.7 : 0.8 }}
            className="absolute bottom-0 left-0 right-0 h-full w-full bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ willChange: 'transform' }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/50 px-4"
              style={{ paddingTop: `${Math.max(safeAreaInsets.top, 12)}px` }}
            >
              <div className="flex items-center gap-2 py-3">
                <Button variant="ghost" size="icon" onClick={handleClose} className="h-10 w-10 rounded-full">
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <h2 className="flex-1 text-center text-base font-semibold">{restaurantName}</h2>
                <div className="w-10" />
              </div>
            </div>

            {/* Menu Sections */}
            <div className="h-full overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', paddingBottom: `calc(4.5rem + ${Math.max(safeAreaInsets.bottom, 16)}px)` }}>
              <div className="container mx-auto px-4 pt-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">{effectiveMenu.title || 'Menu'}</h3>
                {effectiveMenu.sections.map((section, idx) => (
                  <div key={idx} className="mb-6">
                    <h4 className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
                      <span className="h-1 w-8 bg-primary rounded-full" />
                      {section.title}
                    </h4>
                    <div className="space-y-2">
                      {section.items.map((item) => {
                        const selected = selectedId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className={[
                              'w-full p-3 rounded-xl border text-left transition-colors flex items-center gap-3',
                              selected ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-muted/30 hover:bg-muted/50'
                            ].join(' ')}
                          >
                            {item.image && (
                              <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted ring-1 ring-black/5 dark:ring-white/10">
                                <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover" unoptimized />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                              )}
                            </div>
                            {typeof item.price === 'number' && (
                              <span className="text-sm font-semibold tabular-nums">${item.price.toFixed(2)}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="absolute left-0 right-0 bottom-0 border-t border-border/50 bg-background px-4 pt-3 pb-4" style={{ paddingBottom: `${Math.max(safeAreaInsets.bottom, 16)}px` }}>
              <Button className="w-full h-12 rounded-2xl font-semibold" disabled={!selectedId} onClick={handleConfirm}>
                Confirm selection
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


