import { useState } from 'react';
import type { FormEvent } from 'react';
import { KeyRound, Loader2, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';

interface UnlockScreenProps {
  onUnlock: (password: string) => Promise<boolean>;
  onUseOwnFile: () => void;
}

/**
 * Password gate for a build that ships encrypted leads.
 *
 * The password is never compared against anything stored in the page — it is
 * the decryption key. A wrong password simply fails to decrypt, so there is
 * nothing here worth bypassing: skipping this screen yields ciphertext.
 */
export function UnlockScreen({ onUnlock, onUseOwnFile }: UnlockScreenProps) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password || busy) return;

    setBusy(true);
    setError(null);
    const ok = await onUnlock(password);
    if (!ok) {
      setError('That password did not work. Check it and try again.');
      setPassword('');
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-700">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </span>

            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-navy-950">Enter your password</h2>
              <p className="text-sm leading-relaxed text-slate-500">
                Your lead list is stored encrypted in this page. The password unlocks it — you
                only need to enter it once on each device.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <TextInput
              label="Password"
              srOnlyLabel
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoFocus
              data-autofocus
              disabled={busy}
            />

            {error && (
              <p role="alert" className="text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={!password || busy} className="justify-center">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Unlocking…
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  Unlock my leads
                </>
              )}
            </Button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Or{' '}
          <button
            type="button"
            onClick={onUseOwnFile}
            className="rounded font-medium text-navy-700 underline underline-offset-2 hover:text-navy-900"
          >
            import a different spreadsheet
          </button>{' '}
          instead.
        </p>
      </div>
    </div>
  );
}
