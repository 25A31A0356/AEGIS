import pytest
from httpx import AsyncClient
from backend.app.main import app

@pytest.mark.anyio
async def test_get_hazards_default_english(async_client: AsyncClient):
    response = await async_client.get("/api/v1/safety/hazards")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    hazards = res["data"]
    assert len(hazards) >= 4
    
    flood = next((h for h in hazards if h["id"] == "flood"), None)
    assert flood is not None
    assert flood["title"] == "Floods & Flash Floods"
    assert len(flood["dos"]) > 0
    assert len(flood["donts"]) > 0

@pytest.mark.anyio
async def test_get_hazards_telugu(async_client: AsyncClient):
    response = await async_client.get("/api/v1/safety/hazards?language=te")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    
    hazards = res["data"]
    flood = next((h for h in hazards if h["id"] == "flood"), None)
    assert flood is not None
    assert flood["title"] == "????? & ??????? ?????"
    assert len(flood["dos"]) > 0

@pytest.mark.anyio
async def test_get_single_hazard(async_client: AsyncClient):
    response = await async_client.get("/api/v1/safety/hazards/earthquake?language=te")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["id"] == "earthquake"
    assert data["title"] == "??????"
    assert len(data["dos"]) > 0
    assert len(data["donts"]) > 0