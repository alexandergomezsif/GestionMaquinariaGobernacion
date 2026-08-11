/**
 * SISTEMA DE GESTIÓN DEL CONTRATO - GOBERNACIÓN DE ANTIOQUIA
 * Bus de Eventos Centralizado (Publish/Subscribe Event Bus Engine)
 */

window.AppEventBus = (function() {
  const topics = {};

  return {
    /**
     * Suscribe un listener a un evento específico.
     * @param {string} topic 
     * @param {Function} listener 
     * @returns {Function} Función para desuscribir
     */
    subscribe(topic, listener) {
      if (!topics[topic]) {
        topics[topic] = [];
      }
      topics[topic].push(listener);

      return function unsubscribe() {
        topics[topic] = topics[topic].filter(l => l !== listener);
      };
    },

    /**
     * Publica un evento enviando datos a todos sus suscriptores.
     * @param {string} topic 
     * @param {any} data 
     */
    publish(topic, data) {
      if (!topics[topic]) return;
      topics[topic].forEach(listener => {
        try {
          listener(data);
        } catch (err) {
          console.error(`Error procesando evento "${topic}":`, err);
        }
      });
    }
  };
})();
