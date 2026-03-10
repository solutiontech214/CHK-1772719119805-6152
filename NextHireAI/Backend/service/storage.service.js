const ImageKit = require("@imagekit/nodejs");

const client = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const uploadFile = async (
  buffer,
  fileName,
  mimetype,
  folder = "/NextHireAI/uploads",
) => {
  console.log(`[Storage] Uploading ${fileName} (${buffer.length} bytes)...`);
  try {
    const response = await client.files.upload({
      file: buffer.toString("base64"),
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
    });
    console.log(`[Storage] Upload success: ${response.url}`);
    return response;
  } catch (err) {
    console.error(`[Storage] Upload failed: ${err.message}`);
    throw err;
  }
};

module.exports = uploadFile;
