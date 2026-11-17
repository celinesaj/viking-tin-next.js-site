function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[28px] bg-white p-3"
        >
          {/* image */}
          <div className="h-[260px] w-full rounded-[24px] bg-gray-200" />

          {/* brand */}
          <div className="mt-4 h-4 w-[100px] rounded bg-gray-200" />

          {/* title */}
          <div className="mt-3 h-6 w-[80%] rounded bg-gray-200" />

          {/* price */}
          <div className="mt-3 h-5 w-[60px] rounded bg-gray-200" />

          {/* button */}
          <div className="mt-5 h-[44px] w-full rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}