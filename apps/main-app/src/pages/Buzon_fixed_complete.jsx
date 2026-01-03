import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Send, Trash2, Archive, Mail } from 'lucide-react';
import { toast } from 'react-toastify';

import useTranslations from '../hooks/useTranslations';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusCircleIcon,
  TagIcon,
  BellIcon,
  ExclamationCircleIcon,
  PaperclipIcon,
  XIcon,
} from '../components/ui/icons';

import {
  initEmailService,
  getMails,
  sendMail,
  deleteMail,
  createEmailAlias,
  markAsRead,
} from '../services/emailService';

import { loadData, saveData } from '../services/StorageService';

import {
  createTrackingRecord,
  updateTrackingStatus,
  loadTrackingRecords,
  updateTrackingWithResponse,
  updateTrackingTags,
  deleteTrackingRecord,
  TRACKING_STATUS,
  EMAIL_TAGS,
} from '../services/EmailTrackingService';

import { getTemplateOptions, applyTemplate } from '../services/emailTemplates';
export default function Buzon() {
  const [folder, setFolder] = useState('inbox');
  const [search, setSearch] = useState('');
  const [mails, setMails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ to: '', subject: '', body: '', attachments: [] });
  const [userEmail, setUserEmail] = useState(null);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [emailAlias, setEmailAlias] = useState('');
  const [aliasStatus, setAliasStatus] = useState({ loading: false, error: null, success: false });
  const [serviceStatus, setServiceStatus] = useState({ initialized: false, error: null });

  const [profile, setProfile] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const fileInputRef = useRef(null);

  const [trackingRecords, setTrackingRecords] = useState([]);
  const [trackingSelected, setTrackingSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('priority');
  const [showTrackingEditModal, setShowTrackingEditModal] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    status: '',
    dueDate: '',
    notes: '',
    tags: [],
  });

  const [providers, setProviders] = useState([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const userProfile = await loadData('mywed360Profile', {});
        setProfile(userProfile);

        const storedProviders = await loadData('providers', { defaultValue: [] });
        setProviders(storedProviders);

        const email = initEmailService(userProfile);
        setUserEmail(email);
        setServiceStatus({ initialized: true, error: null });

        if (userProfile.emailAlias) {
          setEmailAlias(userProfile.emailAlias);
        }

        const tracking = loadTrackingRecords();
        setTrackingRecords(tracking);

        // console.log('Servicio de correo inicializado:', email);
      } catch (error) {
        // console.error('Error al inicializar el servicio de correo:', error);
        setServiceStatus({ initialized: false, error: error.message });
      }
    }

    loadProfile();

    // Cargar las plantillas de correo
    const templateOpts = getTemplateOptions();
    setTemplates(templateOpts);
  }, []);

  useEffect(() => {
    if (!serviceStatus.initialized) return;

    const loadEmails = async () => {
      try {
        const emails = await getMails(folder);
        // console.log('Correos cargados:', emails);
        setMails(emails);
      } catch (error) {
        // console.error('Error al cargar correos:', error);
      }
    };

    loadEmails();
  }, [folder, serviceStatus.initialized]);

  const refresh = useCallback(async () => {
    if (!serviceStatus.initialized) return;

    try {
      const emails = await getMails(folder);
      setMails(emails);
    } catch (error) {
      // console.error('Error al refrescar correos:', error);
    }
  }, [folder, serviceStatus.initialized]);

  const handleCreateAlias = async () => {
    if (!emailAlias) return;

    setAliasStatus({ loading: true, error: null, success: false });

    try {
      await createEmailAlias(emailAlias);

      setAliasStatus({ loading: false, error: null, success: true });

      // Actualizar perfil
      if (profile) {
        const updatedProfile = { ...profile, emailAlias };
        await saveData('mywed360Profile', updatedProfile);
        setProfile(updatedProfile);
      }
    } catch (error) {
      // console.error('Error al crear alias:', error);
      setAliasStatus({ loading: false, error: error.message, success: false });
    }
  };

  const handleAttachmentUpload = (e) => {
    const files = Array.from(e.target.files);
    setForm({
      ...form,
      attachments: [...form.attachments, ...files],
    });
  };

  const removeAttachment = (index) => {
    const newAttachments = [...form.attachments];
    newAttachments.splice(index, 1);
    setForm({
      ...form,
      attachments: newAttachments,
    });
  };

  const handleSendEmail = async () => {
    if (!form.to || !form.subject) {
      toast.error(t('email.requiredFields'));
      return;
    }

    try {
      await sendMail({
        to: form.to,
        subject: form.subject,
        body: form.body,
        attachments: form.attachments,
      });

      toast.success(t('email.sentSuccess'));
      setComposeOpen(false);
      setForm({ to: '', subject: '', body: '', attachments: [] });

      // Actualizar bandeja de enviados
      if (folder === 'sent') {
        refresh();
      }
    } catch (e) {
      // console.error('Error al enviar correo:', e);
      toast.error(t('email.sendError', { message: e.message || 'Intenta nuevamente más tarde' }));
    }
  };

  // Función para manejar la selección de un correo
  const handleSelectEmail = (mail) => {
    setSelected(mail);
    if (!mail.read) {
      markAsRead(mail.id);
      // Actualizar el estado local
      setMails(mails.map((m) => (m.id === mail.id ? { ...m, read: true } : m)));
    }
  };

  // Crear un nuevo registro de seguimiento para un proveedor
  const handleCreateTracking = (email) => {
    if (!email) return;

    const newRecord = createTrackingRecord({
      email,
      status: TRACKING_STATUS.NEW,
      providerName: email.from,
      subject: email.subject,
      initialMessage: email.body,
    });

    setTrackingRecords([...trackingRecords, newRecord]);
    setTrackingSelected(newRecord);
    setFolder('tracking');
  };

  // Actualizar el estado de un seguimiento
  const handleUpdateTrackingStatus = (id, newStatus) => {
    const updatedRecords = trackingRecords.map((record) =>
      record.id === id ? { ...record, status: newStatus } : record
    );
    updateTrackingStatus(id, newStatus);
    setTrackingRecords(updatedRecords);

    if (trackingSelected && trackingSelected.id === id) {
      setTrackingSelected({
        ...trackingSelected,
        status: newStatus,
      });
    }
  };

  // Aplicar una plantilla al campo del correo
  const handleApplyTemplate = (templateId) => {
    if (!templateId) return;

      const result = applyTemplate(templateId, {
        userName: profile?.name || 'Usuario',
      companyName: 'MaLoveApp',
        providerName: form.to.split('@')[0] || 'Proveedor',
      });

    setForm({
      ...form,
      subject: result.subject || form.subject,
      body: result.body || form.body,
    });

    setSelectedTemplate('');
  };

  // Filtrar correos según la búsqueda
  const filteredMails = mails.filter((mail) => {
    const searchLower = search.toLowerCase();
    return (
      mail.subject.toLowerCase().includes(searchLower) ||
      mail.from.toLowerCase().includes(searchLower) ||
      mail.to.toLowerCase().includes(searchLower)
    );
  });

  // Filtrar y ordenar los registros de seguimiento
  const filteredTrackingRecords = trackingRecords
    .filter((record) => {
      const searchMatch =
        record.providerName.toLowerCase().includes(search.toLowerCase()) ||
        record.subject.toLowerCase().includes(search.toLowerCase());
      const statusMatch = statusFilter ? record.status === statusFilter : true;
      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      if (sortOrder === 'priority') {
        // Ordenar por prioridad (urgente primero)
        if (a.status === TRACKING_STATUS.URGENT && b.status !== TRACKING_STATUS.URGENT) return -1;
        if (a.status !== TRACKING_STATUS.URGENT && b.status === TRACKING_STATUS.URGENT) return 1;
        if (a.status === TRACKING_STATUS.WAITING && b.status !== TRACKING_STATUS.WAITING) return -1;
        if (a.status !== TRACKING_STATUS.WAITING && b.status === TRACKING_STATUS.WAITING) return 1;
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      } else {
        // Ordenar por fecha
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      }
    });

  // Fallback UI para build en producción; esta vista es legacy y sólo se usa en dev
  return (
    <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
      <div className="mx-auto my-8" style={{
        maxWidth: '1024px',
        width: '100%',
        backgroundColor: '#FFFBF7',
        borderRadius: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden'
      }}>
        
        {/* Hero con degradado beige-dorado */}
        <header className="relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
          padding: '48px 32px 32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div className="max-w-4xl mx-auto" style={{ textAlign: 'center' }}>
            {/* Título con líneas decorativas */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to right, transparent, #D4A574)',
              }} />
              <h1 style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                fontSize: '40px',
                fontWeight: 400,
                color: '#1F2937',
                letterSpacing: '-0.01em',
                margin: 0,
              }}>Buzón de Emails</h1>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to left, transparent, #D4A574)',
              }} />
            </div>
            
            {/* Subtítulo como tag uppercase */}
            <p style={{
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 0,
            }}>Comunicación de Boda</p>
          </div>
        </header>

        {/* Contenido */}
        <div className="px-6 py-6">
          <p className="" className="text-secondary">Esta vista está deshabilitada en producción.</p>
        </div>
      </div>
    </div>
  );
}

