import { Router, type IRouter } from "express";
import multer from "multer";
// Import the inner lib directly to avoid pdf-parse@1.x loading a test file at startup
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

router.post(
  "/pdf/extract",
  requireAuth,
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No PDF file uploaded" });
      return;
    }

    try {
      const data = await pdfParse(req.file.buffer);
      const text = data.text.trim();

      if (!text) {
        res.status(422).json({
          error:
            "Could not extract text from this PDF. It may be a scanned image without selectable text.",
        });
        return;
      }

      res.json({
        text,
        pageCount: data.numpages,
        fileName: req.file.originalname,
      });
    } catch (err) {
      req.log.error({ err }, "PDF parse error");
      res.status(422).json({
        error:
          "Failed to parse PDF. The file may be corrupted or password-protected.",
      });
    }
  }
);

export default router;
