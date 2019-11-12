const sharp = require('sharp');

const recipeImageStorage = async (image, time) => {
  const recipeImageUploaded = await sharp(image.buffer).toFile(`images/recipeImages/${time}-${image.originalname}`);
  return recipeImageUploaded;
};

const profileImageStorage = async (image, time) => {
  const profileImageUploaded = await sharp(image.buffer).resize(320, 240).toFile(`images/profileImages/${time}-${image.originalname}`);
  return profileImageUploaded;
};

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

module.exports = {
  recipeImageStorage,
  profileImageStorage,
  fileFilter
};
