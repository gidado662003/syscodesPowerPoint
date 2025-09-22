"use client";
import { usePresentation } from "@/contexts/PresentationContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaPlus, FaGripVertical } from "react-icons/fa";

interface SortableSlideThumbnailProps {
  slide: any;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableSlideThumbnail({
  slide,
  index,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableSlideThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getSlideBackground = (slide: any) => {
    // Only provide background color for thumbnails; images are rendered as
    // foreground <img> elements below to avoid duplicate/hidden images.
    return {
      backgroundColor: slide.backgroundColor || "#1e293b",
    };
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group transition-all duration-200 ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
    >
      {/* Drag handle */}
      <div
        className="absolute -left-2 top-1/2 transform -translate-y-1/2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab z-10"
        {...attributes}
        {...listeners}
      >
        <FaGripVertical />
      </div>

      {/* Main thumbnail */}
      <div
        className={`ml-2 h-20 rounded border-2 transition-all duration-200 cursor-pointer ${
          isActive
            ? "border-blue-500 shadow-lg shadow-blue-500/25"
            : "border-gray-600 hover:border-blue-500/50"
        }`}
        style={getSlideBackground(slide)}
        onClick={onSelect}
      >
        {/* Slide number */}
        <div className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {index + 1}
        </div>

        {/* Content preview */}
        <div className="absolute inset-0 p-1 flex flex-col justify-center">
          {slide.title && (
            <div className="text-white text-xs font-medium truncate text-center px-1">
              {slide.title}
            </div>
          )}
        </div>

        {/* Render a small foreground preview image if present (static or GIF). */}
        {typeof slide.image === "string" && slide.image && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src={slide.image}
              alt="preview"
              className="max-h-full max-w-full object-contain rounded"
            />
          </div>
        )}

        {/* Action buttons overlay */}
        <div className="absolute inset-0 flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/70 rounded">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="w-6 h-6 flex items-center justify-center text-green-300 text-xs hover:bg-green-500/20 rounded transition-colors"
            title="Duplicate slide"
          >
            ⎘
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-6 h-6 flex items-center justify-center text-red-300 text-xs hover:bg-red-500/20 rounded transition-colors"
            title="Delete slide"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

const AddSlideButton = () => {
  const { addSlide } = usePresentation();
  const handleAddSlide = () => {
    addSlide({
      title: "",
      subTitle: "",
      content: "",
      image: "",
      layout: "title-content-image",
      backgroundColor: "#1e293b",
    });
  };

  return (
    <button
      onClick={handleAddSlide}
      className="ml-2 h-20 rounded border-2 border-dashed border-gray-600 hover:border-blue-500/50 transition-colors duration-200 flex flex-col items-center justify-center text-gray-500 hover:text-blue-400 w-full"
      title="Add new slide"
    >
      <FaPlus className="text-lg" />
      <span className="mt-1 text-xs">Add Slide</span>
    </button>
  );
};

export function SlideThumbnails() {
  const { state, dispatch, goToSlide, deleteSlide, duplicateSlide } =
    usePresentation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = state.slides.findIndex((slide) => slide.id === active.id);
    const newIndex = state.slides.findIndex((slide) => slide.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedSlides = arrayMove(state.slides, oldIndex, newIndex);
    dispatch({ type: "REORDER_SLIDES", payload: reorderedSlides });
  };

  const handleSlideSelect = (index: number) => {
    goToSlide(index);
  };

  const handleSlideDelete = (slideId: number) => {
    deleteSlide(slideId);
  };

  const handleSlideDuplicate = (slideId: number) => {
    duplicateSlide(slideId);
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="p-3 border-b border-blue-500/20 bg-gray-700/70">
        <h3 className="text-sm font-semibold text-white">Slides</h3>
        <div className="text-xs text-gray-400 mt-1">
          {state.slides.length} slide{state.slides.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Thumbnails and Add Button */}
      <div className="flex-1 overflow-y-auto p-3">
        {state.slides.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-gray-400 text-xs">No slides yet</div>
            <div className="text-gray-500 text-xs mt-1">
              Create your first slide
            </div>
            <div className="mt-4">
              <AddSlideButton />
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={state.slides.map((s) => s.id)}
              strategy={rectSortingStrategy}
            >
              <div className="space-y-2">
                {state.slides.map((slide, index) => (
                  <SortableSlideThumbnail
                    key={slide.id}
                    slide={slide}
                    index={index}
                    isActive={state.currentSlideIndex === index}
                    onSelect={() => handleSlideSelect(index)}
                    onDelete={() => handleSlideDelete(slide.id)}
                    onDuplicate={() => handleSlideDuplicate(slide.id)}
                  />
                ))}
                <AddSlideButton />
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
