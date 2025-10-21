"use client";
import { useEffect, useState, useRef } from "react";
import { usePresentation } from "@/contexts/PresentationContext";
import HTMLReactParser from "html-react-parser/lib/index";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
});

export function PresentationView() {
  const { state, dispatch, nextSlide, prevSlide, updateSlide } =
    usePresentation();
  const [editMode, setEditMode] = useState(false);
  const [editingField, setEditingField] = useState<string>("");
  const editorRef = useRef(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editMode) return; // Don't navigate while editing

      if (state.previewMode || state.fullscreen) {
        if (e.key === "ArrowRight") nextSlide();
        if (e.key === "ArrowLeft") prevSlide();
        if (e.key === "Escape") {
          setEditMode(false);
          setEditingField("");
          dispatch({ type: "SET_FULLSCREEN", payload: false });
          dispatch({ type: "SET_PREVIEW_MODE", payload: false });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.previewMode,
    state.fullscreen,
    nextSlide,
    prevSlide,
    dispatch,
    editMode,
  ]);

  // Auto-advance in presentation mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.previewMode && state.slides.length > 1 && !editMode) {
      interval = setInterval(() => {
        if (state.currentSlideIndex < state.slides.length - 1) {
          nextSlide();
        } else {
          dispatch({ type: "SET_CURRENT_SLIDE_INDEX", payload: 0 });
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [
    state.previewMode,
    state.currentSlideIndex,
    state.slides.length,
    nextSlide,
    dispatch,
    editMode,
  ]);

  const currentSlide = state.slides[state.currentSlideIndex];

  const getSlideBackground = (slide: any) => {
    // Use only background color for slides; images are rendered as foreground
    // <img> elements in the content area. This prevents duplicated visuals
    // (background image + foreground img) and preserves GIF animation.
    return {
      backgroundColor: slide.backgroundColor || "#1e293b",
    };
  };

  const handleFieldChange = (field: string, value: string) => {
    if (currentSlide) {
      updateSlide(currentSlide.id, { [field]: value });
    }
  };

  const renderSlideContent = () => {
    if (!currentSlide) return null;

    const getLayoutClass = () => {
      switch (currentSlide.layout) {
        case "title-content":
          return "flex-col justify-center";
        case "content-only":
          return "flex-col justify-center";
        case "image-left":
          return "flex-row items-center";
        case "image-right":
          return "flex-row-reverse items-center";
        case "title-content-image":
          return "flex-col justify-center";
        case "two-column":
          return "flex-row items-start gap-8";
        case "centered":
          return "flex-col justify-center items-center text-center";
        case "split-screen":
          return "flex-row items-center";
        default:
          return "flex-col justify-center";
      }
    };

    const getContentAlignment = () => {
      switch (currentSlide.layout) {
        case "image-left":
          return "text-left items-start";
        case "image-right":
          return "text-left items-start";
        case "title-content-image":
          return "text-center items-center";
        case "two-column":
          return "text-left items-start";
        case "centered":
          return "text-center items-center";
        case "split-screen":
          return "text-left items-start";
        default:
          return "text-center items-center";
      }
    };

    return (
      <div className={`flex ${getLayoutClass()} w-full h-full p-8 gap-8`}>
        {/* Image placement based on layout */}
        {(currentSlide.layout === "image-left" ||
          currentSlide.layout === "image-right" ||
          currentSlide.layout === "split-screen") &&
          currentSlide.image && (
            <div className="flex-1 flex items-center justify-center p-4">
              <img
                src={currentSlide.image}
                alt="Slide"
                className="max-h-[70%] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
              />
            </div>
          )}

        {currentSlide.layout === "title-content-image" &&
          currentSlide.image && (
            <div className="flex items-center justify-center p-4 mt-6">
              {/* Render all images (GIFs and static) as foreground <img> so there's
                a single visible image and GIFs remain animated. */}
              <img
                src={currentSlide.image}
                alt="Slide"
                className="max-h-[40%] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
              />
            </div>
          )}

        {/* Two column layout support */}
        {currentSlide.layout === "two-column" && (
          <div className="flex-1 grid grid-cols-2 gap-8">
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {currentSlide.title || "Column 1"}
              </h1>
              <div className="prose prose-invert max-w-none text-white">
                {HTMLReactParser(currentSlide.content || "")}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {currentSlide.subTitle || "Column 2"}
              </h2>
              {currentSlide.image && (
                <img
                  src={currentSlide.image}
                  alt="Slide"
                  className="max-h-[60%] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
                />
              )}
            </div>
          </div>
        )}

        {/* Skip content rendering for two-column layout as it's handled above */}
        {currentSlide.layout !== "two-column" && (
          <div
            className={`flex-1 flex flex-col justify-center ${getContentAlignment()}`}
          >
            {/* Title field - show in all layouts except content-only */}
            {currentSlide.layout !== "content-only" && (
              <div
                className={`mb-6 ${
                  currentSlide.layout === "image-left" ||
                  currentSlide.layout === "image-right"
                    ? "mb-8"
                    : "mb-8"
                }`}
              >
                {editMode && editingField === "title" ? (
                  <input
                    type="text"
                    className={`w-full bg-transparent outline-none border-b border-white/30 pb-2 focus:border-white/50 transition-colors duration-300 font-bold text-white ${
                      currentSlide.layout === "image-left" ||
                      currentSlide.layout === "image-right"
                        ? "text-3xl md:text-4xl"
                        : "text-4xl md:text-6xl text-center"
                    }`}
                    value={currentSlide.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    onBlur={() => {
                      setEditMode(false);
                      setEditingField("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setEditMode(false);
                        setEditingField("");
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <h1
                    className={`font-bold text-white cursor-pointer hover:bg-white/10 p-4 rounded-lg transition-colors ${
                      currentSlide.layout === "image-left" ||
                      currentSlide.layout === "image-right"
                        ? "text-3xl md:text-4xl"
                        : "text-4xl md:text-6xl text-center"
                    }`}
                    onClick={() => {
                      setEditMode(true);
                      setEditingField("title");
                    }}
                  >
                    {currentSlide.title || (
                      <span className="text-gray-400">Click to add title</span>
                    )}
                  </h1>
                )}
              </div>
            )}

            {/* Subtitle field */}
            {currentSlide.subTitle && (
              <div
                className={`mb-6 ${
                  currentSlide.layout === "image-left" ||
                  currentSlide.layout === "image-right"
                    ? "mb-6"
                    : "mb-6"
                }`}
              >
                {editMode && editingField === "subTitle" ? (
                  <input
                    type="text"
                    className={`w-full bg-transparent outline-none border-b border-white/30 pb-2 focus:border-white/50 transition-colors duration-300 text-white ${
                      currentSlide.layout === "image-left" ||
                      currentSlide.layout === "image-right"
                        ? "text-xl md:text-2xl"
                        : "text-2xl md:text-3xl text-center"
                    }`}
                    value={currentSlide.subTitle}
                    onChange={(e) =>
                      handleFieldChange("subTitle", e.target.value)
                    }
                    onBlur={() => {
                      setEditMode(false);
                      setEditingField("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setEditMode(false);
                        setEditingField("");
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <h2
                    className={`text-white cursor-pointer hover:bg-white/10 p-4 rounded-lg transition-colors ${
                      currentSlide.layout === "image-left" ||
                      currentSlide.layout === "image-right"
                        ? "text-xl md:text-2xl"
                        : "text-2xl md:text-3xl text-center"
                    }`}
                    onClick={() => {
                      setEditMode(true);
                      setEditingField("subTitle");
                    }}
                  >
                    {currentSlide.subTitle}
                  </h2>
                )}
              </div>
            )}

            {/* Content field */}
            {currentSlide.content && (
              <div className="max-w-3xl">
                {editMode && editingField === "content" ? (
                  <JoditEditor
                    ref={editorRef}
                    value={currentSlide.content}
                    config={{
                      readonly: false,
                      toolbarAdaptive: true,
                      buttons: "bold,italic,underline,ul,ol,link",
                    }}
                    onBlur={(newContent: string) => {
                      handleFieldChange("content", newContent);
                      setEditMode(false);
                      setEditingField("");
                    }}
                  />
                ) : (
                  <div
                    className="prose prose-invert max-w-none text-white cursor-pointer hover:bg-white/10 p-4 rounded-lg transition-colors"
                    onClick={() => {
                      setEditMode(true);
                      setEditingField("content");
                    }}
                  >
                    {HTMLReactParser(currentSlide.content)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!currentSlide || state.slides.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
        <div className="text-6xl mb-4">📝</div>
        <h1 className="text-3xl font-bold mb-4">
          Welcome to Syscodes Presentation Maker
        </h1>
        <p className="text-lg text-gray-300 mb-8 text-center max-w-2xl">
          Create your presentations. Start by importing an existing presentation
          or adding your first slide!
        </p>
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-gray-400">
            Click "Import" in the toolbar to load an existing presentation
          </p>
          <p className="text-sm text-gray-400">
            Or click "New" to start creating a new presentation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Presentation Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div
          className="w-full h-full flex items-center justify-center transition-all duration-500 ease-in-out"
          style={getSlideBackground(currentSlide)}
        >
          {renderSlideContent()}
        </div>

        {/* Navigation Arrows */}
        {state.previewMode && state.slides.length > 1 && !editMode && (
          <>
            <button
              onClick={prevSlide}
              disabled={state.currentSlideIndex === 0}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous slide"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              disabled={state.currentSlideIndex === state.slides.length - 1}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next slide"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Bottom Status Bar */}
      {!state.previewMode && !state.fullscreen && (
        <div className="bg-gray-800/90 backdrop-blur-lg border-t border-purple-500/20 p-3 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Slide {state.currentSlideIndex + 1} of {state.slides.length}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                dispatch({
                  type: "SET_PREVIEW_MODE",
                  payload: !state.previewMode,
                })
              }
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors duration-200"
            >
              {state.previewMode ? "Exit Preview" : "Preview"}
            </button>
            <button
              onClick={() =>
                dispatch({ type: "SET_FULLSCREEN", payload: !state.fullscreen })
              }
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors duration-200"
            >
              {state.fullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
