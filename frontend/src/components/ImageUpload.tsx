import React, { useState } from "react";

const ImageUploader = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handler for when a file is selected
  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (file && file.type.substring(0, 5) === "image") {
      setImageFile(file);
      // Create a temporary URL for preview
      if (event.target.files && event.target.files.length > 0) {
        setPreviewUrl(URL.createObjectURL(file));
      }
    } else {
      setImageFile(null);
      setPreviewUrl(null);
    }
  };

  // Handler for the upload button (sending to server)
  const handleUpload = async () => {
    if (!imageFile) return;

    const formData = new FormData();
    // The key 'image' should match what your backend expects
    formData.append("image", imageFile);

    try {
      // Replace with your actual server endpoint
      const response = await fetch("YOUR_UPLOAD_ENDPOINT", {
        method: "POST",
        body: formData,
        // Axios automatically handles 'Content-Type': 'multipart/form-data' header;
        // with fetch, it's often best to omit it and let the browser set it correctly
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Upload successful:", data);
        // Handle success (e.g., show success message, update UI)
      } else {
        console.error("Upload failed");
      }
    } catch (error) {
      console.error("Error during upload:", error);
    }
  };

  return (
    <div>
      <h2>Upload Image</h2>
      <input
        type="file"
        accept="image/*" // Restrict to image files
        onChange={handleFileChange}
      />

      {previewUrl && (
        <div>
          <h3>Preview:</h3>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: "250px" }} />
          <br />
          <button onClick={handleUpload}>Upload Image to Server</button>
          <button
            onClick={() => {
              setImageFile(null);
              setPreviewUrl(null);
            }}
          >
            Remove Preview
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
