from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from schemas import TicketRequest
from auth import decode_token
import joblib
import numpy as np

router = APIRouter(tags=["predict"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

model       = joblib.load("model.joblib")
vectorizer  = joblib.load("vectorizer.joblib")
label_names = joblib.load("label_names.joblib")

@router.post("/predict")
def predict(
    req: TicketRequest,
    token: str = Depends(oauth2_scheme)
):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    vec        = vectorizer.transform([req.text])
    prediction = model.predict(vec)[0]
    confidence = float(np.max(model.predict_proba(vec)))

    return {
        "category":   prediction,
        "confidence": round(confidence * 100, 2),
    }

@router.get("/categories")
def get_categories(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"categories": list(model.classes_)}