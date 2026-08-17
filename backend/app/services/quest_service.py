import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.quest import Quest, QuestProgress
from app.schemas.quest import QuestResponse, ObjectiveItem
from app.websocket.connection_manager import ws_manager
from app.utils.logger import logger

INITIAL_QUEST_KEY = "ACCESS_SECTOR_02"
INITIAL_QUEST_TITLE = "Access Sector 02"
INITIAL_QUEST_DESC = "Breach security protocols, escalate permissions to ROOT, and access Sector 02."

DEFAULT_OBJECTIVES = [
    {"id": "FIND_TERMINAL_01", "label": "Find terminal_01", "status": "IN_PROGRESS"},
    {"id": "ACCESS_DOOR_01", "label": "Access door_01", "status": "LOCKED"},
    {"id": "GAIN_ROOT_PERMISSION", "label": "Gain ROOT permission", "status": "LOCKED"},
    {"id": "ENTER_SECTOR_02", "label": "Enter Sector 02", "status": "LOCKED"},
]


async def ensure_initial_quest(db: AsyncSession) -> Quest:
    stmt = select(Quest).where(Quest.quest_key == INITIAL_QUEST_KEY)
    res = await db.execute(stmt)
    quest = res.scalars().first()

    if not quest:
        quest = Quest(
            id=str(uuid.uuid4()),
            quest_key=INITIAL_QUEST_KEY,
            title=INITIAL_QUEST_TITLE,
            description=INITIAL_QUEST_DESC,
            chapter="CHAPTER_01",
        )
        db.add(quest)
        await db.commit()
        await db.refresh(quest)
    return quest


def format_quest_response(quest: Quest, progress: Optional[QuestProgress]) -> QuestResponse:
    prog_json = progress.progress_json if progress and progress.progress_json else {}
    objectives_data = prog_json.get("objectives", DEFAULT_OBJECTIVES)

    objs: List[ObjectiveItem] = [
        ObjectiveItem(id=o["id"], label=o["label"], status=o.get("status", "LOCKED"))
        for o in objectives_data
    ]

    completed_count = sum(1 for o in objs if o.status == "COMPLETED")
    percent = round((completed_count / max(1, len(objs))) * 100.0, 1)

    current_obj = "Access Sector 02"
    for o in objs:
        if o.status in ["IN_PROGRESS", "CORRUPTED"]:
            current_obj = o.label
            break

    status_str = progress.status if progress else "IN_PROGRESS"
    if completed_count == len(objs):
        status_str = "COMPLETED"
        current_obj = "SECTOR 02 ACCESSED"

    return QuestResponse(
        id=quest.id,
        quest_key=quest.quest_key,
        title=quest.title,
        description=quest.description,
        chapter=quest.chapter,
        status=status_str,
        current_objective=current_obj,
        objectives=objs,
        progress_percent=percent,
    )


async def get_all_quests(
    db: AsyncSession, user_id: Optional[str] = None
) -> List[QuestResponse]:
    await ensure_initial_quest(db)
    stmt = select(Quest).order_by(Quest.created_at.asc())
    res = await db.execute(stmt)
    quests = res.scalars().all()

    progress_map: Dict[str, QuestProgress] = {}
    if user_id:
        p_stmt = select(QuestProgress).where(QuestProgress.user_id == user_id)
        p_res = await db.execute(p_stmt)
        for p in p_res.scalars().all():
            progress_map[p.quest_id] = p

    return [format_quest_response(q, progress_map.get(q.id)) for q in quests]


async def get_quest_by_key_or_id(
    db: AsyncSession, quest_id_or_key: str, user_id: Optional[str] = None
) -> Optional[QuestResponse]:
    await ensure_initial_quest(db)
    stmt = select(Quest).where(
        (Quest.id == quest_id_or_key) | (Quest.quest_key == quest_id_or_key)
    )
    res = await db.execute(stmt)
    quest = res.scalars().first()
    if not quest:
        return None

    progress = None
    if user_id:
        p_stmt = select(QuestProgress).where(
            QuestProgress.user_id == user_id, QuestProgress.quest_id == quest.id
        )
        p_res = await db.execute(p_stmt)
        progress = p_res.scalars().first()

    return format_quest_response(quest, progress)


async def advance_quest_objective(
    db: AsyncSession,
    event_type: str,
    session_id: Optional[str] = None,
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Optional[QuestResponse]:
    """
    Authoritatively evaluates game engine events and advances quest objectives.
    """
    quest = await ensure_initial_quest(db)

    progress = None
    if user_id:
        p_stmt = select(QuestProgress).where(
            QuestProgress.user_id == user_id, QuestProgress.quest_id == quest.id
        )
        p_res = await db.execute(p_stmt)
        progress = p_res.scalars().first()

        if not progress:
            progress = QuestProgress(
                user_id=user_id,
                quest_id=quest.id,
                status="IN_PROGRESS",
                progress_json={"objectives": [dict(o) for o in DEFAULT_OBJECTIVES]},
            )
            db.add(progress)
            await db.commit()
            await db.refresh(progress)

    # Copy current objectives
    current_objs = (
        [dict(o) for o in progress.progress_json.get("objectives", DEFAULT_OBJECTIVES)]
        if progress and progress.progress_json
        else [dict(o) for o in DEFAULT_OBJECTIVES]
    )

    changed = False

    # Event 1: Terminal Found / Scanned
    if event_type in ["DEBUG_SCAN_TERMINAL", "TERMINAL_ACCESSED"]:
        for o in current_objs:
            if o["id"] == "FIND_TERMINAL_01" and o["status"] != "COMPLETED":
                o["status"] = "COMPLETED"
                changed = True
            elif o["id"] == "ACCESS_DOOR_01" and o["status"] == "LOCKED":
                o["status"] = "IN_PROGRESS"
                changed = True

    # Event 2: Door Scanned / Inspected
    elif event_type in ["DEBUG_SCAN_DOOR", "DOOR_ACCESSED"]:
        for o in current_objs:
            if o["id"] in ["FIND_TERMINAL_01", "ACCESS_DOOR_01"]:
                o["status"] = "COMPLETED"
                changed = True
            elif o["id"] == "GAIN_ROOT_PERMISSION" and o["status"] == "LOCKED":
                o["status"] = "IN_PROGRESS"
                changed = True

    # Event 3: ROOT Permission Granted
    elif event_type in ["DOOR_ROOT_GRANTED", "REWRITE_DOOR_ROOT"]:
        for o in current_objs:
            if o["id"] in ["FIND_TERMINAL_01", "ACCESS_DOOR_01", "GAIN_ROOT_PERMISSION"]:
                o["status"] = "COMPLETED"
                changed = True
            elif o["id"] == "ENTER_SECTOR_02":
                # High corruption gives visual glitch flavor
                o["status"] = "CORRUPTED" if metadata and metadata.get("corruption_level", 0) > 50 else "IN_PROGRESS"
                changed = True

    # Event 4: Entered Sector 02
    elif event_type in ["ENTER_SECTOR_02", "PLAYER_ENTERED_SECTOR_02"]:
        for o in current_objs:
            o["status"] = "COMPLETED"
        if progress:
            progress.status = "COMPLETED"
        changed = True

    if changed and progress:
        from sqlalchemy.orm.attributes import flag_modified
        progress.progress_json = {"objectives": current_objs}
        flag_modified(progress, "progress_json")
        await db.commit()
        await db.refresh(progress)

    formatted = format_quest_response(quest, progress)

    # Broadcast QUEST_UPDATED via WebSocket
    if session_id:
        try:
            await ws_manager.broadcast_to_session(
                session_id,
                event_type="QUEST_UPDATED",
                payload={
                    "quest_key": formatted.quest_key,
                    "title": formatted.title,
                    "objective": formatted.current_objective,
                    "status": formatted.status,
                    "objectives": [o.model_dump() for o in formatted.objectives],
                    "progress_percent": formatted.progress_percent,
                },
            )
        except Exception as e:
            logger.warning(f"Failed to broadcast QUEST_UPDATED: {e}")

    return formatted
