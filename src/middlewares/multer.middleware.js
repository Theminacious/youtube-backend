import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Set the upload directory
  },
  filename: function (req, file, cb) {
    
    cb(null, file.fieldname);
  },
});

// Initialize upload
export const upload = multer({ storage: storage });

