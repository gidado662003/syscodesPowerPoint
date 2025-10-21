"use client";
import { usePresentation } from "@/contexts/PresentationContext";
import { useState, useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FaPlay,
  FaExpand,
  FaFolderOpen,
  FaSave,
  FaPlus,
  FaTimes,
  FaBars,
  FaTh,
} from "react-icons/fa";
import { MdOutlineEditNote } from "react-icons/md";
import { AiOutlineEye } from "react-icons/ai";
import { getUsers, getAllPresentations } from "@/api/api";

// Reusable Button Component
const ToolbarButton = ({
  icon,
  text,
  onClick,
  disabled = false,
  title,
  variant = "default",
  className = "",
  active = false,
}: {
  icon: React.ReactNode;
  text?: string;
  onClick?: () => void;
  disabled?: boolean;
  title: string;
  variant?: "default" | "primary" | "secondary" | "danger";
  className?: string;
  active?: boolean;
}) => {
  const baseStyles =
    "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 shadow-sm";
  const disabledStyles = "disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    default: active
      ? "bg-blue-600 text-white"
      : "bg-gray-700 hover:bg-gray-600 text-white",
    primary: "bg-green-600 hover:bg-green-700 text-white",
    secondary: "bg-blue-600 hover:blue-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
      title={title}
    >
      {icon}
      {text && <span className="hidden sm:inline text-sm">{text}</span>}
    </button>
  );
};

interface ToolbarProps {
  onToggleSidebar: () => void;
  onToggleThumbnails: () => void;
  sidebarOpen: boolean;
  thumbnailsOpen: boolean;
}

export function Toolbar({
  onToggleSidebar,
  onToggleThumbnails,
  sidebarOpen,
  thumbnailsOpen,
}: ToolbarProps) {
  const {
    state,
    dispatch,
    exportPresentation,
    importPresentation,
    loadPresentationById,
    importPptxFile,
  } = usePresentation();
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<any[]>([]);
  console.log("Users:", users);
  const [presentations, setPresentations] = useState<any>([]);
  const [presentationTitle, setPresentationTitle] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const users = await getUsers();
        const presentations = await getAllPresentations();
        setUsers(users);
        setPresentations(presentations);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }
    fetchUsers();
  }, []);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importPresentation(file);
      setImportError(null);
    } catch (error: any) {
      setImportError(error.message || "Failed to import file.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === "application/json") {
      try {
        await importPresentation(file);
        setImportError(null);
      } catch (error: any) {
        setImportError(error.message || "Failed to import file.");
      }
    } else {
      setImportError("Invalid file type. Please drop a .json file.");
    }
  };

  const handleNewPresentation = () => {
    if (
      window.confirm(
        "Are you sure you want to start a new presentation? All unsaved changes will be lost."
      )
    ) {
      dispatch({ type: "SET_SLIDES", payload: [] });
      dispatch({ type: "SET_CURRENT_SLIDE_INDEX", payload: 0 });
    }
  };

  const handleExportAndSubmit = async () => {
    // Validate title and user selection before exporting
    if (!presentationTitle || presentationTitle.trim() === "") {
      setImportError("Please enter a presentation title before exporting.");
      return;
    }
    if (!selectedUserId) {
      setImportError("Please select a user before exporting.");
      return;
    }

    try {
      await exportPresentation(presentationTitle.trim(), selectedUserId);
      setImportError(null);
      // Optionally give user feedback; using alert for now
      window.alert("Presentation exported successfully.");
    } catch (err: any) {
      console.error("Export failed:", err);
      setImportError(err?.message || "Failed to export presentation.");
    }
  };

  return (
    <div
      className="bg-gray-800/90 backdrop-blur-lg border-b border-blue-500/20 p-3"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Toggle controls */}
        <div className="flex items-center space-x-2">
          <ToolbarButton
            icon={<FaBars />}
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Hide Editor" : "Show Editor"}
            active={sidebarOpen}
          />
          <ToolbarButton
            icon={<FaTh />}
            onClick={onToggleThumbnails}
            title={thumbnailsOpen ? "Hide Thumbnails" : "Show Thumbnails"}
            active={thumbnailsOpen}
          />
        </div>

        {/* Center - Presentation controls */}
        <div className="flex items-center space-x-2">
          <ToolbarButton
            icon={<FaPlay />}
            text="Preview"
            onClick={() =>
              dispatch({
                type: "SET_PREVIEW_MODE",
                payload: !state.previewMode,
              })
            }
            title={state.previewMode ? "Exit Preview" : "Preview Presentation"}
            disabled={state.slides.length === 0}
            variant={state.previewMode ? "primary" : "default"}
          />
          <ToolbarButton
            icon={<FaExpand />}
            text="Fullscreen"
            onClick={() =>
              dispatch({ type: "SET_FULLSCREEN", payload: !state.fullscreen })
            }
            title={state.fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            disabled={state.slides.length === 0}
            variant={state.fullscreen ? "primary" : "default"}
          />

          {/* Page indicator */}
          <div className="text-white text-sm font-medium min-w-[60px] text-center bg-gray-700 py-1 px-3 rounded-lg">
            {state.slides.length > 0
              ? `${state.currentSlideIndex + 1} / ${state.slides.length}`
              : "0 / 0"}
          </div>
        </div>

        {/* Right side - File operations */}
        <div className="flex items-center space-x-2">
          <ToolbarButton
            icon={<FaPlus />}
            text="New"
            onClick={handleNewPresentation}
            title="Start New Presentation"
            variant="default"
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <ToolbarButton
                icon={<FaFolderOpen />}
                text={state.importing ? "Importing..." : "Import"}
                // onClick={() => fileInputRef.current?.click()}
                // disabled={state.importing}
                title="Import Presentation"
                variant="secondary"
              />
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Select Presentation</AlertDialogTitle>
                <AlertDialogDescription></AlertDialogDescription>
              </AlertDialogHeader>
              {presentations.length === 0 ? (
                <AlertDialogDescription>
                  No presentations available.
                </AlertDialogDescription>
              ) : (
                <AlertDialogDescription>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {presentations.map((presentation: any) => (
                      <div
                        key={presentation._id || presentation.id}
                        className="p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={async () => {
                          try {
                            setImportError(null);
                            const presentationId =
                              presentation._id || presentation.id;
                            if (presentationId) {
                              await loadPresentationById(presentationId);
                              // Close the dialog after successful load
                              const dialog =
                                document.querySelector('[role="dialog"]');
                              if (dialog) {
                                const cancelButton = dialog.querySelector(
                                  '[data-state="open"]'
                                );
                                if (cancelButton) {
                                  (cancelButton as HTMLElement).click();
                                }
                              }
                            }
                          } catch (error: any) {
                            console.error("Error loading presentation:", error);
                            setImportError(
                              error.message || "Failed to load presentation"
                            );
                          }
                        }}
                      >
                        <h3 className="font-medium">{presentation.title}</h3>
                        <p className="text-sm text-gray-600">
                          Created by: {presentation.user?.name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Slides:{" "}
                          {Array.isArray(presentation.slides)
                            ? presentation.slides.length
                            : 0}
                        </p>
                      </div>
                    ))}
                  </div>
                </AlertDialogDescription>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-medium mb-2">Import from PPTX</div>
                <input
                  type="file"
                  accept=".pptx"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setImportError(null);
                      await importPptxFile(file, {
                        title: presentationTitle || undefined,
                        userId: selectedUserId || undefined,
                      });
                    } catch (err: any) {
                      console.error("PPTX import failed:", err);
                      setImportError(
                        err?.message || "Failed to import PPTX file"
                      );
                    } finally {
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }
                  }}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleExportAndSubmit}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <ToolbarButton
                icon={<FaSave />}
                text={state.exporting ? "Exporting..." : "Export"}
                disabled={state.exporting || state.slides.length === 0}
                title="Export Presentation"
                variant="primary"
              />
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Presentation</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="space-y-4">
                    {/* Presentation title */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Presentation Title
                      </label>
                      <input
                        type="text"
                        placeholder="Enter title..."
                        value={presentationTitle}
                        onChange={(e) => setPresentationTitle(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                      />
                    </div>

                    {/* User selection */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Created by
                      </label>
                      <Select
                        onValueChange={(value) => setSelectedUserId(value)}
                        value={selectedUserId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user: any) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleExportAndSubmit}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Import Error Message */}
      {importError && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 rounded-b-lg bg-red-600 text-white text-center text-sm flex items-center justify-center shadow-lg">
          <FaTimes
            className="mr-2 cursor-pointer"
            onClick={() => setImportError(null)}
          />
          <span>{importError}</span>
        </div>
      )}
    </div>
  );
}
