#include "CameraModule.h"

using namespace BWAPI;

CameraModule::CameraModule() : combatAcc(0), vision(0)
{
	cameraMoveTime = std::chrono::seconds(6);
	cameraMoveTimeMin = std::chrono::seconds(2);
	watchScoutWorkerUntil = 7500;
	lastMoved = clock.now();
	lastMovedPriority = 0;
	lastMovedPosition = BWAPI::Position(0, 0);
	cameraFocusPosition = BWAPI::Position(0, 0);
	cameraFocusUnit = NULL;
	followUnit = false;
	lastUnitDestroyedFrame = 2 * 60 * 24;
}

void CameraModule::onStart(BWAPI::Position startPos, int screenWidth, int screenHeight)
{
	cameraFocusPosition = startPos;
	currentCameraPosition = startPos;
	scrWidth = screenWidth;
	scrHeight = screenHeight;

	if (Broodwar->getReplayFrameCount() < 2 * 60 * 24)
	{
		Broodwar->leaveGame();
	}
}

void CameraModule::onFrame()
{
	if (combatAcc > 0)
		combatAcc--;
	auto seconds = Broodwar->getFrameCount() * 42 / 1000;
	auto minutes = seconds / 60;
	seconds %= 60;
	Broodwar->setTextSize(Text::Size::Huge);
	Broodwar->drawTextScreen(Position(0, 0), "%c%c%02d:%02d", Text::Align_Right, Text::White, minutes, seconds);
	//	Broodwar->drawTextScreen(Position(10, 30), "%d", combatAcc);

	slowDownOnCombat();
	moveCameraFallingNuke();
	moveCameraIsUnderAttack();
	moveCameraIsAttacking();
	if (Broodwar->getFrameCount() <= watchScoutWorkerUntil)
	{
		moveCameraScoutWorker();
	}
	moveCameraArmy();
	moveCameraDrop();

	updateCameraPosition();
	updateGameSpeed();
	updateVision();
}

bool CameraModule::isNearStartLocation(BWAPI::Player player, BWAPI::Position pos)
{
	int distance = 1000;
	BWAPI::Point<int, 32>::list startLocations = Broodwar->getStartLocations();

	for (BWAPI::Point<int, 32>::list::iterator it = startLocations.begin(); it != startLocations.end(); it++)
	{
		Position startLocation = BWAPI::Position(*it);

		// if the start position is not our own home, and the start position is closer than distance
		if (!isNearOwnStartLocation(player, startLocation) && startLocation.getDistance(pos) <= distance)
		{
			return true;
		}
	}

	return false;
}

bool CameraModule::isNearOwnStartLocation(BWAPI::Player player, BWAPI::Position pos)
{
	int distance = 10 * TILE_SIZE; // 10*32
	return (Position(player->getStartLocation()).getDistance(pos) <= distance);
}

bool CameraModule::isArmyUnit(BWAPI::Unit unit)
{
	return !unit->getPlayer()->isNeutral() && unit->getType().supplyRequired() > 0 && !unit->getType().isWorker();
}

bool CameraModule::shouldMoveCamera(int priority)
{
	auto delta = clock.now() - lastMoved;
	bool isTimeToMove = delta >= cameraMoveTime;
	bool isTimeToMoveIfHigherPrio = delta >= cameraMoveTimeMin;
	bool isHigherPrio = lastMovedPriority < priority;
	// camera should move IF: enough time has passed OR (minimum time has passed AND new prio is higher)
	return isTimeToMove || (isHigherPrio && isTimeToMoveIfHigherPrio);
}

void CameraModule::slowDownOnCombat()
{
	for (BWAPI::Unit unit : BWAPI::Broodwar->getAllUnits())
	{
		if (unit->isUnderAttack() || unit->isAttacking())
		{
			combatAcc += 2;
			if (combatAcc >= 24 * 5)
			{
				combatAcc = 24 * 13;
			}
			return;
		}
	}
}

void CameraModule::moveCameraIsUnderAttack()
{
	int prio = 3;
	if (!shouldMoveCamera(prio))
	{
		return;
	}

	for (BWAPI::Unit unit : BWAPI::Broodwar->getAllUnits())
	{
		if (unit->isUnderAttack())
		{
			updateVision(unit, prio);
			moveCamera(unit, prio);
			return;
		}
	}
}

void CameraModule::moveCameraIsAttacking()
{
	int prio = 3;
	if (!shouldMoveCamera(prio))
	{
		return;
	}

	for (BWAPI::Unit unit : BWAPI::Broodwar->getAllUnits())
	{
		if (unit->isAttacking())
		{
			updateVision(unit, prio);
			moveCamera(unit, prio);
			return;
		}
	}
}

void CameraModule::moveCameraFallingNuke()
{
	int prio = 5;
	if (!shouldMoveCamera(prio))
	{
		return;
	}

	for (BWAPI::Unit unit : BWAPI::Broodwar->getAllUnits())
	{
		if (unit->getType() == UnitTypes::Terran_Nuclear_Missile && unit->getVelocityY() > 0)
		{
			moveCamera(unit, prio);
			return;
		}
	}
}

void CameraModule::moveCameraScoutWorker()
{
	int highPrio = 2;
	int lowPrio = 0;
	if (!shouldMoveCamera(lowPrio))
	{
		return;
	}

	for (BWAPI::Unit unit : BWAPI::Broodwar->getAllUnits())
	{
		if (!unit->getType().isWorker())
		{
			continue;
		}
		if (isNearStartLocation(unit->getPlayer(), unit->getPosition()))
		{
			updateVision(unit, highPrio);
			moveCamera(unit, highPrio);
			return;
		}
		else if (!isNearOwnStartLocation(unit->getPlayer(), unit->getPosition()))
		{
			updateVision(unit, lowPrio);
			moveCamera(unit, lowPrio);
		}
	}
}

void CameraModule::moveCameraNukeDetect(BWAPI::Position target)
{
	int prio = 4;
	if (!shouldMoveCamera(prio))
	{
		return;
	}
	moveCamera(target, prio);
}

void CameraModule::moveCameraDrop()
{
	int prio = 2;
	if (!shouldMoveCamera(prio))
	{
		return;
	}
	for (BWAPI::Unit unit : BWAPI::Broodwar->getAllUnits())
	{
		if ((unit->getType() == UnitTypes::Zerg_Overlord || unit->getType() == UnitTypes::Terran_Dropship || unit->getType() == UnitTypes::Protoss_Shuttle) && isNearStartLocation(unit->getPlayer(), unit->getPosition()) && unit->getLoadedUnits().size() > 0)
		{
			updateVision(unit, prio);
			moveCamera(unit, prio);
			return;
		}
	}
}

void CameraModule::moveCameraArmy()
{
	int prio = 1;
	if (!shouldMoveCamera(prio))
	{
		return;
	}
	// Double loop, check if army units are close to each other
	int radius = 50;

	BWAPI::Position bestPos;
	BWAPI::Unit bestPosUnit;
	int mostUnitsNearby = 0;

	for (BWAPI::Unit unit1 : BWAPI::Broodwar->getAllUnits())
	{
		if (!isArmyUnit(unit1))
		{
			continue;
		}
		BWAPI::Position uPos = unit1->getPosition();

		int nrUnitsNearby = 0;
		for (BWAPI::Unit unit2 : BWAPI::Broodwar->getUnitsInRadius(uPos, radius))
		{
			if (!isArmyUnit(unit2))
			{
				continue;
			}
			nrUnitsNearby++;
		}

		if (nrUnitsNearby > mostUnitsNearby)
		{
			mostUnitsNearby = nrUnitsNearby;
			bestPos = uPos;
			bestPosUnit = unit1;
		}
	}

	if (mostUnitsNearby > 1)
	{
		updateVision(bestPosUnit, prio);
		moveCamera(bestPosUnit, prio);
	}
}

void CameraModule::moveCameraUnitCreated(BWAPI::Unit unit)
{
	int prio = 1;
	if (!shouldMoveCamera(prio))
	{
		return;
	}
	else if (unit->getPlayer() == Broodwar->self() && !unit->getType().isWorker())
	{
		moveCamera(unit, prio);
	}
}

void CameraModule::moveCamera(BWAPI::Position pos, int priority)
{
	if (!shouldMoveCamera(priority))
	{
		return;
	}
	if (followUnit == false && cameraFocusPosition == pos)
	{
		// don't register a camera move if the position is the same
		return;
	}

	cameraFocusPosition = pos;
	lastMovedPosition = cameraFocusPosition;
	lastMoved = clock.now();
	lastMovedPriority = priority;
	followUnit = false;
}

void CameraModule::moveCamera(BWAPI::Unit unit, int priority)
{
	if (!shouldMoveCamera(priority))
	{
		return;
	}
	if (followUnit == true && cameraFocusUnit == unit)
	{
		// don't register a camera move if we follow the same unit
		return;
	}

	cameraFocusUnit = unit;
	lastMovedPosition = cameraFocusUnit->getPosition();
	lastMoved = clock.now();
	lastMovedPriority = priority;
	followUnit = true;
}

void CameraModule::updateCameraPosition()
{
	double moveFactor = 0.1;
	if (followUnit && cameraFocusUnit->getPosition().isValid())
	{
		cameraFocusPosition = cameraFocusUnit->getPosition();
	}
	currentCameraPosition = currentCameraPosition + BWAPI::Position(
														(int)(moveFactor * (cameraFocusPosition.x - currentCameraPosition.x)),
														(int)(moveFactor * (cameraFocusPosition.y - currentCameraPosition.y)));
	BWAPI::Position currentMovedPosition =
		currentCameraPosition - BWAPI::Position(scrWidth / 2, scrHeight / 2 - 40); // -40 to account for HUD

	if (currentCameraPosition.isValid())
	{
		BWAPI::Broodwar->setScreenPosition(currentMovedPosition);
	}
}

void CameraModule::onUnitDestroy(BWAPI::Unit unit)
{
	lastUnitDestroyedFrame = Broodwar->getFrameCount();
}

void CameraModule::updateGameSpeed()
{
	if (Broodwar->getFrameCount() < 30 * 24 || Broodwar->getFrameCount() > lastUnitDestroyedFrame + 5 * 60 * 24)
		localSpeed = 5;
	else if (lastMovedPriority == 0 || combatAcc <= 24 * 3)
		localSpeed = 12;
	else if (lastMovedPriority == 1)
		localSpeed = 22;
	else if (lastMovedPriority == 2)
		localSpeed = 32;
	else if (lastMovedPriority == 5)
		localSpeed = 84;
	else
		localSpeed = 42;

	Broodwar->setLocalSpeed(localSpeed);

	if (localSpeed < 42 && (localSpeed >= 22 || std::chrono::duration_cast<std::chrono::seconds>(clock.now().time_since_epoch()).count() % 2 == 0))
	{
		Broodwar->setTextSize(Text::Size::Huge);
		auto speed = ((84 + localSpeed / 2) / localSpeed) / 2.0;
		Broodwar->drawTextScreen(Position(6, 0), "%cx%.1f", Text::Orange, speed);
		Broodwar->drawTextScreen(Position(8, 0), "%cx%.1f", Text::Yellow, speed);
		Broodwar->setTextSize();
	}
}

bool CameraModule::shouldUpdateVision(int priority)
{
	return shouldMoveCamera(priority);
}

void CameraModule::updateVision(BWAPI::Unit unit, int priority)
{
	updateVision(unit->getPlayer(), priority);
}

void CameraModule::updateVision(BWAPI::Player player, int priority)
{
	if (!shouldUpdateVision(priority))
	{
		return;
	}
	vision = 1 << player->getID();
}

void CameraModule::updateVision()
{
	if (shouldUpdateVision(0))
	{
		vision = 0;
	}

	//	Broodwar << vision << std::endl;
	for (auto player : Broodwar->getPlayers())
	{
		Broodwar->setVision(player, vision[player->getID()]);
	}
}