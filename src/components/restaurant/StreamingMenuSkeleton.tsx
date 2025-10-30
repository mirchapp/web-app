'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface StreamingMenuSkeletonProps {
  description?: string;
  cuisine?: string;
  tags?: string[];
  categories?: Array<{ name: string; items: Array<{ name: string; description?: string | null; price?: string | null }> }>;
  primaryColor?: string;
}

export function StreamingMenuSkeleton({ description, cuisine, tags, categories = [], primaryColor = '#8A42D6' }: StreamingMenuSkeletonProps) {
  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      {/* Streaming Indicator Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 w-fit"
      >
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: primaryColor }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <span className="text-xs font-medium" style={{ color: primaryColor }}>
          Streaming menu data... {totalItems > 0 && `(${categories.length} categories, ${totalItems} items)`}
        </span>
      </motion.div>

      {/* Description Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <h3 className="text-base font-light text-gray-500 dark:text-foreground/60 tracking-wide">About</h3>
        {description ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-600 dark:text-white/50 leading-loose font-light"
          >
            {description}
          </motion.p>
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        )}
      </motion.div>

      {/* Cuisine and Tags */}
      {(cuisine || tags && tags.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          {cuisine && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-3 py-1 text-xs rounded-full font-medium"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor
              }}
            >
              {cuisine}
            </motion.span>
          )}
          {tags?.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/70 rounded-full font-medium"
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>
      )}

      {/* Menu Categories */}
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {categories.map((category, categoryIndex) => (
            <motion.div
              key={`${category.name}-${categoryIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
              className="space-y-4"
            >
              {/* Category Title */}
              <motion.h4
                className="text-base font-light text-gray-900 dark:text-white flex items-center gap-2"
                layoutId={`category-${category.name}`}
              >
                <motion.span
                  className="h-1 w-8 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                  layoutId={`category-bar-${category.name}`}
                />
                {category.name}
              </motion.h4>

              {/* Category Items */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {category.items.map((item, itemIndex) => (
                    <motion.div
                      key={`${item.name}-${itemIndex}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{
                        duration: 0.3,
                        delay: itemIndex * 0.05,
                        type: 'spring',
                        stiffness: 300,
                        damping: 30
                      }}
                      className="flex gap-3 p-4 rounded-[14px] bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 shadow-sm hover:border-purple-200 dark:hover:border-purple-500/20 transition-all duration-200"
                      style={{
                        borderColor: `${primaryColor}10`
                      }}
                    >
                      {/* Item Logo Placeholder */}
                      <motion.div
                        className="h-20 w-20 rounded-[12px] overflow-hidden flex-shrink-0 ring-1 ring-gray-200 dark:ring-black/5"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [0.3, 0.5, 0.3]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="w-10 h-10 rounded-full"
                            style={{ backgroundColor: `${primaryColor}30` }}
                          />
                        </div>
                      </motion.div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <motion.p
                            className="font-light text-base text-gray-900 dark:text-white"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: itemIndex * 0.05 + 0.1 }}
                          >
                            {item.name}
                          </motion.p>
                          {item.price && (
                            <motion.p
                              className="text-base font-light text-gray-900 dark:text-white ml-2"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: itemIndex * 0.05 + 0.15 }}
                            >
                              {item.price}
                            </motion.p>
                          )}
                        </div>
                        {item.description ? (
                          <motion.p
                            className="text-sm text-gray-600 dark:text-white/50 line-clamp-2 font-light"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: itemIndex * 0.05 + 0.2 }}
                          >
                            {item.description}
                          </motion.p>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: itemIndex * 0.05 + 0.2 }}
                            className="space-y-1"
                          >
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading State - Show when no categories yet */}
        {categories.length === 0 && (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-1 w-8 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex gap-3 p-4 rounded-[14px] bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5">
                      <Skeleton className="h-20 w-20 rounded-[12px]" />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pulsing Indicator */}
      <motion.div
        className="flex items-center justify-center gap-2 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: primaryColor }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: primaryColor }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
        />
        <motion.div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: primaryColor }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4
          }}
        />
      </motion.div>
    </div>
  );
}
