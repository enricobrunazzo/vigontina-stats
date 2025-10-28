// utils/dateUtils.js

/**
 * Restituisce la data di oggi in formato ISO (YYYY-MM-DD),
 * compatibile con l'input type="date".
 * @returns {string} La data di oggi
 */
export const getTodayISO = () => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Formatta una data in una stringa nel formato DD-MM-YYYY.
 * @param {string | Date} dateInput - La data da formattare.
 * @returns {string} La data formattata.
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return "";
  try {
    const date = new Date(dateInput);
    
    // Estrae giorno, mese e anno. Aggiunge il padding se necessario.
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // i mesi partono da 0
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Errore nella formattazione della data:", error);
    return "Data non valida";
  }
};