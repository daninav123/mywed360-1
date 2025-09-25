# Flujo 17: Sistema de Gamificación y Progreso

## Descripción General
Sistema de gamificación integrado que convierte la planificación de bodas en una experiencia motivadora mediante puntos, logros, barras de progreso y objetivos claros. Mejora la barra de progreso actual de la pantalla de inicio con mecánicas de juego.

## Objetivos
- Motivar a los usuarios a completar tareas de planificación
- Proporcionar sensación de logro y progreso visual
- Reducir la procrastinación en tareas importantes
- Crear engagement y retención de usuarios
- Definir objetivos claros y alcanzables

---

## Flujo de Usuario

### 1. Sistema de Puntos y Experiencia

#### **1.1 Obtención de Puntos**
**Ubicación**: Todas las acciones dentro de la aplicación

##### Acciones que Otorgan Puntos:
```javascript
const POINT_SYSTEM = {
  // Tareas básicas
  'complete_task': 10,
  'add_guest': 5,
  'update_budget': 15,
  'assign_seat': 8,
  
  // Hitos importantes
  'book_venue': 100,
  'send_invitations': 75,
  'finalize_menu': 50,
  'complete_seating_plan': 80,
  
  // Acciones premium
  'contact_provider': 20,
  'upload_photo': 5,
  'create_timeline': 60,
  'generate_website': 40,
  
  // Bonificaciones
  'early_completion': 25, // Completar antes de fecha límite
  'streak_bonus': 15,     // Completar tareas días consecutivos
  'perfect_week': 100     // Completar todas las tareas semanales
};
```

#### **1.2 Niveles de Usuario**
```javascript
const USER_LEVELS = [
  { level: 1, name:  – Novato – , minPoints: 0, maxPoints: 100 },
  { level: 2, name:  – Planificador – , minPoints: 101, maxPoints: 300 },
  { level: 3, name:  – Organizador – , minPoints: 301, maxPoints: 600 },
  { level: 4, name:  – Coordinador – , minPoints: 601, maxPoints: 1000 },
  { level: 5, name:  – Maestro de Bodas – , minPoints: 1001, maxPoints: 1500 },
  { level: 6, name:  – Experto Wedding – , minPoints: 1501, maxPoints: 2500 },
  { level: 7, name:  – Leyenda Nupcial – , minPoints: 2501, maxPoints: null }
];
```

### 2. Sistema de Logros (Achievements)

#### **2.1 Categorías de Logros**

##### **Logros de Progreso**
- 🎯 ** – Primer Paso – ** - Completar primera tarea
- 📅 ** – Planificador Nato – ** - Crear timeline completo
- 💰 ** – Contador Experto – ** - Mantener presupuesto actualizado por 30 días
- 👥 ** – Anfitrión Perfecto – ** - Añadir más de 100 invitados
- 🪑 ** – Maestro del Espacio – ** - Completar seating plan sin conflictos

##### **Logros de Velocidad**
- ⚡ ** – Rayo – ** - Completar 5 tareas en un día
- 🔥 ** – En Racha – ** - Completar tareas 7 días consecutivos
- 🚀 ** – Súper Productivo – ** - Completar 20 tareas en una semana
- ⏰ ** – Madrugador – ** - Completar tarea antes de las 8 AM

##### **Logros de Calidad**
- ⭐ ** – Perfeccionista – ** - Completar todas las tareas de una categoría
- 🎨 ** – Diseñador – ** - Personalizar completamente el sitio web
- 📧 ** – Comunicador – ** - Enviar más de 50 emails desde la plataforma
- 📊 ** – Analista – ** - Revisar métricas de presupuesto semanalmente

##### **Logros Especiales**
- 💎 ** – Diamante – ** - Completar boda con puntuación perfecta
- 🏆 ** – Campeón – ** - Estar en top 10% de usuarios del mes
- 🎉 ** – Celebrador – ** - Completar boda y recibir 5⭐ de satisfacción
- 🤝 ** – Colaborador – ** - Trabajar exitosamente con wedding planner

#### **2.2 Notificaciones de Logros**
```javascript
const showAchievementNotification = (achievement) => {
  return {
    type: 'achievement',
    title: `¡Logro Desbloqueado!`,
    message: `${achievement.emoji} ${achievement.name}`,
    description: achievement.description,
    points: achievement.points,
    duration: 5000,
    sound: 'achievement.mp3'
  };
};
```

### 3. Barra de Progreso Mejorada

#### **3.1 Progreso Global de Boda**
**Ubicación**: Dashboard principal (pantalla de inicio)

##### Componentes del Progreso:
```javascript
const WEDDING_PROGRESS_CATEGORIES = {
  'planning': {
    name: 'Planificación',
    weight: 25,
    tasks: ['venue', 'date', 'budget', 'timeline'],
    color: '#3B82F6'
  },
  'guests': {
    name: 'Invitados',
    weight: 20,
    tasks: ['guest_list', 'invitations', 'rsvp', 'seating'],
    color: '#10B981'
  },
  'vendors': {
    name: 'Proveedores',
    weight: 25,
    tasks: ['catering', 'photography', 'music', 'flowers'],
    color: '#F59E0B'
  },
  'details': {
    name: 'Detalles',
    weight: 20,
    tasks: ['decorations', 'favors', 'transportation', 'accommodation'],
    color: '#EF4444'
  },
  'final': {
    name: 'Toques Finales',
    weight: 10,
    tasks: ['rehearsal', 'final_confirmations', 'emergency_kit'],
    color: '#8B5CF6'
  }
};
```

#### **3.2 Visualización Mejorada**
```jsx
const EnhancedProgressBar = () => {
  return (
    <div className= – bg-white rounded-xl shadow-lg p-6 – >
      {/* Header con nivel y puntos */}
      <div className= – flex justify-between items-center mb-4 – >
        <div className= – flex items-center space-x-3 – >
          <div className= – w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold – >
            {userLevel}
          </div>
          <div>
            <h3 className= – font-semibold text-lg – >{levelName}</h3>
            <p className= – text-sm text-gray-600 – >{currentPoints} / {nextLevelPoints} puntos</p>
          </div>
        </div>
        <div className= – text-right – >
          <div className= – text-2xl font-bold text-green-600 – >{overallProgress}%</div>
          <div className= – text-sm text-gray-500 – >Completado</div>
        </div>
      </div>

      {/* Barra de progreso principal */}
      <div className= – mb-6 – >
        <div className= – w-full bg-gray-200 rounded-full h-4 mb-2 – >
          <div 
            className= – bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500 – 
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className= – flex justify-between text-xs text-gray-500 – >
          <span>Inicio</span>
          <span>¡Boda Perfecta!</span>
        </div>
      </div>

      {/* Progreso por categorías */}
      <div className= – grid grid-cols-2 md:grid-cols-5 gap-4 – >
        {categories.map(category => (
          <div key={category.id} className= – text-center – >
            <div className= – relative w-16 h-16 mx-auto mb-2 – >
              <svg className= – w-16 h-16 transform -rotate-90 – >
                <circle
                  cx= – 32 –  cy= – 32 –  r= – 28 – 
                  stroke= – currentColor – 
                  strokeWidth= – 4 – 
                  fill= – transparent – 
                  className= – text-gray-200 – 
                />
                <circle
                  cx= – 32 –  cy= – 32 –  r= – 28 – 
                  stroke={category.color}
                  strokeWidth= – 4 – 
                  fill= – transparent – 
                  strokeDasharray={`${category.progress * 1.76} 176`}
                  className= – transition-all duration-500 – 
                />
              </svg>
              <div className= – absolute inset-0 flex items-center justify-center – >
                <span className= – text-sm font-semibold – >{category.progress}%</span>
              </div>
            </div>
            <p className= – text-xs font-medium – >{category.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 4. Sistema de Objetivos y Metas

#### **4.1 Objetivos Semanales**
```javascript
const WEEKLY_OBJECTIVES = {
  week_1: [
    { task:  – Definir fecha de boda – , points: 50, priority:  – high –  },
    { task:  – Crear presupuesto inicial – , points: 40, priority:  – high –  },
    { task:  – Hacer lista de invitados – , points: 30, priority:  – medium –  }
  ],
  week_2: [
    { task:  – Buscar 3 venues – , points: 60, priority:  – high –  },
    { task:  – Contactar fotógrafo – , points: 45, priority:  – medium –  },
    { task:  – Definir estilo de boda – , points: 25, priority:  – low –  }
  ]
  // ... más semanas
};
```

#### **4.2 Desafíos Especiales**
```javascript
const SPECIAL_CHALLENGES = {
   – productivity_week – : {
    name:  – Semana Productiva – ,
    description:  – Completa 15 tareas esta semana – ,
    reward: 200,
    duration: 7, // días
    type:  – limited_time – 
  },
   – budget_master – : {
    name:  – Maestro del Presupuesto – ,
    description:  – Mantén el presupuesto actualizado por 30 días – ,
    reward: 300,
    duration: 30,
    type:  – consistency – 
  },
   – social_butterfly – : {
    name:  – Mariposa Social – ,
    description:  – Añade 50 invitados en 3 días – ,
    reward: 150,
    duration: 3,
    type:  – sprint – 
  }
};
```

### 5. Recompensas y Beneficios

#### **5.1 Recompensas Virtuales**
- **Badges personalizados** para perfil
- **Títulos especiales** mostrados en la interfaz
- **Temas exclusivos** para la aplicación
- **Avatares únicos** desbloqueables

#### **5.2 Recompensas Prácticas**
- **Plantillas premium** gratis por logros
- **Consultas extra** con wedding planners
- **Descuentos** en proveedores asociados
- **Acceso anticipado** a nuevas funcionalidades

#### **5.3 Sistema de Canje**
```javascript
const REWARD_STORE = {
   – premium_template – : { cost: 500, type:  – template –  },
   – planner_consultation – : { cost: 1000, type:  – service –  },
   – provider_discount – : { cost: 750, type:  – discount –  },
   – custom_theme – : { cost: 300, type:  – cosmetic –  },
   – priority_support – : { cost: 1200, type:  – service –  }
};
```

---

## Especificación Técnica

### **Estructura de Datos**

#### **Perfil de Gamificación**
```javascript
{
  userId:  – user_123 – ,
  weddingId:  – wedding_456 – ,
  gamification: {
    totalPoints: 1250,
    level: 4,
    levelName:  – Coordinador – ,
    achievements: [
      {
        id:  – first_step – ,
        unlockedAt:  – 2024-08-26T10:00:00Z – ,
        points: 25
      }
    ],
    streaks: {
      current: 5,
      longest: 12,
      lastActivity:  – 2024-08-26 – 
    },
    weeklyObjectives: {
      week: 34,
      completed: 2,
      total: 5,
      points: 135
    },
    categoryProgress: {
      planning: 85,
      guests: 60,
      vendors: 40,
      details: 20,
      final: 0
    }
  }
}
```

#### **Sistema de Eventos**
```javascript
const trackGamificationEvent = async (eventType, data) => {
  await addDoc(collection(db, 'gamification_events'), {
    userId: user.uid,
    weddingId: activeWedding.id,
    eventType: eventType,
    points: data.points,
    category: data.category,
    timestamp: serverTimestamp(),
    metadata: data.metadata
  });
};
```

### **Componentes Principales**

#### **GamificationProvider.jsx**
```javascript
export const GamificationProvider = ({ children }) => {
  const [userStats, setUserStats] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  
  const awardPoints = async (eventType, metadata = {}) => {
    const points = POINT_SYSTEM[eventType] || 0;
    
    // Actualizar puntos del usuario
    await updateUserPoints(user.uid, points);
    
    // Verificar logros desbloqueados
    const newAchievements = await checkAchievements(user.uid, eventType);
    
    // Mostrar notificaciones
    if (newAchievements.length > 0) {
      showAchievementNotifications(newAchievements);
    }
    
    return points;
  };
  
  return (
    <GamificationContext.Provider value={{
      userStats,
      awardPoints,
      recentAchievements
    }}>
      {children}
    </GamificationContext.Provider>
  );
};
```

#### **ProgressDashboard.jsx**
```javascript
const ProgressDashboard = () => {
  const { userStats } = useGamification();
  const { activeWedding } = useWedding();
  
  const overallProgress = calculateOverallProgress(activeWedding);
  const categoryProgress = calculateCategoryProgress(activeWedding);
  
  return (
    <div className= – space-y-6 – >
      <UserLevelCard stats={userStats} />
      <OverallProgressBar progress={overallProgress} />
      <CategoryProgress categories={categoryProgress} />
      <WeeklyObjectives />
      <RecentAchievements />
    </div>
  );
};
```

---

## Integración con Módulos Existentes

### **Con Sistema de Tareas**
```javascript
// En TaskList.jsx
const completeTask = async (taskId) => {
  await updateTask(taskId, { completed: true });
  
  // Otorgar puntos por completar tarea
  await awardPoints('complete_task', {
    taskId: taskId,
    category: task.category,
    difficulty: task.difficulty
  });
};
```

### **Con Sistema de Invitados**
```javascript
// En GuestManagement.jsx
const addGuest = async (guestData) => {
  await createGuest(guestData);
  
  // Otorgar puntos por añadir invitado
  await awardPoints('add_guest');
  
  // Verificar logro de cantidad de invitados
  const totalGuests = await getTotalGuests();
  if (totalGuests >= 100) {
    await unlockAchievement('perfect_host');
  }
};
```

### **Con Sistema de Presupuesto**
```javascript
// En Budget.jsx
const updateBudgetItem = async (itemId, data) => {
  await updateBudget(itemId, data);
  
  // Otorgar puntos por mantener presupuesto actualizado
  await awardPoints('update_budget');
  
  // Verificar racha de actualizaciones
  await checkBudgetStreak();
};
```

---

## Métricas y Analytics

### **Métricas de Engagement**
- Tiempo promedio en la aplicación
- Frecuencia de uso diaria/semanal
- Tareas completadas por sesión
- Tasa de retención por nivel de usuario

### **Métricas de Progreso**
- Velocidad de completado de bodas
- Categorías más/menos completadas
- Correlación entre puntos y satisfacción final
- Efectividad de diferentes tipos de recompensas

### **A/B Testing**
- Diferentes sistemas de puntos
- Variaciones en notificaciones de logros
- Tipos de recompensas más efectivas
- Frecuencia óptima de desafíos

---

## Implementación por Fases

### **Fase 1: Sistema Básico (2 semanas)**
- Sistema de puntos fundamental
- Barra de progreso mejorada
- Logros básicos
- Integración con tareas principales

### **Fase 2: Gamificación Avanzada (2 semanas)**
- Sistema de niveles completo
- Objetivos semanales
- Desafíos especiales
- Notificaciones de logros

### **Fase 3: Recompensas y Social (1 semana)**
- Tienda de recompensas
- Comparación social (opcional)
- Estadísticas detalladas
- Personalización de experiencia

### **Fase 4: Optimización (1 semana)**
- Analytics y métricas
- A/B testing
- Ajustes basados en feedback
- Documentación final

Este sistema transforma la experiencia de planificación de bodas en un juego motivador que mantiene a los usuarios comprometidos y les proporciona una sensación clara de progreso y logro.
## Estado de Implementación

### Completado
- Documento base del flujo de gamificación

### En Desarrollo
- Definición de métricas, niveles y recompensas

### Pendiente
- Implementación de UI/Backend y validación con usuarios
