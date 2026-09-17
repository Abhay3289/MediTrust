from datetime import datetime
from pydantic import BaseModel, Field
class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=2, max_length=2000)
class ReviewResponse(BaseModel):
    id: int
    user_id: int
    rating: int
    comment: str
    reviewer_name: str | None = None
    created_at: datetime
    model_config = {"from_attributes": True}
