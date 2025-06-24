export function JobCardSkeleton() {
  return (
    <ul className="flex flex-col gap-2">
      {Array(4)
        .fill(1)
        .map((n, index) => (
          <li
            key={index}
            className="animate-pulse bg-gray-100 rounded-md h-60"
          ></li>
        ))}
    </ul>
  );
}
