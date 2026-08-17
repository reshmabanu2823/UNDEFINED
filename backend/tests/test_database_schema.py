import uuid
import pytest
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import (
    User,
    PlayerProfile,
    GameSession,
    SaveSlot,
    WorldObject,
    Quest,
    QuestProgress,
    MemoryFragment,
    DiscoveredMemory,
    GameEvent,
)
from app.utils.security import get_password_hash


@pytest.mark.asyncio
async def test_full_database_schema():
    uid = uuid.uuid4().hex[:8]
    async with AsyncSessionLocal() as session:
        # 1. Create User
        test_user = User(
            username=f"operator_{uid}",
            email=f"operator_{uid}@nullroot.net",
            password_hash=get_password_hash("secure_neural_pass_00"),
        )
        session.add(test_user)
        await session.commit()
        await session.refresh(test_user)
        assert test_user.id is not None

        # 2. Create PlayerProfile
        profile = PlayerProfile(
            user_id=test_user.id,
            display_name=f"CORTEX_{uid}",
            system_integrity=100,
            corruption_level=21,
            debug_energy=100,
        )
        session.add(profile)

        # 3. Create GameSession
        game_session = GameSession(
            user_id=test_user.id,
            current_chapter="CHAPTER_00",
            current_sector="SECTOR_CORE_00",
            is_active=True,
        )
        session.add(game_session)
        await session.commit()
        await session.refresh(game_session)
        assert game_session.id is not None

        # 4. Create SaveSlot
        save = SaveSlot(
            user_id=test_user.id,
            game_session_id=game_session.id,
            save_name="BEFORE_CORRUPTION_OVERRIDE",
            slot_number=1,
            serialized_game_state={
                "door_01": {"permission": "ROOT", "locked": False},
                "corruption_level": 74,
            },
        )
        session.add(save)

        # 5. Create WorldObject
        door_obj = WorldObject(
            object_id="door_01",
            session_id=game_session.id,
            object_type="SECURITY_DOOR",
            state_json={"status": "LOCKED", "permission": "USER"},
        )
        session.add(door_obj)

        # 6. Create Quest & QuestProgress
        quest = Quest(
            quest_key=f"ACCESS_SECURITY_DOOR_{uid}",
            title="Access Security Door",
            description="Elevate permissions on door_01 to ROOT.",
            chapter="CHAPTER_00",
        )
        session.add(quest)
        await session.commit()
        await session.refresh(quest)

        quest_prog = QuestProgress(
            user_id=test_user.id,
            quest_id=quest.id,
            status="IN_PROGRESS",
            progress_json={"step": 1, "target": "door_01"},
        )
        session.add(quest_prog)

        # 7. Create MemoryFragment & DiscoveredMemory
        memory = MemoryFragment(
            memory_key=f"cortex_leak_{uid}",
            title="Cortex Leak Archive",
            content="NULL process memory logs uncovered in sector 00.",
            integrity=34.2,
            chapter="CHAPTER_00",
        )
        session.add(memory)
        await session.commit()
        await session.refresh(memory)

        disc_memory = DiscoveredMemory(
            user_id=test_user.id,
            memory_id=memory.id,
        )
        session.add(disc_memory)

        # 8. Create GameEvent
        event = GameEvent(
            session_id=game_session.id,
            event_type="NULL_CORRUPTION_SURGE",
            payload_json={"from_level": 21, "to_level": 74, "trigger": "door_01_root"},
        )
        session.add(event)

        await session.commit()

        # 9. Verify Queries and Relationships
        # Query User by username
        user_res = await session.execute(
            select(User).where(User.username == f"operator_{uid}")
        )
        queried_user = user_res.scalars().first()
        assert queried_user is not None
        assert queried_user.email == f"operator_{uid}@nullroot.net"

        # Query Quest by quest_key
        quest_res = await session.execute(
            select(Quest).where(Quest.quest_key == f"ACCESS_SECURITY_DOOR_{uid}")
        )
        queried_quest = quest_res.scalars().first()
        assert queried_quest is not None
        assert queried_quest.title == "Access Security Door"

        # Query Memory by memory_key
        mem_res = await session.execute(
            select(MemoryFragment).where(MemoryFragment.memory_key == f"cortex_leak_{uid}")
        )
        queried_mem = mem_res.scalars().first()
        assert queried_mem is not None
        assert queried_mem.integrity == 34.2
