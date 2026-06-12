from pydantic import BaseModel
from datetime import datetime

class ServiceRoleBase(BaseModel):
    name: str

class ServiceRoleCreate(ServiceRoleBase):
    pass

class ServiceRoleUpdate(ServiceRoleBase):
    pass

import uuid

class ServiceRoleResponse(ServiceRoleBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        orm_mode = True
