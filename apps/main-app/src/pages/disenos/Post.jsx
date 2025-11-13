import React from 'react';

import ImageGeneratorAI from '../../components/ImageGeneratorAI';
import Card from '../../components/ui/Card';
import { loadData } from '../../services/SyncService';

// Plantillas predefinidas para posts y contenido para redes sociales
const socialMediaTemplates = [
  {
    name: 'Anuncio de Compromiso',
    description: 'Post elegante para anunciar el compromiso en redes sociales',
    prompt:
      'Dise�a una imagen para anunciar un compromiso en redes sociales. Formato cuadrado (1:1) ideal para Instagram. Incluye el texto "�Nos casamos!" o similar y espacio para a�adir la fecha. Estilo elegante y rom�ntico con elementos como anillos, flores o corazones sutiles. La imagen debe ser sofisticada pero emotiva, adecuada para compartir en cualquier plataforma social.',
  },
  {
    name: 'Save the Date',
    description: 'Post para informar a invitados sobre la fecha de la boda',
    prompt:
      'Crea un dise�o de "Save the Date" para compartir en redes sociales. Formato cuadrado optimizado para Instagram y otras plataformas. Incluye la frase "Save the Date" de forma destacada y espacio para incluir la fecha y posiblemente el lugar. El estilo debe ser moderno y atractivo visualmente, con elementos gr�ficos que llamen la atenci�n pero manteniendo la elegancia. La imagen debe transmitir la emoci�n y la anticipaci�n del evento.',
  },
  {
    name: 'Cuenta Atr�s',
    description: 'Post que muestra los d�as restantes hasta la boda',
    prompt:
      'Dise�a una plantilla para posts de cuenta atr�s para boda en redes sociales. Formato cuadrado para Instagram. Debe incluir prominentemente el texto "Faltan X d�as" con un espacio claro donde se pueda editar el n�mero. El dise�o debe ser atractivo visualmente con elementos festivos pero elegantes. Incluye alg�n elemento gr�fico como un reloj, calendario o similar que enfatice el concepto de cuenta atr�s. Los colores deben ser acordes a una boda.',
  },
  {
    name: 'Hashtag de Boda',
    description: 'Post que destaca el hashtag personalizado para la boda',
    prompt:
      'Crea un dise�o para promocionar un hashtag personalizado de boda en redes sociales. Formato cuadrado para Instagram y otras plataformas. El dise�o debe destacar prominentemente el texto "#NuestroHashtag" (como ejemplo, debe ser f�cilmente reemplazable). Incorpora elementos visuales atractivos que complementen el tema de la boda. La composici�n debe ser clara y legible incluso en pantallas peque�as, animando a los invitados a usar el hashtag cuando compartan fotos del evento.',
  },
  {
    name: 'Agradecimiento Post-Boda',
    description: 'Post para agradecer a invitados tras la celebraci�n',
    prompt:
      'Dise�a una imagen para publicar en redes sociales como agradecimiento despu�s de una boda. Formato cuadrado para Instagram. Incluye un texto como "Gracias por compartir nuestro d�a especial" u otra frase de agradecimiento similar. El dise�o debe transmitir gratitud y emoci�n, con elementos elegantes que evoquen la celebraci�n. Utiliza una paleta de colores rom�ntica y sofisticada. La imagen debe ser lo suficientemente vers�til para acompa�ar una galer�a de fotos del evento.',
  },
];

export default function PostDiseno() {
  // Obtener informaci�n del perfil para personalizar los prompts si es posible
  const getProfileInfo = () => {
    try {
      const profile = loadData('mywed360Profile', { defaultValue: {}, collection: 'userProfiles' });
      const names = [];

      if (profile.brideFirstName && profile.groomFirstName) {
        names.push(`${profile.brideFirstName} & ${profile.groomFirstName}`);
      } else if (profile.brideFirstName) {
        names.push(profile.brideFirstName);
      } else if (profile.groomFirstName) {
        names.push(profile.groomFirstName);
      }

      let customInfo = '';

      if (names.length > 0) {
        customInfo += `Incluye los nombres: ${names.join(' y ')}. `;
      }

      if (profile.weddingDate) {
        // Formato simple de fecha
        customInfo += `La fecha de la boda es: ${profile.weddingDate}. `;
      }

      if (profile.weddingLocation) {
        customInfo += `La boda se celebra en: ${profile.weddingLocation}. `;
      }

      return customInfo;
    } catch (err) {
      // console.error('Error al obtener informaci�n del perfil:', err);
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Dise�o de Posts para Redes Sociales</h1>
        <p className="text-gray-600">
          Crea im�genes atractivas para compartir en tus redes sociales antes, durante y despu�s de
          la boda. Selecciona un estilo o personaliza tu propio dise�o.
        </p>

        <div className="mt-2">
          <p className="text-sm text-blue-600">
            <span className="font-medium">Consejo:</span> Estas im�genes est�n optimizadas para
            formato cuadrado, ideal para Instagram y otras plataformas de redes sociales.
          </p>
        </div>
      </Card>

      <ImageGeneratorAI
        category="social-media"
        templates={socialMediaTemplates}
        onImageGenerated={(image) => {
          // console.log('Nuevo dise�o para redes sociales generado:', image);
        }}
      />
    </div>
  );
}

