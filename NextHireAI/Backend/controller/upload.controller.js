const {
  certificationModel,
  marksheetModel,
  impDocModel,
} = require("../models/certification.model");
const uploadFile = require("../service/storage.service");

const uploadCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const uploadedFile = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "/NextHireAI/certificates",
    );

    const certificate = await certificationModel.create({
      description: req.body.description,
      url: uploadedFile.url,
    });

    res.status(201).json({
      message: "Certificate uploaded successfully",
      data: certificate,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const uploadMarksheet = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const uploadedFile = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "/NextHireAI/marksheets",
    );

    const marksheet = await marksheetModel.create({
      description: req.body.description,
      url: uploadedFile.url,
    });

    res.status(201).json({
      message: "Marksheet uploaded successfully",
      data: marksheet,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const uploadDocs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const uploadedFile = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "/NextHireAI/documents",
    );

    const document = await impDocModel.create({
      description: req.body.description,
      url: uploadedFile.url,
    });

    res.status(201).json({
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  uploadCertificate,
  uploadMarksheet,
  uploadDocs,
};
