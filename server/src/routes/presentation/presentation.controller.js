const Presentation = require("../../models/presentation.schema");
const Slide = require("../../models/slides.schema");
const fs = require("fs");
const path = require("path");

// Lazy-loaded libs for PPTX parsing (require installation: jszip, xml2js)
let JSZip;
let xml2js;

async function createPresentation(req, res) {
  try {
    const { title, userId, slides } = req.body;
    const newPresentation = new Presentation({ title, userId, slides });
    const savedPresentation = await newPresentation.save();
    res.status(201).json(savedPresentation);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
async function getAllPresentations(req, res) {
  try {
    const presentations = await Presentation.find().populate("slides");
    res.status(200).json(presentations);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
async function getPresentationById(req, res) {
  try {
    const { id } = req.params;
    const presentation = await Presentation.findById(id).populate("slides");
    if (!presentation) {
      return res.status(404).json({ message: "Presentation not found" });
    }
    res.status(200).json(presentation);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = {
  createPresentation,
  getAllPresentations,
  getPresentationById,
  importPptx,
};

async function importPptx(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PPTX file uploaded" });
    }

    // Load libraries lazily to avoid startup cost
    try {
      JSZip = JSZip || require("jszip");
      xml2js = xml2js || require("xml2js");
    } catch (e) {
      return res.status(500).json({
        message:
          "PPTX import requires 'jszip' and 'xml2js'. Please install them in the server: npm i jszip xml2js",
        error: e.message,
      });
    }

    const uploadPath = req.file.path; // absolute path to uploaded pptx
    const buffer = fs.readFileSync(uploadPath);

    const zip = await JSZip.loadAsync(buffer);

    // Collect slide XML files under ppt/slides/slideN.xml
    const slideFileEntries = Object.keys(zip.files)
      .filter((f) => f.startsWith("ppt/slides/slide") && f.endsWith(".xml"))
      .sort((a, b) => {
        // sort numerically by slide number
        const getNum = (p) =>
          parseInt(p.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
        return getNum(a) - getNum(b);
      });

    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
    });

    const createdSlideIds = [];

    // Array of background colors to cycle through for visual variety
    const backgroundColors = [
      "#1e293b", // Dark slate
      "#0f172a", // Slate
      "#1f2937", // Gray
      "#374151", // Dark gray
      "#4b5563", // Medium gray
      "#6b7280", // Light gray
    ];

    for (let i = 0; i < slideFileEntries.length; i++) {
      const slidePath = slideFileEntries[i];
      const file = zip.files[slidePath];
      if (!file) continue;
      const xmlContent = await file.async("string");
      const slideJson = await parser.parseStringPromise(xmlContent);

      // Extract text runs: p:spTree -> p:sp -> p:txBody -> a:p -> a:r -> a:t
      const texts = [];
      const collectText = (node) => {
        if (!node) return;
        // paragraph with runs
        const paras = Array.isArray(node) ? node : [node];
        for (const p of paras) {
          // Handle regular text runs
          const runs = p?.["a:r"]; // can be object or array or undefined
          if (runs) {
            const runsArr = Array.isArray(runs) ? runs : [runs];
            const joined = runsArr
              .map((r) => (r && r["a:t"] ? String(r["a:t"]) : ""))
              .join("");
            if (joined.trim()) texts.push(joined.trim());
          }
          // Handle field runs (like slide numbers, dates)
          else if (p?.["a:fld"] && p?.["a:fld"]["a:r"]) {
            const fldRuns = Array.isArray(p["a:fld"]["a:r"])
              ? p["a:fld"]["a:r"]
              : [p["a:fld"]["a:r"]];
            const joined = fldRuns
              .map((r) => (r && r["a:t"] ? String(r["a:t"]) : ""))
              .join("");
            if (joined.trim()) texts.push(joined.trim());
          }
          // Handle direct text content
          else if (p?.["a:t"]) {
            const text = String(p["a:t"]);
            if (text.trim()) texts.push(text.trim());
          }
        }
      };

      try {
        const spTree = slideJson?.["p:sld"]?.["p:cSld"]?.["p:spTree"];
        const shapes = spTree?.["p:sp"];
        const shapesArr = Array.isArray(shapes)
          ? shapes
          : shapes
          ? [shapes]
          : [];

        for (const shape of shapesArr) {
          const tx = shape?.["p:txBody"]?.["a:p"];
          if (tx) collectText(tx);
        }
      } catch (_) {
        // ignore extraction errors for a slide; continue best-effort
      }

      const title = texts[0] || "";
      const contentItems = texts.slice(1);

      // Determine layout based on content structure
      let layout = "content-only";
      if (title && contentItems.length > 0) {
        layout = "title-content";
      } else if (title && contentItems.length === 0) {
        layout = "title-content";
      } else if (!title && contentItems.length > 0) {
        layout = "content-only";
      }

      // Construct HTML content
      let contentHtml = "";
      if (contentItems.length > 0) {
        // If we have multiple items, create a list
        if (contentItems.length > 1) {
          contentHtml = `<ul>${contentItems
            .map((t) => `<li>${escapeHtml(t)}</li>`)
            .join("")}</ul>`;
        } else {
          // Single content item, just display as paragraph
          contentHtml = `<p>${escapeHtml(contentItems[0])}</p>`;
        }
      }

      // Use a dark background for better contrast with white text
      // Cycle through background colors for visual variety
      const backgroundColor = backgroundColors[i % backgroundColors.length];

      const slideDoc = new Slide({
        title: title || "Untitled Slide",
        subtitle: "",
        content: contentHtml,
        image: "",
        layout,
        backgroundColor,
      });
      const saved = await slideDoc.save();
      createdSlideIds.push(saved._id);
    }

    // Create a presentation referencing these slides
    const title =
      req.body?.title ||
      path.basename(req.file.originalname, path.extname(req.file.originalname));
    const userId = req.body?.userId ? Number(req.body.userId) : undefined;
    const pres = new Presentation({ title, userId, slides: createdSlideIds });
    const savedPres = await pres.save();

    return res.status(201).json(savedPres);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
