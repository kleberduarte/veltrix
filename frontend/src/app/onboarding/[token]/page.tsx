import { redirect } from 'next/navigation'

/** Links antigos de onboarding foram descontinuados — use o link de acesso da empresa (`/acesso/...`) e o login Veltrix. */
export default function OnboardingDeprecatedPage() {
  redirect('/login')
}
