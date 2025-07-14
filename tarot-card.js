// Tarot Card - Standalone JavaScript
// Можно вставить в любой HTML проект

function createTarotCard(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  // Данные карты
  const cardData = {
    title: 'THE STAR',
    subtitle: 'XVII',
    message: 'Hope • Inspiration • Spiritual Guidance',
    description: 'Карта надежды и духовного озарения'
  };

  // CSS стили
  const styles = `
    <style>
      @keyframes twinkle {
        0% { 
          opacity: 0.7; 
          transform: scale(1); 
          filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
        }
        50% { 
          opacity: 1; 
          transform: scale(1.05); 
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));
        }
        100% { 
          opacity: 0.8; 
          transform: scale(1.02); 
          filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6));
        }
      }
      
      @keyframes sparkle {
        0% { 
          opacity: 0.3; 
          transform: scale(0.8); 
          filter: drop-shadow(0 0 5px rgba(199, 210, 254, 0.4));
        }
        50% { 
          opacity: 1; 
          transform: scale(1.2); 
          filter: drop-shadow(0 0 10px rgba(199, 210, 254, 0.8));
        }
        100% { 
          opacity: 0.5; 
          transform: scale(0.9); 
          filter: drop-shadow(0 0 7px rgba(199, 210, 254, 0.6));
        }
      }
      
      @keyframes glow {
        0% { 
          opacity: 0.6; 
          transform: scale(1);
          filter: drop-shadow(0 0 5px currentColor);
        }
        50% { 
          opacity: 1; 
          transform: scale(1.1);
          filter: drop-shadow(0 0 15px currentColor);
        }
        100% { 
          opacity: 0.7; 
          transform: scale(1.05);
          filter: drop-shadow(0 0 10px currentColor);
        }
      }
      
      @keyframes cardGlow {
        0% { 
          box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.3), 0 0 30px rgba(255, 215, 0, 0.2);
          border-color: #ffd700;
        }
        50% { 
          box-shadow: inset 0 0 30px rgba(255, 215, 0, 0.5), 0 0 50px rgba(255, 215, 0, 0.4);
          border-color: #ffed4a;
        }
        100% { 
          box-shadow: inset 0 0 25px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.3);
          border-color: #fbbf24;
        }
      }
      
      @keyframes backgroundShimmer {
        0% { 
          opacity: 0.3;
          background: radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
        }
        25% { 
          opacity: 0.6;
          background: radial-gradient(circle at 70% 40%, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
        }
        50% { 
          opacity: 0.8;
          background: radial-gradient(circle at 50% 70%, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
        }
        75% { 
          opacity: 0.4;
          background: radial-gradient(circle at 20% 60%, rgba(255, 215, 0, 0.12) 0%, transparent 70%);
        }
        100% { 
          opacity: 0.5;
          background: radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
        }
      }
      
      .tarot-container {
        background: #0f172a;
        min-height: 100vh;
        padding: 40px 20px;
        font-family: Arial, sans-serif;
      }
      
      .tarot-header {
        text-align: center;
        margin-bottom: 60px;
      }
      
      .tarot-title {
        font-size: 36px;
        font-weight: 700;
        color: #fff;
        margin-bottom: 12px;
        text-shadow: 0 0 20px rgba(255,255,255,0.5);
        animation: glow 3s ease-in-out infinite alternate;
        margin: 0;
      }
      
      .tarot-subtitle {
        font-size: 18px;
        color: #64748b;
        margin: 0;
        animation: glow 4.5s ease-in-out infinite alternate;
        animation-delay: 0.7s;
      }
      
      .tarot-card-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        perspective: 1000px;
        min-height: 500px;
      }
      
      .tarot-card {
        width: 350px;
        height: 600px;
        position: relative;
        cursor: pointer;
        transform-style: preserve-3d;
        transition: all 0.1s ease-out;
        transform: rotateY(0deg) rotateX(0deg) scale(1);
        filter: drop-shadow(0 20px 40px rgba(0,0,0,0.5));
      }
      
      .tarot-card-front {
        position: absolute;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
        border-radius: 12px;
        border: 3px solid #ffd700;
        box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.3), 0 0 30px rgba(255, 215, 0, 0.2);
        animation: cardGlow 4s ease-in-out infinite alternate;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 25px;
        backface-visibility: hidden;
        position: relative;
        overflow: hidden;
      }
      
      .mystical-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
        opacity: 0.5;
        animation: backgroundShimmer 5s ease-in-out infinite alternate;
      }
      
      .card-number {
        text-align: center;
        margin-bottom: 20px;
      }
      
      .card-number-text {
        font-size: 28px;
        font-weight: 700;
        color: #ffd700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        font-family: serif;
        letter-spacing: 2px;
        animation: glow 3s ease-in-out infinite alternate;
        animation-delay: 0.5s;
        margin: 0;
      }
      
      .card-title-text {
        font-size: 20px;
        font-weight: 600;
        color: #e0e7ff;
        text-shadow: 0 0 8px rgba(224, 231, 255, 0.5);
        font-family: serif;
        letter-spacing: 1px;
        margin-top: 5px;
        animation: glow 3.5s ease-in-out infinite alternate;
        animation-delay: 0.8s;
        margin-bottom: 0;
      }
      
      .central-illustration {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        position: relative;
      }
      
      .main-star-container {
        position: relative;
        margin-bottom: 20px;
      }
      
      .main-star {
        font-size: 120px;
        color: #ffd700;
        text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
        position: relative;
        z-index: 2;
        filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
        animation: twinkle 2s ease-in-out infinite alternate;
      }
      
      .small-star {
        position: absolute;
        color: #c7d2fe;
        text-shadow: 0 0 10px rgba(199, 210, 254, 0.6);
        z-index: 1;
        animation: sparkle 1.5s ease-in-out infinite alternate;
      }
      
      .small-star-1 {
        top: -20px;
        left: -30px;
        font-size: 30px;
        animation-delay: 0.2s;
        animation-duration: 1.5s;
      }
      
      .small-star-2 {
        top: -15px;
        right: -25px;
        font-size: 25px;
        animation-delay: 0.5s;
        animation-duration: 1.8s;
      }
      
      .small-star-3 {
        bottom: -20px;
        left: -20px;
        font-size: 20px;
        animation-delay: 0.8s;
        animation-duration: 2.2s;
      }
      
      .small-star-4 {
        bottom: -15px;
        right: -30px;
        font-size: 35px;
        animation-delay: 1.1s;
        animation-duration: 1.3s;
      }
      
      .mystical-symbols {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      .mystical-symbol {
        font-size: 24px;
        text-shadow: 0 0 8px currentColor;
      }
      
      .moon-symbol {
        color: #8b5cf6;
        animation: glow 2.5s ease-in-out infinite alternate;
        animation-delay: 0.3s;
      }
      
      .crystal-symbol {
        color: #06b6d4;
        animation: glow 2.8s ease-in-out infinite alternate;
        animation-delay: 0.7s;
      }
      
      .sun-symbol {
        color: #f59e0b;
        animation: glow 2.3s ease-in-out infinite alternate;
        animation-delay: 1s;
      }
      
      .card-message {
        text-align: center;
        margin-top: 20px;
      }
      
      .card-message-text {
        font-size: 14px;
        font-weight: 600;
        color: #e0e7ff;
        line-height: 1.4;
        margin-bottom: 10px;
        text-shadow: 0 0 5px rgba(224, 231, 255, 0.3);
        font-family: serif;
        letter-spacing: 0.5px;
        animation: glow 4s ease-in-out infinite alternate;
        animation-delay: 1.5s;
        margin-top: 0;
      }
      
      .corner-star {
        position: absolute;
        font-size: 20px;
        color: #ffd700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
        animation: sparkle 1.8s ease-in-out infinite alternate;
      }
      
      .corner-star-1 {
        top: 15px;
        left: 15px;
        animation-delay: 0.4s;
      }
      
      .corner-star-2 {
        top: 15px;
        right: 15px;
        animation-delay: 0.9s;
        animation-duration: 2.1s;
      }
      
      .corner-star-3 {
        bottom: 15px;
        left: 15px;
        animation-delay: 1.2s;
        animation-duration: 1.6s;
      }
      
      .corner-star-4 {
        bottom: 15px;
        right: 15px;
        animation-delay: 0.1s;
        animation-duration: 2.4s;
      }
      
      .card-info-overlay {
        position: absolute;
        bottom: -120px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(30, 27, 75, 0.95);
        backdrop-filter: blur(15px);
        border-radius: 12px;
        padding: 20px 28px;
        border: 2px solid rgba(255, 215, 0, 0.3);
        min-width: 320px;
        text-align: center;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
      }
      
      .card-info-title {
        font-size: 22px;
        font-weight: 700;
        color: #ffd700;
        margin-bottom: 8px;
        text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
        font-family: serif;
        letter-spacing: 1px;
        animation: glow 2s ease-in-out infinite alternate;
        animation-delay: 0.2s;
        margin-top: 0;
      }
      
      .card-info-description {
        font-size: 16px;
        color: #e0e7ff;
        font-style: italic;
        margin-bottom: 8px;
        text-shadow: 0 0 5px rgba(224, 231, 255, 0.3);
        animation: glow 2.5s ease-in-out infinite alternate;
        animation-delay: 0.4s;
        margin-top: 0;
      }
      
      .card-info-footer {
        font-size: 12px;
        color: #c7d2fe;
        opacity: 0.8;
        animation: sparkle 1.5s ease-in-out infinite alternate;
        animation-delay: 0.6s;
        margin: 0;
      }
      
      .action-buttons {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 150px;
      }
      
      .tarot-button {
        padding: 16px 32px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: serif;
        border: 2px solid;
      }
      
      .button-shuffle {
        background: linear-gradient(135deg, #1e1b4b, #312e81);
        color: #ffd700;
        border-color: #ffd700;
        box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
        text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
        animation: glow 3.5s ease-in-out infinite alternate;
        animation-delay: 0.5s;
      }
      
      .button-divination {
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        color: #fff;
        border-color: #8b5cf6;
        box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        animation: glow 4s ease-in-out infinite alternate;
        animation-delay: 1s;
      }
    </style>
  `;

  // HTML структура
  const html = `
    ${styles}
    <div class="tarot-container">
      <!-- Header -->
      <div class="tarot-header">
        <h1 class="tarot-title">🔮 TAROT CARD 🔮</h1>
        <p class="tarot-subtitle">Наведи курсор на карту - она будет следовать за мышью</p>
      </div>

      <!-- Tarot Card -->
      <div class="tarot-card-wrapper">
        <div class="tarot-card" id="tarotCard">
          <!-- Card Front -->
          <div class="tarot-card-front">
            <!-- Mystical Background Pattern -->
            <div class="mystical-background"></div>

            <!-- Card Number -->
            <div class="card-number">
              <div class="card-number-text">${cardData.subtitle}</div>
              <div class="card-title-text">${cardData.title}</div>
            </div>

            <!-- Central Illustration -->
            <div class="central-illustration">
              <!-- Main Star -->
              <div class="main-star-container">
                <div class="main-star">⭐</div>
                
                <!-- Smaller surrounding stars -->
                <div class="small-star small-star-1">✦</div>
                <div class="small-star small-star-2">✦</div>
                <div class="small-star small-star-3">✦</div>
                <div class="small-star small-star-4">✦</div>
              </div>

              <!-- Mystical Symbols -->
              <div class="mystical-symbols">
                <div class="mystical-symbol moon-symbol">🌙</div>
                <div class="mystical-symbol crystal-symbol">🔮</div>
                <div class="mystical-symbol sun-symbol">☀️</div>
              </div>
            </div>

            <!-- Card Message -->
            <div class="card-message">
              <div class="card-message-text">${cardData.message}</div>
            </div>

            <!-- Decorative Corner Stars -->
            <div class="corner-star corner-star-1">✨</div>
            <div class="corner-star corner-star-2">✨</div>
            <div class="corner-star corner-star-3">✨</div>
            <div class="corner-star corner-star-4">✨</div>
          </div>

          <!-- Card Info Overlay -->
          <div class="card-info-overlay" id="cardInfoOverlay">
            <div class="card-info-title">${cardData.title} - ${cardData.subtitle}</div>
            <div class="card-info-description">${cardData.description}</div>
            <div class="card-info-footer">🔮 Древняя мудрость Таро 🔮</div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="tarot-button button-shuffle" onclick="shuffleCards()">
          🔮 Перетасовать колоду
        </button>
        <button class="tarot-button button-divination" onclick="startDivination()">
          ✨ Гадание на картах
        </button>
      </div>
    </div>
  `;

  // Вставляем HTML в контейнер
  container.innerHTML = html;

  // Добавляем интерактивность
  const tarotCard = document.getElementById('tarotCard');
  const infoOverlay = document.getElementById('cardInfoOverlay');

  // Функция для отслеживания мыши
  function handleMouseMove(e) {
    const rect = tarotCard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    tarotCard.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(1.05) translateZ(50px)`;
    tarotCard.style.filter = 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))';
    
    // Показываем информационную панель
    infoOverlay.style.opacity = '1';
    infoOverlay.style.transform = 'translateX(-50%) translateY(-10px)';
  }

  function handleMouseLeave() {
    tarotCard.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1) translateZ(0px)';
    tarotCard.style.filter = 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))';
    
    // Скрываем информационную панель
    infoOverlay.style.opacity = '0';
    infoOverlay.style.transform = 'translateX(-50%) translateY(0px)';
  }

  // Добавляем обработчики событий
  tarotCard.addEventListener('mousemove', handleMouseMove);
  tarotCard.addEventListener('mouseleave', handleMouseLeave);

  // Глобальные функции для кнопок
  window.shuffleCards = function() {
    window.location.reload();
  };

  window.startDivination = function() {
    alert('Раскрытие тайн грядущего... 🌟');
  };
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
  // Автоматически создаем карту в элементе с id="tarot-container" если он существует
  if (document.getElementById('tarot-container')) {
    createTarotCard('tarot-container');
  }
});

// Экспортируем функцию для ручного использования
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createTarotCard };
} 