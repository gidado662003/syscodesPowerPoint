"use client";
import { useState, useEffect } from "react";
import { PresentationProvider, usePresentation } from "@/contexts/PresentationContext";
import { EditorPanel } from "@/components/EditorPanel";
import { PresentationView } from "@/components/PresentationView";
import { SlideThumbnails } from "@/components/SlideThumbnails";
import { Toolbar } from "@/components/Toolbar";

function AppInner() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [thumbnailsOpen, setThumbnailsOpen] = useState(true);
  const { state } = usePresentation();

  useEffect(() => {
    if (state.fullscreen) {
      setSidebarOpen(false);
      setThumbnailsOpen(false);
    }
  }, [state.fullscreen]);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden flex flex-col">
      {/* Top Toolbar */}
      {!state.fullscreen && (
        <Toolbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleThumbnails={() => setThumbnailsOpen(!thumbnailsOpen)}
          sidebarOpen={sidebarOpen}
          thumbnailsOpen={thumbnailsOpen}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Editor Panel */}
        <div className={`${
          state.fullscreen ? 'hidden' : (sidebarOpen ? 'w-80' : 'w-0')
        } transition-all duration-300 ease-in-out bg-gray-800/95 backdrop-blur-lg border-r border-blue-500/20 overflow-hidden flex-shrink-0`}>
          <EditorPanel onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Left Thumbnails Panel */}
            {!state.fullscreen && thumbnailsOpen && (
              <div className="w-60 bg-gray-800/80 backdrop-blur-lg border-r border-blue-500/20 overflow-hidden flex-shrink-0">
                <SlideThumbnails />
              </div>
            )}

            {/* Presentation View */}
            <div className="flex-1 overflow-hidden">
              <PresentationView />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PresentationProvider>
      <AppInner />
    </PresentationProvider>
  );
}