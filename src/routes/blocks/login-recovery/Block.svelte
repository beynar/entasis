<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Heading } from 'svelai/heading';
	import { PasswordInput } from 'svelai/password-input';
	import { Stack } from 'svelai/stack';
	import { TextInput } from 'svelai/text-input';
	import { arrowLeftIcon } from 'svelai/icons/arrowLeft';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
	import { envelopeIcon } from 'svelai/icons/envelope';
	import { lockSimpleIcon } from 'svelai/icons/lockSimple';
	import { shieldCheckIcon } from 'svelai/icons/shieldCheck';

	type View = 'login' | 'recovery' | 'sent';

	let view = $state<View>('login');
	let email = $state<string | null>('');
	let password = $state<string | null>('');

	const showLogin = () => {
		view = 'login';
	};

	const showRecovery = () => {
		view = 'recovery';
	};

	const submitLogin = (event: SubmitEvent) => {
		event.preventDefault();
	};

	const submitRecovery = (event: SubmitEvent) => {
		event.preventDefault();
		view = 'sent';
	};
</script>

<section
	class="bg-surface p-lg sm:p-xl flex min-h-96 w-full items-center justify-center rounded-lg"
	aria-label="Account access"
>
	<div class="gap-xl grid w-full max-w-5xl items-stretch lg:grid-cols-2">
		<aside
			class="bg-primary text-primary-contrast gap-xl p-xl flex flex-col justify-between rounded-lg"
		>
			<Stack gap="xl">
				<Stack orientation="horizontal" align="center" gap="md">
					<span class="bg-primary-contrast/15 p-md flex rounded-full text-xl">
						{@render lockSimpleIcon()}
					</span>
					<span class="text-lg font-semibold tracking-tight">Northstar</span>
				</Stack>

				<Stack gap="md">
					<p class="text-primary-contrast/70 text-sm font-medium">YOUR WORK, SECURED</p>
					<Heading size="h1" weight="bold" balanced>Welcome back to your clearest workday.</Heading>
					<p class="text-primary-contrast/80 max-w-md text-base leading-relaxed">
						Sign in to pick up where you left off. If your password has gone wandering, we will get
						you back in safely.
					</p>
				</Stack>

				<ul class="gap-md flex flex-col">
					<li class="gap-md flex items-center">
						<span class="text-lg">{@render checkCircleIcon()}</span>
						<span class="text-sm">Protected with secure account recovery</span>
					</li>
					<li class="gap-md flex items-center">
						<span class="text-lg">{@render checkCircleIcon()}</span>
						<span class="text-sm">One link, sent only to your verified email</span>
					</li>
				</ul>
			</Stack>

			<Stack orientation="horizontal" align="center" gap="md">
				<span class="text-xl">{@render shieldCheckIcon()}</span>
				<p class="text-primary-contrast/70 text-xs leading-relaxed">
					We never ask for your password by email.
				</p>
			</Stack>
		</aside>

		<Card variant="solid" color="neutral" density="normal" class="h-full shadow-lg">
			<div aria-live="polite">
				{#if view === 'login'}
					<Stack gap="xl">
						<Stack gap="sm">
							<p class="text-primary-readable text-sm font-semibold">WELCOME BACK</p>
							<Heading size="h2" weight="bold">Sign in to Northstar</Heading>
							<p class="text-neutral/65 text-sm leading-relaxed">
								Enter your account details to continue.
							</p>
						</Stack>

						<form class="gap-lg flex flex-col" onsubmit={submitLogin}>
							<TextInput
								label="Email address"
								name="email"
								type="email"
								placeholder="you@company.com"
								required
								inputAttrs={{ autocomplete: 'email' }}
								bind:value={email}
							/>
							<PasswordInput
								label="Password"
								name="password"
								placeholder="Enter your password"
								required
								bind:value={password}
							/>
							<Stack orientation="horizontal" justify="end">
								<Button type="button" variant="link" color="primary" onclick={showRecovery}>
									Forgot password?
								</Button>
							</Stack>
							<Button type="submit" fullWidth suffix={arrowRightIcon}>Sign in</Button>
						</form>

						<p class="text-neutral/70 text-center text-xs">
							Need an account?
							<a class="text-primary-readable font-semibold hover:underline" href="#create-account">
								Create one
							</a>
						</p>
					</Stack>
				{:else if view === 'recovery'}
					<Stack gap="xl">
						<Stack gap="sm">
							<span
								class="bg-primary/10 text-primary-readable p-md flex w-fit rounded-full text-xl"
							>
								{@render envelopeIcon()}
							</span>
							<Heading size="h2" weight="bold">Reset your password</Heading>
							<p class="text-neutral/65 text-sm leading-relaxed">
								Enter the email linked to your account. We will send a secure reset link.
							</p>
						</Stack>

						<form class="gap-lg flex flex-col" onsubmit={submitRecovery}>
							<TextInput
								label="Email address"
								name="recovery-email"
								type="email"
								placeholder="you@company.com"
								required
								inputAttrs={{ autocomplete: 'email' }}
								bind:value={email}
							/>
							<Button type="submit" fullWidth suffix={arrowRightIcon}>Send reset link</Button>
						</form>

						<Button variant="ghost" color="neutral" prefix={arrowLeftIcon} onclick={showLogin}>
							Back to sign in
						</Button>
					</Stack>
				{:else}
					<Stack align="center" gap="xl" class="text-center">
						<span class="bg-success/10 text-success p-lg flex rounded-full text-4xl">
							{@render checkCircleIcon()}
						</span>
						<Stack align="center" gap="sm">
							<Heading size="h2" weight="bold">Check your inbox</Heading>
							<p class="text-neutral/65 max-w-sm text-sm leading-relaxed">
								We sent a password reset link to
								<strong class="text-neutral font-semibold">{email || 'your email address'}</strong>.
								The link expires soon for your security.
							</p>
						</Stack>
						<Button fullWidth prefix={arrowLeftIcon} onclick={showLogin}>Return to sign in</Button>
						<Button variant="link" color="primary" onclick={showRecovery}>Try another email</Button>
					</Stack>
				{/if}
			</div>
		</Card>
	</div>
</section>
