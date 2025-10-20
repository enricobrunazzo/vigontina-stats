// Patch PeriodPlay to use ProvaTecnicaPanel for PROVA TECNICA UI
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, Play, Pause, Flag, Repeat } from "lucide-react";
import { PLAYERS } from "../constants/players";
import GoalModal from "./modals/GoalModal";
import OwnGoalModal from "./modals/OwnGoalModal";
import PenaltyAdvancedModal from "./modals/PenaltyAdvancedModal";
import LineupModal from "./modals/LineupModal";
import DeleteEventModal from "./modals/DeleteEventModal";
import SubstitutionModal from "./modals/SubstitutionModal";
import ProvaTecnicaPanel from "./ProvaTecnicaPanel";

// ...rest of file remains same, we only replace the renderProvaTecnicaControls call with the ProvaTecnicaPanel component
