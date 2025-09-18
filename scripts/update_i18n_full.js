const fs=require('fs');
function load(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function save(p,o){fs.writeFileSync(p, JSON.stringify(o,null,2)+'\n','utf8');}
function setPath(obj,path,val){const parts=path.split('.');let cur=obj;for(let i=0;i<parts.length-1;i++){const k=parts[i];if(!cur[k]||typeof cur[k]!=='object')cur[k]={};cur=cur[k];}cur[parts[parts.length-1]]=val;}

const paths={
  en:'src/i18n/locales/en/common.json',
  es:'src/i18n/locales/es/common.json',
  fr:'src/i18n/locales/fr/common.json'
};
const en=load(paths.en); const es=load(paths.es); const fr=load(paths.fr);

// Ensure tasks.* keys
const tasksEN={ high:'High', medium:'Medium', low:'Low', completed:'Completed', inProgress:'In progress', notStarted:'Not started', overdue:'Overdue' };
const tasksES={ high:'Alta', medium:'Media', low:'Baja', completed:'Completada', inProgress:'En progreso', notStarted:'No iniciada', overdue:'Atrasada' };
const tasksFR={ high:'Haute', medium:'Moyenne', low:'Basse', completed:'Terminée', inProgress:'En cours', notStarted:'Non commencée', overdue:'En retard' };
function ensureTasks(obj,map){ obj.tasks = Object.assign({}, obj.tasks||{}, map); }
ensureTasks(en,tasksEN); ensureTasks(es,tasksES); ensureTasks(fr,tasksFR);

// Ensure forms.* and messages.* used by hooks
const formsEN={ required:'Required', optional:'Optional', pleaseSelect:'Please select', selectOption:'Select an option', enterText:'Enter text', chooseFile:'Choose file', uploadFile:'Upload file', fieldRequired:'This field is required', invalidEmail:'Invalid email', invalidPhone:'Invalid phone', invalidUrl:'Invalid URL' };
const formsES={ required:'Obligatorio', optional:'Opcional', pleaseSelect:'Por favor, selecciona', selectOption:'Selecciona una opción', enterText:'Introduce texto', chooseFile:'Seleccionar archivo', uploadFile:'Subir archivo', fieldRequired:'Este campo es obligatorio', invalidEmail:'Email inválido', invalidPhone:'Teléfono inválido', invalidUrl:'URL inválida' };
const formsFR={ required:'Obligatoire', optional:'Optionnel', pleaseSelect:'Veuillez sélectionner', selectOption:'Sélectionnez une option', enterText:'Saisir du texte', chooseFile:'Choisir un fichier', uploadFile:'Téléverser un fichier', fieldRequired:'Ce champ est obligatoire', invalidEmail:'Email invalide', invalidPhone:'Téléphone invalide', invalidUrl:'URL invalide' };
function ensureForms(obj,map){ obj.forms = Object.assign({}, obj.forms||{}, map); }
ensureForms(en,formsEN); ensureForms(es,formsES); ensureForms(fr,formsFR);

const messagesEN={ saveSuccess:'Saved successfully', saveError:'Error saving', deleteSuccess:'Deleted successfully', deleteError:'Error deleting', updateSuccess:'Updated successfully', updateError:'Error updating', loadError:'Error loading data', networkError:'Network error', confirmDelete:'Are you sure you want to delete?', unsavedChanges:'You have unsaved changes' };
const messagesES={ saveSuccess:'Guardado correctamente', saveError:'Error al guardar', deleteSuccess:'Eliminado correctamente', deleteError:'Error al eliminar', updateSuccess:'Actualizado correctamente', updateError:'Error al actualizar', loadError:'Error al cargar datos', networkError:'Error de red', confirmDelete:'¿Seguro que deseas eliminar?', unsavedChanges:'Tienes cambios sin guardar' };
const messagesFR={ saveSuccess:'Enregistré avec succès', saveError:"Erreur lors de l'enregistrement", deleteSuccess:'Supprimé avec succès', deleteError:'Erreur lors de la suppression', updateSuccess:'Mis à jour avec succès', updateError:'Erreur lors de la mise à jour', loadError:'Erreur de chargement des données', networkError:'Erreur réseau', confirmDelete:'Êtes-vous sûr de vouloir supprimer ?', unsavedChanges:'Vous avez des modifications non enregistrées' };
function ensureMessages(obj,map){ obj.messages = Object.assign({}, obj.messages||{}, map); }
ensureMessages(en,messagesEN); ensureMessages(es,messagesES); ensureMessages(fr,messagesFR);

// Ensure basic RSVP keys
const rsvpEN={ section:'RSVP', simulate:'Simulate reminders', send:'Send reminders' };
const rsvpES={ section:'RSVP', simulate:'Simular recordatorios', send:'Enviar recordatorios' };
const rsvpFR={ section:'RSVP', simulate:'Simuler des rappels', send:'Envoyer des rappels' };
function ensureRSVP(obj,map){ obj.rsvp = Object.assign({}, obj.rsvp||{}, map, obj.rsvp||{}); }
ensureRSVP(en,rsvpEN); ensureRSVP(es,rsvpES); ensureRSVP(fr,rsvpFR);

save(paths.en,en); save(paths.es,es); save(paths.fr,fr);
console.log('Updated tasks/forms/messages/rsvp in EN/ES/FR');
