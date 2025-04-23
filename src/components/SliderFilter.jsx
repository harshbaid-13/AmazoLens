export default function SliderFilter({ dayOffset, setDayOffset }) {
    return (
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium text-gray-700">
          Days from April 1, 2022:
        </label>
        <input
          type="range"
          min={0}
          max={90}
          value={dayOffset}
          onChange={(e) => setDayOffset(Number(e.target.value))}
          className="w-64"
        />
        <span className="text-sm text-gray-600">{dayOffset} days</span>
      </div>
    );
  }
  