from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MemoryFragmentResponse(BaseModel):
    id: str
    memory_key: str
    title: str
    content: str
    integrity: float
    chapter: str
    discovered: bool = False
    discovered_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MemoryDiscoveryResponse(BaseModel):
    success: bool
    memory: MemoryFragmentResponse
    message: str
