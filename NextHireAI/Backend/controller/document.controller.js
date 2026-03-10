const documentModel = require("../models/document.model");
const uploadFile = require("../service/storage.service");
const axios = require("axios");

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No document file uploaded" });
    }

    const { title, category } = req.body;

    if (!title || !category) {
      return res
        .status(400)
        .json({ message: "Title and Category are required" });
    }

    const uploaded = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "/NextHireAI/documents/" + category.toLowerCase().replace(/\s+/g, "_"),
    );

    const document = await documentModel.create({
      userId: req.user.id,
      title,
      category,
      fileUrl: uploaded.url,
      fileName: req.file.originalname,
      // Use the mimeType echoed back by the storage service (most reliable source)
      mimeType: uploaded.mimeType || req.file.mimetype || "",
      size: req.file.size || 0,
    });

    return res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error("uploadDocument error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const documents = await documentModel
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    return res.status(200).json({ documents });
  } catch (error) {
    console.error("getMyDocuments error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await documentModel.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("deleteDocument error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const viewDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch document from database
    const document = await documentModel.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Fetch file from ImageKit using the stored URL
    const response = await axios.get(document.fileUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "NextHireAI-Server/1.0",
      },
    });

    // Set appropriate headers for preview
    const mimeType = document.mimeType || "application/octet-stream";
    res.set({
      "Content-Type": mimeType,
      "Content-Disposition": 'inline; filename="' + document.fileName + '"',
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    });

    if (response.headers["content-length"]) {
      res.set("Content-Length", response.headers["content-length"]);
    }

    return res.send(response.data);
  } catch (error) {
    console.error("viewDocument error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  uploadDocument,
  getMyDocuments,
  deleteDocument,
  viewDocument,
};
