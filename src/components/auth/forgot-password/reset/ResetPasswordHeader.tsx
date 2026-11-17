import Link from 'next/link';

export default function ResetPasswordHeader() {
  return (
    <div className="mx-auto max-w-[760px]">
      <p className="text-[15px] text-[#8c8c8c]">
        <Link href="/" className="transition hover:text-black">
          Home
        </Link>
        <span className="mx-2">{'>'}</span>
        <Link href="/forgot-password" className="transition hover:text-black">
          Forgot Password
        </Link>
        <span className="mx-2">{'>'}</span>
        <span className="text-black">Reset Password</span>
      </p>

      <h1 className="mt-10 text-[42px] font-bold uppercase leading-none tracking-[-0.03em] text-black md:text-[64px]">
        Reset Password
      </h1>

      <p className="mt-6 max-w-[680px] text-[18px] leading-[1.5] text-[#8c8c8c]">
        Enter your new password and confirm it.
      </p>
    </div>
  );
}