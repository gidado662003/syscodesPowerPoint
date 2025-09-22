"use client";
import React, { createContext, useContext, useReducer, useEffect } from "react";
import {
  getAllSlides,
  bulkCreateSlides,
  deleteSlideById,
  createPresentation,
  uploadImage,
} from "@/api/api";

export interface Slide {
  id: number;
  title: string;
  subTitle: string;
  content: string;
  image: string;
  layout: string;
  backgroundColor: string;
  serverId?: string;
  transition?: string;
  notes?: string;
}

interface PresentationState {
  slides: Slide[];
  activeSlide: number | null;
  previewMode: boolean;
  fullscreen: boolean;
  currentSlideIndex: number;
  isAnimating: boolean;
  showThumbnails: boolean;
  exporting: boolean;
  importing: boolean;
  currentSlideId: number | null; // ✅ added here
}

type PresentationAction =
  | { type: "SET_SLIDES"; payload: Slide[] }
  | { type: "ADD_SLIDE"; payload: Slide }
  | { type: "UPDATE_SLIDE"; payload: { id: number; updates: Partial<Slide> } }
  | { type: "DELETE_SLIDE"; payload: number }
  | { type: "DUPLICATE_SLIDE"; payload: number }
  | { type: "REORDER_SLIDES"; payload: Slide[] }
  | { type: "SET_ACTIVE_SLIDE"; payload: number | null }
  | { type: "SET_PREVIEW_MODE"; payload: boolean }
  | { type: "SET_FULLSCREEN"; payload: boolean }
  | { type: "SET_CURRENT_SLIDE_INDEX"; payload: number }
  | { type: "SET_CURRENT_SLIDE_ID"; payload: number } // ✅ fixed
  | { type: "SET_ANIMATING"; payload: boolean }
  | { type: "SET_SHOW_THUMBNAILS"; payload: boolean }
  | { type: "SET_EXPORTING"; payload: boolean }
  | { type: "SET_IMPORTING"; payload: boolean };

const initialState: PresentationState = {
  slides: [],
  activeSlide: null,
  previewMode: false,
  fullscreen: false,
  currentSlideIndex: 0,
  isAnimating: false,
  showThumbnails: false,
  exporting: false,
  importing: false,
  currentSlideId: null, // ✅ added
};

function presentationReducer(
  state: PresentationState,
  action: PresentationAction
): PresentationState {
  switch (action.type) {
    case "SET_SLIDES":
      return { ...state, slides: action.payload };

    case "ADD_SLIDE":
      return {
        ...state,
        slides: [...state.slides, action.payload],
        activeSlide: action.payload.id,
        currentSlideId: action.payload.id,
      };

    case "UPDATE_SLIDE":
      return {
        ...state,
        slides: state.slides.map((slide) =>
          slide.id === action.payload.id
            ? { ...slide, ...action.payload.updates }
            : slide
        ),
      };

    case "DELETE_SLIDE":
      const updatedSlides = state.slides
        .filter((slide) => slide.id !== action.payload)
        .map((slide, idx) => ({ ...slide, id: idx + 1 }));
      return {
        ...state,
        slides: updatedSlides,
        activeSlide: updatedSlides.length > 0 ? updatedSlides[0].id : null,
        currentSlideId: updatedSlides.length > 0 ? updatedSlides[0].id : null,
        currentSlideIndex: Math.min(
          state.currentSlideIndex,
          updatedSlides.length - 1
        ),
      };

    case "DUPLICATE_SLIDE":
      const slideToDuplicate = state.slides.find(
        (slide) => slide.id === action.payload
      );
      if (slideToDuplicate) {
        const duplicatedSlide = {
          ...slideToDuplicate,
          id: Math.max(...state.slides.map((s) => s.id)) + 1,
          title: `${slideToDuplicate.title} (Copy)`,
        };
        return { ...state, slides: [...state.slides, duplicatedSlide] };
      }
      return state;

    case "REORDER_SLIDES":
      return { ...state, slides: action.payload };

    case "SET_ACTIVE_SLIDE":
      return {
        ...state,
        activeSlide: action.payload,
        currentSlideId: action.payload,
      };

    case "SET_CURRENT_SLIDE_ID":
      return {
        ...state,
        currentSlideId: action.payload,
        currentSlideIndex: state.slides.findIndex(
          (slide) => slide.id === action.payload
        ),
      };

    case "SET_PREVIEW_MODE":
      return { ...state, previewMode: action.payload };

    case "SET_FULLSCREEN":
      return { ...state, fullscreen: action.payload };

    case "SET_CURRENT_SLIDE_INDEX":
      return { ...state, currentSlideIndex: action.payload };

    case "SET_ANIMATING":
      return { ...state, isAnimating: action.payload };

    case "SET_SHOW_THUMBNAILS":
      return { ...state, showThumbnails: action.payload };

    case "SET_EXPORTING":
      return { ...state, exporting: action.payload };

    case "SET_IMPORTING":
      return { ...state, importing: action.payload };

    default:
      return state;
  }
}

interface PresentationContextType {
  state: PresentationState;
  dispatch: React.Dispatch<PresentationAction>;
  addSlide: (slide: Omit<Slide, "id">) => void;
  updateSlide: (id: number, updates: Partial<Slide>) => void;
  deleteSlide: (id: number) => void;
  duplicateSlide: (id: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
  exportPresentation: (title?: string, userId?: string) => Promise<void>;
  importPresentation: (file: File) => Promise<void>;
  setCurrentSlideId: (id: number) => void; // ✅ added
}

const PresentationContext = createContext<PresentationContextType | undefined>(
  undefined
);

export function PresentationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(presentationReducer, initialState);

  // Load slides from localStorage on initial load
  const handleGetAllSlides = async (): Promise<Slide[] | null> => {
    try {
      const slides = await getAllSlides();
      if (Array.isArray(slides) && slides.length > 0) {
        // Map server slide documents to local Slide shape
        const mapped: Slide[] = slides.map((s: any, idx: number) => ({
          id: idx + 1,
          title: s.title || "",
          subTitle: s.subtitle || s.subTitle || "",
          content: s.content || "",
          image: s.image || "",
          layout: s.layout || "",
          backgroundColor: s.backgroundColor || "#ffffff",
          serverId: s._id || s.id || undefined,
        }));
        dispatch({ type: "SET_SLIDES", payload: mapped });
        dispatch({ type: "SET_ACTIVE_SLIDE", payload: mapped[0].id });
        return mapped;
      }
      return null;
    } catch (error) {
      console.error("Error fetching slides from server:", error);
      return null;
    }
  };

  useEffect(() => {
    // Try server first; fall back to localStorage if server returns nothing
    const loadSlides = async () => {
      const serverSlides = await handleGetAllSlides();
      if (serverSlides && serverSlides.length > 0) {
        return;
      }
      try {
        const saved = localStorage.getItem("powerpoint-slides");
        if (saved) {
          const parsedSlides = JSON.parse(saved);
          if (Array.isArray(parsedSlides) && parsedSlides.length > 0) {
            dispatch({ type: "SET_SLIDES", payload: parsedSlides });
            dispatch({ type: "SET_ACTIVE_SLIDE", payload: parsedSlides[0].id });
            return;
          }
        }
      } catch (error) {
        console.error("Error loading slides from localStorage:", error);
      }
    };

    loadSlides();
  }, []);

  // Persist slides to server whenever slides change (optional)
  // NOTE: We no longer persist to localStorage as the source of truth is the API.

  const addSlide = (slideData: Omit<Slide, "id">) => {
    const newSlide: Slide = {
      ...slideData,
      id:
        state.slides.length > 0
          ? Math.max(...state.slides.map((s) => s.id)) + 1
          : 1,
    };
    dispatch({ type: "ADD_SLIDE", payload: newSlide });
  };

  const updateSlide = (id: number, updates: Partial<Slide>) => {
    dispatch({ type: "UPDATE_SLIDE", payload: { id, updates } });
  };

  const deleteSlide = (id: number) => {
    // If this slide was created on the server, call the server delete endpoint first
    const slide = state.slides.find((s) => s.id === id);
    if (slide && slide.serverId) {
      // call server delete, then update local state
      (async () => {
        try {
          await deleteSlideById(slide.serverId as string);
        } catch (error) {
          console.error("Error deleting slide on server:", error);
        } finally {
          dispatch({ type: "DELETE_SLIDE", payload: id });
        }
      })();
    } else {
      dispatch({ type: "DELETE_SLIDE", payload: id });
    }
  };

  const duplicateSlide = (id: number) => {
    dispatch({ type: "DUPLICATE_SLIDE", payload: id });
  };

  const nextSlide = () => {
    if (state.currentSlideIndex < state.slides.length - 1) {
      dispatch({
        type: "SET_CURRENT_SLIDE_INDEX",
        payload: state.currentSlideIndex + 1,
      });
      dispatch({
        type: "SET_ACTIVE_SLIDE",
        payload: state.slides[state.currentSlideIndex + 1].id,
      });
    }
  };

  const prevSlide = () => {
    if (state.currentSlideIndex > 0) {
      dispatch({
        type: "SET_CURRENT_SLIDE_INDEX",
        payload: state.currentSlideIndex - 1,
      });
      dispatch({
        type: "SET_ACTIVE_SLIDE",
        payload: state.slides[state.currentSlideIndex - 1].id,
      });
    }
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < state.slides.length) {
      dispatch({ type: "SET_CURRENT_SLIDE_INDEX", payload: index });
      dispatch({ type: "SET_ACTIVE_SLIDE", payload: state.slides[index].id });
    }
  };

  const exportPresentation = async (title?: string, userId?: string) => {
    // Export presentation by creating slides on the server, then creating a
    // presentation document that references those slides. Accepts optional
    // title and userId from the UI.
    dispatch({ type: "SET_EXPORTING", payload: true });
    try {
      // Prepare slides, uploading any data-URL images first so we only store URLs.
      const slidesToCreate: any[] = [];
      for (const s of state.slides) {
        const slideCopy: any = {
          title: s.title,
          subtitle: s.subTitle || s.subTitle === undefined ? s.subTitle : "",
          content: s.content,
          image: s.image,
          layout: s.layout,
          backgroundColor: s.backgroundColor || "#ffffff",
        };

        if (typeof slideCopy.image === "string" && slideCopy.image.startsWith("data:")) {
          try {
            const dataUrl = slideCopy.image;
            const parts = dataUrl.split(",");
            const meta = parts[0];
            const base64 = parts[1];
            const mimeMatch = meta.match(/data:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : "image/png";
            const binary = atob(base64);
            const len = binary.length;
            const u8 = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              u8[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([u8], { type: mime });
            const fileName = `upload-${Date.now()}.${mime.split("/")[1] || "png"}`;
            const file = new File([blob], fileName, { type: mime });
            const uploadedUrl = await uploadImage(file);
            if (typeof uploadedUrl === "string") {
              slideCopy.image = uploadedUrl;
            }
          } catch (err) {
            console.error("Failed to upload embedded image for slide:", err);
            // keep the original image (data URL) if upload fails; server may reject large payloads
          }
        }

        slidesToCreate.push(slideCopy);
      }

      const created = await bulkCreateSlides(slidesToCreate);

      // created is an array of slide documents returned from the server; extract their IDs
      const slideIds = created.map((s: any) => s._id || s.id || s);

      // If a title or userId was provided, create a presentation document on the server
      if (title || userId) {
        try {
          await createPresentation({
            title: title || "Untitled",
            userId,
            slides: slideIds,
          });
        } catch (err) {
          console.error("Error creating presentation on server:", err);
        }
      }
    } catch (error) {
      console.error("Error exporting slides to server:", error);
      throw error;
    } finally {
      dispatch({ type: "SET_EXPORTING", payload: false });
    }
  };

  const importPresentation = async (file: File): Promise<void> => {
    dispatch({ type: "SET_IMPORTING", payload: true });
    try {
      const text = await file.text();
      const importedSlides = JSON.parse(text);
      if (Array.isArray(importedSlides)) {
        // Create slides on the server and then load the saved slides back
        const prepared = importedSlides.map((slide) => ({
          title: slide.title || slide.title === undefined ? slide.title : "",
          subtitle:
            slide.subTitle || slide.subTitle === undefined
              ? slide.subTitle
              : slide.subtitle || "",
          content: slide.content || "",
          image: slide.image || "",
          layout: slide.layout || "",
          backgroundColor: slide.backgroundColor || "#ffffff",
        }));
        const created = await bulkCreateSlides(prepared);
        // map server-created slides to local Slide shape, using returned _id or generated id
        const updatedSlides = created.map((s: any, idx: number) => ({
          id: idx + 1,
          title: s.title || "",
          subTitle: s.subtitle || s.subTitle || "",
          content: s.content || "",
          image: s.image || "",
          layout: s.layout || "",
          backgroundColor: s.backgroundColor || "#ffffff",
        }));
        dispatch({ type: "SET_SLIDES", payload: updatedSlides });
        dispatch({
          type: "SET_ACTIVE_SLIDE",
          payload: updatedSlides.length > 0 ? updatedSlides[0].id : null,
        });
      }
    } catch (error) {
      console.error("Error importing file:", error);
      throw new Error(
        "Failed to import presentation. Please check the file format."
      );
    } finally {
      dispatch({ type: "SET_IMPORTING", payload: false });
    }
  };

  const setCurrentSlideId = (id: number) => {
    dispatch({ type: "SET_CURRENT_SLIDE_ID", payload: id });
  };

  const value: PresentationContextType = {
    state,
    dispatch,
    addSlide,
    updateSlide,
    deleteSlide,
    duplicateSlide,
    nextSlide,
    prevSlide,
    goToSlide,
    exportPresentation,
    importPresentation,
    setCurrentSlideId, // ✅ added
  };

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentation() {
  const context = useContext(PresentationContext);
  if (context === undefined) {
    throw new Error(
      "usePresentation must be used within a PresentationProvider"
    );
  }
  return context;
}
