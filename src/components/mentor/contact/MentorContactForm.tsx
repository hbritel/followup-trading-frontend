import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useSubmitContact } from '@/hooks/useMentor';

const CONSENT_VERSION = '1.0';

interface MentorContactFormProps {
  slug: string;
  brandName: string;
}

const MentorContactForm: React.FC<MentorContactFormProps> = ({ slug, brandName }) => {
  const { t } = useTranslation();
  const submitContact = useSubmitContact(slug);

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [consented, setConsented] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyStudent, setAlreadyStudent] = useState(false);

  const canSubmit =
    email.trim().length > 0 &&
    message.trim().length > 0 &&
    consented &&
    !alreadyStudent &&
    !submitContact.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    submitContact.mutate(
      {
        email: email.trim(),
        message: message.trim(),
        consentVersion: CONSENT_VERSION,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success(
            t('mentor.contact.form.successToast', 'Message sent to {{brand}}!', {
              brand: brandName,
            })
          );
        },
        onError: (error) => {
          if (error instanceof AxiosError && error.response?.status === 409) {
            setAlreadyStudent(true);
            toast.info(
              t(
                'mentor.contact.alreadyStudent',
                'You are already enrolled with this mentor — use your My Mentor page to reach them.'
              )
            );
          } else if (error instanceof AxiosError && error.response?.status === 429) {
            toast.error(
              t(
                'mentor.contact.form.rateLimitError',
                "You're sending messages too quickly. Please wait a moment and try again."
              )
            );
          } else {
            toast.error(t('mentor.contact.form.genericError', 'Failed to send. Please try again.'));
          }
        },
      }
    );
  };

  if (submitted) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-border/50 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <Send className="w-4 h-4" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">
          {t('mentor.contact.form.successTitle', 'Message sent!')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t(
            'mentor.contact.form.successDesc',
            '{{brand}} will get back to you at the email you provided.',
            { brand: brandName }
          )}
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="contact-form-heading"
      className="glass-card rounded-2xl p-5 sm:p-6 border border-border/50 space-y-4"
    >
      <h2 id="contact-form-heading" className="text-lg font-semibold">
        {t('mentor.contact.form.title', 'Contact {{brand}}', { brand: brandName })}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">
            {t('mentor.contact.form.emailLabel', 'Your email')}
          </Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('mentor.contact.form.emailPlaceholder', 'you@example.com')}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-message">
            {t('mentor.contact.form.messageLabel', 'Your message')}
          </Label>
          <Textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t(
              'mentor.contact.form.messagePlaceholder',
              "What would you like to ask {{brand}}?",
              { brand: brandName }
            )}
            rows={4}
            required
            className="resize-none"
          />
        </div>

        <div className="flex items-start gap-2.5">
          <Checkbox
            id="contact-consent"
            checked={consented}
            onCheckedChange={(v) => setConsented(!!v)}
            className="mt-0.5 shrink-0"
          />
          <label htmlFor="contact-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            {t(
              'mentor.contact.form.consentText',
              'I consent to my email address and message being shared with {{brand}} for the purpose of responding to my enquiry. I can withdraw this consent at any time.',
              { brand: brandName }
            )}
          </label>
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={!canSubmit}
        >
          {submitContact.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" aria-hidden="true" />
          )}
          {t('mentor.contact.form.submitButton', 'Send message')}
        </Button>
      </form>
    </section>
  );
};

export default MentorContactForm;
