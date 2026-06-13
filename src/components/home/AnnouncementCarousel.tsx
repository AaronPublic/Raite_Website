"use client";

import { useState, useEffect, useCallback } from "react";
import { Announcement } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pin, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AnnouncementCarouselProps {
  announcements: Announcement[];
}

export default function AnnouncementCarousel({ announcements }: AnnouncementCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  }, [announcements.length]);

  const slidePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  }, [announcements.length]);

  useEffect(() => {
    const timer = setInterval(slideNext, 5000);
    return () => clearInterval(timer);
  }, [slideNext]);

  if (announcements.length === 0) return null;

  const announcement = announcements[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="relative group overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={announcement.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="w-full"
        >
          <Card className={announcement.pinned ? "border-blue-200 bg-blue-50/50 dark:bg-blue-900/10" : ""}>
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {announcement.imageUrl && (
                <div className="relative aspect-video md:aspect-auto overflow-hidden rounded-xl border bg-muted">
                  <img
                    src={announcement.imageUrl}
                    alt={announcement.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}
              <div className={`flex flex-col ${!announcement.imageUrl ? "md:col-span-2" : ""}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {announcement.pinned && <Pin className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0" />}
                      <h3 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">{announcement.title}</h3>
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">
                      {new Date(announcement.createdAt).toLocaleDateString(undefined, { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  {announcement.pinned && <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Pinned</Badge>}
                </div>
                
                <div className="flex-1">
                  <p className="text-muted-foreground leading-relaxed line-clamp-4">
                    {announcement.content}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex gap-2">
                    {announcement.facebookUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={announcement.facebookUrl} target="_blank" rel="noopener noreferrer">
                          View Post <ExternalLink className="ml-2 w-3 h-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.preventDefault(); slidePrev(); }}
                      className="h-8 w-8 rounded-full border opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-1">
                      {announcements.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.preventDefault(); slideNext(); }}
                      className="h-8 w-8 rounded-full border opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
