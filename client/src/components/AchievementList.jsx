export function AchievementList({ achievements = [] }) {
    return (
      <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Logros obtenidos</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          {achievements.map((ach, i) => (
            <li key={i}>{ach}</li>
          ))}
        </ul>
      </div>
    );
  }