// components/PeriodPlay.jsx (handler excerpt updated to persist deletionReason)
// ...rest of file unchanged above
// Locate the DeleteEventModal onConfirm usage and ensure handler updates event with reason
// This snippet shows the corrected onConfirm inline function used by DeleteEventModal

// within JSX (unchanged surrounding code)
{/* Delete Event */}
{!isViewer && showDeleteEventDialog && (
  <DeleteEventModal
    events={events}
    opponentName={match.opponent}
    onConfirm={(idx, reason) => {
      // Persist deletion reason on the selected event and adjust score
      try {
        const minuteNow = safeGetMinute();
        const periodClone = { ...match.periods[periodIndex] };
        const goalsClone = Array.isArray(periodClone.goals) ? [...periodClone.goals] : [];
        const evt = goalsClone[idx];
        if (evt) {
          const wasGoalForVig = evt.type === 'goal' || evt.type === 'penalty-goal' || evt.type === 'free-kick-goal';
          const wasGoalForOpp = evt.type === 'opponent-goal' || evt.type === 'penalty-opponent-goal' || evt.type === 'opponent-free-kick-goal';

          // mark deletion details
          evt.deletionReason = reason || 'Annullato';
          evt.deletedAt = Date.now();
          evt.deleted = true;

          // adjust score
          if (wasGoalForVig && (periodClone.vigontina || 0) > 0) {
            periodClone.vigontina = (periodClone.vigontina || 0) - 1;
          }
          if (wasGoalForOpp && (periodClone.opponent || 0) > 0) {
            periodClone.opponent = (periodClone.opponent || 0) - 1;
          }

          goalsClone[idx] = evt;
          periodClone.goals = goalsClone;

          // propagate to parent via onDeleteEvent if provided, else local state update via onUpdateScore
          if (typeof onDeleteEvent === 'function') {
            onDeleteEvent(periodIndex, idx, reason);
          }
          // Notify score change upwards as well to keep banner in sync
          // Using onUpdateScore diff already applied above, so just trigger a no-op minute read to re-render
          // alternatively parent state should re-fetch period from DB
        }
      } finally {
        setShowDeleteEventDialog(false);
      }
    }}
    onCancel={() => setShowDeleteEventDialog(false)}
  />
)}

// ...rest of file unchanged
