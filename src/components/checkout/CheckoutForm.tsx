'use client';

import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
} from 'react';
import { Badge, GlassPanel, MagneticButton, Reveal } from '@/components/ui';
import { cx } from '@/components/ui/cx';
import { formatMoney } from '@/lib/format';
import { CADENCE_LABEL, planPrice, type Plan, type PlanCadence } from '@/lib/plans';
import { getSavings, setCadence, useCadence } from './cadence-store';

const STEPS = ['Datos', 'Cadencia', 'Pago'];
const CADENCES: PlanCadence[] = ['monthly', 'quarterly', 'annual'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]{6,20}$/;

interface FormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface CheckoutResponse {
  url?: string;
  reference?: string;
  mode?: string;
  error?: string;
}

const EMPTY_VALUES: FormValues = { name: '', email: '', phone: '', company: '' };

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const company = values.company.trim();

  if (name.length < 2) {
    errors.name = 'Ingresa tu nombre (mínimo 2 caracteres).';
  } else if (name.length > 120) {
    errors.name = 'El nombre ingresado es demasiado largo.';
  }

  if (!email) {
    errors.email = 'Ingresa tu correo electrónico.';
  } else if (email.length > 160 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (phone && (!PHONE_PATTERN.test(phone) || phone.length > 30)) {
    errors.phone = 'Ingresa un teléfono válido (entre 6 y 20 dígitos).';
  }

  if (company.length > 120) {
    errors.company = 'El nombre de la empresa es demasiado largo.';
  }

  return errors;
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

function Field({ id, label, error, hint, className, ...inputProps }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-300">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={cx(
          'h-12 w-full rounded-xl border bg-white/6 px-4 text-sm text-paper outline-none transition-colors',
          'placeholder:text-gray-500 hover:border-white/20 focus:border-aqua/60 focus:bg-white/8',
          error ? 'border-red-400/60' : 'border-white/12',
          className,
        )}
        {...inputProps}
      />
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function CheckoutForm({ plan }: { plan: Plan }) {
  const cadence = useCadence();
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const price = planPrice(plan, cadence);
  const savings = getSavings(plan, cadence);
  const draftErrors = validate(values);
  const stepOneComplete = !draftErrors.name && !draftErrors.email;
  const activeStep = submitting ? 3 : stepOneComplete ? 2 : 1;

  function updateField(field: keyof FormValues) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError(null);
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found = validate(values);
    setErrors(found);
    if (found.name || found.email || found.phone || found.company) {
      setFormError('Revisa los campos marcados antes de continuar.');
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: plan.id,
          cadence,
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || undefined,
          company: values.company.trim() || undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as CheckoutResponse | null;

      if (!response.ok || !data?.url) {
        setFormError(data?.error ?? 'No pudimos procesar tu solicitud. Intenta de nuevo.');
        setSubmitting(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setFormError('No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <Reveal delay={0.12} className="h-full">
      <GlassPanel className="flex h-full flex-col gap-8 p-6 sm:p-9" intensity={1.2}>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
          <ol className="flex flex-wrap items-center gap-3">
            {STEPS.map((label, index) => {
              const stepNumber = index + 1;
              const isDone = stepNumber < activeStep;
              const isActive = stepNumber === activeStep;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span className="flex items-center gap-2">
                    <span
                      className={cx(
                        'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                        isActive
                          ? 'border-aqua bg-aqua text-ink shadow-glow-aqua'
                          : isDone
                            ? 'border-aqua/50 bg-aqua/15 text-aqua'
                            : 'border-white/15 bg-white/5 text-gray-500',
                      )}
                    >
                      {stepNumber}
                    </span>
                    <span
                      className={cx(
                        'text-xs font-medium uppercase tracking-[0.16em]',
                        isActive ? 'text-paper' : 'text-gray-500',
                      )}
                    >
                      {label}
                    </span>
                  </span>
                  {stepNumber < STEPS.length ? (
                    <span className="h-px w-6 bg-white/12" aria-hidden="true" />
                  ) : null}
                </li>
              );
            })}
          </ol>

          <fieldset className="flex flex-col gap-5 border-0 p-0">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-aqua">
              1 · Tus datos
            </legend>
            <Field
              id="checkout-name"
              label="Nombre completo"
              placeholder="Ana Torres"
              autoComplete="name"
              value={values.name}
              onChange={updateField('name')}
              error={errors.name}
            />
            <Field
              id="checkout-email"
              label="Correo electrónico"
              type="email"
              placeholder="ana@empresa.com"
              autoComplete="email"
              value={values.email}
              onChange={updateField('email')}
              error={errors.email}
              hint="Usamos este correo para enviarte el comprobante."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="checkout-phone"
                label="Teléfono"
                type="tel"
                placeholder="+51 999 888 777"
                autoComplete="tel"
                value={values.phone}
                onChange={updateField('phone')}
                error={errors.phone}
                hint="Opcional"
              />
              <Field
                id="checkout-company"
                label="Empresa"
                placeholder="Nombre de tu marca"
                autoComplete="organization"
                value={values.company}
                onChange={updateField('company')}
                error={errors.company}
                hint="Opcional"
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4 border-0 p-0">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-aqua">
              2 · Cadencia de facturación
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {CADENCES.map((option) => {
                const optionId = `checkout-cadence-${option}`;
                const selected = option === cadence;
                return (
                  <label key={option} htmlFor={optionId} className="cursor-pointer">
                    <input
                      id={optionId}
                      type="radio"
                      name="cadence"
                      value={option}
                      checked={selected}
                      onChange={() => setCadence(option)}
                      className="peer sr-only"
                    />
                    <span
                      className={cx(
                        'flex h-full flex-col gap-1 rounded-xl border px-4 py-3 transition-all',
                        selected
                          ? 'border-aqua/60 bg-aqua/10 shadow-glow-aqua'
                          : 'border-white/12 bg-white/4 hover:border-white/25',
                      )}
                    >
                      <span
                        className={cx(
                          'text-xs font-semibold uppercase tracking-[0.14em]',
                          selected ? 'text-aqua' : 'text-gray-400',
                        )}
                      >
                        {CADENCE_LABEL[option].label}
                      </span>
                      <span className="font-display text-xl font-semibold text-paper">
                        {formatMoney(planPrice(plan, option) * 100, plan.currency)}
                      </span>
                      <span className="text-[11px] leading-snug text-gray-500">
                        {CADENCE_LABEL[option].note}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-5 rounded-xl border border-white/8 bg-white/4 p-5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-aqua">
              3 · Pago
            </span>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
                  Total a pagar
                </span>
                <span className="font-display text-5xl font-semibold tracking-tight text-paper">
                  {formatMoney(price * 100, plan.currency)}
                </span>
              </div>
              <span className="pb-2 text-sm text-gray-400">
                {CADENCE_LABEL[cadence].label}
                {savings
                  ? ` · Ahorras ${formatMoney(savings * 100, plan.currency)}`
                  : ''}
              </span>
            </div>

            {formError ? (
              <p className="text-sm text-red-400" role="alert" aria-live="polite">
                {formError}
              </p>
            ) : null}

            <MagneticButton
              type="submit"
              size="lg"
              variant="primary"
              className="w-full"
              disabled={submitting}
            >
              <span className="inline-flex items-center gap-2">
                {submitting ? (
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"
                    aria-hidden="true"
                  />
                ) : null}
                {submitting
                  ? 'Preparando tu pago…'
                  : `Continuar al pago · ${formatMoney(price * 100, plan.currency)}`}
              </span>
            </MagneticButton>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
              <p className="text-xs text-gray-400">
                Pago procesado por MercadoPago · Datos cifrados · Sin permanencia
              </p>
              <Badge tone="neutral">Demo: simula el pago sin tarjeta</Badge>
            </div>
          </div>
        </form>
      </GlassPanel>
    </Reveal>
  );
}
