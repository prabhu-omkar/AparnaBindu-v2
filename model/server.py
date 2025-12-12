from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
from predict_single_image import get_model, load_and_preprocess_image, predict_single_image

app = FastAPI()

# Allow CORS so the React frontend can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = None

# This runs once when the server starts
@app.on_event("startup")
async def load_ml_model():
    global model
    print(f"Loading model on {device}...")
    # NOTE: Ensure this matches the checkpoint filename exactly
    model = get_model("kolam_convnext_vit_best(early).pth", device)
    print("Model loaded successfully!")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Read the uploaded image file as bytes
        image_bytes = await file.read()
        
        # Preprocess the image directly from memory (no saving to disk!)
        tensor = load_and_preprocess_image(image_bytes)
        
        # Run inference
        class_name, conf = predict_single_image(model, tensor, device)
        
        return {
            "success": True, 
            "prediction": class_name,
            "confidence": conf,
            "filename": file.filename
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Start the server on port 8000
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
