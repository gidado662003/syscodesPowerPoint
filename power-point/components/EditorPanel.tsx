"use client";
import { useState, useMemo, useRef, useCallback, ChangeEvent } from "react";
import { uploadImage } from "@/api/api";
import { usePresentation } from "@/contexts/PresentationContext";
import dynamic from "next/dynamic";
import {
  FaPlus,
  FaTimes,
  FaImage,
  FaTextHeight,
  FaChevronDown,
  FaUpload,
} from "react-icons/fa";
import { MdOutlineTitle } from "react-icons/md";

// Debounce function
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Dynamically import JoditEditor to avoid SSR issues
const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-32 bg-gray-700 rounded-lg animate-pulse"></div>
  ),
});

interface EditorPanelProps {
  onClose: () => void;
}

const slideLayouts = [
  {
    id: "title-content-image",
    name: "Title, Content & Image",
    icon: <FaTextHeight />,
  },
  { id: "title-content", name: "Title & Content", icon: <MdOutlineTitle /> },
  { id: "content-only", name: "Content Only", icon: <FaTextHeight /> },
  { id: "image-left", name: "Image Left", icon: <FaImage /> },
  { id: "image-right", name: "Image Right", icon: <FaImage /> },
  { id: "two-column", name: "Two Column", icon: <FaTextHeight /> },
  { id: "centered", name: "Centered", icon: <MdOutlineTitle /> },
  { id: "split-screen", name: "Split Screen", icon: <FaImage /> },
];

export function EditorPanel({ onClose }: EditorPanelProps) {
  const { state, addSlide, updateSlide } = usePresentation();
  const activeSlide = state.slides.find((s) => s.id === state.activeSlide);
  const editorRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newSlideData, setNewSlideData] = useState({
    title: "",
    subTitle: "",
    content: "",
    image: "",
    layout: "title-content-image",
    backgroundColor: "#1e293b",
  });

  const [activeTab, setActiveTab] = useState("content");
  const [expandedSections, setExpandedSections] = useState({
    text: true,
    media: true,
    design: true,
  });

  const isEditing = !!activeSlide;
  const slideToEdit = isEditing ? activeSlide : newSlideData;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      if (isEditing && activeSlide) {
        updateSlide(activeSlide.id, { [field]: value });
      } else {
        setNewSlideData((prev) => ({ ...prev, [field]: value }));
      }
    },
    [isEditing, activeSlide, updateSlide]
  );

  const debouncedUpdate = useMemo(
    () =>
      debounce((field: string, value: string) => {
        handleFieldChange(field, value);
      }, 500),
    [handleFieldChange]
  );

  const handleEditorChange = (newContent: string) => {
    debouncedUpdate("content", newContent);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleFieldChange(name, value);
  };

  const handleLayoutChange = (layout: string) => {
    handleFieldChange("layout", layout);
  };

  const handleAddSlide = () => {
    addSlide(newSlideData);
    setNewSlideData({
      title: "",
      subTitle: "",
      content: "",
      image: "",
      layout: "title-content-image",
      backgroundColor: "#1e293b",
    });
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Debug logs
    console.log("Selected image file:", file.name, file.size, file.type);
    // Upload the file to the server and store the returned public URL
    (async () => {
      try {
        setUploadError("");
        setUploading(true);
        console.log("Uploading image to server...");
        const url = await uploadImage(file);
        console.log("Upload returned URL:", url);
        handleFieldChange("image", url);
      } catch (err: any) {
        console.error("Image upload failed:", err);
        setUploadError(err?.message || "Image upload failed");
        // Fallback: keep using data URL if upload fails
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            handleFieldChange("image", event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    })();
  };

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const removeImage = () => {
    handleFieldChange("image", "");
  };

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: "Enter your content here...",
      toolbarAdaptive: true,
      toolbarSticky: true,
      buttons:
        "bold,italic,underline,strikethrough,|,ul,ol,|,link,image,|,source,fullsize",
    }),
    []
  );

  return (
    <div className="h-full flex flex-col bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-blue-500/20">
        <h2 className="text-lg font-semibold text-white">
          {isEditing
            ? `Editing Slide ${
                state.slides.findIndex((s) => s.id === activeSlide?.id) + 1
              }`
            : "New Slide"}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded"
          title="Close editor"
        >
          <FaTimes />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-blue-500/20">
        {["content", "design", "settings"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "content" && (
          <>
            {/* Text Section */}
            <div className="bg-gray-700/50 rounded-lg overflow-hidden">
              <button
                className="w-full flex justify-between items-center p-3 text-left text-white font-medium"
                onClick={() => toggleSection("text")}
              >
                <span>Text Content</span>
                <FaChevronDown
                  className={`transition-transform ${
                    expandedSections.text ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.text && (
                <div className="p-3 space-y-3 border-t border-gray-600">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm text-gray-400 mb-1"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={slideToEdit.title || ""}
                      onChange={handleInputChange}
                      placeholder="Add a title..."
                      className="w-full px-3 py-2 bg-gray-600/70 border border-blue-500/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white placeholder-gray-400 text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subTitle"
                      className="block text-sm text-gray-400 mb-1"
                    >
                      Subtitle
                    </label>
                    <input
                      type="text"
                      id="subTitle"
                      name="subTitle"
                      value={slideToEdit.subTitle || ""}
                      onChange={handleInputChange}
                      placeholder="Add a subtitle..."
                      className="w-full px-3 py-2 bg-gray-600/70 border border-blue-500/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white placeholder-gray-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Content
                    </label>
                    <JoditEditor
                      ref={editorRef}
                      value={slideToEdit.content || ""}
                      config={config}
                      onBlur={(newContent: string) =>
                        handleEditorChange(newContent)
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Media Section */}
            <div className="bg-gray-700/50 rounded-lg overflow-hidden">
              <button
                className="w-full flex justify-between items-center p-3 text-left text-white font-medium"
                onClick={() => toggleSection("media")}
              >
                <span>Media</span>
                <FaChevronDown
                  className={`transition-transform ${
                    expandedSections.media ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedSections.media && (
                <div className="p-3 space-y-3 border-t border-gray-600">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Slide Image
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      aria-label="Upload slide image"
                    />

                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center space-x-2 w-full px-3 py-2 bg-blue-600/70 hover:bg-blue-600 border border-blue-500/30 rounded-lg text-white text-sm"
                      >
                        <FaUpload />
                        <span>
                          {uploading ? "Uploading..." : "Upload Image"}
                        </span>
                      </button>

                      {slideToEdit.image && (
                        <div className="relative mt-2">
                          <img
                            src={slideToEdit.image}
                            alt="Preview"
                            className="w-full h-32 object-contain rounded border border-blue-500/30"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <button
                            onClick={removeImage}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs"
                            title="Remove image"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      )}
                      {uploadError && (
                        <div className="text-sm text-red-400 mt-2">
                          {uploadError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "design" && (
          <div className="space-y-4">
            {/* Layout Selection */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <label className="block text-sm text-gray-400 mb-2">
                Slide Layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                {slideLayouts.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => handleLayoutChange(layout.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 text-xs ${
                      slideToEdit.layout === layout.id
                        ? "bg-blue-600 text-white shadow"
                        : "bg-gray-600 text-gray-400 hover:bg-gray-500"
                    }`}
                    title={layout.name}
                  >
                    <span className="text-lg mb-1">{layout.icon}</span>
                    <span className="text-center leading-tight">
                      {layout.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color Picker */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <label
                htmlFor="backgroundColor"
                className="block text-sm text-gray-400 mb-2"
              >
                Background Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  id="backgroundColor"
                  name="backgroundColor"
                  value={slideToEdit.backgroundColor || "#1e293b"}
                  onChange={handleInputChange}
                  className="w-10 h-10 rounded cursor-pointer border-none"
                  title="Choose a background color"
                />
                <span className="text-white text-sm">
                  {slideToEdit.backgroundColor}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="text-center text-gray-400 p-4">
            Slide settings coming soon...
          </div>
        )}
      </div>

      {/* Add Slide Button */}
      {!isEditing && (
        <div className="p-4 border-t border-blue-500/20">
          <button
            onClick={handleAddSlide}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow hover:shadow-md"
          >
            <FaPlus className="inline-block mr-2" />
            Add New Slide
          </button>
        </div>
      )}
    </div>
  );
}
