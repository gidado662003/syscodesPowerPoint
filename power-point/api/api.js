import axios from "axios";

const frontendApiOrigin =
  process.env.NEXT_PUBLIC_API_ORIGIN || "http://10.0.0.253:5001";
const api = axios.create({
  baseURL: `${frontendApiOrigin}/api`,
});
const serverOrigin = frontendApiOrigin;
export async function createSlide(slide) {
  const response = await api.post("/slides", slide);
  return response.data;
}
// Removed LaravelApi stub; use main `api` to call backend endpoints.
const LaravelApi = axios.create({
  baseURL: "http://localhost:8000/api", // backend server
});
export async function bulkCreateSlides(slides) {
  // Create slides on the server in parallel. The server does not provide a bulk endpoint,
  // so we POST each slide individually.
  const promises = slides.map((slide) => api.post("/slides", slide));
  const results = await Promise.all(promises);
  return results.map((r) => r.data);
}
export async function getAllSlides() {
  const response = await api.get("/slides");
  return response.data;
}
export async function getSlideById(id) {
  const response = await api.get(`/slides/${id}`);
  return response.data;
}
export async function updateSlideById(id, slide) {
  const response = await api.put(`/slides/${id}`, slide);
  return response.data;
}
export async function deleteSlideById(id) {
  const response = await api.delete(`/slides/${id}`);
  return response.data;
}

export async function getAllPresentations() {
  const response = await api.get("/presentations");
  return response.data;
}

export async function getPresentationById(id) {
  const response = await api.get(`/presentations/${id}`);
  return response.data;
}

export async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  const response = await api.post("/slides/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // server returns { url: '/uploads/filename' }
  const data = response.data;
  return data.url ? `${serverOrigin}${data.url}` : data;
}

export async function createPresentation(presentation) {
  const response = await api.post("/presentations", presentation);
  return response.data;
}

export async function getUsers() {
  const response = await LaravelApi.get("/inventory/users");
  return response.data.data;
}

// Import a PPTX file to the server. Expects the server route
// POST /api/presentations/import-pptx with multipart/form-data (field: "file").
export async function importPptxToServer(file, opts = {}) {
  const form = new FormData();
  form.append("file", file);
  if (opts.title) form.append("title", String(opts.title));
  if (opts.userId) form.append("userId", String(opts.userId));
  const response = await api.post("/presentations/import-pptx", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
