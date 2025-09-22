"use client";
import { PresentationView } from "./PresentationView";

// This is a backward compatibility wrapper for the old PowerPoint component
// The new structure uses PresentationView directly
export default function PowerPoint() {
  return <PresentationView />;
}