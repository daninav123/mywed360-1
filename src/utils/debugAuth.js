import { auth } from '../firebaseConfig';
import i18n from '../i18n';

const t = (key, options) => i18n.t(`debugAuth.${key}`, options);

export async function debugAuth() {
  console.log(`\n${t('title')}\n`);
  console.log('='.repeat(60));

  console.log(`\n${t('sections.firebase')}`);
  const authStatus = auth ? t('status.configured') : t('status.notConfigured');
  console.log(t('messages.auth', { status: authStatus }));

  const userStatus = auth?.currentUser ? t('status.userExists') : t('status.userMissing');
  console.log(t('messages.currentUser', { status: userStatus }));

  if (auth?.currentUser) {
    console.log(t('messages.uid', { value: auth.currentUser.uid }));
    console.log(t('messages.email', { value: auth.currentUser.email }));
    const verifiedStatus = auth.currentUser.emailVerified
      ? t('status.emailVerified')
      : t('status.emailUnverified');
    console.log(t('messages.emailVerified', { value: verifiedStatus }));
  }

  console.log(`\n${t('sections.token')}`);
  try {
    if (!auth?.currentUser) {
      console.log(t('messages.noUser'));
      return;
    }

    const token = await auth.currentUser.getIdToken(false);
    if (token) {
      console.log(t('messages.tokenObtained'));
      console.log(t('messages.tokenLength', { value: token.length }));
      console.log(
        t('messages.tokenPreview', { value: `${token.substring(0, 50)}...` })
      );

      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log(`\n${t('sections.tokenPayload')}`);
          console.log(t('messages.issuer', { value: payload.iss }));
          console.log(t('messages.subject', { value: payload.sub }));
          console.log(t('messages.audience', { value: payload.aud }));
          console.log(
            t('messages.expires', {
              value: new Date(payload.exp * 1000).toLocaleString(),
            })
          );
          console.log(
            t('messages.issued', {
              value: new Date(payload.iat * 1000).toLocaleString(),
            })
          );

          const now = Math.floor(Date.now() / 1000);
          const expiresIn = payload.exp - now;
          console.log(
            t('messages.expiresIn', { minutes: Math.floor(expiresIn / 60) })
          );

          if (expiresIn < 0) {
            console.log(t('messages.tokenExpired'));
          } else if (expiresIn < 300) {
            console.log(t('messages.tokenExpiringSoon'));
          } else {
            console.log(t('messages.tokenValid'));
          }
        }
      } catch (parseErr) {
        console.log(t('messages.tokenParseError', { error: String(parseErr) }));
      }

      console.log(`\n${t('sections.backend')}`);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:4004';
        const response = await fetch(`${backendUrl}/api/mail?folder=inbox`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(
          t('messages.backendStatus', {
            status: response.status,
            statusText: response.statusText || '',
          })
        );

        if (response.ok) {
          const data = await response.json();
          console.log(t('messages.backendOk'));
          const count = Array.isArray(data)
            ? data.length
            : t('messages.notAvailable');
          console.log(
            t('messages.backendEmails', { count })
          );
        } else {
          console.log(t('messages.backendError'));
          try {
            const error = await response.json();
            console.log(
              t('messages.backendErrorJson', {
                error: JSON.stringify(error, null, 2),
              })
            );
          } catch {
            const text = await response.text();
            console.log(
              t('messages.backendErrorText', { text: text.substring(0, 200) })
            );
          }
        }
      } catch (fetchErr) {
        console.log(t('messages.fetchError', { message: fetchErr.message }));
      }
    } else {
      console.log(t('messages.tokenNull'));
    }
  } catch (tokenErr) {
    const message = tokenErr?.message || tokenErr;
    console.log(t('messages.tokenError', { message: String(message) }));
    if (tokenErr?.stack) {
      console.log(t('messages.tokenStack', { stack: tokenErr.stack }));
    }
  }

  console.log(`\n${t('sections.localStorage')}`);
  try {
    const storedToken = localStorage.getItem('maloveapp_auth_token');
    if (storedToken) {
      console.log(t('messages.localStorageTokenExists'));
      console.log(t('messages.localStorageTokenLength', { value: storedToken.length }));
    } else {
      console.log(t('messages.localStorageTokenMissing'));
    }
  } catch (err) {
    console.log(t('messages.localStorageError', { error: String(err) }));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${t('messages.diagnosticDone')}\n`);
}

// Exportar también para uso directo desde window
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth;
  console.log('💡 Diagnóstico de auth disponible: window.debugAuth()');
}
