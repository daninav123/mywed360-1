import { useTranslations } from '../../hooks/useTranslations';
﻿// Listados de inspiración musical por momento y categoría
// Se utilizan en la página de Momentos Especiales

export const MUSIC_INSPIRATION = {
  const { t } = useTranslations();

  ceremonia: {
    'Entrada novia': [
      { title: 'A Thousand Years', artist: 'Christina Perri', tags: ['moderna', 'balada'] },
      { title: 'All of Me', artist: 'John Legend', tags: [t('common.romantica')] },
      { title: 'Canon in D', artist: 'Pachelbel', tags: [t('common.clasica')] },
      { title: 'River Flows in You', artist: 'Yiruma', tags: ['piano', 'instrumental'] },
      { title: 'Bridal Chorus', artist: 'Wagner', tags: [t('common.clasica')] },
      { title: 'Perfect', artist: 'Ed Sheeran', tags: [t('common.romantica')] },
    ],
    'Entrada novio': [
      { title: 'Here Comes the Sun', artist: 'The Beatles', tags: [t('common.clasico'), 'feliz'] },
      { title: 'What a Wonderful World', artist: 'Louis Armstrong', tags: ['jazz', 'lenta'] },
      { title: 'Somewhere Only We Know', artist: 'Keane', tags: ['indie'] },
    ],
    'Intercambio de anillos': [
      { title: 'La Vie en Rose', artist: t('common.edith_piaf'), tags: [t('common.clasico'), t('common.romantico')] },
      { title: 'Hallelujah', artist: 'Jeff Buckley', tags: ['emocional'] },
      { title: 'Turning Page', artist: 'Sleeping at Last', tags: ['balada'] },
    ],
    Salida: [
      {
        title: 'Signed, Sealed, Delivered (Iâ€™m Yours)',
        artist: 'Stevie Wonder',
        tags: ['fiesta', 'soul'],
      },
      { title: 'You Make My Dream', artist: 'Hall & Oates', tags: ['alegre'] },
      { title: 'Best Day of My Life', artist: 'American Authors', tags: ['moderna'] },
    ],
  },
  coctail: {
    'Chill/Jazz': [
      { title: 'Fly Me To The Moon', artist: 'Frank Sinatra', tags: ['jazz'] },
      { title: 'L-O-V-E', artist: 'Nat King Cole', tags: ['jazz', t('common.clasico')] },
      { title: 'Sway', artist: t('common.michael_buble'), tags: ['latin jazz'] },
    ],
    {t('common.acusticoindie')}: [
      { title: 'Put Your Records On', artist: 'Corinne Bailey Rae', tags: ['soul'] },
      { title: 'Budapest', artist: 'George Ezra', tags: ['indie'] },
      { title: 'Better Together', artist: 'Jack Johnson', tags: [t('common.acustico')] },
    ],
    'Versiones modernas': [
      {
        title: 'Canâ€™t Help Falling in Love',
        artist: 'Kina Grannis (cover)',
        tags: ['cover', 'suave'],
      },
      { title: 'Stand by Me', artist: 'Boyce Avenue (cover)', tags: ['cover', t('common.acustico')] },
    ],
  },
  banquete: {
    {t('common.entrada_salon')}: [
      { title: 'Marry You', artist: 'Bruno Mars', tags: [t('common.celebracion')] },
      { title: 'I Gotta Feeling', artist: 'Black Eyed Peas', tags: ['fiesta'] },
      { title: 'Crazy in Love', artist: t('common.beyonce'), tags: [t('common.energia')] },
    ],
    'Corte de tarta': [
      { title: 'Sugar', artist: 'Maroon 5', tags: ['pop'] },
      { title: 'Love on Top', artist: t('common.beyonce'), tags: ['feliz'] },
      { title: 'How Sweet It Is', artist: 'James Taylor', tags: [t('common.clasico')] },
    ],
    'Lanzamiento de ramo': [
      { title: 'Single Ladies', artist: t('common.beyonce'), tags: [t('common.iconica')] },
      { title: 'Girls Just Want to Have Fun', artist: 'Cyndi Lauper', tags: ['80s'] },
    ],
  },
  disco: {
    'Primer baile': [
      { title: 'Thinking Out Loud', artist: 'Ed Sheeran', tags: ['balada'] },
      { title: 'Canâ€™t Help Falling in Love', artist: 'Elvis Presley', tags: [t('common.clasico')] },
      { title: 'Make You Feel My Love', artist: 'Adele', tags: ['emocional'] },
    ],
    'Abrir pista': [
      { title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', tags: ['funk', 'hit'] },
      { title: 'Danza Kuduro', artist: 'Don Omar', tags: ['latino'] },
      { title: 'Dance Monkey', artist: 'Tones and I', tags: ['pop'] },
    ],
    {t('common.clasicos_infalibles')}: [
      { title: 'September', artist: 'Earth, Wind & Fire', tags: ['disco'] },
      { title: 'Crazy Little Thing Called Love', artist: 'Queen', tags: ['rock & roll'] },
      { title: 'Donâ€™t Stop Me Now', artist: 'Queen', tags: ['rock', t('common.energia')] },
    ],
  },
};


