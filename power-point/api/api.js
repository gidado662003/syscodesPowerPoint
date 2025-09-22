import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // backend server
});
const serverOrigin = "http://localhost:5000";
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
