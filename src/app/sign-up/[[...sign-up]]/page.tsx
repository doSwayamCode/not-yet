import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#050505] py-16 px-4">
      <div className="relative w-full max-w-md flex justify-center">
        {/* Decorative backdrop glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-indigo-500 rounded-lg blur opacity-10"></div>
        <div className="relative bg-[#0F0F0F] border border-neutral-900 rounded-xl p-2 shadow-2xl">
          <SignUp 
            appearance={{
              variables: {
                colorPrimary: '#F59E0B', // amber-500
                colorBackground: '#0F0F0F',
                colorInputBackground: '#050505',
                colorInputText: '#FFFFFF',
                colorTextPlaceholder: '#737373',
                colorText: '#FFFFFF',
                colorTextSecondary: '#A3A3A3',
              },
              elements: {
                card: 'bg-[#0F0F0F] shadow-none border-0',
                headerTitle: 'text-white font-bold',
                headerSubtitle: 'text-neutral-400 text-xs',
                socialButtonsBlockButton: 'bg-neutral-950 border border-neutral-800 text-white hover:bg-neutral-900 transition',
                formButtonPrimary: 'bg-amber-500 hover:bg-amber-400 text-black font-bold transition duration-200',
                footerActionLink: 'text-amber-500 hover:text-amber-400 transition',
                formFieldLabel: 'text-neutral-400 text-xs font-semibold',
                formFieldInput: 'bg-neutral-950 border border-neutral-800 text-white focus:border-amber-500',
                dividerText: 'text-neutral-500 text-[10px]',
                dividerLine: 'bg-neutral-800',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
