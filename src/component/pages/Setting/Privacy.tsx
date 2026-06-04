import { useLanguage } from '../../providers/useLanguage'

export default function Privacy() {
  const { t } = useLanguage()

  return (
    <main className="page">
      <div className="container">
        <h1>{t('Privacy Policy')}</h1>

        <p>
          {t('This application ("Cashflow App") respects your privacy.')}
        </p>

        <h2>{t('Information We Collect')}</h2>
        <p>
          {t('We may collect your email and basic profile information when you sign in.')}
        </p>

        <h2>{t('How We Use Data')}</h2>
        <p>
          {t('Your data is used only to provide and improve the service. We do not sell or share your data with third parties.')}
        </p>

        <h2>{t('Data Security')}</h2>
        <p>
          {t('Your data is stored securely using Supabase infrastructure.')}
        </p>

        <h2>{t('Contact')}</h2>
        <p>
          {t('If you have any questions, contact:')} chaniezfdw@gmail.com
        </p>
      </div>

      <style>{`
        .page {
          min-height: 100vh;
          background: #020617;
          color: white;
          padding: 40px;
        }

        .container {
          max-width: 800px;
          margin: auto;
        }

        h1 {
          font-size: 32px;
          margin-bottom: 20px;
        }

        h2 {
          margin-top: 20px;
          font-size: 20px;
        }

        p {
          color: #94a3b8;
          margin-top: 8px;
          line-height: 1.6;
        }
      `}</style>
    </main>
  )
}
