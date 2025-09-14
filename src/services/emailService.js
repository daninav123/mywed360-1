// Shim: legacy EmailService mapped to emailService
export {
  initEmailService,
  getMails,
  sendMail,
  deleteMail,
  createEmailAlias,
  markAsRead,
  USE_BACKEND,
  USE_MAILGUN
} from './emailService';

export { default } from './emailService';

