'use client';

export default function ProfileSettingsContent() {
  return (
    <div className="max-w-[760px]">
      <p className="text-[15px] text-[#8c8c8c]">
        Home <span className="mx-2">{'>'}</span>
        <span className="text-black">Profile Setting</span>
      </p>

      <h1 className="mt-14 text-[42px] font-bold uppercase leading-none tracking-[-0.03em] text-black md:text-[64px]">
        Profile Setting
      </h1>

      <p className="mt-6 max-w-[720px] text-[18px] leading-[1.5] text-[#8c8c8c]">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam.
      </p>

      <div className="mt-14 space-y-9">
        <div>
          <label className="block text-[20px] font-medium text-black md:text-[22px]">
            Name
          </label>
          <input
            type="text"
            defaultValue="Lorem Ipsum"
            className="mt-4 h-[68px] w-full rounded-[26px] border border-black bg-transparent px-6 text-[20px] text-[#a0a0b8] outline-none"
          />
        </div>

        <div>
          <label className="block text-[20px] font-medium text-black md:text-[22px]">
            E-mail
          </label>
          <div className="mt-4 flex min-h-[68px] w-full items-center rounded-[26px] border border-black bg-transparent px-6 text-[20px] text-[#a0a0b8]">
            Lorem Ipsum@gmail.com
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-wrap gap-4">
        <button
          type="button"
          className="inline-flex h-[56px] min-w-[150px] items-center justify-center rounded-full bg-black px-8 text-[18px] font-semibold uppercase text-white transition hover:opacity-90"
        >
          Change
        </button>

        <button
          type="button"
          className="inline-flex h-[56px] min-w-[150px] items-center justify-center rounded-full border border-black bg-transparent px-8 text-[18px] font-semibold uppercase text-black transition hover:bg-black hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}